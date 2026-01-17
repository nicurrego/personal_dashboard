/**
 * Filter-related type definitions
 * Central source of truth for filter state and options
 */

/**
 * Date range filter structure
 */
export interface DateRange {
  start: Date | null;
  end: Date | null;
}

/**
 * Complete filter state for expense filtering
 */
export interface FilterState {
  /** Date range filter */
  dateRange: DateRange;
  /** Selected months (1-12) */
  months: number[];
  /** Selected target categories */
  targets: string[];
  /** Selected expense categories */
  categories: string[];
  /** Selected locations */
  locations: string[];
  /** Selected payment methods */
  methods: string[];
  /** Selected shops/vendors */
  shops: string[];
}

/**
 * Available unique values for filter dropdowns
 */
export interface UniqueFilterValues {
  /** Available years in the data */
  years: number[];
  /** Available target types */
  targets: string[];
  /** Available categories */
  categories: string[];
  /** Available locations */
  locations: string[];
  /** Available payment methods */
  methods: string[];
  /** Available shops */
  shops: string[];
}

/**
 * Time range preset options
 */
export type TimeRangePreset = 'month' | 'year' | 'all';

/**
 * Initial/empty filter state
 */
export const INITIAL_FILTER_STATE: FilterState = {
  dateRange: { start: null, end: null },
  months: [],
  targets: [],
  categories: [],
  locations: [],
  methods: [],
  shops: []
};

/**
 * Initial unique values (empty state)
 */
export const INITIAL_UNIQUE_VALUES: UniqueFilterValues = {
  years: [],
  targets: [],
  categories: [],
  locations: [],
  methods: [],
  shops: []
};
