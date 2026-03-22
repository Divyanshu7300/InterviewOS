from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.core.config import settings

DATABASE_URL = settings.DATABASE_URL

engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True
)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
# This file sets up the database connection and session management for our application. We create an SQLAlchemy engine using the database URL from our settings, and then we create a session factory (SessionLocal) that we can use to create database sessions. The get_db function is a dependency that we can use in our API routes to get a database session, and it ensures that the session is properly closed after the request is done.