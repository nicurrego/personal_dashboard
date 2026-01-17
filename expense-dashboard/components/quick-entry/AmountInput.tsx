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
  const [displayValue, setDisplayValue] = useState(value?.toString() || '');
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
      setDisplayValue('');
    }
  }, [value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^0-9]/g, '');
    const num = parseDisplayValue(raw);
    
    if (num !== null) {
      setDisplayValue(formatNumber(num));
      onChange(num);
    } else {
      setDisplayValue('');
      onChange(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && value && onSubmit) {
      onSubmit();
    }
  };

  const handleClear = () => {
    setDisplayValue('');
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
            value={displayValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="0"
            className="text-6xl font-bold text-white bg-transparent 
                       text-center w-full max-w-[280px]
                       outline-none border-none
                       placeholder:text-white/20
                       caret-cyber-cyan"
            autoFocus
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
      {!value && (
        <p className="text-sm text-secondary-text animate-pulse">
          Enter an amount to continue
        </p>
      )}
    </div>
  );
}
