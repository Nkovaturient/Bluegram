import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-inter)", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      colors: {
        ink: "#04090f",
        elevated: "#0c1520",
        card: "#1a2332",
        primary: "#ff6b4a",
        success: "#34d399",
        warning: "#fbbf24",
        error: "#f87171",
      },
      spacing: {
        sm: "16px",
        md: "20px",
        lg: "24px",
      },
      gap: {
        tight: "8px",
        normal: "12px",
        relaxed: "16px",
      },
      fontSize: {
        "heading-lg": ["24px", { lineHeight: "1.3", fontWeight: "600", letterSpacing: "-0.01em" }],
        "heading-md": ["20px", { lineHeight: "1.3", fontWeight: "600", letterSpacing: "-0.01em" }],
        "heading-sm": ["16px", { lineHeight: "1.4", fontWeight: "600", letterSpacing: "-0.005em" }],
        "body-lg": ["14px", { lineHeight: "1.6", fontWeight: "400" }],
        "body-md": ["13px", { lineHeight: "1.6", fontWeight: "400" }],
        "body-sm": ["12px", { lineHeight: "1.5", fontWeight: "400" }],
        "caption-lg": ["11px", { lineHeight: "1.4", fontWeight: "500", letterSpacing: "0.02em" }],
        "caption-sm": ["10px", { lineHeight: "1.4", fontWeight: "500", letterSpacing: "0.03em" }],
        "mono-lg": ["13px", { lineHeight: "1.5", fontWeight: "600" }],
        "mono-sm": ["11px", { lineHeight: "1.5", fontWeight: "600" }],
      },
      borderRadius: {
        default: "8px",
        card: "12px",
        pill: "999px",
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(255, 107, 74, 0.25), 0 6px 18px rgba(0, 0, 0, 0.5)",
        "glow-success": "0 0 0 1px rgba(52, 211, 153, 0.25), 0 6px 18px rgba(0, 0, 0, 0.4)",
      },
      animation: {
        "pulse-once": "pulse-once 0.6s ease-in-out",
        "fade-in": "fade-in 0.3s ease-out",
        "slide-in": "slide-in 0.4s ease-out",
        shimmer: "shimmer 2s linear infinite",
      },
      keyframes: {
        "pulse-once": {
          "0%, 100%": { opacity: "1", transform: "scale(1)" },
          "50%": { opacity: "0.7", transform: "scale(1.05)" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "slide-in": {
          "0%": { transform: "translateY(10px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-1000px 0" },
          "100%": { backgroundPosition: "1000px 0" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
