/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#93c5fd', // Pastel blue
          700: '#60a5fa',
          800: '#3b82f6',
          900: '#1e40af',
        },
        secondary: {
          50: '#fdf2f8',
          100: '#fce7f3',
          200: '#fbcfe8',
          300: '#f9a8d4',
          400: '#f472b6',
          500: '#ec4899',
          600: '#f9a8d4', // Pastel pink
          700: '#f472b6',
          800: '#ec4899',
          900: '#be185d',
        },
        pastel: {
          blue: '#93c5fd',
          pink: '#f9a8d4',
          purple: '#c4b5fd',
          green: '#86efac',
          yellow: '#fde047',
          orange: '#fdba74',
          red: '#fca5a5',
          teal: '#5eead4',
          indigo: '#a5b4fc',
          cyan: '#67e8f9',
        },
      },
      fontFamily: {
        arabic: ['Cairo', 'Tajawal', 'Arial', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
