import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Home } from './pages/Home';
import { useAuthStore } from './store/authStore';
import { TeacherDashboard } from './features/teacher/TeacherDashboard';
import StudentPortal from './features/student/StudentPortal';

export default function App() {
  const { isLoggedIn, userRole } = useAuthStore();

  return (
    <BrowserRouter>
      {/* Global Gurukul Theme Background spanning the whole screen */}
      <div className="min-h-screen bg-[#FDF9F1] dark:bg-[#120D0A] text-[#2B1B12] dark:text-[#E8DCD0] selection:bg-[#B85C38] selection:text-white font-sans flex flex-col overflow-x-hidden transition-colors duration-700">
        <main className="flex-1 w-full flex flex-col">
          <Routes>
            <Route path="/" element={<Home />} />
            
            <Route 
              path="/teacher/*" 
              element={isLoggedIn && userRole === 'teacher' ? <TeacherDashboard /> : <Navigate to="/" />} 
            />
            
            <Route 
              path="/student/*" 
              element={<StudentPortal />} 
            />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}