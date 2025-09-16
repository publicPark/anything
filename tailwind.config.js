/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50: 'var(--primary-50)',
          100: 'var(--primary-100)',
          200: 'var(--primary-200)',
          300: 'var(--primary-300)',
          400: 'var(--primary-400)',
          500: 'var(--primary-500)',
          600: 'var(--primary-600)',
          700: 'var(--primary-700)',
          800: 'var(--primary-800)',
          900: 'var(--primary-900)',
        },
        success: {
          100: 'var(--success-100)',
          600: 'var(--success-600)',
          800: 'var(--success-800)',
        },
        error: {
          100: 'var(--error-100)',
          600: 'var(--error-600)',
          800: 'var(--error-800)',
        },
        warning: {
          100: 'var(--warning-100)',
          600: 'var(--warning-600)',
          800: 'var(--warning-800)',
        },
        info: {
          100: 'var(--info-100)',
          600: 'var(--info-600)',
          800: 'var(--info-800)',
        },
        // 일반적인 흑백 컬러 시스템 - CSS 변수 사용
        neutral: {
          50: 'var(--neutral-50)',
          100: 'var(--neutral-100)',
          200: 'var(--neutral-200)',
          300: 'var(--neutral-300)',
          400: 'var(--neutral-400)',
          500: 'var(--neutral-500)',
          600: 'var(--neutral-600)',
          700: 'var(--neutral-700)',
          800: 'var(--neutral-800)',
          900: 'var(--neutral-900)',
          950: 'var(--neutral-950)',
        }
      }
    },
  },
  plugins: [],
}
