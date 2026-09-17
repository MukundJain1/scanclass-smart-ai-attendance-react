import React, { useState, useRef } from 'react';
import { registerStudent } from '../../services/api';

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

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(audioBlob);
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
    if (!name.trim()) return alert("Please enter your name");

    setIsSubmitting(true);
    try {
      // Pass the object directly matching your api.ts definition.
      // The registerStudent function will handle creating the FormData.
      const response = await registerStudent({
        name: name,
        faceImage: faceImage,
        audioBlob: audioBlob
      });

      // Pass the returned data to your success handler 
      // (Adjust response.student to match exactly what your backend returns)
      onSuccess(response.student || response);
    } catch (error) {
      console.error("Registration failed", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] animate-fade-in px-4">
      <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl w-full max-w-md border border-gray-200 dark:border-gray-700">
        <h2 className="text-2xl font-bold mb-6 text-center">Register New Profile</h2>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">Full Name</label>
            <input 
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Mukund Jain"
              className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-blue-500 outline-none transition"
              required
            />
          </div>

          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800">
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              🎙️ Voice Enrollment <span className="text-xs bg-blue-200 dark:bg-blue-800 px-2 py-1 rounded-full">Optional</span>
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Record a short phrase like: "I'm present, my name is {name || '...'}"
            </p>
            
            <div className="flex items-center gap-4">
              {!isRecording ? (
                <button type="button" onClick={startRecording} className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors">
                  Start Recording
                </button>
              ) : (
                <button type="button" onClick={stopRecording} className="px-4 py-2 bg-gray-800 animate-pulse text-white rounded-lg transition-colors">
                  Stop Recording
                </button>
              )}
              {audioBlob && !isRecording && <span className="text-green-500 text-sm font-medium">✓ Audio captured</span>}
            </div>
          </div>

          <div className="flex gap-4 mt-8">
            <button type="button" onClick={onCancel} className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition">
              Cancel
            </button>
            <button type="submit" disabled={isSubmitting || !name} className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50 transition">
              {isSubmitting ? 'Creating Profile...' : 'Create Account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RegistrationForm;