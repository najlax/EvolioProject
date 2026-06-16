from typing import List, Optional
from pydantic import BaseModel, Field


# Auth

class RegisterRequest(BaseModel):
    name: str
    email: str
    password: str = Field(min_length=8)
    role: str


class LoginRequest(BaseModel):
    email: str
    password: str
    role: Optional[str] = None


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str


class UserOut(BaseModel):
    id: int
    name: str
    email: str
    role: str


# Profile

class ProfileIn(BaseModel):
    name: str = ""
    headline: str = ""
    bio: str = ""
    skills: List[str] = []
    location: str = ""
    github: str = ""
    linkedin: str = ""
    contact_email: str = ""
    availability: str = "Open to work"


class ProfileOut(ProfileIn):
    user_id: int



# Resume

class ResumeMeta(BaseModel):
    filename: str            
    original_filename: str   
    url: str                 
    upload_date: str
    file_type: str
    file_size: int           


# Projects

class ProjectIn(BaseModel):
    title: str
    summary: str = ""
    description: str = ""
    content: str = ""             
    tech_stack: List[str] = []
    github_link: str = ""
    demo_link: str = ""
    status: str = "Draft"        
    featured: bool = False
    collaborators: List[str] = []  


class ProjectOut(ProjectIn):
    id: int
    owner_id: int


class ProjectContentIn(BaseModel):
    content: str = ""


# Project images

class ImageMeta(BaseModel):
    id: int
    project_id: int
    filename: str
    original_filename: str
    url: str
    upload_date: str
    file_type: str
    file_size: int


# Share links

class ShareLinkIn(BaseModel):
    visibility: str = "public"
    expires_at: Optional[str] = None


class ShareLinkOut(BaseModel):
    token: str
    url: str
    visibility: str
    expires_at: Optional[str] = None


class ShareSettingsIn(BaseModel):
    visibility: Optional[str] = None
    expires_at: Optional[str] = None


# Review workflow


class ReviewSubmit(BaseModel):
    message: str = ""


class ReviewFeedbackItem(BaseModel):
    reviewer: str
    status: str
    comment: str
    date: str


class ReviewStatusOut(BaseModel):
    status: str


class ReviewFeedbackOut(BaseModel):
    status: str
    feedback: List[ReviewFeedbackItem] = []
