import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CameraCapture from './CameraCaptured';
import RegistrationForm from './RegistrationForm';  
import StudentDashboard from './StudentDashboard';
import { ThemeToggle } from '../../components/common/ThemeToggle';
import { analyzeFace } from '../../services/api'; 
import { LogOut, CheckCircle, XCircle, Sparkles } from 'lucide-react';

export type Step = 'camera' | 'register' | 'dashboard';

export interface StudentData { student_id: string; name: string; subjects?: any[]; }

const StudentPortal: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<Step>('camera');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [studentData, setStudentData] = useState<StudentData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const navigate = useNavigate();

  const showToast = (message: string, type: 'success' | 'error') => { setToast({ message, type }); setTimeout(() => setToast(null), 3000); };

  const handleFaceCapture = async (imageSrc: string) => {
    setCapturedImage(imageSrc); setIsLoading(true);
    try {
      const response = await analyzeFace(imageSrc); 
      if (response.exists && response.student) {
        setStudentData(response.student); setCurrentStep('dashboard'); showToast(`Welcome back, ${response.student.name}`, 'success');
      } else { setCurrentStep('register'); }
    } catch (error) { showToast("Could not verify face. Please try again.", "error"); } finally { setIsLoading(false); }
  };

  return (
    <div className="min-h-screen bg-[#FDF9F1] dark:bg-[#120D0A] text-[#2B1B12] dark:text-[#E8DCD0] font-sans flex flex-col relative transition-colors duration-700">
      
      <header className="w-full px-6 lg:px-12 py-5 border-b border-[#E8DCD0] dark:border-[#3A2A22] bg-white/50 dark:bg-[#1E1612]/50 backdrop-blur-xl flex justify-between items-center sticky top-0 z-40">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#D2691E] to-[#8B4513] flex items-center justify-center text-white shadow-lg">
            <Sparkles size={20} />
          </div>
          <h1 className="text-xl font-display font-extrabold tracking-wider leading-tight">SHISHYA PORTAL</h1>
        </div>
        <div className="flex items-center gap-4">
          <ThemeToggle />
          <button onClick={() => navigate('/')} className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold border border-[#E8DCD0] dark:border-[#3A2A22] hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 hover:border-red-200 dark:hover:border-red-800 transition-all hover:scale-105">
            <LogOut size={18} /> Exit
          </button>
        </div>
      </header>

      {toast && (
        <div className={`fixed top-24 right-8 z-50 px-5 py-4 rounded-xl shadow-2xl border flex items-center gap-3 animate-fade-in-up backdrop-blur-md ${toast.type === 'success' ? 'bg-[#22C55E]/10 border-[#22C55E]/30 text-[#22C55E]' : 'bg-[#EF4444]/10 border-[#EF4444]/30 text-[#EF4444]'}`}>
          {toast.type === 'success' ? <CheckCircle size={20} /> : <XCircle size={20} />}
          <span className="text-[15px] font-bold tracking-wide">{toast.message}</span>
        </div>
      )}

      {isLoading && (
        <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-[#FDF9F1]/80 dark:bg-[#120D0A]/80 backdrop-blur-lg">
          <div className="w-16 h-16 border-4 border-[#B85C38]/20 border-t-[#B85C38] rounded-full animate-spin mb-6"></div>
          <span className="text-lg font-bold text-[#8A5A44] tracking-widest uppercase">Seeking Identity...</span>
        </div>
      )}

      <main className="flex-1 w-full max-w-[1600px] mx-auto p-6 lg:p-12 flex flex-col">
        {currentStep === 'camera' && <CameraCapture onCapture={handleFaceCapture} />}
        {currentStep === 'register' && capturedImage && (
          <RegistrationForm faceImage={capturedImage} onSuccess={(data) => { setStudentData(data); setCurrentStep('dashboard'); showToast("Profile created successfully!", "success"); }} onCancel={() => setCurrentStep('camera')} />
        )}
        {currentStep === 'dashboard' && studentData && <StudentDashboard studentData={studentData} showToast={showToast} />}
      </main>
    </div>
  );
};
export default StudentPortal;