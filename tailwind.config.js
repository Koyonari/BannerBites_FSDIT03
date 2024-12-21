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
      "3xl": "1792px",
      "4xl": "2048px",
      "5xl": "2304px",
    },
  },
  plugins: [
    function ({ addUtilities }) {
      const newUtilities = {
        ".outline-3": {
          "-webkit-text-stroke": "3px",
          "-webkit-text-stroke-color": "#000000",
        },
        ".outline-1": {
          "-webkit-text-stroke": "0.4px",
          "-webkit-text-stroke-color": "#000000",
        },

        // Border Colour
        ".primary-border": {
          borderColor: "rgb(249 115 22 / 1)",
        },

        // Background Colour
        ".pcolor-bg": {
          backgroundColor: "rgb(249 115 22 / 1)",
        },
        ".dark-bg": {
          backgroundColor: "rgb(0 0 0 / 1)",
        },
        ".light-bg": {
          backgroundColor: "rgb(255 255 255 / 1)",
        },

        // Text Colour
        ".pcolor-text": {
          color: "rgb(249 115 22 / 1)",
        },
        ".primary-text": {
          color: "rgb(0 0 0 / 1)",
        },
        ".secondary-text": {
          color: "rgb(255 255 255 / 1)",
        },
      };

      addUtilities(newUtilities, ["responsive", "hover"]);
    },
  ],
};
