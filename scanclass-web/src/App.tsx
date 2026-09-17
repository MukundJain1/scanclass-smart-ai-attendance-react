import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Home } from './pages/Home';
import { useAuthStore } from './store/authStore';
import { ThemeToggle } from './components/common/ThemeToggle';
import { TeacherDashboard } from './features/teacher/TeacherDashboard';
import StudentPortal from './features/student/StudentPortal'; // Use Default Import & Route to Portal

export default function App() {
  const { isLoggedIn, userRole } = useAuthStore();

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-background text-text-primary transition-colors flex flex-col">
        <header className="p-6 flex justify-end max-w-6xl w-full mx-auto">
          <ThemeToggle />
        </header>
        <main className="flex-1 w-full max-w-4xl mx-auto p-4 flex flex-col">
          <Routes>
            <Route path="/" element={<Home />} />
            
            {/* Teacher requires strict auth */}
            <Route 
              path="/teacher/*" 
              element={isLoggedIn && userRole === 'teacher' ? <TeacherDashboard /> : <Navigate to="/" />} 
            />
            
            {/* Student portal handles its own "auth" via facial recognition */}
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