from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List

from app.db.session import get_db
from app.api.v1.community.schema import CommentCreate, CommentResponse
from app.api.v1.community.service import (
    get_all_comments,
    create_comment,
    like_comment,
    delete_comment,
)

router = APIRouter(prefix="/community", tags=["community"])


@router.get("/comments", response_model=List[CommentResponse])
def get_comments(db: Session = Depends(get_db)):
    """
    Saare top-level comments fetch karo with nested replies.
    """
    return get_all_comments(db)


@router.post("/comments", response_model=CommentResponse)
def post_comment(data: CommentCreate, db: Session = Depends(get_db)):
    """
    Naya comment post karo.
    parent_id do toh reply hoga, warna top-level comment.
    """
    try:
        return create_comment(db, data)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post("/comments/{comment_id}/like", response_model=CommentResponse)
def like(comment_id: int, db: Session = Depends(get_db)):
    """
    Comment ko like karo.
    """
    try:
        return like_comment(db, comment_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.delete("/comments/{comment_id}")
def delete(
    comment_id: int,
    user_name: str = Query(...),
    db: Session = Depends(get_db)
):
    """
    Apna comment delete karo.
    """
    try:
        delete_comment(db, comment_id, user_name)
        return {"message": "Comment deleted successfully"}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))