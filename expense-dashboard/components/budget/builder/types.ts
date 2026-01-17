// Shared types for the Budget Spreadsheet component tree

export type ViewMode = 'MONTHLY' | 'QUARTERLY' | 'SEMESTRAL' | 'YEARLY' | '5_YEARS';

export interface ColumnDef {
  label: string;
  index: number;
  span: number;
}

export interface SelectedCell {
  id: string;
  type: 'cell' | 'category' | 'add-category';
  group?: string;
  value: string;
  colIndex?: number;
  span?: number;
  rawVal?: number;
}

export interface AlertModalState {
  isOpen: boolean;
  title: string;
  description: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
}

export interface FullEditModalState {
  isOpen: boolean;
  type: 'cell' | 'category';
  title: string;
  value: string;
  categoryId: string;
  colIndex?: number;
  span?: number;
}

export interface BudgetTotals {
  income: number;
  future: number;
  living: number;
  present: number;
}

export type GroupKey = 'INCOME' | 'FUTURE' | 'LIVING' | 'PRESENT';
