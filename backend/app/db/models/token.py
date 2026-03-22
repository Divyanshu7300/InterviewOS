"""
Token Usage Model — per user daily token tracking
"""
from sqlalchemy import Column, Integer, ForeignKey, Date, DateTime, String
from sqlalchemy.sql import func
from app.db.base import Base


class UserTokenUsage(Base):
    __tablename__ = "user_token_usage"

    id         = Column(Integer, primary_key=True, index=True)
    user_id    = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    date       = Column(Date, nullable=False, index=True)          # YYYY-MM-DD
    tokens_used = Column(Integer, default=0, nullable=False)
    last_updated = Column(DateTime, default=func.now(), onupdate=func.now())

    # What used the tokens — "jd", "interview", "learn", "resume"
    source     = Column(String, nullable=True)