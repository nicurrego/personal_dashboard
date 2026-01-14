import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
        // User Requested Palette
        'trust-navy': '#171717',    // Backgrounds, Cards
        'growth-green': '#22c55e',  // Future items, Text, Icons
        'alert-amber': '#f59e0b',   // Present items, Warnings
        'cyber-cyan': '#06b6d4',    // Living items, Info
        'laser-magenta': '#d946ef', // Critical, Issues
        'flux-violet': '#8B5CF6',   // Source, Income, Attention
        
        // Legacy/Liquid Glass (remapped or kept for compatibility if needed)
        'void-black': '#000000',
        'glass-surface': '#1C1C1E',
        'card-surface': '#2C2C2E',
        'secondary-text': '#8E8E93',
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
