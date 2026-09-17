from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from src.database.db import get_teacher_subject, create_subject, get_attendance_for_teacher
from typing import Union

router = APIRouter()

class SubjectCreateRequest(BaseModel):
    subject_code: str
    name: str
    section: str
    teacher_id: Union[int, str]

@router.post("/subjects")
async def add_new_subject(payload: SubjectCreateRequest):
    new_subject = create_subject(
        payload.subject_code, 
        payload.name, 
        payload.section, 
        payload.teacher_id
    )
    if not new_subject:
        raise HTTPException(status_code=400, detail="Failed to create subject")
    return {"status": "success", "subject": new_subject}

# Change teacher_id type from int to str in the route parameters
@router.get("/{teacher_id}/subjects")
async def fetch_teacher_subjects(teacher_id: str):
    subjects = get_teacher_subject(teacher_id)
    return {"status": "success", "subjects": subjects}

@router.get("/{teacher_id}/attendance-records")
async def fetch_teacher_attendance_records(teacher_id: str):
    records = get_attendance_for_teacher(teacher_id)
    return {"status": "success", "records": records}