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
        // Kibo Main Palette (Strict Updates)
        'kibo-bg': '#1B4034',    // Main Background
        'kibo-red': 'var(--color-present)',   // Kibo Red (Present)
        'kibo-purple': 'var(--color-future)', // Kibo Purple (Future) - renamed from orange effectively
        'kibo-blue': 'var(--color-living)',   // Kibo Blue (Living)
        'kibo-teal': 'var(--color-total)',    // Kibo Teal (Total)

        // Categories Palette (Mapped to New Strict Colors)
        'cat-dark': '#1B4032',
        'cat-mint': 'var(--color-future)',    // Future
        'cat-sage': 'var(--color-living)',    // Living
        'cat-pale': 'var(--color-present)',    // Present
        'cat-white': '#F2F2F2',   // Text

        // Semantic Mapping (Updated)
        'trust-navy': '#1B4034',
        'growth-green': 'var(--color-future)', // Future
        'alert-amber': 'var(--color-present)', // Present
        'cyber-cyan': 'var(--color-total)', // Income Teal
        'laser-magenta': 'var(--color-living)', // Living
        'flux-violet': 'var(--color-future)', // Secondary Purple

        // Legacy/Compatibility Layer (Mapped to New Palette to Remove Old Colors)
        'glass-surface': '#1B4034',
        'secondary-text': '#A9D9C7',
        'cobalt-blue': '#A9D9C7',
        'electric-orange': '#614FBB',
        'acid-green': '#614FBB',
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
      animation: {
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-20px)' },
        },
      },
    },
  },
  plugins: [],
};
export default config;
