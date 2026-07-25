/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        abyss: '#07161f',
        tide: '#0f2533',
        cyanGlow: '#8fdfff',
        amberPulse: '#f7b500',
        panel: 'rgba(7, 22, 31, 0.72)',
      },
      boxShadow: {
        panel: '0 24px 80px rgba(2, 8, 15, 0.34)',
      },
      fontFamily: {
        sans: ['Segoe UI', 'Trebuchet MS', 'sans-serif'],
      },
      backgroundImage: {
        'dashboard-wash':
          'radial-gradient(circle at top right, rgba(64, 180, 224, 0.28) 0%, transparent 38%), linear-gradient(160deg, #06121a 8%, #11222f 100%)',
      },
    },
  },
  plugins: [],
};
