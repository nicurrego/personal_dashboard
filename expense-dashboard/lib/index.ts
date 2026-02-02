/**
 * Library Barrel Export
 * 
 * Central export for all library utilities.
 * This provides a clean import path: import { formatCurrency, filterExpenses } from '@/lib';
 */

// Re-export formatters
export * from './formatters';

// Re-export analytics (replacing old dataTransforms)
export * from './analytics';

// Re-export CSV utilities (Modular System)
export {
  importCSV,
  validateCSV,
  getImportPreview,
  parseCSVLine,
  detectColumnMapping,
  parseDate,
  parseValue,
  cleanString,
  normalizeTarget,
  normalizeCategory
} from './csv';

export type {
  ImportResult,
  ImportError,
  ImportWarning,
  ImportStats,
  ColumnMapping
} from './csv';


// Re-export general utilities
export { cn } from './utils';

// Re-export category colors
export {
  CATEGORY_COLORS,
  CATEGORY_GLOWS,
  CATEGORY_TAILWIND,
  getCategoryColor,
  getCategoryClasses
} from './category-colors';
export type { CategoryKey } from './category-colors';

// Constants
export { CHART_INFO } from './constants/chartInfo';
export type { ChartKey } from './constants/chartInfo';
export { DEFAULT_CATEGORIES } from './constants/defaultCategories';
