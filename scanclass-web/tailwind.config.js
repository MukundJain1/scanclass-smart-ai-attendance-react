/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        background: 'var(--bg-app)',
        surface: 'var(--bg-surface)',
        border: 'var(--border-color)',
        brand: {
          DEFAULT: 'var(--brand-primary)',
          hover: 'var(--brand-hover)',
        },
        muted: 'var(--text-muted)',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        display: ['Sora', 'sans-serif'],
      },
    },
  },
  plugins: [],
};