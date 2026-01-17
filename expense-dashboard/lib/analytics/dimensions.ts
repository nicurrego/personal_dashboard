import type { Expense, CategoryTotal, ShopTotal, DayOfWeekData, TargetDistribution } from '@/types';
import { CATEGORY_COLORS } from '@/lib/category-colors';

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
 * Calculate target distribution
 */
export function getTargetDistribution(expenses: Expense[]): TargetDistribution[] {
  const targetMap = new Map<string, number>();
  const total = expenses.reduce((sum, e) => sum + e.value, 0);
  
  expenses.forEach(expense => {
    targetMap.set(expense.target, (targetMap.get(expense.target) || 0) + expense.value);
  });
  
  // Use centralized colors
  const colors = {
    Living: CATEGORY_COLORS.LIVING,
    Present: CATEGORY_COLORS.PRESENT,
    Future: CATEGORY_COLORS.FUTURE
  };
  
  return Array.from(targetMap.entries()).map(([target, amount]) => ({
    target: target as 'Living' | 'Present' | 'Future',
    amount,
    percentage: (amount / total) * 100,
    color: colors[target as keyof typeof colors] || '#8e8e93'
  }));
}
