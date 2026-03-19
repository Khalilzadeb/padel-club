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
        padel: {
          green: { DEFAULT: "#1a7a3c", light: "#22a350", dark: "#145c2d" },
          blue: { DEFAULT: "#1e4fa3", light: "#2563eb", dark: "#163a7a" },
          court: { DEFAULT: "#2d7dd2", light: "#60aeff" },
          sand: { DEFAULT: "#e8d5b0" },
          glass: { DEFAULT: "#a8d4f5" },
        },
      },
      boxShadow: {
        card: "0 2px 8px 0 rgba(0,0,0,0.08)",
        "card-hover": "0 8px 24px 0 rgba(0,0,0,0.14)",
      },
    },
  },
  plugins: [],
};

export default config;
