'use client';

import React from 'react';
import { QuickEntryData } from '@/lib/types';

interface ReviewCardProps {
  data: QuickEntryData;
  onEdit: (step: string) => void;
  onConfirm: () => void;
  isSubmitting?: boolean;
}

export function ReviewCard({ data, onEdit, onConfirm, isSubmitting }: ReviewCardProps) {
  const formatAmount = (value: number | null): string => {
    if (value === null) return '¥0';
    return '¥' + value.toLocaleString('ja-JP');
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getTargetColor = (target: string | null): string => {
    switch (target) {
      case 'Living': return 'text-cyber-cyan';
      case 'Present': return 'text-alert-amber';
      case 'Saving': return 'text-growth-green';
      case 'Investment': return 'text-flux-violet';
      default: return 'text-secondary-text';
    }
  };

  // Review items - NO emojis, just labels
  // Updated: 'Item' instead of 'Detail'
  const reviewItems = [
    { label: 'Amount', value: formatAmount(data.value), step: 'amount' },
    { label: 'Target', value: data.target || 'Not set', step: 'target', colorClass: getTargetColor(data.target) },
    { label: 'Category', value: data.category || 'Not set', step: 'category' },
    { label: 'Shop', value: data.shop || 'Not set', step: 'shop' },
    { label: 'Method', value: data.method || 'Not set', step: 'method' },
    { label: 'Location', value: data.location || 'Not set', step: 'location' },
    { label: 'Item', value: data.item || '—', step: 'item' },        // Renamed from 'Detail'
    { label: 'Context', value: data.context || 'Not set', step: 'context' },
    { label: 'Date', value: formatDate(data.date), step: 'date' },
  ];

  const isValid = data.value && data.category && data.target;

  return (
    <div className="flex flex-col gap-4">
      {/* Review items */}
      <div className="space-y-2">
        {reviewItems.map((item) => (
          <button
            key={item.step}
            onClick={() => onEdit(item.step)}
            className="w-full flex items-center justify-between p-4
                       rounded-xl bg-white/5 border border-white/10
                       hover:bg-white/10 hover:border-white/20
                       transition-all duration-150 group"
          >
            <span className="text-secondary-text text-sm font-medium">{item.label}</span>
            
            <div className="flex items-center gap-2">
              <span className={`font-semibold ${item.colorClass || 'text-white'}`}>
                {item.value}
              </span>
              <span className="text-secondary-text/50 group-hover:text-white transition-colors text-sm">
                Edit
              </span>
            </div>
          </button>
        ))}
      </div>

      {/* Confirm button - HIGH visibility with white text */}
      <button
        onClick={onConfirm}
        disabled={isSubmitting || !isValid}
        className={`
          w-full py-4 rounded-2xl font-bold text-lg
          transition-all duration-200 border-2
          ${isSubmitting || !isValid
            ? 'bg-white/10 border-white/10 text-secondary-text cursor-not-allowed'
            : 'bg-growth-green border-growth-green text-white shadow-[0_0_25px_rgba(34,197,94,0.5)] active:scale-[0.98]'
          }
        `}
      >
        {isSubmitting ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Saving...
          </span>
        ) : (
          'Save Transaction'
        )}
      </button>

      {/* Required fields hint */}
      {!isValid && (
        <p className="text-xs text-alert-amber text-center font-medium">
          Amount, Category, and Target are required
        </p>
      )}
    </div>
  );
}
