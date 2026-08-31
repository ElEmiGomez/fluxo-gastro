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
        brand: {
          primary: "var(--brand-primary, #f97316)",
          secondary: "var(--brand-secondary, #1e293b)",
          accent: "var(--brand-accent, #ea580c)",
        },
      },
      keyframes: {
        flashTicket: {
          "0%, 100%": { transform: "scale(1)", backgroundColor: "transparent" },
          "50%": { transform: "scale(1.02)", backgroundColor: "rgba(239, 68, 68, 0.15)" },
        },
        pulseGlow: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.5" },
        }
      },
      animation: {
        "flash-ticket": "flashTicket 1s ease-in-out 3",
        "pulse-glow": "pulseGlow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
    },
  },
  plugins: [],
};
export default config;
