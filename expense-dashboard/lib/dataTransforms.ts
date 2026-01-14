import { 
  Expense, 
  FilterState, 
  MonthlyData, 
  CategoryTotal, 
  TargetDistribution,
  ShopTotal,
  DayOfWeekData,
  KPIMetrics 
} from './types';

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
 * Calculate target distribution
 */
export function getTargetDistribution(expenses: Expense[]): TargetDistribution[] {
  const targetMap = new Map<string, number>();
  const total = expenses.reduce((sum, e) => sum + e.value, 0);
  
  expenses.forEach(expense => {
    targetMap.set(expense.target, (targetMap.get(expense.target) || 0) + expense.value);
  });
  
  const colors = {
    Living: '#10b981',   // Green
    Present: '#3b82f6',  // Blue  
    Future: '#f59e0b'    // Orange
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
