/**
 * Centralized Type Exports
 * 
 * This is the main entry point for all type definitions in the application.
 * Import types from here for consistent typing across the codebase.
 * 
 * @example
 * import { Expense, Budget, FilterState } from '@/types';
 */

// Expense types
export type { 
  ExpenseTarget, 
  Expense, 
  ExpenseInput, 
  ExpenseWithMeta 
} from './expense';

// Budget types
export type { 
  Budget, 
  BudgetProgressItem, 
  BudgetProgress, 
  BudgetRow, 
  BudgetSection, 
  BudgetPercentages 
} from './budget';

// Filter types
export type { 
  DateRange, 
  FilterState, 
  UniqueFilterValues, 
  TimeRangePreset 
} from './filter';
export { 
  INITIAL_FILTER_STATE, 
  INITIAL_UNIQUE_VALUES 
} from './filter';

// Chart types
export type { 
  MonthlyData, 
  TrendDataPoint, 
  CategoryTotal, 
  TargetDistribution, 
  ShopTotal, 
  DayOfWeekData, 
  HeatmapDay, 
  KPIMetrics, 
  ChartKey, 
  ChartInfo, 
  TrendGranularity 
} from './chart';

// Quick Entry types
export type { 
  QuickEntryContext, 
  QuickEntryData, 
  QuickEntryStep, 
  QuickEntryOption, 
  AutocompleteData, 
  StepConfig 
} from './quick-entry';
export { 
  INITIAL_QUICK_ENTRY_DATA, 
  QUICK_ENTRY_STEPS 
} from './quick-entry';
