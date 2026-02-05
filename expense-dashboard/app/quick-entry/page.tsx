'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { QuickEntryFlow } from '@/components/quick-entry';
import { QuickEntryData, AutocompleteData, QuickEntryOption, Expense } from '@/types';
import { getUniqueValues } from '@/lib/analytics';
import { DEFAULT_CATEGORIES, DEFAULT_CONTEXTS, DEFAULT_METHODS, TargetType } from '@/lib/constants/defaultCategories';

export default function QuickEntryPage() {
  const router = useRouter();
  const [autocompleteData, setAutocompleteData] = useState<AutocompleteData>({
    categories: [], shops: [], methods: [], locations: []
  });
  const [targetCategories, setTargetCategories] = useState<Map<string, string[]>>(new Map());
  const [targets, setTargets] = useState<string[]>([]);
  const [contexts, setContexts] = useState<string[]>([]);
  const [items, setItems] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function initialize() {
      try {
        // 1. Initialize Structure from Defaults
        const targetMap = new Map<string, string[]>();
        const allDefaultCategories: string[] = [];

        Object.entries(DEFAULT_CATEGORIES).forEach(([target, categories]) => {
          targetMap.set(target, [...categories]);
          allDefaultCategories.push(...categories);
        });
        setTargetCategories(targetMap);
        setTargets(Object.keys(DEFAULT_CATEGORIES));

        // 2. Fetch existing data for autocomplete suggestions
        const response = await fetch('/api/expenses');
        let expenses: Expense[] = [];

        if (response.ok) {
          const rawData = await response.json();
          expenses = rawData.map((e: any) => ({
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
        }

        // 3. Build Options
        // Helper to count frequencies
        const buildOptions = (items: string[], field: keyof Expense, defaults: string[] = []): QuickEntryOption[] => {
          const counts = new Map<string, number>();
          expenses.forEach(e => {
            const value = String(e[field]);
            counts.set(value, (counts.get(value) || 0) + 1);
          });

          // Merge defaults and existing items unique
          const allItems = Array.from(new Set([...defaults, ...items]));

          return allItems.map(item => ({
            id: item,
            label: item,
            recentCount: counts.get(item) || 0
          })).sort((a, b) => (b.recentCount || 0) - (a.recentCount || 0));
        };

        setContexts([...DEFAULT_CONTEXTS]);
        setItems(getUniqueValues(expenses, 'item').slice(0, 20));

        setAutocompleteData({
          categories: buildOptions(getUniqueValues(expenses, 'category'), 'category', allDefaultCategories),
          shops: buildOptions(getUniqueValues(expenses, 'shop'), 'shop'),
          methods: buildOptions(getUniqueValues(expenses, 'method'), 'method', [...DEFAULT_METHODS]),
          locations: buildOptions(getUniqueValues(expenses, 'location'), 'location'),
        });

        setLoading(false);
      } catch (err) {
        console.error('Error initializing quick entry:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
        setLoading(false);
      }
    }

    initialize();
  }, []);

  // Handle save
  const handleSave = async (data: QuickEntryData) => {
    try {
      const payload = {
        year: data.date.getFullYear(),
        month: data.date.getMonth() + 1,
        date: data.date.toISOString().split('T')[0],
        target: data.target,
        category: data.category,
        value: data.value,
        item: data.item || 'Expense',
        context: data.context || 'Daily',
        method: data.method,
        shop: data.shop,
        location: data.location,
        feeling: data.feeling,
      };

      const response = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error('Failed to save expense');
      }

      // Optionally update cache? router.refresh() handles it usually.
    } catch (err) {
      console.error('Save failed:', err);
      throw err; // Propagate to component to show error
    }
  };

  // Handle cancel
  const handleCancel = () => {
    router.push('/dashboard');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#1B4034] flex items-center justify-center page-ambient">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-cyber-cyan/30 border-t-cyber-cyan rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#1B4034] flex items-center justify-center p-6 page-ambient">
        <div className="liquid-card-premium p-6 text-center max-w-sm relative z-10 hover-lift">
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
