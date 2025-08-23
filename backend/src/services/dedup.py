from rapidfuzz import fuzz
import re

def _normalize(s: str) -> str:
    if not s:
        return ""
    s = s.lower()
    s = re.sub(r"[^\w\s]", "", s)
    s = re.sub(r"\s+", " ", s).strip()
    return s

def dedupe_exact(candidates: list) -> list:
    """Remove exact duplicates by email or canonical URL (fast cheap pass)."""
    seen_emails = set()
    seen_urls = set()
    out = []
    for c in candidates:
        e = (c.get("email") or "").lower()
        u = (c.get("url") or "").lower()
        if e and e in seen_emails:
            continue
        if u and u in seen_urls:
            continue
        if e:
            seen_emails.add(e)
        if u:
            seen_urls.add(u)
        out.append(c)
    return out

def fuzzy_dedupe(candidates: list, name_key="name", threshold: int = 86) -> list:
    """
    Cluster candidates by fuzzy name similarity and choose the highest-scored
    representative for each cluster. O(n^2) - works for typical lead batch sizes
    (hundreds to low thousands). If you expect millions, replace with blocking/indexing.
    """
    clusters = []
    for c in candidates:
        name = _normalize(c.get(name_key) or c.get("company") or "")
        placed = False
        for cl in clusters:
            if not cl["key"]:
                continue
            score = fuzz.token_sort_ratio(name, cl["key"])
            if score >= threshold:
                cl["members"].append(c)
                placed = True
                break
        if not placed:
            clusters.append({"key": name, "members": [c]})

    representatives = []
    for cl in clusters:
        # choose highest meta.score if available, else first
        members = cl["members"]
        members_sorted = sorted(members, key=lambda m: m.get("meta", {}).get("score", 0), reverse=True)
        representatives.append(members_sorted[0])
    return representatives