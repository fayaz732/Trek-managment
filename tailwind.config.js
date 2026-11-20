/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        forest: {
          50: '#f2f6f3',
          100: '#dfe9e1',
          200: '#b9cebd',
          300: '#8fae95',
          400: '#628c6a',
          500: '#43704c',
          600: '#33583c',
          700: '#294730',
          800: '#1c3320',
          900: '#122217',
        },
        khaki: {
          50: '#faf8f2',
          100: '#f2ecdc',
          200: '#e4d6b3',
          300: '#d3ba82',
          400: '#c2a05a',
          500: '#a9843f',
        },
        mist: {
          400: '#7fa3ad',
          500: '#5b8c9e',
          600: '#456e7d',
        },
        char: {
          800: '#25281f',
          900: '#181a15',
        },
      },
      fontFamily: {
        display: ['"Spectral"', 'serif'],
        body: ['"Manrope"', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
