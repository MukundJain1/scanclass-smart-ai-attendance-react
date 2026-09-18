import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Home } from './pages/Home';
import { useAuthStore } from './store/authStore';
import { TeacherDashboard } from './features/teacher/TeacherDashboard';
import StudentPortal from './features/student/StudentPortal';

export default function App() {
  const { isLoggedIn, userRole } = useAuthStore();

  return (
    <BrowserRouter>
      {/* PREMIUM BIOMETRIC THEME:
        Deep void background with a subtle, futuristic grid and massive ambient glows.
      */}
      <div className="h-screen w-screen overflow-hidden bg-[#030509] text-white selection:bg-cyan-500 selection:text-black font-sans flex flex-col relative z-0">
        
        {/* Holographic Grid Overlay */}
        <div 
          className="absolute inset-0 pointer-events-none opacity-20 z-0"
          style={{
            backgroundImage: `linear-gradient(to right, #1e293b 1px, transparent 1px), linear-gradient(to bottom, #1e293b 1px, transparent 1px)`,
            backgroundSize: '4rem 4rem',
            maskImage: 'radial-gradient(ellipse 80% 80% at 50% 50%, #000 20%, transparent 100%)',
            WebkitMaskImage: 'radial-gradient(ellipse 80% 80% at 50% 50%, #000 20%, transparent 100%)'
          }}
        ></div>

        {/* Ambient Neural Glows */}
        <div className="absolute top-[-20%] left-[-10%] w-[60vw] h-[60vw] rounded-full bg-cyan-600/10 blur-[150px] pointer-events-none mix-blend-screen z-0"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-purple-600/10 blur-[150px] pointer-events-none mix-blend-screen z-0"></div>

        {/* Floating Data Particles (Subtle visual interest) */}
        <div className="absolute top-[15%] right-[20%] w-2 h-2 bg-cyan-400 rounded-full shadow-[0_0_15px_#22d3ee] animate-pulse"></div>
        <div className="absolute bottom-[25%] left-[15%] w-1.5 h-1.5 bg-purple-400 rounded-full shadow-[0_0_15px_#c084fc] animate-ping" style={{ animationDuration: '3s' }}></div>

        {/* Main Application Layer */}
        <main className="h-full w-full flex flex-col relative z-10">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/teacher/*" element={isLoggedIn && userRole === 'teacher' ? <TeacherDashboard /> : <Navigate to="/" />} />
            <Route path="/student/*" element={<StudentPortal />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}