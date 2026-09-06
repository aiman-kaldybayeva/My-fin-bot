import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        tgbg: "var(--tg-theme-bg-color, #f5f5f7)",
        tgtext: "var(--tg-theme-text-color, #111111)",
        tghint: "var(--tg-theme-hint-color, #8e8e93)",
        tglink: "var(--tg-theme-link-color, #2481cc)",
        tgbutton: "var(--tg-theme-button-color, #2481cc)",
        tgbuttontext: "var(--tg-theme-button-text-color, #ffffff)",
        tgsecondary: "var(--tg-theme-secondary-bg-color, #eef0f3)",
        tgcard: "var(--tg-theme-section-bg-color, #ffffff)",
        income: "#34c759",
        expense: "#ff3b30",
      },
      borderRadius: {
        xl2: "1.25rem",
      },
    },
  },
  plugins: [],
};

export default config;
