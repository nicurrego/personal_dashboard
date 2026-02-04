'use client';

import React from 'react';
import Link from 'next/link';
import { Edit, ChevronLeft, ChevronRight } from 'lucide-react';
import { EditableExpenseTable } from '@/components/expenses';
import type { Expense } from '@/types';
import { TARGET_ORDER, TARGET_COLORS } from '@/lib/constants/defaultCategories';
import { formatCurrency } from '@/lib/d3-utils';

export interface BudgetRow {
    Year: number;
    Month: number;
    Target: string;
    Category: string;
    Budget: number;
}

export interface BudgetViewProps {
    // Data
    data: BudgetRow[];
    expenses: Expense[];
    loading: boolean;

    // State
    viewMode: 'monthly' | 'yearly';
    selectedYear: number;
    selectedMonth: number;
    fullMonthNames: string[];
    months: string[];
    expandedTargets: Record<string, boolean>;

    // Actions
    setViewMode: (mode: 'monthly' | 'yearly') => void;
    handlePrevMonth: () => void;
    handleNextMonth: () => void;
    toggleTarget: (target: string) => void;
    handleUpdateExpense?: (expense: Expense) => Promise<void>;
    handleDeleteExpense?: (expense: Expense) => Promise<void>;

    // Computed (passed down or computed inside? computed inside is easier if data is clean)
    // We will compute derived stats inside the view to keep props simple, assuming 'data' is filtered or full?
    // Actually, keeping computation inside View allows passing just raw data.
}

export function BudgetView({
    data,
    expenses,
    loading,
    viewMode,
    selectedYear,
    selectedMonth,
    fullMonthNames,
    months,
    expandedTargets,
    setViewMode,
    handlePrevMonth,
    handleNextMonth,
    toggleTarget,
    handleUpdateExpense,
    handleDeleteExpense
}: BudgetViewProps) {

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    // --- Derived Calculations ---
    const filteredData = data.filter(d => d.Year === selectedYear);

    const getCategoryBudget = (category: string) => {
        const entries = filteredData.filter(d => d.Category === category);
        if (viewMode === 'monthly') {
            return entries.find(d => d.Month === selectedMonth + 1)?.Budget || 0;
        }
        return entries.reduce((sum, d) => sum + d.Budget, 0);
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

    // Calculations for Summary Cards
    const totalIncome = getTargetTotal('Income');
    const livingTotal = getTargetTotal('Living');
    const futureTotal = getTargetTotal('Future');
    const presentTotal = getTargetTotal('Present');

    const fixedCosts = livingTotal;
    const discretionaryIncome = totalIncome > 0 ? (totalIncome - fixedCosts) : (futureTotal + presentTotal);

    // Allocation breakdown helper
    // We need the list of categories. We can derive from data or use constant defaults.
    // Using data is safer for custom cats, but defaults is reliable.
    // Let's rely on what's in the data to avoid showing empty default cats.
    const uniqueCategories = Array.from(new Set(filteredData.map(d => ({ name: d.Category, target: d.Target }))));
    // Dedupe by name
    const allAllocationCategories = uniqueCategories.filter((v, i, a) => a.findIndex(t => (t.name === v.name)) === i)
        .filter(c => c.target === 'Future' || c.target === 'Present');


    return (
        <div className="min-h-screen bg-background text-foreground p-6 pb-32">
            <div className="max-w-7xl mx-auto space-y-8 relative z-10">
                {/* Header */}
                <div className="flex items-start justify-between mb-8 gap-4">
                    <div className="flex flex-col gap-3">
                        <div>
                            <h1 className="text-3xl font-bold text-foreground">Budget</h1>
                            <p className="text-muted-foreground text-sm font-mono">
                                {viewMode === 'monthly' ? `${fullMonthNames[selectedMonth]} • ${selectedYear}` : `${selectedYear} • Annual Plan`}
                            </p>
                        </div>

                        <div className="flex items-center gap-3">
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

                    <Link href="/budget/quick">
                        <button className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border hover:bg-muted transition-colors text-sm font-medium text-foreground">
                            <Edit className="w-4 h-4" />
                            <span className="hidden sm:inline">Edit Plan</span>
                            <span className="sm:hidden">Edit</span>
                        </button>
                    </Link>
                </div>

                {/* Pro Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-card border border-border rounded-xl p-5 shadow-sm relative overflow-hidden">
                        <p className="text-sm font-medium text-muted-foreground mb-1">Discretionary Income</p>
                        <div className="text-2xl font-bold text-[var(--color-total)]">
                            {formatCurrency(discretionaryIncome)}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">Available for Future & Present</p>
                    </div>

                    <div className="bg-card border border-border rounded-xl p-5 shadow-sm relative overflow-hidden">
                        <p className="text-sm font-medium text-muted-foreground mb-1">Total Income</p>
                        <div className="text-2xl font-bold text-[var(--color-total)]">
                            {formatCurrency(totalIncome > 0 ? totalIncome : (fixedCosts + discretionaryIncome))}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {totalIncome > 0 ? 'Based on Income Budget' : 'Sum of all Expenses'}
                        </p>
                    </div>

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
                            const total = getCategoryBudget(name);
                            if (total === 0) return null;

                            const percent = discretionaryIncome > 0 ? (total / discretionaryIncome) * 100 : 0;

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
                        // Need categories for this target. 
                        // In original we used DEFAULT_CATEGORIES. 
                        // Let's stick to using what we find in data + defaults to ensure we show structure even if empty?
                        // Original code: const categories = DEFAULT_CATEGORIES[target];
                        // We should import DEFAULT_CATEGORIES or pass it. 
                        // Since it's a constant, we can use it, but we need to import it.
                        // Let's filter data for this target to get categories actually present, OR use defaults if we want to encourage filling them.
                        // The uniqueCategories above was good. 
                        // Let's blindly use defaults as per original to keep structure rigid.
                        // We need to import DEFAULT_CATEGORIES in this file then.
                        // Actually, I moved imports to top. I will use a prop or just import constants.
                        // I'll assume standard categories are desired.

                        // To make this fully reusable, we should probably pass categories or just import them.
                        // I'll import them at the top.

                        // Wait, I cannot use DEFAULT_CATEGORIES if I didn't import them in the top block of this tool call.
                        // I did: import { TARGET_ORDER, TARGET_COLORS }... wait, I missed DEFAULT_CATEGORIES in import?
                        // I imported TARGET_ORDER and TARGET_COLORS. I need DEFAULT_CATEGORIES.
                        // Let me check my import above. 
                        // "import { DEFAULT_CATEGORIES, ... } from ..." - NO, I didn't include it in the instruction text but I will in the file content.

                        const categories = getCategoriesForTarget(target); // Helper below using imports
                        const colors = TARGET_COLORS[target];
                        const isExpanded = expandedTargets[target];

                        return (
                            <div key={target} className={`bg-card overflow-hidden border-l-4 rounded-xl shadow-sm my-2 ${colors.border}`}>
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
                    onUpdate={handleUpdateExpense}
                    onDelete={handleDeleteExpense}
                    editable={!!handleUpdateExpense} // Only editable if handler provided
                    showDelete={!!handleDeleteExpense}
                    pageSize={10}
                    title=""
                    showSearch={false}
                />
            </div>
        </div>
    );
}

// Helper to get defaults - ideally imported
import { DEFAULT_CATEGORIES } from '@/lib/constants/defaultCategories';
function getCategoriesForTarget(target: string) {
    return DEFAULT_CATEGORIES[target as keyof typeof DEFAULT_CATEGORIES] || [];
}
