/**
 * Chart-related type definitions
 * Central source of truth for data visualization structures
 */

import type { ExpenseTarget } from './expense';

/**
 * Monthly aggregated data for trend charts
 */
export interface MonthlyData {
  /** Month identifier (YYYY-MM format) */
  month: string;
  /** First day of the month as Date object */
  date: Date;
  /** Total spending for the month */
  total: number;
  /** Living expenses total */
  living: number;
  /** Present (discretionary) expenses total */
  present: number;
  /** Future (savings) expenses total */
  future: number;
}

/**
 * Unified trend data point (works for both daily and monthly views)
 */
export interface TrendDataPoint {
  /** Display label (day number or YYYY-MM) */
  label: string;
  /** Date object for positioning */
  date: Date;
  /** Total amount */
  total: number;
  /** Living expenses */
  living: number;
  /** Present expenses */
  present: number;
  /** Future expenses */
  future: number;
}

/**
 * Category totals for bar/pie charts
 */
export interface CategoryTotal {
  /** Category name */
  category: string;
  /** Total spent in this category */
  total: number;
  /** Number of transactions */
  count: number;
  /** Percentage of total spending */
  percentage: number;
}

/**
 * Target distribution for donut charts
 */
export interface TargetDistribution {
  /** Target type */
  target: ExpenseTarget;
  /** Total amount */
  amount: number;
  /** Percentage of total */
  percentage: number;
  /** Display color */
  color: string;
}

/**
 * Shop totals for top shops chart
 */
export interface ShopTotal {
  /** Shop/vendor name */
  shop: string;
  /** Total amount spent */
  total: number;
  /** Number of transactions */
  transactionCount: number;
  /** Average transaction amount */
  avgTransaction: number;
}

/**
 * Day of week spending data
 */
export interface DayOfWeekData {
  /** Day name (e.g., 'Monday') */
  day: string;
  /** Day index (0 = Sunday, 6 = Saturday) */
  dayIndex: number;
  /** Total spent on this day */
  total: number;
  /** Average transaction amount */
  avgTransaction: number;
}

/**
 * Heatmap day data
 */
export interface HeatmapDay {
  /** ISO date string (YYYY-MM-DD) */
  date: string;
  /** Spending value for this day */
  value: number;
  /** Month (1-12) */
  month: number;
  /** Year */
  year: number;
}

/**
 * KPI (Key Performance Indicator) metrics
 */
export interface KPIMetrics {
  /** Total amount spent */
  totalSpent: number;
  /** Average monthly spending */
  avgMonthly: number;
  /** Highest spending category */
  topCategory: string;
  /** Percentage allocated to Future */
  futurePercentage: number;
  /** Month-over-month change percentage */
  monthOverMonth: number;
  /** Total number of transactions */
  totalTransactions: number;
}

/**
 * Chart keys for expanded/info views
 */
export type ChartKey = 
  | 'monthly'
  | 'donut'
  | 'bar'
  | 'burn'
  | 'dayOfWeek'
  | 'topShops'
  | 'heatmap';

/**
 * Chart info content
 */
export interface ChartInfo {
  title: string;
  description: string;
}

/**
 * Granularity type for trend charts
 */
export type TrendGranularity = 'daily' | 'monthly';
