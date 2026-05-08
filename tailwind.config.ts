import type { Config } from "tailwindcss";

// Official ACE palette extracted from /Branding_ACE and ace.html (:root vars),
// extended with the v2 tablet-style observatory tokens. Mirrored in
// `components/ui/designTokens.ts` and projected into `app/globals.css`.
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: "#0B1F3A", // --navy (official)
          50: "#eef2f7",
          100: "#d5dde8",
          200: "#adbbce",
          300: "#8196b1",
          400: "#576f90",
          500: "#344f75",
          600: "#234060",
          700: "#162e4a",
          800: "#0d2340",
          900: "#0B1F3A",
        },
        brand: {
          navy: "#0B1F3A",
          "blue-mid": "#1E4E8C",
          "blue-bright": "#2F80ED",
          "blue-ace": "#2563EB",
          turquoise: "#2FB7B2",
          orange: "#F05A28",
          "orange-hover": "#d44d22",
          "orange-ace": "#F97316",
          "orange-ace-hover": "#EA6A0A",
        },
        accent: {
          yellow: "#F5B700",
          orange: "#F05A28",
          "orange-cta": "#F97316",
          purple: "#6A4C93",
          "purple-soft": "#7C3AED",
          teal: "#2FB7B2",
          "teal-soft": "#14B8A6",
          amber: "#F59E0B",
          bright: "#2F80ED",
          blue: "#2563EB",
        },
        surface: {
          DEFAULT: "#FFFFFF",
          canvas: "#F4F5F7",
          panel: "#FFFFFF",
          "panel-muted": "#F8FAFC",
          muted: "#F5F7FA",
          subtle: "#EEF1F5",
          border: "#E2E8F0",
          footer: "#06101f",
        },
        sidebar: {
          bg: "#0B1F3A",
          hover: "#162E4A",
          border: "#1B3358",
          idle: "#9DB0CB",
          active: "#FFFFFF",
          accent: "#F97316",
        },
        text: {
          primary: "#0B1F3A",
          secondary: "#334155",
          muted: "#64748B",
        },
      },
      fontFamily: {
        sans: ["var(--font-montserrat)", "Montserrat", "system-ui", "-apple-system", "sans-serif"],
        display: ["var(--font-montserrat)", "Montserrat", "system-ui", "sans-serif"],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
      fontSize: {
        "display-1": ["2.75rem", { lineHeight: "1.05", letterSpacing: "-0.025em", fontWeight: "700" }],
        "display-2": ["2.125rem", { lineHeight: "1.12", letterSpacing: "-0.02em", fontWeight: "700" }],
        "kpi": ["2rem", { lineHeight: "1", letterSpacing: "-0.02em", fontWeight: "700" }],
        "kpi-lg": ["2.5rem", { lineHeight: "1", letterSpacing: "-0.025em", fontWeight: "700" }],
      },
      boxShadow: {
        card:
          "0 1px 2px 0 rgba(11, 31, 58, 0.06), 0 6px 20px -8px rgba(11, 31, 58, 0.08)",
        "card-hover":
          "0 2px 4px 0 rgba(11, 31, 58, 0.08), 0 12px 28px -10px rgba(11, 31, 58, 0.14)",
        panel:
          "0 1px 2px 0 rgba(11, 31, 58, 0.05), 0 16px 40px -16px rgba(11, 31, 58, 0.18)",
        sidebar:
          "0 1px 2px 0 rgba(11, 31, 58, 0.10), 0 24px 48px -16px rgba(11, 31, 58, 0.30)",
        soft:
          "0 1px 2px 0 rgba(11, 31, 58, 0.04)",
      },
      borderRadius: {
        sm: "0.5rem",
        md: "0.75rem",
        lg: "1rem",
        xl: "1.25rem",
        "2xl": "1.5rem",
        "3xl": "1.75rem",
      },
      maxWidth: {
        canvas: "1480px",
      },
      spacing: {
        "sidebar-w": "220px",
        "sidebar-offset": "260px",
      },
    },
  },
  plugins: [],
};

export default config;
