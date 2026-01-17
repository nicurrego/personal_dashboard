/**
 * Core TypeScript types for the expense dashboard
 */

export interface Expense {
  year: number;
  month: number;
  date: string;
  target: 'Living' | 'Present' | 'Future';
  category: string;
  value: number;
  item: string;
  context: string;
  method: string;
  shop: string;
  location: string;
}

export interface Budget {
  year: number;
  month: number;
  target: 'Living' | 'Present' | 'Future';
  category: string;
  amount: number;
}

export interface FilterState {
  dateRange: {
    start: Date | null;
    end: Date | null;
  };
  months: number[];
  targets: string[];
  categories: string[];
  locations: string[];
  methods: string[];
  shops: string[];
}

export interface MonthlyData {
  month: string;
  date: Date;
  total: number;
  living: number;
  present: number;
  future: number;
}

// Unified trend data point that works for both daily and monthly views
export interface TrendDataPoint {
  label: string;
  date: Date;
  total: number;
  living: number;
  present: number;
  future: number;
}

export interface CategoryTotal {
  category: string;
  total: number;
  count: number;
  percentage: number;
}

export interface TargetDistribution {
  target: 'Living' | 'Present' | 'Future';
  amount: number;
  percentage: number;
  color: string;
}

export interface ShopTotal {
  shop: string;
  total: number;
  transactionCount: number;
  avgTransaction: number;
}

export interface DayOfWeekData {
  day: string;
  dayIndex: number;
  total: number;
  avgTransaction: number;
}

export interface HeatmapDay {
  date: string;
  value: number;
  month: number;
  year: number;
}

export interface KPIMetrics {
  totalSpent: number;
  avgMonthly: number;
  topCategory: string;
  futurePercentage: number;
  monthOverMonth: number;
  totalTransactions: number;
}

// ============================================
// Quick Entry Types
// Quick Entry Types - Dynamic from database
// ============================================

export type QuickEntryContext = 'Daily' | 'Travel' | 'Work' | 'Gift' | 'Personal';

export interface QuickEntryData {
  value: number | null;
  category: string;
  target: string | null; // Dynamic from database (Living, Present, Saving, Investment, etc.)
  shop: string;
  method: string;
  location: string;
  item: string; // Renamed from 'detail' - what was purchased
  context: string; // Free-form input (Daily, Travel, Work, Gift, Personal, etc.)
  date: Date;
}

export type QuickEntryStep = 
  | 'amount'
  | 'category'
  | 'target'
  | 'shop'
  | 'method'
  | 'location'
  | 'item'  // Renamed from 'detail'
  | 'context'
  | 'review';

export interface QuickEntryOption {
  id: string;
  label: string;
  recentCount?: number;
}

export interface AutocompleteData {
  categories: QuickEntryOption[];
  shops: QuickEntryOption[];
  methods: QuickEntryOption[];
  locations: QuickEntryOption[];
}
