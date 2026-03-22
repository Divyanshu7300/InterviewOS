from pydantic import BaseModel

class InterviewStartRequest(BaseModel):
    resume_text: str
    job_description: str
    role: str

class InterviewAnswerRequest(BaseModel):
    session_id: str
    answer: str

class InterviewQuestionResponse(BaseModel):
    session_id: str
    question: str
