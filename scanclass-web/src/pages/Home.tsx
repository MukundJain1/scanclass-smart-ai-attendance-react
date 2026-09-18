import React, { useState } from 'react';
import { AuthForm } from '../features/auth/AuthForm';
import { useNavigate } from 'react-router-dom';

export const Home: React.FC = () => {
  const [showTeacherAuth, setShowTeacherAuth] = useState(false);
  const navigate = useNavigate();

  if (showTeacherAuth) {
    return <AuthForm onBack={() => setShowTeacherAuth(false)} />;
  }

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-6 relative">
      <div className="text-center mb-16 animate-fade-in-up">
        <div className="flex items-center justify-center gap-3 mb-6">
          {/* Cyan/Blue Logo */}
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#00F0FF] to-[#1D4ED8] flex items-center justify-center text-white font-bold text-2xl shadow-[0_0_20px_rgba(0,240,255,0.3)]">
            G
          </div>
          <h1 className="text-4xl font-extrabold tracking-widest text-white">SCANCLASS<span className="text-[#00F0FF]">.AI</span></h1>
        </div>
        <h2 className="text-5xl font-bold text-white mb-4">Smart AI Attendance System</h2>
        <p className="text-xl text-[#00F0FF] font-medium tracking-widest uppercase">Gateway Portal</p>
        <p className="text-[#94A3B8] mt-2">Choose your access</p>
      </div>

      <div className="grid md:grid-cols-2 gap-12 w-full max-w-4xl animate-fade-in-up">
        {/* Student Portal Card */}
        <div 
          onClick={() => navigate('/student')}
          className="group cursor-pointer bg-[#10172A]/80 backdrop-blur-xl border border-[#1E293B] hover:border-[#00F0FF]/50 p-8 rounded-3xl transition-all duration-300 hover:shadow-[0_0_30px_rgba(0,240,255,0.1)] hover:-translate-y-2 flex flex-col items-center text-center"
        >
          <div className="w-10 h-10 rounded-full bg-[#1E40AF] text-[#00F0FF] flex items-center justify-center font-bold text-xl mb-6">1</div>
          <h3 className="text-2xl font-bold text-white mb-4">STUDENT PORTAL</h3>
          <p className="text-[#94A3B8] mb-8">Access the AI facial scanner to mark your presence.</p>
          <button className="w-full py-4 rounded-xl bg-[#1D4ED8] hover:bg-[#2563EB] text-white font-bold transition-all shadow-[0_0_15px_rgba(29,78,216,0.5)]">
            Open Scanner
          </button>
        </div>

        {/* Teacher Portal Card */}
        <div 
          onClick={() => setShowTeacherAuth(true)}
          className="group cursor-pointer bg-[#10172A]/80 backdrop-blur-xl border border-[#1E293B] hover:border-[#8B5CF6]/50 p-8 rounded-3xl transition-all duration-300 hover:shadow-[0_0_30px_rgba(139,92,246,0.1)] hover:-translate-y-2 flex flex-col items-center text-center"
        >
          <div className="w-10 h-10 rounded-full bg-[#5B21B6] text-[#C4B5FD] flex items-center justify-center font-bold text-xl mb-6">2</div>
          <h3 className="text-2xl font-bold text-white mb-4">TEACHER PORTAL</h3>
          <p className="text-[#94A3B8] mb-8">Manage domains, view logs, and run live class scans.</p>
          <button className="w-full py-4 rounded-xl bg-gradient-to-r from-[#8B5CF6] to-[#3B82F6] hover:opacity-90 text-white font-bold transition-all shadow-[0_0_15px_rgba(139,92,246,0.4)]">
            Login / Register
          </button>
        </div>
      </div>
    </div>
  );
};