def compute_score(lead: dict) -> int:
    """
    Combine match strength, enrichment completeness and email validity into a 0-100 score.
    Weights:
      - match_score (from discovery) 0-100 => 50%
      - email_valid => +25
      - enrichment completeness => up to 25
    """
    base = 0
    match = 0
    if lead.get("meta") and isinstance(lead["meta"].get("match_score"), (int, float)):
        match = float(lead["meta"]["match_score"])
    base += match * 0.5  # 0-50

    if lead.get("email_valid"):
        base += 25

    enrichment = lead.get("enrichment") or {}
    fields = ["title", "company", "linkedin", "phone"]
    completeness = sum(1 for f in fields if enrichment.get(f)) / len(fields)
    base += completeness * 25

    score = int(max(0, min(100, round(base))))
    return score