from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session

from auth.auth import require_student
from db.models import Project, ProjectImage, User
from db.session import get_db
from schemas import ImageMeta
from serializers import image_to_meta
from storage import IMAGE_DIR, delete_file, save_upload

router = APIRouter(prefix="/api/projects", tags=["project-images"])

ALLOWED_IMAGE_EXTS = {"png", "jpg", "jpeg"}


def _require_owned_project(project_id: int, user: User, db: Session) -> Project:
    project = db.get(Project, project_id)
    if project is None:
        raise HTTPException(status_code=404, detail="Project not found.")
    if project.user_id != user.id:
        raise HTTPException(
            status_code=403,
            detail="You can only manage images on your own projects.",
        )
    return project


@router.post("/{project_id}/images", response_model=ImageMeta)
def upload_image(
    project_id: int,
    file: UploadFile = File(...),
    user: User = Depends(require_student),
    db: Session = Depends(get_db),
):
    _require_owned_project(project_id, user, db)

    meta = save_upload(file, IMAGE_DIR, ALLOWED_IMAGE_EXTS)
    image = ProjectImage(
        project_id=project_id,
        original_name=meta["original_filename"],
        stored_name=meta["filename"],
        file_path=meta["path"],
        content_type=meta["file_type"],
        size_bytes=meta["file_size"],
    )
    db.add(image)
    db.commit()
    db.refresh(image)
    return ImageMeta(**image_to_meta(image))


@router.get("/{project_id}/images", response_model=list[ImageMeta])
def list_images(
    project_id: int, user: User = Depends(require_student), db: Session = Depends(get_db)
):
    _require_owned_project(project_id, user, db)
    images = db.query(ProjectImage).filter_by(project_id=project_id).all()
    return [ImageMeta(**image_to_meta(img)) for img in images]


@router.delete("/{project_id}/images/{image_id}")
def delete_image(
    project_id: int,
    image_id: int,
    user: User = Depends(require_student),
    db: Session = Depends(get_db),
):
    _require_owned_project(project_id, user, db)
    image = db.get(ProjectImage, image_id)
    if image is None or image.project_id != project_id:
        raise HTTPException(status_code=404, detail="Image not found.")
    delete_file(image.file_path)
    db.delete(image)
    db.commit()
    return {"message": "Image deleted."}
