'use client';

import { useState, useEffect, useCallback } from 'react';
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
  const [filteredExpenses, setFilteredExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterState>(initialFilters);
  const [uniqueValues, setUniqueValues] = useState<UniqueFilterValues>(initialUniqueValues);

  // Load Data
  useEffect(() => {
    async function loadData() {
      try {
        const response = await fetch('/expenses_combined_english.csv');
        if (!response.ok) throw new Error('Failed to load expense data');
        
        const csvText = await response.text();
        const parsedData = parseCSV(csvText);
        
        setExpenses(parsedData);
        setFilteredExpenses(parsedData);
        
        // Extract unique values for filters
        setUniqueValues({
          years: Array.from(new Set(parsedData.map(e => e.year))).sort(),
          targets: getUniqueValues(parsedData, 'target'),
          categories: getUniqueValues(parsedData, 'category'),
          locations: getUniqueValues(parsedData, 'location'),
          methods: getUniqueValues(parsedData, 'method'),
          shops: getUniqueValues(parsedData, 'shop')
        });
        
        setLoading(false);
      } catch (err) {
        console.error('Error loading data:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
        setLoading(false);
      }
    }
    
    loadData();
  }, []);

  // Filter Data when filters change
  useEffect(() => {
    if (expenses.length > 0) {
      const filtered = filterExpenses(expenses, filters);
      setFilteredExpenses(filtered);
    }
  }, [filters, expenses]);

  // Cascading filter: Update available options based on date selection
  useEffect(() => {
    if (expenses.length === 0) return;

    const dateFiltered = expenses.filter(expense => {
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
  }, [filters.dateRange, filters.months, expenses]);

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
    activeFilterCount
  };
}
