'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function getUserBudget() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return null;

  // Fetch all budgets for the user
  const { data: budgetFilter, error } = await supabase
    .from('budgets')
    .select('*')
    .eq('user_id', user.id);

  if (error || !budgetFilter || budgetFilter.length === 0) {
    return null;
  }

  // Calculate generic totals (this is a simple aggregation, might need refinement for year/month specific views)
  // For the "Overview" card, we might want to show the CURRENT MONTH's stats or Average.
  // Let's assume we want to show stats for the Current Year.
  const currentYear = new Date().getFullYear();
  const currentBudgets = budgetFilter.filter((b: any) => Number(b.year) === currentYear);

  if (currentBudgets.length === 0) return null;

  // Group by category to find average monthly cost or total annual?
  // User liked "Total Income", "Fixed Costs".
  // Let's calculate Annual Totals for the current year.
  
  const totalByTarget: Record<string, number> = {
    Future: 0,
    Living: 0,
    Present: 0
  };

  const categoriesMap = new Map<string, { allocated: number, spent: number, remaining: number }>();

  currentBudgets.forEach((b: any) => {
    const amount = Number(b.amount);
    if (totalByTarget[b.target] !== undefined) {
      totalByTarget[b.target] += amount;
    }
    
    // Track category totals
    if (!categoriesMap.has(b.category)) {
      categoriesMap.set(b.category, { allocated: 0, spent: 0, remaining: 0 });
    }
    const cat = categoriesMap.get(b.category)!;
    cat.allocated += amount;
    // Spent/Remaining would come from Expenses table ideally, but for now we focus on Budget
  });

  const totalFixedCosts = totalByTarget['Living'];
  const totalDiscretionary = totalByTarget['Future'] + totalByTarget['Present']; // Usually specific to Present, but Future is also discretionary-ish (decision wise)
  // Wait, Budget Pro definition: Income - Fixed = Discretionary.
  // And allocations come from Discretionary.
  // So Discretionary usually means (Future + Present).
  
  // Note: we don't have "Income" explicitly in 'budgets' table unless we add it or sum everything roughly.
  // IF the user budgeted their income properly (Zero Based), then Income = Sum(All).
  const totalIncome = totalFixedCosts + totalDiscretionary;

  const categoriesList = Array.from(categoriesMap.entries()).map(([name, stats]) => ({
    id: name,
    name,
    allocatedAmount: stats.allocated,
    spentAmount: 0, // Need to implement expense fetching for this
    remainingAmount: stats.allocated,
    percentUsed: 0,
    status: 'OK'
  }));

  return {
    id: 'current-budget',
    period: 'Annual ' + currentYear,
    startDate: new Date(currentYear, 0, 1),
    endDate: new Date(currentYear, 11, 31),
    totalDiscretionary,
    totalIncome,
    totalFixedCosts,
    categories: categoriesList
  };
}

/**
 * Fetch budget data in a format suitable for the budget builder/editor.
 * Returns raw budget rows that can be converted to spreadsheet data format.
 */
export async function getBudgetForEditing() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return null;

  // Fetch all budgets for the user for the current planning period
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;
  
  const { data: budgets, error } = await supabase
    .from('budgets')
    .select('*')
    .eq('user_id', user.id)
    .gte('year', currentYear)
    .order('year', { ascending: true })
    .order('month', { ascending: true });

  if (error || !budgets || budgets.length === 0) {
    return null;
  }

  // Return the raw budget rows
  return budgets.map((b: any) => ({
    year: Number(b.year),
    month: Number(b.month),
    target: b.target,
    category: b.category,
    amount: Number(b.amount)
  }));
}

export type BudgetRow = {
  year: number;
  month: number;
  target: string;
  category: string;
  amount: number;
};

export async function saveBudget(items: BudgetRow[]) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Unauthorized');
  }

  if (!items || items.length === 0) {
    return { success: true };
  }

  // We should replace existing budget for the affected periods/categories
  // Or just upsert.
  // Ideally, we delete relevant rows and insert new ones to avoid duplicates/stale data.
  
  // Find range of data being saved
  const years = [...new Set(items.map(i => i.year))];
  
  // This is a bulk operation, might be heavy.
  // Let's delete for the specific years first.
  // WARNING: This deletes ALL budget for that year.
  // Make sure we are sending full year data from the wizard. 
  // The Wizard generates 12 months for selected checks.
  
  for (const year of years) {
    // Delete existing budget for this user and year
    // This assumes we are overwriting the whole year plan.
    await supabase
      .from('budgets')
      .delete()
      .eq('user_id', user.id)
      .eq('year', year);
  }

  const payload = items.map(item => ({
    ...item,
    user_id: user.id
  }));

  const { error } = await supabase
    .from('budgets')
    .insert(payload);

  if (error) {
    console.error('Error saving budget:', error);
    throw new Error(error.message);
  }
  
  revalidatePath('/budget');
  return { success: true };
}

// Legacy function signature to avoid breaking existing callers immediately, 
// though we will be updating the caller.
export async function createBudget(data: any) {
  // This was the mock one. We shouldn't use it anymore.
  return { success: true };
}

