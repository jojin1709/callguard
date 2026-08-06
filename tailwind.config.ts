import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: "var(--color-ink)",
        panel: "var(--color-panel)",
        panel2: "var(--color-panel2)",
        line: "var(--color-line)",
        mist: "var(--color-mist)",
        fog: "var(--color-fog)",
        signal: "#3DDC97",
        alert: "#FF5D5D",
        warn: "#FFB648",
        brand: "#4C7CFF",
        midnight: "#0B0F14",
      },
      fontFamily: {
        display: ["var(--font-display)"],
        body: ["var(--font-body)"],
        mono: ["var(--font-mono)"],
      },
      borderRadius: { xl2: "1.25rem" },
    },
  },
  plugins: [],
};
export default config;
