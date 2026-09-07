import type { Config } from "tailwindcss";
import defaultTheme from "tailwindcss/defaultTheme"
const config: Config = {
  // ... باقي الإعدادات
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)", "sans-serif"],
        heading: ["var(--font-heading)", "serif"],
      },

      screens: {
      ...defaultTheme.screens, 
      'md': '850px',         
    },
    },
  },
  plugins: [],
};
export default config;