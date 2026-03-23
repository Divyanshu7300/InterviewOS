from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship, backref
from datetime import datetime
from app.db.base import Base


class Comment(Base):
    __tablename__ = "comments"

    id         = Column(Integer, primary_key=True, index=True)
    user_id    = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)  # ← add
    user_name  = Column(String, nullable=False)
    content    = Column(Text, nullable=False)
    likes      = Column(Integer, default=0)
    parent_id  = Column(Integer, ForeignKey("comments.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    replies = relationship(
        "Comment",
        backref=backref("parent", remote_side=[id]),
        cascade="all, delete-orphan",
        lazy="selectin",
    )