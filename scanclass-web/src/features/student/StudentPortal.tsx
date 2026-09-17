// ./features/student/StudentPortal.tsx
import React, { useState } from 'react';
import CameraCapture from './CameraCaptured';
import RegistrationForm from './RegistrationForm';  
import StudentDashboard from './StudentDashboard';
import { analyzeFace } from '../../services/api'; 

export type Step = 'camera' | 'register' | 'dashboard';


export interface StudentData {
  student_id: string;
  name: string;
  subjects?: any[];
}

const StudentPortal: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<Step>('camera');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [studentData, setStudentData] = useState<StudentData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleFaceCapture = async (imageSrc: string) => {
    setCapturedImage(imageSrc);
    setIsLoading(true);
    
   try {
      const response = await analyzeFace(imageSrc); 
      
      if (response.exists && response.student) {
        setStudentData(response.student);
        setCurrentStep('dashboard'); 
      } else {
        setCurrentStep('register'); 
      }
    } catch (error) {
      console.error("Face analysis failed", error);
      // ADD THIS LINE so you know if the API call fails
      alert("Error connecting to AI Server. Check console for details."); 
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegistrationSuccess = (newStudentData: StudentData) => {
    setStudentData(newStudentData);
    setCurrentStep('dashboard');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-500 text-gray-900 dark:text-gray-100 relative">
      {isLoading && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500"></div>
          <span className="ml-4 text-xl font-semibold text-white">AI is scanning...</span>
        </div>
      )}

      {currentStep === 'camera' && (
        <CameraCapture onCapture={handleFaceCapture} />
      )}

      {currentStep === 'register' && capturedImage && (
        <RegistrationForm 
          faceImage={capturedImage} 
          onSuccess={handleRegistrationSuccess} 
          onCancel={() => setCurrentStep('camera')}
        />
      )}

      {currentStep === 'dashboard' && studentData && (
        <StudentDashboard studentData={studentData} />
      )}
    </div>
  );
};

export default StudentPortal;