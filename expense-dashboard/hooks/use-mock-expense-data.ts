'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import type { Expense, FilterState, Budget, UniqueFilterValues, TimeRangePreset } from '@/types';
import { INITIAL_FILTER_STATE } from '@/types';
import { getUniqueValues } from '@/lib/analytics';
import { filterExpenses } from '@/lib/analytics';
import { MOCK_EXPENSES, MOCK_BUDGET } from '@/lib/tour/mockData';

const initialUniqueValues: UniqueFilterValues = {
    years: [],
    targets: [],
    categories: [],
    locations: [],
    methods: [],
    shops: []
};

/**
 * Mock version of useExpenseData for the Tour.
 * Works exactly like the real hook but uses static MOCK data.
 */
export function useMockExpenseData() {
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [budget, setBudget] = useState<Budget[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filters, setFilters] = useState<FilterState>(INITIAL_FILTER_STATE);
    const [uniqueValues, setUniqueValues] = useState<UniqueFilterValues>(initialUniqueValues);
    const [timeRangePreset, setTimeRangePreset] = useState<TimeRangePreset>('month'); // Default to this month

    // Reference year/month (will be set to latest in data if current has no data)
    const [referenceYear, setReferenceYear] = useState<number>(new Date().getFullYear());
    const [referenceMonth, setReferenceMonth] = useState<number>(new Date().getMonth() + 1);

    // Load Data (Mock)
    useEffect(() => {
        // Simulate async load
        setTimeout(() => {
            // Init Mock Data
            setExpenses(MOCK_EXPENSES);

            // Transform Mock Budget similar to real hook if needed, but mockData is likely already Budget[].
            const parsedBudget: Budget[] = MOCK_BUDGET.map((b: any) => ({
                year: Number(b.year),
                month: Number(b.month),
                target: b.target,
                category: b.category,
                amount: Number(b.amount)
            }));
            setBudget(parsedBudget);

            // Extract unique values
            const years = Array.from(new Set(MOCK_EXPENSES.map(e => e.year))).sort();
            setUniqueValues({
                years,
                targets: getUniqueValues(MOCK_EXPENSES, 'target'),
                categories: getUniqueValues(MOCK_EXPENSES, 'category'),
                locations: getUniqueValues(MOCK_EXPENSES, 'location'),
                methods: getUniqueValues(MOCK_EXPENSES, 'method'),
                shops: getUniqueValues(MOCK_EXPENSES, 'shop')
            });

            // Set Reference to "Current" (Mock data is generated relative to current date anyway)
            const now = new Date();
            setReferenceYear(now.getFullYear());
            setReferenceMonth(now.getMonth() + 1);

            setLoading(false);
        }, 500);
    }, []);

    // Apply time range preset filter first, then additional filters
    const filteredExpenses = useMemo(() => {
        if (expenses.length === 0) return [];

        let timeFiltered = expenses;

        if (timeRangePreset === 'month') {
            timeFiltered = expenses.filter(e => e.year === referenceYear && e.month === referenceMonth);
        } else if (timeRangePreset === 'year') {
            timeFiltered = expenses.filter(e => e.year === referenceYear);
        }

        return filterExpenses(timeFiltered, filters);
    }, [expenses, timeRangePreset, filters, referenceYear, referenceMonth]);

    // Cascading filter logic (same as real hook)
    useEffect(() => {
        if (expenses.length === 0) return;

        let baseData = expenses;
        if (timeRangePreset === 'month') {
            baseData = expenses.filter(e => e.year === referenceYear && e.month === referenceMonth);
        } else if (timeRangePreset === 'year') {
            baseData = expenses.filter(e => e.year === referenceYear);
        }

        const dateFiltered = baseData.filter(expense => {
            if (filters.dateRange.start || filters.dateRange.end) {
                const expenseDate = new Date(expense.date);
                if (filters.dateRange.start && expenseDate < filters.dateRange.start) return false;
                if (filters.dateRange.end && expenseDate > filters.dateRange.end) return false;
            }
            if (filters.months && filters.months.length > 0) {
                const expenseMonth = new Date(expense.date).getMonth() + 1;
                if (!filters.months.includes(expenseMonth)) return false;
            }
            return true;
        });

        setUniqueValues(prev => ({
            ...prev,
            categories: getUniqueValues(dateFiltered, 'category'),
            locations: getUniqueValues(dateFiltered, 'location'),
            targets: getUniqueValues(dateFiltered, 'target'),
            methods: getUniqueValues(dateFiltered, 'method'),
            shops: getUniqueValues(dateFiltered, 'shop')
        }));
    }, [filters.dateRange, filters.months, expenses, timeRangePreset, referenceYear, referenceMonth]);

    const saveDefaultView = useCallback(() => {
        // No-op for tour mode
    }, []);

    const resetFilters = useCallback(() => {
        setFilters(INITIAL_FILTER_STATE);
        setTimeRangePreset('month');
    }, []);

    const activeFilterCount =
        (filters.dateRange.start ? 1 : 0) +
        (filters.months?.length || 0) +
        filters.categories.length +
        filters.locations.length +
        filters.shops.length +
        filters.targets.length;

    return {
        expenses,
        filteredExpenses,
        loading,
        error,
        filters,
        setFilters,
        resetFilters,
        saveDefaultView,
        uniqueValues,
        activeFilterCount,
        timeRangePreset,
        setTimeRangePreset,
        currentYear: referenceYear,
        currentMonth: referenceMonth,
        budget
    };
}
