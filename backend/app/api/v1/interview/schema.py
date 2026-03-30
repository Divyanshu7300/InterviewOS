from pydantic import BaseModel
from typing import Any


class InterviewStart(BaseModel):
    jd_id: int
    level: str = "MEDIUM"
    user_id: int
    candidate_preferences: str | None = None


class InterviewStartResponse(BaseModel):
    session_id: int
    question: str
    role_title: str
    level: str


class InterviewAnswer(BaseModel):
    session_id: int
    answer: str
    user_id: int
    candidate_preferences: str | None = None


class ScoreDetail(BaseModel):
    overall: float
    confidence: float
    correctness: float
    depth: float
    clarity: float


class StructureSignals(BaseModel):
    has_clear_structure: bool
    uses_examples: bool
    mentions_tradeoffs: bool
    answers_directly: bool


class LinguisticSignals(BaseModel):
    confidence_pattern: str
    clarity_pattern: str
    depth_pattern: str


class DimensionReasoning(BaseModel):
    confidence: str
    correctness: str
    depth: str
    clarity: str


class SentenceLevelFeedbackItem(BaseModel):
    sentence: str
    issue: str
    suggestion: str
    impacted_dimensions: list[str]


class AnswerEvaluation(BaseModel):
    score: float
    scores: ScoreDetail
    reasoning: str
    dimension_reasoning: DimensionReasoning
    sentence_level_feedback: list[SentenceLevelFeedbackItem]
    topic: str
    subtopics: list[str]
    feedback: str
    strengths: list[str]
    weak_areas: list[str]
    missing_concepts: list[str]
    concept_coverage: list[str]
    structure_signals: StructureSignals
    linguistic_signals: LinguisticSignals
    followup_focus: str
    improvement_hint: str


class SessionIntelligence(BaseModel):
    confidence: float
    momentum: str
    response_progress: float
    best_signal: str
    weakest_signal: str
    session_dna: str
    weak_areas: list[str]
    improvement_trend: list[float]
    topic_coverage: list[str]
    skill_scores: dict[str, float]
    latest_topic: str | None = None
    latest_feedback: str | None = None


class InterviewAnswerResponse(BaseModel):
    session_id: int
    next_question: str
    score: ScoreDetail
    next_level: str
    evaluation: AnswerEvaluation
    session_insights: SessionIntelligence


class EvaluateAnswerRequest(BaseModel):
    skill: str
    question: str
    answer: str
    user_id: int | None = None
    candidate_preferences: str | None = None
    jd_context: dict[str, Any] | None = None
    history: list[dict[str, str]] | None = None


class GenerateFollowupRequest(BaseModel):
    skill: str
    level: str
    previous_question: str
    previous_answer: str
    extracted_signals: dict[str, Any]
    user_id: int | None = None
    candidate_preferences: str | None = None
    jd_context: dict[str, Any] | None = None
    history: list[dict[str, str]] | None = None


class FollowupResponse(BaseModel):
    question: str


class SessionInsightsResponse(BaseModel):
    session_id: int
    insights: SessionIntelligence
