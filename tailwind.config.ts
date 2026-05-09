import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        geist: ["var(--font-geist)", "system-ui", "sans-serif"],
        syne:  ["var(--font-syne)",  "Arial Black",  "sans-serif"],
      },
      colors: {
        surface: {
          DEFAULT: "#0a0812",
          1: "#100e1c",
          2: "#16132a",
          3: "#1e1b30",
        },
        panel: {
          DEFAULT: "#16132a",
          border: "#252040",
        },
        chip: {
          DEFAULT: "#1c1830",
          border:  "#2e2950",
        },
        accent: {
          DEFAULT: "#9d5bf4",
          hover:   "#a855f7",
          muted:   "rgba(157,91,244,0.15)",
        },
        brand: "#c084fc",
        lilac: "#c084fc",
        pink:  "#e879f9",
        muted: "#7a6d94",
      },
      borderRadius: {
        card: "16px",
        chip: "9px",
      },
      boxShadow: {
        card:       "0 0 0 1px rgba(124,58,237,0.12), 0 8px 32px rgba(0,0,0,0.5)",
        "card-hover": "0 0 0 1px rgba(157,91,244,0.28), 0 12px 40px rgba(0,0,0,0.55)",
        glow:       "0 0 20px rgba(157,91,244,0.35)",
      },
    },
  },
  plugins: [],
};

export default config;
