import os
import re
import asyncio
import aiohttp
import json

EMAIL_VALIDATION_API = os.getenv("EMAIL_VALIDATION_API")  # optional external validator
BACKEND_API = os.getenv("BACKEND_API")  # existing backend endpoints for enrichment
USE_INTERNAL_ENRICH = os.getenv("USE_INTERNAL_ENRICH", "false").lower() == "true"
JINA_API_KEY = os.getenv("JINA_API_KEY")  # for content reading fallback

_EMAIL_RE = re.compile(r"[^@]+@[^@]+\.[^@]+")

async def validate_email(email: str, session: aiohttp.ClientSession) -> bool:
    """Lightweight email validation + optional external API call fallback."""
    if not email or not _EMAIL_RE.match(email):
        return False
    if EMAIL_VALIDATION_API:
        try:
            async with session.get(f"{EMAIL_VALIDATION_API}?email={email}", timeout=8) as r:
                data = await r.json()
                return bool(data.get("valid"))
        except Exception:
            # fallback to soft-true to avoid dropping leads on validator outage
            return True
    return True

async def domain_enrich(domain: str, session: aiohttp.ClientSession) -> dict:
    """Fetch firmographic / technographic data for a domain using existing backend (if available)."""
    out = {"domain": domain, "firmographic": {}, "technographic": {}, "decision_makers": []}
    if not BACKEND_API:
        return out
    try:
        async with session.get(f"{BACKEND_API}/api/domain/enrich?domain={domain}", timeout=12) as r:
            if r.status == 200:
                payload = await r.json()
                out.update(payload)
    except Exception:
        # tolerant failure: return partial out
        pass
    return out

async def contact_enrich(candidate: dict, session: aiohttp.ClientSession) -> dict:
    """
    Enrich a single candidate: validate email, call an enrichment endpoint (if present).
    Returns a structure with 'enrichment', 'email_valid' and optional raw data.
    """
    out = {"enrichment": {}, "email_valid": False}
    email = candidate.get("email")
    out["email_valid"] = await validate_email(email, session)
    # Try backend enrichment first ONLY if explicitly enabled
    if BACKEND_API and USE_INTERNAL_ENRICH:
        try:
            async with session.post(f"{BACKEND_API}/api/enrich/contact", json=candidate, timeout=12) as r:
                if r.status == 200:
                    out["enrichment"] = await r.json()
                    return out
        except Exception:
            pass

    # Fallback: read website content via Jina Reader to extract contacts if we have API key and URL
    url = candidate.get("url") or candidate.get("website")
    if JINA_API_KEY and url:
        try:
            headers = {
                "Accept": "application/json",
                "Authorization": f"Bearer {JINA_API_KEY}",
                "X-Return-Format": "json",
                "X-With-Content": "true",
                "X-With-Links": "true",
                # Give SPAs some time to render main content
                "x-timeout": "10",
            }
            # Use POST form for hash-based routes so the fragment is transmitted
            if "#" in url:
                async with session.post("https://r.jina.ai/", data={"url": url}, headers=headers, timeout=20) as resp:
                    if resp.status == 200:
                        try:
                            data = await resp.json()
                        except Exception:
                            text = await resp.text()
                            data = {"content": text}
                    else:
                        data = {}
            else:
                reader_url = f"https://r.jina.ai/{url}"
                async with session.get(reader_url, headers=headers, timeout=20) as resp:
                    if resp.status == 200:
                        try:
                            data = await resp.json()
                        except Exception:
                            text = await resp.text()
                            data = {"content": text}
                    else:
                        data = {}
            content = data.get("content", "")
            links = data.get("links", []) or []
            # Extract emails and phones with simple regexes
            email_pattern = r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b"
            emails = list(set(re.findall(email_pattern, content)))
            # Also parse mailto: links
            try:
                mailtos = [l.get("href", "") for l in links if isinstance(l, dict) and l.get("href", "").startswith("mailto:")]
                emails.extend([m.replace("mailto:", "").strip() for m in mailtos if m])
                emails = list(set(emails))
            except Exception:
                pass
            phone_patterns = [
                r"\b\d{3}[-.]?\d{3}[-.]?\d{4}\b",      # US
                r"\b\d{4}\s?\d{6,7}\b",               # UK-ish
                r"\+\d{1,3}\s?\d{4,14}\b",            # International
            ]
            phones = []
            for p in phone_patterns:
                phones.extend(re.findall(p, content))
            # Also parse tel: links
            try:
                tels = [l.get("href", "") for l in links if isinstance(l, dict) and l.get("href", "").startswith("tel:")]
                for t in tels:
                    phones.append(t.replace("tel:", "").strip())
            except Exception:
                pass
            phones = list(set(phones))
            # If no contacts found, try common contact pages from links
            if not emails and not phones and links:
                try:
                    contact_like = []
                    for l in links:
                        href = (l.get("href") or "") if isinstance(l, dict) else ""
                        text = (l.get("text") or "").lower() if isinstance(l, dict) else ""
                        if not href:
                            continue
                        lower = href.lower()
                        if any(k in lower for k in ["contact", "contact-us", "kontakt", "impressum"]) or "contact" in text:
                            contact_like.append(href)
                    # Deduplicate and limit
                    seen = set()
                    crawl_targets = []
                    for href in contact_like:
                        if href not in seen:
                            seen.add(href)
                            crawl_targets.append(href)
                        if len(crawl_targets) >= 2:
                            break
                    # Crawl up to 2 contact-like pages
                    for target in crawl_targets:
                        try:
                            if "#" in target:
                                async with session.post("https://r.jina.ai/", data={"url": target}, headers=headers, timeout=20) as r2:
                                    tdata = await (r2.json() if r2.status == 200 else r2.text())
                            else:
                                async with session.get(f"https://r.jina.ai/{target}", headers=headers, timeout=20) as r2:
                                    try:
                                        tdata = await (r2.json() if r2.status == 200 else r2.text())
                                    except Exception:
                                        tdata = await r2.text()
                            if isinstance(tdata, str):
                                tcontent = tdata
                                tlinks = []
                            else:
                                tcontent = tdata.get("content", "")
                                tlinks = tdata.get("links", []) or []
                            # extract from contact page
                            emails.extend(re.findall(email_pattern, tcontent))
                            for p in phone_patterns:
                                phones.extend(re.findall(p, tcontent))
                            # mailto/tel from contact page
                            try:
                                mailtos = [li.get("href", "") for li in tlinks if isinstance(li, dict) and li.get("href", "").startswith("mailto:")]
                                emails.extend([m.replace("mailto:", "").strip() for m in mailtos if m])
                                tels = [li.get("href", "") for li in tlinks if isinstance(li, dict) and li.get("href", "").startswith("tel:")]
                                for t in tels:
                                    phones.append(t.replace("tel:", "").strip())
                            except Exception:
                                pass
                        except Exception:
                            continue
                    # dedupe and trim again
                    emails = list(set(emails))
                    phones = list(set(phones))
                except Exception:
                    pass

            # update enrichment
            out["enrichment"] = {
                "extracted": {
                    "emails": emails[:5],
                    "phones": phones[:5],
                    "has_contact_form": ("contact" in content.lower() and "form" in content.lower()),
                }
            }
            # improve email_valid if we found any plausible email
            if not out["email_valid"] and emails:
                out["email_valid"] = True
            # If we discovered phones, consider that as a signal too
            if phones and not out["enrichment"].get("has_phone"):
                out["enrichment"]["has_phone"] = True
        except Exception:
            pass
    return out