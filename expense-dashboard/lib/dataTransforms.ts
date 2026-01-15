import { 
  Expense, 
  Budget,
  FilterState, 
  MonthlyData,
  TrendDataPoint,
  CategoryTotal, 
  TargetDistribution,
  ShopTotal,
  DayOfWeekData,
  KPIMetrics 
} from './types';

/**
 * Filter budget based on filter state
 */
export function filterBudget(budgetItems: Budget[], filters: FilterState): Budget[] {
  return budgetItems.filter(item => {
    // Year filter (from date range or explicit year if logic existed, but usually implied by filters)
    // Here we need to map DateRange to years/months.
    
    // Simplification: Check if the budget month/year falls within dateRange
    if (filters.dateRange.start || filters.dateRange.end) {
      // Construct a date for the budget item (1st of the month)
      const budgetDate = new Date(item.year, item.month - 1, 1);
      
      if (filters.dateRange.start) {
        // Compare with start of month vs specific date might be tricky, but usually dateRange is 1st of month
        // Let's be lenient: if budget month overlaps with range
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

/**
 * Calculate target distribution
 */
export function getTargetDistribution(expenses: Expense[]): TargetDistribution[] {
  const targetMap = new Map<string, number>();
  const total = expenses.reduce((sum, e) => sum + e.value, 0);
  
  expenses.forEach(expense => {
    targetMap.set(expense.target, (targetMap.get(expense.target) || 0) + expense.value);
  });
  
  const colors = {
    Living: '#06b6d4',   // Cyan
    Present: '#f59e0b',  // Amber
    Future: '#22c55e'    // Green
  };
  
  return Array.from(targetMap.entries()).map(([target, amount]) => ({
    target: target as 'Living' | 'Present' | 'Future',
    amount,
    percentage: (amount / total) * 100,
    color: colors[target as keyof typeof colors]
  }));
}

/**
 * Get top categories by spend
 */
export function getTopCategories(expenses: Expense[], limit = 10): CategoryTotal[] {
  const categoryMap = new Map<string, { total: number; count: number }>();
  
  expenses.forEach(expense => {
    const current = categoryMap.get(expense.category) || { total: 0, count: 0 };
    categoryMap.set(expense.category, {
      total: current.total + expense.value,
      count: current.count + 1
    });
  });
  
  const total = expenses.reduce((sum, e) => sum + e.value, 0);
  
  return Array.from(categoryMap.entries())
    .map(([category, data]) => ({
      category,
      total: data.total,
      count: data.count,
      percentage: (data.total / total) * 100
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, limit);
}

/**
 * Get top shops by spend
 */
export function getTopShops(expenses: Expense[], limit = 10): ShopTotal[] {
  const shopMap = new Map<string, { total: number; count: number }>();
  
  expenses.forEach(expense => {
    if (!expense.shop) return;
    const current = shopMap.get(expense.shop) || { total: 0, count: 0 };
    shopMap.set(expense.shop, {
      total: current.total + expense.value,
      count: current.count + 1
    });
  });
  
  return Array.from(shopMap.entries())
    .map(([shop, data]) => ({
      shop,
      total: data.total,
      transactionCount: data.count,
      avgTransaction: data.total / data.count
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, limit);
}

/**
 * Get spending by day of week
 */
export function getSpendingByDayOfWeek(expenses: Expense[]): DayOfWeekData[] {
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dayMap = new Map<number, { total: number; count: number }>();
  
  // Initialize all days
  for (let i = 0; i < 7; i++) {
    dayMap.set(i, { total: 0, count: 0 });
  }
  
  expenses.forEach(expense => {
    const date = new Date(expense.date);
    const day = date.getDay();
    const current = dayMap.get(day)!;
    dayMap.set(day, {
      total: current.total + expense.value,
      count: current.count + 1
    });
  });
  
  return Array.from(dayMap.entries()).map(([dayIndex, data]) => ({
    day: dayNames[dayIndex],
    dayIndex,
    total: data.total,
    avgTransaction: data.count > 0 ? data.total / data.count : 0
  }));
}

/**
 * Calculate KPI metrics
 */
export function calculateKPIs(expenses: Expense[]): KPIMetrics {
  const totalSpent = expenses.reduce((sum, e) => sum + e.value, 0);
  
  // Calculate monthly average
  const monthlyData = aggregateByMonth(expenses);
  const avgMonthly = monthlyData.length > 0 
    ? monthlyData.reduce((sum, m) => sum + m.total, 0) / monthlyData.length 
    : 0;
  
  // Get top category
  const categories = getTopCategories(expenses, 1);
  const topCategory = categories[0]?.category || 'N/A';
  
  // Calculate future percentage
  const futureSpent = expenses
    .filter(e => e.target === 'Future')
    .reduce((sum, e) => sum + e.value, 0);
  const futurePercentage = totalSpent > 0 ? (futureSpent / totalSpent) * 100 : 0;
  
  // Month over month change
  let monthOverMonth = 0;
  if (monthlyData.length >= 2) {
    const lastMonth = monthlyData[monthlyData.length - 1].total;
    const prevMonth = monthlyData[monthlyData.length - 2].total;
    monthOverMonth = prevMonth > 0 ? ((lastMonth - prevMonth) / prevMonth) * 100 : 0;
  }
  
  return {
    totalSpent,
    avgMonthly,
    topCategory,
    futurePercentage,
    monthOverMonth,
    totalTransactions: expenses.length
  };
}

export interface BudgetProgress {
  total: { spent: number; budget: number; remaining: number; percentage: number };
  living: { spent: number; budget: number; remaining: number; percentage: number };
  present: { spent: number; budget: number; remaining: number; percentage: number };
  future: { spent: number; budget: number; remaining: number; percentage: number };
}

export function getBudgetProgress(expenses: Expense[], budgetItems: Budget[]): BudgetProgress {
  const progress: BudgetProgress = {
    total: { spent: 0, budget: 0, remaining: 0, percentage: 0 },
    living: { spent: 0, budget: 0, remaining: 0, percentage: 0 },
    present: { spent: 0, budget: 0, remaining: 0, percentage: 0 },
    future: { spent: 0, budget: 0, remaining: 0, percentage: 0 }
  };

  // Calculate spent
  expenses.forEach(e => {
    progress.total.spent += e.value;
    const target = e.target.toLowerCase() as keyof Omit<BudgetProgress, 'total'>;
    if (progress[target]) {
      progress[target].spent += e.value;
    }
  });

  // Calculate budget
  budgetItems.forEach(b => {
    progress.total.budget += b.amount;
    const target = b.target.toLowerCase() as keyof Omit<BudgetProgress, 'total'>;
    if (progress[target]) {
      progress[target].budget += b.amount;
    }
  });

  // Calculate remaining and percentage
  function calc(item: { spent: number; budget: number; remaining: number; percentage: number }) {
    item.remaining = item.budget - item.spent;
    item.percentage = item.budget > 0 ? (item.spent / item.budget) * 100 : 0;
  }

  calc(progress.total);
  calc(progress.living);
  calc(progress.present);
  calc(progress.future);

  return progress;
}
