from sqlalchemy import Column, Integer, ForeignKey, Text
from sqlalchemy.dialects.postgresql import JSONB
from app.db.base import Base

class Resume(Base):
    __tablename__ = "resumes"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    raw_text = Column(Text, nullable=False)
    skills = Column(JSONB, nullable=False)
