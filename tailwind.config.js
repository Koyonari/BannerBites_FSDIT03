const { grey } = require("@mui/material/colors");
const { light } = require("@mui/material/styles/createPalette");

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: ["./src/**/*.{js,jsx,ts,tsx}", "*.jsx", "App.js"],
  theme: {
    extend: {
      colors: {
        // Colours
        base: {
          black: "rgb(0, 0, 0)",
          white: "rgb(255, 255, 255)",
          grey: "rgb(128, 128, 128)",
          lightgrey: "rgb(211, 211, 211)",
        },
        text: {
          accent: "rgb(0, 217, 255)",
          light: "rgb(46, 46, 46)",
          dark: "rgb(250, 250, 250)",
          sublight: "rgb(114, 114, 114)",
          subdark: "rgb(122, 122, 122)",
          alert: "rgb(255, 112, 112)",
          subalert: "rgb(255, 31, 31)",
        },
        bg: {
          accent: "rgb(0, 217, 255)",
          subaccent: "rgb(161, 241, 255)",
          light: "rgb(255, 255, 243)",
          dark: "rgb(78, 76, 75)",
          alert: "rgb(239, 68, 68)",
          subalert: "rgb(185, 28, 28)",
        },
        border: {
          light: "rgb(107, 114, 128)",
          dark: "rgb(209, 213, 219)",
          alert: "rgb(239, 68, 75)",
          subalert: "rgb(209, 31, 31)",
        },
        ring: {
          primary: "rgb(163 220 255)",
        },
        placeholder: {
          light: "rgb(107, 114, 128)",
          dark: "rgb(209, 213, 219)",
        },
      },
    },

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
    function ({ addUtilities, theme }) {
      const newUtilities = {
        ".outline-3": {
          "-webkit-text-stroke": "3px",
          "-webkit-text-stroke-color": theme("colors.base.black"),
        },
        ".outline-1": {
          "-webkit-text-stroke": "0.4px",
          "-webkit-text-stroke-color": theme("colors.base.black"),
        },

        // Border Colours
        ".primary-border": {
          borderColor: theme("colors.border.light"),
        },
        ".secondary-border": {
          borderColor: theme("colors.border.dark"),
        },
        ".white-border": {
          borderColor: theme("colors.base.white"),
        },
        ".alert-border": {
          borderColor: theme("colors.border.alert"),
        },
        ".alert2-border": {
          borderColor: theme("colors.border.subalert"),
        },

        // Background Colours
        ".pcolor-bg": {
          backgroundColor: theme("colors.bg.accent"),
        },
        ".p2color-bg": {
          backgroundColor: theme("colors.bg.subaccent"),
        },
        ".accent-bg": {
          backgroundColor: theme("colors.bg.accent"),
        },
        ".scolor-bg": {
          backgroundColor: theme("colors.base.grey"),
        },
        ".gcolor-bg": {
          backgroundColor: theme("colors.base.lightgrey"),
        },
        ".g2color-bg": {
          backgroundColor: theme("colors.base.grey"),
        },
        ".dark-bg": {
          backgroundColor: theme("colors.bg.dark"),
        },
        ".light-bg": {
          backgroundColor: theme("colors.bg.light"),
        },
        ".alert-bg": {
          backgroundColor: theme("colors.bg.alert"),
        },

        // Text Colours
        ".pcolor-text": {
          color: theme("colors.text.accent"),
        },
        ".gcolor-text": {
          color: theme("colors.text.sublight"),
        },
        ".primary-text": {
          color: theme("colors.text.light"),
        },
        ".secondary-text": {
          color: theme("colors.text.dark"),
        },
        ".light-text": {
          color: theme("colors.text.light"),
        },
        ".alert-text": {
          color: theme("colors.text.alert"),
        },
        ".alert2-text": {
          color: theme("colors.text.subalert"),
        },

        // Placeholder Colours
        ".placeholder-primary::placeholder": {
          color: theme("colors.placeholder.light"),
        },
        ".placeholder-secondary::placeholder": {
          color: theme("colors.placeholder.dark"),
        },

        // Ring Colours
        ".ring-primary": {
          "--tw-ring-opacity": "1",
          "--tw-ring-color": `(theme("colors.ring.primary") / var(--tw-ring-opacity)))`,
        },
      };
      addUtilities(newUtilities, ["responsive", "hover"]);
    },
  ],
};
