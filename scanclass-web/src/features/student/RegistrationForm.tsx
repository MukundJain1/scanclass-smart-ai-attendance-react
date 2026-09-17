import React, { useState, useRef } from 'react';
import { registerStudent } from '../../services/api';
import { Loader2, Mic } from 'lucide-react';

interface RegistrationFormProps {
  faceImage: string;
  onSuccess: (data: any) => void;
  onCancel: () => void;
}

const RegistrationForm: React.FC<RegistrationFormProps> = ({ faceImage, onSuccess, onCancel }) => {
  const [name, setName] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      mediaRecorder.ondataavailable = (event) => { if (event.data.size > 0) audioChunksRef.current.push(event.data); };
      mediaRecorder.onstop = () => {
        setAudioBlob(new Blob(audioChunksRef.current, { type: 'audio/webm' }));
        stream.getTracks().forEach(track => track.stop());
      };
      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error("Error accessing microphone:", error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setIsSubmitting(true);
    try {
      const response = await registerStudent({ name, faceImage, audioBlob });
      onSuccess(response.student || response);
    } catch (error) {
      console.error("Registration failed", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center animate-fade-in w-full max-w-md mx-auto">
      <div className="bg-[#FFFFFF] dark:bg-[#12161F] p-6 sm:p-8 rounded-[16px] shadow-sm w-full border border-[#E2E5EB] dark:border-[#232937]">
        <h2 className="text-[24px] font-display font-bold mb-6 text-center">Register Profile</h2>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-[13px] uppercase tracking-[0.05em] font-semibold text-[#5B6472] dark:text-[#9AA3B2] mb-2">Full Name</label>
            <input 
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Mukund Jain"
              className="w-full min-h-[44px] px-4 rounded-lg bg-[#F7F8FA] dark:bg-[#0B0E14] border border-[#E2E5EB] dark:border-[#232937] focus:outline-none focus:ring-2 focus:ring-[#4F7CFF] focus:border-transparent transition-all"
              required
            />
          </div>

          <div className="p-4 bg-[#EEF0F4] dark:bg-[#1B2130] rounded-lg border border-[#E2E5EB] dark:border-[#232937]">
            <h3 className="font-semibold mb-2 flex items-center justify-between text-[15px]">
              <span className="flex items-center gap-2"><Mic size={16}/> Voice Enrollment</span>
              <span className="text-[12px] uppercase tracking-wide bg-[#E2E5EB] dark:bg-[#232937] px-2 py-0.5 rounded text-[#5B6472] dark:text-[#9AA3B2]">Optional</span>
            </h3>
            <p className="text-[13px] text-[#5B6472] dark:text-[#9AA3B2] mb-4">
              Record a short phrase like: "I'm present, my name is {name || '...'}"
            </p>
            
            <div className="flex items-center gap-4">
              {!isRecording ? (
                <button type="button" onClick={startRecording} className="min-h-[44px] px-4 text-[14px] bg-[#FFFFFF] dark:bg-[#12161F] border border-[#E2E5EB] dark:border-[#232937] hover:border-[#4F7CFF] rounded-lg transition-colors font-medium">
                  Start Recording
                </button>
              ) : (
                <button type="button" onClick={stopRecording} className="min-h-[44px] px-4 text-[14px] bg-[#EF4444] text-white rounded-lg animate-pulse font-medium">
                  Stop Recording
                </button>
              )}
              {audioBlob && !isRecording && <span className="text-[#22C55E] text-[13px] font-semibold">✓ Saved</span>}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onCancel} className="flex-1 min-h-[44px] border border-[#E2E5EB] dark:border-[#232937] bg-[#FFFFFF] dark:bg-[#12161F] hover:bg-[#F7F8FA] dark:hover:bg-[#1B2130] rounded-[8px] font-medium transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={isSubmitting || !name} className="flex-1 min-h-[44px] bg-[#4F7CFF] hover:bg-[#3f65d6] text-white rounded-[8px] font-semibold disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
              {isSubmitting ? <><Loader2 size={16} className="animate-spin"/> Saving...</> : 'Create Account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
export default RegistrationForm;