/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        text: "var(--color-text-base)",
        background: "var(--color-background)",
        empty: "var(--color-empty)",
        primary: "var(--color-primary)",
        secondary: "var(--color-secondary)",

        accent: "var(--color-accent)",
        success: "var(--color-success)",
        danger: "var(--color-danger)",
        warning: "var(--color-warning)",
      },
    },
  },
  plugins: [],
};
