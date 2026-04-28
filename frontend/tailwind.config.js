/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: '#0033ff',
          secondary: '#0026cc',
          light: '#3366ff',
          dark: '#002299',
        },
        neutral: {
          primary: '#ffffff',
          secondary: '#f0f1f5',
          tertiary: '#d2d9e1',
          'dark-gray': '#565b60',
          'mid-gray': '#919397',
        },
        status: {
          success: '#11a88a',
          danger: '#e62333',
          warning: '#f5a623',
          info: '#0033ff',
        },
      },
      fontFamily: {
        sans: ['basisGrotesque', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['basisGrotesqueMono', 'monospace'],
        serif: ['freightBig', 'Georgia', 'serif'],
      },
      spacing: {
        'container': '76.5rem',
      },
      screens: {
        'xs': '475px',
        'sm': '640px',
        'md': '768px',
        'lg': '1024px',
        'xl': '1312px',
        '2xl': '1536px',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'pulse-slow': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce-slow': 'bounce 1.5s infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}