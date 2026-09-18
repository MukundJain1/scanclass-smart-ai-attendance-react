from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from src.database.db import get_teacher_subject, create_subject, get_attendance_for_teacher, check_if_code_exists_in_db, delete_subject_from_db
from typing import Union 

router = APIRouter()

class SubjectCreateRequest(BaseModel):
    subject_code: str
    name: str
    section: str
    teacher_id: Union[int, str]

@router.post("/subjects")
async def add_new_subject(payload: SubjectCreateRequest):
    # 1. NEW: Check if the course code already exists in the database
    existing_subject = check_if_code_exists_in_db(payload.subject_code) # Replace with your actual DB lookup function
    
    if existing_subject:
        # Throw a 400 error that the React frontend will catch and show in the Dialog box
        raise HTTPException(status_code=400, detail=f"Course code '{payload.subject_code}' is already taken. Please use a unique code.")
    
    # 2. Proceed with creation if unique
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

@router.delete("/{teacher_id}/subjects/{subject_id}")
async def delete_teacher_subject(teacher_id: str, subject_id: str):
    # Replace with your actual DB deletion function
    # Make sure your DB function also deletes/cascades the associated attendance records!
    success = delete_subject_from_db(teacher_id, subject_id) 
    
    if not success:
        raise HTTPException(status_code=400, detail="Failed to delete subject.")
        
    return {"status": "success", "message": "Module deleted permanently."}