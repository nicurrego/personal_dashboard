/**
 * Budget-related type definitions
 * Central source of truth for budget data structures
 */

import type { ExpenseTarget } from './expense';

/**
 * Budget allocation for a specific category/month
 */
export interface Budget {
  /** Unique identifier (optional, assigned by database) */
  id?: string;
  /** Budget year */
  year: number;
  /** Budget month (1-12) */
  month: number;
  /** Budget allocation target */
  target: ExpenseTarget;
  /** Category for this budget item */
  category: string;
  /** Budgeted amount */
  amount: number;
}

/**
 * Budget progress tracking for a single target
 */
export interface BudgetProgressItem {
  /** Total amount spent */
  spent: number;
  /** Total budgeted amount */
  budget: number;
  /** Remaining budget (can be negative if overspent) */
  remaining: number;
  /** Percentage of budget used (0-100+) */
  percentage: number;
}

/**
 * Complete budget progress across all targets
 */
export interface BudgetProgress {
  /** Overall totals */
  total: BudgetProgressItem;
  /** Living expenses progress */
  living: BudgetProgressItem;
  /** Present (discretionary) expenses progress */
  present: BudgetProgressItem;
  /** Future (savings/investment) progress */
  future: BudgetProgressItem;
}

/**
 * Budget builder row structure
 */
export interface BudgetRow {
  id: string;
  category: string;
  target: ExpenseTarget;
  amount: number;
  isEditing?: boolean;
}

/**
 * Budget builder section (grouped by target)
 */
export interface BudgetSection {
  target: ExpenseTarget;
  rows: BudgetRow[];
  subtotal: number;
}

/**
 * Budget percentages for summary display
 */
export interface BudgetPercentages {
  living: number;
  present: number;
  future: number;
  savings?: number;
}
