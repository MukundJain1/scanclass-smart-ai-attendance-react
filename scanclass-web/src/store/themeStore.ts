import { create } from 'zustand';

interface ThemeState {
  isDark: boolean;
  toggleTheme: () => void;
  initTheme: () => void;
}

// Note the extra () after <ThemeState>
export const useThemeStore = create<ThemeState>()((set) => ({
  isDark: false,
  toggleTheme: () =>
    set((state) => {
      const next = !state.isDark;
      if (next) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('theme', 'light');
      }
      return { isDark: next };
    }),
  initTheme: () => {
    const saved = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const activeDark = saved === 'dark' || (!saved && prefersDark);

    if (activeDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    set({ isDark: activeDark });
  },
}));