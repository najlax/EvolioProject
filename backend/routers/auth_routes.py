from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from auth.auth import (
    create_access_token,
    get_current_user,
    get_user_by_email,
    hash_password,
    verify_password,
)
from db.models import User
from db.session import get_db
from schemas import LoginRequest, RegisterRequest, TokenResponse, UserOut
from serializers import user_to_out

router = APIRouter(prefix="/api/auth", tags=["auth"])

ALLOWED_ROLES = {"student", "employer", "admin", "coach"}

ROLE_ALIASES = {"career coach": "coach"}


def _normalize_role(role: str) -> str:
    cleaned = (role or "").strip().lower()
    return ROLE_ALIASES.get(cleaned, cleaned)


@router.post("/register", response_model=UserOut)
def register(data: RegisterRequest, db: Session = Depends(get_db)):
    role = _normalize_role(data.role)
    if role not in ALLOWED_ROLES:
        raise HTTPException(status_code=400, detail="Invalid account role.")

    if len(data.password) < 8:
        raise HTTPException(
            status_code=400,
            detail="Password must be at least 8 characters.",
        )

    if get_user_by_email(db, data.email):
        raise HTTPException(
            status_code=409,
            detail="This email address is already registered. "
            "Please use another email or sign in.",
        )

    user = User(
        email=data.email,
        full_name=data.name,
        password_hash=hash_password(data.password),
        role=role,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return UserOut(**user_to_out(user))


@router.post("/login", response_model=TokenResponse)
def login(data: LoginRequest, db: Session = Depends(get_db)):
    user = get_user_by_email(db, data.email)
    if user is None or not verify_password(data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password.")

    role = (user.role or "").lower()
    # If the frontend sent a role, make sure it matches the stored one.
    if data.role:
        requested_role = _normalize_role(data.role)
        if requested_role not in ALLOWED_ROLES:
            raise HTTPException(status_code=400, detail="Invalid account role.")
        if requested_role != role:
            raise HTTPException(
                status_code=401,
                detail=f"This account is registered as a {role}.",
            )

    token = create_access_token({"sub": str(user.id), "role": role})
    return TokenResponse(access_token=token, role=role)


@router.get("/me", response_model=UserOut)
def me(user: User = Depends(get_current_user)):
    return UserOut(**user_to_out(user))
