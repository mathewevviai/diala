import os
import asyncio
import logging
import aiohttp
import groq
from convex import ConvexClient

from .enrichors import domain_enrich, contact_enrich
from .dedup import dedupe_exact, fuzzy_dedupe
from .scoring import compute_score
from .save_batcher import SaveBatcher
from ..core.leadgen.jina_client import JinaClient

BACKEND_API = os.getenv("BACKEND_API")
CONVEX_URL = os.getenv("NEXT_PUBLIC_CONVEX_URL", "http://127.0.0.1:3210")
convex_client = ConvexClient(CONVEX_URL)

async def _send_convex_update(search_id: str, payload: dict, session: aiohttp.ClientSession):
    """Send updates to Convex via Convex client (3210)."""
    try:
        event_type = payload.get("type")
        if event_type == "progress":
            key = os.getenv("API_KEY")
            convex_client.action(
                "hunterActions:updateSearchProgress",
                {
                    "searchId": search_id,
                    "progress": max(15, min(95, payload.get("progress", 50))),
                    "currentStage": "Discovering and validating leads...",
                    **({"authKey": key} if key else {}),
                },
            )
        elif event_type == "complete":
            count = int(payload.get("count", 0))
            key = os.getenv("API_KEY")
            convex_client.action(
                "hunterActions:updateSearchProgress",
                {
                    "searchId": search_id,
                    "progress": 100,
                    "currentStage": "Completed",
                    "status": "completed",
                    "results": {
                        "totalLeads": count,
                        "verifiedEmails": 0,
                        "verifiedPhones": 0,
                        "businessWebsites": count,
                        "avgResponseRate": "N/A",
                        "searchTime": "N/A",
                    },
                    **({"authKey": key} if key else {}),
                },
            )
    except Exception:
        logging.exception("convex update failed")

def _passes_front_filters(query: str, cfg: dict) -> bool:
    """Simple front-load filters: blocklist / minimum domain check / region filter."""
    blocklist = set(cfg.get("blocklist_domains", []))
    # quick heuristic: if query contains blocked domain, skip
    for d in blocklist:
        if d in query:
            return False
    # more rules can be added here (size, industry, geo)
    return True

def _extract_domains(queries: list) -> list:
    # naive domain extractor; if you have a canonical list, pass it in config
    domains = set()
    for q in queries:
        # if q looks like a domain include it
        if "." in q and " " not in q:
            domains.add(q.strip().lower())
    return list(domains)

async def _parallel_discover(query: str, domains_info: list, session: aiohttp.ClientSession) -> list:
    """
    Run discovery across multiple sources in parallel (primary + fallbacks).
    Each discovery function should return list[dict(candidate)].
    """
    tasks = []
    # primary (if you have internal endpoints): BACKEND_API/groq, BACKEND_API/jina, etc.
    if BACKEND_API:
        tasks.append(session.post(f"{BACKEND_API}/api/public/hunter/discover/groq", json={"q": query}, timeout=12))
        tasks.append(session.post(f"{BACKEND_API}/api/public/hunter/discover/jina", json={"q": query}, timeout=12))
        tasks.append(session.post(f"{BACKEND_API}/api/public/hunter/discover/thirdparty", json={"q": query}, timeout=12))
    results = []
    if tasks:
        # gather and parse responses defensively
        responses = await asyncio.gather(*[t for t in tasks], return_exceptions=True)
        for resp in responses:
            try:
                if isinstance(resp, Exception):
                    continue
                async with resp:
                    if resp.status == 200:
                        data = await resp.json()
                        if isinstance(data, list):
                            results.extend(data)
            except Exception:
                continue
    # fallback: if no BACKEND_API or all failed, return empty
    return results

async def _save_to_backend(search_id: str, items: list, session: aiohttp.ClientSession):
    """Default saver: call BACKEND_API to persist leads; override by injecting save_fn."""
    if not BACKEND_API:
        # if you don't have BACKEND_API, write into your DB client here instead
        logging.info("No BACKEND_API; skipping save (implement save_fn to persist)")
        return
    try:
        async with session.post(
            f"{BACKEND_API}/api/public/hunter/ingest_batch",
            json={"search_id": search_id, "leads": items},
            timeout=30,
        ) as r:
            if r.status != 200:
                logging.error("ingest_batch failed with %s", r.status)
    except Exception:
        logging.exception("ingest_batch exception")

async def run_hunter_pipeline(search_id: str, config: dict, save_fn=None) -> list:
    """
    Main async pipeline. Returns final deduped leads.
    - front-load filters
    - domain-level enrichment (parallel)
    - discovery (parallel across services)
    - exact dedupe
    - parallel candidate enrichment with concurrency limiting
    - per-lead scoring
    - incremental saving via SaveBatcher
    - final fuzzy dedupe + final save
    """
    concurrency = config.get("concurrency", 24)
    batch_size = config.get("batch_size", 50)
    flush_interval = config.get("flush_interval", 5)
    dedup_threshold = config.get("dedup_threshold", 86)
    store_all_candidates = bool(config.get("store_all_candidates", True))

    if save_fn is None:
        # default: call backend ingestion endpoint
        async def _default_save(items):
            async with aiohttp.ClientSession() as s:
                await _save_to_backend(search_id, items, s)
        save_fn = _default_save

    sem = asyncio.Semaphore(concurrency)
    async with aiohttp.ClientSession() as session:
        batcher = SaveBatcher(save_fn, batch_size=batch_size, flush_interval=flush_interval)
        await batcher.start()

        # 1) front-load filters
        queries = config.get("queries", [])
        queries = [q for q in queries if _passes_front_filters(q, config)]
        if not queries:
            await _send_convex_update(search_id, {"type": "complete", "count": 0}, session)
            return []

        # 2) domain-level enrichment (parallel)
        domains = _extract_domains(queries)
        domain_tasks = [domain_enrich(d, session) for d in domains]
        domains_info = []
        if domain_tasks:
            domains_info = await asyncio.gather(*domain_tasks, return_exceptions=True)

        # 3) discovery: run per-query discovery services in parallel
        candidates = []
        discover_tasks = [ _parallel_discover(q, domains_info, session) for q in queries ]
        for res in await asyncio.gather(*discover_tasks, return_exceptions=True):
            if isinstance(res, Exception):
                continue
            candidates.extend(res or [])

        # 4) cheap exact dedupe
        candidates = dedupe_exact(candidates)

        # 5) parallel enrichment + scoring + incremental save
        async def _enrich_and_save(c):
            async with sem:
                try:
                    enr = await contact_enrich(c, session)
                except Exception:
                    enr = {"enrichment": {}, "email_valid": False}
                c["enrichment"] = enr.get("enrichment", {})
                c["email_valid"] = enr.get("email_valid", False)
                # Flatten extracted contact info to top-level for downstream ingestion
                extracted = c.get("enrichment", {}).get("extracted", {}) or {}
                if not c.get("email") and extracted.get("emails"):
                    c["email"] = extracted["emails"][0]
                if not c.get("phone") and extracted.get("phones"):
                    c["phone"] = extracted["phones"][0]
                # compute a match_score if discovery provided one, otherwise 50 fallback
                match_score = c.get("match_score", c.get("meta", {}).get("match_score", 50))
                c.setdefault("meta", {})["match_score"] = match_score
                # scoring
                c.setdefault("meta", {})["score"] = compute_score(c)
                # basic validation gate: require validated email OR any extracted contact OR decent score
                extracted = c.get("enrichment", {}).get("extracted", {})
                extracted_emails = extracted.get("emails") or []
                extracted_phones = extracted.get("phones") or []
                is_valid = bool(
                    c["email_valid"]
                    or extracted_emails
                    or extracted_phones
                    or c["meta"]["score"] >= 60
                )
                # Persist logic: save all when configured, or if valid/contacts present
                if store_all_candidates or is_valid or extracted_emails or extracted_phones:
                    # incremental save only for validated candidates
                    await batcher.add(c)
                else:
                    logging.debug(
                        "candidate filtered: no contact info and low score (score=%s, url=%s)",
                        c["meta"]["score"], c.get("url")
                    )
                # report progress to Convex if configured
                await _send_convex_update(search_id, {"type": "progress", "lead": {"id": c.get("id"), "score": c["meta"]["score"]}}, session)
        # spawn enrich tasks
        enrich_tasks = [ _enrich_and_save(c) for c in candidates ]
        await asyncio.gather(*enrich_tasks, return_exceptions=True)

        # 5.5) Optional Kimi (Groq) validation & scoring pass for top candidates
        JINA_API_KEY = os.getenv("JINA_API_KEY")
        GROQ_API_KEY = os.getenv("GROQ_API_KEY")
        OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")  # unused but kept for parity
        kimi_limit = int(config.get("kimi_validate_top", 40))
        if JINA_API_KEY and GROQ_API_KEY and kimi_limit > 0:
            try:
                # Prefer candidates with URL; sort by current meta score desc
                url_candidates = [c for c in candidates if c.get("url")]
                url_candidates.sort(key=lambda x: x.get("meta", {}).get("score", 0), reverse=True)
                top_subset = url_candidates[:kimi_limit]
                if top_subset:
                    await _send_convex_update(search_id, {"type": "progress", "progress": 70}, session)
                    # Read contents in batch
                    async with JinaClient(JINA_API_KEY, max_concurrent=5) as jc:
                        contents = await jc.read_urls([c["url"] for c in top_subset])
                    # Map by URL
                    url_to_content = {d.get("url"): d for d in contents if isinstance(d, dict)}

                    groq_client = groq.AsyncGroq(api_key=GROQ_API_KEY)

                    async def _kimi_validate_one(cand):
                        url = cand.get("url")
                        content_data = url_to_content.get(url) or {}
                        title = content_data.get("title", "")
                        content = (content_data.get("content") or "")[:8000]
                        prompt = f"""
You are validating a business lead from its website.

URL: {url}
Title: {title}
Content (first 8k chars):\n---\n{content}\n---

Return ONLY a JSON object with keys: 
{{
  "score": number (0-100),
  "emails": ["string"],
  "phones": ["string"]
}}
Scoring rubric: 40+ if appears to be a relevant business in target domain and provides clear contact channel. Higher if contact details are present.
"""
                        try:
                            resp = await groq_client.chat.completions.create(
                                messages=[{"role": "user", "content": prompt}],
                                model="moonshotai/kimi-k2-instruct",
                                temperature=0.0,
                                response_format={"type": "json_object"},
                            )
                            data = resp.choices[0].message.content
                            import json as _json
                            parsed = _json.loads(data)
                            kimi_score = float(parsed.get("score", 0) or 0)
                            emails = parsed.get("emails") or []
                            phones = parsed.get("phones") or []

                            # Merge into candidate
                            cand.setdefault("meta", {})["kimi_score"] = kimi_score
                            # Boost overall score
                            current = cand["meta"].get("score", 0)
                            cand["meta"]["score"] = max(current, int(round(kimi_score)))
                            # Merge contacts
                            if emails and not cand.get("email"):
                                cand["email"] = emails[0]
                                cand["email_valid"] = True
                            if phones and not cand.get("phone"):
                                cand["phone"] = phones[0]
                            ext = cand.setdefault("enrichment", {}).setdefault("extracted", {})
                            if emails:
                                ext["emails"] = list({*(ext.get("emails") or []), *emails})[:5]
                            if phones:
                                ext["phones"] = list({*(ext.get("phones") or []), *phones})[:5]

                            # Re-evaluate validity and persist if now valid
                            is_valid = bool(cand.get("email_valid") or (ext.get("emails") or []) or (ext.get("phones") or []) or cand["meta"]["score"] >= 60)
                            if is_valid:
                                await batcher.add(cand)
                        except Exception:
                            # Non-fatal
                            logging.exception("Kimi validation failed for %s", url)

                    await asyncio.gather(*[_kimi_validate_one(c) for c in top_subset])
            except Exception:
                logging.exception("Kimi validation pass failed")

        # 6) drain pending batcher items into memory for final dedupe
        # (note: batcher already flushed many items; we re-query persistence in prod or retrieve the last batch)
        pending = await batcher.drain()
        # final_set = union of already persisted items and pending; here we use pending + candidates for final dedupe
        final_candidates = (pending or []) + candidates
        final = fuzzy_dedupe(final_candidates, name_key="name", threshold=dedup_threshold)

        # 7) final persist (best-effort) and completion update
        await save_fn(final)
        await _send_convex_update(search_id, {"type": "complete", "count": len(final)}, session)
        return final