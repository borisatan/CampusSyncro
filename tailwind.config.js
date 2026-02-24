/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        background: "#FFFFFF", // light mode main
        backgroundMuted: "#E4E4E4", // selected account light mode
        backgroundDark: "#08090F", // dark mode main
        surfaceDark: "#161B2E", // modal dark background
        inputDark: "#1C2238", // dark input background

        accentTeal: "#1DB8A3", // edit/done button
        accentBlue: "#3B7EFF", // confirm/enter button
        accentPurple: "#8A00C2",
        accentRed: "#F2514A", // delete button
        darkRed: "#8B0000",
        accentGreen: "#22D97A", // success/green
        accentAmber: "#F4A623", // warning/amber
        accentYellow: "#FCD34D", // yellowr
        accentIndigo: "#4338CA", // indigo
        accentSkyBlue: "#3B82F6", // sky blue

        textLight: "#000000", // primary light text
        textDark: "#EDF0FA", // primary dark text
        placeholderLight: "#888888", // input placeholder (light)
        placeholderDark: "#AAAAAA", // input placeholder (dark)
        secondaryLight: "#4B5563", // gray-700
        secondaryDark: "#8A96B4", // blue-tinted gray

        borderLight: "#D1D5DB", // gray-300
        borderDark: "#2A3250", // cool navy border

        // Surface colors
        surfaceLight: "#F8FAFC", // light surface
        surfaceLightAlt: "#F5F5F4", // stone light surface
        surfaceLightGray: "#F3F4F6", // gray light surface
        surfaceDarkAlt: "#1C2238", // darker surface
        surfaceDarkGray: "#1F2937", // dark gray surface

        // Slate colors
        slate50: "#F1F5F9",
        slate100: "#E2E8F0",
        slate200: "#CBD5E1",
        slate300: "#94A3B8",
        slate400: "#64748B",
        slate500: "#475569",
        slate600: "#334155",
        slate700: "#1E293B",
        slate800: "#0F172A",
        slateMuted: "#7C8CA0",
        slateLighter: "#8B99AE",

        // Gray colors
        gray400: "#9CA3AF",
        gray500: "#6B7280",
        gray600: "#4B5563",
        gray700: "#374151",

        // Overlay colors
        overlayDark: "rgba(0,0,0,0.6)",
        overlayLight: "rgba(255,255,255,0.2)",
        overlayAmber: "rgba(245,158,11,0.12)",
        overlayRed: "rgba(239,68,68,0.1)",
        overlayRedLight: "rgba(239,68,68,0.06)",
        overlayRedMedium: "rgba(239,68,68,0.2)",
        overlayRedDark: "rgba(239,68,68,0.3)",
        overlayGreen: "#22C55E40",

        // Category Colors (desaturated / modern)
        category: {
          transport: "#4F90FF",
          food: "#FF6B6B",
          education: "#7C5EFF",
          savings: "#3A86FF",
          travel: "#5CB8FF",
          health: "#64C3D9",
          care: "#B284FF",
          home: "#F0A958",
          personal: "#679EFF",
          clothes: "#8CA6C1",
          medical: "#90BE6D",
        },
      },
    },
  },
  plugins: [],
};
