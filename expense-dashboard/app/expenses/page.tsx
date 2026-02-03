'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import type { Expense } from '@/types';
import { EditableExpenseTable } from '@/components/expenses';

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [pageSize, setPageSize] = useState(50);
  const [error, setError] = useState<string | null>(null);

  // Load expenses from API
  const loadExpenses = useCallback(async () => {
    try {
      const response = await fetch('/api/expenses');
      if (!response.ok) throw new Error('Failed to load expenses');

      const data = await response.json();
      setExpenses(data);
      setLoading(false);
    } catch (err) {
      console.error('Error loading expenses:', err);
      setError(err instanceof Error ? err.message : 'Failed to load expenses');
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadExpenses();
  }, [loadExpenses]);

  // Handle expense update
  const handleUpdate = async (expense: Expense) => {
    if (!expense.id) {
      console.error('Cannot update expense without ID');
      return;
    }

    try {
      const response = await fetch(`/api/expenses/${expense.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(expense),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update expense');
      }

      const updatedExpense = await response.json();

      // Update local state
      setExpenses(prev =>
        prev.map(e => e.id === updatedExpense.id ? updatedExpense : e)
      );
    } catch (err) {
      console.error('Error updating expense:', err);
      setError(err instanceof Error ? err.message : 'Failed to update expense');
    }
  };

  // Handle expense delete
  const handleDelete = async (expense: Expense) => {
    if (!expense.id) {
      console.error('Cannot delete expense without ID');
      return;
    }

    // Ask for confirmation
    if (!confirm(`Delete expense: ¥${expense.value.toLocaleString()} - ${expense.category}?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/expenses/${expense.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete expense');
      }

      // Remove from local state
      setExpenses(prev => prev.filter(e => e.id !== expense.id));
    } catch (err) {
      console.error('Error deleting expense:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete expense');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-void-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyber-cyan"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-void-black text-white p-6 pb-32 page-ambient">
      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold">Transactions</h1>
            <p className="text-secondary-text text-sm mt-1">
              Manage your transactions, import data, and search for records.
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-4">
            {/* Import moved to bottom */}
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-laser-magenta/10 border border-laser-magenta/30 text-laser-magenta">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div>
                <p className="font-medium">Error</p>
                <p className="text-sm mt-1 opacity-80">{error}</p>
              </div>
              <button
                onClick={() => setError(null)}
                className="ml-auto text-laser-magenta/70 hover:text-laser-magenta"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* Editable Table */}
        <EditableExpenseTable
          expenses={expenses}
          onUpdate={handleUpdate}
          onDelete={handleDelete}
          editable={true}
          showDelete={true}
          pageSize={pageSize}
          onPageSizeChange={setPageSize}
          title="All Transactions"
        />

        {/* Bottom Actions */}
        <div className="mt-8 flex justify-end">
          <Link
            href="/upload"
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-[#1B4034] border border-[#A9D9C7] text-[#A9D9C7] font-medium hover:bg-[#245244] transition-all shadow-lg"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            <span>Import data</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
