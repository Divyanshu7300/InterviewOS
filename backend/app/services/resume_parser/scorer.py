def score_skills(counts: dict) -> dict:
    scores = {}
    max_count = max(counts.values()) if counts else 0
    if max_count <= 0:
        return {skill: 0.0 for skill in counts}
    for skill, cnt in counts.items():
        scores[skill] = round(min(cnt / max_count, 1.0), 2)
    return scores
#not using for mow
