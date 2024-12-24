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
          borderColor: "rgb(255, 250, 163)",
        },
        ".secondary-border": {
          borderColor: "rgb(209 213 219 / 1)",
        },
        ".white-border": {
          borderColor: "rgb(255 255 255 / 1)",
        },
        ".alert-border": {
          borderColor: "rgb(239 68 68 / 1)",
        },
        ".alert2-border": {
          borderColor: "rgb(249 115 22 / 1)",
        },

        // Background Colour
        ".pcolor-bg": {
          backgroundColor: "rgb(255, 250, 163)",
        },
        ".p2color-bg": {
          backgroundColor: "rgb(255, 232, 138)",
        },
        ".accent-bg": {
          backgroundColor: "rgb(248, 225, 139)",
        },
        ".scolor-bg": {
          backgroundColor: "rgb(107 114 128 / 1)",
        },
        ".gcolor-bg": {
          backgroundColor: "rgb(209 213 219 / 1)",
        },
        ".g2color-bg": {
          backgroundColor: "rgb(156 163 175 / 1)",
        },
        ".dark-bg": {
          backgroundColor: "rgb(78 78 75 / 1)",
        },
        ".light-bg": {
          backgroundColor: "rgb(255 255 249 / 1)",
        },
        ".alert-bg": {
          backgroundColor: "rgb(254 242 242 / 1)",
        },

        // Text Colour
        ".pcolor-text": {
          color: "rgb(255, 250, 163)",
        },
        ".gcolor-text": {
          color: "rgb(75 85 99 / 1)",
        },
        ".primary-text": {
          color: "rgb(0 0 0 / 1)",
        },
        ".secondary-text": {
          color: "rgb(255 255 255 / 1)",
        },
        ".light-text": {
          color: "rgb(46 46 46)",
        },
        ".alert-text": {
          color: "rgb(239 68 68 / 1)",
        },
        ".alert2-text": {
          color: "rgb(185 28 28 / 1)",
        },

        // Placeholder Colours
        ".placeholder-primary": {
          "::placeholder": { color: "rgb(107 114 128)" },
        },
        ".placeholder-secondary": {
          "::placeholder": { color: "rgb(156 163 175)" },
        },
        ".placeholder-light": {
          "::placeholder": { color: "rgb(209 213 219)" },
        },
        ".placeholder-dark": {
          "::placeholder": { color: "rgb(75 85 99)" },
        },

        // Outline Colours
        ".primary-outline": {
          outlineColor: "rgb(253 186 116 / 1)",
        },

        // Fill Colours
        ".primary-fill": {
          fill: "rgb(255 255 255 /1)",
        },

        // Ring Colours
        ".ring-secondary": {
          "--tw-ring-opacity": "1",
          "--tw-ring-color": "rgb(59 130 246 / var(--tw-ring-opacity))",
        },
        ".ring-primary": {
          "--tw-ring-opacity": "1",
          "--tw-ring-color": "rgb(255 250 163 / var(--tw-ring-opacity))",
        },
      };

      addUtilities(newUtilities, ["responsive", "hover"]);
    },
  ],
};
