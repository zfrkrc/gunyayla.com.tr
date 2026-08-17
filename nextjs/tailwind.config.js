/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: { 50: "#eef4f9", 100: "#d6e4f0", 200: "#adc8e1", 300: "#7ba6c9", 400: "#4a7ba6", 500: "#234d78", 600: "#1a3a5c", 700: "#16314d", 800: "#0f2238", 900: "#0a1a2a" },
        accent: { 50: "#fdf7e9", 100: "#faecc8", 200: "#f5d68b", 300: "#f0c35f", 400: "#E8A020", 500: "#d18a10", 600: "#c47d10", 700: "#9e630c", 800: "#7a4a09", 900: "#5c3807" },
      },
    },
  },
  plugins: [],
}
