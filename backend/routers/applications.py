from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from auth.auth import require_admin
from db.models import Application, User
from db.session import get_db
from schemas import ApplicationOut, MessageOut

router = APIRouter(prefix="/api/applications", tags=["applications"])


def _to_out(app: Application, user: User | None = None) -> ApplicationOut:
    return ApplicationOut(
        id=app.id,
        user_id=app.user_id,
        user_name=(user.full_name if user else "") or "",
        user_email=(user.email if user else "") or "",
        requested_role=app.requested_role,
        organization=app.organization or "",
        message=app.message or "",
        status=app.status,
        created_at=app.created_at.isoformat() if app.created_at else "",
    )


@router.get("", response_model=list[ApplicationOut])
def list_applications(
    status: str = "pending",
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Admin only: list applications, filtered by status (default: pending)."""
    query = db.query(Application)
    if status and status.lower() != "all":
        query = query.filter_by(status=status.lower())
    apps = query.order_by(Application.created_at.desc()).all()
    return [_to_out(a, db.get(User, a.user_id)) for a in apps]


@router.get("/{application_id}", response_model=ApplicationOut)
def get_application(
    application_id: int,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Admin only: full details for a single application."""
    app = db.get(Application, application_id)
    if app is None:
        raise HTTPException(status_code=404, detail="Application not found.")
    return _to_out(app, db.get(User, app.user_id))


@router.post("/{application_id}/approve", response_model=MessageOut)
def approve_application(
    application_id: int,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Admin only: approve an application and activate the requested role."""
    app = db.get(Application, application_id)
    if app is None:
        raise HTTPException(status_code=404, detail="Application not found.")
    if app.status != "pending":
        raise HTTPException(status_code=400, detail="Application already handled.")

    user = db.get(User, app.user_id)
    if user is None:
        raise HTTPException(status_code=404, detail="Applicant not found.")

    user.role = app.requested_role
    user.status = "active"
    app.status = "approved"
    app.reviewed_by = admin.id
    app.reviewed_at = datetime.utcnow()
    db.commit()
    return MessageOut(message=f"{user.email} is now an approved {app.requested_role}.")


@router.post("/{application_id}/reject", response_model=MessageOut)
def reject_application(
    application_id: int,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Admin only: reject an application.

    The applicant keeps a usable account as a normal (active) student so they
    are never locked out, but they gain no employer/coach privileges.
    """
    app = db.get(Application, application_id)
    if app is None:
        raise HTTPException(status_code=404, detail="Application not found.")
    if app.status != "pending":
        raise HTTPException(status_code=400, detail="Application already handled.")

    user = db.get(User, app.user_id)
    if user is not None:
        user.role = "student"
        user.status = "active"
    app.status = "rejected"
    app.reviewed_by = admin.id
    app.reviewed_at = datetime.utcnow()
    db.commit()
    return MessageOut(message="Application rejected.")
