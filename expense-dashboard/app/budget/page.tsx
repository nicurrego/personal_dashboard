'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { BudgetView } from '@/components/screens/BudgetView';
import { DEFAULT_CATEGORIES, TargetType } from '@/lib/constants/defaultCategories';
import { Edit, ChevronLeft, ChevronRight } from 'lucide-react';
import type { Expense } from '@/types';
import { EditableExpenseTable } from '@/components/expenses';
import { useTour } from '@/context/TourContext';
import { MOCK_BUDGET, MOCK_EXPENSES } from '@/lib/tour/mockData';

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


  const { isTourActive } = useTour();

  // Expenses State
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [expensesLoading, setExpensesLoading] = useState(true);

  // Load Budget Data
  useEffect(() => {
    async function loadData() {
      if (isTourActive) {
        // Use Mock Data
        const parsed: BudgetRow[] = MOCK_BUDGET.map((b: any) => ({
          Year: Number(b.year),
          Month: Number(b.month),
          Target: b.target,
          Category: b.category,
          Budget: Number(b.amount)
        }));
        setData(parsed);
        // Set default month/year for tour data (mock data is "current" month)
        // Mock data logic uses "current month" of the user's machine in mockData.ts
        const now = new Date();
        setSelectedYear(now.getFullYear());
        setSelectedMonth(now.getMonth()); // 0-indexed

        setLoading(false);
        return;
      }

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
    // Expenses are loaded separately, but we should handle them together or separately
  }, [isTourActive]);

  // Load expenses from API (or Mock)
  // We trigger this from useEffect or separate call. 
  // The original code called it in the [] effect. We moved it out or need to call it.
  useEffect(() => {
    async function loadExpenses() {
      if (isTourActive) {
        setExpenses(MOCK_EXPENSES);
        setExpensesLoading(false);
        return;
      }

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
    loadExpenses();
  }, [isTourActive]);

  // Old loadExpenses function removed/integrated into effect above
  // async function loadExpenses() { ... } 
  // We remove the old definition to avoid duplicates or unused code warning, 
  // but simpler to just empty it if it was called elsewhere? 
  // No, I replaced the useEffect that CALLED it. I should verify if loadExpenses is used elsewhere.
  // It is NOT used elsewhere in the provided snippet.
  // So I can replace the function definition block with nothing or comment it out.

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

  // ... (keep state and data fetching)

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <BudgetView
      data={data}
      expenses={expenses}
      loading={loading}
      viewMode={viewMode}
      selectedYear={selectedYear}
      selectedMonth={selectedMonth}
      fullMonthNames={fullMonthNames}
      months={months}
      expandedTargets={expandedTargets}
      setViewMode={setViewMode}
      handlePrevMonth={handlePrevMonth}
      handleNextMonth={handleNextMonth}
      toggleTarget={toggleTarget}
      handleUpdateExpense={handleUpdate}
      handleDeleteExpense={handleDelete}
    />
  );
}

