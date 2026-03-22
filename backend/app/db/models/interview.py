from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Float
from sqlalchemy.orm import relationship
from datetime import datetime
from app.db.base import Base


# -------------------------
# Interview Session
# -------------------------
class InterviewSession(Base):
    __tablename__ = "interview_sessions"

    id         = Column(Integer, primary_key=True, index=True)
    user_id    = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)  # ← add
    jd_id      = Column(Integer, ForeignKey("job_descriptions.id"), nullable=True)
    role       = Column(String, nullable=False)
    level      = Column(String, default="MEDIUM")
    created_at = Column(DateTime, default=datetime.utcnow)

    messages = relationship(
        "InterviewMessage",
        back_populates="session",
        cascade="all, delete"
    )
    scores = relationship(
        "InterviewScore",
        back_populates="session",
        cascade="all, delete"
    )


# -------------------------
# Interview Messages
# -------------------------
class InterviewMessage(Base):
    __tablename__ = "interview_messages"

    id         = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("interview_sessions.id"), nullable=False)
    role       = Column(String)
    content    = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)

    session = relationship("InterviewSession", back_populates="messages")


# -------------------------
# Interview Scores
# -------------------------
class InterviewScore(Base):
    __tablename__ = "interview_scores"

    id          = Column(Integer, primary_key=True, index=True)
    session_id  = Column(Integer, ForeignKey("interview_sessions.id"), nullable=False)
    correctness = Column(Float)
    depth       = Column(Float)
    clarity     = Column(Float)
    created_at  = Column(DateTime, default=datetime.utcnow)

    session = relationship("InterviewSession", back_populates="scores")