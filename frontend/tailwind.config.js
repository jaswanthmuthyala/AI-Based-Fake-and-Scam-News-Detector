/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        classic: {
          background: 'var(--background)',
          pageBg: 'var(--background)',
          surface: 'var(--surface)',
          surfaceElevated: 'var(--surface-elevated)',
          inputBg: 'var(--input-background)',
          primary: 'var(--text-primary)',
          navy: 'var(--text-primary)',
          charcoal: 'var(--text-primary)',
          secondary: 'var(--text-secondary)',
          muted: 'var(--text-muted)',
          border: 'var(--border)',
          accent: 'var(--accent)',
          gold: 'var(--accent)',
          sidebar: 'var(--sidebar-bg)',
          safe: 'var(--safe)',
          suspicious: 'var(--suspicious)',
          dangerous: 'var(--dangerous)',
          mutedBlue: 'var(--muted-blue)'
        }
      },
      fontFamily: {
        display: ['Playfair Display', 'Fraunces', 'serif'],
        sans: ['Inter', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.6s ease-out forwards',
        'slide-up': 'slideUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'pulse-slow': 'pulseSlow 4s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseSlow: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.8' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        }
      },
      boxShadow: {
        'classic': '0 10px 30px rgba(20, 33, 61, 0.05)',
        'classic-hover': '0 20px 40px rgba(20, 33, 61, 0.08)',
      }
    },
  },
  plugins: [],
}
