from sqlalchemy import Column, Integer, String, Text, Float, Boolean, ForeignKey, DateTime
from sqlalchemy.types import JSON
from datetime import datetime
from app.db.base import Base


class LearningSkill(Base):
    __tablename__ = "learning_skills"

    id          = Column(Integer, primary_key=True, index=True)
    name        = Column(String, nullable=False)
    slug        = Column(String, unique=True, nullable=False)
    description = Column(Text)
    icon        = Column(String)
    color       = Column(String)


class LearningTopic(Base):
    __tablename__ = "learning_topics"

    id          = Column(Integer, primary_key=True, index=True)
    skill_id    = Column(Integer, ForeignKey("learning_skills.id"), nullable=False)
    title       = Column(String, nullable=False)
    description = Column(Text)
    level       = Column(String, nullable=False)   # BEGINNER / INTERMEDIATE / ADVANCED
    order_index = Column(Integer, default=0)
    xp_reward   = Column(Integer, default=100)


class LearningQuestion(Base):
    __tablename__ = "learning_questions"

    id            = Column(Integer, primary_key=True, index=True)
    topic_id      = Column(Integer, ForeignKey("learning_topics.id"), nullable=False)
    question_text = Column(Text, nullable=False)
    options       = Column(JSON, nullable=False)   # list of 4 strings
    correct_index = Column(Integer, nullable=False)
    explanation   = Column(Text)


class UserTopicProgress(Base):
    __tablename__ = "user_topic_progress"

    id         = Column(Integer, primary_key=True, index=True)
    user_id    = Column(Integer, ForeignKey("users.id"), nullable=False)
    topic_id   = Column(Integer, ForeignKey("learning_topics.id"), nullable=False)
    completed  = Column(Boolean, default=False)
    best_score = Column(Float, default=0.0)
    attempts   = Column(Integer, default=0)


class UserLearningStats(Base):
    __tablename__ = "user_learning_stats"

    id               = Column(Integer, primary_key=True, index=True)
    user_id          = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    total_xp         = Column(Integer, default=0)
    current_streak   = Column(Integer, default=0)
    longest_streak   = Column(Integer, default=0)
    topics_completed = Column(Integer, default=0)
    total_correct    = Column(Integer, default=0)
    total_attempted  = Column(Integer, default=0)
    last_activity    = Column(DateTime, nullable=True)