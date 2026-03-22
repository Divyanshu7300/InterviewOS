SKILL_TAXONOMY = {
    "python": ["python", "django", "flask", "fastapi"],
    "sql": ["sql", "postgres", "mysql", "sqlite"],
    "dsa": ["data structures", "algorithms", "array", "linked list", "tree", "graph"],
    "ml": ["machine learning", "ml", "regression", "classification", "pytorch", "sklearn"],
    "system_design": ["system design", "scalability", "microservices"]
}

def extract_skills(text: str) -> dict:
    found = {k: 0 for k in SKILL_TAXONOMY}
    for skill, keywords in SKILL_TAXONOMY.items():
        for kw in keywords:
            if kw in text:
                found[skill] += text.count(kw)
    return found
# not using for now