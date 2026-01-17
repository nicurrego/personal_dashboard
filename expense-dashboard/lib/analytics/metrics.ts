import type { Expense, Budget, KPIMetrics, BudgetProgress } from '@/types';
import { aggregateByMonth } from './aggregators';
import { getTopCategories } from './dimensions';

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
