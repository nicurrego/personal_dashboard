'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

interface UseMobileInputReturn<T = unknown> {
  /** Currently selected item (cell, field, etc.) */
  selectedItem: T | null;
  /** Update the selected item */
  setSelectedItem: React.Dispatch<React.SetStateAction<T | null>>;
  /** Current input value */
  inputValue: string;
  /** Update the input value */
  setInputValue: React.Dispatch<React.SetStateAction<string>>;
  /** Offset from bottom for positioning above keyboard */
  keyboardOffset: number;
  /** Reference to attach to the input element */
  inputRef: React.RefObject<HTMLInputElement | null>;
  /** Whether the mobile keyboard is currently open */
  isKeyboardOpen: boolean;
  /** Scroll an element into view (with iOS Safari compatibility) */
  scrollIntoView: (element: Element | null, delay?: number) => void;
}

/**
 * Generic mobile input hook for handling virtual keyboard on mobile devices.
 * 
 * This hook provides:
 * - Keyboard height detection via visualViewport API
 * - iOS Safari compatible scrollIntoView with delay
 * - Auto-focus management
 * - Outside tap detection to dismiss input
 * 
 * Works with any type of "selected item" - cells, fields, inputs, etc.
 * 
 * @example
 * ```tsx
 * const { selectedItem, setSelectedItem, inputValue, setInputValue, keyboardOffset, inputRef } = useMobileInput<CellData>();
 * ```
 */
export function useMobileInput<T = unknown>(): UseMobileInputReturn<T> {
  const [selectedItem, setSelectedItem] = useState<T | null>(null);
  const [inputValue, setInputValue] = useState("");
  const [keyboardOffset, setKeyboardOffset] = useState(0);
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Store initial window height to detect keyboard
  const initialWindowHeight = useRef<number>(0);
  
  // Initialize height reference
  useEffect(() => {
    if (typeof window !== 'undefined') {
      initialWindowHeight.current = window.innerHeight;
    }
  }, []);

  /**
   * Scroll element into view with iOS Safari compatibility.
   * iOS requires a delay for scrollIntoView to work correctly when keyboard is appearing.
   */
  const scrollIntoView = useCallback((element: Element | null, delay = 300) => {
    if (!element) return;
    
    // Use setTimeout for iOS Safari compatibility
    setTimeout(() => {
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'nearest'
      });
    }, delay);
  }, []);

  /**
   * Track visual viewport changes for keyboard detection.
   * This is the most reliable cross-platform method.
   */
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const updateViewportOffset = () => {
      // Method 1: Use visualViewport API if available (most accurate)
      if (window.visualViewport) {
        const vv = window.visualViewport;
        const keyboardHeight = window.innerHeight - vv.height;
        
        // Keyboard is considered open if more than 150px difference
        const isOpen = keyboardHeight > 150;
        
        setIsKeyboardOpen(isOpen);
        setKeyboardOffset(Math.max(0, keyboardHeight));
        return;
      }
      
      // Method 2: Fallback - compare against initial height
      if (initialWindowHeight.current > 0) {
        const keyboardHeight = initialWindowHeight.current - window.innerHeight;
        const isOpen = keyboardHeight > 150;
        
        setIsKeyboardOpen(isOpen);
        setKeyboardOffset(Math.max(0, keyboardHeight));
      }
    };

    // Initial check
    updateViewportOffset();

    // Listen to visualViewport events (works on modern mobile browsers)
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', updateViewportOffset);
      window.visualViewport.addEventListener('scroll', updateViewportOffset);
    }
    
    // Also listen to window resize as fallback
    window.addEventListener('resize', updateViewportOffset);

    return () => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', updateViewportOffset);
        window.visualViewport.removeEventListener('scroll', updateViewportOffset);
      }
      window.removeEventListener('resize', updateViewportOffset);
    };
  }, []);

  /**
   * When an item is selected, scroll it into view and focus the input.
   */
  useEffect(() => {
    if (!selectedItem) return;

    // Find and scroll the selected element into view
    const selectedElement = document.querySelector('[data-selected="true"]');
    
    // Use a longer delay on iOS to wait for keyboard animation
    const isIOS = typeof navigator !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent);
    const delay = isIOS ? 400 : 300;
    
    scrollIntoView(selectedElement, delay);
    
    // Auto-focus the input field after a short delay
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
    
  }, [selectedItem, scrollIntoView]);

  /**
   * Handle outside taps to dismiss the input.
   */
  useEffect(() => {
    const handleOutsideTap = (e: TouchEvent | MouseEvent) => {
      if (!selectedItem) return;
      
      const target = e.target as HTMLElement;
      
      // Don't dismiss if tapping inside the mobile input bar
      if (target.closest('.mobile-input-bar')) return;
      
      // Don't dismiss if tapping on table cells (to allow selection change)
      if (target.closest('td')) return;
      
      // Don't dismiss if tapping on buttons
      if (target.closest('button')) return;
      
      // Dismiss the input mode
      setSelectedItem(null);
      
      // Blur any focused element
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
    };

    document.addEventListener('touchstart', handleOutsideTap, { passive: true });
    document.addEventListener('mousedown', handleOutsideTap);

    return () => {
      document.removeEventListener('touchstart', handleOutsideTap);
      document.removeEventListener('mousedown', handleOutsideTap);
    };
  }, [selectedItem]);

  return {
    selectedItem,
    setSelectedItem,
    inputValue,
    setInputValue,
    keyboardOffset,
    inputRef,
    isKeyboardOpen,
    scrollIntoView,
  };
}
