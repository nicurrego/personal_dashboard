'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import type { Expense, FilterState, Budget, UniqueFilterValues, TimeRangePreset } from '@/types';
import { INITIAL_FILTER_STATE } from '@/types';
import { getUniqueValues } from '@/lib/analytics';
import { filterExpenses } from '@/lib/analytics';

const initialUniqueValues: UniqueFilterValues = {
  years: [],
  targets: [],
  categories: [],
  locations: [],
  methods: [],
  shops: []
};

/**
 * Custom hook for loading, filtering, and managing expense data.
 * Encapsulates all data fetching and filter logic.
 */
export function useExpenseData() {
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


  // Load Data
  useEffect(() => {
    async function loadData() {
      try {
        // Fetch expenses and budgets from API
        // Add cache: 'no-store' to ensure we get fresh data
        const [expensesResponse, budgetResponse] = await Promise.all([
          fetch('/api/expenses', { cache: 'no-store' }),
          fetch('/api/budgets', { cache: 'no-store' })
        ]);

        if (!expensesResponse.ok) {
          throw new Error('Failed to load expense data');
        }

        const rawExpenses = await expensesResponse.json();
        const parsedExpenses: Expense[] = rawExpenses.map((e: any) => ({
          year: Number(e.year),
          month: Number(e.month),
          date: e.date,
          target: e.target,
          category: e.category,
          value: Number(e.value),
          item: e.item || '',
          context: e.context || '',
          method: e.method || '',
          shop: e.shop || '',
          location: e.location || ''
        }));

        setExpenses(parsedExpenses);

        // Load budgets if available
        if (budgetResponse.ok) {
          const rawBudgets = await budgetResponse.json();
          const parsedBudget: Budget[] = rawBudgets.map((b: any) => ({
            year: Number(b.year),
            month: Number(b.month),
            target: b.target,
            category: b.category,
            amount: Number(b.amount)
          }));
          setBudget(parsedBudget);
        }

        // Extract unique values for filters
        const years = Array.from(new Set(parsedExpenses.map(e => e.year))).sort();
        setUniqueValues({
          years,
          targets: getUniqueValues(parsedExpenses, 'target'),
          categories: getUniqueValues(parsedExpenses, 'category'),
          locations: getUniqueValues(parsedExpenses, 'location'),
          methods: getUniqueValues(parsedExpenses, 'method'),
          shops: getUniqueValues(parsedExpenses, 'shop')
        });

        // Determine reference year/month
        // If current year has no data, use the latest year in the dataset
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth() + 1;

        const hasCurrentYearData = parsedExpenses.some(e => e.year === currentYear);
        const hasCurrentMonthData = parsedExpenses.some(e => e.year === currentYear && e.month === currentMonth);

        if (hasCurrentMonthData) {
          setReferenceYear(currentYear);
          setReferenceMonth(currentMonth);
        } else if (hasCurrentYearData) {
          // Use current year but find the latest month with data
          const monthsInCurrentYear = parsedExpenses
            .filter(e => e.year === currentYear)
            .map(e => e.month);
          const latestMonth = Math.max(...monthsInCurrentYear);
          setReferenceYear(currentYear);
          setReferenceMonth(latestMonth);
        } else if (parsedExpenses.length > 0) {
          // Use the latest year and month in the dataset
          const latestYear = Math.max(...years);
          const monthsInLatestYear = parsedExpenses
            .filter(e => e.year === latestYear)
            .map(e => e.month);
          const latestMonth = Math.max(...monthsInLatestYear);
          setReferenceYear(latestYear);
          setReferenceMonth(latestMonth);
        } else {
          // No data at all
          setReferenceYear(currentYear);
          setReferenceMonth(currentMonth);
        }

        setLoading(false);
      } catch (err) {
        console.error('Error loading data:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
        setLoading(false);
      }
    }

    loadData();
  }, []);

  // Apply time range preset filter first, then additional filters
  const filteredExpenses = useMemo(() => {
    if (expenses.length === 0) return [];

    // First apply time range preset
    let timeFiltered = expenses;

    if (timeRangePreset === 'month') {
      timeFiltered = expenses.filter(e => e.year === referenceYear && e.month === referenceMonth);
    } else if (timeRangePreset === 'year') {
      timeFiltered = expenses.filter(e => e.year === referenceYear);
    }
    // 'all' shows everything

    // Then apply additional filters
    return filterExpenses(timeFiltered, filters);
  }, [expenses, timeRangePreset, filters, referenceYear, referenceMonth]);

  // Cascading filter: Update available options based on time range and date selection
  useEffect(() => {
    if (expenses.length === 0) return;

    // Apply time range first
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

  // Save current state as default
  const saveDefaultView = useCallback(() => {
    const viewSettings = {
      filters,
      timeRangePreset
    };
    localStorage.setItem('expense_dashboard_default_view', JSON.stringify(viewSettings));
    // Optional: Visual feedback could be handled by the UI component
  }, [filters, timeRangePreset]);

  // Load default on mount
  useEffect(() => {
    const saved = localStorage.getItem('expense_dashboard_default_view');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Rehydrate dates
        if (parsed.filters?.dateRange?.start) parsed.filters.dateRange.start = new Date(parsed.filters.dateRange.start);
        if (parsed.filters?.dateRange?.end) parsed.filters.dateRange.end = new Date(parsed.filters.dateRange.end);

        if (parsed.filters) setFilters(parsed.filters);
        if (parsed.timeRangePreset) setTimeRangePreset(parsed.timeRangePreset);
      } catch (e) {
        console.error("Failed to load saved view", e);
      }
    }
  }, []);

  // Reset all filters - now resets to Saved Default if present, otherwise Initial
  const resetFilters = useCallback(() => {
    const saved = localStorage.getItem('expense_dashboard_default_view');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.filters?.dateRange?.start) parsed.filters.dateRange.start = new Date(parsed.filters.dateRange.start);
        if (parsed.filters?.dateRange?.end) parsed.filters.dateRange.end = new Date(parsed.filters.dateRange.end);

        setFilters(parsed.filters || INITIAL_FILTER_STATE);
        setTimeRangePreset(parsed.timeRangePreset || 'month');
      } catch (e) {
        setFilters(INITIAL_FILTER_STATE);
        setTimeRangePreset('month');
      }
    } else {
      setFilters(INITIAL_FILTER_STATE);
      setTimeRangePreset('month');
    }
  }, []);

  // Count active filters
  const activeFilterCount =
    (filters.dateRange.start ? 1 : 0) +
    (filters.months?.length || 0) +
    filters.categories.length +
    filters.locations.length +
    filters.shops.length +
    filters.targets.length;

  return {
    // Data
    expenses,
    filteredExpenses,
    loading,
    error,

    // Filters
    filters,
    setFilters,
    resetFilters,
    saveDefaultView,
    uniqueValues,
    activeFilterCount,

    // Time Range Preset
    timeRangePreset,
    setTimeRangePreset,
    currentYear: referenceYear,
    currentMonth: referenceMonth,
    budget
  };
}
