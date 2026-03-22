def prioritize_skills(gap: dict, resume_scores: dict):
    priority = {}
    for skill in gap["missing"]:
        score = resume_scores.get(skill, 0)
        if score < 0.3:
            priority[skill] = "HIGH"
        elif score < 0.6:
            priority[skill] = "MEDIUM"
        else:
            priority[skill] = "LOW"
    return priority
