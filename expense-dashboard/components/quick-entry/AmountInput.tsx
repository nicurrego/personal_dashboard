'use client';

import React, { useState, useRef, useEffect } from 'react';

interface AmountInputProps {
  value: number | null;
  onChange: (value: number | null) => void;
  onSubmit?: () => void;
  currency?: string;
}

export function AmountInput({
  value,
  onChange,
  onSubmit,
  currency = '¥'
}: AmountInputProps) {
  const [displayValue, setDisplayValue] = useState(value?.toString() || '0');
  const inputRef = useRef<HTMLInputElement>(null);

  // Format number with commas
  const formatNumber = (num: number): string => {
    return num.toLocaleString('ja-JP');
  };

  // Parse display value to number
  const parseDisplayValue = (val: string): number | null => {
    const cleaned = val.replace(/[^0-9]/g, '');
    return cleaned ? parseInt(cleaned, 10) : null;
  };

  useEffect(() => {
    if (value !== null) {
      setDisplayValue(formatNumber(value));
    } else {
      setDisplayValue('0');
    }
  }, [value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let raw = e.target.value.replace(/[^0-9]/g, '');

    // If user types '5' while value is '0', result is '05'. We want '5'.
    if (raw.length > 1 && raw.startsWith('0')) {
      raw = raw.substring(1);
    }

    // If user deleted everything, back to '0'
    if (raw === '') {
      raw = '0';
    }

    const num = parseInt(raw, 10);

    if (!isNaN(num)) {
      setDisplayValue(formatNumber(num));
      // Logic: If 0, actual value is special? 
      // User allows 0 amount? usually yes, but previously we returned null. 
      // If we want 'empty' state logic downstream, we might keep 0 as valid or not.
      // Assuming 0 is valid amount or means empty? 
      // Previous logic: onChange(num). 
      // If 0 -> return 0.
      onChange(num === 0 ? null : num); // Treat 0 as null if that was original intent
      // Actually previous code: if num !== null ... onChange(num). 
      // else onChange(null).
    } else {
      setDisplayValue('0');
      onChange(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && value && onSubmit) {
      onSubmit();
    }
  };

  const handleClear = () => {
    setDisplayValue('0');
    onChange(null);
    inputRef.current?.focus();
  };

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Main amount display */}
      <div className="relative w-full">
        <div className="flex items-center justify-center gap-2">
          <span className="text-4xl font-bold text-secondary-text">{currency}</span>
          <input
            ref={inputRef}
            type="text"
            inputMode="numeric"
            value={value === null ? '0' : displayValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            // No placeholder needed if we force '0'
            className="text-6xl font-bold text-white bg-transparent 
                       text-center w-full max-w-[280px]
                       outline-none border-none
                       caret-cyber-cyan"
            autoFocus
            onClick={(e) => {
              // Force cursor to end if needed, though default behavior often works
              const input = e.target as HTMLInputElement;
              if (input.value === '0') {
                input.setSelectionRange(1, 1);
              }
            }}
            onFocus={(e) => {
              const input = e.target;
              if (input.value === '0') {
                // Defer slightly to override browser default select-all or placement
                setTimeout(() => input.setSelectionRange(1, 1), 10);
              }
            }}
          />
        </div>

        {/* Underline with glow */}
        <div className="mt-2 h-0.5 bg-gradient-to-r from-transparent via-cyber-cyan to-transparent" />
      </div>

      {/* Clear button */}
      {value && (
        <button
          onClick={handleClear}
          className="text-sm text-secondary-text hover:text-white transition-colors
                     px-4 py-2 rounded-lg border border-white/10 hover:border-white/30"
        >
          Clear
        </button>
      )}

      {/* Validation hint */}
      {/* Validation hint removed */}
    </div>
  );
}
