import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: "#202124",
        paper: "#fbfaf7",
        line: "#d9d5cc",
        teal: "#16746a",
        coral: "#d65f45",
        amber: "#c58b2c",
        plum: "#6c4a70"
      },
      boxShadow: {
        panel: "0 18px 50px rgba(32, 33, 36, 0.10)"
      }
    }
  },
  plugins: []
};

export default config;
