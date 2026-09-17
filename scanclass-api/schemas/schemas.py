from pydantic import BaseModel
from typing import List, Optional

class LoginRequest(BaseModel):
    username: str
    password: str

class TeacherResponse(BaseModel):
    teacher_id: str
    name: str
    username: str

class SubjectCard(BaseModel):
    subject_id: str
    name: str
    subject_code: str
    section: str
    total_students: int
    total_classes: int

class ImageScanRequest(BaseModel):
    subject_id: str
    images_base64: List[str] # React will send webcam frames as base64 strings