from pydantic import BaseModel, Field
from typing import List, Optional

class StudentDetectionResult(BaseModel):
    student_id: int
    name: str
    status: str  # "Present" | "Absent"
    source: str  # e.g., "Photo 1, Photo 2" or "-"

class AttendanceLogEntry(BaseModel):
    student_id: int
    subject_id: str
    timestamp: str
    is_present: bool

class ClassroomScanRequest(BaseModel):
    subject_id: str
    images: List[str] = Field(..., description="List of base64 image strings")
    auto_commit: bool = Field(False, description="Persist attendance logs directly to Supabase")

class ClassroomScanResponse(BaseModel):
    total_images_processed: int
    total_enrolled: int
    present_count: int
    absent_count: int
    results: List[StudentDetectionResult]
    attendance_logs: List[AttendanceLogEntry]

class StudentFaceScanRequest(BaseModel):
    image: str = Field(..., description="Single base64 image string")

class StudentFaceScanResponse(BaseModel):
    match_found: bool
    num_faces: int
    student_id: Optional[int] = None
    student_data: Optional[dict] = None
    message: str