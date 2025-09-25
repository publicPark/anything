/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "var(--primary)",
          foreground: "var(--primary-foreground)",
          hover: "var(--primary-hover)",
          active: "var(--primary-active)",
          light: "var(--primary-light)",
        },
        success: {
          100: "var(--success-100)",
          600: "var(--success-600)",
          800: "var(--success-800)",
          foreground: "var(--success-foreground)",
        },
        error: {
          100: "var(--error-100)",
          600: "var(--error-600)",
          800: "var(--error-800)",
        },
        warning: {
          100: "var(--warning-100)",
          600: "var(--warning-600)",
          800: "var(--warning-800)",
        },
        info: {
          100: "var(--info-100)",
          600: "var(--info-600)",
          800: "var(--info-800)",
        },

        // 중성 색상 - 선원 역할용
        neutral: {
          200: "var(--neutral-200)",
          700: "var(--neutral-700)",
          800: "var(--neutral-800)",
        },
      },
    },
  },
  plugins: [],
};
