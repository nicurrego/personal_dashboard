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
  /** Green - Savings/Investments/Future */
  FUTURE: '#22c55e',
  /** Cyan - Needs/Essentials/Living */
  LIVING: '#06b6d4',
  /** Amber - Wants/Lifestyle/Present */
  PRESENT: '#f59e0b',
  /** Violet - Income */
  INCOME: '#8b5cf6',
} as const;

export const CATEGORY_GLOWS = {
  FUTURE: '0 0 10px rgba(34, 197, 94, 0.5)',
  LIVING: '0 0 10px rgba(6, 182, 212, 0.5)',
  PRESENT: '0 0 10px rgba(245, 158, 11, 0.5)',
  INCOME: '0 0 10px rgba(139, 92, 246, 0.5)',
} as const;

/**
 * Tailwind-compatible color classes for budget categories.
 * Use these when applying Tailwind utilities.
 */
export const CATEGORY_TAILWIND = {
  FUTURE: {
    text: 'text-[#22c55e]',
    bg: 'bg-[#22c55e]',
    border: 'border-[#22c55e]',
  },
  LIVING: {
    text: 'text-[#06b6d4]',
    bg: 'bg-[#06b6d4]',
    border: 'border-[#06b6d4]',
  },
  PRESENT: {
    text: 'text-[#f59e0b]',
    bg: 'bg-[#f59e0b]',
    border: 'border-[#f59e0b]',
  },
  INCOME: {
    text: 'text-[#8b5cf6]',
    bg: 'bg-[#8b5cf6]',
    border: 'border-[#8b5cf6]',
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
