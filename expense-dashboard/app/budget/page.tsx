'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { DEFAULT_CATEGORIES, TargetType } from '@/lib/constants/defaultCategories';
import { Edit, ChevronLeft, ChevronRight } from 'lucide-react';
import type { Expense } from '@/types';
import { EditableExpenseTable } from '@/components/expenses';

interface BudgetRow {
  Year: number;
  Month: number;
  Target: string;
  Category: string;
  Budget: number;
}

const TARGET_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  Future: { bg: 'bg-[var(--color-future)]/10', text: 'text-[var(--color-future)]', border: 'border-[var(--color-future)]' },
  Living: { bg: 'bg-[var(--color-living)]/10', text: 'text-[var(--color-living)]', border: 'border-[var(--color-living)]' },
  Present: { bg: 'bg-[var(--color-present)]/10', text: 'text-[var(--color-present)]', border: 'border-[var(--color-present)]' },
  Income: { bg: 'bg-[var(--color-total)]/10', text: 'text-[var(--color-total)]', border: 'border-[var(--color-total)]/20' },
};

const TARGET_ORDER: TargetType[] = ['Future', 'Living', 'Present'];

export default function BudgetPage() {
  const [data, setData] = useState<BudgetRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [viewMode, setViewMode] = useState<'monthly' | 'yearly'>('monthly');
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth());

  const [expandedTargets, setExpandedTargets] = useState<Record<string, boolean>>({
    Future: false,
    Living: false,
    Present: false,
  });

  // Expenses State
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [expensesLoading, setExpensesLoading] = useState(true);

  // Load Budget Data
  useEffect(() => {
    async function loadData() {
      try {
        const response = await fetch('/api/budgets');
        if (!response.ok) throw new Error('Failed to load budget');

        const rawData = await response.json();

        const parsed: BudgetRow[] = rawData.map((b: any) => ({
          Year: Number(b.year),
          Month: Number(b.month),
          Target: b.target,
          Category: b.category,
          Budget: Number(b.amount)
        }));

        setData(parsed);
        if (parsed.length > 0) {
          const years = [...new Set(parsed.map(d => d.Year))].sort();
          if (years.includes(new Date().getFullYear())) {
            setSelectedYear(new Date().getFullYear());
          } else {
            setSelectedYear(years[years.length - 1]);
          }
        }
        setLoading(false);
      } catch (error) {
        console.error('Error loading budget:', error);
        setLoading(false);
      }
    }
    loadData();
    loadExpenses();
  }, []);

  // Load expenses from API
  async function loadExpenses() {
    try {
      const response = await fetch('/api/expenses');
      if (!response.ok) throw new Error('Failed to load expenses');
      const data = await response.json();
      setExpenses(data);
      setExpensesLoading(false);
    } catch (err) {
      console.error('Error loading expenses:', err);
      setExpensesLoading(false);
    }
  }

  // Handle expense update
  const handleUpdate = async (expense: Expense) => {
    if (!expense.id) return;
    try {
      const response = await fetch(`/api/expenses/${expense.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(expense),
      });
      if (!response.ok) throw new Error('Failed to update expense');
      const updatedExpense = await response.json();
      setExpenses(prev => prev.map(e => e.id === updatedExpense.id ? updatedExpense : e));
    } catch (err) {
      console.error('Error updating expense:', err);
    }
  };

  // Handle expense delete
  const handleDelete = async (expense: Expense) => {
    if (!expense.id) return;
    if (!confirm(`Delete expense: ¥${expense.value.toLocaleString()} - ${expense.category}?`)) return;
    try {
      const response = await fetch(`/api/expenses/${expense.id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete expense');
      setExpenses(prev => prev.filter(e => e.id !== expense.id));
    } catch (err) {
      console.error('Error deleting expense:', err);
    }
  };

  const dataYears = [...new Set(data.map(d => d.Year))].sort();
  const years = dataYears.length > 0 ? dataYears : [new Date().getFullYear()];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const fullMonthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  const filteredData = data.filter(d => d.Year === selectedYear);

  // Helper to get budget for a specific category
  // Respects viewMode: if monthly, returns that month's val; if yearly, returns year sum.
  const getCategoryBudget = (category: string) => {
    const entries = filteredData.filter(d => d.Category === category);
    if (viewMode === 'monthly') {
      return entries.find(d => d.Month === selectedMonth + 1)?.Budget || 0;
    }
    return entries.reduce((sum, d) => sum + d.Budget, 0);
  };

  // For the Yearly table view - gets row data for all months
  const getCategoryRowData = (category: string) => {
    const row: Record<string, number> = {};
    months.forEach((_, idx) => {
      const monthNum = idx + 1;
      const entry = filteredData.find(d => d.Category === category && d.Month === monthNum);
      row[months[idx]] = entry?.Budget || 0;
    });
    row.Total = months.reduce((sum, m) => sum + (row[m] || 0), 0);
    return row;
  };

  const getTargetTotal = (target: string) => {
    return filteredData
      .filter(d => {
        const targetMatch = d.Target === target;
        if (viewMode === 'monthly') {
          return targetMatch && d.Month === (selectedMonth + 1);
        }
        return targetMatch;
      })
      .reduce((sum, d) => sum + d.Budget, 0);
  };

  const formatCurrency = (val: number) => `¥${Math.round(val).toLocaleString()}`;

  const toggleTarget = (target: string) => {
    setExpandedTargets(prev => ({ ...prev, [target]: !prev[target] }));
  };

  const handlePrevMonth = () => {
    setSelectedMonth(prev => prev === 0 ? 11 : prev - 1);
    if (selectedMonth === 0) setSelectedYear(prev => prev - 1);
  };

  const handleNextMonth = () => {
    setSelectedMonth(prev => prev === 11 ? 0 : prev + 1);
    if (selectedMonth === 11) setSelectedYear(prev => prev + 1);
  };

  // Calculations for Summary Cards
  const totalIncome = getTargetTotal('Income');
  const livingTotal = getTargetTotal('Living');
  const futureTotal = getTargetTotal('Future');
  const presentTotal = getTargetTotal('Present');

  const fixedCosts = livingTotal;
  // Discretionary calculation needs careful checking if Income is 0
  const discretionaryIncome = totalIncome > 0 ? (totalIncome - fixedCosts) : (futureTotal + presentTotal);

  // For Allocation bars:
  const allAllocationCategories = [
    ...DEFAULT_CATEGORIES.Future.map(c => ({ name: c, target: 'Future' })),
    ...DEFAULT_CATEGORIES.Present.map(c => ({ name: c, target: 'Present' })),
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground p-6 pb-32">
      <div className="max-w-7xl mx-auto space-y-8 relative z-10">
        {/* Header */}
        <div className="flex items-start justify-between mb-8 gap-4">
          {/* Left side: Title, View Switcher, Navigation */}
          <div className="flex flex-col gap-3">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Budget</h1>
              <p className="text-muted-foreground text-sm font-mono">
                {viewMode === 'monthly' ? `${fullMonthNames[selectedMonth]} • ${selectedYear}` : `${selectedYear} • Annual Plan`}
              </p>
            </div>

            <div className="flex items-center gap-3">
              {/* View Switcher */}
              <div className="flex bg-muted border border-border rounded-lg p-1">
                <button
                  onClick={() => setViewMode('monthly')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${viewMode === 'monthly'
                    ? 'bg-secondary text-secondary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                    }`}
                >
                  Month
                </button>
                <button
                  onClick={() => setViewMode('yearly')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${viewMode === 'yearly'
                    ? 'bg-secondary text-secondary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                    }`}
                >
                  Year
                </button>
              </div>

              {/* Month Navigation */}
              {viewMode === 'monthly' && (
                <div className="flex items-center gap-1">
                  <button onClick={handlePrevMonth} className="p-2 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground">
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button onClick={handleNextMonth} className="p-2 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground">
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Right side: Edit Button */}
          <Link href="/budget/builder">
            <button className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border hover:bg-muted transition-colors text-sm font-medium text-foreground">
              <Edit className="w-4 h-4" />
              <span className="hidden sm:inline">Edit Plan</span>
              <span className="sm:hidden">Edit</span>
            </button>
          </Link>
        </div>

        {/* Pro Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Discretionary Income */}
          <div className="bg-card border border-border rounded-xl p-5 shadow-sm relative overflow-hidden">
            <p className="text-sm font-medium text-muted-foreground mb-1">Discretionary Income</p>
            <div className="text-2xl font-bold text-[var(--color-total)]">
              {formatCurrency(discretionaryIncome)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Available for Future & Present</p>
          </div>

          {/* Total Income */}
          <div className="bg-card border border-border rounded-xl p-5 shadow-sm relative overflow-hidden">
            <p className="text-sm font-medium text-muted-foreground mb-1">Total Income</p>
            <div className="text-2xl font-bold text-[var(--color-total)]">
              {formatCurrency(totalIncome > 0 ? totalIncome : (fixedCosts + discretionaryIncome))}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {totalIncome > 0 ? 'Based on Income Budget' : 'Sum of all Expenses'}
            </p>
          </div>

          {/* Fixed Costs */}
          <div className="bg-card border border-border rounded-xl p-5 shadow-sm relative overflow-hidden">
            <p className="text-sm font-medium text-muted-foreground mb-1">Fixed Costs</p>
            <div className="text-2xl font-bold text-[var(--color-living)]">
              {formatCurrency(fixedCosts)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Living Expenses</p>
          </div>
        </div>

        {/* Category Allocations Summary */}
        <div className="bg-card border border-border rounded-xl p-6 relative overflow-hidden shadow-sm">
          <h2 className="text-xl font-bold mb-1 text-foreground">Category Allocations</h2>
          <p className="text-muted-foreground text-sm mb-6">
            {viewMode === 'monthly' ? 'Monthly' : 'Annual'} planned spending by category
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
            {allAllocationCategories.map(({ name, target }) => {
              const total = getCategoryBudget(name); // Use helper that respects viewMode
              if (total === 0) return null;

              // Calculate percent of Discretionary
              const percent = discretionaryIncome > 0 ? (total / discretionaryIncome) * 100 : 0;
              const colors = TARGET_COLORS[target];

              return (
                <div key={name} className="space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-foreground">{name}</span>
                    <span className="font-mono text-foreground">{formatCurrency(total)}</span>
                  </div>
                  <div className={`h-2 w-full rounded-full overflow-hidden ${target === 'Future' ? 'bg-[var(--color-future)]/20' : 'bg-[var(--color-present)]/20'}`}>
                    <div
                      className={`h-full ${target === 'Future' ? 'bg-[var(--color-future)]' : 'bg-[var(--color-present)]'}`}
                      style={{ width: `${Math.min(percent, 100)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Detailed Breakdown */}
        <div className="space-y-6">
          <h2 className="text-xl font-bold pt-4">{viewMode === 'monthly' ? 'Category Details' : 'Yearly Overview'}</h2>
          {TARGET_ORDER.map((target) => {
            const categories = DEFAULT_CATEGORIES[target];
            const colors = TARGET_COLORS[target];
            const isExpanded = expandedTargets[target];

            return (
              <div key={target} className={`bg-card overflow-hidden border-l-4 rounded-xl shadow-sm my-2 ${colors.border}`}>
                {/* Target Header - Only left border for color differentiation */}
                <button
                  onClick={() => toggleTarget(target)}
                  className="w-full p-4 flex justify-between items-center hover:bg-muted/30 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl font-bold text-foreground">{target}</span>
                    <span className="text-muted-foreground text-sm">({categories.length} categories)</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-mono font-bold text-foreground">
                      {formatCurrency(getTargetTotal(target))}
                    </span>
                    <span className={`transform transition-transform text-muted-foreground ${isExpanded ? 'rotate-180' : ''}`}>
                      ▼
                    </span>
                  </div>
                </button>

                {/* Table */}
                {isExpanded && (
                  <div className="overflow-x-auto">
                    {viewMode === 'monthly' ? (
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-border">
                            <th className="text-left p-3 text-muted-foreground font-medium bg-card">Category</th>
                            <th className="text-right p-3 font-bold text-foreground">Amount</th>
                          </tr>
                        </thead>
                        <tbody>
                          {categories.map((category, i) => {
                            const budget = getCategoryBudget(category);
                            if (budget === 0) return null;

                            return (
                              <tr key={i} className="border-b border-border hover:bg-muted/30 transition-colors">
                                <td className="p-3 font-medium text-foreground">{category}</td>
                                <td className={`text-right p-3 font-mono font-bold text-foreground ${budget === 0 ? 'opacity-30' : ''}`}>
                                  {formatCurrency(budget)}
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    ) : (
                      /* YEARLY VIEW TABLE (Existing) */
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-border">
                            <th className="text-left p-3 text-muted-foreground font-medium sticky left-0 bg-card z-10 min-w-[200px]">
                              Category
                            </th>
                            {months.map(m => (
                              <th key={m} className="text-right p-3 text-muted-foreground font-medium min-w-[80px]">{m}</th>
                            ))}
                            <th className="text-right p-3 font-bold text-foreground min-w-[100px]">Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {categories.map((category, i) => {
                            const rowData = getCategoryRowData(category);
                            const isZeroRow = rowData.Total === 0;

                            return (
                              <tr key={i} className={`border-b border-border hover:bg-muted/30 transition-colors ${isZeroRow ? 'opacity-60 hover:opacity-100' : ''}`}>
                                <td className="p-3 font-medium sticky left-0 bg-card">
                                  {category}
                                </td>
                                {months.map(m => {
                                  const val = rowData[m];
                                  return (
                                    <td key={m} className={`text-right p-3 font-mono text-xs ${val === 0 ? 'text-muted-foreground/30' : 'text-muted-foreground'}`}>
                                      {val === 0 ? '-' : formatCurrency(val)}
                                    </td>
                                  );
                                })}
                                <td className={`text-right p-3 font-mono font-bold text-foreground ${rowData.Total === 0 ? 'opacity-50' : ''}`}>
                                  {formatCurrency(rowData.Total)}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Expenses Section */}
      <div className="pt-8 border-t border-border">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">Transactions</h2>
          <Link
            href="/expenses"
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-muted border border-border text-foreground text-sm font-medium hover:bg-muted/80 transition-all"
          >
            <span>See all</span>
          </Link>
        </div>

        <EditableExpenseTable
          expenses={expenses.slice(0, 10)}
          onUpdate={handleUpdate}
          onDelete={handleDelete}
          editable={true}
          showDelete={true}
          pageSize={10}
          title=""
          showSearch={false}
        />
      </div>
    </div>
  );
}

