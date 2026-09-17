from fastapi import APIRouter, HTTPException, status
from datetime import datetime
from typing import Dict, List

from schemas.attendance import (
    ClassroomScanRequest,
    ClassroomScanResponse,
    StudentDetectionResult,
    AttendanceLogEntry,
    StudentFaceScanRequest,
    StudentFaceScanResponse,
)
from utils.image_utils import decode_base64_to_rgb_array

# Import your existing pipeline and database client
from src.pipelines.face_pipeline import predict_attendance
from src.database.config import supabase
from src.database.db import to_dict_list

router = APIRouter()

@router.post("/teacher/scan-classroom", response_model=ClassroomScanResponse)
async def scan_classroom_photos(payload: ClassroomScanRequest):
    if not payload.images:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No images provided for attendance scanning."
        )

    all_detected_ids: Dict[int, List[str]] = {}

    # 1. Process all photos through the face pipeline
    for idx, b64_img in enumerate(payload.images):
        img_np = decode_base64_to_rgb_array(b64_img)
        detected, _, _ = predict_attendance(img_np)

        if detected:
            for sid in detected.keys():
                stud_id = int(sid)
                all_detected_ids.setdefault(stud_id, []).append(f"Photo {idx + 1}")

    # 2. Query enrolled students for this subject from Supabase
    enrolled_res = (
        supabase.table("subject_students")
        .select("*, students(*)")
        .eq("subject_id", payload.subject_id)
        .execute()
    )
    enrolled_students = to_dict_list(enrolled_res.data)

    if not enrolled_students:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No students enrolled in this subject."
        )

    results: List[StudentDetectionResult] = []
    attendance_logs: List[AttendanceLogEntry] = []
    current_time = datetime.now().strftime("%Y-%m-%dT%H:%M:%S")

    present_count = 0

    # 3. Correlate detections with enrolled students
    for item in enrolled_students:
        student = item.get("students")
        if not student:
            continue

        stud_id = int(student["student_id"])
        sources = all_detected_ids.get(stud_id, [])
        is_present = len(sources) > 0

        if is_present:
            present_count += 1

        results.append(
            StudentDetectionResult(
                student_id=stud_id,
                name=student["name"],
                status="Present" if is_present else "Absent",
                source=", ".join(sources) if is_present else "-",
            )
        )

        attendance_logs.append(
            AttendanceLogEntry(
                student_id=stud_id,
                subject_id=payload.subject_id,
                timestamp=current_time,
                is_present=is_present,
            )
        )

    # 4. Save to database if auto_commit is requested
    if payload.auto_commit and attendance_logs:
        supabase.table("attendance_logs").insert(
            [log.model_dump() for log in attendance_logs]
        ).execute()

    return ClassroomScanResponse(
        total_images_processed=len(payload.images),
        total_enrolled=len(enrolled_students),
        present_count=present_count,
        absent_count=len(enrolled_students) - present_count,
        results=results,
        attendance_logs=attendance_logs,
    )


@router.post("/student/verify-face", response_model=StudentFaceScanResponse)
async def verify_student_face(payload: StudentFaceScanRequest):
    img_np = decode_base64_to_rgb_array(payload.image)

    detected, all_ids, num_faces = predict_attendance(img_np)

    if num_faces == 0:
        return StudentFaceScanResponse(
            match_found=False,
            num_faces=0,
            message="No face detected. Please center your face in the camera frame."
        )

    if num_faces > 1:
        return StudentFaceScanResponse(
            match_found=False,
            num_faces=num_faces,
            message="Multiple faces detected. Ensure only one person is in frame."
        )

    if not detected:
        return StudentFaceScanResponse(
            match_found=False,
            num_faces=1,
            message="Face not recognized. New student registration required."
        )

    matched_student_id = int(list(detected.keys())[0])

    # Fetch student metadata from Supabase
    res = (
        supabase.table("students")
        .select("*")
        .eq("student_id", matched_student_id)
        .execute()
    )
    students = to_dict_list(res.data)

    if not students:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student ID recognized in model but not found in database."
        )

    return StudentFaceScanResponse(
        match_found=True,
        num_faces=1,
        student_id=matched_student_id,
        student_data=students[0],
        message=f"Welcome back, {students[0]['name']}!"
    )