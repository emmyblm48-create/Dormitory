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
        display: ["var(--font-prompt)", "system-ui", "sans-serif"],
      },
      colors: {
        brand: {
          50: "#F0F6FE",
          100: "#DDEBFD",
          200: "#B6D4FC",
          300: "#80B4F9",
          400: "#3C8CF6",
          500: "#0B68E5",
          600: "#0850B0",
          700: "#063B82",
          800: "#042C62",
          900: "#031F44",
        },
        bloom: {
          300: "#80B4F9",
          400: "#3C8CF6",
          500: "#0B68E5",
          600: "#0850B0",
          700: "#063B82",
        },
        cream: {
          50: "#FFFFFF",
          100: "#F0F7FF",
          200: "#E0EFFE",
        },
      },
      boxShadow: {
        glass: "0 8px 32px 0 rgba(4, 44, 98, 0.14)",
        "glass-sm": "0 4px 20px 0 rgba(4, 44, 98, 0.10)",
        "glass-lg": "0 20px 50px 0 rgba(4, 44, 98, 0.18)",
        bloom: "0 10px 30px -10px rgba(8, 80, 176, 0.45)",
        stamp: "0 2px 8px 0 rgba(4, 44, 98, 0.12)",
        paper: "0 14px 34px -14px rgba(4, 44, 98, 0.30)",
      },
      keyframes: {
        drift: {
          "0%, 100%": { transform: "translate(0px, 0px) scale(1)" },
          "50%": { transform: "translate(14px, -18px) scale(1.04)" },
        },
      },
      animation: {
        drift: "drift 26s infinite ease-in-out",
      },
      backdropBlur: {
        xs: "2px",
      },
    },
  },
  plugins: [],
};
export default config;
