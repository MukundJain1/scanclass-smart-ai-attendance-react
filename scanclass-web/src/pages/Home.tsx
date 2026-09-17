import React, { useState } from 'react';
import { Users, UserSquare2 } from 'lucide-react';
import { AuthForm } from '../features/auth/AuthForm';
import { useNavigate } from 'react-router-dom'; // 1. Import useNavigate

export const Home: React.FC = () => {
  // We removed 'student' from here since we will navigate instead
  const [selectedPortal, setSelectedPortal] = useState<'teacher' | null>(null);
  const navigate = useNavigate(); // 2. Initialize navigate

  if (selectedPortal === 'teacher') return <AuthForm portalName="Teacher Portal" role="teacher" />;

  return (
    <div className="flex-1 flex flex-col items-center justify-center -mt-16">
      <div className="mb-12 text-center">
        <h1 className="text-4xl md:text-5xl font-display font-extrabold tracking-tight mb-4">SCAN CLASS</h1>
        <p className="text-muted uppercase tracking-[0.2em] text-sm font-semibold">Facial Recognition Attendance</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6 w-full max-w-3xl">
        <div 
          onClick={() => setSelectedPortal('teacher')}
          className="group cursor-pointer p-8 rounded-2xl bg-surface border border-border hover:border-brand hover:-translate-y-1 hover:shadow-xl transition-all duration-300"
        >
          <Users className="w-12 h-12 text-cyan-accent mb-4" />
          <h2 className="text-2xl font-display font-bold mb-3">I'm a Teacher</h2>
          <p className="text-muted leading-relaxed mb-6 h-16">
            Create classes, mark and review attendance, and track student engagement from one dashboard.
          </p>
          <div className="text-brand font-semibold flex items-center gap-2 group-hover:gap-3 transition-all">
            Teacher Portal &rarr;
          </div>
        </div>

        <div 
          // 3. Change this onClick to navigate to the route defined in App.tsx
          onClick={() => navigate('/student')}
          className="group cursor-pointer p-8 rounded-2xl bg-surface border border-border hover:border-brand hover:-translate-y-1 hover:shadow-xl transition-all duration-300"
        >
          <UserSquare2 className="w-12 h-12 text-cyan-accent mb-4" />
          <h2 className="text-2xl font-display font-bold mb-3">I'm a Student</h2>
          <p className="text-muted leading-relaxed mb-6 h-16">
            Mark your attendance with a quick face scan and keep track of your own attendance record.
          </p>
          <div className="text-brand font-semibold flex items-center gap-2 group-hover:gap-3 transition-all">
            Student Portal &rarr;
          </div>
        </div>
      </div>
    </div>
  );
};