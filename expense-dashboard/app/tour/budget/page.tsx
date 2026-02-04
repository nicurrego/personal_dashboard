'use client';

import React, { useState, useEffect } from 'react';
import { BudgetView } from '@/components/screens/BudgetView';
import { MOCK_BUDGET, MOCK_EXPENSES } from '@/lib/tour/mockData';
import type { Expense } from '@/types';

// Mock types
interface BudgetRow {
    Year: number;
    Month: number;
    Target: string;
    Category: string;
    Budget: number;
}

export default function TourBudgetPage() {
    // State
    const [data, setData] = useState<BudgetRow[]>([]);
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState<'monthly' | 'yearly'>('monthly');

    // Date Logic (Mock is always 'now')
    const now = new Date();
    const [selectedYear, setSelectedYear] = useState(now.getFullYear());
    const [selectedMonth, setSelectedMonth] = useState(now.getMonth());

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const fullMonthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    const [expandedTargets, setExpandedTargets] = useState<Record<string, boolean>>({
        Future: false,
        Living: false,
        Present: false,
    });

    // Initialize Data
    useEffect(() => {
        // Transform mock budget
        const parsedBudget: BudgetRow[] = MOCK_BUDGET.map((b: any) => ({
            Year: Number(b.year),
            Month: Number(b.month),
            Target: b.target,
            Category: b.category,
            Budget: Number(b.amount)
        }));
        setData(parsedBudget);

        // Set expenses
        setExpenses(MOCK_EXPENSES);
        setLoading(false);
    }, []);

    // Handlers (Sandbox Logic)
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
            // Pass null/empty handlers if we don't want editable yet, or implementing dummy ones.
            // Let's pass undefined for now to disable editing in the view if logic isn't ready.
            // The View checks `!!handleUpdateExpense` to enable editing.
            handleUpdateExpense={async () => { /* Sandbox mode - no op */ }}
            handleDeleteExpense={async () => { /* Sandbox mode - no op */ }}
        />
    );
}
