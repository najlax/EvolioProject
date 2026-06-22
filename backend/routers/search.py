import json

from fastapi import APIRouter, Depends
from sqlalchemy import func, or_
from sqlalchemy.orm import Session

from auth.auth import get_current_user
from db.models import Project, ShareLink, StudentProfile, User
from db.session import get_db
from schemas import SearchProjectOut, SearchStudentOut

router = APIRouter(prefix="/api/search", tags=["search"])

# Cap result sets so a broad query stays fast.
MAX_RESULTS = 50


def _load_list(raw):
    if not raw:
        return []
    try:
        value = json.loads(raw)
        return value if isinstance(value, list) else []
    except (ValueError, TypeError):
        return []


def _public_tokens(db: Session, user_ids: list[int]) -> dict[int, str]:
    """Map user_id -> public share token for the given users (if any)."""
    if not user_ids:
        return {}
    links = (
        db.query(ShareLink)
        .filter(ShareLink.user_id.in_(user_ids), ShareLink.is_active.is_(True))
        .all()
    )
    tokens = {}
    for link in links:
        if (link.visibility or "public").lower() == "public":
            tokens[link.user_id] = link.token
    return tokens


@router.get("/students", response_model=list[SearchStudentOut])
def search_students(
    q: str = "",
    skill: str = "",
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Case-insensitive partial search over student name, headline and skills.

    `skill` is an optional extra filter. Results are ranked by basic relevance.
    """
    q = (q or "").strip()
    skill = (skill or "").strip()
    if not q and not skill:
        return []

    like = f"%{q.lower()}%"
    query = (
        db.query(User, StudentProfile)
        .outerjoin(StudentProfile, StudentProfile.user_id == User.id)
        .filter(func.lower(User.role) == "student")
    )

    if q:
        query = query.filter(
            or_(
                func.lower(func.coalesce(User.full_name, "")).like(like),
                func.lower(func.coalesce(StudentProfile.headline, "")).like(like),
                func.lower(func.coalesce(StudentProfile.skills_json, "")).like(like),
            )
        )
    if skill:
        query = query.filter(
            func.lower(func.coalesce(StudentProfile.skills_json, "")).like(
                f"%{skill.lower()}%"
            )
        )

    rows = query.limit(200).all()

    ql = q.lower()
    skill_l = skill.lower()
    scored = []
    for u, profile in rows:
        name = (u.full_name or "").strip()
        headline = (profile.headline if profile else "") or ""
        skills = _load_list(profile.skills_json) if profile else []
        skills_lower = [s.lower() for s in skills]

        # If only a skill filter was given, require it to actually match a skill.
        if skill and not any(skill_l in s for s in skills_lower):
            continue

        score = 0
        if ql:
            nl = name.lower()
            if nl == ql:
                score = 100
            elif nl.startswith(ql):
                score = 80
            elif ql in nl:
                score = 60
            elif any(ql == s for s in skills_lower):
                score = 50
            elif any(ql in s for s in skills_lower) or ql in headline.lower():
                score = 40
            else:
                score = 10
        else:
            score = 30  # skill-only search

        scored.append((score, name.lower(), u, profile, skills))

    scored.sort(key=lambda t: (-t[0], t[1]))
    scored = scored[:MAX_RESULTS]

    tokens = _public_tokens(db, [u.id for _, _, u, _, _ in scored])
    return [
        SearchStudentOut(
            id=u.id,
            name=u.full_name or "",
            headline=(profile.headline if profile else "") or "",
            skills=skills,
            share_token=tokens.get(u.id),
        )
        for _, _, u, profile, skills in scored
    ]


@router.get("/projects", response_model=list[SearchProjectOut])
def search_projects(
    q: str = "",
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Case-insensitive partial search over project title, summary, description
    and technologies. Ranked by basic relevance (title matches first)."""
    q = (q or "").strip()
    if not q:
        return []

    like = f"%{q.lower()}%"
    rows = (
        db.query(Project, User)
        .join(User, User.id == Project.user_id)
        .filter(
            or_(
                func.lower(func.coalesce(Project.title, "")).like(like),
                func.lower(func.coalesce(Project.summary, "")).like(like),
                func.lower(func.coalesce(Project.description, "")).like(like),
                func.lower(func.coalesce(Project.tech_stack_json, "")).like(like),
            )
        )
        .limit(200)
        .all()
    )

    ql = q.lower()
    scored = []
    for p, owner in rows:
        title = (p.title or "").lower()
        if title.startswith(ql):
            score = 80
        elif ql in title:
            score = 60
        else:
            score = 40  # matched summary/description/tech only
        scored.append((score, title, p, owner))

    scored.sort(key=lambda t: (-t[0], t[1]))
    scored = scored[:MAX_RESULTS]

    tokens = _public_tokens(db, [owner.id for _, _, _, owner in scored])
    return [
        SearchProjectOut(
            id=p.id,
            title=p.title,
            summary=p.summary or "",
            tech_stack=_load_list(p.tech_stack_json),
            owner_id=owner.id,
            owner_name=owner.full_name or "",
            share_token=tokens.get(owner.id),
        )
        for _, _, p, owner in scored
    ]
