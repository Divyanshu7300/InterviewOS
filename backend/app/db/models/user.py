from sqlalchemy import Column, Integer, String, DateTime
from datetime import datetime
from app.db.base import Base


class User(Base):
    __tablename__ = "users"

    id            = Column(Integer, primary_key=True, index=True)
    email         = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    username      = Column(String, unique=True, index=True, nullable=True)  # ← add, nullable future use ke liye
    created_at    = Column(DateTime, default=datetime.utcnow)