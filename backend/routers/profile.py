import json

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from auth.auth import require_student
from db.models import StudentProfile, User
from db.session import get_db
from schemas import ProfileIn, ProfileOut
from serializers import profile_to_out

router = APIRouter(prefix="/api/profile", tags=["profile"])


def _get_or_create_profile(db: Session, user: User) -> StudentProfile:
    profile = db.query(StudentProfile).filter_by(user_id=user.id).first()
    if profile is None:
        profile = StudentProfile(
            user_id=user.id,
            contact_email=user.email,
            availability="Open to work",
        )
        db.add(profile)
        db.commit()
        db.refresh(profile)
    return profile


@router.get("", response_model=ProfileOut)
def get_profile(user: User = Depends(require_student), db: Session = Depends(get_db)):
    profile = _get_or_create_profile(db, user)
    return ProfileOut(**profile_to_out(profile, user))


@router.put("", response_model=ProfileOut)
def update_profile(
    data: ProfileIn,
    user: User = Depends(require_student),
    db: Session = Depends(get_db),
):
    profile = _get_or_create_profile(db, user)

    if data.name:
        user.full_name = data.name
    profile.headline = data.headline
    profile.bio = data.bio
    profile.skills_json = json.dumps(data.skills or [])
    profile.location = data.location
    profile.github = data.github
    profile.linkedin = data.linkedin
    profile.contact_email = data.contact_email
    profile.availability = data.availability

    db.commit()
    db.refresh(profile)
    db.refresh(user)
    return ProfileOut(**profile_to_out(profile, user))
