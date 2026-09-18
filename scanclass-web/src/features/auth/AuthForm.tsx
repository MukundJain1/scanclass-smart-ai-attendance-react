import React, { useState } from 'react';
import { api } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Lock, Loader2 } from 'lucide-react';

interface AuthFormProps { onBack: () => void; }

export const AuthForm: React.FC<AuthFormProps> = ({ onBack }) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [formData, setFormData] = useState({ username: '', password: '', confirmPassword: '', name: '' });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setIsLoading(true);
    try {
      if (mode === 'login') {
        const res = await api.post(`/auth/login/teacher`, { username: formData.username, password: formData.password });
        login('teacher', res.data.teacher); navigate(`/teacher`);
      } else {
        if (formData.password !== formData.confirmPassword) throw new Error("Passwords do not match");
        await api.post(`/auth/register/teacher`, { name: formData.name, username: formData.username, password: formData.password });
        setMode('login'); setFormData({ ...formData, password: '', confirmPassword: '' });
      }
    } catch (err: any) { 
      setError(err.message || err.response?.data?.detail || 'Authentication failed.'); 
    } finally { 
      setIsLoading(false); 
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-6 relative">
      <button onClick={onBack} className="absolute top-8 left-8 text-[#94A3B8] hover:text-[#00F0FF] flex items-center gap-2 text-sm font-bold transition-colors">
        <ArrowLeft size={16} /> Back
      </button>

      <div className="w-full max-w-md bg-[#10172A]/90 backdrop-blur-2xl border border-[#1E293B] rounded-[2rem] p-10 shadow-[0_0_50px_rgba(0,0,0,0.5)] z-10 animate-fade-in-up">
        
        <div className="flex flex-col items-center gap-2 mb-8 text-center">
          <div className="flex items-center gap-2 text-2xl font-extrabold text-white mb-2">
            <span className="text-[#00F0FF]">G</span> AURA AI
          </div>
          <p className="text-[#94A3B8] font-medium">Teacher Portal Access</p>
        </div>

        {/* Tab Selection */}
        <div className="flex w-full bg-[#070B19] rounded-xl p-1 mb-6 border border-[#1E293B]">
          <button onClick={() => setMode('login')} className={`flex-1 py-3 text-sm font-bold rounded-lg transition-all ${mode === 'login' ? 'bg-[#1D4ED8] text-white shadow-[0_0_15px_rgba(29,78,216,0.3)]' : 'text-[#94A3B8] hover:text-white'}`}>
            Login
          </button>
          <button onClick={() => setMode('register')} className={`flex-1 py-3 text-sm font-bold rounded-lg transition-all ${mode === 'register' ? 'bg-[#1D4ED8] text-white shadow-[0_0_15px_rgba(29,78,216,0.3)]' : 'text-[#94A3B8] hover:text-white'}`}>
            Register
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-bold rounded-xl">{error}</div>}

          {mode === 'register' && (
            <div className="relative">
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-[#94A3B8]"><User size={18} /></div>
              <input type="text" placeholder="Full Name" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full h-14 pl-12 pr-4 rounded-xl bg-transparent border border-[#1E293B] text-white focus:border-[#00F0FF] outline-none transition-colors" />
            </div>
          )}

          <div className="relative">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-[#94A3B8]"><User size={18} /></div>
            <input type="text" placeholder="Username" required value={formData.username} onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              className="w-full h-14 pl-12 pr-4 rounded-xl bg-transparent border border-[#1E293B] text-white focus:border-[#00F0FF] outline-none transition-colors" />
          </div>

          <div className="relative">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-[#94A3B8]"><Lock size={18} /></div>
            <input type="password" placeholder="Password" required value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full h-14 pl-12 pr-4 rounded-xl bg-transparent border border-[#1E293B] text-white focus:border-[#00F0FF] outline-none transition-colors" />
          </div>

          {mode === 'register' && (
            <div className="relative">
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-[#94A3B8]"><Lock size={18} /></div>
              <input type="password" placeholder="Confirm Password" required value={formData.confirmPassword} onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                className="w-full h-14 pl-12 pr-4 rounded-xl bg-transparent border border-[#1E293B] text-white focus:border-[#00F0FF] outline-none transition-colors" />
            </div>
          )}

          <button type="submit" disabled={isLoading} className="w-full h-14 mt-6 bg-[#1D4ED8] hover:bg-[#2563EB] text-white font-bold rounded-xl flex items-center justify-center transition-all shadow-[0_0_15px_rgba(29,78,216,0.3)] disabled:opacity-70">
            {isLoading ? <Loader2 size={20} className="animate-spin" /> : (mode === 'login' ? 'Login Securely' : 'Create Account')}
          </button>
        </form>
      </div>
    </div>
  );
};