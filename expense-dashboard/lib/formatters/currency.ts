/**
 * Currency and Number Formatters
 * Consistent formatting utilities for the application
 */

/**
 * Format a number as Japanese Yen currency
 */
export function formatCurrency(value: number, options?: { showSign?: boolean }): string {
  const formatted = `¥${Math.abs(value).toLocaleString('ja-JP')}`;
  
  if (options?.showSign && value !== 0) {
    return value > 0 ? `+${formatted}` : `-${formatted}`;
  }
  
  return value < 0 ? `-${formatted}` : formatted;
}

/**
 * Format a number as a compact currency (K, M notation)
 */
export function formatCompactCurrency(value: number): string {
  if (Math.abs(value) >= 1_000_000) {
    return `¥${(value / 1_000_000).toFixed(1)}M`;
  }
  if (Math.abs(value) >= 10_000) {
    return `¥${(value / 1_000).toFixed(0)}K`;
  }
  if (Math.abs(value) >= 1_000) {
    return `¥${(value / 1_000).toFixed(1)}K`;
  }
  return formatCurrency(value);
}

/**
 * Format a percentage value
 */
export function formatPercentage(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`;
}

/**
 * Format a number with thousand separators
 */
export function formatNumber(value: number, decimals: number = 0): string {
  return value.toLocaleString('ja-JP', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
}

/**
 * Parse a currency string back to a number
 * Handles formats like "¥1,234", "1234", "-¥500"
 */
export function parseCurrency(value: string): number {
  const cleaned = value.replace(/[¥,\s]/g, '');
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}
