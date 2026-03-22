from pydantic import BaseModel

class ResumeOut(BaseModel):
    resume_id: int
    skills: dict

    model_config = {"from_attributes": True}
