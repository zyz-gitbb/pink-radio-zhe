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
        background: "#F5F1E6",
        surface: "#FFFFFF",
        elevated: "#FAF8F3",
        border: "#DFDAD1",
        accent: "#D4858A",
        "accent-dim": "#C06B70",
        "accent-hover": "#E8A0A5",
        "warm-muted": "#9C9488",
        "warm-stone": "#B8B0A4",
        "text-primary": "#3D2E2E",
        "text-secondary": "#6B5B5B",
      },
      fontFamily: {
        sans: ["DM Sans", "system-ui", "sans-serif"],
        mono: ["Space Grotesk", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
