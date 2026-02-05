'use client';

import React from 'react';
import { QuickEntryData } from '@/types';
import { KIBO_COLORS } from '@/lib/constants/colors';
import { getFeelingLabel, getFeelingColor } from './FeelingInput';

interface ReviewCardProps {
  data: QuickEntryData;
  onEdit: (step: string) => void;
  onConfirm: () => void;
  isSubmitting?: boolean;
  error?: string | null;
}

export const ReviewCard = React.memo(function ReviewCard({ data, onEdit, onConfirm, isSubmitting, error }: ReviewCardProps) {
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
      case 'Living': return `text-[${KIBO_COLORS.Living}]`;
      case 'Present': return `text-[${KIBO_COLORS.Present}]`;
      case 'Saving': return `text-[${KIBO_COLORS.Saving}]`;
      case 'Future': return `text-[${KIBO_COLORS.Future}]`;
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
    { label: 'Feeling', value: getFeelingLabel(data.feeling), step: 'feeling', colorStyle: getFeelingColor(data.feeling) },
    { label: 'Date', value: formatDate(data.date), step: 'date' },
  ];

  return (
    <div className="flex flex-col h-full overflow-hidden gap-4">
      {/* Error Message */}
      {error && (
        <div className="shrink-0 p-3 rounded-xl bg-[#C24656]/20 border border-[#C24656]/30 text-[#EA5E6E] text-sm font-medium flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
        </div>
      )}

      {/* Review items */}
      <div className="flex-1 overflow-y-auto space-y-2 pb-2 min-h-0">
        {reviewItems.map((item) => (
          <button
            key={item.step}
            onClick={() => onEdit(item.step)}
            className="w-full flex items-center justify-between p-4
                       rounded-xl bg-white/5 border border-white/10
                       hover:bg-white/10 hover:border-white/20
                       transition-all duration-150 group"
          >
            <span className="text-secondary-text text-sm font-medium shrink-0">{item.label}</span>

            <div className="flex items-center gap-2 min-w-0 overflow-hidden pl-4">
              <span
                className={`font-semibold truncate text-right ${item.colorClass || (item.colorStyle ? '' : 'text-white')}`}
                style={item.colorStyle ? { color: item.colorStyle } : undefined}
              >
                {item.value}
              </span>
              <span className="text-secondary-text/50 group-hover:text-white transition-colors text-sm shrink-0">
                Edit
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
});
