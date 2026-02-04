'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Plus } from 'lucide-react';
import { MOCK_BUDGET } from '@/lib/tour/mockData';
import { DEFAULT_CATEGORIES } from '@/lib/constants/defaultCategories';
import { CATEGORY_COLORS } from '@/lib/category-colors';
import { BudgetDonutD3 } from '@/components/budget/builder/components/charts/BudgetDonutD3';

type TabType = 'Income' | 'Future' | 'Living' | 'Present' | 'Review';

interface BudgetEntry {
    category: string;
    amount: number;
    target: string;
}

const INCOME_CATEGORIES = [
    '💸 Main Income / Salary',
    '💻 Freelance / Side Gig',
    '🎁 Extra / Bonus'
];

const TAB_CONFIG: { id: TabType; label: string; color: string }[] = [
    { id: 'Income', label: 'Income', color: 'var(--color-living)' },
    { id: 'Future', label: 'Future', color: 'var(--color-future)' },
    { id: 'Living', label: 'Living', color: 'var(--color-living)' },
    { id: 'Present', label: 'Present', color: 'var(--color-present)' },
    { id: 'Review', label: 'Review', color: 'var(--color-living)' },
];

export default function TourBudgetBuilderPage() {
    const [activeTab, setActiveTab] = useState<TabType>('Income');
    const [budgetEntries, setBudgetEntries] = useState<BudgetEntry[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadBudget() {
            try {
                // Filter MOCK_BUDGET for current month only to avoid duplication
                const now = new Date();
                const currentYear = now.getFullYear();
                const currentMonth = now.getMonth() + 1;

                const currentMonthData = MOCK_BUDGET.filter(b => b.year === currentYear && b.month === currentMonth);

                if (currentMonthData.length > 0) {
                    setBudgetEntries(currentMonthData.map((b: any) => ({
                        category: b.category,
                        amount: Number(b.amount),
                        target: b.target
                    })));
                } else {
                    const entries: BudgetEntry[] = [
                        ...INCOME_CATEGORIES.map(c => ({ category: c, amount: 0, target: 'Income' })),
                        ...DEFAULT_CATEGORIES.Future.map(c => ({ category: c, amount: 0, target: 'Future' })),
                        ...DEFAULT_CATEGORIES.Living.map(c => ({ category: c, amount: 0, target: 'Living' })),
                        ...DEFAULT_CATEGORIES.Present.map(c => ({ category: c, amount: 0, target: 'Present' })),
                    ];
                    setBudgetEntries(entries);
                }
                setLoading(false);
            } catch (error) {
                console.error('Error loading budget:', error);
                setLoading(false);
            }
        }
        loadBudget();
    }, []);

    const totals = useMemo(() => {
        const income = budgetEntries.filter(e => e.target === 'Income').reduce((sum, e) => sum + e.amount, 0);
        const future = budgetEntries.filter(e => e.target === 'Future').reduce((sum, e) => sum + e.amount, 0);
        const living = budgetEntries.filter(e => e.target === 'Living').reduce((sum, e) => sum + e.amount, 0);
        const present = budgetEntries.filter(e => e.target === 'Present').reduce((sum, e) => sum + e.amount, 0);
        return { income, future, living, present };
    }, [budgetEntries]);

    const netCashFlow = totals.income - (totals.future + totals.living + totals.present);
    const totalAllocations = totals.future + totals.living + totals.present;

    const futurePercent = totalAllocations > 0 ? Math.round((totals.future / totalAllocations) * 100) : 0;
    const livingPercent = totalAllocations > 0 ? Math.round((totals.living / totalAllocations) * 100) : 0;
    const presentPercent = totalAllocations > 0 ? Math.round((totals.present / totalAllocations) * 100) : 0;

    const formatCurrency = (val: number) => `¥${Math.round(val).toLocaleString()}`;

    const getEntriesForTab = (tab: TabType) => {
        if (tab === 'Review') return [];
        return budgetEntries.filter(e => e.target === tab);
    };

    const getTargetColor = (target: string) => {
        switch (target) {
            case 'Income': return 'var(--color-total)';
            case 'Future': return 'var(--color-future)';
            case 'Living': return 'var(--color-living)';
            case 'Present': return 'var(--color-present)';
            default: return 'var(--color-total)';
        }
    };



    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background text-foreground p-4 pb-32">
            <div className="max-w-lg mx-auto space-y-6">

                {/* Page Header */}
                <div className="pt-2">
                    <h1 className="text-2xl font-bold text-foreground">Budget Builder (Tour)</h1>
                    <p className="text-sm text-muted-foreground">Sandbox Mode - Try creating a plan</p>
                </div>

                {/* Net Cash Flow Summary */}
                <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
                    <div className="flex items-center gap-4">
                        {/* Column 1 - Income & Net */}
                        <div className="flex-1 space-y-3">
                            <div>
                                <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Income</span>
                                <div className="text-lg font-mono font-bold text-foreground">{formatCurrency(totals.income)}</div>
                            </div>
                            <div>
                                <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Net Cash Flow</span>
                                <div className={`text-lg font-mono font-bold ${netCashFlow >= 0 ? 'text-foreground' : 'text-destructive'}`}>
                                    {formatCurrency(netCashFlow)}
                                </div>
                            </div>
                        </div>

                        {/* Column 2 - Allocations */}
                        <div className="flex flex-col items-end">
                            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Allocated</span>
                            <div className="text-lg font-mono font-bold text-foreground">
                                {totals.income > 0 ? Math.round((totalAllocations / totals.income) * 100) : 0}%
                            </div>
                            <div className="flex gap-3 mt-1">
                                <span className="text-xs font-mono font-medium" style={{ color: CATEGORY_COLORS.FUTURE }}>{futurePercent}%</span>
                                <span className="text-xs font-mono font-medium" style={{ color: CATEGORY_COLORS.LIVING }}>{livingPercent}%</span>
                                <span className="text-xs font-mono font-medium" style={{ color: CATEGORY_COLORS.PRESENT }}>{presentPercent}%</span>
                            </div>
                        </div>

                        {/* Column 3 - Chart */}
                        <div className="w-24 h-24">
                            <BudgetDonutD3
                                totals={{ income: totals.income, future: totals.future, living: totals.living, present: totals.present }}
                                size="small"
                                monthlyNetCashFlow={netCashFlow}
                            />
                        </div>
                    </div>
                </div>

                {/* Tab Navigation */}
                <div className="flex items-center bg-muted/30 rounded-xl p-1">
                    {TAB_CONFIG.map((tab, index) => (
                        <React.Fragment key={tab.id}>
                            {index > 0 && (
                                <span className="w-px h-4 bg-border/50" />
                            )}
                            <button
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex-1 py-2 text-xs font-medium transition-colors rounded-lg ${activeTab === tab.id ? 'bg-card' : 'text-muted-foreground'
                                    }`}
                                style={activeTab === tab.id ? { color: tab.color } : undefined}
                            >
                                {tab.label}
                            </button>
                        </React.Fragment>
                    ))}
                </div>

                {/* Tab Content */}
                <div className="space-y-2">
                    {activeTab !== 'Review' ? (
                        <>
                            <div className="text-sm text-muted-foreground mb-3">
                                Set your monthly {activeTab.toLowerCase()} budget
                            </div>

                            {getEntriesForTab(activeTab).map(entry => (
                                <div key={entry.category} className="bg-card border border-border rounded-xl p-3 flex items-center gap-3 opacity-80">
                                    <span className="flex-1 text-sm font-medium text-foreground truncate">
                                        {entry.category}
                                    </span>

                                    {/* Amount input (Disabled for tour) */}
                                    <div className="flex items-center gap-1">
                                        <span className="text-muted-foreground text-xs">¥</span>
                                        <input
                                            type="number"
                                            value={entry.amount || ''}
                                            disabled
                                            className="w-20 bg-muted border border-border/50 rounded-lg px-2 py-1.5 text-right font-mono text-sm text-foreground focus:outline-none cursor-not-allowed opacity-70"
                                        />
                                    </div>
                                </div>
                            ))}

                            {/* Tab Total */}
                            <div className="bg-muted/50 border border-border rounded-xl p-3 flex items-center justify-between mt-4">
                                <span className="font-semibold text-foreground text-sm">Total {activeTab}</span>
                                <span className="font-mono font-bold" style={{ color: TAB_CONFIG.find(t => t.id === activeTab)?.color }}>
                                    {formatCurrency(
                                        activeTab === 'Income' ? totals.income :
                                            activeTab === 'Future' ? totals.future :
                                                activeTab === 'Living' ? totals.living : totals.present
                                    )}
                                </span>
                            </div>

                            {/* Add Category - Visible but disabled */}
                            <button
                                disabled
                                className="w-full py-2 text-muted-foreground/50 transition-colors flex items-center justify-center gap-1.5 text-xs border border-dashed border-border/50 rounded-xl mt-4 cursor-not-allowed"
                            >
                                <Plus className="w-3.5 h-3.5" />
                                Add category
                            </button>

                            <div className="mt-8 p-4 bg-muted/20 border border-border/50 rounded-xl text-center">
                                <p className="text-xs text-muted-foreground">
                                    <span className="block mb-1 font-semibold text-primary/80">View Only Mode</span>
                                    The budget builder is locked during the tour.
                                </p>
                            </div>
                        </>
                    ) : (
                        // Review Panel
                        <>
                            <div className="text-sm text-muted-foreground mb-3">Review your budget allocations</div>

                            <div className="bg-card border border-border rounded-xl p-4">
                                <p className="text-xs text-muted-foreground mb-1">Total Income</p>
                                <p className="text-2xl font-bold text-[var(--color-total)]">{formatCurrency(totals.income)}</p>
                            </div>

                            {/* Allocations */}
                            <div className="bg-card border border-border rounded-xl p-4 space-y-3">
                                <h3 className="font-semibold text-foreground text-sm">Allocations</h3>
                                {[
                                    { label: 'Future', value: totals.future, percent: futurePercent, color: 'var(--color-future)' },
                                    { label: 'Living', value: totals.living, percent: livingPercent, color: 'var(--color-living)' },
                                    { label: 'Present', value: totals.present, percent: presentPercent, color: 'var(--color-present)' },
                                ].map(item => (
                                    <div key={item.label} className="space-y-1">
                                        <div className="flex justify-between text-xs">
                                            <span className="text-foreground">{item.label}</span>
                                            <span className="font-mono text-foreground">{formatCurrency(item.value)}</span>
                                        </div>
                                        <div className="h-1.5 w-full rounded-full overflow-hidden" style={{ backgroundColor: `${item.color}33` }}>
                                            <div className="h-full" style={{ width: `${item.percent}%`, backgroundColor: item.color }} />
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* All Categories */}
                            <div className="bg-card border border-border rounded-xl p-4 space-y-3">
                                <h3 className="font-semibold text-foreground text-sm">All Categories</h3>
                                {(['Future', 'Living', 'Present'] as const).map(target => {
                                    const entries = budgetEntries.filter(e => e.target === target && e.amount > 0);
                                    if (entries.length === 0) return null;
                                    return (
                                        <div key={target} className="space-y-1">
                                            <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: getTargetColor(target) }}>{target}</div>
                                            {entries.map(entry => (
                                                <div key={entry.category} className="flex justify-between text-xs pl-2 border-l-2" style={{ borderColor: getTargetColor(target) }}>
                                                    <span className="text-muted-foreground truncate">{entry.category}</span>
                                                    <span className="font-mono text-foreground">{formatCurrency(entry.amount)}</span>
                                                </div>
                                            ))}
                                        </div>
                                    );
                                })}
                            </div>

                            <button
                                disabled
                                className="w-full py-3 rounded-xl font-semibold text-[#1B4034] bg-[#A9D9C7] hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                            >
                                Save Budget
                            </button>

                            <p className="text-xs text-muted-foreground text-center">
                                Sandbox Mode: Changes are temporary.
                            </p>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
