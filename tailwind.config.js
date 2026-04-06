/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        dark: {
          50: "#f7f7f8",
          100: "#eeeef0",
          200: "#d9d9de",
          300: "#b8b8c1",
          400: "#91919f",
          500: "#737383",
          600: "#5e5e6c",
          700: "#4d4d58",
          800: "#42424b",
          900: "#3a3a41",
          950: "#18181b",
        },
      },
    },
  },
  plugins: [],
};
