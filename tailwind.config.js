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
          black: "#000000",
          white: "#FFFFFF",
          grey: "#A0AEC0",
          lightgrey: "#E2E8F0",
        },
        text: {
          accent: "#1E9AFF",
          light: "#2D3748",
          dark: "#E2E8F0",
          sublight: "#8a98ab",
          subdark: "#A0AEC0",
          alert: "#E53E3E",
          subalert: "#C53030",
        },
        bg: {
          accent: "#1E9AFF",
          subaccent: "#63B3ED",
          light: "#F7FAFC",
          dark: "#1A202C",
          alert: "#E53E3E",
          subalert: "#C53030",
        },
        border: {
          light: "#CBD5E0",
          dark: "#4A5568",
          alert: "#E53E3E",
          subalert: "#C53030",
        },
        ring: {
          primary: "#90CDF4",
        },
        placeholder: {
          light: "#A0AEC0",
          dark: "#718096",
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
        ".outline-8": {
          "-webkit-text-stroke": "8px",
          "-webkit-text-stroke-color": theme("colors.base.black"),
          "paint-order": "stroke fill",
        },
        ".outline-5": {
          "-webkit-text-stroke": "5px",
          "-webkit-text-stroke-color": theme("colors.base.black"),
          "paint-order": "stroke fill",
        },
        ".outline-1": {
          "-webkit-text-stroke": "0.4px",
          "-webkit-text-stroke-color": theme("colors.base.black"),
          "paint-order": "stroke fill",
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
        ".primary-bg": {
          backgroundColor: theme("colors.bg.accent"),
        },
        ".secondary-bg": {
          backgroundColor: theme("colors.bg.subaccent"),
        },
        ".accent-bg": {
          backgroundColor: theme("colors.bg.accent"),
        },
        ".tertiary-bg": {
          backgroundColor: theme("colors.base.grey"),
        },
        ".neutral-bg": {
          backgroundColor: theme("colors.base.lightgrey"),
        },
        ".neutralalt-bg": {
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
        ".accent-text": {
          color: theme("colors.text.accent"),
        },
        ".neutral-text": {
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
          "--tw-ring-color": theme("colors.ring.primary"),
        },
      };
      addUtilities(newUtilities, ["responsive", "hover"]);
    },
  ],
};
