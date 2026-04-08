/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./App.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        page: '#FBFAF8',
        card: '#FFFFFF',
        elevated: '#F1EDEB',

        text: '#111217',
        text2: '#6B6F75',
        muted: '#A9ADB2',

        accent: '#F5BCA4',
        accent2: '#A6D4C0',

        success: '#4CAF50',
        warning: '#F5B301',
        danger: '#E04E4E',

        overlay: 'rgba(9,10,11,0.48)',
      },
    },
  },
  plugins: [],
};

