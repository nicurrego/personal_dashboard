'use client';

/**
 * Budget-specific mobile edit hook.
 * 
 * This is a thin wrapper around the generic useMobileInput hook,
 * specialized for the budget builder's SelectedCell type.
 */

import { useMobileInput } from '@/hooks/use-mobile-input';
import type { SelectedCell } from '../types';

interface UseMobileEditReturn {
  selectedCell: SelectedCell | null;
  setSelectedCell: React.Dispatch<React.SetStateAction<SelectedCell | null>>;
  mobileInputValue: string;
  setMobileInputValue: React.Dispatch<React.SetStateAction<string>>;
  visualViewportOffset: number;
  inputRef: React.RefObject<HTMLInputElement | null>;
  isKeyboardOpen: boolean;
}

/**
 * Mobile edit hook for the budget builder.
 * Uses the generic useMobileInput hook with SelectedCell type.
 */
export function useMobileEdit(): UseMobileEditReturn {
  const {
    selectedItem,
    setSelectedItem,
    inputValue,
    setInputValue,
    keyboardOffset,
    inputRef,
    isKeyboardOpen,
  } = useMobileInput<SelectedCell>();

  return {
    selectedCell: selectedItem,
    setSelectedCell: setSelectedItem,
    mobileInputValue: inputValue,
    setMobileInputValue: setInputValue,
    visualViewportOffset: keyboardOffset,
    inputRef,
    isKeyboardOpen,
  };
}
