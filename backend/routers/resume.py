from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from auth.auth import require_student
from db.models import Resume, User
from db.session import get_db
from schemas import ResumeMeta
from serializers import resume_to_meta
from storage import RESUME_DIR, delete_file, save_upload

router = APIRouter(prefix="/api/resume", tags=["resume"])

ALLOWED_RESUME_EXTS = {"pdf", "docx"}


@router.post("/upload", response_model=ResumeMeta)
def upload_resume(
    file: UploadFile = File(...),
    user: User = Depends(require_student),
    db: Session = Depends(get_db),
):
    meta = save_upload(file, RESUME_DIR, ALLOWED_RESUME_EXTS)

    resume = db.query(Resume).filter_by(user_id=user.id).first()
    if resume is not None:
        delete_file(resume.file_path)
    else:
        resume = Resume(user_id=user.id)
        db.add(resume)

    resume.original_name = meta["original_filename"]
    resume.stored_name = meta["filename"]
    resume.file_path = meta["path"]
    resume.content_type = meta["file_type"]
    resume.size_bytes = meta["file_size"]
    resume.uploaded_at = datetime.utcnow()

    db.commit()
    db.refresh(resume)
    return ResumeMeta(**resume_to_meta(resume))


@router.get("", response_model=ResumeMeta)
def get_resume(user: User = Depends(require_student), db: Session = Depends(get_db)):
    resume = db.query(Resume).filter_by(user_id=user.id).first()
    if resume is None:
        raise HTTPException(status_code=404, detail="No resume uploaded yet.")
    return ResumeMeta(**resume_to_meta(resume))


@router.get("/download")
def download_resume(
    user: User = Depends(require_student), db: Session = Depends(get_db)
):
    resume = db.query(Resume).filter_by(user_id=user.id).first()
    if resume is None:
        raise HTTPException(status_code=404, detail="No resume uploaded yet.")
    return FileResponse(resume.file_path, filename=resume.original_name)


@router.delete("")
def delete_resume(
    user: User = Depends(require_student), db: Session = Depends(get_db)
):
    resume = db.query(Resume).filter_by(user_id=user.id).first()
    if resume is None:
        raise HTTPException(status_code=404, detail="No resume to delete.")
    delete_file(resume.file_path)
    db.delete(resume)
    db.commit()
    return {"message": "Resume deleted."}
