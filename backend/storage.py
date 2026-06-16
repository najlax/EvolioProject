import os
import re
from datetime import datetime

from fastapi import HTTPException, UploadFile


BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
UPLOAD_ROOT = os.path.join(BACKEND_DIR, "uploads")
RESUME_DIR = os.path.join(UPLOAD_ROOT, "resumes")
IMAGE_DIR = os.path.join(UPLOAD_ROOT, "project_images")


UPLOAD_URL_PREFIX = "/uploads"

MAX_FILE_SIZE = 10 * 1024 * 1024

os.makedirs(RESUME_DIR, exist_ok=True)
os.makedirs(IMAGE_DIR, exist_ok=True)


def _safe_filename(name: str) -> str:
    name = os.path.basename(name or "file")
    return re.sub(r"[^A-Za-z0-9._-]", "_", name)


def save_upload(upload: UploadFile, folder: str, allowed_exts: set) -> dict:

    original = upload.filename or "file"
    ext = os.path.splitext(original)[1].lower().lstrip(".")
    if ext not in allowed_exts:
        allowed = ", ".join(sorted(allowed_exts)).upper()
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type '.{ext}'. Allowed types: {allowed}.",
        )

    # Read the file and check size.
    contents = upload.file.read()
    if len(contents) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=413,
            detail="File is too large. Maximum size is 10 MB.",
        )

    safe = _safe_filename(original)
    stamp = datetime.utcnow().strftime("%Y%m%d%H%M%S%f")
    stored_name = f"{stamp}_{safe}"
    path = os.path.join(folder, stored_name)
    with open(path, "wb") as f:
        f.write(contents)

    subfolder = os.path.basename(folder)
    url = f"{UPLOAD_URL_PREFIX}/{subfolder}/{stored_name}"

    return {
        "filename": stored_name,
        "original_filename": original,
        "url": url,
        "path": path,
        "upload_date": datetime.utcnow().isoformat(),
        "file_type": ext,
        "file_size": len(contents),
    }


def delete_file(path: str) -> None:
    try:
        if path and os.path.exists(path):
            os.remove(path)
    except OSError:
        pass
