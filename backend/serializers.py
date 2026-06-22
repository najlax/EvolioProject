import json
import os
from datetime import datetime



def _load_list(raw):
    if not raw:
        return []
    try:
        value = json.loads(raw)
        return value if isinstance(value, list) else []
    except (ValueError, TypeError):
        return []


def _dump_list(value):
    return json.dumps(value or [])


def _iso(value):
    if isinstance(value, datetime):
        return value.isoformat()
    return str(value) if value else ""


def _ext(name):
    return os.path.splitext(name or "")[1].lstrip(".").lower()


def user_to_out(user):
    return {
        "id": user.id,
        "name": user.full_name or "",
        "email": user.email,
        "role": (user.role or "").lower(),
        "status": (user.status or "active").lower(),
    }


def profile_to_out(profile, user):
    return {
        "user_id": user.id,
        "name": user.full_name or "",
        "headline": profile.headline or "",
        "bio": profile.bio or "",
        "skills": _load_list(profile.skills_json),
        "location": profile.location or "",
        "github": profile.github or "",
        "linkedin": profile.linkedin or "",
        "contact_email": profile.contact_email or "",
        "availability": profile.availability or "Available",
    }


def project_to_out(project):
    return {
        "id": project.id,
        "owner_id": project.user_id,
        "title": project.title,
        "summary": project.summary or "",
        "description": project.description or "",
        "content": project.content or "",
        "tech_stack": _load_list(project.tech_stack_json),
        "github_link": project.github_link or "",
        "demo_link": project.demo_link or "",
        "status": project.status or "Draft",
        "featured": bool(project.is_featured),
        "collaborators": _load_list(project.collaborators_json),
        # Screenshot URLs so portfolio views can show project images.
        "images": [
            f"/uploads/project_images/{img.stored_name}"
            for img in (project.images or [])
        ],
    }


def resume_to_meta(resume):
    return {
        "filename": resume.stored_name,
        "original_filename": resume.original_name,
        "url": f"/uploads/resumes/{resume.stored_name}",
        "upload_date": _iso(resume.uploaded_at or resume.created_at),
        "file_type": _ext(resume.original_name),
        "file_size": resume.size_bytes or 0,
    }


def image_to_meta(image):
    return {
        "id": image.id,
        "project_id": image.project_id,
        "filename": image.stored_name,
        "original_filename": image.original_name,
        "url": f"/uploads/project_images/{image.stored_name}",
        "upload_date": _iso(image.created_at),
        "file_type": _ext(image.original_name),
        "file_size": image.size_bytes or 0,
    }
