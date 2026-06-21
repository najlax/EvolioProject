from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from db.session import init_db
from storage import UPLOAD_ROOT
from routers import (
    applications,
    auth_routes,
    image,
    profile,
    project,
    resume,
    review,
    share,
)

init_db()

app = FastAPI(title="Evolio Backend", version="1.0.0")

# --- CORS: allow the local React (Vite) dev server -------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Routers ----------------------------------------------------------------
app.include_router(auth_routes.router)
app.include_router(profile.router)
app.include_router(resume.router)
app.include_router(project.router)
app.include_router(image.router)
app.include_router(share.router)
app.include_router(review.router)
app.include_router(applications.router)

app.mount("/uploads", StaticFiles(directory=UPLOAD_ROOT), name="uploads")

@app.get("/")
def root():
    return {"message": "Hello"}

@app.get("/api/health", tags=["health"])
def health():
    return {"status": "ok"}
