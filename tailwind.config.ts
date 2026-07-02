import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        escolar: {
          DEFAULT: "#6366f1",
          light: "#e0e7ff",
          dark: "#4338ca",
        },
        personal: {
          DEFAULT: "#10b981",
          light: "#d1fae5",
          dark: "#059669",
        },
      },
    },
  },
  plugins: [],
};

export default config;
