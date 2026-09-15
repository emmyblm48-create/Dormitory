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
          50: "#EFF6FF",
          100: "#DBEAFE",
          200: "#BFDBFE",
          300: "#93C5FD",
          400: "#60A5FA",
          500: "#3B82F6",
          600: "#2563EB",
          700: "#1D4ED8",
          800: "#1E40AF",
          900: "#1E3A8A",
        },
        bloom: {
          300: "#BAE6FD",
          400: "#7DD3FC",
          500: "#38BDF8",
          600: "#0EA5E9",
          700: "#0284C7",
        },
        cream: {
          50: "#FFFFFF",
          100: "#F0F7FF",
          200: "#E0EFFE",
        },
      },
      boxShadow: {
        glass: "0 8px 32px 0 rgba(30, 64, 175, 0.14)",
        "glass-sm": "0 4px 20px 0 rgba(30, 64, 175, 0.10)",
        "glass-lg": "0 20px 50px 0 rgba(30, 64, 175, 0.18)",
        bloom: "0 10px 30px -10px rgba(14, 165, 233, 0.45)",
        stamp: "0 2px 8px 0 rgba(30, 64, 175, 0.12)",
        paper: "0 14px 34px -14px rgba(30, 64, 175, 0.30)",
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
