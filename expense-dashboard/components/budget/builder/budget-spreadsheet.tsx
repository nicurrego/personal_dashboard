'use client';

import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { Save, Undo, Redo, RotateCcw } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

// Local imports
import { BUDGET_GROUPS } from './constants';
import { useBudgetData } from './hooks/use-budget-data';
import { useCategories } from './hooks/use-categories';
import { useMobileEdit } from './hooks/use-mobile-edit';
import { formatMoney, triggerHaptic, parseCurrencyInput } from './utils/formatters';
import type { AlertModalState } from './types';
import type { ChartType } from './components/charts/types';
import type { BudgetPercentages } from './components/summary-card';

// Components
import {
  SummaryCard,
  BudgetSection,
  MobileEditBar,
  ToolsFab,

  AlertModal,
  TipsModal,
  ViewModeModal,
  ExplanationModal,
  GraphModal,
} from './components';

interface BudgetSpreadsheetProps {
  onSave: (payload: { data: Record<string, number>, viewMode: string }) => void;
  isLoading: boolean;
  headerActions?: React.ReactNode;
  initialData?: Record<string, number> | null;
}

export default function BudgetSpreadsheet({ onSave, isLoading, headerActions, initialData }: BudgetSpreadsheetProps) {
  // Core data management
  const budgetData = useBudgetData();
  const {
    data,
    hasChanges,
    setHasChanges,
    initializeData,
    viewMode,
    setViewMode,
    columns,
    canUndo,
    canRedo,
    handleUndo,
    handleRedo,
    handleReset,
    recordHistory,
    getCellValue,
    calculateTotals,
    isAutoComplete,
    setIsAutoComplete,
    isRowAutoComplete,
    toggleRowAutoComplete,
    setAllRowsAutoComplete,
    MAX_MONTH_INDEX,
  } = budgetData;

  // Category management
  const categoryManager = useCategories(() => setHasChanges(true));
  const {
    categories,
    isEditingCategories,
    setIsEditingCategories,
    handleDeleteCategory,
    handleRenameCategory,
    handleAddCategory,
    getIncomeCategories,
    getFutureCategories,
    getLivingCategories,
    getPresentCategories,
  } = categoryManager;

  // Mobile edit bar
  const mobileEdit = useMobileEdit();
  const {
    selectedCell,
    setSelectedCell,
    mobileInputValue,
    setMobileInputValue,
    visualViewportOffset,
    inputRef,
  } = mobileEdit;

  // UI State
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});
  const [hiddenColumnIndices, setHiddenColumnIndices] = useState<number[]>([]);
  const [categoryColWidth, setCategoryColWidth] = useState(180);
  const [isResizeActive, setIsResizeActive] = useState(false);
  const [isTotalFixed, setIsTotalFixed] = useState(true);
  const [alertModal, setAlertModal] = useState<AlertModalState | null>(null);

  // Modal states
  const [tipsOpen, setTipsOpen] = useState(false);
  const [graphOpen, setGraphOpen] = useState(false);
  const [viewModeOpen, setViewModeOpen] = useState(false);
  const [explanationOpen, setExplanationOpen] = useState(false);
  const [explanationPercentages, setExplanationPercentages] = useState<BudgetPercentages>({ future: 0, living: 0, present: 0 });
  const [selectedChartType, setSelectedChartType] = useState<ChartType>('DONUT');

  // Refs
  const scrollRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const isScrolling = useRef(false);
  const isResizingRef = useRef(false);
  const resizeStartXRef = useRef(0);
  const resizeStartWidthRef = useRef(0);
  const initialDataLoadedRef = useRef(false);

  const startDate = useMemo(() => new Date(), []);

  // Load initial data if provided (for editing existing budget)
  useEffect(() => {
    if (initialData && Object.keys(initialData).length > 0 && !initialDataLoadedRef.current) {
      initializeData(initialData);
      initialDataLoadedRef.current = true;
    }
  }, [initialData, initializeData]);

  // Initialize Fixed Column state based on device width
  useEffect(() => {
    const checkMobile = () => {
      if (window.innerWidth < 768) {
        setIsTotalFixed(false);
      }
    };
    checkMobile();
  }, []);

  // Column resizing logic
  useEffect(() => {
    const handleMove = (clientX: number) => {
      if (!isResizingRef.current) return;
      const diff = clientX - resizeStartXRef.current;
      const newWidth = Math.max(70, Math.min(400, resizeStartWidthRef.current + diff));
      setCategoryColWidth(newWidth);
    };

    const handleMouseMove = (e: MouseEvent) => handleMove(e.clientX);
    const handleTouchMove = (e: TouchEvent) => handleMove(e.touches[0].clientX);

    const handleUp = () => {
      isResizingRef.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      document.body.style.touchAction = '';
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleUp);
    window.addEventListener('touchmove', handleTouchMove);
    window.addEventListener('touchend', handleUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleUp);
    };
  }, []);

  const startResizing = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    isResizingRef.current = true;
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    resizeStartXRef.current = clientX;
    resizeStartWidthRef.current = categoryColWidth;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    document.body.style.touchAction = 'none';
  }, [categoryColWidth]);



  // Alert/Confirm Action Handler
  const handleConfirmAction = useCallback((title: string, description: string, onConfirm: () => void) => {
    setAlertModal({
      isOpen: true,
      title,
      description,
      confirmText: "Yes, Apply",
      cancelText: "Cancel",
      onConfirm: () => {
        onConfirm();
        setAlertModal(null);
      },
      onCancel: () => setAlertModal(null)
    });
  }, []);

  // Header actions
  // Header actions - Local Implementation

  // Render the Toolbar (previously in global header)
  const Toolbar = (
    <div className="flex items-center gap-1">
      {/* History Actions - Icons Only */}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <button onClick={handleUndo} disabled={!canUndo} className={`p-2 rounded-full transition-colors ${!canUndo ? 'text-slate-700' : 'text-slate-400 hover:text-white hover:bg-white/10'}`}>
              <Undo className="w-5 h-5" />
            </button>
          </TooltipTrigger>
          <TooltipContent><p>Undo (Ctrl+Z)</p></TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <button onClick={handleRedo} disabled={!canRedo} className={`p-2 rounded-full transition-colors ${!canRedo ? 'text-slate-700' : 'text-slate-400 hover:text-white hover:bg-white/10'}`}>
              <Redo className="w-5 h-5" />
            </button>
          </TooltipTrigger>
          <TooltipContent><p>Redo (Ctrl+Y)</p></TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <button onClick={handleReset} className="p-2 rounded-full text-slate-400 hover:text-red-400 hover:bg-white/10 transition-colors">
              <RotateCcw className="w-5 h-5" />
            </button>
          </TooltipTrigger>
          <TooltipContent><p>Reset Budget</p></TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {/* Save Button - Icon Only */}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() => {
                triggerHaptic();
                onSave({ data, viewMode });
                setHasChanges(false);
              }}
              disabled={isLoading}
              className={`p-2 rounded-full transition-all flex items-center justify-center ml-2 ${hasChanges
                  ? 'text-black bg-growth-green hover:bg-growth-green/90 shadow-[0_0_15px_rgba(34,197,94,0.3)]'
                  : 'text-slate-400 hover:text-white hover:bg-white/10'
                }`}
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : (
                <Save className="w-5 h-5" />
              )}
            </button>
          </TooltipTrigger>
          <TooltipContent><p>{hasChanges ? 'Save Changes' : 'Saved'}</p></TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );


  // Handle cell value changes
  const handleCellChange = useCallback((categoryId: string, colIndex: number, span: number, newValue: string) => {
    const val = parseCurrencyInput(newValue);

    const applyChange = () => {
      const distributedVal = val / span;
      // Use per-row autocomplete setting instead of global
      const shouldPropagate = isRowAutoComplete(categoryId);
      const newData = { ...data };

      // Vertical Distribution (Span)
      for (let i = 0; i < span; i++) {
        const key = `${categoryId}-${colIndex + i}`;
        newData[key] = distributedVal;
      }

      // Horizontal Propagation (only if this row has autocomplete enabled)
      // Propagate from the current column to the end of the year
      if (shouldPropagate) {
        for (let i = colIndex + span; i < MAX_MONTH_INDEX; i++) {
          const key = `${categoryId}-${i}`;
          newData[key] = distributedVal;
        }
      }

      recordHistory(newData);
      triggerHaptic();
    };

    // Guard for aggregate views
    if (viewMode !== 'MONTHLY') {
      setAlertModal({
        isOpen: true,
        title: "Modify Aggregate Values?",
        description: `You are editing a consolidated view. This will overwrite ${span} individual monthly records with an average of ${formatMoney(val / span)} each. Proceed?`,
        confirmText: "Yes, Update",
        cancelText: "Cancel",
        onConfirm: () => {
          applyChange();
          setAlertModal(null);
        },
        onCancel: () => setAlertModal(null)
      });
      return;
    }

    applyChange();
  }, [data, viewMode, isRowAutoComplete, MAX_MONTH_INDEX, recordHistory]);

  // Mobile edit commit handler
  const handleCommitEdit = useCallback(() => {
    if (!selectedCell) return;

    if (selectedCell.type === 'cell' && selectedCell.colIndex !== undefined && selectedCell.span !== undefined) {
      handleCellChange(selectedCell.id, selectedCell.colIndex, selectedCell.span, mobileInputValue);
    } else if (selectedCell.type === 'category') {
      handleRenameCategory(selectedCell.id, mobileInputValue.trim(), '');
    } else if (selectedCell.type === 'add-category' && selectedCell.group) {
      handleAddCategory(selectedCell.group, mobileInputValue);
    }

    triggerHaptic();
    setSelectedCell(null);
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
  }, [selectedCell, mobileInputValue, handleCellChange, handleRenameCategory, handleAddCategory, setSelectedCell]);

  // Synced scrolling
  const onScroll = useCallback((e: React.UIEvent<HTMLDivElement>, id: string) => {
    if (isScrolling.current) return;
    isScrolling.current = true;
    const scrollLeft = e.currentTarget.scrollLeft;
    Object.entries(scrollRefs.current).forEach(([k, ref]) => {
      if (k !== id && ref) {
        ref.scrollLeft = scrollLeft;
      }
    });
    setTimeout(() => { isScrolling.current = false; }, 0);
  }, []);

  const toggleGroup = useCallback((group: string) => {
    setCollapsedGroups(prev => ({ ...prev, [group]: !prev[group] }));
  }, []);

  const toggleColumnVisibility = useCallback((index: number) => {
    setHiddenColumnIndices(prev => {
      if (prev.includes(index)) {
        return prev.filter(i => i !== index);
      }
      return [...prev, index];
    });
  }, []);

  // Calculate totals for summary card
  const summaryCol = columns[0] || { index: 0, span: 1 };
  const summaryTotals = calculateTotals(summaryCol.index, summaryCol.span);

  // Modal visibility check
  const isAnyModalOpen = explanationOpen || tipsOpen || graphOpen || viewModeOpen;

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isAnyModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isAnyModalOpen]);

  // Render section helper
  const renderSection = (
    title: string,
    groupKey: 'INCOME' | 'FUTURE' | 'LIVING' | 'PRESENT',
    filterFn: () => typeof categories,
    colorClass: string
  ) => (
    <BudgetSection
      key={groupKey}
      title={title}
      groupKey={groupKey}
      categories={filterFn()}
      columns={columns}
      colorClass={colorClass}
      isCollapsed={!!collapsedGroups[groupKey]}
      onToggleCollapse={() => toggleGroup(groupKey)}
      getCellValue={getCellValue}
      calculateGroupTotal={(colIndex, span) => {
        const totals = calculateTotals(colIndex, span);
        switch (groupKey) {
          case 'INCOME': return totals.income;
          case 'FUTURE': return totals.future;
          case 'LIVING': return totals.living;
          case 'PRESENT': return totals.present;
        }
      }}
      hiddenColumnIndices={hiddenColumnIndices}
      onToggleColumnVisibility={toggleColumnVisibility}
      categoryColWidth={categoryColWidth}
      isResizeActive={isResizeActive}
      onResizeToggle={() => setIsResizeActive(!isResizeActive)}
      onStartResizing={startResizing}
      isEditingCategories={isEditingCategories}
      onEditingCategoriesToggle={() => setIsEditingCategories(!isEditingCategories)}
      isTotalFixed={isTotalFixed}
      selectedCell={selectedCell}
      onCellSelect={setSelectedCell}
      onAddCategorySelect={() => {
        setSelectedCell({
          id: `add-${groupKey}`,
          type: 'add-category',
          group: groupKey,
          value: ""
        });
        triggerHaptic();
      }}
      onScroll={onScroll}
      scrollRef={(el) => { scrollRefs.current[groupKey] = el; }}
      isRowAutoComplete={isRowAutoComplete}
      onToggleRowAutoComplete={toggleRowAutoComplete}
      onValueChange={handleCellChange}
    />
  );

  return (
    <div className={`relative space-y-10 pb-48 ${isAnyModalOpen ? 'pointer-events-none select-none' : ''}`}>

      {/* Fixed Header + Summary Card */}
      <div className="fixed top-0 left-0 right-0 z-[90] bg-background border-b border-border">
        {/* Header Bar */}
        <div className="flex flex-row items-center justify-between gap-4 px-4 py-2">
          <div className="flex items-center gap-4 w-auto max-w-[1600px] mx-auto flex-1">
            <div className="flex items-center gap-4">
              {headerActions && <div>{headerActions}</div>}
            </div>
            <div className="flex-1" />
            <div className="flex justify-end">
              {Toolbar}
            </div>
          </div>
        </div>

        {/* Summary Card - Attached to header */}
        <div className="px-4 pb-4 max-w-[1600px] mx-auto">
          <SummaryCard
            totals={summaryTotals}
            onExplanationOpen={(percentages) => {
              triggerHaptic();
              setExplanationPercentages(percentages);
              setExplanationOpen(true);
            }}
            onGraphOpen={() => {
              triggerHaptic();
              setGraphOpen(true);
            }}
            selectedChartType={selectedChartType}
          />
        </div>
      </div>

      {/* Spacer for fixed header + summary card */}
      <div className="h-[220px] sm:h-[200px]" />


      {/* Budget Sections */}
      {renderSection('Income', 'INCOME', getIncomeCategories, 'text-white')}
      {renderSection('Future', 'FUTURE', getFutureCategories, BUDGET_GROUPS.FUTURE.color)}
      {renderSection('Living', 'LIVING', getLivingCategories, BUDGET_GROUPS.LIVING.color)}
      {renderSection('Present', 'PRESENT', getPresentCategories, BUDGET_GROUPS.PRESENT.color)}

      {/* Tools FAB - shown on mobile only (< lg screens) */}
      <div className="lg:hidden">
        <ToolsFab
          isAutoComplete={isAutoComplete}
          onAutoCompleteToggleAll={setAllRowsAutoComplete}
          isTotalFixed={isTotalFixed}
          onTotalFixedToggle={() => setIsTotalFixed(!isTotalFixed)}
          onTipsOpen={() => setTipsOpen(true)}
          onViewModeOpen={() => setViewModeOpen(true)}
          bottomOffset={selectedCell ? visualViewportOffset : 0}
          onConfirmAction={(title, description, onConfirm) => {
            setAlertModal({
              isOpen: true,
              title,
              description,
              confirmText: "Yes, Apply",
              cancelText: "Cancel",
              onConfirm: () => {
                onConfirm();
                setAlertModal(null);
              },
              onCancel: () => setAlertModal(null)
            });
          }}
        />
      </div>

      {/* Mobile Edit Bar */}
      {/* Mobile Edit Bar - Hidden on Desktop */}
      <div className="lg:hidden">
        {selectedCell && (
          <MobileEditBar
            selectedCell={selectedCell}
            mobileInputValue={mobileInputValue}
            onInputChange={setMobileInputValue}
            onCommit={handleCommitEdit}
            visualViewportOffset={visualViewportOffset}
            inputRef={inputRef as React.RefObject<HTMLInputElement>}
          />
        )}
      </div>

      {/* Modals */}
      {explanationOpen && (
        <ExplanationModal
          isOpen={explanationOpen}
          onClose={() => setExplanationOpen(false)}
          percentages={explanationPercentages}
        />
      )}

      {tipsOpen && (
        <TipsModal
          isOpen={tipsOpen}
          onClose={() => setTipsOpen(false)}
        />
      )}

      {graphOpen && (
        <GraphModal
          isOpen={graphOpen}
          onClose={() => setGraphOpen(false)}
          selectedChartType={selectedChartType}
          onChartTypeChange={setSelectedChartType}
          totals={summaryTotals}
        />
      )}

      {viewModeOpen && (
        <ViewModeModal
          isOpen={viewModeOpen}
          onClose={() => setViewModeOpen(false)}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          startYear={startDate.getFullYear()}
        />
      )}

      {alertModal && (
        <AlertModal modal={alertModal} />
      )}
    </div>
  );
}
