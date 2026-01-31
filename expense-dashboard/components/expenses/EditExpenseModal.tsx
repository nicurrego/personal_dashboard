'use client';

import { useState, useEffect, useCallback } from 'react';
import { X, ChevronLeft, Check, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Expense, ExpenseTarget } from '@/types';

interface EditExpenseModalProps {
    /** The expense to view/edit (null = closed) */
    expense: Expense | null;
    /** Callback when modal should close */
    onClose: () => void;
    /** Callback when expense is saved */
    onSave: (expense: Expense) => void;
    /** Optional callback for deleting the expense */
    onDelete?: (expense: Expense) => void;
    /** Whether save is in progress */
    saving?: boolean;
    /** Whether this is for CSV preview (hides delete, shows different styling) */
    isPreviewMode?: boolean;
}

type EditingField = keyof Expense | null;

const TARGET_OPTIONS: ExpenseTarget[] = ['Living', 'Present', 'Future'];

const CATEGORY_SUGGESTIONS = [
    'Food', 'Transport', 'Housing', 'Utilities', 'Entertainment',
    'Shopping', 'Health', 'Education', 'Travel', 'Subscription',
    'Insurance', 'Investment', 'Savings', 'Gifts', 'Other'
];

const METHOD_OPTIONS = [
    'Cash', 'Credit Card', 'Debit Card', 'Bank Transfer', 'PayPay',
    'LINE Pay', 'Suica', 'Mobile Payment', 'Other'
];

const CONTEXT_OPTIONS = [
    'Daily', 'Weekly', 'Monthly', 'One-time', 'Travel', 'Work', 'Personal', 'Weekend'
];

const TARGET_COLORS: Record<ExpenseTarget, { text: string; bg: string; border: string }> = {
    'Living': { text: 'text-cyber-cyan', bg: 'bg-cyber-cyan', border: 'border-cyber-cyan/30' },
    'Present': { text: 'text-alert-amber', bg: 'bg-alert-amber', border: 'border-alert-amber/30' },
    'Future': { text: 'text-growth-green', bg: 'bg-growth-green', border: 'border-growth-green/30' },
};

/**
 * Mobile-first expense modal.
 * 
 * Flow:
 * 1. User taps transaction → Opens directly in "Review & Save" format (Centered Popup).
 * 2. User taps any field → Opens Full Screen Field Editor.
 */
export function EditExpenseModal({
    expense,
    onClose,
    onSave,
    onDelete,
    saving = false,
    isPreviewMode = false,
}: EditExpenseModalProps) {
    const [formData, setFormData] = useState<Expense | null>(null);
    const [editingField, setEditingField] = useState<EditingField>(null);
    const [tempValue, setTempValue] = useState<string>('');
    const [hasChanges, setHasChanges] = useState(false);

    // Reset state when expense changes
    useEffect(() => {
        if (expense) {
            setFormData({ ...expense });
            setEditingField(null);
            setHasChanges(false);
        }
    }, [expense]);

    const handleChange = useCallback((field: keyof Expense, value: string | number) => {
        setFormData(prev => {
            if (!prev) return prev;

            setHasChanges(true);

            if (field === 'value') {
                const numValue = typeof value === 'string' ? parseFloat(value) || 0 : value;
                return { ...prev, value: numValue };
            }

            if (field === 'date') {
                const dateStr = String(value);
                const date = new Date(dateStr);
                return {
                    ...prev,
                    date: dateStr,
                    year: date.getFullYear(),
                    month: date.getMonth() + 1,
                };
            }

            return { ...prev, [field]: String(value) } as Expense;
        });
    }, []);

    const handleClose = () => {
        if (hasChanges) {
            if (confirm('You have unsaved changes. Are you sure you want to close?')) {
                onClose();
            }
        } else {
            onClose();
        }
    };

    const startEditing = (field: keyof Expense, currentValue: string | number) => {
        setEditingField(field);
        setTempValue(String(currentValue || ''));
    };

    const confirmEdit = () => {
        if (editingField && formData) {
            handleChange(editingField, tempValue);
        }
        setEditingField(null);
        setTempValue('');
    };

    const cancelEdit = () => {
        setEditingField(null);
        setTempValue('');
    };

    const handleSave = () => {
        if (!formData) return;
        onSave(formData);
    };

    const handleDelete = () => {
        if (!formData || !onDelete) return;
        if (confirm(`Delete this expense?\n\n¥${formData.value.toLocaleString()} - ${formData.category}`)) {
            onDelete(formData);
        }
    };

    const formatCurrency = (val: number) => `¥${val?.toLocaleString() || 0}`;

    const formatDate = (date: string): string => {
        try {
            return new Date(date).toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                year: 'numeric'
            });
        } catch {
            return date;
        }
    };

    if (!expense || !formData) return null;

    const isValid = formData.value > 0 && formData.category && formData.target;
    const colors = TARGET_COLORS[formData.target as ExpenseTarget] || TARGET_COLORS.Living;

    // Detail items configuration
    const detailItems = [
        {
            label: 'Amount',
            value: formatCurrency(formData.value),
            field: 'value' as keyof Expense,
            type: 'number',
            rawValue: formData.value
        },
        {
            label: 'Target',
            value: formData.target || 'Not set',
            field: 'target' as keyof Expense,
            colorClass: colors.text,
            type: 'target',
            rawValue: formData.target
        },
        {
            label: 'Category',
            value: formData.category || 'Not set',
            field: 'category' as keyof Expense,
            type: 'autocomplete',
            suggestions: CATEGORY_SUGGESTIONS,
            rawValue: formData.category
        },
        {
            label: 'Shop',
            value: formData.shop || '—',
            field: 'shop' as keyof Expense,
            type: 'text',
            rawValue: formData.shop
        },
        {
            label: 'Method',
            value: formData.method || '—',
            field: 'method' as keyof Expense,
            type: 'select',
            options: METHOD_OPTIONS,
            rawValue: formData.method
        },
        {
            label: 'Location',
            value: formData.location || '—',
            field: 'location' as keyof Expense,
            type: 'text',
            rawValue: formData.location
        },
        {
            label: 'Item',
            value: formData.item || '—',
            field: 'item' as keyof Expense,
            type: 'text',
            rawValue: formData.item
        },
        {
            label: 'Context',
            value: formData.context || '—',
            field: 'context' as keyof Expense,
            type: 'select',
            options: CONTEXT_OPTIONS,
            rawValue: formData.context
        },
        {
            label: 'Date',
            value: formatDate(formData.date),
            field: 'date' as keyof Expense,
            type: 'date',
            rawValue: formData.date
        },
    ];

    // ==========================================
    // FIELD EDIT VIEW (Full Screen Overlay)
    // ==========================================
    const renderFieldEdit = (item: typeof detailItems[0]) => {
        return (
            <div className="fixed inset-0 z-[250] bg-black flex flex-col animate-in fade-in duration-150">
                {/* Edit Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
                    <button
                        onClick={cancelEdit}
                        className="flex items-center gap-2 text-secondary-text hover:text-white transition-colors"
                    >
                        <ChevronLeft className="w-5 h-5" />
                        <span className="text-sm">Back</span>
                    </button>

                    <h1 className="text-sm font-medium text-white">Edit {item.label}</h1>

                    <button
                        onClick={confirmEdit}
                        className="text-growth-green text-sm font-medium hover:text-growth-green/80 transition-colors"
                    >
                        Done
                    </button>
                </div>

                <div className="flex-1 px-4 py-6 overflow-y-auto">
                    <div className="liquid-card-premium p-6 relative z-10">
                        <h2 className="text-xl font-bold text-white mb-2">{item.label}</h2>

                        {/* Number input for amount */}
                        {item.type === 'number' && (
                            <div className="mt-4">
                                <div className="flex items-center gap-2">
                                    <span className="text-3xl text-secondary-text">¥</span>
                                    <input
                                        type="number"
                                        value={tempValue}
                                        onChange={(e) => setTempValue(e.target.value)}
                                        placeholder="0"
                                        autoFocus
                                        className="flex-1 text-4xl font-bold text-white bg-transparent border-none outline-none placeholder:text-white/20"
                                    />
                                </div>
                                <div className="mt-4 h-px bg-gradient-to-r from-cyber-cyan to-growth-green" />
                            </div>
                        )}

                        {/* Target selector */}
                        {item.type === 'target' && (
                            <div className="mt-4 flex flex-wrap gap-3">
                                {TARGET_OPTIONS.map((target) => (
                                    <button
                                        key={target}
                                        onClick={() => setTempValue(target)}
                                        className={cn(
                                            "flex-1 min-w-[100px] py-3 rounded-xl text-sm font-semibold transition-all border-2",
                                            tempValue === target
                                                ? `${TARGET_COLORS[target].bg} border-transparent text-white`
                                                : "bg-white/5 border-white/10 text-secondary-text hover:bg-white/10"
                                        )}
                                    >
                                        {target}
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Date picker */}
                        {item.type === 'date' && (
                            <div className="mt-4">
                                <input
                                    type="date"
                                    value={tempValue}
                                    onChange={(e) => setTempValue(e.target.value)}
                                    className="w-full px-4 py-4 rounded-xl bg-white/5 border border-white/10 text-white text-lg focus:outline-none focus:ring-2 focus:ring-cyber-cyan/50"
                                />
                            </div>
                        )}

                        {/* Text input */}
                        {item.type === 'text' && (
                            <div className="mt-4">
                                <input
                                    type="text"
                                    value={tempValue}
                                    onChange={(e) => setTempValue(e.target.value)}
                                    placeholder={`Enter ${item.label.toLowerCase()}...`}
                                    autoFocus
                                    className="w-full px-4 py-4 rounded-xl bg-white/5 border border-white/10 text-white text-lg placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-cyber-cyan/50"
                                />
                            </div>
                        )}

                        {/* Autocomplete with suggestions */}
                        {item.type === 'autocomplete' && item.suggestions && (
                            <div className="mt-4 space-y-3">
                                <input
                                    type="text"
                                    value={tempValue}
                                    onChange={(e) => setTempValue(e.target.value)}
                                    placeholder={`Enter ${item.label.toLowerCase()}...`}
                                    autoFocus
                                    className="w-full px-4 py-4 rounded-xl bg-white/5 border border-white/10 text-white text-lg placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-cyber-cyan/50"
                                />
                                <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto">
                                    {item.suggestions
                                        .filter(s => s.toLowerCase().includes(tempValue.toLowerCase()) || !tempValue)
                                        .slice(0, 12)
                                        .map((suggestion) => (
                                            <button
                                                key={suggestion}
                                                onClick={() => setTempValue(suggestion)}
                                                className={cn(
                                                    "px-3 py-2 rounded-lg text-sm transition-colors",
                                                    tempValue === suggestion
                                                        ? "bg-cyber-cyan/20 text-cyber-cyan border border-cyber-cyan/30"
                                                        : "bg-white/5 text-secondary-text hover:bg-white/10 hover:text-white"
                                                )}
                                            >
                                                {suggestion}
                                            </button>
                                        ))}
                                </div>
                            </div>
                        )}

                        {/* Select with options */}
                        {item.type === 'select' && item.options && (
                            <div className="mt-4 space-y-2 max-h-64 overflow-y-auto">
                                {item.options.map((option) => (
                                    <button
                                        key={option}
                                        onClick={() => setTempValue(option)}
                                        className={cn(
                                            "w-full flex items-center justify-between p-4 rounded-xl transition-all",
                                            tempValue === option
                                                ? "bg-cyber-cyan/20 border border-cyber-cyan/30"
                                                : "bg-white/5 border border-white/10 hover:bg-white/10"
                                        )}
                                    >
                                        <span className={tempValue === option ? "text-cyber-cyan font-medium" : "text-white"}>
                                            {option}
                                        </span>
                                        {tempValue === option && (
                                            <Check className="w-5 h-5 text-cyber-cyan" />
                                        )}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Confirm button */}
                <div className="px-4 pb-8 pt-4 border-t border-white/10">
                    <button
                        onClick={confirmEdit}
                        className="w-full py-4 rounded-2xl font-bold text-lg bg-gradient-to-r from-cyber-cyan to-growth-green text-white active:scale-[0.98] transition-transform"
                    >
                        Done
                    </button>
                </div>
            </div>
        );
    };

    // If editing a specific field, show the field edit view
    if (editingField) {
        const currentItem = detailItems.find(item => item.field === editingField);
        if (currentItem) {
            return renderFieldEdit(currentItem);
        }
    }

    // ==========================================
    // MAIN MODAL - Review & Save Format (Popup)
    // ==========================================
    return (
        <div
            className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
            onClick={handleClose}
        >
            <div
                className="w-full max-w-md bg-[#0A0A0A] rounded-3xl border border-white/10 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-white/5 relative z-20">
                    <div>
                        <h1 className="text-base font-semibold text-white">
                            {isPreviewMode ? 'Edit Entry' : 'Edit Expense'}
                        </h1>
                        <p className="text-xs text-secondary-text mt-0.5">Tap any field to edit</p>
                    </div>

                    <button
                        onClick={handleClose}
                        className="p-2 -mr-2 text-secondary-text hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                        aria-label="Close"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-2">
                    {detailItems.map((item) => (
                        <button
                            key={item.field}
                            onClick={() => startEditing(item.field, item.rawValue as string | number)}
                            className="w-full flex items-center justify-between p-4
                         rounded-xl bg-white/5 border border-white/10
                         hover:bg-white/10 hover:border-white/20
                         transition-all duration-150 group active:scale-[0.99]"
                        >
                            <span className="text-secondary-text text-sm font-medium">{item.label}</span>

                            <div className="flex items-center gap-2">
                                <span className={`font-semibold ${item.colorClass || 'text-white'}`}>
                                    {item.value}
                                </span>
                                <span className="text-secondary-text/50 group-hover:text-cyber-cyan transition-colors text-sm">
                                    Edit
                                </span>
                            </div>
                        </button>
                    ))}
                </div>

                {/* Footer Actions */}
                <div className="p-4 border-t border-white/10 bg-white/5 flex flex-col gap-3 relative z-20">
                    <button
                        onClick={handleSave}
                        disabled={saving || !isValid}
                        className={cn(
                            "w-full py-3.5 rounded-xl font-bold text-lg transition-all duration-200 border-2",
                            saving || !isValid
                                ? "bg-white/10 border-white/10 text-secondary-text cursor-not-allowed"
                                : "bg-growth-green border-growth-green text-white shadow-[0_0_20px_rgba(34,197,94,0.3)] hover:shadow-[0_0_25px_rgba(34,197,94,0.5)] active:scale-[0.98]"
                        )}
                    >
                        {saving ? 'Saving...' : 'Save Transaction'}
                    </button>

                    {onDelete && !isPreviewMode && (
                        <button
                            onClick={handleDelete}
                            className="w-full py-3 rounded-xl text-sm font-medium text-laser-magenta/80 hover:text-laser-magenta hover:bg-laser-magenta/5 transition-colors flex items-center justify-center gap-2"
                        >
                            <Trash2 className="w-4 h-4" />
                            Delete Transaction
                        </button>
                    )}

                    {!isValid && (
                        <p className="text-xs text-alert-amber text-center font-medium">
                            Amount, Category, and Target are required
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}

export default EditExpenseModal;
