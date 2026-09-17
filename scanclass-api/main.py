from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

# 1. Import ALL your routers here
from routers import attendance, auth, teacher, student
from src.database.config import supabase

app = FastAPI(title="ScanClass AI Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/health")
def health_check():
    try:
        # 2. Fixed column name: querying 'subject_id' instead of 'id'
        res = supabase.table("subjects").select("subject_id").limit(1).execute()
        return {
            "status": "online",
            "database": "connected",
            "message": "Supabase connection verified successfully!"
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Database connection failed: {str(e)}"
        )

# 3. Mount ALL routers to the application
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(teacher.router, prefix="/api/teacher", tags=["Teacher Dashboard"])
app.include_router(student.router, prefix="/api/student", tags=["Student Dashboard"])
app.include_router(attendance.router, prefix="/api/attendance", tags=["Attendance AI"])