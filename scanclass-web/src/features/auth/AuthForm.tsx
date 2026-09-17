import React, { useState } from 'react';
import { api } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Mail, Lock, Sparkles, LogIn, UserPlus, Loader2 } from 'lucide-react';

interface AuthFormProps {
  onBack: () => void;
}

export const AuthForm: React.FC<AuthFormProps> = ({ onBack }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ username: '', password: '', name: '' });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { login } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (isLogin) {
        // Hardcoded to teacher since students use the camera flow
        const res = await api.post(`/auth/login/teacher`, { username: formData.username, password: formData.password });
        login('teacher', res.data.teacher);
        navigate(`/teacher`);
      } else {
        await api.post(`/auth/register/teacher`, formData);
        setIsLogin(true); 
        setFormData({ ...formData, password: '' });
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Incorrect credentials. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[#FDF9F1] dark:bg-[#120D0A] text-[#2B1B12] dark:text-[#E8DCD0] p-4 relative overflow-hidden transition-colors duration-700">
      
      {/* Aesthetic Background */}
      <div className="absolute top-[20%] right-[10%] w-[500px] h-[500px] bg-[#B85C38]/10 blur-[120px] rounded-full pointer-events-none"></div>

      <div className="w-full max-w-[480px] mb-6 z-10">
        <button onClick={onBack} className="text-[#8A5A44] dark:text-[#B59582] hover:text-[#B85C38] dark:hover:text-white flex items-center gap-2 text-sm font-bold transition-colors bg-white/50 dark:bg-[#1E1612]/50 px-4 py-2 rounded-xl border border-[#E8DCD0] dark:border-[#3A2A22]">
          <ArrowLeft size={16} /> Back to home
        </button>
      </div>

      <div className="w-full max-w-[480px] bg-white/80 dark:bg-[#1E1612]/90 backdrop-blur-2xl border border-[#E8DCD0] dark:border-[#3A2A22] rounded-[2.5rem] p-10 sm:p-12 shadow-2xl z-10 animate-fade-in-up">
        
        <div className="flex flex-col items-center gap-3 mb-10 text-center">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#B85C38] to-[#5C2E14] flex items-center justify-center text-white shadow-lg">
            <Sparkles size={28} />
          </div>
          <h2 className="text-3xl font-display font-extrabold tracking-wide">Acharya Portal</h2>
          <p className="text-[#8A5A44] dark:text-[#B59582] font-medium">
            {isLogin ? 'Enter your credentials to manage your domains.' : 'Register as a new teacher guide.'}
          </p>
        </div>

        {/* Segmented Control */}
        <div className="flex p-1.5 bg-[#FDF9F1] dark:bg-[#181311] rounded-2xl mb-8 border border-[#E8DCD0] dark:border-[#3A2A22]">
          <button onClick={() => setIsLogin(true)} className={`flex-1 py-3 rounded-xl text-[15px] font-bold transition-all ${isLogin ? 'bg-[#B85C38] text-white shadow-md' : 'text-[#8A5A44] dark:text-[#B59582] hover:text-[#5C2E14] dark:hover:text-white'}`}>
            Sign In
          </button>
          <button onClick={() => setIsLogin(false)} className={`flex-1 py-3 rounded-xl text-[15px] font-bold transition-all ${!isLogin ? 'bg-[#B85C38] text-white shadow-md' : 'text-[#8A5A44] dark:text-[#B59582] hover:text-[#5C2E14] dark:hover:text-white'}`}>
            Register
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 text-sm font-bold rounded-xl">{error}</div>}

          {!isLogin && (
            <div>
              <label className="text-[12px] font-bold text-[#8A5A44] dark:text-[#B59582] uppercase tracking-widest mb-2 block">Full Name</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-[#B85C38]"><User size={20} /></div>
                <input type="text" placeholder="e.g. Dronacharya" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full h-14 pl-12 pr-4 rounded-xl bg-[#FDF9F1] dark:bg-[#181311] border border-[#E8DCD0] dark:border-[#3A2A22] text-[#2B1B12] dark:text-[#E8DCD0] focus:ring-2 focus:ring-[#B85C38] outline-none transition-colors text-lg font-medium" />
              </div>
            </div>
          )}

          <div>
            <label className="text-[12px] font-bold text-[#8A5A44] dark:text-[#B59582] uppercase tracking-widest mb-2 block">Username / Email</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-[#B85C38]"><Mail size={20} /></div>
              <input type="text" placeholder="you@gurukul.edu" required value={formData.username} onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                className="w-full h-14 pl-12 pr-4 rounded-xl bg-[#FDF9F1] dark:bg-[#181311] border border-[#E8DCD0] dark:border-[#3A2A22] text-[#2B1B12] dark:text-[#E8DCD0] focus:ring-2 focus:ring-[#B85C38] outline-none transition-colors text-lg font-medium" />
            </div>
          </div>

          <div>
            <label className="text-[12px] font-bold text-[#8A5A44] dark:text-[#B59582] uppercase tracking-widest mb-2 block">Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-[#B85C38]"><Lock size={20} /></div>
              <input type="password" placeholder="••••••••" required value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full h-14 pl-12 pr-4 rounded-xl bg-[#FDF9F1] dark:bg-[#181311] border border-[#E8DCD0] dark:border-[#3A2A22] text-[#2B1B12] dark:text-[#E8DCD0] focus:ring-2 focus:ring-[#B85C38] outline-none transition-colors text-lg font-medium" />
            </div>
          </div>

          <button type="submit" disabled={isLoading} className="w-full h-14 mt-4 bg-gradient-to-r from-[#B85C38] to-[#8C4A23] hover:from-[#A04D2E] hover:to-[#733A19] text-white font-extrabold text-lg rounded-xl flex items-center justify-center gap-3 transition-all hover:-translate-y-1 shadow-lg shadow-[#B85C38]/20 disabled:opacity-70 disabled:hover:translate-y-0">
            {isLoading ? <Loader2 size={22} className="animate-spin" /> : (isLogin ? <><LogIn size={22}/> Enter Portal</> : <><UserPlus size={22}/> Register</>)}
          </button>
        </form>
      </div>
    </div>
  );
};