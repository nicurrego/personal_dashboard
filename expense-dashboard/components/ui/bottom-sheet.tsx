'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BottomSheetProps {
  /** Whether the sheet is open */
  isOpen: boolean;
  /** Callback when sheet should close */
  onClose: () => void;
  /** Sheet content */
  children: React.ReactNode;
  /** Optional title displayed at the top */
  title?: string;
  /** Optional subtitle below the title */
  subtitle?: string;
  /** Show close button (default: true) */
  showCloseButton?: boolean;
  /** Show drag handle indicator (default: true) */
  showHandle?: boolean;
  /** Allow swipe down to close (default: true) */
  swipeToClose?: boolean;
  /** Additional className for the sheet container */
  className?: string;
  /** Callback for left swipe (optional, for pagination) */
  onSwipeLeft?: () => void;
  /** Callback for right swipe (optional, for pagination) */
  onSwipeRight?: () => void;
}

/**
 * BottomSheet - A mobile-friendly modal that slides up from the bottom.
 * 
 * Features:
 * - Swipe down to close
 * - Swipe left/right for pagination (optional)
 * - Touch-friendly with proper safe area padding
 * - Backdrop blur and click-to-close
 * - Haptic feedback support
 * 
 * @example
 * ```tsx
 * <BottomSheet
 *   isOpen={isOpen}
 *   onClose={() => setIsOpen(false)}
 *   title="Settings"
 * >
 *   <div>Content here</div>
 * </BottomSheet>
 * ```
 */
export function BottomSheet({
  isOpen,
  onClose,
  children,
  title,
  subtitle,
  showCloseButton = true,
  showHandle = true,
  swipeToClose = true,
  className,
  onSwipeLeft,
  onSwipeRight,
}: BottomSheetProps) {
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);
  const [touchEnd, setTouchEnd] = useState<{ x: number; y: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);

  // Haptic feedback helper
  const triggerHaptic = useCallback(() => {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(10);
    }
  }, []);

  // Handle swipe gestures
  const handleSwipe = useCallback(() => {
    if (!touchStart || !touchEnd) return;

    const deltaX = touchStart.x - touchEnd.x;
    const deltaY = touchStart.y - touchEnd.y;
    
    const isHorizontalSwipe = Math.abs(deltaX) > Math.abs(deltaY);
    const minSwipeDistance = 50;

    if (isHorizontalSwipe) {
      // Horizontal swipe for pagination
      if (deltaX > minSwipeDistance && onSwipeLeft) {
        onSwipeLeft();
        triggerHaptic();
      } else if (deltaX < -minSwipeDistance && onSwipeRight) {
        onSwipeRight();
        triggerHaptic();
      }
    } else if (swipeToClose) {
      // Vertical swipe to close
      if (deltaY < -minSwipeDistance) {
        onClose();
        triggerHaptic();
      }
    }

    setIsDragging(false);
  }, [touchStart, touchEnd, onSwipeLeft, onSwipeRight, swipeToClose, onClose, triggerHaptic]);

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center animate-in fade-in duration-200"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      
      {/* Sheet */}
      <div
        ref={sheetRef}
        className={cn(
          "relative w-full max-w-lg bg-zinc-950 border-t border-white/10 rounded-t-[2rem] shadow-2xl",
          "animate-in slide-in-from-bottom duration-300",
          "max-h-[85vh] overflow-hidden flex flex-col",
          className
        )}
        onClick={(e) => e.stopPropagation()}
        onTouchStart={(e) => {
          setTouchEnd(null);
          setTouchStart({
            x: e.targetTouches[0].clientX,
            y: e.targetTouches[0].clientY,
          });
          setIsDragging(true);
        }}
        onTouchMove={(e) => {
          setTouchEnd({
            x: e.targetTouches[0].clientX,
            y: e.targetTouches[0].clientY,
          });
        }}
        onTouchEnd={handleSwipe}
      >
        {/* Handle */}
        {showHandle && (
          <div className="flex justify-center pt-3 pb-2">
            <div className="w-10 h-1 bg-white/20 rounded-full" />
          </div>
        )}

        {/* Header */}
        {(title || showCloseButton) && (
          <div className="flex items-start justify-between px-6 pt-2 pb-4">
            <div className="flex-1">
              {title && (
                <h2 className="text-xl font-bold text-white">{title}</h2>
              )}
              {subtitle && (
                <p className="text-sm text-slate-400 mt-1">{subtitle}</p>
              )}
            </div>
            {showCloseButton && (
              <button
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-white transition-colors -mr-2"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 pb-safe">
          {children}
        </div>
      </div>
    </div>
  );
}

/**
 * BottomSheet with pagination dots indicator.
 */
interface BottomSheetPaginationProps {
  currentPage: number;
  totalPages: number;
  className?: string;
}

export function BottomSheetPagination({ 
  currentPage, 
  totalPages,
  className 
}: BottomSheetPaginationProps) {
  return (
    <div className={cn("flex justify-center gap-1.5 py-4", className)}>
      {Array.from({ length: totalPages }).map((_, i) => (
        <div
          key={i}
          className={cn(
            "w-1.5 h-1.5 rounded-full transition-colors",
            i === currentPage ? "bg-white" : "bg-white/20"
          )}
        />
      ))}
    </div>
  );
}
