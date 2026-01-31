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
        'Living': { bg: 'bg-cyber-cyan/10', text: 'text-cyber-cyan', border: 'border-cyber-cyan/30' },
        'Present': { bg: 'bg-alert-amber/10', text: 'text-alert-amber', border: 'border-alert-amber/30' },
        'Future': { bg: 'bg-growth-green/10', text: 'text-growth-green', border: 'border-growth-green/30' },
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
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyber-cyan" />
                </div>
            </div>
        );
    }

    return (
        <>
            <div className={cn("liquid-card-premium overflow-hidden", className)}>
                {/* Header */}
                <div className="px-4 py-4 border-b border-white/10 flex flex-col gap-3 relative z-10">
                    <div className="flex items-center justify-between">
                        <div>
                            {title && <h2 className="text-lg font-semibold text-white">{title}</h2>}
                            <p className="text-xs text-secondary-text font-mono">
                                {filteredExpenses.length} {filteredExpenses.length === 1 ? 'record' : 'records'}
                                {search && ` (filtered from ${expenses.length})`}
                            </p>
                        </div>
                    </div>

                    {/* Search - full width on mobile */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-text" />
                        <input
                            type="text"
                            placeholder="Search by category, shop, item..."
                            value={search}
                            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
                            className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-secondary-text/50 focus:outline-none focus:ring-2 focus:ring-cyber-cyan/50"
                        />
                    </div>
                </div>

                {/* Mobile Card View (visible on small screens) */}
                <div className="md:hidden">
                    {paginatedExpenses.length === 0 ? (
                        <div className="p-8 text-center text-secondary-text">
                            {search ? 'No matching records found' : 'No expenses to display'}
                        </div>
                    ) : (
                        <div className="divide-y divide-white/5">
                            {paginatedExpenses.map((expense, idx) => {
                                const colors = targetColors[expense.target as ExpenseTarget] || targetColors.Living;

                                return (
                                    <button
                                        key={expense.id || `${expense.date}-${expense.value}-${idx}`}
                                        className="w-full p-4 flex items-center justify-between hover:bg-white/5 active:bg-white/10 transition-colors text-left"
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
                                                <span className="text-xs text-secondary-text font-mono">
                                                    {expense.date}
                                                </span>
                                            </div>
                                            <p className="text-white font-medium truncate">
                                                {expense.category}
                                            </p>
                                            {expense.item && (
                                                <p className="text-sm text-secondary-text truncate mt-0.5">
                                                    {expense.item}
                                                </p>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-3 ml-4">
                                            <span className="font-mono font-bold text-white text-lg">
                                                {formatCurrency(expense.value)}
                                            </span>
                                            {editable && (
                                                <ChevronRight className="w-5 h-5 text-secondary-text" />
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
                            <tr className="border-b border-white/10 bg-black/20">
                                <th className="text-left p-3 text-secondary-text font-medium text-xs uppercase tracking-wide">Date</th>
                                <th className="text-left p-3 text-secondary-text font-medium text-xs uppercase tracking-wide">Target</th>
                                <th className="text-left p-3 text-secondary-text font-medium text-xs uppercase tracking-wide">Category</th>
                                <th className="text-right p-3 text-secondary-text font-medium text-xs uppercase tracking-wide">Value</th>
                                <th className="text-left p-3 text-secondary-text font-medium text-xs uppercase tracking-wide">Item</th>
                                <th className="text-left p-3 text-secondary-text font-medium text-xs uppercase tracking-wide hidden lg:table-cell">Shop</th>
                                {editable && (
                                    <th className="text-center p-3 text-secondary-text font-medium text-xs uppercase tracking-wide w-24">Actions</th>
                                )}
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedExpenses.length === 0 ? (
                                <tr>
                                    <td colSpan={editable ? 7 : 6} className="p-8 text-center text-secondary-text">
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
                                                "border-b border-white/5 transition-colors",
                                                editable ? "hover:bg-white/5 cursor-pointer" : ""
                                            )}
                                            onClick={() => editable && handleEdit(expense, idx)}
                                        >
                                            {/* Date */}
                                            <td className="p-3 font-mono text-xs text-white">{expense.date}</td>

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
                                                            className="w-full px-2 py-1 bg-white/10 border border-cyber-cyan/50 rounded text-sm text-white focus:outline-none"
                                                            autoFocus
                                                            onKeyDown={(e) => {
                                                                if (e.key === 'Enter') commitQuickEdit();
                                                                if (e.key === 'Escape') cancelQuickEdit();
                                                            }}
                                                        />
                                                        <button onClick={commitQuickEdit} className="p-1 text-growth-green hover:bg-growth-green/20 rounded">
                                                            <Check className="w-3 h-3" />
                                                        </button>
                                                        <button onClick={cancelQuickEdit} className="p-1 text-laser-magenta hover:bg-laser-magenta/20 rounded">
                                                            <X className="w-3 h-3" />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <span
                                                        className={cn("text-white", editable && "hover:text-cyber-cyan")}
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
                                            <td className="p-3 text-right font-mono font-bold text-white">
                                                {isQuickEditing && quickEdit.field === 'value' ? (
                                                    <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                                                        <input
                                                            type="number"
                                                            value={quickEdit.value}
                                                            onChange={(e) => setQuickEdit({ ...quickEdit, value: e.target.value })}
                                                            className="w-24 px-2 py-1 bg-white/10 border border-cyber-cyan/50 rounded text-sm text-white text-right focus:outline-none"
                                                            autoFocus
                                                            onKeyDown={(e) => {
                                                                if (e.key === 'Enter') commitQuickEdit();
                                                                if (e.key === 'Escape') cancelQuickEdit();
                                                            }}
                                                        />
                                                        <button onClick={commitQuickEdit} className="p-1 text-growth-green hover:bg-growth-green/20 rounded">
                                                            <Check className="w-3 h-3" />
                                                        </button>
                                                        <button onClick={cancelQuickEdit} className="p-1 text-laser-magenta hover:bg-laser-magenta/20 rounded">
                                                            <X className="w-3 h-3" />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <span
                                                        className={editable ? "hover:text-cyber-cyan cursor-pointer" : ""}
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
                                            <td className="p-3 text-secondary-text truncate max-w-[150px]">
                                                {expense.item || '—'}
                                            </td>

                                            {/* Shop (hidden on tablet) */}
                                            <td className="p-3 text-secondary-text hidden lg:table-cell truncate max-w-[120px]">
                                                {expense.shop || '—'}
                                            </td>

                                            {/* Actions */}
                                            {editable && (
                                                <td className="p-3 text-center" onClick={(e) => e.stopPropagation()}>
                                                    <div className="flex items-center justify-center gap-1">
                                                        <button
                                                            onClick={() => handleEdit(expense, idx)}
                                                            className="p-2 text-secondary-text hover:text-cyber-cyan hover:bg-cyber-cyan/10 rounded-lg transition-colors"
                                                            title="Edit"
                                                        >
                                                            <Pencil className="w-4 h-4" />
                                                        </button>
                                                        {showDelete && (
                                                            <button
                                                                onClick={(e) => handleQuickDelete(expense, idx, e)}
                                                                className="p-2 text-secondary-text hover:text-laser-magenta hover:bg-laser-magenta/10 rounded-lg transition-colors"
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
                    <div className="flex items-center justify-between px-4 py-4 border-t border-white/10 relative z-10">
                        <p className="text-sm text-secondary-text">
                            {page * pageSize + 1} - {Math.min((page + 1) * pageSize, filteredExpenses.length)} of {filteredExpenses.length}
                        </p>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setPage(Math.max(0, page - 1))}
                                disabled={page === 0}
                                className="p-2 rounded-lg bg-white/5 text-white disabled:opacity-30 hover:bg-white/10 transition-colors"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            <span className="px-3 text-sm text-secondary-text">
                                {page + 1} / {totalPages}
                            </span>
                            <button
                                onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                                disabled={page >= totalPages - 1}
                                className="p-2 rounded-lg bg-white/5 text-white disabled:opacity-30 hover:bg-white/10 transition-colors"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Edit Modal */}
            <EditExpenseModal
                expense={editingExpense?.expense ?? null}
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
