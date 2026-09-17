from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from src.database.db import (
    get_student_subject, 
    get_student_attendance,
    get_subject_by_code,
    enroll_student_to_subject,
    unenroll_student_to_subject
)

router = APIRouter()

class EnrollRequest(BaseModel):
    subject_code: str

@router.get("/{student_id}/subjects")
async def fetch_student_subjects(student_id: int):
    subjects = get_student_subject(student_id)
    return {"status": "success", "subjects": subjects}

@router.get("/{student_id}/attendance")
async def fetch_student_attendance(student_id: int):
    logs = get_student_attendance(student_id)
    return {"status": "success", "logs": logs}

@router.post("/{student_id}/enroll")
async def enroll_student_endpoint(student_id: int, payload: EnrollRequest):
    # Lookup the subject ID using the provided code
    subject = get_subject_by_code(payload.subject_code)
    if not subject:
        raise HTTPException(status_code=404, detail="Invalid subject code")
    
    # Enroll the student
    result = enroll_student_to_subject(student_id, subject['subject_id'])
    return {"status": "success", "data": result}

@router.delete("/{student_id}/subject/{subject_id}")
async def unenroll_student_endpoint(student_id: int, subject_id: str):
    result = unenroll_student_to_subject(student_id, subject_id)
    return {"status": "success", "data": result}