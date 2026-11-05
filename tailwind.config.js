/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './**/*.html', '!./node_modules/**'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Manrope', 'sans-serif'],
        mono: ['DM Mono', 'monospace']
      },
      colors: {
        ink: '#17191d',
        muted: '#737780',
        line: '#e7e9ed',
        paper: '#f7f8fa',
        accent: '#4169e1'
      },
      boxShadow: {
        soft: '0 16px 48px rgba(20, 28, 45, .07)'
      }
    }
  },
  plugins: []
};
