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
          50: "#FDF1EE",
          100: "#FADCD5",
          200: "#F3B7AC",
          300: "#E8897A",
          400: "#DD5F4C",
          500: "#C93A2E",
          600: "#B22A22",
          700: "#8F2019",
          800: "#6E1913",
          900: "#4A100C",
        },
        bloom: {
          300: "#FBD9CE",
          400: "#F3AFA0",
          500: "#E8836E",
          600: "#D66650",
          700: "#B84A38",
        },
        cream: {
          50: "#FFFBF3",
          100: "#FDF3E1",
          200: "#FBE7CB",
        },
        mustard: {
          300: "#F0D48A",
          400: "#E3B94F",
          500: "#D6A542",
          600: "#B98A2E",
        },
        mint: {
          300: "#C9EFE7",
          400: "#9BDFD1",
          500: "#6FCCB9",
          600: "#4FB19D",
        },
      },
      boxShadow: {
        glass: "0 8px 32px 0 rgba(110, 40, 25, 0.14)",
        "glass-sm": "0 4px 20px 0 rgba(110, 40, 25, 0.10)",
        "glass-lg": "0 20px 50px 0 rgba(110, 40, 25, 0.18)",
        bloom: "0 10px 30px -10px rgba(182, 60, 45, 0.45)",
        stamp: "0 2px 8px 0 rgba(110, 40, 25, 0.12)",
        paper: "0 14px 34px -14px rgba(110, 40, 25, 0.30)",
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
