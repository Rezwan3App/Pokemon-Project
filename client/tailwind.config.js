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
          dark: '#1a1a2e',
          panel: '#16213e',
        },
      },
      fontFamily: {
        display: ['"Segoe UI"', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
