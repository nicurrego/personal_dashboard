'use client';

import React, { useState, useRef } from 'react';
import { OptionChip } from './OptionChip';
import { QuickEntryOption } from '@/lib/types';

interface AutocompleteSelectProps {
  options: QuickEntryOption[];
  value: string;
  onChange: (value: string) => void;
  onSubmit?: () => void;
  placeholder?: string;
  allowCustom?: boolean;
  autoFocus?: boolean; // Only auto-focus for fields that need typing (Detail, etc.)
}

export function AutocompleteSelect({
  options,
  value,
  onChange,
  onSubmit,
  placeholder = 'Search or select...',
  allowCustom = true,
  autoFocus = false // Default to NOT auto-focusing - let user pick from chips first
}: AutocompleteSelectProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showInput, setShowInput] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sort options: selected first, then by recent count, then alphabetically
  const sortedOptions = [...options].sort((a, b) => {
    if (a.id === value) return -1;
    if (b.id === value) return 1;
    if ((b.recentCount || 0) !== (a.recentCount || 0)) {
      return (b.recentCount || 0) - (a.recentCount || 0);
    }
    return a.label.localeCompare(b.label);
  });

  // Filter options based on search
  const filteredOptions = searchTerm
    ? sortedOptions.filter(opt => 
        opt.label.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : sortedOptions;

  // Check if search term matches an existing option
  const exactMatch = options.find(
    opt => opt.label.toLowerCase() === searchTerm.toLowerCase()
  );

  const handleChipClick = (optionId: string) => {
    onChange(optionId);
    setSearchTerm('');
    setShowInput(false);
    if (onSubmit) {
      setTimeout(onSubmit, 150);
    }
  };

  const handleCustomSubmit = () => {
    if (searchTerm.trim() && !exactMatch) {
      onChange(searchTerm.trim());
      setSearchTerm('');
      setShowInput(false);
      if (onSubmit) {
        setTimeout(onSubmit, 150);
      }
    } else if (exactMatch) {
      handleChipClick(exactMatch.id);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCustomSubmit();
    }
  };

  const handleInputFocus = () => {
    setShowInput(true);
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Options grid - SHOW FIRST so users can tap to select */}
      <div className="flex flex-wrap gap-2">
        {filteredOptions.slice(0, 12).map((option) => (
          <OptionChip
            key={option.id}
            label={option.label}
            selected={value === option.id}
            onClick={() => handleChipClick(option.id)}
            recentCount={option.recentCount}
          />
        ))}
        
        {filteredOptions.length === 0 && searchTerm && (
          <p className="text-white text-sm py-2 px-3 bg-white/10 rounded-lg">
            No matches. Press Enter to add <strong>{searchTerm}</strong>
          </p>
        )}
      </div>

      {/* Show more indicator */}
      {filteredOptions.length > 12 && !searchTerm && (
        <p className="text-xs text-secondary-text text-center">
          + {filteredOptions.length - 12} more options
        </p>
      )}

      {/* Search/Custom input section - tap to open */}
      {allowCustom && (
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onFocus={handleInputFocus}
            onKeyDown={handleKeyDown}
            placeholder={showInput ? placeholder : "Tap to search or add new..."}
            autoFocus={autoFocus}
            className="w-full px-5 py-4 rounded-2xl
                       bg-white/5 border-2 border-white/15
                       text-white text-lg
                       outline-none focus:border-cyber-cyan focus:bg-cyber-cyan/5
                       placeholder:text-secondary-text
                       transition-all duration-200"
          />
          
          {/* Custom value submit button - HIGH visibility */}
          {searchTerm && !exactMatch && (
            <button
              onClick={handleCustomSubmit}
              className="absolute right-2 top-1/2 -translate-y-1/2
                         px-4 py-2 rounded-xl 
                         bg-growth-green text-white text-sm font-bold
                         hover:bg-growth-green/90 transition-colors
                         shadow-[0_0_15px_rgba(34,197,94,0.4)]"
            >
              + Add "{searchTerm}"
            </button>
          )}
        </div>
      )}
    </div>
  );
}
