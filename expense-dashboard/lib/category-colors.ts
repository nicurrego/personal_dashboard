/**
 * Budget Category Color Constants
 * 
 * These match the CSS variables in globals.css:
 * --color-category-future, --color-category-living, etc.
 * 
 * Use these in JavaScript/TypeScript when you need the actual hex values
 * (e.g., for charts, inline styles, or third-party libraries).
 */

export const CATEGORY_COLORS = {
  /** Mint - Savings/Investments/Future */
  FUTURE: '#8DF2CD',
  /** Sage - Needs/Essentials/Living */
  LIVING: '#487363',
  /** Pale Mint - Wants/Lifestyle/Present */
  PRESENT: '#A9D9C7',
  /** Kibo Blue - Income */
  INCOME: '#6CA1B7',
} as const;

export const CATEGORY_GLOWS = {
  FUTURE: 'none',
  LIVING: 'none',
  PRESENT: 'none',
  INCOME: 'none',
} as const;

/**
 * Tailwind-compatible color classes for budget categories.
 * Use these when applying Tailwind utilities.
 */
export const CATEGORY_TAILWIND = {
  FUTURE: {
    text: 'text-[#8DF2CD]',
    bg: 'bg-[#8DF2CD]',
    border: 'border-[#8DF2CD]',
  },
  LIVING: {
    text: 'text-[#487363]',
    bg: 'bg-[#487363]',
    border: 'border-[#487363]',
  },
  PRESENT: {
    text: 'text-[#A9D9C7]',
    bg: 'bg-[#A9D9C7]',
    border: 'border-[#A9D9C7]',
  },
  INCOME: {
    text: 'text-[#6CA1B7]',
    bg: 'bg-[#6CA1B7]',
    border: 'border-[#6CA1B7]',
  },
} as const;

export type CategoryKey = keyof typeof CATEGORY_COLORS;

/**
 * Get color by category key
 */
export function getCategoryColor(category: CategoryKey): string {
  return CATEGORY_COLORS[category];
}

/**
 * Get Tailwind classes by category key
 */
export function getCategoryClasses(category: CategoryKey) {
  return CATEGORY_TAILWIND[category];
}
