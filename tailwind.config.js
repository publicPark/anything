/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f4ff',  // 매우 연한 navy
          100: '#e0e7ff', // 연한 navy
          200: '#c7d2fe', // 연한 navy
          300: '#a5b4fc', // 중간 연한 navy
          400: '#818cf8', // 중간 navy
          500: '#6366f1', // 기본 navy
          600: '#4f46e5', // 진한 navy
          700: '#4338ca', // 진한 navy
          800: '#3730a3', // 매우 진한 navy
          900: '#312e81', // 거의 검은 navy
        },
        success: {
          100: '#d1fae5',
          600: '#059669',
          800: '#065f46',
        },
        error: {
          100: '#fee2e2',
          600: '#dc2626',
          800: '#991b1b',
        },
        warning: {
          100: '#fef3c7',
          600: '#d97706',
          800: '#92400e',
        },
        info: {
          100: '#dbeafe',
          600: '#2563eb',
          800: '#1e40af',
        },
        // 일반적인 흑백 컬러 시스템
        neutral: {
          50: '#fafafa',   // 매우 연한 회색
          100: '#f5f5f5',  // 연한 회색
          200: '#e5e5e5',  // 연한 회색
          300: '#d4d4d4',  // 중간 연한 회색
          400: '#a3a3a3',  // 중간 회색
          500: '#737373',  // 중간 회색
          600: '#525252',  // 중간 진한 회색
          700: '#404040',  // 진한 회색
          800: '#262626',  // 매우 진한 회색
          900: '#171717',  // 거의 검은색
          950: '#0a0a0a',  // 검은색
        }
      }
    },
  },
  plugins: [],
}
