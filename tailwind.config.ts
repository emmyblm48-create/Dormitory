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
        display: ["var(--font-display)", "system-ui", "sans-serif"],
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
        mustard: {
          300: "#C7D2FE",
          400: "#A5B4FC",
          500: "#818CF8",
          600: "#6366F1",
        },
        mint: {
          300: "#A5F3FC",
          400: "#67E8F9",
          500: "#22D3EE",
          600: "#06B6D4",
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
          "0%, 100%": { transform: "translate(0px, 0px) rotate(var(--r, 0deg)) scale(1)" },
          "33%": { transform: "translate(20px, -26px) rotate(calc(var(--r, 0deg) + 4deg)) scale(1.06)" },
          "66%": { transform: "translate(-16px, 16px) rotate(calc(var(--r, 0deg) - 3deg)) scale(0.96)" },
        },
        sparkle: {
          "0%, 100%": { opacity: "0.25", transform: "scale(0.7) rotate(0deg)" },
          "50%": { opacity: "1", transform: "scale(1.15) rotate(20deg)" },
        },
        pop: {
          "0%": { transform: "scale(0.85)", opacity: "0" },
          "60%": { transform: "scale(1.05)", opacity: "1" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
      },
      animation: {
        drift: "drift 22s infinite ease-in-out",
        sparkle: "sparkle 3.2s infinite ease-in-out",
        "pop-in": "pop 0.4s cubic-bezier(0.16, 1, 0.3, 1) both",
      },
      backdropBlur: {
        xs: "2px",
      },
    },
  },
  plugins: [],
};
export default config;
