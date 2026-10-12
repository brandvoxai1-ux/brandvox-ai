/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#7C3AED',
          hover: '#6D28D9',
          light: 'rgba(124, 58, 237, 0.15)',
          glow: 'rgba(124, 58, 237, 0.4)'
        },
        darkBg: '#000000',
        amoled: '#000000',
        obsidian: '#0A0B11',
        surface: {
          DEFAULT: '#12131D',
          elevated: '#181926',
          card: '#141522',
          hover: '#222334'
        },
        success: '#00B894',
        error: '#EF4444',
        warning: '#FDCB6E'
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      boxShadow: {
        premium: '0 8px 32px 0 rgba(0, 0, 0, 0.5)',
        glow: '0 0 20px rgba(124, 58, 237, 0.45)',
        neon: '0 0 15px rgba(168, 85, 247, 0.6)'
      },
      borderRadius: {
        '2xl': '16px',
        '3xl': '24px',
        'squircle': '20px',
        xl: '12px',
        lg: '8px'
      }
    },
  },
  plugins: [],
}
