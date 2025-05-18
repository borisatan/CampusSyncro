/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],  
  theme: {
    extend: {
      colors: {
        // Primary brand color (CTA, highlights)
        primary: '#3A86FF',
        primaryDark: '#1E3A8A',

        // Secondary accent
        secondary: '#5C7AFF',

        // Backgrounds
        background: '#FFFFFF',
        backgroundDark: '#0A0F1F',

        // Surfaces
        surface: '#F5F6FA',
        surfaceDark: '#1E1E1E',

        // Text
        text: '#111827',
        textLight: '#EDEDED',

        // Borders
        borderLight: '#E4E4E4',
        borderDark: '#333333',

        // Category Colors (desaturated / modern)
        category: {
          transport: '#4F90FF',
          food: '#FF6B6B',
          education: '#7C5EFF',
          savings: '#3A86FF',
          travel: '#5CB8FF',
          health: '#64C3D9',
          care: '#B284FF',
          home: '#F0A958',
          personal: '#679EFF',
          clothes: '#8CA6C1',
          medical: '#90BE6D',
        }
      },
    },
  },
  plugins: [],
}

