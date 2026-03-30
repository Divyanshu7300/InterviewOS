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
    evaluations = relationship(
        "InterviewEvaluation",
        back_populates="session",
        cascade="all, delete"
    )
    insight_snapshots = relationship(
        "InterviewInsight",
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
    evaluations = relationship("InterviewEvaluation", back_populates="message")


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


class InterviewEvaluation(Base):
    __tablename__ = "interview_evaluations"

    id                 = Column(Integer, primary_key=True, index=True)
    session_id         = Column(Integer, ForeignKey("interview_sessions.id"), nullable=False, index=True)
    message_id         = Column(Integer, ForeignKey("interview_messages.id"), nullable=False, index=True)
    question           = Column(Text, nullable=False)
    topic              = Column(String, nullable=True)
    level_before       = Column(String, nullable=True)
    level_after        = Column(String, nullable=True)
    overall_score      = Column(Float, nullable=False, default=0)
    confidence_score   = Column(Float, nullable=False, default=0)
    correctness_score  = Column(Float, nullable=False, default=0)
    depth_score        = Column(Float, nullable=False, default=0)
    clarity_score      = Column(Float, nullable=False, default=0)
    evaluation_json    = Column(Text, nullable=False, default="{}")
    created_at         = Column(DateTime, default=datetime.utcnow)

    session = relationship("InterviewSession", back_populates="evaluations")
    message = relationship("InterviewMessage", back_populates="evaluations")


class InterviewInsight(Base):
    __tablename__ = "interview_insights"

    id              = Column(Integer, primary_key=True, index=True)
    session_id      = Column(Integer, ForeignKey("interview_sessions.id"), nullable=False, index=True)
    snapshot_type   = Column(String, nullable=False, default="live")
    insights_json   = Column(Text, nullable=False, default="{}")
    created_at      = Column(DateTime, default=datetime.utcnow)

    session = relationship("InterviewSession", back_populates="insight_snapshots")
