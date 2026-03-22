from app.services.resume_parser.skill_mapper import SKILL_TAXONOMY
from app.services.jd_parser.cleaner import clean_jd

def extract_jd_skills(jd_text: str) -> dict:
    clean = clean_jd(jd_text)
    skills = {}
    for skill, keywords in SKILL_TAXONOMY.items():
        skills[skill] = sum(clean.count(k) for k in keywords)
    return skills
