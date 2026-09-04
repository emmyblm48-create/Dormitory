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
          50: "#F2F0FD",
          100: "#E5E1FB",
          200: "#C9C2F8",
          300: "#A99EF2",
          400: "#8B7BEC",
          500: "#7C6CF0",
          600: "#6650DE",
          700: "#4C3AA6",
          800: "#3A2C80",
          900: "#241C52",
        },
        bloom: {
          300: "#FFC9B8",
          400: "#FF9E85",
          500: "#F0709A",
          600: "#DD5580",
          700: "#C93E68",
        },
      },
      boxShadow: {
        glass: "0 8px 32px 0 rgba(76, 58, 166, 0.16)",
        "glass-sm": "0 4px 20px 0 rgba(76, 58, 166, 0.12)",
        "glass-lg": "0 20px 50px 0 rgba(76, 58, 166, 0.20)",
        bloom: "0 10px 30px -10px rgba(221, 85, 128, 0.45)",
      },
      keyframes: {
        blob: {
          "0%, 100%": { transform: "translate(0px, 0px) scale(1)" },
          "33%": { transform: "translate(24px, -32px) scale(1.08)" },
          "66%": { transform: "translate(-18px, 18px) scale(0.95)" },
        },
        ribbon: {
          "0%, 100%": { transform: "translate(0, 0) rotate(var(--r, 0deg)) scale(1)" },
          "50%": { transform: "translate(3%, -4%) rotate(calc(var(--r, 0deg) + 3deg)) scale(1.05)" },
        },
      },
      animation: {
        blob: "blob 20s infinite ease-in-out",
        ribbon: "ribbon 26s infinite ease-in-out",
      },
      backdropBlur: {
        xs: "2px",
      },
    },
  },
  plugins: [],
};
export default config;
