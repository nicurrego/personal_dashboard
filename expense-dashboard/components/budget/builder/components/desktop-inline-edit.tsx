'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DesktopInlineEditProps {
  value: string;
  onSubmit: (value: string) => void;
  onCancel: () => void;
  inputMode?: 'text' | 'decimal';
  className?: string;
}

/**
 * Desktop Inline Edit - An inline editor that appears directly in the cell.
 * Designed for mouse/keyboard interaction on desktop.
 * 
 * Features:
 * - ESC to cancel
 * - Enter to submit
 * - Tab to move to next cell (TODO)
 * - Auto-selects all text on focus
 */
export function DesktopInlineEdit({
  value,
  onSubmit,
  onCancel,
  inputMode = 'decimal',
  className,
}: DesktopInlineEditProps) {
  const [inputValue, setInputValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus and select all on mount
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, []);

  // Handle keyboard shortcuts
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onSubmit(inputValue);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onCancel();
    } else if (e.key === 'Tab') {
      // TODO: Implement tab navigation to next cell
      e.preventDefault();
      onSubmit(inputValue);
    }
  }, [inputValue, onSubmit, onCancel]);

  return (
    <div className={cn(
      "absolute inset-0 z-30 flex items-center",
      className
    )}>
      <input
        ref={inputRef}
        type="text"
        inputMode={inputMode === 'decimal' ? 'decimal' : 'text'}
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => onSubmit(inputValue)}
        className="w-full h-full bg-slate-900 text-white text-right font-mono px-3 lg:px-1.5 text-sm lg:text-xs focus:outline-none caret-purple-500 rounded-lg selection:bg-purple-500/30"
      />
    </div>
  );
}

/**
 * Desktop Cell Edit Overlay - Hover overlay with action buttons.
 * Shows on hover for desktop, provides quick actions.
 */
export function DesktopCellOverlay({
  onEdit,
  onClear,
  className,
}: {
  onEdit: () => void;
  onClear?: () => void;
  className?: string;
}) {
  return (
    <div className={cn(
      "absolute inset-0 z-20 opacity-0 group-hover:opacity-100 transition-opacity",
      "flex items-center justify-end gap-1 px-1 bg-gradient-to-l from-purple-900/50 to-transparent",
      className
    )}>
      {onClear && (
        <button
          onClick={(e) => { e.stopPropagation(); onClear(); }}
          className="p-1 rounded bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </div>
  );
}
