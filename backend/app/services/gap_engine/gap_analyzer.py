def analyze_gap(resume_skills: dict, jd_skills: dict):
    required = [k for k, v in jd_skills.items() if v > 0]
    present = [k for k in required if resume_skills.get(k, 0) > 0]
    missing = [k for k in required if k not in present]

    return {
        "required": required,
        "present": present,
        "missing": missing
    }
