import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          orange: '#F6911E',
          orangeLight: '#FFAA34',
          dark: '#191919',
          gray: '#333333',
          border: '#e5e5e5',
          surface: '#fbfbfb',
        },
        enfoque: {
          50: '#fafafa',
          100: '#f5f5f5',
          200: '#e5e5e5',
          300: '#d4d4d4',
          400: '#a3a3a3',
          500: '#737373',
          600: '#525252',
          700: '#404040',
          800: '#262626',
          900: '#191919',
          950: '#0f0f0f',
        },
        status: {
          bien: '#10b981',
          atencion: '#F6911E',
          critico: '#ef4444',
          validar: '#8b5cf6',
          indefinido: '#737373',
        }
      },
      fontFamily: {
        sans: ['"Segoe UI"', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Roboto', 'sans-serif'],
        serif: ['Georgia', 'Cambria', '"Times New Roman"', 'serif'],
      }
    },
  },
  plugins: [],
} satisfies Config;
