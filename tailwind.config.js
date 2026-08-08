/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./App.tsx', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  darkMode: 'media',
  theme: {
    extend: {
      colors: {
        bg: {
          light: '#FFFFFF',
          dark: '#0D0D0D',
        },
        text: {
          primary: {
            light: '#111111',
            dark: '#F5F5F5',
          },
          secondary: '#6B6B6B',
        },
        border: {
          light: '#E5E5E5',
          dark: '#2A2A2A',
        },
        accent: {
          alert: '#E23F3F',
          success: '#3FA65C',
        },
        surface: {
          light: '#FFFFFF',
          dark: '#161616',
        },
      },
      borderRadius: {
        card: '20px',
      },
    },
  },
  plugins: [],
};
