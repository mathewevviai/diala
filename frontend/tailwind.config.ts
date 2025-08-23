import type { Config } from "tailwindcss"

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontWeight: {
        base: "var(--font-weight-base)",
        heading: "var(--font-weight-heading)",
      },
      boxShadow: {
        shadow: "var(--shadow-shadow)",
      },
      borderRadius: {
        base: "var(--radius-base)",
      },
      colors: {
        border: "var(--color-border)",
        ring: "var(--color-ring)",
        background: "var(--color-background)",
        "secondary-background": "var(--color-secondary-background)",
        foreground: "var(--color-foreground)",
        "main-foreground": "var(--color-main-foreground)",
        main: "var(--color-main)",
        overlay: "var(--color-overlay)",
        "chart-1": "var(--color-chart-1)",
        "chart-2": "var(--color-chart-2)",
        "chart-3": "var(--color-chart-3)",
        "chart-4": "var(--color-chart-4)",
        "chart-5": "var(--color-chart-5)",
      },
      spacing: {
        boxShadowX: "var(--spacing-boxShadowX)",
        boxShadowY: "var(--spacing-boxShadowY)",
        reverseBoxShadowX: "var(--spacing-reverseBoxShadowX)",
        reverseBoxShadowY: "var(--spacing-reverseBoxShadowY)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
export default config