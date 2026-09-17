from typing import Any
import bcrypt

from src.database.config import supabase


def to_dict_list(data) -> list[dict[str, Any]]:
    """Normalize a Supabase response.data payload (typed as List[JSON]) into
    a clean list[dict[str, Any]]. Any element that isn't a dict is dropped,
    since a row that comes back as something else indicates malformed data
    and can't be safely used downstream anyway.
    """
    return [row for row in (data or []) if isinstance(row, dict)]


def to_dict(data) -> dict[str, Any] | None:
    """Same idea as to_dict_list, but for callers that only want the first
    row (e.g. login lookups, single-row inserts)."""
    rows = to_dict_list(data)
    return rows[0] if rows else None


def hash_pass(pwd):
    # pwd.encode() -> binary form because bcrypt takes input as binary.
    # bcrypt generates a random salt and mixes it into the hash.
    return bcrypt.hashpw(pwd.encode(), bcrypt.gensalt()).decode()


def check_pass(pwd, hashpwd):
    return bcrypt.checkpw(pwd.encode(), hashpwd.encode())


def check_teacher_exist(username) -> bool:
    response = supabase.table("teachers").select("username").eq("username", username).execute()
    return len(to_dict_list(response.data)) > 0


def create_teacher(username, password, name) -> dict[str, Any] | None:
    data = {"username": username, "password": hash_pass(password), "name": name}
    response = supabase.table("teachers").insert(data).execute()
    return to_dict(response.data)


def teacher_login(username, password) -> dict[str, Any] | None:
    response = supabase.table("teachers").select("*").eq("username", username).execute()

    teacher = to_dict(response.data)
    if teacher and check_pass(password, teacher['password']):
        return teacher

    return None


def get_all_students() -> list[dict[str, Any]]:
    response = supabase.table("students").select("*").execute()
    return to_dict_list(response.data)


def create_student(new_name, face_emb, voice_emb=None) -> dict[str, Any] | None:
    data = {'name': new_name, 'face_embedding': face_emb, "voice_embedding": voice_emb}
    response = supabase.table('students').insert(data).execute()
    return to_dict(response.data)


def create_subject(subject_code, subject_name, subject_section, teacher_id) -> dict[str, Any] | None:
    data = {
        "subject_code": subject_code,
        "name": subject_name,
        "section": subject_section,
        "teacher_id": teacher_id,
    }
    response = supabase.table("subjects").insert(data).execute()
    return to_dict(response.data)


def get_teacher_subject(teacher_id) -> list[dict[str, Any]]:
    response = (
        supabase.table('subjects')
        .select("*, subject_students!subject_id(count), attendance_logs!subject_id(timestamp)")
        .eq("teacher_id", teacher_id)
        .execute()
    )

    subjects = to_dict_list(response.data)

    for sub in subjects:
        student_rows = to_dict_list(sub.get('subject_students'))
        sub['total_students'] = student_rows[0].get('count', 0) if student_rows else 0

        attendance = to_dict_list(sub.get('attendance_logs'))
        unique_sessions = len({log.get('timestamp') for log in attendance if log.get('timestamp')})
        sub['total_classes'] = unique_sessions

        sub.pop('subject_students', None)
        sub.pop('attendance_logs', None)

    return subjects


def enroll_student_to_subject(student_id, subject_id) -> list[dict[str, Any]]:
    data = {'student_id': student_id, 'subject_id': subject_id}
    response = supabase.table('subject_students').insert(data).execute()
    return to_dict_list(response.data)


def unenroll_student_to_subject(student_id, subject_id) -> list[dict[str, Any]]:
    response = (
        supabase.table('subject_students')
        .delete()
        .eq('student_id', student_id)
        .eq('subject_id', subject_id)
        .execute()
    )
    return to_dict_list(response.data)


def get_student_subject(student_id) -> list[dict[str, Any]]:
    response = (
        supabase.table('subject_students')
        .select('*, subjects(*)')
        .eq('student_id', student_id)
        .execute()
    )
    return to_dict_list(response.data)


def get_student_attendance(student_id) -> list[dict[str, Any]]:
    response = (
        supabase.table('attendance_logs')
        .select('*, subjects(*)')
        .eq('student_id', student_id)
        .execute()
    )
    return to_dict_list(response.data)


def create_attendance(logs) -> list[dict[str, Any]]:
    response = supabase.table('attendance_logs').insert(logs).execute()
    return to_dict_list(response.data)

def get_attendance_for_teacher(teacher_id) -> list[dict[str, Any]]:
    response = supabase.table('attendance_logs').select("*, subjects!inner(*)").eq('subjects.teacher_id', teacher_id).execute()
    return to_dict_list(response.data)

def get_subject_by_code(subject_code: str) -> dict[str, Any] | None:
    """Lookup subject metadata using the join code (needed for QR & share-link joins)."""
    response = (
        supabase.table("subjects")
        .select("*")
        .eq("subject_code", subject_code.strip())
        .execute()
    )
    return to_dict(response.data)


def get_enrolled_students(subject_id: str) -> list[dict[str, Any]]:
    """Fetch all students enrolled in a specific subject."""
    response = (
        supabase.table("subject_students")
        .select("*, students(*)")
        .eq("subject_id", subject_id)
        .execute()
    )
    return to_dict_list(response.data)


def get_student_by_id(student_id: int) -> dict[str, Any] | None:
    """Retrieve student record by ID for facial recognition auth lookup."""
    response = (
        supabase.table("students")
        .select("*")
        .eq("student_id", student_id)
        .execute()
    )
    return to_dict(response.data)