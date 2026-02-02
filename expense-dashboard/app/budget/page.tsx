'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { DEFAULT_CATEGORIES, TargetType } from '@/lib/constants/defaultCategories';
import { Edit } from 'lucide-react';
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
  Future: { bg: 'bg-growth-green/10', text: 'text-growth-green', border: 'border-growth-green' },
  Living: { bg: 'bg-cyber-cyan/10', text: 'text-cyber-cyan', border: 'border-cyber-cyan' },
  Present: { bg: 'bg-alert-amber/10', text: 'text-alert-amber', border: 'border-alert-amber' },
  Income: { bg: 'bg-flux-violet/10', text: 'text-white', border: 'border-white/20' },
};

const TARGET_ORDER: TargetType[] = ['Future', 'Living', 'Present'];

export default function BudgetPage() {
  const [data, setData] = useState<BudgetRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [expandedTargets, setExpandedTargets] = useState<Record<string, boolean>>({
    Future: true,
    Living: true,
    Present: true,
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

  const filteredData = data.filter(d => d.Year === selectedYear);

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
    // If it's a standard target, use DEFAULT_CATEGORIES to ensure order, but also check data for custom ones?
    // For now, rely on filteredData matching the target string.
    return filteredData
      .filter(d => d.Target === target)
      .reduce((sum, d) => sum + d.Budget, 0);
  };

  const formatCurrency = (val: number) => `¥${Math.round(val).toLocaleString()}`; // Removed decimals for cleaner look

  const toggleTarget = (target: string) => {
    setExpandedTargets(prev => ({ ...prev, [target]: !prev[target] }));
  };

  // Calculations for Summary Cards
  const totalIncome = getTargetTotal('Income');
  const livingTotal = getTargetTotal('Living');
  const futureTotal = getTargetTotal('Future');
  const presentTotal = getTargetTotal('Present');

  // Logic: 
  // Fixed Costs = Living
  // Discretionary Income = Total Income - Fixed Costs (If Income exists). 
  // IF Income is 0 (not set), maybe assume Discretionary = Future + Present?
  // Let's stick to the visual: "Available for categories".
  const fixedCosts = livingTotal;
  const discretionaryIncome = totalIncome > 0 ? (totalIncome - fixedCosts) : (futureTotal + presentTotal);

  // For Allocation bars:
  const allAllocationCategories = [
    ...DEFAULT_CATEGORIES.Future.map(c => ({ name: c, target: 'Future' })),
    ...DEFAULT_CATEGORIES.Present.map(c => ({ name: c, target: 'Present' })),
    // Add Living too? Only if user wants to see all allocations. 
    // The previous app showed allocations for discretionary spending usually.
    // Let's show specific categories from Future & Present as "Allocations".
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-void-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyber-cyan"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-void-black text-white p-6 pb-32 page-ambient">
      <div className="max-w-7xl mx-auto space-y-8 relative z-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <Link href="/" className="text-secondary-text text-sm hover:text-white transition-colors mb-2 inline-block">
              ← Back to Home
            </Link>
            <h1 className="text-3xl font-bold">Monthly Budget</h1>
            <p className="text-secondary-text text-sm font-mono">{selectedYear} Plan</p>
          </div>

          <div className="flex items-center gap-4">
            {/* Year Selector */}
            <div className="flex gap-2">
              {years.map(year => (
                <button
                  key={year}
                  onClick={() => setSelectedYear(year)}
                  className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${selectedYear === year
                    ? 'bg-kibo-teal text-kibo-bg'
                    : 'bg-glass-surface text-secondary-text hover:bg-neutral-800'
                    }`}
                >
                  {year}
                </button>
              ))}
            </div>

            {/* Edit Budget Button */}
            <Link href="/budget/builder">
              <button className="flex items-center gap-2 px-4 py-2 rounded-lg border border-white/10 hover:bg-white/5 transition-colors text-sm font-medium">
                <Edit className="w-4 h-4" />
                Edit Budget
              </button>
            </Link>
          </div>
        </div>

        {/* Pro Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Discretionary Income */}
          <div className="glass-premium rounded-xl p-5 hover-lift card-glow-future relative overflow-hidden">
            <div className="highlight-shine" />
            <p className="text-sm font-medium text-secondary-text mb-1">Discretionary Income</p>
            <div className="text-2xl font-bold text-growth-green">
              {formatCurrency(discretionaryIncome)}
            </div>
            <p className="text-xs text-secondary-text mt-1">Available for Future & Present</p>
          </div>

          {/* Total Income */}
          <div className="glass-premium rounded-xl p-5 hover-lift card-glow-income relative overflow-hidden">
            <div className="highlight-shine" />
            <p className="text-sm font-medium text-secondary-text mb-1">Total Income</p>
            <div className="text-2xl font-bold text-white">
              {formatCurrency(totalIncome > 0 ? totalIncome : (fixedCosts + discretionaryIncome))}
            </div>
            <p className="text-xs text-secondary-text mt-1">
              {totalIncome > 0 ? 'Based on Income Budget' : 'Sum of all Expenses'}
            </p>
          </div>

          {/* Fixed Costs */}
          <div className="glass-premium rounded-xl p-5 hover-lift card-glow-present relative overflow-hidden">
            <div className="highlight-shine" />
            <p className="text-sm font-medium text-secondary-text mb-1">Fixed Costs</p>
            <div className="text-2xl font-bold text-alert-amber">
              {formatCurrency(fixedCosts)}
            </div>
            <p className="text-xs text-secondary-text mt-1">Living Expenses</p>
          </div>
        </div>

        {/* Category Allocations Summary */}
        <div className="glass-premium rounded-xl p-6 relative overflow-hidden shimmer-effect">
          <h2 className="text-xl font-bold mb-1">Category Allocations</h2>
          <p className="text-secondary-text text-sm mb-6">Annual planned spending by category (Future & Present)</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
            {allAllocationCategories.map(({ name, target }) => {
              const total = getCategoryRowData(name).Total;
              if (total === 0) return null;

              // Calculate percent of Discretionary
              const percent = discretionaryIncome > 0 ? (total / discretionaryIncome) * 100 : 0;
              const colors = TARGET_COLORS[target];

              return (
                <div key={name} className="space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className={colors.text}>{name}</span>
                    <span className="font-mono">{formatCurrency(total)}</span>
                  </div>
                  <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${target === 'Future' ? 'bg-growth-green' : 'bg-alert-amber'}`}
                      style={{ width: `${Math.min(percent, 100)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Detailed Breakdown (Tables) */}
        <div className="space-y-6">
          <h2 className="text-xl font-bold pt-4">Monthly Breakdown</h2>
          {TARGET_ORDER.map((target) => {
            const categories = DEFAULT_CATEGORIES[target];
            const colors = TARGET_COLORS[target];
            const isExpanded = expandedTargets[target];

            return (
              <div key={target} className={`liquid-card overflow-hidden border-l-4 ${colors.border}`}>
                {/* Target Header */}
                <button
                  onClick={() => toggleTarget(target)}
                  className={`w-full p-4 flex justify-between items-center ${colors.bg} hover:bg-opacity-80 transition-all`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`text-xl font-bold ${colors.text}`}>{target}</span>
                    <span className="text-secondary-text text-sm">({categories.length} categories)</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`font-mono font-bold ${colors.text}`}>
                      {formatCurrency(getTargetTotal(target))}
                    </span>
                    <span className={`transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
                      ▼
                    </span>
                  </div>
                </button>

                {/* Table */}
                {isExpanded && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-white/10">
                          <th className="text-left p-3 text-secondary-text font-medium sticky left-0 bg-glass-surface z-10 min-w-[200px]">
                            Category
                          </th>
                          {months.map(m => (
                            <th key={m} className="text-right p-3 text-secondary-text font-medium min-w-[80px]">{m}</th>
                          ))}
                          <th className={`text-right p-3 font-bold ${colors.text} min-w-[100px]`}>Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {categories.map((category, i) => {
                          const rowData = getCategoryRowData(category);
                          const isZeroRow = rowData.Total === 0;

                          return (
                            <tr key={i} className={`border-b border-white/5 hover:bg-white/5 transition-colors ${isZeroRow ? 'opacity-60 hover:opacity-100' : ''}`}>
                              <td className="p-3 font-medium sticky left-0 bg-card-surface/80 backdrop-blur-sm">
                                {category}
                              </td>
                              {months.map(m => {
                                const val = rowData[m];
                                return (
                                  <td key={m} className={`text-right p-3 font-mono text-xs ${val === 0 ? 'text-secondary-text/30' : 'text-secondary-text'}`}>
                                    {val === 0 ? '-' : formatCurrency(val)}
                                  </td>
                                );
                              })}
                              <td className={`text-right p-3 font-mono font-bold ${colors.text} ${rowData.Total === 0 ? 'opacity-50' : ''}`}>
                                {formatCurrency(rowData.Total)}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Expenses Section */}
      <div className="pt-8 border-t border-white/10">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold">All Expenses</h2>
            <p className="text-secondary-text text-sm mt-1">Manage your transactions</p>
          </div>
          <Link
            href="/upload"
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-kibo-teal/10 border border-kibo-teal/30 text-kibo-teal text-sm font-medium hover:bg-kibo-teal/20 transition-all"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            <span>Import CSV</span>
          </Link>
        </div>

        <EditableExpenseTable
          expenses={expenses}
          onUpdate={handleUpdate}
          onDelete={handleDelete}
          editable={true}
          showDelete={true}
          pageSize={20}
          title=""
        />
      </div>
    </div>
  );
}

