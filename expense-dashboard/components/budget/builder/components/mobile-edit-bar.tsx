'use client';

/**
 * Budget-specific Mobile Edit Bar.
 * 
 * This is a thin wrapper around the generic MobileInputBar component,
 * specialized for the budget builder's cell editing interface.
 */

import { MobileInputBar } from '@/components/ui/mobile-input-bar';
import type { SelectedCell } from '../types';

interface BudgetMobileEditBarProps {
  selectedCell: SelectedCell;
  mobileInputValue: string;
  onInputChange: (value: string) => void;
  onCommit: () => void;
  visualViewportOffset: number;
  inputRef: React.RefObject<HTMLInputElement>;
}

/**
 * Mobile Edit Bar for the budget builder.
 * Uses the generic MobileInputBar with budget-specific settings.
 */
export function MobileEditBar({
  selectedCell,
  mobileInputValue,
  onInputChange,
  onCommit,
  inputRef,
}: BudgetMobileEditBarProps) {
  // Determine input mode and placeholder based on cell type
  const isValueCell = selectedCell.type === 'cell';
  const isCategoryEdit = selectedCell.type === 'category';
  const isAddCategory = selectedCell.type === 'add-category';

  // Get an appropriate label
  let label = 'Edit';
  if (isCategoryEdit) {
    label = 'Rename Category';
  } else if (isAddCategory) {
    label = 'New Category';
  } else if (isValueCell) {
    label = selectedCell.id || 'Enter Amount';
  }

  return (
    <MobileInputBar
      value={mobileInputValue}
      onChange={onInputChange}
      onSubmit={onCommit}
      inputRef={inputRef}
      inputMode={isValueCell ? 'decimal' : 'text'}
      placeholder={isValueCell ? 'Enter amount...' : 'Category name...'}
      label={label}
    />
  );
}
