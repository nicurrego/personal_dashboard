/**
 * Database types for Supabase tables
 * These match the structure we'll create in Supabase
 */

export interface DbExpense {
  id: string;
  user_id: string;
  year: number;
  month: number;
  date: string;
  target: string;
  category: string;
  value: number;
  item: string;
  context: string;
  method: string;
  shop: string;
  location: string;
  created_at: string;
  updated_at: string;
}

export interface DbBudget {
  id: string;
  user_id: string;
  year: number;
  month: number;
  target: string;
  category: string;
  amount: number;
  created_at: string;
  updated_at: string;
}

// Insert types (without auto-generated fields)
export type DbExpenseInsert = Omit<DbExpense, 'id' | 'user_id' | 'created_at' | 'updated_at'>;
export type DbBudgetInsert = Omit<DbBudget, 'id' | 'user_id' | 'created_at' | 'updated_at'>;

// Update types
export type DbExpenseUpdate = Partial<DbExpenseInsert>;
export type DbBudgetUpdate = Partial<DbBudgetInsert>;
