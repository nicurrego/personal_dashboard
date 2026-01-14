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
        // Liquid Glass Palette (New Standard)
        'void-black': '#000000',
        'glass-surface': '#1C1C1E', // Use with opacity
        'card-surface': '#2C2C2E',
        'acid-green': '#CCFF00', // Good/Future
        'electric-orange': '#FF9F0A', // Warning/Present
        'cobalt-blue': '#0A84FF', // Neutral/Living
        'secondary-text': '#8E8E93',
        
        // Legacy CP 2077 Palette (Supporting existing views)
        'trust-navy': '#171717',
        'growth-green': '#22c55e',
        'alert-amber': '#f59e0b',
        'cyber-cyan': '#06b6d4',
        'laser-magenta': '#d946ef',
        'flux-violet': '#8B5CF6',
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
    },
  },
  plugins: [],
};
export default config;
