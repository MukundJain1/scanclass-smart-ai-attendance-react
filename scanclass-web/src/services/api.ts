// scanclass-web/src/services/api.ts
import axios from 'axios';

export const api = axios.create({
  baseURL: 'https://scanclass-smart-ai-attendance.onrender.com',
  headers: {
    'Content-Type': 'application/json',
  },
});

export const analyzeFace = async (imageSrc: string) => {
  // Routes to attendance.py -> @router.post("/student/verify-face")
  const response = await api.post('/attendance/student/verify-face', { image: imageSrc });
  
  return {
    exists: response.data.match_found,
    student: response.data.student_data,
    message: response.data.message
  };
};

export const registerStudent = async (data: { name: string; faceImage: string | null; audioBlob: Blob | null }) => {
  const formData = new FormData();
  formData.append('name', data.name);
  if (data.faceImage) formData.append('face_image', data.faceImage);
  if (data.audioBlob) formData.append('voice_sample', data.audioBlob, 'voice.webm');

  // Routes to auth.py -> @router.post("/student/register")
  const response = await api.post('/auth/student/register', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  
  return response.data;
};