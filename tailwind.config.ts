import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        surface: {
          DEFAULT: "#111118",
          1: "#1a1a24",
          2: "#22222e",
          3: "#2a2a38",
        },
        accent: {
          DEFAULT: "#7c6ff7",
          hover: "#6d60f0",
          muted: "#7c6ff720",
        },
      },
    },
  },
  plugins: [],
};

export default config;
