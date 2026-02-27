/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",          // ← très important
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",   // si tu as un dossier src
  ],
  theme: {
    extend: {
      // tes couleurs custom si besoin
    },
  },
  plugins: [],
}