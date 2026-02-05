'use client';

import React from 'react';

interface OptionChipProps {
  label: string;
  selected?: boolean;
  onClick: () => void;
  variant?: 'default' | 'target' | 'method' | 'context';
  color?: string;
  recentCount?: number;
}

export function OptionChip({
  label,
  selected = false,
  onClick,
  variant = 'default',
  color,
  recentCount
}: OptionChipProps) {

  // Get selection styling with HIGH contrast - WHITE text on colored background
  const getSelectionStyles = () => {
    if (selected) {
      // Use the color if provided for border and background
      if (color) {
        return {
          backgroundColor: color,
          borderColor: color,
          // Use dark text for the Teal color (#A9D9C7), white for others
          color: color === '#A9D9C7' ? '#1B4034' : '#FFFFFF',
        };
      }
      // Variant-specific selected colors with WHITE text
      switch (variant) {
        case 'target':
          return {
            backgroundColor: '#A9D9C7',
            borderColor: '#A9D9C7',
            color: '#1B4034', // Dark text on light teal
          };
        case 'method':
          return {
            backgroundColor: '#A9D9C7',
            borderColor: '#A9D9C7',
            color: '#1B4034',
          };
        case 'context':
          return {
            backgroundColor: '#A9D9C7',
            borderColor: '#A9D9C7',
            color: '#1B4034',
          };
        default:
          return {
            backgroundColor: '#A9D9C7',
            borderColor: '#A9D9C7',
            color: '#1B4034',
          };
      }
    }
    // Unselected state
    return {
      backgroundColor: 'rgba(255,255,255,0.05)',
      borderColor: 'rgba(255,255,255,0.15)',
      color: '#CCCCCC'
    };
  };

  const styles = getSelectionStyles();

  return (
    <button
      onClick={onClick}
      className={`
        relative flex items-center gap-2 px-5 py-3.5
        rounded-2xl border-2 transition-all duration-200
        active:scale-95 font-semibold text-base
        hover:border-white/40 hover:bg-white/10
      `}
      style={styles}
    >
      {/* Label */}
      <span className="whitespace-nowrap">
        {label}
      </span>

      {/* Recent usage indicator */}
      {recentCount && recentCount > 0 && !selected && (
        <span
          className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1
                     flex items-center justify-center
                     bg-white/30 text-[10px] font-bold text-white rounded-full"
        >
          {recentCount > 99 ? '99+' : recentCount}
        </span>
      )}

      {/* Selection checkmark */}
      {selected && (
        <span className="ml-1 font-bold">✓</span>
      )}
    </button>
  );
}
