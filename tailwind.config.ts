import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        void: "#07060B",
        ink: "#0D0B14",
        panel: "#12101C",
        signal: "#7B5CFF",
        signal2: "#3DD9C6",
        ember: "#FF6B5B",
        gold: "#F2C14E",
        mist: "#B9B3D0",
      },
      fontFamily: {
        display: ["var(--font-display)"],
        body: ["var(--font-body)"],
        mono: ["var(--font-mono)"],
      },
      keyframes: {
        drift: {
          "0%, 100%": { transform: "translate3d(0,0,0)" },
          "50%": { transform: "translate3d(0,-14px,0)" },
        },
        pulseGlow: {
          "0%, 100%": { opacity: "0.55", filter: "blur(18px)" },
          "50%": { opacity: "1", filter: "blur(26px)" },
        },
        sheen: {
          "0%": { backgroundPosition: "-150% 0" },
          "100%": { backgroundPosition: "250% 0" },
        },
        rise: {
          "0%": { opacity: "0", transform: "translateY(14px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        drift: "drift 6s ease-in-out infinite",
        pulseGlow: "pulseGlow 3.2s ease-in-out infinite",
        sheen: "sheen 3.5s ease-in-out infinite",
        rise: "rise 0.6s cubic-bezier(.16,1,.3,1) both",
      },
    },
  },
  plugins: [],
};
export default config;
