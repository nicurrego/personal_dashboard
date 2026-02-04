'use client';

import React, { useMemo } from 'react';
import { HomeView } from '@/components/screens/HomeView';
import { MOCK_EXPENSES, MOCK_BUDGET } from '@/lib/tour/mockData';
import { ExpenseTarget } from '@/types';

export default function TourHomePage() {
    // Use MOCK DATA
    const expenses = MOCK_EXPENSES;
    const budget = MOCK_BUDGET;

    const { ringData, availableBudget, metrics, refDate } = useMemo(() => {
        // For Tour, we hardcode to the "current" month in mock data
        // Mock data logic in mockData.ts uses 'new Date()' to generate months.
        // So filter for current month/year.
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth() + 1;

        // 1. Filter for Current Month
        const monthlyExpenses = expenses.filter(e =>
            Number(e.year) === currentYear && Number(e.month) === currentMonth
        );
        const monthlyBudgets = budget.filter(b =>
            Number(b.year) === currentYear && Number(b.month) === currentMonth
        );

        // 2. Helpers
        const sumExpenses = (target?: ExpenseTarget) => {
            return monthlyExpenses
                .filter(e => !target || e.target === target)
                .reduce((sum, e) => sum + e.value, 0);
        };

        const sumBudget = (target?: ExpenseTarget) => {
            return monthlyBudgets
                .filter(b => !target || b.target === target)
                .reduce((sum, b) => sum + b.amount, 0);
        };

        // 3. Calculate Totals
        const totalSpent = sumExpenses();
        const totalBudget = sumBudget();

        const futureSpent = sumExpenses('Future');
        const futureBudget = sumBudget('Future');

        const livingSpent = sumExpenses('Living');
        const livingBudget = sumBudget('Living');

        const presentSpent = sumExpenses('Present');
        const presentBudget = sumBudget('Present');

        // 4. Ring Data (Outer to Inner: Total -> Future -> Living -> Present)
        const ringData = [
            {
                label: 'Total',
                spent: totalSpent,
                budget: totalBudget,
                color: '#A9D9C7'
            },
            {
                label: 'Future',
                spent: futureSpent,
                budget: futureBudget,
                color: '#614FBB'
            },
            {
                label: 'Living',
                spent: livingSpent,
                budget: livingBudget,
                color: '#65A1C9'
            },
            {
                label: 'Present',
                spent: presentSpent,
                budget: presentBudget,
                color: '#C24656'
            }
        ];

        // 5. Available
        const availableBudget = Math.max(0, totalBudget - totalSpent);

        // Metrics for Mascot
        const investmentPercentage = totalBudget > 0 ? (futureSpent / totalBudget) * 100 : 0;
        const pendingPercentage = totalBudget > 0 ? (availableBudget / totalBudget) * 100 : 0;

        return {
            ringData,
            availableBudget,
            metrics: { investmentPercentage, pendingPercentage },
            refDate: now
        };
    }, [expenses, budget]);

    return (
        <HomeView
            user={{ name: 'Guest' }}
            ringData={ringData}
            availableBudget={availableBudget}
            metrics={metrics}
            refDate={refDate}
            loading={false}
            mascotTypeOverride="tane"
        />
    );
}
