/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        brand: '#06b6d4'
      },
      fontFamily: {
        sans: ['Geist Variable', 'system-ui', 'sans-serif']
      }
    }
  },
  plugins: []
};
