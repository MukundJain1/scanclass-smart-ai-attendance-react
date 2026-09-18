import React, { useState, useRef, useEffect } from 'react';
import { api } from '../../services/api'; 
import { Loader2, Mic, User } from 'lucide-react';
import { DialogBox, type DialogProps } from '../../components/Dialogbox';

interface RegistrationFormProps { faceImage: string; onSuccess: (data: any) => void; onCancel: () => void; }

const RegistrationForm: React.FC<RegistrationFormProps> = ({ faceImage, onSuccess, onCancel }) => {
  const [name, setName] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [timeLeft, setTimeLeft] = useState(12);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [dialog, setDialog] = useState<DialogProps>({ isOpen: false, title: '', message: '', onConfirm: () => {} });

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
      mediaRecorder.onstop = () => { setAudioBlob(new Blob(audioChunksRef.current, { type: 'audio/webm' })); stream.getTracks().forEach(track => track.stop()); };
      
      mediaRecorder.start(); setIsRecording(true); setTimeLeft(12);
      timerRef.current = setInterval(() => { setTimeLeft((prev) => { if (prev <= 1) { stopRecording(); return 0; } return prev - 1; }); }, 1000);
    } catch (error) { setDialog({ isOpen: true, title: 'Error', message: 'Microphone access denied.', type: 'error', onConfirm: () => setDialog(prev => ({...prev, isOpen: false}))}); }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) { mediaRecorderRef.current.stop(); setIsRecording(false); if (timerRef.current) clearInterval(timerRef.current); }
  };

  useEffect(() => { return () => { if (timerRef.current) clearInterval(timerRef.current); }; }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); if (!name.trim()) return;
    setIsSubmitting(true);
    
    try {
      const formData = new FormData();
      formData.append('name', name); 
      formData.append('face_image', faceImage); 
      if (audioBlob) formData.append('voice_sample', audioBlob, 'voice.webm');

      // FIX: Explicitly set headers for multipart/form-data to solve the 422 Unprocessable Entity error
      const response = await api.post('/auth/student/register', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      onSuccess(response.data.student || response.data);
    } catch (error: any) { 
      setDialog({ isOpen: true, title: 'Registration Failed', message: error.response?.data?.detail || "Network error. Please try again.", type: 'error', onConfirm: () => setDialog(prev => ({...prev, isOpen: false})) }); 
    } finally { 
      setIsSubmitting(false); 
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center animate-fade-in w-full h-full max-w-md mx-auto relative z-10">
      <DialogBox {...dialog} />
      
      <div className="w-full rounded-[2.5rem] p-1 bg-gradient-to-b from-purple-600/30 to-transparent shadow-[0_0_80px_rgba(147,97,246,0.15)]">
        <div className="bg-[#0A0F1C]/95 backdrop-blur-2xl p-10 rounded-[2.4rem] border border-white/5 relative overflow-hidden">
          
          <div className="absolute top-0 right-0 w-48 h-48 bg-purple-600/20 blur-[60px] rounded-full pointer-events-none"></div>

          <h2 className="text-2xl font-black mb-8 text-center text-white uppercase tracking-widest relative z-10">Complete Profile</h2>
          
          <form onSubmit={handleSubmit} className="space-y-8 relative z-10">
            <div>
              <div className="relative">
                <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none text-purple-400"><User size={18} /></div>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="FULL LEGAL NAME"
                  className="w-full h-14 pl-14 pr-6 rounded-xl bg-black/50 border border-white/10 text-white focus:border-purple-500 outline-none transition-colors text-xs font-bold tracking-widest uppercase placeholder:text-slate-600" required />
              </div>
            </div>

            <div className="p-6 bg-black/40 rounded-2xl border border-white/5 backdrop-blur-md">
              <h3 className="font-bold mb-3 flex items-center justify-between text-[10px] uppercase tracking-widest text-slate-300">
                <span className="flex items-center gap-2"><Mic size={14} className="text-purple-400"/> Voice Record</span>
              </h3>
              <p className="text-[11px] text-slate-400 mb-6 font-medium leading-relaxed">
                Please read the following phrase clearly: <br/><span className="text-purple-400 font-mono tracking-wider">"I am {name || '[Name]'}, and I am present for my classes."</span>
              </p>
              
              <div className="h-16 flex items-center justify-center gap-1 mb-6 bg-[#030509] rounded-xl border border-white/10 overflow-hidden shadow-inner relative">
                {!isRecording && !audioBlob && <span className="text-[10px] uppercase tracking-widest font-bold text-slate-500 absolute">Ready to Record</span>}
                {!isRecording && audioBlob && <span className="text-[10px] uppercase tracking-widest font-bold text-purple-400 absolute">Voice Captured ✓</span>}
                {isRecording && [...Array(32)].map((_, i) => (
                  <div key={i} className="w-1 bg-purple-500 rounded-full animate-pulse shadow-[0_0_10px_#a855f7]" style={{ animationDelay: `${i * 0.05}s`, height: `${Math.max(10, Math.random() * 40)}px`, animationDuration: '0.4s' }}></div>
                ))}
              </div>

              <div className="flex items-center gap-4">
                {!isRecording ? (
                  <button type="button" onClick={startRecording} className="flex-1 h-12 text-[10px] uppercase tracking-widest bg-white/5 border border-white/10 hover:border-purple-500 text-white rounded-xl transition-colors font-bold hover:bg-purple-500/10">
                    {audioBlob ? 'Retake Voice' : 'Start Recording'}
                  </button>
                ) : (
                  <button type="button" onClick={stopRecording} className="flex-1 h-12 text-[10px] uppercase tracking-widest bg-rose-500 hover:bg-rose-400 text-white rounded-xl font-bold flex justify-center items-center gap-3 shadow-[0_0_15px_rgba(244,63,94,0.4)]">
                    Stop <span className="text-xs font-mono bg-black/20 px-2 py-0.5 rounded">00:{timeLeft.toString().padStart(2, '0')}</span>
                  </button>
                )}
              </div>
            </div>

            <div className="flex gap-4 pt-2">
              <button type="button" onClick={onCancel} className="flex-1 h-14 border border-white/10 text-slate-400 hover:text-white bg-transparent rounded-xl font-bold transition-colors text-[10px] uppercase tracking-widest hover:bg-white/5">Cancel</button>
              <button type="submit" disabled={isSubmitting || !name || !audioBlob} className="flex-1 h-14 bg-purple-500 hover:bg-purple-400 text-white rounded-xl font-black disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(168,85,247,0.4)] text-xs uppercase tracking-widest hover:scale-[1.02] active:scale-95">
                {isSubmitting ? <><Loader2 size={16} className="animate-spin"/> Saving...</> : 'Complete'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
export default RegistrationForm;