/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx}", "./components/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        hijau: { DEFAULT: "#1E7B34", tua: "#14582A", daun: "#6B9E2F", muda: "#E6F0DC" },
        kuning: "#F5B800",
        jingga: "#F28C1B",
        krem: "#FAF8F1",
        tinta: "#1B2A1F",
      },
      fontFamily: {
        sans: ["var(--font-poppins)", "Inter", "system-ui", "sans-serif"],
        arab: ["var(--font-amiri)", "serif"],
      },
      borderRadius: { kartu: "1.5rem" },
    },
  },
  plugins: [],
};
