/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        dark: {
          bg: "#090D16",
          card: "#111827",
          border: "#1F2937",
          text: "#F9FAFB"
        },
        brand: {
          primary: "#6366F1",
          secondary: "#4F46E5",
          success: "#10B981",
          warning: "#F59E0B",
          danger: "#EF4444"
        }
      }
    },
  },
  plugins: [],
}
