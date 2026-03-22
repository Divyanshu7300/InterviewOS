from app.utils.pdf_reader import read_pdf_text
from app.services.resume_parser.cleaner import clean_text
from app.services.resume_parser.skill_mapper import extract_skills
from app.services.resume_parser.scorer import score_skills

def parse_resume(path: str) -> dict:
    raw = read_pdf_text(path)
    clean = clean_text(raw)
    counts = extract_skills(clean)
    scores = score_skills(counts)
    return {
        "raw_text": raw,
        "clean_text": clean,
        "skill_scores": scores
    }#not useing now
