'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { QuickEntryFlow } from '@/components/quick-entry';
import { QuickEntryData, AutocompleteData, QuickEntryOption, Expense } from '@/types';
import { getUniqueValues } from '@/lib/analytics';
import { DEFAULT_CATEGORIES } from '@/lib/constants/defaultCategories';
import { MOCK_EXPENSES } from '@/lib/tour/mockData';

export default function TourQuickEntryPage() {
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

                // 2. USE MOCK DATA
                let expenses: Expense[] = MOCK_EXPENSES;

                // 3. Build Options
                const buildOptions = (items: string[], field: keyof Expense, defaults: string[] = []): QuickEntryOption[] => {
                    const counts = new Map<string, number>();
                    expenses.forEach(e => {
                        const value = String(e[field]);
                        counts.set(value, (counts.get(value) || 0) + 1);
                    });

                    const allItems = Array.from(new Set([...defaults, ...items]));

                    return allItems.map(item => ({
                        id: item,
                        label: item,
                        recentCount: counts.get(item) || 0
                    })).sort((a, b) => (b.recentCount || 0) - (a.recentCount || 0));
                };

                setContexts(['Daily', 'Travel', 'Work', 'Gift', 'Personal']);
                setItems(getUniqueValues(expenses, 'item').slice(0, 20));

                setAutocompleteData({
                    categories: buildOptions(getUniqueValues(expenses, 'category'), 'category', allDefaultCategories),
                    shops: buildOptions(getUniqueValues(expenses, 'shop'), 'shop'),
                    methods: buildOptions(getUniqueValues(expenses, 'method'), 'method', ['Cash', 'Credit Card', 'Debit Card', 'Bank Transfer', 'Mobile Payment']),
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

    // Mock Save
    const handleSave = async (data: QuickEntryData) => {
        // In a sandbox, we might mimic a save delay
        await new Promise(resolve => setTimeout(resolve, 500));

        // Alert or Toast
        alert("Sandbox: Transaction saved! (It won't persist)");
        router.push('/tour/dashboard');
    };

    const handleCancel = () => {
        router.push('/tour/dashboard');
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
        return <div>Error loading tour: {error}</div>;
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
