import json

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from auth.auth import require_student
from db.models import Project, ShareLink, StudentProfile, User
from db.session import get_db
from schemas import (
    ChatbotRequest,
    ChatbotResponse,
    ExtractSkillsOut,
    PortfolioSummaryOut,
)
from services.ai_service import AIService, AIServiceError, merge_unique

router = APIRouter(prefix="/api/ai", tags=["ai"])

ai_service = AIService()


def _load_list(raw):
    if not raw:
        return []
    try:
        value = json.loads(raw)
        return value if isinstance(value, list) else []
    except (ValueError, TypeError):
        return []


def _get_or_create_profile(db: Session, user: User) -> StudentProfile:
    profile = db.query(StudentProfile).filter_by(user_id=user.id).first()
    if profile is None:
        profile = StudentProfile(user_id=user.id, contact_email=user.email)
        db.add(profile)
        db.commit()
        db.refresh(profile)
    return profile


@router.post(
    "/projects/{project_id}/extract-skills", response_model=ExtractSkillsOut
)
def extract_project_skills(
    project_id: int,
    user: User = Depends(require_student),
    db: Session = Depends(get_db),
):
    """Extract skills from a project with Gemini and link them to the project
    and the student's profile (de-duplicated)."""
    project = db.get(Project, project_id)
    if project is None:
        raise HTTPException(status_code=404, detail="Project not found.")
    if project.user_id != user.id:
        raise HTTPException(
            status_code=403, detail="You can only analyze your own projects."
        )

    technologies = _load_list(project.tech_stack_json)

    try:
        skills = ai_service.extract_skills(
            project.title, project.description, technologies
        )
    except AIServiceError as exc:
        # Soft failure: the project itself is untouched and still valid.
        raise HTTPException(status_code=503, detail=str(exc))

    # Persist the project's skills.
    project.skills_json = json.dumps(skills)

    # Merge the new skills into the student's profile (no duplicates).
    profile = _get_or_create_profile(db, user)
    merged = merge_unique(_load_list(profile.skills_json), skills)
    profile.skills_json = json.dumps(merged)

    db.commit()
    return ExtractSkillsOut(skills=skills, profile_skills=merged)


@router.post("/portfolio-summary", response_model=PortfolioSummaryOut)
def generate_portfolio_summary(
    user: User = Depends(require_student),
    db: Session = Depends(get_db),
):
    """Generate and store a short AI portfolio summary for the student."""
    profile = _get_or_create_profile(db, user)
    projects = db.query(Project).filter_by(user_id=user.id).all()

    skills = _load_list(profile.skills_json)
    project_lines = [
        f"- {p.title}: {p.summary or p.description or ''}".strip() for p in projects
    ]
    profile_text = (
        f"Name: {user.full_name or ''}\n"
        f"Headline: {profile.headline or ''}\n"
        f"Bio: {profile.bio or ''}\n"
        f"Skills: {', '.join(skills)}\n"
        f"Projects:\n" + ("\n".join(project_lines) if project_lines else "None")
    )

    try:
        summary = ai_service.generate_portfolio_summary(profile_text)
    except AIServiceError as exc:
        raise HTTPException(status_code=503, detail=str(exc))

    if not summary:
        raise HTTPException(
            status_code=503, detail="The AI service returned an empty summary."
        )

    profile.ai_summary = summary
    db.commit()
    return PortfolioSummaryOut(summary=summary)


def _build_student_context(
    db: Session, user: User, profile: StudentProfile | None
) -> str:
    """Assemble a read-only text context from a student's profile + projects."""
    skills = _load_list(profile.skills_json) if profile else []
    lines = [
        f"Name: {user.full_name or 'N/A'}",
        f"Headline: {(profile.headline if profile else '') or 'N/A'}",
        f"Location: {(profile.location if profile else '') or 'N/A'}",
        f"Availability: {(profile.availability if profile else '') or 'N/A'}",
        f"Bio: {(profile.bio if profile else '') or 'N/A'}",
        f"Skills: {', '.join(skills) if skills else 'N/A'}",
        "Projects:",
    ]

    projects = db.query(Project).filter_by(user_id=user.id).all()
    if not projects:
        lines.append("  None")
    for i, p in enumerate(projects, start=1):
        tech = _load_list(p.tech_stack_json)
        lines.append(f"  {i}) {p.title}")
        if p.summary:
            lines.append(f"     Summary: {p.summary}")
        if p.description:
            lines.append(f"     Description: {p.description}")
        if tech:
            lines.append(f"     Technologies: {', '.join(tech)}")
        if p.github_link:
            lines.append(f"     GitHub: {p.github_link}")
        if p.demo_link:
            lines.append(f"     Demo: {p.demo_link}")
    return "\n".join(lines)


@router.post("/chatbot/student/{student_id}", response_model=ChatbotResponse)
def portfolio_chatbot(
    student_id: int,
    data: ChatbotRequest,
    db: Session = Depends(get_db),
):
    """Answer an employer's question about a student using ONLY their data.

    Public, but only for students who have an active public portfolio link
    (mirrors the existing public-portfolio access model). Read-only.
    """
    question = (data.question or "").strip()
    if not question:
        raise HTTPException(status_code=400, detail="Please enter a question.")

    user = db.get(User, student_id)
    if user is None or (user.role or "").lower() != "student":
        raise HTTPException(status_code=404, detail="Student portfolio not found.")

    # Only expose data for students with a public, active share link.
    share = (
        db.query(ShareLink)
        .filter_by(user_id=user.id, is_active=True)
        .first()
    )
    if share is None or (share.visibility or "public").lower() != "public":
        raise HTTPException(status_code=404, detail="This portfolio is not public.")

    profile = db.query(StudentProfile).filter_by(user_id=user.id).first()
    context = _build_student_context(db, user, profile)

    history = [{"role": t.role, "text": t.text} for t in (data.history or [])]

    try:
        answer = ai_service.answer_portfolio_question(context, question, history)
    except AIServiceError as exc:
        raise HTTPException(status_code=503, detail=str(exc))

    return ChatbotResponse(answer=answer)
