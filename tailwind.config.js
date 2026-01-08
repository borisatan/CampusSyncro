/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],  
  theme: {
    extend: {
      colors: {
        background: '#FFFFFF',       // light mode main
        backgroundMuted: '#E4E4E4',  // selected account light mode
        backgroundDark: '#0A0F1F',   // dark mode main
        surfaceDark: '#20283A',      // modal dark background
        inputDark: '#1F2937',        // dark input background

        accentTeal: '#2A9D8F',       // edit/done button
        accentBlue: '#2563EB',       // confirm/enter button
        accentPurple: "#8A00C2",
        accentRed: '#EF4444',        // delete button
        darkRed: '#8B0000',

        textLight: '#000000',        // primary light text
        textDark: '#FFFFFF',         // primary dark text
        placeholderLight: '#888888', // input placeholder (light)
        placeholderDark: '#AAAAAA',  // input placeholder (dark)
        secondaryLight: '#4B5563',   // gray-700
        secondaryDark: '#9CA3AF',    // gray-400

        borderLight: '#D1D5DB',      // gray-300
        borderDark: '#4B5563',       // gray-600

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

