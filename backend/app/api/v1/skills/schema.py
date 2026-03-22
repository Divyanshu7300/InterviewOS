"""
Learning Module — Pydantic Schemas
"""
from pydantic import BaseModel
from typing import Optional
from datetime import datetime


# ─── Skill ───────────────────────────────────────────────────────────────────
class SkillOut(BaseModel):
    id: int
    name: str
    slug: str
    description: Optional[str]
    icon: Optional[str]
    color: Optional[str]

    class Config:
        from_attributes = True


# ─── Topic ───────────────────────────────────────────────────────────────────
class TopicOut(BaseModel):
    id: int
    skill_id: int
    title: str
    description: Optional[str]
    level: str           # BEGINNER / INTERMEDIATE / ADVANCED
    order_index: int
    xp_reward: int
    # user ka progress attach hoga agar logged in ho
    completed: Optional[bool] = False
    best_score: Optional[float] = 0.0
    attempts: Optional[int] = 0

    class Config:
        from_attributes = True


class TopicsGrouped(BaseModel):
    beginner: list[TopicOut]
    intermediate: list[TopicOut]
    advanced: list[TopicOut]


# ─── Question ────────────────────────────────────────────────────────────────
class QuestionOut(BaseModel):
    id: int
    question_text: str
    options: list[str]       # ["A. ...", "B. ...", "C. ...", "D. ..."]
    # correct_index NOT exposed to frontend during quiz

    class Config:
        from_attributes = True


class QuestionsResponse(BaseModel):
    topic_id: int
    topic_title: str
    skill_name: str
    level: str
    xp_reward: int
    questions: list[QuestionOut]
    total: int
    source: str   # "cache" ya "generated"


# ─── Quiz Submit ─────────────────────────────────────────────────────────────
class QuizAnswer(BaseModel):
    question_id: int
    selected_index: int   # 0-3


class QuizSubmit(BaseModel):
    user_id: int
    topic_id: int
    answers: list[QuizAnswer]


class AnswerResult(BaseModel):
    question_id: int
    correct: bool
    correct_index: int
    explanation: Optional[str]


class QuizResult(BaseModel):
    topic_id: int
    total: int
    correct: int
    score: float             # percentage
    xp_earned: int
    passed: bool             # >= 70% to pass
    new_total_xp: int
    streak: int
    streak_updated: bool
    results: list[AnswerResult]


# ─── User Stats ──────────────────────────────────────────────────────────────
class UserStatsOut(BaseModel):
    user_id: int
    total_xp: int
    current_streak: int
    longest_streak: int
    topics_completed: int
    accuracy: float          # total_correct / total_attempted * 100
    last_activity: Optional[datetime]

    class Config:
        from_attributes = True


# ─── Leaderboard ─────────────────────────────────────────────────────────────
class LeaderboardEntry(BaseModel):
    rank: int
    user_id: int
    email: str
    total_xp: int
    topics_completed: int
    current_streak: int


class LeaderboardOut(BaseModel):
    entries: list[LeaderboardEntry]
    total_users: int