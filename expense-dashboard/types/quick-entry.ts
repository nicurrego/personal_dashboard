/**
 * Quick Entry flow type definitions
 * Types for the mobile-first expense entry experience
 */

/**
 * Common context options for expenses
 */
export type QuickEntryContext = 'Daily' | 'Travel' | 'Work' | 'Gift' | 'Personal';

/**
 * Quick entry form data
 */
export interface QuickEntryData {
  /** Amount spent (null until entered) */
  value: number | null;
  /** Expense category */
  category: string;
  /** Target allocation (dynamic from database) */
  target: string | null;
  /** Shop/vendor name */
  shop: string;
  /** Payment method */
  method: string;
  /** Location */
  location: string;
  /** Item description (what was purchased) */
  item: string;
  /** Context (Daily, Travel, Work, etc.) */
  context: string;
  /** Date of expense */
  date: Date;
  /** User's feeling about this transaction (1-5 scale) */
  feeling: number | null;
}

/**
 * Steps in the quick entry flow
 */
export type QuickEntryStep =
  | 'amount'
  | 'category'
  | 'target'
  | 'shop'
  | 'method'
  | 'location'
  | 'item'
  | 'context'
  | 'feeling'
  | 'review';

/**
 * Autocomplete option for dropdown selects
 */
export interface QuickEntryOption {
  /** Unique identifier */
  id: string;
  /** Display label */
  label: string;
  /** Number of recent uses (for sorting) */
  recentCount?: number;
}

/**
 * Autocomplete data for all quick entry fields
 */
export interface AutocompleteData {
  categories: QuickEntryOption[];
  shops: QuickEntryOption[];
  methods: QuickEntryOption[];
  locations: QuickEntryOption[];
}

/**
 * Initial empty quick entry data
 */
export const INITIAL_QUICK_ENTRY_DATA: QuickEntryData = {
  value: null,
  category: '',
  target: null,
  shop: '',
  method: '',
  location: '',
  item: '',
  context: '',
  date: new Date(),
  feeling: null
};

/**
 * Quick entry step configuration
 */
export interface StepConfig {
  id: QuickEntryStep;
  label: string;
  placeholder: string;
  required: boolean;
}

/**
 * Quick entry flow steps configuration
 */
export const QUICK_ENTRY_STEPS: StepConfig[] = [
  { id: 'amount', label: 'Amount', placeholder: '¥0', required: true },
  { id: 'category', label: 'Category', placeholder: 'Select category', required: true },
  { id: 'target', label: 'Target', placeholder: 'Select target', required: true },
  { id: 'shop', label: 'Shop', placeholder: 'Where did you buy?', required: false },
  { id: 'method', label: 'Method', placeholder: 'Payment method', required: false },
  { id: 'location', label: 'Location', placeholder: 'Location', required: false },
  { id: 'item', label: 'Item', placeholder: 'What did you buy?', required: false },
  { id: 'context', label: 'Context', placeholder: 'Context (Daily, Travel...)', required: false },
  { id: 'feeling', label: 'Feeling', placeholder: 'How do you feel?', required: false },
  { id: 'review', label: 'Review', placeholder: '', required: false }
];
