import type { Expense, MonthlyData, TrendDataPoint } from '@/types';

/**
 * Aggregate expenses by month
 */
export function aggregateByMonth(expenses: Expense[]): MonthlyData[] {
  const monthMap = new Map<string, MonthlyData>();
  
  expenses.forEach(expense => {
    const date = new Date(expense.date);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    
    if (!monthMap.has(key)) {
      monthMap.set(key, {
        month: key,
        date: new Date(date.getFullYear(), date.getMonth(), 1),
        total: 0,
        living: 0,
        present: 0,
        future: 0
      });
    }
    
    const monthData = monthMap.get(key)!;
    monthData.total += expense.value;
    
    if (expense.target === 'Living') monthData.living += expense.value;
    if (expense.target === 'Present') monthData.present += expense.value;
    if (expense.target === 'Future') monthData.future += expense.value;
  });
  
  return Array.from(monthMap.values()).sort((a, b) => a.date.getTime() - b.date.getTime());
}

/**
 * Aggregate expenses by day
 */
export function aggregateByDay(expenses: Expense[]): TrendDataPoint[] {
  const dayMap = new Map<string, TrendDataPoint>();
  
  expenses.forEach(expense => {
    const date = new Date(expense.date);
    const key = expense.date; // YYYY-MM-DD
    const dayNum = date.getDate();
    
    if (!dayMap.has(key)) {
      dayMap.set(key, {
        label: `${dayNum}`,
        date: date,
        total: 0,
        living: 0,
        present: 0,
        future: 0
      });
    }
    
    const dayData = dayMap.get(key)!;
    dayData.total += expense.value;
    
    if (expense.target === 'Living') dayData.living += expense.value;
    if (expense.target === 'Present') dayData.present += expense.value;
    if (expense.target === 'Future') dayData.future += expense.value;
  });
  
  return Array.from(dayMap.values()).sort((a, b) => a.date.getTime() - b.date.getTime());
}

/**
 * Smart trend aggregation - adapts granularity based on data range
 * - 1-2 months of data: daily view
 * - 3+ months: monthly view
 */
export function aggregateTrendData(expenses: Expense[]): { data: TrendDataPoint[], granularity: 'daily' | 'monthly' } {
  if (expenses.length === 0) {
    return { data: [], granularity: 'monthly' };
  }
  
  // Determine date range
  const dates = expenses.map(e => new Date(e.date).getTime());
  const minDate = new Date(Math.min(...dates));
  const maxDate = new Date(Math.max(...dates));
  
  // Calculate months span
  const monthsSpan = (maxDate.getFullYear() - minDate.getFullYear()) * 12 
    + (maxDate.getMonth() - minDate.getMonth()) + 1;
  
  // Use daily for 1-2 months, monthly for more
  if (monthsSpan <= 2) {
    return { data: aggregateByDay(expenses), granularity: 'daily' };
  } else {
    // Convert MonthlyData to TrendDataPoint
    const monthlyData = aggregateByMonth(expenses);
    const trendData: TrendDataPoint[] = monthlyData.map(m => ({
      label: m.month,
      date: m.date,
      total: m.total,
      living: m.living,
      present: m.present,
      future: m.future
    }));
    return { data: trendData, granularity: 'monthly' };
  }
}
