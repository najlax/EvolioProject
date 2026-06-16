import json

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from auth.auth import require_student
from db.models import Project, User
from db.session import get_db
from schemas import ProjectContentIn, ProjectIn, ProjectOut
from serializers import project_to_out
from storage import delete_file

router = APIRouter(prefix="/api/projects", tags=["projects"])


def _get_owned_project(project_id: int, user: User, db: Session) -> Project:
    """Fetch a project and make sure it belongs to the current student."""
    project = db.get(Project, project_id)
    if project is None:
        raise HTTPException(status_code=404, detail="Project not found.")
    if project.user_id != user.id:
        raise HTTPException(
            status_code=403, detail="You can only access your own projects."
        )
    return project


def _apply_fields(project: Project, data: ProjectIn) -> None:
    project.title = data.title
    project.summary = data.summary
    project.description = data.description
    project.content = data.content
    project.tech_stack_json = json.dumps(data.tech_stack or [])
    project.github_link = data.github_link
    project.demo_link = data.demo_link
    project.status = data.status
    project.is_featured = data.featured
    project.collaborators_json = json.dumps(data.collaborators or [])


@router.get("", response_model=list[ProjectOut])
def list_projects(user: User = Depends(require_student), db: Session = Depends(get_db)):
    projects = db.query(Project).filter_by(user_id=user.id).all()
    return [ProjectOut(**project_to_out(p)) for p in projects]


@router.get("/{project_id}", response_model=ProjectOut)
def get_project(
    project_id: int, user: User = Depends(require_student), db: Session = Depends(get_db)
):
    return ProjectOut(**project_to_out(_get_owned_project(project_id, user, db)))


@router.post("", response_model=ProjectOut)
def create_project(
    data: ProjectIn, user: User = Depends(require_student), db: Session = Depends(get_db)
):
    project = Project(user_id=user.id)
    _apply_fields(project, data)
    db.add(project)
    db.commit()
    db.refresh(project)
    return ProjectOut(**project_to_out(project))


@router.put("/{project_id}", response_model=ProjectOut)
def update_project(
    project_id: int,
    data: ProjectIn,
    user: User = Depends(require_student),
    db: Session = Depends(get_db),
):
    project = _get_owned_project(project_id, user, db)
    _apply_fields(project, data)
    db.commit()
    db.refresh(project)
    return ProjectOut(**project_to_out(project))


@router.delete("/{project_id}")
def delete_project(
    project_id: int, user: User = Depends(require_student), db: Session = Depends(get_db)
):
    project = _get_owned_project(project_id, user, db)
    for image in project.images:
        delete_file(image.file_path)
    db.delete(project)
    db.commit()
    return {"message": "Project deleted."}


@router.put("/{project_id}/content", response_model=ProjectOut)
def save_project_content(
    project_id: int,
    data: ProjectContentIn,
    user: User = Depends(require_student),
    db: Session = Depends(get_db),
):
    """Save the rich text / Markdown editor content for a project."""
    project = _get_owned_project(project_id, user, db)
    project.content = data.content
    db.commit()
    db.refresh(project)
    return ProjectOut(**project_to_out(project))
