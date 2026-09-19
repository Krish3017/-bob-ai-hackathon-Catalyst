import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // App backgrounds
        background: "#FAFAF8",
        surface: "#FFFFFF",
        "surface-soft": "#F7F6F2",

        // Cyprus — primary brand
        cyprus: {
          DEFAULT: "#004741",
          hover: "#003B36",
          light: "#E1EFEC",
          muted: "#C5DDD9",
          50: "#E1EFEC",
          100: "#C5DDD9",
          200: "#8BBBB4",
          500: "#006B62",
          700: "#004741",
          900: "#002926",
        },

        // Sand — warm brand accent
        sand: {
          DEFAULT: "#F0EDE4",
          light: "#F7F5F0",
          dark: "#DDD8CC",
        },

        // Maritime blue accent
        maritime: {
          DEFAULT: "#2F7D8C",
          light: "#E1F0F2",
          hover: "#256B79",
        },

        // Status palette (kept familiar for accessibility)
        success: {
          DEFAULT: "#2F7D5B",
          light: "#E5F2EA",
        },
        warning: {
          DEFAULT: "#C58A2B",
          light: "#FFF4DE",
        },
        danger: {
          DEFAULT: "#B94A48",
          light: "#FCE9E8",
        },
      },
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          '"Segoe UI"',
          "Roboto",
          '"Helvetica Neue"',
          "Arial",
          "sans-serif",
        ],
      },
      borderRadius: {
        lg: "10px",
        xl: "12px",
        "2xl": "16px",
      },
      boxShadow: {
        card: "0 1px 3px 0 rgba(0, 71, 65, 0.06), 0 1px 2px -1px rgba(0, 71, 65, 0.04)",
        "card-md": "0 4px 12px 0 rgba(0, 71, 65, 0.08), 0 2px 4px -2px rgba(0, 71, 65, 0.05)",
        "card-hover": "0 6px 20px 0 rgba(0, 71, 65, 0.10), 0 2px 6px -2px rgba(0, 71, 65, 0.06)",
      },
    },
  },
  plugins: [],
};

export default config;
