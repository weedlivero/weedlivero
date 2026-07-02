/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx}', './components/**/*.{js,jsx}', './data/**/*.{js,jsx}', './lib/**/*.{js,jsx}'],
  theme: { extend: { colors: { brand: { green: '#22C55E', dark: '#111827', soft: '#F3FFF7' } }, boxShadow: { soft: '0 20px 50px rgba(17,24,39,.10)' } } },
  plugins: []
};
