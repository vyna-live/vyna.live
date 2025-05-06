/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./popup/**/*.{html,js}",
    "./options/**/*.{html,js}",
    "./content/**/*.{html,js}"
  ],
  theme: {
    extend: {
      colors: {
        primary: '#A67D44',
        secondary: '#E8DACA',
        background: '#121212',
        'background-darker': '#0A0A0A',
        'input-bg': '#2A2A2A',
        'border-color': '#333333'
      },
      borderRadius: {
        DEFAULT: '8px',
        'lg': '14px'
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif']
      },
      boxShadow: {
        'sm': '0 1px 2px rgba(0, 0, 0, 0.1)',
        DEFAULT: '0 2px 4px rgba(0, 0, 0, 0.1)',
        'md': '0 3px 6px rgba(0, 0, 0, 0.15)',
        'lg': '0 4px 8px rgba(0, 0, 0, 0.2)'
      },
      borderWidth: {
        '1': '1px',
        '2': '2px',
        '3': '3px',
        '4': '4px',
      }
    },
  },
  plugins: [],
}