'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import { ChevronRight, Save, Loader2, Check, Plus, Trash2, Pencil, X } from 'lucide-react';
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

const MONTHS_TO_SAVE = 24;

export default function QuickBudgetPage() {
    const [activeTab, setActiveTab] = useState<TabType>('Income');
    const [budgetEntries, setBudgetEntries] = useState<BudgetEntry[]>([]);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [loading, setLoading] = useState(true);

    // Edit mode state
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [editingCategory, setEditingCategory] = useState<string | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
    const [addingCategory, setAddingCategory] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');

    // Pro Builder mobile setting
    const [showProBuilderLink, setShowProBuilderLink] = useState(false);

    const editInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        async function loadBudget() {
            try {
                const response = await fetch('/api/budgets');
                if (!response.ok) throw new Error('Failed to load budget');

                const data = await response.json();
                const now = new Date();
                const currentYear = now.getFullYear();
                const currentMonth = now.getMonth() + 1;

                const currentMonthData = data.filter(
                    (b: any) => b.year === currentYear && b.month === currentMonth
                );

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

        // Check pro builder mobile setting
        const proBuilderEnabled = localStorage.getItem('pro_builder_mobile') === 'true';
        setShowProBuilderLink(proBuilderEnabled);
    }, []);

    // Focus input when editing starts
    useEffect(() => {
        if (editingCategory && editInputRef.current) {
            editInputRef.current.focus();
            editInputRef.current.select();
        }
    }, [editingCategory]);

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

    const updateEntry = (category: string, amount: number) => {
        setBudgetEntries(prev => prev.map(e => e.category === category ? { ...e, amount } : e));
        setSaved(false);
    };

    const getEntriesForTab = (tab: TabType) => {
        if (tab === 'Review') return [];
        return budgetEntries.filter(e => e.target === tab);
    };

    // Category management
    const handleCategoryTap = (category: string) => {
        if (selectedCategory === category) {
            setSelectedCategory(null);
        } else {
            setSelectedCategory(category);
            setEditingCategory(null);
        }
    };

    const handleStartEdit = (category: string) => {
        setEditingCategory(category);
        setSelectedCategory(null);
    };

    const handleRenameCategory = (oldName: string, newName: string) => {
        if (!newName.trim() || newName === oldName) {
            setEditingCategory(null);
            return;
        }
        setBudgetEntries(prev => prev.map(e => e.category === oldName ? { ...e, category: newName.trim() } : e));
        setEditingCategory(null);
        setSaved(false);
    };

    const handleDeleteCategory = (category: string) => {
        setBudgetEntries(prev => prev.filter(e => e.category !== category));
        setDeleteConfirm(null);
        setSelectedCategory(null);
        setSaved(false);
    };

    const handleAddCategory = () => {
        if (!newCategoryName.trim()) return;
        const newEntry: BudgetEntry = { category: newCategoryName.trim(), amount: 0, target: activeTab };
        setBudgetEntries(prev => [...prev, newEntry]);
        setNewCategoryName('');
        setAddingCategory(false);
        setSaved(false);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const now = new Date();
            const startYear = now.getFullYear();
            const startMonth = now.getMonth() + 1;
            const allEntries: any[] = [];

            for (let i = 0; i < MONTHS_TO_SAVE; i++) {
                let month = startMonth + i;
                let year = startYear;
                while (month > 12) { month -= 12; year += 1; }

                budgetEntries.forEach(entry => {
                    if (entry.amount > 0) {
                        allEntries.push({ year, month, target: entry.target, category: entry.category, amount: entry.amount });
                    }
                });
            }

            const response = await fetch('/api/budgets/bulk', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ entries: allEntries }),
            });

            if (!response.ok) throw new Error('Failed to save budget');
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } catch (error) {
            console.error('Error saving budget:', error);
        } finally {
            setSaving(false);
        }
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
                    <h1 className="text-2xl font-bold text-foreground">Budget Builder</h1>
                    <p className="text-sm text-muted-foreground">Set your monthly budget plan</p>
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
                                onClick={() => { setActiveTab(tab.id); setSelectedCategory(null); setEditingCategory(null); setAddingCategory(false); }}
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
                                <div key={entry.category} className="bg-card border border-border rounded-xl p-3 flex items-center gap-3 relative">
                                    {/* Category name (editable or tappable) */}
                                    {editingCategory === entry.category ? (
                                        <input
                                            ref={editInputRef}
                                            type="text"
                                            defaultValue={entry.category}
                                            onBlur={(e) => handleRenameCategory(entry.category, e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') handleRenameCategory(entry.category, e.currentTarget.value);
                                                if (e.key === 'Escape') setEditingCategory(null);
                                            }}
                                            className="flex-1 bg-transparent text-sm font-medium text-foreground focus:outline-none border-b border-primary"
                                        />
                                    ) : (
                                        <button
                                            onClick={() => handleCategoryTap(entry.category)}
                                            className="flex-1 text-sm font-medium text-foreground truncate text-left hover:text-muted-foreground transition-colors"
                                        >
                                            {entry.category}
                                        </button>
                                    )}

                                    {/* Popup icons when selected */}
                                    {selectedCategory === entry.category && (
                                        <div className="flex items-center gap-1 mr-2">
                                            <button
                                                onClick={() => handleStartEdit(entry.category)}
                                                className="p-1.5 rounded-lg bg-muted hover:bg-primary/20 text-muted-foreground hover:text-primary transition-colors"
                                            >
                                                <Pencil className="w-3.5 h-3.5" />
                                            </button>
                                            <button
                                                onClick={() => setDeleteConfirm(entry.category)}
                                                className="p-1.5 rounded-lg bg-muted hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-colors"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    )}

                                    {/* Amount input */}
                                    <div className="flex items-center gap-1">
                                        <span className="text-muted-foreground text-xs">¥</span>
                                        <input
                                            type="number"
                                            inputMode="numeric"
                                            value={entry.amount || ''}
                                            onChange={(e) => updateEntry(entry.category, Number(e.target.value) || 0)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    (e.target as HTMLInputElement).blur();
                                                }
                                            }}
                                            placeholder="0"
                                            className="w-20 bg-muted border border-border rounded-lg px-2 py-1.5 text-right font-mono text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
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

                            {/* Add Category - Below Total */}
                            {addingCategory ? (
                                <div className="flex gap-2 items-center">
                                    <input
                                        type="text"
                                        value={newCategoryName}
                                        onChange={(e) => setNewCategoryName(e.target.value)}
                                        className="flex-1 bg-card border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                                        placeholder="Category name..."
                                        autoFocus
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') handleAddCategory();
                                            if (e.key === 'Escape') { setAddingCategory(false); setNewCategoryName(''); }
                                        }}
                                    />
                                    <button onClick={handleAddCategory} className="px-3 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90">
                                        Add
                                    </button>
                                    <button onClick={() => { setAddingCategory(false); setNewCategoryName(''); }} className="p-2 text-muted-foreground hover:text-foreground">
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            ) : (
                                <button
                                    onClick={() => setAddingCategory(true)}
                                    className="w-full py-2 text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center gap-1.5 text-xs"
                                >
                                    <Plus className="w-3.5 h-3.5" />
                                    Add category
                                </button>
                            )}
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
                                onClick={handleSave}
                                disabled={saving}
                                className="w-full py-3 rounded-xl font-semibold text-[#1B4034] bg-[#A9D9C7] hover:brightness-110 disabled:opacity-50 transition-all"
                            >
                                {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Budget'}
                            </button>

                            <p className="text-xs text-muted-foreground text-center">
                                Applied to the next <strong className="text-foreground">{MONTHS_TO_SAVE} months</strong>
                            </p>
                        </>
                    )}
                </div>


            </div>

            {/* Delete Confirmation Modal */}
            {deleteConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setDeleteConfirm(null)}>
                    <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" />
                    <div className="relative bg-card border border-border rounded-2xl p-6 max-w-sm w-full shadow-xl" onClick={e => e.stopPropagation()}>
                        <h3 className="font-semibold text-foreground text-lg mb-2">Delete Category?</h3>
                        <p className="text-muted-foreground text-sm mb-6">
                            Are you sure you want to delete <strong className="text-foreground">{deleteConfirm}</strong>?
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setDeleteConfirm(null)}
                                className="flex-1 py-2.5 rounded-xl font-medium text-foreground bg-muted hover:bg-muted/80 transition-colors"
                            >
                                Discard
                            </button>
                            <button
                                onClick={() => handleDeleteCategory(deleteConfirm)}
                                className="flex-1 py-2.5 rounded-xl font-medium text-destructive-foreground bg-destructive hover:bg-destructive/90 transition-colors"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Pro Builder Link - Only shown if enabled in settings */}
            {showProBuilderLink && (
                <Link
                    href="/budget/builder"
                    className="fixed bottom-24 right-4 z-40 text-[10px] text-muted-foreground/60 hover:text-muted-foreground transition-colors"
                >
                    Pro Builder →
                </Link>
            )}
        </div>
    );
}
