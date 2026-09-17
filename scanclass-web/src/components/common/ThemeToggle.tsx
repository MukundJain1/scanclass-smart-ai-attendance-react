import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useThemeStore } from '../../store/themeStore';

export const ThemeToggle: React.FC = () => {
  const { isDark, toggleTheme } = useThemeStore();

  return (
    <button
      onClick={toggleTheme}
      aria-label="Toggle display theme"
      className="p-3 rounded-full border border-[#D7C0A8] dark:border-[#3A2A22] bg-[#FAECE1]/50 dark:bg-[#1E1612]/50 backdrop-blur-md hover:bg-[#F0DBC5] dark:hover:bg-[#2C201A] transition-all duration-300 hover:scale-110 hover:shadow-lg"
    >
      {isDark ? (
        <Sun className="w-5 h-5 text-[#FBBF24] transition-transform duration-500 hover:rotate-90" />
      ) : (
        <Moon className="w-5 h-5 text-[#5C3A21] transition-transform duration-500 hover:-rotate-12" />
      )}
    </button>
  );
};