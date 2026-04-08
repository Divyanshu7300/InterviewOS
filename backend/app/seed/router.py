import os

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field

from app.seed.seed_data import expand_seed_batch, get_seed_batches, get_seed_skill_catalog, seed

router = APIRouter()

SEED_ADMIN_PASSCODE = os.getenv("SEED_ADMIN_PASSCODE", "1234")


class SeedSkillsRequest(BaseModel):
    passcode: str
    batch: str | None = Field(default=None, description="Predefined 5-skill batch name like batch-01")
    skills: list[str] | None = Field(default=None, description="Skill slugs to seed")


def verify_passcode(passcode: str) -> None:
    if passcode != SEED_ADMIN_PASSCODE:
        raise HTTPException(status_code=403, detail="Invalid seed passcode")


@router.get("/seed/skills")
def get_seed_skills(passcode: str = Query(...)):
    verify_passcode(passcode)
    return {
        "skills": get_seed_skill_catalog(),
        "batches": get_seed_batches(),
        "count": len(get_seed_skill_catalog()),
    }


@router.post("/seed/skills")
def seed_skills(payload: SeedSkillsRequest):
    verify_passcode(payload.passcode)

    selected_skills = payload.skills
    if payload.batch:
        batch_skills = expand_seed_batch(payload.batch)
        if not batch_skills:
            raise HTTPException(status_code=400, detail="Invalid seed batch")
        selected_skills = batch_skills

    summary = seed(
        skills_filter=selected_skills,
    )
    return {
        "message": "Seeding done",
        "batch": payload.batch,
        **summary,
    }
