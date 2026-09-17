import { create } from 'zustand';

interface AuthState {
  isLoggedIn: boolean;
  userRole: 'teacher' | 'student' | null;
  userData: any | null;
  login: (role: 'teacher' | 'student', data: any) => void;
  logout: () => void;
}

// Note the extra () after <AuthState>
export const useAuthStore = create<AuthState>()((set) => ({
  isLoggedIn: false,
  userRole: null,
  userData: null,
  login: (role, data) => set({ isLoggedIn: true, userRole: role, userData: data }),
  logout: () => set({ isLoggedIn: false, userRole: null, userData: null }),
}));