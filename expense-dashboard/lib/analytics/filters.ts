import type { Expense, Budget, FilterState } from '@/types';

/**
 * Filter budget based on filter state
 */
export function filterBudget(budgetItems: Budget[], filters: FilterState): Budget[] {
  return budgetItems.filter(item => {
    // Simplification: Check if the budget month/year falls within dateRange
    if (filters.dateRange.start || filters.dateRange.end) {
      // Construct a date for the budget item (1st of the month)
      const budgetDate = new Date(item.year, item.month - 1, 1);

      if (filters.dateRange.start) {
        if (budgetDate < new Date(filters.dateRange.start.getFullYear(), filters.dateRange.start.getMonth(), 1)) return false;
      }
      if (filters.dateRange.end) {
        if (budgetDate > filters.dateRange.end) return false;
      }
    }

    // Month filter
    if (filters.months && filters.months.length > 0) {
      if (!filters.months.includes(item.month)) return false;
    }

    // Target filter
    if (filters.targets.length > 0 && !filters.targets.includes(item.target)) {
      return false;
    }

    // Category filter
    if (filters.categories.length > 0 && !filters.categories.includes(item.category)) {
      return false;
    }

    return true;
  });
}

/**
 * Filter expenses based on filter state
 */
export function filterExpenses(expenses: Expense[], filters: FilterState): Expense[] {
  return expenses.filter(expense => {
    // Date range filter
    if (filters.dateRange.start || filters.dateRange.end) {
      const expenseDate = new Date(expense.date);
      if (filters.dateRange.start && expenseDate < filters.dateRange.start) return false;
      if (filters.dateRange.end && expenseDate > filters.dateRange.end) return false;
    }

    // Month filter (1-12)
    if (filters.months && filters.months.length > 0) {
      const expenseMonth = new Date(expense.date).getMonth() + 1;
      if (!filters.months.includes(expenseMonth)) return false;
    }

    // Target filter
    if (filters.targets.length > 0 && !filters.targets.includes(expense.target)) {
      return false;
    }

    // Category filter
    if (filters.categories.length > 0 && !filters.categories.includes(expense.category)) {
      return false;
    }

    // Location filter
    if (filters.locations.length > 0 && !filters.locations.includes(expense.location)) {
      return false;
    }

    // Method filter
    if (filters.methods.length > 0 && !filters.methods.includes(expense.method)) {
      return false;
    }

    // Shop filter
    if (filters.shops && filters.shops.length > 0 && !filters.shops.includes(expense.shop)) {
      return false;
    }

    return true;
  });
}

/**
 * Get unique values from a field
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getUniqueValues(expenses: Expense[], field: keyof Expense): string[] {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const unique = new Set(expenses.map(e => String((e as any)[field])).filter(v => v));
  return Array.from(unique).sort();
}
