from pydantic import BaseModel


class InterviewStart(BaseModel):
    jd_id: int
    level: str = "MEDIUM"
    user_id: int              # ← token tracking ke liye


class InterviewStartResponse(BaseModel):
    session_id: int
    question: str
    role_title: str
    level: str


class InterviewAnswer(BaseModel):
    session_id: int
    answer: str
    user_id: int              # ← token tracking ke liye


class ScoreDetail(BaseModel):
    correctness: int
    depth: int
    clarity: int


class InterviewAnswerResponse(BaseModel):
    session_id: int
    next_question: str
    score: ScoreDetail
    next_level: str