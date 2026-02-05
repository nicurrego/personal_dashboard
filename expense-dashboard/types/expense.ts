/**
 * Expense-related type definitions
 * Central source of truth for expense data structures
 */

/**
 * Target categories for budget allocation
 * - Living: Essential daily expenses (rent, utilities, groceries)
 * - Present: Discretionary spending (entertainment, dining out)
 * - Future: Savings and investments
 */
export type ExpenseTarget = 'Living' | 'Present' | 'Future' | 'Income';

/**
 * Core expense record interface
 * Matches the database schema in Supabase
 */
export interface Expense {
  /** Unique identifier (optional, assigned by database) */
  id?: string;
  /** Year of the expense (e.g., 2026) */
  year: number;
  /** Month of the expense (1-12) */
  month: number;
  /** ISO date string (YYYY-MM-DD) */
  date: string;
  /** Budget allocation target */
  target: ExpenseTarget;
  /** Expense category (e.g., 'Food', 'Transport') */
  category: string;
  /** Amount spent in the local currency */
  value: number;
  /** Item description / what was purchased */
  item: string;
  /** Context of the expense (e.g., 'Daily', 'Travel') */
  context: string;
  /** Payment method (e.g., 'Credit Card', 'Cash') */
  method: string;
  /** Store or vendor name */
  shop: string;
  /** Location where purchase was made */
  location: string;
  /** User's feeling at transaction time (1=regret, 5=great) */
  feeling?: number;
  /** Reviewed feeling from retrospective prompt (1-5 scale) */
  feeling_review?: number;
}

/**
 * Expense creation input (all required fields explicit)
 */
export interface ExpenseInput {
  year: number;
  month: number;
  date: string;
  target: ExpenseTarget;
  category: string;
  value: number;
  item?: string;
  context?: string;
  method?: string;
  shop?: string;
  location?: string;
  feeling?: number;
}

/**
 * Expense with computed fields for display
 */
export interface ExpenseWithMeta extends Expense {
  /** Formatted date for display */
  formattedDate?: string;
  /** Formatted currency value */
  formattedValue?: string;
}
