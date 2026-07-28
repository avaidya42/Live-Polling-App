/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          bg: '#12141A',        // page background — deep charcoal-navy
          surface: '#1B1E27',   // card surface
          surfaceHover: '#232733',
          border: '#2C303C',
          amber: '#E3A23C',     // primary accent — stamped ink
          amberDim: '#8A6526',
          teal: '#4FC9B8',      // secondary accent for contrast bars
          text: '#F1EEE6',      // warm off-white
          textMuted: '#9599A6',
          danger: '#E0654F',
        },
      },
      fontFamily: {
        display: ['Fraunces', 'ui-serif', 'serif'],
        body: ['Inter', 'ui-sans-serif', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      keyframes: {
        pulseDot: {
          '0%, 100%': { opacity: 1, transform: 'scale(1)' },
          '50%': { opacity: 0.4, transform: 'scale(0.8)' },
        },
        fillBar: {
          from: { width: '0%' },
        },
      },
      animation: {
        pulseDot: 'pulseDot 1.6s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
