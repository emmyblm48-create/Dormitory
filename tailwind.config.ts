import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-prompt)", "system-ui", "sans-serif"],
      },
      colors: {
        brand: {
          50: "#EEF4FF",
          100: "#DCE9FF",
          200: "#BBD5FF",
          300: "#8FB8FF",
          400: "#5D93FF",
          500: "#3B7CF5",
          600: "#2563EB",
          700: "#1D4ED8",
          800: "#1E40AF",
          900: "#172554",
        },
      },
      boxShadow: {
        glass: "0 8px 32px 0 rgba(29, 78, 216, 0.14)",
        "glass-sm": "0 4px 20px 0 rgba(29, 78, 216, 0.10)",
        "glass-lg": "0 20px 50px 0 rgba(29, 78, 216, 0.18)",
      },
      keyframes: {
        blob: {
          "0%, 100%": { transform: "translate(0px, 0px) scale(1)" },
          "33%": { transform: "translate(24px, -32px) scale(1.08)" },
          "66%": { transform: "translate(-18px, 18px) scale(0.95)" },
        },
      },
      animation: {
        blob: "blob 20s infinite ease-in-out",
      },
      backdropBlur: {
        xs: "2px",
      },
    },
  },
  plugins: [],
};
export default config;
