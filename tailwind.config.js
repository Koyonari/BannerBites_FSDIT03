/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: ["./src/**/*.{js,jsx,ts,tsx}", "*.jsx", "App.js"],
  theme: {
    extend: {},
    screens: {
      sl: "375px",
      ss: "415px",
      sm: "640px",
      md: "768px",
      lg: "1024px",
      xl: "1280px",
      "2xl": "1536px",
    },
  },
  plugins: [
    function ({ addUtilities }) {
      const newUtilities = {
        ".outline-3": {
          "-webkit-text-stroke": "3px",
        },
      };

      addUtilities(newUtilities, ["responsive", "hover"]);
    },
  ],
};
