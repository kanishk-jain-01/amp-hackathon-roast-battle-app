/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'roast-orange': '#FF6B35',
        'roast-purple': '#7209B7',
        'roast-dark': '#1A1A1A',
      },
    },
  },
  plugins: [require('daisyui')],
} 