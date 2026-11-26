/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./app.js"],
  darkMode: "class",
  corePlugins: {
    preflight: false,
  },
  theme: {
    extend: {
      colors: {
        obsidian: {
          950: "#090a0b",
          900: "#0b0d0e",
          850: "#14171a",
        },
      },
    },
  },
  plugins: [],
};
