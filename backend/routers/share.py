import os
import secrets
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from auth.auth import require_student
from db.models import Project, ShareLink, StudentProfile, User
from db.session import get_db
from schemas import ShareLinkIn, ShareLinkOut, ShareSettingsIn
from serializers import profile_to_out, project_to_out

router = APIRouter(prefix="/api/share", tags=["share"])

FRONTEND_BASE = os.getenv("EVOLIO_FRONTEND_BASE", "http://localhost:5173")


def _parse_dt(value):
    if not value:
        return None
    try:
        return datetime.fromisoformat(value)
    except (ValueError, TypeError):
        return None


def _link_out(link: ShareLink) -> ShareLinkOut:
    return ShareLinkOut(
        token=link.token,
        url=f"{FRONTEND_BASE}/portfolio/{link.token}",
        visibility=link.visibility or "public",
        expires_at=link.expires_at.isoformat() if link.expires_at else None,
    )


@router.post("/generate", response_model=ShareLinkOut)
def generate_share_link(
    data: ShareLinkIn,
    user: User = Depends(require_student),
    db: Session = Depends(get_db),
):
    link = db.query(ShareLink).filter_by(user_id=user.id).first()
    if link is None:
        link = ShareLink(user_id=user.id, token=secrets.token_urlsafe(12))
        db.add(link)
    link.visibility = data.visibility
    link.expires_at = _parse_dt(data.expires_at)
    link.is_active = True
    db.commit()
    db.refresh(link)
    return _link_out(link)


@router.get("/{token}")
def get_public_portfolio(token: str, db: Session = Depends(get_db)):
    link = db.query(ShareLink).filter_by(token=token).first()
    if link is None:
        raise HTTPException(status_code=404, detail="Share link not found.")

    user = db.get(User, link.user_id)
    profile = db.query(StudentProfile).filter_by(user_id=link.user_id).first()
    projects = db.query(Project).filter_by(user_id=link.user_id).all()

    return {
        "token": token,
        "visibility": link.visibility or "public",
        "profile": profile_to_out(profile, user) if profile and user else None,
        "projects": [project_to_out(p) for p in projects],
    }


@router.put("/settings", response_model=ShareLinkOut)
def update_share_settings(
    data: ShareSettingsIn,
    user: User = Depends(require_student),
    db: Session = Depends(get_db),
):
    link = db.query(ShareLink).filter_by(user_id=user.id).first()
    if link is None:
        raise HTTPException(
            status_code=404, detail="No share link yet. Generate one first."
        )
    if data.visibility is not None:
        link.visibility = data.visibility
    if data.expires_at is not None:
        link.expires_at = _parse_dt(data.expires_at)
    db.commit()
    db.refresh(link)
    return _link_out(link)
