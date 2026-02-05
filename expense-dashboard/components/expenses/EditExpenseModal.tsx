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

const TARGET_OPTIONS: ExpenseTarget[] = ['Living', 'Present', 'Future', 'Income'];

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

const FEELING_OPTIONS = [
    { value: 5, label: 'Great!', emoji: '😄', color: '#22c55e' },
    { value: 4, label: 'Good', emoji: '🙂', color: '#A9D9C7' },
    { value: 3, label: 'Neutral', emoji: '😐', color: '#94a3b8' },
    { value: 2, label: 'Slight regret', emoji: '😕', color: '#f59e0b' },
    { value: 1, label: 'Regret', emoji: '😞', color: '#C24656' },
];

const getFeelingDisplay = (value: number | undefined): string => {
    if (!value) return '—';
    const option = FEELING_OPTIONS.find(o => o.value === value);
    return option ? `${option.emoji} ${option.label}` : '—';
};

const TARGET_COLORS: Record<ExpenseTarget, { text: string; bg: string; border: string }> = {
    'Living': { text: 'text-[var(--color-living)]', bg: 'bg-[var(--color-living)]', border: 'border-[var(--color-living)]/30' },
    'Present': { text: 'text-[var(--color-present)]', bg: 'bg-[var(--color-present)]', border: 'border-[var(--color-present)]/30' },
    'Future': { text: 'text-[var(--color-future)]', bg: 'bg-[var(--color-future)]', border: 'border-[var(--color-future)]/30' },
    'Income': { text: 'text-[var(--color-total)]', bg: 'bg-[var(--color-total)]', border: 'border-[var(--color-total)]/30' },
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

            if (field === 'feeling' || field === 'feeling_review') {
                const numValue = typeof value === 'string' ? (value ? parseInt(value) : undefined) : value;
                return { ...prev, [field]: numValue };
            }

            return { ...prev, [field]: String(value) } as Expense;
        });
    }, []);

    // Handle back button behavior for mobile
    useEffect(() => {
        // Push a state so the back button can be intercepted
        window.history.pushState({ modalOpen: true }, '', window.location.href);

        const handlePopState = (event: PopStateEvent) => {
            // If back button is pressed, close the modal
            event.preventDefault();
            onClose();
        };

        window.addEventListener('popstate', handlePopState);

        return () => {
            window.removeEventListener('popstate', handlePopState);
            // Optional: If we closed via X button, we should ideally go back to revert our pushState.
            // But doing so synchronously can cause loops or issues if not careful.
            // For now, we accept that one extra "back" press might be needed if closed via X.
        };
    }, []); // Empty dependency array means this runs once on mount


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
        {
            label: 'Feeling',
            value: getFeelingDisplay(formData.feeling),
            field: 'feeling' as keyof Expense,
            type: 'feeling',
            rawValue: String(formData.feeling || '')
        },
        {
            label: 'Feeling (Review)',
            value: getFeelingDisplay(formData.feeling_review),
            field: 'feeling_review' as keyof Expense,
            type: 'feeling',
            rawValue: String(formData.feeling_review || '')
        },
    ];

    // ==========================================
    // FIELD EDIT VIEW (Full Screen Overlay)
    // ==========================================
    const renderFieldEdit = (item: typeof detailItems[0]) => {
        return (
            <div className="fixed inset-0 z-[1100] bg-background flex flex-col animate-in fade-in duration-150">
                {/* Edit Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/50">
                    <button
                        onClick={cancelEdit}
                        className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <ChevronLeft className="w-5 h-5" />
                        <span className="text-sm">Back</span>
                    </button>

                    <h1 className="text-sm font-medium text-foreground">Edit {item.label}</h1>

                    <button
                        onClick={confirmEdit}
                        className="text-primary text-sm font-medium hover:text-primary/80 transition-colors"
                    >
                        Done
                    </button>
                </div>

                <div className="flex-1 px-4 py-6 overflow-y-auto">
                    <div className="p-6 relative z-10 bg-card border border-border rounded-2xl shadow-sm">
                        <h2 className="text-xl font-bold text-foreground mb-2">{item.label}</h2>

                        {/* Number input for amount */}
                        {item.type === 'number' && (
                            <div className="mt-4">
                                <div className="flex items-center gap-2">
                                    <span className="text-2xl text-muted-foreground">¥</span>
                                    <input
                                        type="number"
                                        value={tempValue}
                                        onChange={(e) => setTempValue(e.target.value)}
                                        placeholder="0"
                                        autoFocus
                                        className="flex-1 w-full text-3xl font-bold text-foreground bg-transparent border-none outline-none placeholder:text-muted/20"
                                    />
                                </div>
                                <div className="mt-4 h-px bg-border" />
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
                                                : "bg-muted border-border text-muted-foreground hover:bg-muted/80"
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
                                    className="w-full px-4 py-4 rounded-xl bg-input border border-input text-foreground text-lg focus:outline-none focus:ring-2 focus:ring-ring"
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
                                    className="w-full px-4 py-4 rounded-xl bg-input border border-input text-foreground text-lg placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
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
                                    className="w-full px-4 py-4 rounded-xl bg-input border border-input text-foreground text-lg placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
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
                                                        ? "bg-primary/20 text-primary border border-primary/30"
                                                        : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground border border-transparent"
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
                                                ? "bg-primary/20 border border-primary/30"
                                                : "bg-muted border border-border hover:bg-muted/80"
                                        )}
                                    >
                                        <span className={tempValue === option ? "text-primary font-medium" : "text-foreground"}>
                                            {option}
                                        </span>
                                        {tempValue === option && (
                                            <Check className="w-5 h-5 text-primary" />
                                        )}
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Feeling selector */}
                        {item.type === 'feeling' && (
                            <div className="mt-4 space-y-2">
                                {FEELING_OPTIONS.map((option) => (
                                    <button
                                        key={option.value}
                                        onClick={() => setTempValue(String(option.value))}
                                        className={cn(
                                            "w-full flex items-center gap-4 p-4 rounded-xl transition-all border-2",
                                            tempValue === String(option.value)
                                                ? "bg-white/10"
                                                : "bg-muted border-border hover:bg-muted/80"
                                        )}
                                        style={{
                                            borderColor: tempValue === String(option.value) ? option.color : undefined,
                                        }}
                                    >
                                        <span className="text-2xl">{option.emoji}</span>
                                        <span
                                            className="font-medium"
                                            style={{ color: tempValue === String(option.value) ? option.color : undefined }}
                                        >
                                            {option.label}
                                        </span>
                                        {tempValue === String(option.value) && (
                                            <Check className="w-5 h-5 ml-auto" style={{ color: option.color }} />
                                        )}
                                    </button>
                                ))}
                                <button
                                    onClick={() => setTempValue('')}
                                    className={cn(
                                        "w-full flex items-center justify-center p-3 rounded-xl transition-all border",
                                        !tempValue
                                            ? "bg-muted/50 border-muted-foreground/30 text-muted-foreground"
                                            : "border-border text-muted-foreground hover:bg-muted/50"
                                    )}
                                >
                                    Clear feeling
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Confirm button */}
                <div className="px-4 pb-8 pt-4 border-t border-border bg-muted/50">
                    <button
                        onClick={confirmEdit}
                        className="w-full py-4 rounded-2xl font-bold text-lg bg-primary text-primary-foreground hover:bg-primary/90 active:scale-[0.98] transition-all"
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
            className="fixed inset-0 z-[1000] bg-black/60 flex items-center justify-center p-4 animate-in fade-in duration-200"
            onClick={handleClose}
        >
            <div
                className="w-full max-w-md bg-card rounded-3xl border border-border shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/30 relative z-20">
                    <div>
                        <h1 className="text-base font-semibold text-foreground">
                            {isPreviewMode ? 'Edit Entry' : 'Edit Expense'}
                        </h1>
                        <p className="text-xs text-muted-foreground mt-0.5">Tap any field to edit</p>
                    </div>

                    <button
                        onClick={handleClose}
                        className="p-2 -mr-2 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg transition-colors"
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
                         rounded-xl bg-muted/30 border border-border/50
                         hover:bg-muted/50 hover:border-border
                         transition-all duration-150 group active:scale-[0.99]"
                        >
                            <span className="text-muted-foreground text-sm font-medium">{item.label}</span>

                            <div className="flex items-center gap-2">
                                <span className={`font-semibold ${item.colorClass || 'text-foreground'}`}>
                                    {item.value}
                                </span>
                                <span className="text-muted-foreground/50 group-hover:text-primary transition-colors text-sm">
                                    Edit
                                </span>
                            </div>
                        </button>
                    ))}
                </div>

                {/* Footer Actions */}
                <div className="p-4 border-t border-border bg-muted/30 flex flex-col gap-3 relative z-20">
                    <button
                        onClick={handleSave}
                        disabled={saving || !isValid}
                        className={cn(
                            "w-full py-3.5 rounded-xl font-bold text-lg transition-all duration-200 border-2",
                            saving || !isValid
                                ? "bg-muted border-input text-muted-foreground cursor-not-allowed"
                                : "bg-primary border-primary text-primary-foreground shadow-sm hover:shadow-md active:scale-[0.98]"
                        )}
                    >
                        {saving ? 'Saving...' : 'Save Transaction'}
                    </button>

                    {onDelete && !isPreviewMode && (
                        <button
                            onClick={handleDelete}
                            className="w-full py-3 rounded-xl text-sm font-medium text-destructive/80 hover:text-destructive hover:bg-destructive/5 transition-colors flex items-center justify-center gap-2"
                        >
                            <Trash2 className="w-4 h-4" />
                            Delete Transaction
                        </button>
                    )}

                    {!isValid && (
                        <p className="text-xs text-destructive text-center font-medium">
                            Amount, Category, and Target are required
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}

export default EditExpenseModal;
