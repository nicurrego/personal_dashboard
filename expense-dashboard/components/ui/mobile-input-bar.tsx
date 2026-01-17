'use client';

import { useEffect, useRef } from 'react';
import { Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MobileInputBarProps {
  /** Current input value */
  value: string;
  /** Callback when value changes */
  onChange: (value: string) => void;
  /** Callback when user submits (Enter key or check button) */
  onSubmit: () => void;
  /** Callback when user cancels (optional) */
  onCancel?: () => void;
  /** Placeholder text */
  placeholder?: string;
  /** Input mode for mobile keyboards */
  inputMode?: 'text' | 'decimal' | 'numeric' | 'tel' | 'email' | 'url' | 'search';
  /** Enter key hint for mobile keyboards */
  enterKeyHint?: 'done' | 'enter' | 'go' | 'next' | 'previous' | 'search' | 'send';
  /** Reference to the input element */
  inputRef?: React.RefObject<HTMLInputElement>;
  /** Additional className */
  className?: string;
  /** Show cancel button */
  showCancel?: boolean;
  /** Label above the input (optional) */
  label?: string;
}

/**
 * MobileInputBar - A floating input bar that appears above the mobile keyboard.
 * 
 * Features:
 * - Automatically positions above the virtual keyboard using visualViewport API
 * - Safe area padding for notched devices
 * - Submit on Enter key or check button
 * - Large touch targets for mobile
 * 
 * @example
 * ```tsx
 * <MobileInputBar
 *   value={inputValue}
 *   onChange={setInputValue}
 *   onSubmit={handleSubmit}
 *   inputMode="decimal"
 *   placeholder="Enter amount..."
 * />
 * ```
 */
export function MobileInputBar({
  value,
  onChange,
  onSubmit,
  onCancel,
  placeholder = "Enter value...",
  inputMode = "text",
  enterKeyHint = "done",
  inputRef: externalRef,
  className,
  showCancel = false,
  label,
}: MobileInputBarProps) {
  const internalRef = useRef<HTMLInputElement>(null);
  const inputRef = externalRef || internalRef;
  const barRef = useRef<HTMLDivElement>(null);

  // Position the bar above the keyboard using visualViewport
  useEffect(() => {
    if (!barRef.current) return;

    const updatePosition = () => {
      if (!barRef.current || !window.visualViewport) return;
      
      const vv = window.visualViewport;
      const bottomOffset = window.innerHeight - vv.height - vv.offsetTop;
      barRef.current.style.transform = `translateY(-${Math.max(0, bottomOffset)}px)`;
    };

    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', updatePosition);
      window.visualViewport.addEventListener('scroll', updatePosition);
      updatePosition();
    }

    return () => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', updatePosition);
        window.visualViewport.removeEventListener('scroll', updatePosition);
      }
    };
  }, []);

  return (
    <div
      ref={barRef}
      className={cn(
        "mobile-input-bar fixed left-0 right-0 bottom-0 z-[200]",
        "bg-zinc-900/95 backdrop-blur-lg border-t border-white/10",
        "shadow-[0_-10px_40px_rgba(0,0,0,0.5)]",
        className
      )}
      style={{
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
    >
      <div className="flex flex-col gap-2 p-3">
        {/* Optional label */}
        {label && (
          <span className="text-xs font-medium text-slate-400 uppercase tracking-wider px-1">
            {label}
          </span>
        )}
        
        <div className="flex items-center gap-2">
          {/* Cancel button (optional) */}
          {showCancel && onCancel && (
            <button
              onClick={onCancel}
              className="p-3 text-slate-400 hover:text-white rounded-xl hover:bg-white/5 transition-colors flex-shrink-0"
              type="button"
            >
              <X className="w-5 h-5" />
            </button>
          )}
          
          {/* Input field */}
          <div className="flex-1 min-w-0 bg-white/5 rounded-xl border border-white/10 focus-within:border-purple-500/50 focus-within:bg-black/50 transition-colors">
            <input
              ref={inputRef as React.RefObject<HTMLInputElement>}
              type="text"
              inputMode={inputMode}
              enterKeyHint={enterKeyHint}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  onSubmit();
                }
                if (e.key === 'Escape' && onCancel) {
                  e.preventDefault();
                  onCancel();
                }
              }}
              placeholder={placeholder}
              className="w-full bg-transparent border-none text-white p-3 focus:outline-none text-lg font-medium placeholder:text-slate-600"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck="false"
            />
          </div>
          
          {/* Submit button */}
          <button
            onClick={onSubmit}
            className="p-3.5 bg-purple-500 text-black rounded-xl font-bold shadow-lg shadow-purple-500/20 active:scale-95 transition-transform flex-shrink-0"
            type="button"
          >
            <Check className="w-6 h-6" />
          </button>
        </div>
      </div>
    </div>
  );
}
