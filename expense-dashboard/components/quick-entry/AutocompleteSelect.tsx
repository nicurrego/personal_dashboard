'use client';

import React, { useState, useRef } from 'react';
import { OptionChip } from './OptionChip';
import { QuickEntryOption } from '@/types';

// Transition delay for smooth navigation (in milliseconds)
const TRANSITION_DELAY_MS = 150;

interface AutocompleteSelectProps {
  options: QuickEntryOption[];
  value: string;
  onChange: (value: string) => void;
  onSubmit?: () => void;
  placeholder?: string;
  allowCustom?: boolean;
  autoFocus?: boolean;
  showSearch?: boolean;
  onSearchClose?: () => void;
}

export function AutocompleteSelect({
  options,
  value,
  onChange,
  onSubmit,
  placeholder = 'Search or select...',
  allowCustom = true,
  autoFocus = false,
  showSearch = false,
  onSearchClose
}: AutocompleteSelectProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showInput, setShowInput] = useState(showSearch);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync internal state with prop
  React.useEffect(() => {
    setShowInput(showSearch);
  }, [showSearch]);

  // Clear search term when search is hidden
  React.useEffect(() => {
    if (!showInput) {
      setSearchTerm('');
    } else {
      // Focus when shown
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer); // Cleanup to prevent memory leak
    }
  }, [showInput]);
  const sortedOptions = [...options].sort((a, b) => {
    if (a.id === value) return 1; // Selected at the very end (bottom)
    if (b.id === value) return -1;

    // Primary sort by count (ascending, so lower counts appear first)
    if ((a.recentCount || 0) !== (b.recentCount || 0)) {
      return (a.recentCount || 0) - (b.recentCount || 0);
    }
    // Secondary sort: A-Z alphabetical
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

  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on mount to show most frequent options
  React.useEffect(() => {
    if (containerRef.current) {
      // Immediate scroll attempt
      containerRef.current.scrollTop = containerRef.current.scrollHeight;

      // Robust scroll after layout/paint
      requestAnimationFrame(() => {
        if (containerRef.current) {
          containerRef.current.scrollTop = containerRef.current.scrollHeight;
        }
      });
    }
  }, [filteredOptions]); // Re-scroll when options change/filter

  const handleChipClick = (optionId: string) => {
    onChange(optionId);
    setSearchTerm('');
    if (onSubmit) {
      setTimeout(onSubmit, TRANSITION_DELAY_MS);
    }
  };

  const handleCustomSubmit = () => {
    if (searchTerm.trim() && !exactMatch) {
      onChange(searchTerm.trim());
      setSearchTerm('');
      if (onSubmit) {
        setTimeout(onSubmit, TRANSITION_DELAY_MS);
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

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Search/Custom input section - FIXED AT TOP */}
      {/* Search Toggle / Input Header */}
      {allowCustom && showInput && (
        <div className="shrink-0 mb-4 pt-1 flex justify-end px-2">
          <div className="relative w-full animate-in fade-in slide-in-from-top-2 duration-200">
            <input
              ref={inputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              className="w-full px-4 py-3 rounded-xl
                          bg-white/5 border border-white/10
                          text-white text-base
                          outline-none focus:border-[#A9D9C7] focus:bg-white/10
                          placeholder:text-secondary-text
                          transition-all duration-200 pr-12"
            />

            {/* Close / Submit logic */}
            {searchTerm && !exactMatch ? (
              <button
                onClick={handleCustomSubmit}
                className="absolute right-2 top-1/2 -translate-y-1/2
                            px-3 py-1.5 rounded-lg
                            bg-[#A9D9C7] text-[#1B4034] text-xs font-bold
                            hover:bg-[#A9D9C7]/90 transition-colors"
              >
                Add
              </button>
            ) : (
              <button
                onClick={() => {
                  setShowInput(false);
                  setSearchTerm('');
                  onSearchClose?.();
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-white/50 hover:text-white"
              >
                ✕
              </button>
            )}
          </div>

        </div>
      )}

      {/* Options grid - Scrollable Area */}
      {/* This container scrolls. The content inside is what overflows. */}
      {/* We use flex-col justify-end to start content at bottom of this container if it's small. */}
      {/* If it's large, overflow-y-auto handles scrolling. */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto min-h-0 relative -mx-2 px-2 pb-2" // Negative margin to scroll edge-to-edge
      >
        <div className="min-h-full flex flex-col justify-end">
          <div className="flex flex-wrap gap-2 content-end pb-4 pt-4">

            {filteredOptions.length === 0 && searchTerm && (
              <p className="text-secondary-text text-sm py-2 w-full text-center">
                No matches found.
              </p>
            )}

            {filteredOptions.map((option) => (
              <OptionChip
                key={option.id}
                label={option.label}
                selected={value === option.id}
                onClick={() => handleChipClick(option.id)}
                recentCount={option.recentCount}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
