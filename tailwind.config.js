/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],  
  theme: {
    extend: {
       colors: {
        primary: "#0492c2",
        secondary: "#f9cb14",
        tertiary: "#f1f1f1",
       }
    },
  },
  plugins: [],
}

