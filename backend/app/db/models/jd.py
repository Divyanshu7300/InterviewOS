from sqlalchemy import Column, Integer, Text, ForeignKey, DateTime
from sqlalchemy.types import JSON
from datetime import datetime
from app.db.base import Base


class JobDescription(Base):
    __tablename__ = "job_descriptions"

    id         = Column(Integer, primary_key=True, index=True)
    user_id    = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)  
    text       = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)                           


class JDAnalysisResult(Base):
    __tablename__ = "jd_analysis_results"

    id                  = Column(Integer, primary_key=True, index=True)
    jd_id               = Column(Integer, ForeignKey("job_descriptions.id"))
    role_title          = Column(Text)
    role_summary        = Column(Text)
    seniority_level     = Column(Text)
    experience_required = Column(Text)
    tech_stack          = Column(JSON)
    soft_skills         = Column(JSON)
    key_responsibilities = Column(JSON)
    interview_topics    = Column(JSON)
    resume_keywords     = Column(JSON)
    extracted_skills    = Column(JSON)
    raw_skill_scores    = Column(JSON)