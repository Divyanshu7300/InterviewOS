from sqlalchemy.orm import Session, joinedload
from app.db.models.comment import Comment
from app.api.v1.community.schema import CommentCreate


def get_all_comments(db: Session) -> list:
    """
    Fetch only top-level comments with nested replies.
    """

    comments = (
        db.query(Comment)
        .options(joinedload(Comment.replies))
        .filter(Comment.parent_id == None)
        .order_by(Comment.created_at.desc())
        .all()
    )

    # ensure replies always list
    for c in comments:
        if c.replies is None:
            c.replies = []

    return comments


def create_comment(db: Session, data: CommentCreate) -> Comment:
    """
    Create a new comment or reply.
    """

    # validate parent comment if reply
    if data.parent_id:
        parent = db.query(Comment).filter(Comment.id == data.parent_id).first()
        if not parent:
            raise ValueError(f"Parent comment not found with id {data.parent_id}")

    comment = Comment(
        user_id=data.user_id,
        user_name=data.user_name,
        content=data.content,
        parent_id=data.parent_id,
    )

    db.add(comment)
    db.commit()
    db.refresh(comment)

    # IMPORTANT: FastAPI response fix
    comment.replies = []

    return comment


def like_comment(db: Session, comment_id: int) -> Comment:
    """
    Increment like count of a comment.
    """

    comment = db.query(Comment).filter(Comment.id == comment_id).first()

    if not comment:
        raise ValueError(f"Comment not found with id {comment_id}")

    comment.likes += 1

    db.commit()
    db.refresh(comment)

    # ensure replies list
    comment.replies = comment.replies or []

    return comment


def delete_comment(db: Session, comment_id: int, user_name: str) -> bool:
    """
    Delete a comment (only owner allowed).
    """

    comment = db.query(Comment).filter(Comment.id == comment_id).first()

    if not comment:
        raise ValueError(f"Comment not found with id {comment_id}")

    if comment.user_name != user_name:
        raise PermissionError("You can only delete your own comments")

    db.delete(comment)
    db.commit()

    return True
