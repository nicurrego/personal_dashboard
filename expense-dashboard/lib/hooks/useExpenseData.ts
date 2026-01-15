'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Expense, FilterState } from '@/lib/types';
import { parseCSV, getUniqueValues } from '@/lib/csvParser';
import { filterExpenses } from '@/lib/dataTransforms';

export interface UniqueFilterValues {
  years: number[];
  targets: string[];
  categories: string[];
  locations: string[];
  methods: string[];
  shops: string[];
}

export type TimeRangePreset = 'month' | 'year' | 'all';

const initialFilters: FilterState = {
  dateRange: { start: null, end: null },
  months: [],
  targets: [],
  categories: [],
  locations: [],
  methods: [],
  shops: []
};

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterState>(initialFilters);
  const [uniqueValues, setUniqueValues] = useState<UniqueFilterValues>(initialUniqueValues);
  const [timeRangePreset, setTimeRangePreset] = useState<TimeRangePreset>('month'); // Default to this month
  
  // Reference year/month (will be set to latest in data if current has no data)
  const [referenceYear, setReferenceYear] = useState<number>(new Date().getFullYear());
  const [referenceMonth, setReferenceMonth] = useState<number>(new Date().getMonth() + 1);

  // Load Data
  useEffect(() => {
    async function loadData() {
      try {
        const response = await fetch('/expenses_combined_english.csv');
        if (!response.ok) throw new Error('Failed to load expense data');
        
        const csvText = await response.text();
        const parsedData = parseCSV(csvText);
        
        setExpenses(parsedData);
        
        // Extract unique values for filters
        const years = Array.from(new Set(parsedData.map(e => e.year))).sort();
        setUniqueValues({
          years,
          targets: getUniqueValues(parsedData, 'target'),
          categories: getUniqueValues(parsedData, 'category'),
          locations: getUniqueValues(parsedData, 'location'),
          methods: getUniqueValues(parsedData, 'method'),
          shops: getUniqueValues(parsedData, 'shop')
        });
        
        // Determine reference year/month
        // If current year has no data, use the latest year in the dataset
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth() + 1;
        
        const hasCurrentYearData = parsedData.some(e => e.year === currentYear);
        const hasCurrentMonthData = parsedData.some(e => e.year === currentYear && e.month === currentMonth);
        
        if (hasCurrentMonthData) {
          setReferenceYear(currentYear);
          setReferenceMonth(currentMonth);
        } else if (hasCurrentYearData) {
          // Use current year but find the latest month with data
          const monthsInCurrentYear = parsedData
            .filter(e => e.year === currentYear)
            .map(e => e.month);
          const latestMonth = Math.max(...monthsInCurrentYear);
          setReferenceYear(currentYear);
          setReferenceMonth(latestMonth);
        } else {
          // Use the latest year and month in the dataset
          const latestYear = Math.max(...years);
          const monthsInLatestYear = parsedData
            .filter(e => e.year === latestYear)
            .map(e => e.month);
          const latestMonth = Math.max(...monthsInLatestYear);
          setReferenceYear(latestYear);
          setReferenceMonth(latestMonth);
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

  // Reset all filters
  const resetFilters = useCallback(() => {
    setFilters(initialFilters);
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
    uniqueValues,
    activeFilterCount,
    
    // Time Range Preset
    timeRangePreset,
    setTimeRangePreset,
    currentYear: referenceYear,
    currentMonth: referenceMonth
  };
}
