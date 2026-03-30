from pydantic import BaseModel
from typing import List, Optional


class JDInput(BaseModel):
    jd_text: str
    user_id: int 


class JDAnalysisResult(BaseModel):
    id: int          # YEH ADD 
    jd_id: int 
    role_title: str
    role_summary: str
    seniority_level: str
    experience_required: str
    tech_stack: List[str]
    soft_skills: List[str]
    key_responsibilities: List[str]
    extracted_skills: dict
    interview_topics: List[str]
    resume_keywords: List[str]
    raw_skill_scores: dict

    class Config:
        from_attributes = True  # Pydantic v2 — ORM object ko serialize karega

class JDListItem(BaseModel):
    jd_id:               int
    role_title:          Optional[str]
    seniority_level:     Optional[str]
    experience_required: Optional[str]
    tech_stack:          Optional[list]
 
    class Config:
        from_attributes = True