'use client';

import { useState, useCallback, useMemo } from 'react';
import { Pencil, Trash2, ChevronLeft, ChevronRight, Search, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Expense, ExpenseTarget } from '@/types';
import { EditExpenseModal } from './EditExpenseModal';

interface EditableExpenseTableProps {
    /** Array of expenses to display */
    expenses: Expense[];
    /** Callback when an expense is updated */
    onUpdate?: (expense: Expense, index: number) => void;
    /** Callback when an expense is deleted */
    onDelete?: (expense: Expense, index: number) => void;
    /** Callback when expenses array changes (for controlled mode) */
    onChange?: (expenses: Expense[]) => void;
    /** Whether the table is in loading state */
    loading?: boolean;
    /** Whether editing is enabled */
    editable?: boolean;
    /** Whether to show delete button */
    showDelete?: boolean;
    /** Page size for pagination */
    pageSize?: number;
    /** Title shown above the table */
    title?: string;
    /** Whether this is for CSV preview (shows different actions) */
    isPreviewMode?: boolean;
    /** Additional class name */
    className?: string;
    /** Whether to show the search bar */
    showSearch?: boolean;
    /** Callback to change page size */
    onPageSizeChange?: (size: number) => void;
}

interface QuickEditState {
    index: number;
    field: keyof Expense;
    value: string;
}

/**
 * Editable table for expenses with inline quick-edit and full modal editing.
 * Mobile-first design with card layout for small screens.
 * Reusable for both the expenses page and CSV import preview.
 */
export function EditableExpenseTable({
    expenses,
    onUpdate,
    onDelete,
    onChange,
    loading = false,
    editable = true,
    showDelete = true,
    pageSize = 25,
    title,
    isPreviewMode = false,

    className,
    showSearch = true,
    onPageSizeChange,
}: EditableExpenseTableProps) {
    const [page, setPage] = useState(0);
    const [search, setSearch] = useState('');
    const [editingExpense, setEditingExpense] = useState<{ expense: Expense; index: number } | null>(null);
    const [quickEdit, setQuickEdit] = useState<QuickEditState | null>(null);
    const [saving, setSaving] = useState(false);

    // Filter expenses by search
    const filteredExpenses = useMemo(() => {
        if (!search) return expenses;
        const searchLower = search.toLowerCase();
        return expenses.filter((exp) =>
            exp.category?.toLowerCase().includes(searchLower) ||
            exp.shop?.toLowerCase().includes(searchLower) ||
            exp.item?.toLowerCase().includes(searchLower) ||
            exp.location?.toLowerCase().includes(searchLower) ||
            exp.target?.toLowerCase().includes(searchLower)
        );
    }, [expenses, search]);

    // Pagination
    const totalPages = Math.ceil(filteredExpenses.length / pageSize);
    const paginatedExpenses = useMemo(() => {
        const start = page * pageSize;
        return filteredExpenses.slice(start, start + pageSize);
    }, [filteredExpenses, page, pageSize]);

    // Get the actual index in the original expenses array
    const getOriginalIndex = useCallback((expense: Expense, filteredIndex: number): number => {
        // If there's no search filter, calculate directly
        if (!search) {
            return page * pageSize + filteredIndex;
        }
        // Otherwise find by id or position
        return expenses.findIndex(e =>
            e.id === expense.id ||
            (e.date === expense.date && e.value === expense.value && e.category === expense.category)
        );
    }, [expenses, search, page, pageSize]);

    const formatCurrency = (val: number) => `¥${val?.toLocaleString() || 0}`;

    const targetColors: Record<ExpenseTarget, { bg: string; text: string; border: string }> = {
        'Living': { bg: 'bg-[var(--color-living)]/10', text: 'text-[var(--color-living)]', border: 'border-[var(--color-living)]/30' },
        'Present': { bg: 'bg-[var(--color-present)]/10', text: 'text-[var(--color-present)]', border: 'border-[var(--color-present)]/30' },
        'Future': { bg: 'bg-[var(--color-future)]/10', text: 'text-[var(--color-future)]', border: 'border-[var(--color-future)]/30' },
        'Income': { bg: 'bg-[var(--color-total)]/10', text: 'text-[var(--color-total)]', border: 'border-[var(--color-total)]/30' },
    };

    // Feeling display helper
    const getFeelingEmoji = (value: number | undefined): string => {
        if (!value) return '';
        const emojis: Record<number, string> = { 5: '😄', 4: '🙂', 3: '😐', 2: '😕', 1: '😞' };
        return emojis[value] || '';
    };

    // Handle opening edit modal
    const handleEdit = (expense: Expense, filteredIndex: number) => {
        const originalIndex = getOriginalIndex(expense, filteredIndex);
        setEditingExpense({ expense, index: originalIndex });
    };

    // Handle saving from modal
    const handleSave = async (updatedExpense: Expense) => {
        if (!editingExpense) return;

        setSaving(true);
        try {
            if (onUpdate) {
                await Promise.resolve(onUpdate(updatedExpense, editingExpense.index));
            }
            if (onChange) {
                const newExpenses = [...expenses];
                newExpenses[editingExpense.index] = updatedExpense;
                onChange(newExpenses);
            }
            setEditingExpense(null);
        } finally {
            setSaving(false);
        }
    };

    // Handle delete
    const handleDelete = async (expense: Expense) => {
        if (!editingExpense) return;

        setSaving(true);
        try {
            if (onDelete) {
                await Promise.resolve(onDelete(expense, editingExpense.index));
            }
            if (onChange) {
                const newExpenses = expenses.filter((_, i) => i !== editingExpense.index);
                onChange(newExpenses);
            }
            setEditingExpense(null);
        } finally {
            setSaving(false);
        }
    };

    // Quick inline edit handlers
    const startQuickEdit = (index: number, field: keyof Expense, currentValue: string) => {
        setQuickEdit({ index, field, value: currentValue });
    };

    const commitQuickEdit = () => {
        if (!quickEdit) return;
        const originalIndex = getOriginalIndex(paginatedExpenses[quickEdit.index], quickEdit.index);
        const expense = expenses[originalIndex];

        let updatedValue: string | number = quickEdit.value;
        if (quickEdit.field === 'value') {
            updatedValue = parseFloat(quickEdit.value) || 0;
        }

        const updatedExpense = { ...expense, [quickEdit.field]: updatedValue };

        if (onUpdate) {
            onUpdate(updatedExpense, originalIndex);
        }
        if (onChange) {
            const newExpenses = [...expenses];
            newExpenses[originalIndex] = updatedExpense;
            onChange(newExpenses);
        }

        setQuickEdit(null);
    };

    const cancelQuickEdit = () => {
        setQuickEdit(null);
    };

    // Handle quick delete from row
    const handleQuickDelete = (expense: Expense, filteredIndex: number, e: React.MouseEvent) => {
        e.stopPropagation();
        const originalIndex = getOriginalIndex(expense, filteredIndex);

        if (onDelete) {
            onDelete(expense, originalIndex);
        }
        if (onChange) {
            const newExpenses = expenses.filter((_, i) => i !== originalIndex);
            onChange(newExpenses);
        }
    };

    if (loading) {
        return (
            <div className={cn("liquid-card-premium p-8", className)}>
                <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                </div>
            </div>
        );
    }

    return (
        <>
            <div className={cn("bg-card border border-border rounded-xl overflow-hidden shadow-sm", className)}>
                {/* Header */}
                <div className="px-4 py-4 border-b border-border flex flex-col gap-3 relative z-10">
                    <div className="flex items-center justify-between">
                        <div>
                            {title && <h2 className="text-lg font-semibold text-foreground">{title}</h2>}
                            <p className="text-xs text-muted-foreground font-mono">
                                {filteredExpenses.length} {filteredExpenses.length === 1 ? 'record' : 'records'}
                                {search && ` (filtered from ${expenses.length})`}
                            </p>

                        </div>

                        {onPageSizeChange && (
                            <div className="flex items-center bg-muted rounded-lg p-1 border border-border">
                                {[20, 50, 100].map((size) => (
                                    <button
                                        key={size}
                                        onClick={() => onPageSizeChange(size)}
                                        className={cn(
                                            "px-3 py-1.5 text-xs font-medium rounded-md transition-all",
                                            pageSize === size
                                                ? "bg-secondary text-secondary-foreground shadow-sm font-bold"
                                                : "text-muted-foreground hover:bg-muted-foreground/10 hover:text-foreground"
                                        )}
                                    >
                                        {size}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Search - full width on mobile */}
                    {showSearch && (
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <input
                                type="text"
                                placeholder="Search by category, shop, item..."
                                value={search}
                                onChange={(e) => { setSearch(e.target.value); setPage(0); }}
                                className="w-full pl-10 pr-4 py-3 bg-muted/50 border border-input rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                            />
                        </div>
                    )}
                </div>

                {/* Mobile Card View (visible on small screens) */}
                <div className="md:hidden">
                    {paginatedExpenses.length === 0 ? (
                        <div className="p-8 text-center text-muted-foreground">
                            {search ? 'No matching records found' : 'No expenses to display'}
                        </div>
                    ) : (
                        <div className="divide-y divide-border">
                            {paginatedExpenses.map((expense, idx) => {
                                const colors = targetColors[expense.target as ExpenseTarget] || targetColors.Living;

                                return (
                                    <button
                                        key={expense.id || `${expense.date}-${expense.value}-${idx}`}
                                        className="w-full p-4 flex items-center justify-between hover:bg-muted/50 active:bg-muted transition-colors text-left"
                                        onClick={() => editable && handleEdit(expense, idx)}
                                    >
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className={cn(
                                                    "px-2 py-0.5 rounded-md text-xs font-medium border",
                                                    colors.bg, colors.text, colors.border
                                                )}>
                                                    {expense.target}
                                                </span>
                                                <span className="text-xs text-muted-foreground font-mono">
                                                    {expense.date}
                                                </span>
                                            </div>
                                            <p className="text-foreground font-medium truncate">
                                                {expense.category}
                                            </p>
                                            {expense.item && (
                                                <p className="text-sm text-muted-foreground truncate mt-0.5">
                                                    {expense.item}
                                                </p>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-3 ml-4">
                                            {(expense.feeling || expense.feeling_review) && (
                                                <div className="flex items-center gap-1 text-lg" title={`Initial: ${expense.feeling || '-'} | Review: ${expense.feeling_review || '-'}`}>
                                                    <span>{getFeelingEmoji(expense.feeling) || '•'}</span>
                                                    <span className="text-muted-foreground text-xs">→</span>
                                                    <span>{getFeelingEmoji(expense.feeling_review) || '•'}</span>
                                                </div>
                                            )}
                                            <span className="font-mono font-bold text-foreground text-lg">
                                                {formatCurrency(expense.value)}
                                            </span>
                                            {editable && (
                                                <ChevronRight className="w-5 h-5 text-muted-foreground" />
                                            )}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Desktop Table View (hidden on small screens) */}
                <div className="hidden md:block overflow-x-auto relative z-10">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-border bg-muted/40">
                                <th className="text-left p-3 text-muted-foreground font-medium text-xs uppercase tracking-wide">Date</th>
                                <th className="text-left p-3 text-muted-foreground font-medium text-xs uppercase tracking-wide">Target</th>
                                <th className="text-left p-3 text-muted-foreground font-medium text-xs uppercase tracking-wide">Category</th>
                                <th className="text-left p-3 text-muted-foreground font-medium text-xs uppercase tracking-wide">Value</th>
                                <th className="text-left p-3 text-muted-foreground font-medium text-xs uppercase tracking-wide">Item</th>
                                <th className="text-center p-3 text-muted-foreground font-medium text-xs uppercase tracking-wide w-16" title="Initial feeling">Feel</th>
                                <th className="text-center p-3 text-muted-foreground font-medium text-xs uppercase tracking-wide w-16" title="Reviewed feeling">Rev</th>
                                <th className="text-left p-3 text-muted-foreground font-medium text-xs uppercase tracking-wide hidden lg:table-cell">Shop</th>
                                {editable && (
                                    <th className="text-center p-3 text-muted-foreground font-medium text-xs uppercase tracking-wide w-24">Actions</th>
                                )}
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedExpenses.length === 0 ? (
                                <tr>
                                    <td colSpan={editable ? 9 : 8} className="p-8 text-center text-muted-foreground">
                                        {search ? 'No matching records found' : 'No expenses to display'}
                                    </td>
                                </tr>
                            ) : (
                                paginatedExpenses.map((expense, idx) => {
                                    const colors = targetColors[expense.target as ExpenseTarget] || targetColors.Living;
                                    const isQuickEditing = quickEdit?.index === idx;

                                    return (
                                        <tr
                                            key={expense.id || `${expense.date}-${expense.value}-${idx}`}
                                            className={cn(
                                                "border-b border-border transition-colors",
                                                editable ? "hover:bg-muted/50 cursor-pointer" : ""
                                            )}
                                            onClick={() => editable && handleEdit(expense, idx)}
                                        >
                                            {/* Date */}
                                            <td className="p-3 font-mono text-xs text-foreground">{expense.date}</td>

                                            {/* Target */}
                                            <td className="p-3">
                                                <span className={cn(
                                                    "px-2 py-0.5 rounded-md text-xs font-medium border",
                                                    colors.bg, colors.text, colors.border
                                                )}>
                                                    {expense.target}
                                                </span>
                                            </td>

                                            {/* Category */}
                                            <td className="p-3">
                                                {isQuickEditing && quickEdit.field === 'category' ? (
                                                    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                                                        <input
                                                            type="text"
                                                            value={quickEdit.value}
                                                            onChange={(e) => setQuickEdit({ ...quickEdit, value: e.target.value })}
                                                            className="w-full px-2 py-1 bg-input border border-ring rounded text-sm text-foreground focus:outline-none"
                                                            autoFocus
                                                            onKeyDown={(e) => {
                                                                if (e.key === 'Enter') commitQuickEdit();
                                                                if (e.key === 'Escape') cancelQuickEdit();
                                                            }}
                                                        />
                                                        <button onClick={commitQuickEdit} className="p-1 text-[var(--color-future)] hover:bg-[var(--color-future)]/20 rounded">
                                                            <Check className="w-3 h-3" />
                                                        </button>
                                                        <button onClick={cancelQuickEdit} className="p-1 text-destructive hover:bg-destructive/20 rounded">
                                                            <X className="w-3 h-3" />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <span
                                                        className={cn("text-foreground", editable && "hover:text-primary")}
                                                        onDoubleClick={(e) => {
                                                            e.stopPropagation();
                                                            startQuickEdit(idx, 'category', expense.category);
                                                        }}
                                                    >
                                                        {expense.category}
                                                    </span>
                                                )}
                                            </td>

                                            {/* Value */}
                                            <td className="p-3 text-right font-mono font-bold text-foreground">
                                                {isQuickEditing && quickEdit.field === 'value' ? (
                                                    <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                                                        <input
                                                            type="number"
                                                            value={quickEdit.value}
                                                            onChange={(e) => setQuickEdit({ ...quickEdit, value: e.target.value })}
                                                            className="w-24 px-2 py-1 bg-input border border-ring rounded text-sm text-foreground text-right focus:outline-none"
                                                            autoFocus
                                                            onKeyDown={(e) => {
                                                                if (e.key === 'Enter') commitQuickEdit();
                                                                if (e.key === 'Escape') cancelQuickEdit();
                                                            }}
                                                        />
                                                        <button onClick={commitQuickEdit} className="p-1 text-[var(--color-future)] hover:bg-[var(--color-future)]/20 rounded">
                                                            <Check className="w-3 h-3" />
                                                        </button>
                                                        <button onClick={cancelQuickEdit} className="p-1 text-destructive hover:bg-destructive/20 rounded">
                                                            <X className="w-3 h-3" />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <span
                                                        className={editable ? "hover:text-primary cursor-pointer" : ""}
                                                        onDoubleClick={(e) => {
                                                            e.stopPropagation();
                                                            startQuickEdit(idx, 'value', expense.value.toString());
                                                        }}
                                                    >
                                                        {formatCurrency(expense.value)}
                                                    </span>
                                                )}
                                            </td>

                                            {/* Item */}
                                            <td className="p-3 text-muted-foreground truncate max-w-[150px]">
                                                {expense.item || '—'}
                                            </td>

                                            {/* Feeling */}
                                            <td className="p-3 text-center text-lg" title={expense.feeling ? `Initial feeling: ${expense.feeling}/5` : 'No feeling recorded'}>
                                                {getFeelingEmoji(expense.feeling) || '—'}
                                            </td>

                                            {/* Feeling Review */}
                                            <td className="p-3 text-center text-lg" title={expense.feeling_review ? `Reviewed feeling: ${expense.feeling_review}/5` : 'Not reviewed yet'}>
                                                {getFeelingEmoji(expense.feeling_review) || '—'}
                                            </td>

                                            {/* Shop (hidden on tablet) */}
                                            <td className="p-3 text-muted-foreground hidden lg:table-cell truncate max-w-[120px]">
                                                {expense.shop || '—'}
                                            </td>

                                            {/* Actions */}
                                            {editable && (
                                                <td className="p-3 text-center" onClick={(e) => e.stopPropagation()}>
                                                    <div className="flex items-center justify-center gap-1">
                                                        <button
                                                            onClick={() => handleEdit(expense, idx)}
                                                            className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                                                            title="Edit"
                                                        >
                                                            <Pencil className="w-4 h-4" />
                                                        </button>
                                                        {showDelete && (
                                                            <button
                                                                onClick={(e) => handleQuickDelete(expense, idx, e)}
                                                                className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                                                                title="Delete"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            )}
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between px-4 py-4 border-t border-border relative z-10">
                        <p className="text-sm text-muted-foreground">
                            {page * pageSize + 1} - {Math.min((page + 1) * pageSize, filteredExpenses.length)} of {filteredExpenses.length}
                        </p>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setPage(Math.max(0, page - 1))}
                                disabled={page === 0}
                                className="p-2 rounded-lg bg-muted/50 text-foreground disabled:opacity-30 hover:bg-muted transition-colors"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            <span className="px-3 text-sm text-muted-foreground">
                                {page + 1} / {totalPages}
                            </span>
                            <button
                                onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                                disabled={page >= totalPages - 1}
                                className="p-2 rounded-lg bg-muted/50 text-foreground disabled:opacity-30 hover:bg-muted transition-colors"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}
            </div >

            {/* Edit Modal */}
            < EditExpenseModal
                expense={editingExpense?.expense ?? null
                }
                onClose={() => setEditingExpense(null)}
                onSave={handleSave}
                onDelete={showDelete ? handleDelete : undefined}
                saving={saving}
                isPreviewMode={isPreviewMode}
            />
        </>
    );
}

export default EditableExpenseTable;
