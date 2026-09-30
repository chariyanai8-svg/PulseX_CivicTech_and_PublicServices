/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        civic: {
          primary: '#0F172A',
          accent: '#2563EB',
          danger: '#DC2626',
          warning: '#D97706',
          success: '#16A34A',
        }
      }
    },
  },
  plugins: [],
}