'use client';

import React, { useState, useRef, useEffect } from 'react';

interface DetailInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit?: () => void;
  placeholder?: string;
  maxLength?: number;
  autoFocus?: boolean;
}

export function DetailInput({ 
  value, 
  onChange, 
  onSubmit,
  placeholder = 'What was this for?',
  maxLength = 100,
  autoFocus = true // Default true for Detail since it's always unique
}: DetailInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (autoFocus) {
      inputRef.current?.focus();
    }
  }, [autoFocus]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && onSubmit) {
      onSubmit();
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Input container */}
      <div 
        className={`
          relative rounded-2xl border-2 transition-all duration-300
          ${isFocused 
            ? 'border-cyber-cyan bg-cyber-cyan/5' 
            : 'border-white/10 bg-white/5'}
        `}
      >
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          maxLength={maxLength}
          className="w-full px-5 py-4 bg-transparent text-white text-lg
                     outline-none placeholder:text-secondary-text"
        />
        
        {/* Character counter */}
        <div className="absolute right-4 bottom-4 text-xs text-secondary-text">
          {value.length}/{maxLength}
        </div>
      </div>

      {/* Optional hint */}
      <p className="text-sm text-secondary-text text-center">
        Brief description for your records
      </p>

      {/* Skip hint - detail is optional */}
      <p className="text-xs text-secondary-text/50 text-center">
        This field is optional • Press Enter or Next to continue
      </p>
    </div>
  );
}
