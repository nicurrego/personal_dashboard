/**
 * Utility functions for formatting budget data
 */

/**
 * Format a number as USD currency with no decimals
 * Returns em-dash for zero values
 */
export const formatMoney = (val: number): string => {
  if (val === 0) return "—";

  return val.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  });
};

/**
 * Parse a currency string input to a number
 * Strips all non-numeric characters except decimal point
 */
export const parseCurrencyInput = (value: string): number => {
  const rawValue = value.replace(/[^0-9.]/g, '');
  return parseFloat(rawValue) || 0;
};

/**
 * Format a number with commas for display in input fields
 */
export const formatNumberWithCommas = (value: string): string => {
  const raw = value.replace(/[^0-9]/g, '');
  if (raw) {
    return parseInt(raw).toLocaleString();
  }
  return "";
};

/**
 * Trigger haptic feedback on mobile devices
 */
export const triggerHaptic = (): void => {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    navigator.vibrate(10);
  }
};
