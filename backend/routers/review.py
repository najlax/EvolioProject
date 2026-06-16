import json
from datetime import datetime

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from auth.auth import require_student
from db.models import PortfolioReview, User
from db.session import get_db
from schemas import ReviewFeedbackOut, ReviewStatusOut, ReviewSubmit

router = APIRouter(prefix="/api/review", tags=["review"])


def _get_or_create_review(db: Session, user_id: int) -> PortfolioReview:
    review = db.query(PortfolioReview).filter_by(user_id=user_id).first()
    if review is None:
        review = PortfolioReview(user_id=user_id, status="Draft", feedback="[]")
        db.add(review)
        db.commit()
        db.refresh(review)
    return review


def _load_feedback(review: PortfolioReview) -> list:
    try:
        return json.loads(review.feedback) if review.feedback else []
    except (ValueError, TypeError):
        return []


@router.post("/submit", response_model=ReviewStatusOut)
def submit_review(
    data: ReviewSubmit,
    user: User = Depends(require_student),
    db: Session = Depends(get_db),
):
    review = _get_or_create_review(db, user.id)
    review.status = "Ready"
    review.submitted_at = datetime.utcnow()

    feedback = _load_feedback(review)
    feedback.append(
        {
            "reviewer": "Career Coach",
            "status": "Ready",
            "comment": "Thanks for submitting! Your portfolio is queued for review.",
            "date": datetime.utcnow().isoformat(),
        }
    )
    review.feedback = json.dumps(feedback)
    db.commit()
    return ReviewStatusOut(status=review.status)


@router.get("/status", response_model=ReviewStatusOut)
def get_review_status(
    user: User = Depends(require_student), db: Session = Depends(get_db)
):
    review = _get_or_create_review(db, user.id)
    return ReviewStatusOut(status=review.status)


@router.get("/feedback", response_model=ReviewFeedbackOut)
def get_review_feedback(
    user: User = Depends(require_student), db: Session = Depends(get_db)
):
    review = _get_or_create_review(db, user.id)
    return ReviewFeedbackOut(status=review.status, feedback=_load_feedback(review))
