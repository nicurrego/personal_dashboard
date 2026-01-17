'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { QuickEntryFlow } from '@/components/quick-entry';
import { QuickEntryData, AutocompleteData, QuickEntryOption, Expense } from '@/lib/types';
import { parseCSV, getUniqueValues } from '@/lib/csvParser';

export default function QuickEntryPage() {
  const router = useRouter();
  const [autocompleteData, setAutocompleteData] = useState<AutocompleteData | null>(null);
  const [targetCategories, setTargetCategories] = useState<Map<string, string[]>>(new Map());
  const [targets, setTargets] = useState<string[]>([]);
  const [contexts, setContexts] = useState<string[]>([]);
  const [items, setItems] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load existing data for autocomplete
  useEffect(() => {
    async function loadAutocompleteData() {
      try {
        const response = await fetch('/expenses_combined_english.csv');
        if (!response.ok) throw new Error('Failed to load expense data');
        
        const csvText = await response.text();
        const expenses = parseCSV(csvText);
        
        // Build target -> categories mapping from actual data
        const targetCategoryMap = new Map<string, Set<string>>();
        expenses.forEach(expense => {
          const target = expense.target;
          const category = expense.category;
          if (!targetCategoryMap.has(target)) {
            targetCategoryMap.set(target, new Set());
          }
          targetCategoryMap.get(target)!.add(category);
        });
        
        // Convert Sets to Arrays
        const targetCategoryArrayMap = new Map<string, string[]>();
        targetCategoryMap.forEach((categories, target) => {
          targetCategoryArrayMap.set(target, Array.from(categories));
        });
        setTargetCategories(targetCategoryArrayMap);
        
        // Get unique targets
        const uniqueTargets = getUniqueValues(expenses, 'target');
        setTargets(uniqueTargets);
        
        // Get unique contexts for suggestions
        const uniqueContexts = getUniqueValues(expenses, 'context');
        setContexts(uniqueContexts);
        
        // Get unique items for suggestions (filter out generic ones)
        const uniqueItems = getUniqueValues(expenses, 'item')
          .filter(item => !item.toLowerCase().startsWith('expense item'))
          .slice(0, 20); // Limit to 20 most common
        setItems(uniqueItems);
        
        // Build autocomplete options with frequency counts
        const buildOptions = (
          items: string[], 
          expenses: Expense[], 
          field: keyof Expense
        ): QuickEntryOption[] => {
          const counts = new Map<string, number>();
          expenses.forEach(e => {
            const value = String(e[field]);
            counts.set(value, (counts.get(value) || 0) + 1);
          });
          
          return items.map(item => ({
            id: item,
            label: item,
            recentCount: counts.get(item) || 0
          })).sort((a, b) => (b.recentCount || 0) - (a.recentCount || 0));
        };

        const categories = getUniqueValues(expenses, 'category');
        const methods = getUniqueValues(expenses, 'method');
        const shops = getUniqueValues(expenses, 'shop');
        const locations = getUniqueValues(expenses, 'location');

        setAutocompleteData({
          categories: buildOptions(categories, expenses, 'category'),
          shops: buildOptions(shops, expenses, 'shop'),
          methods: buildOptions(methods, expenses, 'method'),
          locations: buildOptions(locations, expenses, 'location'),
        });
        
        setLoading(false);
      } catch (err) {
        console.error('Error loading autocomplete data:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
        setLoading(false);
      }
    }
    
    loadAutocompleteData();
  }, []);

  // Handle save
  const handleSave = async (data: QuickEntryData) => {
    // Format data for CSV
    const csvRow = {
      Year: data.date.getFullYear(),
      Month: data.date.getMonth() + 1,
      Date: data.date.toISOString().split('T')[0],
      Target: data.target,
      Category: data.category,
      Value: data.value,
      Item: data.item || `Quick entry ${new Date().toLocaleDateString()}`,
      Context: data.context || 'Daily',
      Method: data.method,
      Shop: data.shop,
      Location: data.location,
    };

    console.log('Saving transaction:', csvRow);
    
    // Store in localStorage (Phase 2 will add proper API endpoint)
    const pendingTransactions = JSON.parse(
      localStorage.getItem('pending_transactions') || '[]'
    );
    pendingTransactions.push({
      ...csvRow,
      _id: Date.now(),
      _createdAt: new Date().toISOString()
    });
    localStorage.setItem('pending_transactions', JSON.stringify(pendingTransactions));
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
  };

  // Handle cancel
  const handleCancel = () => {
    router.push('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-cyber-cyan/30 border-t-cyber-cyan rounded-full animate-spin" />
          <p className="text-secondary-text">Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-6">
        <div className="liquid-card p-6 text-center max-w-sm">
          <p className="text-laser-magenta text-lg mb-4 font-bold">Error</p>
          <p className="text-secondary-text mb-6">{error}</p>
          <button
            onClick={handleCancel}
            className="px-6 py-3 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!autocompleteData) {
    return null;
  }

  return (
    <QuickEntryFlow
      autocompleteData={autocompleteData}
      targetCategories={targetCategories}
      targets={targets}
      contexts={contexts}
      items={items}
      onSave={handleSave}
      onCancel={handleCancel}
    />
  );
}
