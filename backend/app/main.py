from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import time
from sqlalchemy.exc import OperationalError
from sqlalchemy import text
import os

FRONTEND_URL = os.getenv("FRONTEND_URL")

from app.api.v1.auth.router import router as auth_router
from app.api.v1.resumes.router import router as resume_router
from app.api.v1.jd.router import router as jd_router
from app.api.v1.interview.router import router as interview_router
from app.api.v1.dashboard.stats import router as dashboard_router
from app.api.v1.skills.router import router as skills_router
from app.api.v1.community.router import router as community_router
from app.api.v1.token.router import router as token_router   # ← add
from app.db.session import engine
from app.db.base import Base
import app.db.models       
from app.seed.router import router as seed_router  # (agar new file banaya)



# APP INIT
app = FastAPI(title="InterviewOS")


# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_URL],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ROUTERS
app.include_router(auth_router,      prefix="/api/v1")
app.include_router(resume_router,    prefix="/api/v1")
app.include_router(jd_router,        prefix="/api/v1")
app.include_router(interview_router, prefix="/api/v1")
app.include_router(dashboard_router, prefix="/api/v1")
app.include_router(community_router, prefix="/api/v1")
app.include_router(token_router,     prefix="/api/v1")        # ← add
app.include_router(skills_router)    # prefix already /api/v1/learn
app.include_router(seed_router, prefix="/api/v1")                    # ← table create ke liye


# HEALTH CHECK
@app.get("/health")
def health():
    return {"status": "ok"}


# DB STARTUP
@app.on_event("startup")
def on_startup():
    max_retries = 10
    delay = 3

    for attempt in range(max_retries):
        try:
            with engine.connect() as conn:
                conn.execute(text("SELECT 1"))

            Base.metadata.create_all(bind=engine)
            print("Database ready, tables created")
            return

        except OperationalError:
            print(f"DB not ready (attempt {attempt + 1}/{max_retries}), retrying...")
            time.sleep(delay)

    raise Exception("Database never became ready")