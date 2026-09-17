import React, { useRef, useEffect, useState } from 'react';
import { Camera } from 'lucide-react';

interface CameraCaptureProps {
  onCapture: (imageSrc: string) => void;
}

const CameraCapture: React.FC<CameraCaptureProps> = ({ onCapture }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [streamActive, setStreamActive] = useState(false);

  useEffect(() => {
    let currentStream: MediaStream | null = null;
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
        currentStream = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setStreamActive(true);
        }
      } catch (err) {
        console.error("Error accessing camera: ", err);
      }
    };
    startCamera();
    return () => {
      if (currentStream) currentStream.getTracks().forEach(track => track.stop());
    };
  }, []);

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        onCapture(canvas.toDataURL('image/jpeg', 0.9));
      }
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center animate-fade-in max-w-2xl mx-auto w-full">
      <div className="text-center mb-8">
        <h2 className="text-[32px] font-display font-bold mb-2">Student Authentication</h2>
        <p className="text-[#5B6472] dark:text-[#9AA3B2]">Position your face in the center of the frame</p>
      </div>

      <div className="bg-[#FFFFFF] dark:bg-[#12161F] p-4 sm:p-6 rounded-[16px] border border-[#E2E5EB] dark:border-[#232937] shadow-sm w-full">
        <div className="relative bg-[#0B0E14] rounded-lg overflow-hidden border border-[#232937] aspect-video flex items-center justify-center">
          {!streamActive && <p className="text-[#9AA3B2] text-[13px] uppercase tracking-wider animate-pulse">Initializing Camera...</p>}
          <video 
            ref={videoRef} autoPlay playsInline muted 
            className={`w-full h-full object-cover transition-opacity duration-500 ${streamActive ? 'opacity-100' : 'opacity-0'}`}
          />
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
             <div className="w-48 h-64 border-2 border-dashed border-[#4F7CFF]/50 rounded-[100px]"></div>
          </div>
        </div>

        <button 
          onClick={capturePhoto}
          disabled={!streamActive}
          className="w-full mt-6 min-h-[44px] bg-[#4F7CFF] hover:bg-[#3f65d6] text-white rounded-[8px] font-semibold flex justify-center items-center gap-2 disabled:opacity-50 transition-colors"
        >
          <Camera size={18} /> Capture & Analyze
        </button>
      </div>
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

export default CameraCapture;