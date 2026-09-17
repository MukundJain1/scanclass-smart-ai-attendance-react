import React, { useState } from 'react';
import { AuthForm } from '../features/auth/AuthForm';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Users, LineChart, ShieldCheck, CheckCircle2, ScanFace } from 'lucide-react';
import { ThemeToggle } from '../components/common/ThemeToggle';

export const Home: React.FC = () => {
  const [showTeacherAuth, setShowTeacherAuth] = useState(false);
  const navigate = useNavigate();

  if (showTeacherAuth) {
    return <AuthForm onBack={() => setShowTeacherAuth(false)} />;
  }

  return (
    <div className="min-h-screen w-full relative flex flex-col z-0">
      {/* Rich Aesthetic Background Gradient */}
      <div className="absolute inset-0 z-[-1] bg-[#FDF9F1] dark:bg-[#120D0A] transition-colors duration-700">
        <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[70%] bg-[#D2691E]/10 dark:bg-[#B85C38]/15 blur-[120px] rounded-full pointer-events-none mix-blend-multiply dark:mix-blend-screen"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#8B4513]/5 dark:bg-[#8B4513]/20 blur-[150px] rounded-full pointer-events-none mix-blend-multiply dark:mix-blend-screen"></div>
      </div>

      {/* Top Navbar */}
      <nav className="w-full max-w-[1400px] mx-auto px-6 py-6 flex justify-between items-center z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#B85C38] to-[#5C2E14] flex items-center justify-center text-white shadow-lg">
            <Sparkles size={20} />
          </div>
          <span className="text-2xl font-display font-extrabold tracking-widest text-[#5C2E14] dark:text-[#E8DCD0]">
            GURUKUL.AI
          </span>
        </div>
        <div className="flex items-center gap-6">
          <ThemeToggle />
          <button onClick={() => setShowTeacherAuth(true)} className="hidden md:block text-[#8A5A44] dark:text-[#B59582] hover:text-[#5C2E14] dark:hover:text-white font-bold transition">
            Acharya Sign In
          </button>
          <button onClick={() => setShowTeacherAuth(true)} className="bg-[#B85C38] hover:bg-[#8C4A23] text-white px-6 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-[#B85C38]/20">
            Get started &rarr;
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex-1 w-full max-w-[1400px] mx-auto px-6 pt-12 pb-24 flex flex-col lg:flex-row items-center gap-16 z-10">
        <div className="flex-1 space-y-8 animate-fade-in-up">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#B85C38]/10 border border-[#B85C38]/20 text-[#B85C38] text-sm font-bold tracking-wide uppercase">
            <Sparkles size={16} /> AI-Powered Attendance
          </div>
          
          {/* Exact Scale & Wrapping requested */}
          <h1 className="text-6xl lg:text-[5.5rem] font-black leading-[1.05] tracking-tight text-[#2B1B12] dark:text-[#E8DCD0]">
            Mark a whole class in <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#B85C38] to-[#D2691E]">one scan.</span>
          </h1>
          
          <p className="text-xl text-[#8A5A44] dark:text-[#B59582] max-w-xl leading-relaxed font-medium">
            Gurukul uses real face recognition to identify every student the moment you point your camera at the room. Confirm, save, and let the analytics do the rest.
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-4">
            <button onClick={() => setShowTeacherAuth(true)} className="bg-[#B85C38] hover:bg-[#8C4A23] text-white px-8 py-4 rounded-xl font-bold text-lg transition-all flex items-center gap-2 shadow-xl shadow-[#B85C38]/20 hover:-translate-y-1">
              I'm an Acharya (Teacher) &rarr;
            </button>
            <button onClick={() => navigate('/student')} className="bg-white dark:bg-[#1E1612] hover:bg-[#FDF9F1] dark:hover:bg-[#2C201A] border-2 border-[#E8DCD0] dark:border-[#3A2A22] text-[#5C2E14] dark:text-[#E8DCD0] px-8 py-4 rounded-xl font-bold text-lg transition-all hover:-translate-y-1 shadow-lg">
              I'm a Shishya (Student)
            </button>
          </div>

          <div className="flex items-center gap-6 pt-4 text-[#8A5A44] dark:text-[#B59582] text-sm font-bold tracking-wide">
            <span className="flex items-center gap-2"><ShieldCheck size={20} className="text-[#B85C38]"/> Secure JWT auth</span>
            <span className="flex items-center gap-2"><CheckCircle2 size={20} className="text-[#B85C38]"/> Real face recognition</span>
          </div>
        </div>

        {/* Hero Graphic */}
        <div className="flex-1 w-full max-w-2xl animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          <div className="relative rounded-[2rem] overflow-hidden border-8 border-white/50 dark:border-[#1E1612]/80 shadow-2xl backdrop-blur-sm">
            <div className="aspect-video bg-[#FAECE1] dark:bg-[#181311] relative flex items-center justify-center">
               <div className="absolute inset-0 bg-gradient-to-tr from-[#B85C38]/10 to-transparent"></div>
               <div className="w-48 h-48 border-2 border-[#B85C38] border-dashed rounded-2xl flex items-center justify-center opacity-40">
                  <ScanFace size={64} className="text-[#B85C38]" />
               </div>
               <div className="absolute bottom-6 left-6 bg-white/90 dark:bg-[#1E1612]/90 backdrop-blur-md px-4 py-2 rounded-xl border border-[#E8DCD0] dark:border-[#3A2A22] flex items-center gap-2 text-sm font-bold text-[#2B1B12] dark:text-[#E8DCD0] shadow-lg">
                 <div className="w-2.5 h-2.5 rounded-full bg-[#22C55E] animate-pulse"></div> LIVE AI
               </div>
               <div className="absolute bottom-6 right-6 bg-white/90 dark:bg-[#1E1612]/90 backdrop-blur-md px-4 py-2 rounded-xl border border-[#E8DCD0] dark:border-[#3A2A22] text-sm font-bold text-[#2B1B12] dark:text-[#E8DCD0] shadow-lg">
                 3 / 3 recognized
               </div>
            </div>
          </div>
        </div>
      </main>

      {/* Features Grid */}
      <div className="w-full bg-white/40 dark:bg-[#181311]/60 backdrop-blur-lg border-t border-[#E8DCD0] dark:border-[#3A2A22] py-24">
        <div className="max-w-[1400px] mx-auto px-6 grid md:grid-cols-3 gap-8">
          <div className="bg-white dark:bg-[#1E1612] border border-[#E8DCD0] dark:border-[#3A2A22] p-10 rounded-[2rem] hover:border-[#B85C38]/50 hover:shadow-xl transition-all hover:-translate-y-2 group">
            <div className="w-14 h-14 bg-[#FAECE1] dark:bg-[#2C201A] rounded-2xl flex items-center justify-center text-[#B85C38] mb-6 group-hover:scale-110 transition-transform">
              <ScanFace size={28} />
            </div>
            <h3 className="text-2xl font-bold text-[#2B1B12] dark:text-[#E8DCD0] mb-4">One-shot Recognition</h3>
            <p className="text-[#8A5A44] dark:text-[#B59582] leading-relaxed text-lg font-medium">Upload a class photo or use live webcam. Faces are matched against enrolled encodings instantly.</p>
          </div>
          <div className="bg-white dark:bg-[#1E1612] border border-[#E8DCD0] dark:border-[#3A2A22] p-10 rounded-[2rem] hover:border-[#B85C38]/50 hover:shadow-xl transition-all hover:-translate-y-2 group">
            <div className="w-14 h-14 bg-[#FAECE1] dark:bg-[#2C201A] rounded-2xl flex items-center justify-center text-[#B85C38] mb-6 group-hover:scale-110 transition-transform">
              <Users size={28} />
            </div>
            <h3 className="text-2xl font-bold text-[#2B1B12] dark:text-[#E8DCD0] mb-4">Subject Rosters</h3>
            <p className="text-[#8A5A44] dark:text-[#B59582] leading-relaxed text-lg font-medium">Create subjects, enroll students, and track completion & attendance averages per class.</p>
          </div>
          <div className="bg-white dark:bg-[#1E1612] border border-[#E8DCD0] dark:border-[#3A2A22] p-10 rounded-[2rem] hover:border-[#B85C38]/50 hover:shadow-xl transition-all hover:-translate-y-2 group">
            <div className="w-14 h-14 bg-[#FAECE1] dark:bg-[#2C201A] rounded-2xl flex items-center justify-center text-[#B85C38] mb-6 group-hover:scale-110 transition-transform">
              <LineChart size={28} />
            </div>
            <h3 className="text-2xl font-bold text-[#2B1B12] dark:text-[#E8DCD0] mb-4">Deep Records</h3>
            <p className="text-[#8A5A44] dark:text-[#B59582] leading-relaxed text-lg font-medium">Filter historical sessions, drill into individual student attendance, and export insights.</p>
          </div>
        </div>
      </div>
    </div>
  );
};