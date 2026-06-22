from typing import List, Optional
from pydantic import BaseModel, Field


# Auth

class RegisterRequest(BaseModel):
    name: str
    email: str
    password: str = Field(min_length=8)
    # Chosen on the account-type selection step: "student" (default),
    # "employer" or "coach". Student accounts are activated immediately;
    # employer/coach create a PENDING application that an admin must approve.
    # The role/privileges are never self-assigned here.
    account_type: str = "student"
    # Extra application details (employer/coach only).
    organization: str = ""   # company name (employer) / area of focus (coach)
    message: str = ""        # motivation / extra context


class RegisterOut(BaseModel):
    id: int
    name: str
    email: str
    role: str
    status: str                       # "active" or "pending"
    application_status: str = "none"  # "none" | "pending"


class LoginRequest(BaseModel):
    email: str
    password: str
    role: Optional[str] = None


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    status: str = "active"


class UserOut(BaseModel):
    id: int
    name: str
    email: str
    role: str
    status: str = "active"


class MessageOut(BaseModel):
    message: str


class ForgotPasswordRequest(BaseModel):
    email: str


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str = Field(min_length=8)


# AI features

class ExtractSkillsOut(BaseModel):
    skills: List[str] = []          # skills extracted for this project
    profile_skills: List[str] = []  # the student's merged, de-duplicated skills


class PortfolioSummaryOut(BaseModel):
    summary: str


class ChatTurn(BaseModel):
    role: str   # "user" or "bot"
    text: str


class ChatbotRequest(BaseModel):
    question: str = Field(min_length=1, max_length=500)
    # Prior conversation so the bot can handle follow-up questions.
    history: List[ChatTurn] = []


class ChatbotResponse(BaseModel):
    answer: str


# Search

class SearchStudentOut(BaseModel):
    id: int
    name: str = ""
    headline: str = ""
    skills: List[str] = []
    share_token: Optional[str] = None  # set when a public portfolio link exists


class SearchProjectOut(BaseModel):
    id: int
    title: str
    summary: str = ""
    tech_stack: List[str] = []
    owner_id: int
    owner_name: str = ""
    share_token: Optional[str] = None  # owner's public portfolio link, if any


# Employer / coach applications

class ApplicationOut(BaseModel):
    id: int
    user_id: int
    user_name: str = ""
    user_email: str = ""
    requested_role: str
    organization: str = ""
    message: str = ""
    status: str
    created_at: str = ""


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
    availability: str = "Available"


class ProfileOut(ProfileIn):
    user_id: int
    ai_summary: str = ""  # read-only; generated via the AI summary feature



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
    images: List[str] = []


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
