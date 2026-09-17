import React, { useState } from 'react';
import { api } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, LogIn, UserPlus } from 'lucide-react';

interface AuthFormProps {
  portalName: string;
  role: 'teacher' | 'student';
}

export const AuthForm: React.FC<AuthFormProps> = ({ portalName, role }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({ username: '', password: '', name: '' });
  const [error, setError] = useState('');
  
  const { login } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      if (isLogin) {
        const res = await api.post(`/auth/login/${role}`, {
          username: formData.username,
          password: formData.password
        });
        login(role, res.data[role]);
        navigate(`/${role}`);
      } else {
        await api.post(`/auth/register/${role}`, formData);
        setIsLogin(true); // Switch to login view on success
        setFormData({ ...formData, password: '' });
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'An unexpected error occurred');
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-8 rounded-2xl bg-surface border border-border shadow-lg">
      <h3 className="text-2xl font-display font-bold mb-2">{portalName} {isLogin ? 'Login' : 'Registration'}</h3>
      <p className="text-muted text-sm mb-6">
        {isLogin ? 'Welcome back — enter your details to continue.' : 'Create your account to get started.'}
      </p>

      {error && <div className="mb-4 p-3 rounded bg-red-100 text-red-700 text-sm">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-4">
        {!isLogin && (
          <input
            type="text"
            placeholder="Full Name"
            required
            className="w-full p-3 rounded-lg bg-background border border-border focus:border-brand outline-none"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
        )}
        <input
          type="text"
          placeholder="Username"
          required
          className="w-full p-3 rounded-lg bg-background border border-border focus:border-brand outline-none"
          value={formData.username}
          onChange={(e) => setFormData({ ...formData, username: e.target.value })}
        />
        <div className="relative">
          <input
            type={showPassword ? 'text' : 'password'}
            placeholder="Password"
            required
            className="w-full p-3 rounded-lg bg-background border border-border focus:border-brand outline-none"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-3.5 text-muted hover:text-text-primary"
          >
            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>

        <button
          type="submit"
          className="w-full py-3 rounded-xl bg-brand hover:bg-brand-hover text-white font-semibold flex items-center justify-center gap-2 transition-all"
        >
          {isLogin ? <><LogIn size={20} /> Login</> : <><UserPlus size={20} /> Register</>}
        </button>
      </form>

      <button
        onClick={() => setIsLogin(!isLogin)}
        className="w-full mt-4 text-sm text-muted hover:text-brand transition-colors underline underline-offset-4"
      >
        {isLogin ? 'New here? Register instead' : 'Already have an account? Login instead'}
      </button>
    </div>
  );
};