import { DialogBox, type DialogProps } from '../../components/TempBox';
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { ArrowLeft, Loader2, ScanLine } from 'lucide-react';
import StudentDashboard from './StudentDashboard';
import RegistrationForm from './RegistrationForm';

export interface StudentData { student_id: string; name: string; subjects?: any[]; }

const StudentPortal: React.FC = () => {
  const [studentData, setStudentData] = useState<StudentData | null>(null);
  const [unregisteredFace, setUnregisteredFace] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [streamActive, setStreamActive] = useState(false);
  const navigate = useNavigate();

  const [dialog, setDialog] = useState<DialogProps>({ isOpen: false, title: '', message: '', onConfirm: () => { } });

  const showDialog = (title: string, message: string, type: DialogProps['type'] = 'alert') => {
    setDialog({ isOpen: true, title, message, type, onConfirm: () => setDialog((prev: DialogProps) => ({ ...prev, isOpen: false })) });
  };

  useEffect(() => {
    let currentStream: MediaStream | null = null;
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
        currentStream = stream;
        if (videoRef.current) { videoRef.current.srcObject = stream; setStreamActive(true); }
      } catch (err) { showDialog("Camera Error", "Please allow camera access to scan your face.", "error"); }
    };
    if (!studentData && !unregisteredFace) startCamera();
    return () => { if (currentStream) currentStream.getTracks().forEach(track => track.stop()); };
  }, [studentData, unregisteredFace]);

  const handleFaceScan = async () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth; canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        const imageSrc = canvas.toDataURL('image/jpeg', 0.9);

        setIsLoading(true);
        try {
          const response = await api.post('/attendance/student/verify-face', { image: imageSrc });
          if (response.data.match_found && response.data.student_data) {
            setStudentData(response.data.student_data);
          } else {
            setUnregisteredFace(imageSrc);
            showDialog("Not Recognized", "Face not found. Please complete your profile registration.", "alert");
          }
        } catch (error) { showDialog("Authentication Failed", "Could not reach the server. Please try again.", "error"); }
        finally { setIsLoading(false); }
      }
    }
  };

  if (studentData) return <StudentDashboard studentData={studentData} showToast={(msg, type) => showDialog(type === 'success' ? 'Success' : 'Error', msg, type)} />;
  if (unregisteredFace) return <RegistrationForm faceImage={unregisteredFace} onSuccess={(data) => { setStudentData(data); }} onCancel={() => setUnregisteredFace(null)} />;

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-6 relative">
      <DialogBox {...dialog} />

      <button onClick={() => navigate('/')} className="absolute top-8 left-8 text-slate-500 hover:text-cyan-400 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] transition-colors border border-transparent hover:border-cyan-400/30 bg-white/5 px-4 py-2 rounded-lg backdrop-blur-md">
        <ArrowLeft size={14} /> Exit
      </button>

      <div className="w-full max-w-md rounded-[2.5rem] p-1 bg-gradient-to-b from-cyan-500/30 to-transparent shadow-[0_0_80px_rgba(34,211,238,0.15)] animate-fade-in-up">
        <div className="bg-[#0A0F1C]/90 backdrop-blur-2xl border border-white/5 rounded-[2.4rem] p-8 relative overflow-hidden">

          <div className="absolute -top-20 -left-20 w-48 h-48 bg-cyan-500/20 blur-[50px] rounded-full pointer-events-none"></div>

          <div className="flex items-center justify-center gap-3 text-sm font-black text-white mb-2 uppercase tracking-widest">
            <ScanLine className="text-cyan-400" size={20} /> Face Scanner
          </div>
          <p className="text-center text-slate-400 text-[10px] font-bold mb-8 uppercase tracking-[0.2em]">Position your face to verify your identity</p>

          <div className="relative w-full aspect-square bg-[#030509] rounded-[2rem] overflow-hidden border border-white/10 mb-8 shadow-inner group">
            <video ref={videoRef} autoPlay playsInline muted className={`w-full h-full object-cover transition-opacity duration-1000 ${streamActive ? 'opacity-100' : 'opacity-0'}`} />

            <div className="absolute inset-4 border-2 border-dashed border-cyan-400/20 rounded-full animate-[spin_10s_linear_infinite] pointer-events-none"></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-48 h-64 border border-cyan-400/40 rounded-[3rem] pointer-events-none"></div>

            <div className="absolute top-1/2 left-0 w-full h-[1px] bg-cyan-400/20 pointer-events-none"></div>
            <div className="absolute left-1/2 top-0 w-[1px] h-full bg-cyan-400/20 pointer-events-none"></div>

            {streamActive && !isLoading && <div className="absolute left-0 w-full h-1 bg-cyan-400 shadow-[0_0_20px_#22d3ee] animate-scan pointer-events-none opacity-50" style={{ animation: 'scanLine 2s ease-in-out infinite' }}><style>{`@keyframes scanLine { 0% { top: 5%; } 50% { top: 95%; } 100% { top: 5%; } }`}</style></div>}

            {isLoading && (
              <div className="absolute inset-0 bg-[#030509]/80 backdrop-blur-md flex flex-col items-center justify-center text-cyan-400 z-20">
                <Loader2 className="animate-spin mb-4" size={40} />
                <span className="text-[10px] font-black tracking-[0.3em] uppercase">Verifying Identity...</span>
              </div>
            )}
          </div>

          <button onClick={handleFaceScan} disabled={isLoading || !streamActive} className="w-full h-16 bg-cyan-400 hover:bg-cyan-300 text-black font-black rounded-xl transition-all shadow-[0_0_30px_rgba(34,211,238,0.4)] disabled:opacity-50 text-xs uppercase tracking-[0.2em] flex items-center justify-center hover:scale-[1.02] active:scale-95">
            Scan Face
          </button>
        </div>
      </div>
    </div>
  );
};
export default StudentPortal;