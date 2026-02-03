'use client';

import { useRef, useState, useEffect } from 'react';
import { ChevronDown, ChevronRight, Pencil, Plus, EyeOff, Check } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import type { BudgetCategoryDef } from '../constants';
import type { ColumnDef, GroupKey, SelectedCell } from '../types';
import { formatMoney, triggerHaptic } from '../utils/formatters';
import { DesktopInlineEdit, DesktopCellOverlay } from './desktop-inline-edit';

interface BudgetSectionProps {
  title: string;
  groupKey: GroupKey;
  categories: BudgetCategoryDef[];
  columns: ColumnDef[];
  colorClass: string;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  getCellValue: (categoryId: string, colIndex: number, span: number) => number;
  calculateGroupTotal: (colIndex: number, span: number) => number;
  hiddenColumnIndices: number[];
  onToggleColumnVisibility: (index: number) => void;
  categoryColWidth: number;
  isResizeActive: boolean;
  onResizeToggle: () => void;
  onStartResizing: (e: React.MouseEvent | React.TouchEvent) => void;
  isEditingCategories: boolean;
  onEditingCategoriesToggle: () => void;
  isTotalFixed: boolean;
  selectedCell: SelectedCell | null;
  onCellSelect: (cell: SelectedCell) => void;
  onValueChange: (categoryId: string, colIndex: number, span: number, value: string) => void;
  onAddCategorySelect: () => void;
  onScroll: (e: React.UIEvent<HTMLDivElement>, id: string) => void;
  scrollRef: (el: HTMLDivElement | null) => void;
  // Per-row autocomplete
  isRowAutoComplete: (categoryId: string) => boolean;
  onToggleRowAutoComplete: (categoryId: string) => void;
}

export function BudgetSection({
  title,
  groupKey,
  categories,
  columns,
  colorClass,
  isCollapsed,
  onToggleCollapse,
  getCellValue,
  calculateGroupTotal,
  hiddenColumnIndices,
  onToggleColumnVisibility,
  categoryColWidth,
  isResizeActive,
  onResizeToggle,
  onStartResizing,
  isEditingCategories,
  onEditingCategoriesToggle,
  isTotalFixed,
  selectedCell,
  onCellSelect,
  onValueChange,
  onAddCategorySelect,
  onScroll,
  scrollRef,
  isRowAutoComplete,
  onToggleRowAutoComplete,
}: BudgetSectionProps) {
  const getBorderClass = () => {
    switch (groupKey) {
      case 'INCOME': return 'border-l-[var(--color-total)]';
      case 'FUTURE': return 'border-l-[var(--color-future)]';
      case 'LIVING': return 'border-l-[var(--color-living)]';
      case 'PRESENT': return 'border-l-[var(--color-present)]';
      default: return 'border-l-border';
    }
  };

  const getHeaderBgClass = () => {
    switch (groupKey) {
      case 'INCOME': return 'bg-[var(--color-total)]/10 text-[var(--color-total)]';
      case 'FUTURE': return 'bg-[var(--color-future)]/10 text-[var(--color-future)]';
      case 'LIVING': return 'bg-[var(--color-living)]/10 text-[var(--color-living)]';
      case 'PRESENT': return 'bg-[var(--color-present)]/10 text-[var(--color-present)]';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const bgClass = 'bg-card';

  return (
    <Collapsible
      open={!isCollapsed}
      onOpenChange={onToggleCollapse}
      className={`border border-border rounded-xl overflow-hidden shadow-sm transition-all duration-300 bg-card ${getBorderClass()} border-l-4`}
    >
      <CollapsibleTrigger asChild>
        <div
          className={`p-4 flex items-center justify-between cursor-pointer hover:opacity-80 transition-all border-b border-border ${getHeaderBgClass()}`}
        >
          <div className="flex items-center gap-2">
            {isCollapsed ? (
              <ChevronRight className="h-5 w-5" />
            ) : (
              <ChevronDown className="h-5 w-5" />
            )}
            <span className="font-bold text-sm tracking-wider uppercase">{title}</span>
          </div>
        </div>
      </CollapsibleTrigger>

      <CollapsibleContent>
        <div
          className="overflow-x-auto lg:scrollbar-thin lg:scrollbar-thumb-slate-700 lg:scrollbar-track-transparent mobile-scrollbar-hide"
          ref={scrollRef}
          onScroll={(e) => onScroll(e, groupKey)}
        >
          <table className="text-sm border-collapse w-max mx-auto">
            <thead>
              <tr>
                <th
                  className={`p-3 text-left sticky left-0 bg-card z-10 border-b border-border group/header transition-all duration-75 relative cursor-pointer hover:bg-muted/50 shadow-[2px_0_8px_rgba(0,0,0,0.05)] ${isResizeActive ? 'bg-muted/50 border-r border-primary/50' : ''}`}
                  style={{ width: categoryColWidth, minWidth: categoryColWidth, maxWidth: categoryColWidth }}
                  onClick={() => { onResizeToggle(); triggerHaptic(); }}
                >
                  <div className={`flex items-center w-full overflow-hidden ${categoryColWidth < 100 ? 'justify-center' : 'justify-between'}`}>
                    {categoryColWidth >= 100 && (
                      <span className="truncate select-none font-bold text-muted-foreground group-hover/header:text-foreground transition-colors">Category</span>
                    )}
                    <button
                      onClick={(e) => { e.stopPropagation(); onEditingCategoriesToggle(); triggerHaptic(); }}
                      className={`p-1.5 rounded transition-colors flex-shrink-0 ${categoryColWidth >= 100 ? 'ml-1' : ''} ${isEditingCategories ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:text-foreground hover:bg-muted'}`}
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {isResizeActive && (
                    <div
                      className="absolute top-0 right-0 h-full w-8 cursor-col-resize z-50 translate-x-1/2 touch-none flex items-center justify-center group/resizer"
                      onMouseDown={onStartResizing}
                      onTouchStart={onStartResizing}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="w-1.5 h-full bg-blue-500 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
                    </div>
                  )}
                </th>

                {columns.map(col => (
                  <ColumnHeader
                    key={col.index}
                    col={col}
                    isHidden={hiddenColumnIndices.includes(col.index)}
                    onToggleVisibility={() => onToggleColumnVisibility(col.index)}
                  />
                ))}

                <th className={`p-4 text-center font-bold text-foreground bg-muted/50 w-[140px] min-w-[140px] lg:w-[120px] lg:min-w-[120px] border-b border-border border-l border-border/50 select-none ${isTotalFixed ? 'sticky right-0 drop-shadow-sm z-20' : ''}`}>
                  Total
                </th>
              </tr>
            </thead>

            <tbody>
              {categories.map((cat) => (
                <CategoryRow
                  key={cat.id}
                  category={cat}
                  columns={columns}
                  categoryColWidth={categoryColWidth}
                  hiddenColumnIndices={hiddenColumnIndices}
                  getCellValue={getCellValue}
                  isTotalFixed={isTotalFixed}
                  isEditingCategories={isEditingCategories}
                  selectedCell={selectedCell}
                  onCellSelect={onCellSelect}
                  onValueChange={onValueChange}
                  isAutoComplete={isRowAutoComplete(cat.id)}
                  onToggleAutoComplete={() => onToggleRowAutoComplete(cat.id)}
                />
              ))}

              {isEditingCategories && (
                <tr className="h-8">
                  <td className="p-0 sticky left-0 bg-card z-10 border-r border-border align-middle">
                    <div className="flex justify-center w-full">
                      <button
                        onClick={onAddCategorySelect}
                        className={`flex items-center justify-center font-bold transition-colors uppercase rounded-full p-1.5 w-7 h-7 ${selectedCell?.type === 'add-category' && selectedCell.group === groupKey ? 'bg-primary text-primary-foreground ring-2 ring-ring' : 'bg-muted text-muted-foreground hover:text-foreground border border-border hover:border-border/80'}`}
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                  {columns.map((col) => (
                    <td key={`spacer-${col.index}`} className="p-0 border-l border-border" />
                  ))}
                  <td className={`p-0 border-l border-border bg-card ${isTotalFixed ? 'sticky right-0' : ''}`} />
                </tr>
              )}

              {/* Section Subtotal */}
              <tr className="bg-muted/30 border-t border-border font-medium">
                <td
                  className="p-3 px-4 text-muted-foreground sticky left-0 bg-card z-10 border-r border-border text-right transition-all duration-75"
                  style={{ width: categoryColWidth, minWidth: categoryColWidth, maxWidth: categoryColWidth }}
                >
                  <div className="truncate w-full">
                    {categoryColWidth < 100 ? 'Total' : `Total ${title}`}
                  </div>
                </td>
                {columns.map((col) => {
                  const val = calculateGroupTotal(col.index, col.span);
                  const isHidden = hiddenColumnIndices.includes(col.index);
                  if (isHidden) return <td key={col.index} className="p-0 w-2 min-w-[8px] bg-card" />;
                  return (
                    <td key={col.index} className="p-2 text-right text-foreground border-l border-border/50 font-mono bg-muted/30 w-[140px] min-w-[140px] lg:w-[105px] lg:min-w-[105px]">
                      <span className="truncate block w-full">{formatMoney(val)}</span>
                    </td>
                  );
                })}
                <td className={`p-2 text-right font-bold text-foreground border-l border-border bg-muted/50 w-[140px] min-w-[140px] lg:w-[120px] lg:min-w-[120px] ${isTotalFixed ? 'sticky right-0 drop-shadow-sm z-10' : ''}`}>
                  {formatMoney(columns.reduce((acc, col) => acc + calculateGroupTotal(col.index, col.span), 0))}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

// Column header sub-component
function ColumnHeader({
  col,
  isHidden,
  onToggleVisibility
}: {
  col: ColumnDef;
  isHidden: boolean;
  onToggleVisibility: () => void;
}) {
  if (isHidden) {
    return (
      <th
        key={col.index}
        className="p-0 w-2 min-w-[8px] bg-card cursor-pointer hover:bg-muted transition-colors border-r border-border relative group"
        onClick={onToggleVisibility}
        title={`Show ${col.label}`}
      >
        <div className="absolute inset-y-0 left-1/2 w-[2px] bg-muted-foreground group-hover:bg-primary rounded-full" />
      </th>
    );
  }

  return (
    <th
      key={col.index}
      className="p-4 text-center font-medium text-muted-foreground bg-muted/50 w-[140px] min-w-[140px] lg:w-[105px] lg:min-w-[105px] border-b border-border border-l border-border/50 select-none relative group"
      onContextMenu={(e) => {
        e.preventDefault();
        onToggleVisibility();
      }}
    >
      <span className="truncate block w-full">{col.label}</span>
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={onToggleVisibility}
          className="text-muted-foreground hover:text-foreground"
        >
          <EyeOff className="h-3 w-3" />
        </button>
      </div>
    </th>
  );
}

// Category row sub-component
function CategoryRow({
  category,
  columns,
  categoryColWidth,
  hiddenColumnIndices,
  getCellValue,
  isTotalFixed,
  isEditingCategories,
  selectedCell,
  onCellSelect,
  onValueChange,
  isAutoComplete,
  onToggleAutoComplete,
}: {
  category: BudgetCategoryDef;
  columns: ColumnDef[];
  categoryColWidth: number;
  hiddenColumnIndices: number[];
  getCellValue: (categoryId: string, colIndex: number, span: number) => number;
  isTotalFixed: boolean;
  isEditingCategories: boolean;
  selectedCell: SelectedCell | null;
  onCellSelect: (cell: SelectedCell) => void;
  onValueChange: (categoryId: string, colIndex: number, span: number, value: string) => void;
  isAutoComplete: boolean;
  onToggleAutoComplete: () => void;
}) {
  const [editingCell, setEditingCell] = useState<{ colIndex: number, startVal: string } | null>(null);

  // Global keydown handler for "Type to Edit" behavior
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only proceed if we have a selected cell in this row and NOT currently editing (to avoid double typing)
      // AND we are on desktop (width >= 1024). On mobile, the drawer handles input.
      if (!selectedCell || selectedCell.id !== category.id || editingCell || window.innerWidth < 1024) return;

      // Find the column index of the selected cell
      const colIndex = selectedCell.colIndex;
      if (colIndex === undefined) return;

      const col = columns.find(c => c.index === colIndex);
      if (!col) return;

      const currentValue = getCellValue(category.id, col.index, col.span);
      const valStr = currentValue > 0 ? currentValue.toString() : "";

      // Number or Decimal: Start editing with that char
      if (/^[0-9.]$/.test(e.key)) {
        // We prevent default to stop the key from doing anything else (like scrolling)
        // But we DON'T prevent default if it's a modifier combo, though the regex checks for single char
        setEditingCell({
          colIndex: col.index,
          startVal: e.key
        });
      }
      // Enter: Start editing with current value
      else if (e.key === 'Enter') {
        e.preventDefault();
        setEditingCell({
          colIndex: col.index,
          startVal: valStr
        });
      }
      // Backspace/Delete: Clear value
      else if (e.key === 'Backspace' || e.key === 'Delete') {
        // e.preventDefault(); // Don't prevent default backspace (might be navigation) unless we are sure.
        // Actually for grid editing, backspace usually clears.
        setEditingCell({
          colIndex: col.index,
          startVal: ""
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [category.id, selectedCell, editingCell, columns, getCellValue]);

  const handleEditCancel = () => {
    setEditingCell(null);
  };

  const handleEditCommit = (val: string, colIndex: number, span: number) => {
    // If val is the same as startVal, we might still want to trigger update if needed, but usually redundant.
    // However, if the user typed "7", startVal is "7", and they hit enter, val is "7".
    // We should save it.
    if (val !== undefined) {
      onValueChange(category.id, colIndex, span, val);
    }
    setEditingCell(null);
  };

  return (
    <tr className="group hover:bg-muted/50 transition-colors">
      <td
        className="p-3 px-4 text-muted-foreground sticky left-0 bg-card z-10 group-hover:bg-muted/50 transition-colors border-r border-border pl-2 transition-all duration-75 relative"
        style={{ width: categoryColWidth, minWidth: categoryColWidth, maxWidth: categoryColWidth }}
      >
        <div className="flex items-center w-full overflow-hidden gap-1">
          {/* Autocomplete checkbox - shown when editing */}
          {isEditingCategories && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleAutoComplete();
              }}
              className={`flex-shrink-0 w-5 h-5 rounded border flex items-center justify-center transition-colors ${isAutoComplete
                  ? 'bg-primary border-primary text-primary-foreground'
                  : 'border-muted-foreground hover:border-foreground'
                }`}
              title={isAutoComplete ? "Auto-fill enabled: first column value fills all" : "Auto-fill disabled: each column is independent"}
            >
              {isAutoComplete && <Check className="w-3 h-3" />}
            </button>
          )}

          <Popover>
            <PopoverTrigger asChild>
              <button
                className="text-left flex items-center hover:bg-muted rounded transition-colors truncate p-1.5 flex-1 min-w-0"
                onClick={triggerHaptic}
              >
                <span className="font-bold text-foreground truncate text-sm">
                  {category.emoji} {category.word}
                </span>
              </button>
            </PopoverTrigger>
            <PopoverContent side="right" className="w-auto py-2 px-3 bg-popover border-border shadow-md">
              <span className="text-sm font-bold text-foreground">{category.word}</span>
            </PopoverContent>
          </Popover>

          {isEditingCategories && (
            <div className="flex-shrink-0">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  triggerHaptic();
                  onCellSelect({
                    id: category.id,
                    type: 'category',
                    value: category.emoji ? `${category.emoji} ${category.word}` : category.word
                  });
                }}
                className="text-primary p-1.5 hover:scale-110 transition-transform bg-primary/10 rounded-full shadow-sm"
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </td>

      {columns.map((col) => {
        const isHidden = hiddenColumnIndices.includes(col.index);
        if (isHidden) {
          return (
            <td key={col.index} className="p-0 w-2 min-w-[8px] bg-muted/30 border-r border-border relative group">
              <div className="absolute inset-y-0 left-1/2 w-[1px] bg-border group-hover:bg-muted-foreground" />
            </td>
          );
        }

        const value = getCellValue(category.id, col.index, col.span);
        const isSelected = selectedCell?.id === category.id && selectedCell?.colIndex === col.index;
        const isEditing = editingCell?.colIndex === col.index;

        return (
          <td key={col.index} className={`p-1 border-l border-border/50 bg-transparent w-[140px] min-w-[140px] lg:w-[105px] lg:min-w-[105px] relative ${isSelected || isEditing ? 'z-20' : ''}`}>
            <div className={`w-full h-full rounded-lg overflow-hidden transition-all relative group/cell min-h-[44px] lg:min-h-[32px] flex items-center ${isSelected ? 'ring-2 ring-primary bg-primary/10' : ''}`} data-selected={isSelected ? 'true' : undefined}>

              {isEditing ? (
                <DesktopInlineEdit
                  value={editingCell.startVal}
                  onSubmit={(val) => handleEditCommit(val, col.index, col.span)}
                  onCancel={handleEditCancel}
                  className="rounded-lg"
                />
              ) : (
                <>
                  <button
                    onClick={() => {
                      triggerHaptic();
                      // Mobile behavior: select cell
                      onCellSelect({
                        id: category.id,
                        type: 'cell',
                        value: value > 0 ? value.toString() : "",
                        colIndex: col.index,
                        span: col.span,
                        rawVal: value
                      });
                    }}
                    onDoubleClick={() => {
                      // Desktop behavior: inline edit
                      setEditingCell({
                        colIndex: col.index,
                        startVal: value > 0 ? value.toString() : ""
                      });
                    }}
                    onKeyDown={(e) => {
                      // Type-to-Edit functionality
                      if (/^[0-9.]$/.test(e.key)) {
                        e.stopPropagation(); // Prevent default if needed
                        setEditingCell({
                          colIndex: col.index,
                          startVal: e.key // Start with the typed character
                        });
                      } else if (e.key === 'Enter') {
                        e.preventDefault();
                        setEditingCell({
                          colIndex: col.index,
                          startVal: value > 0 ? value.toString() : ""
                        });
                      } else if (e.key === 'Backspace' || e.key === 'Delete') {
                        setEditingCell({
                          colIndex: col.index,
                          startVal: "" // Clear value
                        });
                      }
                    }}
                    className="w-full h-full text-right p-3 lg:p-1.5 font-mono text-foreground hover:bg-muted/50 transition-colors whitespace-nowrap block text-sm lg:text-xs focus:outline-none focus:bg-muted rounded-lg"
                  >
                    {value > 0 ? formatMoney(value) : <span className="text-muted-foreground/50">—</span>}
                  </button>

                  <div className="hidden lg:block pointer-events-none">
                    <DesktopCellOverlay
                      onEdit={() => setEditingCell({
                        colIndex: col.index,
                        startVal: value > 0 ? value.toString() : ""
                      })}
                      className="rounded-lg"
                    />
                  </div>
                </>
              )}
            </div>
          </td>
        );
      })}

      <td className={`p-2 text-right font-bold text-foreground border-l border-border bg-muted/50 w-[140px] min-w-[140px] ${isTotalFixed ? 'sticky right-0 drop-shadow-sm z-10' : ''}`}>
        {formatMoney(columns.reduce((acc, col) => acc + getCellValue(category.id, col.index, col.span), 0))}
      </td>
    </tr>
  );
}
