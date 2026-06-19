import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: "#171225",
        muted: "#6b6478",
        line: "#e3ddec",
        paper: "#faf8ff",
        brand: {
          50: "#f6f0ff",
          100: "#ebe0ff",
          200: "#dcc8ff",
          500: "#8057e6",
          600: "#6840cf",
          700: "#5431aa",
          900: "#29184f"
        },
        plum: {
          100: "#f1e6f5",
          600: "#8a3d9a",
          800: "#532461"
        },
        mint: {
          100: "#dcfce7",
          600: "#15915a",
          700: "#106f49"
        },
        amber: {
          100: "#fef3c7",
          600: "#b76b00"
        }
      },
      boxShadow: {
        soft: "0 18px 50px rgba(24, 33, 47, 0.08)"
      }
    }
  },
  plugins: []
};

export default config;
