'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { DEFAULT_CATEGORIES, INCOME_CATEGORIES } from '../constants';
import type { ViewMode, ColumnDef, BudgetTotals } from '../types';
import { triggerHaptic } from '../utils/formatters';

const MAX_MONTH_INDEX = 300; // Up to 25 years
const MAX_HISTORY_SIZE = 50;

interface UseBudgetDataReturn {
  // Data state
  data: Record<string, number>;
  setData: React.Dispatch<React.SetStateAction<Record<string, number>>>;
  initializeData: (newData: Record<string, number>) => void;
  hasChanges: boolean;
  setHasChanges: React.Dispatch<React.SetStateAction<boolean>>;
  
  // View mode
  viewMode: ViewMode;
  setViewMode: React.Dispatch<React.SetStateAction<ViewMode>>;
  columns: ColumnDef[];
  
  // History
  canUndo: boolean;
  canRedo: boolean;
  handleUndo: () => void;
  handleRedo: () => void;
  handleReset: () => void;
  recordHistory: (newData: Record<string, number>) => void;
  
  // Calculations
  getCellValue: (categoryId: string, colIndex: number, span: number) => number;
  calculateTotals: (colIndex: number, span: number) => BudgetTotals;
  
  // Auto-complete (per-row)
  rowAutoComplete: Record<string, boolean>;
  isRowAutoComplete: (categoryId: string) => boolean;
  toggleRowAutoComplete: (categoryId: string) => void;
  setAllRowsAutoComplete: (value: boolean) => void;
  
  // Legacy global flag (derived from individual rows)
  isAutoComplete: boolean;
  setIsAutoComplete: React.Dispatch<React.SetStateAction<boolean>>;
  
  // Constants
  MAX_MONTH_INDEX: number;
}

export function useBudgetData(): UseBudgetDataReturn {
  const [data, setData] = useState<Record<string, number>>({});
  const [hasChanges, setHasChanges] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('MONTHLY');
  
  // Per-row autocomplete: defaults to true for all categories
  const [rowAutoComplete, setRowAutoComplete] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    [...DEFAULT_CATEGORIES, ...INCOME_CATEGORIES].forEach(cat => {
      initial[cat.id] = true; // Default: autocomplete enabled for all
    });
    return initial;
  });
  
  // Legacy global state (for backward compatibility)
  const [isAutoComplete, setIsAutoComplete] = useState(true);
  
  // History for undo/redo
  const [history, setHistory] = useState<Record<string, number>[]>([{}]);
  const [historyIndex, setHistoryIndex] = useState(0);
  
  const startDate = useMemo(() => new Date(), []);
  
  // Generate columns based on view mode
  const columns = useMemo((): ColumnDef[] => {
    switch (viewMode) {
      case 'MONTHLY':
        return Array.from({ length: 12 }, (_, i) => {
          const d = new Date(startDate.getFullYear(), startDate.getMonth() + i, 1);
          return { label: d.toLocaleString('default', { month: 'short' }), index: i, span: 1 };
        });
      case 'QUARTERLY':
        return Array.from({ length: 4 }, (_, i) => ({ label: `Q${i + 1}`, index: i * 3, span: 3 }));
      case 'SEMESTRAL':
        return Array.from({ length: 2 }, (_, i) => ({ label: `S${i + 1}`, index: i * 6, span: 6 }));
      case 'YEARLY':
        return Array.from({ length: 10 }, (_, i) => ({
          label: `${startDate.getFullYear() + i}`,
          index: i * 12,
          span: 12
        }));
      case '5_YEARS':
        return Array.from({ length: 5 }, (_, i) => {
          const startYear = startDate.getFullYear() + (i * 5);
          return {
            label: `${startYear}-${startYear + 4}`,
            index: i * 60,
            span: 60
          };
        });
      default:
        return [];
    }
  }, [viewMode, startDate]);
  
  // Record history for undo/redo
  const recordHistory = useCallback((newData: Record<string, number>) => {
    setHistory(prev => {
      const newHistory = prev.slice(0, historyIndex + 1);
      newHistory.push(newData);
      if (newHistory.length > MAX_HISTORY_SIZE) newHistory.shift();
      return newHistory;
    });
    setHistoryIndex(prev => Math.min(prev + 1, MAX_HISTORY_SIZE - 1));
    setData(newData);
    setHasChanges(true);
  }, [historyIndex]);
  
  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setData(history[newIndex]);
      setHasChanges(true);
      triggerHaptic();
    }
  }, [historyIndex, history]);
  
  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setData(history[newIndex]);
      setHasChanges(true);
      triggerHaptic();
    }
  }, [historyIndex, history]);
  
  const handleReset = useCallback(() => {
    if (window.confirm("Are you sure you want to clear all data and start over?")) {
      const empty = {};
      recordHistory(empty);
      triggerHaptic();
    }
  }, [recordHistory]);
  
  // Initialize data (for loading existing budget without marking as changed)
  const initializeData = useCallback((newData: Record<string, number>) => {
    setData(newData);
    setHistory([newData]);
    setHistoryIndex(0);
    setHasChanges(false);
  }, []);
  
  // Cell value calculation (aggregating across span)
  const getCellValue = useCallback((categoryId: string, colIndex: number, span: number): number => {
    let sum = 0;
    for (let i = 0; i < span; i++) {
      const key = `${categoryId}-${colIndex + i}`;
      sum += data[key] || 0;
    }
    return sum;
  }, [data]);
  
  // Calculate totals for a column
  const calculateTotals = useCallback((colIndex: number, span: number): BudgetTotals => {
    const totals: BudgetTotals = {
      income: 0,
      future: 0,
      living: 0,
      present: 0,
    };
    
    INCOME_CATEGORIES.forEach(cat => {
      totals.income += getCellValue(cat.id, colIndex, span);
    });
    
    DEFAULT_CATEGORIES.forEach(cat => {
      if (cat.group === 'FUTURE') totals.future += getCellValue(cat.id, colIndex, span);
      if (cat.group === 'LIVING') totals.living += getCellValue(cat.id, colIndex, span);
      if (cat.group === 'PRESENT') totals.present += getCellValue(cat.id, colIndex, span);
    });
    
    return totals;
  }, [getCellValue]);
  
  // Keyboard shortcuts for undo/redo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        handleUndo();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
        e.preventDefault();
        handleRedo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo, handleRedo]);
  
  // Unsaved changes warning
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasChanges]);
  
  // Per-row autocomplete helpers
  const isRowAutoComplete = useCallback((categoryId: string): boolean => {
    return rowAutoComplete[categoryId] ?? true;
  }, [rowAutoComplete]);
  
  const toggleRowAutoComplete = useCallback((categoryId: string) => {
    setRowAutoComplete(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId]
    }));
    triggerHaptic();
  }, []);
  
  const setAllRowsAutoComplete = useCallback((value: boolean) => {
    setRowAutoComplete(prev => {
      const updated: Record<string, boolean> = {};
      Object.keys(prev).forEach(key => {
        updated[key] = value;
      });
      // Also set any categories that might not be in the state yet
      [...DEFAULT_CATEGORIES, ...INCOME_CATEGORIES].forEach(cat => {
        updated[cat.id] = value;
      });
      return updated;
    });
    setIsAutoComplete(value);
    triggerHaptic();
  }, []);
  
  return {
    data,
    setData,
    initializeData,
    hasChanges,
    setHasChanges,
    viewMode,
    setViewMode,
    columns,
    canUndo: historyIndex > 0,
    canRedo: historyIndex < history.length - 1,
    handleUndo,
    handleRedo,
    handleReset,
    recordHistory,
    getCellValue,
    calculateTotals,
    rowAutoComplete,
    isRowAutoComplete,
    toggleRowAutoComplete,
    setAllRowsAutoComplete,
    isAutoComplete,
    setIsAutoComplete,
    MAX_MONTH_INDEX,
  };
}

