from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime


class CommentCreate(BaseModel):
    user_id: Optional[int] = None
    user_name: str
    content: str
    parent_id: Optional[int] = None


class CommentResponse(BaseModel):
    id: int
    user_name: str
    content: str
    likes: int
    parent_id: Optional[int]
    created_at: datetime
    replies: List["CommentResponse"] = Field(default_factory=list)

    class Config:
        from_attributes = True


CommentResponse.model_rebuild()
