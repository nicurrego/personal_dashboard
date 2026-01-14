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
  detail: string;
  context: string;
  method: string;
  shop: string;
  location: string;
}

export interface FilterState {
  dateRange: {
    start: Date | null;
    end: Date | null;
  };
  targets: string[];
  categories: string[];
  locations: string[];
  methods: string[];
}

export interface MonthlyData {
  month: string;
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
