import React, { useRef, useEffect, useState } from 'react';

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
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } } 
        });
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
      if (currentStream) {
        currentStream.getTracks().forEach(track => track.stop());
      }
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
        // Convert to base64 jpeg
        const imageSrc = canvas.toDataURL('image/jpeg', 0.9);
        onCapture(imageSrc);
      }
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] animate-fade-in">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-2">Student Authentication</h2>
        <p className="text-gray-500 dark:text-gray-400">Position your face in the center of the frame</p>
      </div>

      <div className="relative group">
        {/* Animated Scanning Border */}
        <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-purple-600 rounded-3xl blur opacity-25 group-hover:opacity-75 transition duration-1000 group-hover:duration-200 animate-pulse"></div>
        
        <div className="relative bg-black rounded-2xl overflow-hidden shadow-2xl border-4 border-gray-800 w-full max-w-lg aspect-video flex items-center justify-center">
          {!streamActive && <p className="text-white animate-pulse">Initializing Camera...</p>}
          <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            muted 
            className={`w-full h-full object-cover transition-opacity duration-500 ${streamActive ? 'opacity-100' : 'opacity-0'}`}
          />
          {/* Facial Alignment Guidelines */}
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-50">
             <div className="w-48 h-64 border-2 border-dashed border-white/50 rounded-[40%]"></div>
          </div>
        </div>
      </div>

      <button 
        onClick={capturePhoto}
        disabled={!streamActive}
        className="mt-8 px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-full font-bold shadow-lg hover:shadow-blue-500/50 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
      >
        <span className="text-xl">📸</span> Capture & Analyze
      </button>

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

export default CameraCapture;