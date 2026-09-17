from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
from src.database.db import teacher_login, create_teacher, check_teacher_exist
from fastapi import Form, UploadFile, File
from utils.image_utils import decode_base64_to_rgb_array
from src.pipelines.face_pipeline import get_face_embeddings, train_classifier
from src.database.db import create_student
from src.pipelines.voice_recognition_pipeline import get_voice_embedding

router = APIRouter()

# 1. Dedicated schema for Login (no name required)
class TeacherLoginRequest(BaseModel):
    username: str
    password: str

# 2. Dedicated schema for Registration (name is strictly required)
class TeacherRegisterRequest(BaseModel):
    username: str
    password: str
    name: str

@router.post("/login/teacher")
async def login_teacher_endpoint(payload: TeacherLoginRequest):
    teacher = teacher_login(payload.username, payload.password)
    if not teacher:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password"
        )
    return {"status": "success", "teacher": teacher}

@router.post("/register/teacher")
async def register_teacher_endpoint(payload: TeacherRegisterRequest):
    # The name check is no longer needed here because Pydantic handles it automatically
    if check_teacher_exist(payload.username):
        raise HTTPException(status_code=400, detail="Username already taken")
        
    try:
        new_teacher = create_teacher(payload.username, payload.password, payload.name)
        return {"status": "success", "message": "Teacher registered successfully", "teacher": new_teacher}
    except Exception as e:
        raise HTTPException(status_code=500, detail="Unexpected error during registration")

@router.post("/student/register")
async def register_student_endpoint(
    name: str = Form(...),
    face_image: str = Form(...), 
    voice_sample: UploadFile = File(None)
):
    # 1. Decode the image and get face embeddings
    img_np = decode_base64_to_rgb_array(face_image)
    encodings = get_face_embeddings(img_np)
    
    if not encodings:
        raise HTTPException(status_code=400, detail="Could not detect a clear face for registration.")
        
    face_emb = encodings[0].astype(float).tolist()
    
    # 2. Handle voice embedding using your actual pipeline
    voice_emb = None
    if voice_sample:
        audio_bytes = await voice_sample.read()
        voice_emb = get_voice_embedding(audio_bytes)

    # 3. Save to database
    student_data = create_student(new_name=name, face_emb=face_emb, voice_emb=voice_emb)
    
    if not student_data:
        raise HTTPException(status_code=500, detail="Failed to save student profile.")

    # 4. Retrain the AI classifier with the new face
    train_classifier()

    return {"status": "success", "student": student_data}