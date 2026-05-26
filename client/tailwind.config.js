/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        poke: {
          red: '#EE1515',
          yellow: '#FFCB05',
          blue: '#3B4CCA',
          dark: '#0b0c0e',
          panel: '#111316',
        },
      },
      fontFamily: {
        display: ['Inter', '"Segoe UI"', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
