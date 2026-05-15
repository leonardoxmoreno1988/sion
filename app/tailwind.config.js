/** @type {import('tailwindcss').Config} */
module.exports = {
  // Asegúrate de que no haya "import" aquí arriba
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    // Por si acaso estás usando alguna carpeta fuera de app
    "./src/**/*.{js,ts,jsx,tsx,mdx}", 
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}