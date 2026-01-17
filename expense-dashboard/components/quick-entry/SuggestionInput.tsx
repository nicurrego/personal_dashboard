'use client';

import React, { useState, useRef, useEffect } from 'react';

interface SuggestionInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit?: () => void;
  suggestions: string[];
  placeholder?: string;
  maxLength?: number;
  hint?: string;
}

/**
 * Input field with tappable suggestions that INSERT text (not replace).
 * User can edit, add more text after tapping a suggestion.
 */
export function SuggestionInput({ 
  value, 
  onChange, 
  onSubmit,
  suggestions,
  placeholder = 'Type here...',
  maxLength = 100,
  hint
}: SuggestionInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    // Auto-focus on mount
    inputRef.current?.focus();
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && onSubmit) {
      onSubmit();
    }
  };

  // Handle suggestion tap - INSERT into input, don't replace
  const handleSuggestionTap = (suggestion: string) => {
    // If input is empty, just set the suggestion
    // If input has text, append with separator (or replace if it's a starting point)
    const newValue = value.trim() ? `${value.trim()} ${suggestion}` : suggestion;
    onChange(newValue);
    
    // Keep focus on input so user can continue typing
    inputRef.current?.focus();
  };

  // Filter suggestions based on current input
  const filteredSuggestions = suggestions.filter(s => 
    !value.toLowerCase().includes(s.toLowerCase())
  ).slice(0, 8); // Show max 8 suggestions

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

      {/* Suggestions - tapping inserts text */}
      {filteredSuggestions.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-xs text-secondary-text">Tap to insert:</p>
          <div className="flex flex-wrap gap-2">
            {filteredSuggestions.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => handleSuggestionTap(suggestion)}
                className="px-3 py-2 rounded-xl 
                           bg-white/5 border border-white/10
                           text-secondary-text text-sm
                           hover:bg-cyber-cyan/10 hover:border-cyber-cyan/30 hover:text-white
                           transition-all duration-150 active:scale-95"
              >
                + {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Hint text */}
      {hint && (
        <p className="text-sm text-secondary-text text-center">
          {hint}
        </p>
      )}

      {/* Optional/Skip hint */}
      <p className="text-xs text-secondary-text/50 text-center">
        This field is optional • Press Enter or Next to continue
      </p>
    </div>
  );
}
