/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: ["./src/**/*.{js,jsx,ts,tsx}", "*.jsx", "App.js"],
  theme: {
    extend: {
      colors: {
        primary: {
          yellow: "rgb(255, 250, 163)",
          yellow2: "rgb(255, 232, 138)",
          accent: "rgb(248, 225, 139)",
        },
        gray: {
          100: "rgb(255, 255, 249)",
          200: "rgb(209, 213, 219)",
          300: "rgb(156, 163, 175)",
          400: "rgb(107, 114, 128)",
          500: "rgb(75, 85, 99)",
          600: "rgb(46, 46, 46)",
          700: "rgb(78, 78, 75)",
        },
        alert: {
          red: "rgb(239, 68, 68)",
          darkRed: "rgb(185, 28, 28)",
          orange: "rgb(249, 115, 22)",
          bg: "rgb(254, 242, 242)",
        },
        base: {
          black: "rgb(0, 0, 0)",
          white: "rgb(255, 255, 255)",
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
          borderColor: theme("colors.primary.yellow"),
        },
        ".secondary-border": {
          borderColor: theme("colors.gray.200"),
        },
        ".white-border": {
          borderColor: theme("colors.base.white"),
        },
        ".alert-border": {
          borderColor: theme("colors.alert.red"),
        },
        ".alert2-border": {
          borderColor: theme("colors.alert.orange"),
        },

        // Background Colours
        ".pcolor-bg": {
          backgroundColor: theme("colors.primary.yellow"),
        },
        ".p2color-bg": {
          backgroundColor: theme("colors.primary.yellow2"),
        },
        ".accent-bg": {
          backgroundColor: theme("colors.primary.accent"),
        },
        ".scolor-bg": {
          backgroundColor: theme("colors.gray.400"),
        },
        ".gcolor-bg": {
          backgroundColor: theme("colors.gray.200"),
        },
        ".g2color-bg": {
          backgroundColor: theme("colors.gray.300"),
        },
        ".dark-bg": {
          backgroundColor: theme("colors.gray.700"),
        },
        ".light-bg": {
          backgroundColor: theme("colors.gray.100"),
        },
        ".alert-bg": {
          backgroundColor: theme("colors.alert.bg"),
        },

        // Text Colours
        ".pcolor-text": {
          color: theme("colors.primary.yellow"),
        },
        ".gcolor-text": {
          color: theme("colors.gray.500"),
        },
        ".primary-text": {
          color: theme("colors.base.black"),
        },
        ".secondary-text": {
          color: theme("colors.base.white"),
        },
        ".light-text": {
          color: theme("colors.gray.600"),
        },
        ".alert-text": {
          color: theme("colors.alert.red"),
        },
        ".alert2-text": {
          color: theme("colors.alert.darkRed"),
        },

        // Placeholder Colours
        ".placeholder-primary::placeholder": {
          color: theme("colors.gray.400"),
        },
        ".placeholder-secondary::placeholder": {
          color: theme("colors.gray.300"),
        },
        ".placeholder-light::placeholder": {
          color: theme("colors.gray.200"),
        },
        ".placeholder-dark::placeholder": {
          color: theme("colors.gray.500"),
        },

        // Ring Colours
        ".ring-primary": {
          "--tw-ring-opacity": "1",
          "--tw-ring-color": `rgb(255 250 163 / var(--tw-ring-opacity))`,
        },
      };
      addUtilities(newUtilities, ["responsive", "hover"]);
    },
  ],
};
