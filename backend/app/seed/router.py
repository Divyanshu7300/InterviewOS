from fastapi import APIRouter
from app.seed.seed_data import seed

router = APIRouter()

@router.get("/seed-skills1234")
def seed_skills():
    seed()
    return {"message": "Seeding done 🚀"}