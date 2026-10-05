/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        present: {
          light: '#10b981', // emerald-500
          dark: '#059669', // emerald-600
          bg: '#ecfdf5', // emerald-50
        },
        absent: {
          light: '#f43f5e', // rose-500
          dark: '#e11d48', // rose-600
          bg: '#fff1f2', // rose-50
        },
        halfday: {
          light: '#f59e0b', // amber-500
          dark: '#d97706', // amber-600
          bg: '#fffbeb', // amber-50
        },
        leave: {
          light: '#3b82f6', // blue-500
          dark: '#2563eb', // blue-600
          bg: '#eff6ff', // blue-50
        }
      }
    },
  },
  plugins: [],
}
