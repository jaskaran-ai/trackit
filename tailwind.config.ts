import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ["Syne", "sans-serif"],
        body: ["DM Sans", "sans-serif"],
      },
      colors: {
        brand: {
          DEFAULT: "#6366f1",
          light: "#818cf8",
          dark: "#4f46e5",
        },
      },
      backgroundImage: {
        "grid-pattern":
          "linear-gradient(to right, rgba(63,63,70,0.3) 1px, transparent 1px), linear-gradient(to bottom, rgba(63,63,70,0.3) 1px, transparent 1px)",
      },
      backgroundSize: {
        "grid-sm": "24px 24px",
      },
    },
  },
  plugins: [],
};

export default config;
