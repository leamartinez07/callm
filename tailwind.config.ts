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
          DEFAULT: "#0a0812",
          1: "#100e1c",
          2: "#16132a",
          3: "#1e1b30",
        },
        accent: {
          DEFAULT: "#9d5bf4",
          hover: "#8a47e8",
          muted: "#9d5bf415",
        },
        brand: "#c084fc",
      },
    },
  },
  plugins: [],
};

export default config;
