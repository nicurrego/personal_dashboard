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
        // Kibo Main Palette
        'kibo-bg': '#1B4034',    // Main Background (Dark Green)
        'kibo-red': '#85241E',   // Accents/Destructive
        'kibo-orange': '#CC8257', // Primary Accents
        'kibo-blue': '#6CA1B7',   // Secondary Accents

        // Categories Palette (Present, Future, Living)
        'cat-dark': '#1B4032',
        'cat-mint': '#8DF2CD',    // Future
        'cat-sage': '#487363',    // Living
        'cat-pale': '#A9D9C7',    // Present
        'cat-white': '#F2F2F2',   // Text

        // Semantic Mapping
        'trust-navy': '#1B4034',
        'growth-green': '#8DF2CD',
        'alert-amber': '#CC8257',
        'cyber-cyan': '#487363',
        'laser-magenta': '#85241E',
        'flux-violet': '#6CA1B7',

        // Legacy/Compatibility Layer
        'glass-surface': '#1B4034',
        'secondary-text': '#A9D9C7',
        'cobalt-blue': '#6CA1B7',
        'electric-orange': '#CC8257',
        'acid-green': '#8DF2CD',
        'void-black': '#1B4034',
        'card-surface': '#1B4034',

        // Standard
        background: '#1B4034',
        foreground: '#F2F2F2',
      },
      fontFamily: {
        sans: ['var(--font-outfit)', 'sans-serif'],
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
