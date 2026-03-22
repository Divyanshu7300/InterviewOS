from pydantic import BaseModel
from typing import Dict, List


class ResumeAnalysis(BaseModel):
    ats_score: int
    role_match: bool
    experience_match: bool
    matched_skills: List[str]
    missing_skills: List[str]
    weak_skills: List[str]
    improvement_suggestions: List[str]


class ResumeResponse(BaseModel):
    resume_id: int
    skills: Dict[str, int]
    analysis: ResumeAnalysis