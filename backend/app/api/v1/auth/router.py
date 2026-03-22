from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.schemas.user import UserCreate, UserLogin
from app.api.v1.auth.service import create_user, authenticate_user, login_token
from app.db.session import SessionLocal

router = APIRouter(prefix="/auth", tags=["auth"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/signup")
def signup(data: UserCreate, db: Session = Depends(get_db)):
    user = create_user(db, data.email, data.password)
    return {"id": user.id, "email": user.email}

@router.post("/login")
def login(data: UserLogin, db: Session = Depends(get_db)):
    user = authenticate_user(db, data.email, data.password)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = login_token(user)
    return {"access_token": token, "token_type": "bearer"}
