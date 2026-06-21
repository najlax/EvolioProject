import secrets
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from auth.auth import (
    create_access_token,
    get_current_user,
    get_user_by_email,
    hash_password,
    verify_password,
)
from db.models import Application, PasswordResetToken, User
from db.session import get_db
from schemas import (
    ForgotPasswordRequest,
    LoginRequest,
    MessageOut,
    RegisterOut,
    RegisterRequest,
    ResetPasswordRequest,
    TokenResponse,
    UserOut,
)
from serializers import user_to_out

router = APIRouter(prefix="/api/auth", tags=["auth"])

# How long a password-reset token stays valid.
RESET_TOKEN_TTL_HOURS = 1

# Roles a user may APPLY for at signup. Admin is intentionally excluded so it
# can never be self-assigned.
APPLICABLE_ROLES = {"employer", "coach"}

# Map any aliases coming from the UI to the canonical role names.
ACCOUNT_TYPE_ALIASES = {"career coach": "coach", "career_coach": "coach"}


@router.post("/register", response_model=RegisterOut)
def register(data: RegisterRequest, db: Session = Depends(get_db)):
    # SECURITY: privileges are never taken from the client.
    #  - "student"            -> account is created and activated immediately.
    #  - "employer" / "coach" -> account is created with status="pending" and a
    #    pending application; the role's privileges are only unlocked after an
    #    admin approves it.
    #  - anything else (incl. "admin") -> treated as a normal student.
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

    account_type = (data.account_type or "student").strip().lower()
    account_type = ACCOUNT_TYPE_ALIASES.get(account_type, account_type)
    is_application = account_type in APPLICABLE_ROLES

    user = User(
        email=data.email,
        full_name=data.name,
        password_hash=hash_password(data.password),
        # Applicants carry their requested role but stay "pending" until an
        # admin approves; students are active students right away.
        role=account_type if is_application else "student",
        status="pending" if is_application else "active",
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    application_status = "none"
    if is_application:
        application = Application(
            user_id=user.id,
            requested_role=account_type,
            organization=data.organization or "",
            message=data.message or "",
            status="pending",
        )
        db.add(application)
        db.commit()
        application_status = "pending"

    out = user_to_out(user)
    return RegisterOut(**out, application_status=application_status)


@router.post("/login", response_model=TokenResponse)
def login(data: LoginRequest, db: Session = Depends(get_db)):
    user = get_user_by_email(db, data.email)
    if user is None or not verify_password(data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password.")

    role = (user.role or "").lower()
    account_status = (user.status or "active").lower()
    token = create_access_token({"sub": str(user.id), "role": role})
    return TokenResponse(access_token=token, role=role, status=account_status)


@router.get("/me", response_model=UserOut)
def me(user: User = Depends(get_current_user)):
    return UserOut(**user_to_out(user))


# ---------------------------------------------------------------------------
# Forgot / reset password
# ---------------------------------------------------------------------------

# A single, generic response so we never reveal whether an email is registered.
_GENERIC_RESET_MESSAGE = (
    "If an account exists for that email, we've sent password reset "
    "instructions to it."
)


@router.post("/forgot-password", response_model=MessageOut)
def forgot_password(data: ForgotPasswordRequest, db: Session = Depends(get_db)):
    """Start a password reset.

    Always returns the same success message regardless of whether the email
    exists, so attackers cannot use this endpoint to discover valid accounts.
    """
    user = get_user_by_email(db, data.email)
    if user is not None:
        token = secrets.token_urlsafe(32)
        reset = PasswordResetToken(
            user_id=user.id,
            token=token,
            expires_at=datetime.utcnow() + timedelta(hours=RESET_TOKEN_TTL_HOURS),
        )
        db.add(reset)
        db.commit()
        # In a real deployment this token would be emailed to the user.
        # We log it server-side so the reset flow can be completed/tested.
        print(f"[password-reset] token for {user.email}: {token}")

    return MessageOut(message=_GENERIC_RESET_MESSAGE)


@router.post("/reset-password", response_model=MessageOut)
def reset_password(data: ResetPasswordRequest, db: Session = Depends(get_db)):
    """Finish a password reset using a valid, unused, unexpired token."""
    reset = (
        db.query(PasswordResetToken)
        .filter_by(token=data.token, used=False)
        .first()
    )
    if reset is None or reset.expires_at < datetime.utcnow():
        raise HTTPException(
            status_code=400, detail="This reset link is invalid or has expired."
        )

    user = db.get(User, reset.user_id)
    if user is None:
        raise HTTPException(status_code=400, detail="Account no longer exists.")

    user.password_hash = hash_password(data.new_password)
    reset.used = True
    db.commit()
    return MessageOut(message="Your password has been reset. You can now sign in.")
