import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        background: "#0b1120",
        foreground: "#f8fafc",
        card: {
          DEFAULT: "#111827",
          foreground: "#f8fafc"
        },
        muted: "#1f2937",
        accent: "#22d3ee"
      }
    }
  },
  plugins: []
};

export default config;
