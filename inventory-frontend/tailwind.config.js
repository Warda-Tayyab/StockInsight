/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          dark: '#0f172a',
          navy: '#1e1b4b',
          indigo: '#3730a3',
          accent: '#22d3ee',
          muted: '#94a3b8',
        },
        primary: {
          DEFAULT: '#4f46e5',
          50: '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
        },
      },
      boxShadow: {
        card: '0 4px 24px rgba(15, 23, 42, 0.06)',
        'card-hover': '0 12px 40px rgba(15, 23, 42, 0.1)',
        sidebar: '4px 0 24px rgba(0, 0, 0, 0.12)',
      },
      backgroundImage: {
        'brand-gradient': 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)',
        'brand-btn': 'linear-gradient(to right, #0f172a, #3730a3, #581c87)',
        'brand-btn-hover': 'linear-gradient(to right, #1e293b, #4338ca, #6b21a8)',
      },
    },
  },
  plugins: [],
}
