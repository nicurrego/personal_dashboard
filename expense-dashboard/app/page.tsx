'use client';

import { useState, useEffect } from 'react';
import { 
  Expense, 
  FilterState, 
} from '@/lib/types';
import { 
  parseCSV, 
  getUniqueValues 
} from '@/lib/csvParser';
import { 
  filterExpenses, 
  aggregateByMonth, 
  calculateKPIs,
  getTargetDistribution,
  getTopCategories,
} from '@/lib/dataTransforms';

// Components
import KPICards from '@/components/KPICards';
import FilterPanel from '@/components/filters/FilterPanel';
import MonthlyTrendD3 from '@/components/charts/MonthlyTrendD3';
import TargetDonutD3 from '@/components/charts/TargetDonutD3';
import CategoryBarD3 from '@/components/charts/CategoryBarD3';
import TransactionTable from '@/components/TransactionTable';

export default function Dashboard() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [filteredExpenses, setFilteredExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [filters, setFilters] = useState<FilterState>({
    dateRange: { start: null, end: null },
    targets: [],
    categories: [],
    locations: [],
    methods: []
  });

  const [uniqueValues, setUniqueValues] = useState({
    years: [] as number[],
    targets: [] as string[],
    categories: [] as string[],
    locations: [] as string[],
    methods: [] as string[]
  });

  // Load Data
  useEffect(() => {
    async function loadData() {
      try {
        const response = await fetch('/expenses_combined_english.csv');
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
          methods: getUniqueValues(parsedData, 'method')
        });
        
        setLoading(false);
      } catch (error) {
        console.error('Error loading data:', error);
        setLoading(false);
      }
    }
    
    loadData();
  }, []);

  // Filter Data
  useEffect(() => {
    if (expenses.length > 0) {
      const filtered = filterExpenses(expenses, filters);
      setFilteredExpenses(filtered);
    }
  }, [filters, expenses]);

  // Derived Data
  const monthlyData = aggregateByMonth(filteredExpenses);
  const kpiMetrics = calculateKPIs(filteredExpenses);
  const targetDistribution = getTargetDistribution(filteredExpenses);
  const categoryTotals = getTopCategories(filteredExpenses, 10);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black font-sans text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white tracking-tight">Expense Dashboard</h1>
          <p className="mt-2 text-sm text-gray-400">
            Analysis of {filteredExpenses.length} transactions
          </p>
        </div>
        
        {/* Filters */}
        <FilterPanel 
          filters={filters} 
          onChange={setFilters} 
          uniqueValues={uniqueValues} 
        />
        
        {/* KPI Cards */}
        <KPICards metrics={kpiMetrics} />
        
        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          <div className="lg:col-span-2">
            <MonthlyTrendD3 data={monthlyData} />
          </div>
          <div>
            <TargetDonutD3 data={targetDistribution} />
          </div>
        </div>
        
        {/* Charts Row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          <div>
            <CategoryBarD3 data={categoryTotals} />
          </div>
          <div className="lg:col-span-2 bg-neutral-900/50 rounded-lg border border-neutral-800 p-6 flex flex-col justify-center items-center text-gray-500 border-2 border-dashed border-neutral-800">
            <p>Future D3 Chart: Spending Heatmap or Payee Analysis</p>
            <p className="text-sm mt-2">Coming soon in Phase 2</p>
          </div>
        </div>
        
        {/* Detailed Table */}
        <TransactionTable expenses={filteredExpenses} />
        
        <div className="mt-8 text-center text-xs text-gray-600 pb-8">
          Generated with Next.js & D3.js • {new Date().getFullYear()}
        </div>
      </div>
    </div>
  );
}
