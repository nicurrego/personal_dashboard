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
          color: '#FFFFFF', // White text for readability
          boxShadow: `0 0 20px ${color}60`
        };
      }
      // Variant-specific selected colors with WHITE text
      switch (variant) {
        case 'target':
          return {
            backgroundColor: '#06b6d4',
            borderColor: '#06b6d4',
            color: '#FFFFFF',
            boxShadow: '0 0 20px rgba(6,182,212,0.5)'
          };
        case 'method':
          return {
            backgroundColor: '#8B5CF6',
            borderColor: '#8B5CF6',
            color: '#FFFFFF',
            boxShadow: '0 0 20px rgba(139,92,246,0.5)'
          };
        case 'context':
          return {
            backgroundColor: '#f59e0b',
            borderColor: '#f59e0b',
            color: '#FFFFFF',
            boxShadow: '0 0 20px rgba(245,158,11,0.5)'
          };
        default:
          return {
            backgroundColor: '#22c55e',
            borderColor: '#22c55e',
            color: '#FFFFFF',
            boxShadow: '0 0 20px rgba(34,197,94,0.5)'
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
