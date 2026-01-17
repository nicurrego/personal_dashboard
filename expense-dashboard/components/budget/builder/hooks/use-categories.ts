'use client';

import { useState, useCallback } from 'react';
import { DEFAULT_CATEGORIES, INCOME_CATEGORIES, BudgetCategoryDef } from '../constants';
import { triggerHaptic } from '../utils/formatters';

interface UseCategoriesReturn {
  categories: BudgetCategoryDef[];
  setCategories: React.Dispatch<React.SetStateAction<BudgetCategoryDef[]>>;
  isEditingCategories: boolean;
  setIsEditingCategories: React.Dispatch<React.SetStateAction<boolean>>;
  
  // CRUD operations
  handleDeleteCategory: (id: string, name: string) => boolean;
  handleRenameCategory: (id: string, newWord: string, newEmoji?: string) => void;
  handleAddCategory: (group: string, name: string) => void;
  
  // Filtered lists
  getIncomeCategories: () => BudgetCategoryDef[];
  getFutureCategories: () => BudgetCategoryDef[];
  getLivingCategories: () => BudgetCategoryDef[];
  getPresentCategories: () => BudgetCategoryDef[];
}

export function useCategories(onCategoryChange?: () => void): UseCategoriesReturn {
  const [categories, setCategories] = useState<BudgetCategoryDef[]>(() => [
    ...INCOME_CATEGORIES,
    ...DEFAULT_CATEGORIES
  ]);
  const [isEditingCategories, setIsEditingCategories] = useState(false);
  
  const handleDeleteCategory = useCallback((id: string, name: string): boolean => {
    if (window.confirm(`Are you sure you want to delete "${name}"? This will remove all associated data.`)) {
      setCategories(prev => prev.filter(c => c.id !== id));
      onCategoryChange?.();
      triggerHaptic();
      return true;
    }
    return false;
  }, [onCategoryChange]);
  
  const handleRenameCategory = useCallback((id: string, newWord: string, newEmoji?: string) => {
    setCategories(prev => prev.map(c => 
      c.id === id 
        ? { ...c, word: newWord.trim(), ...(newEmoji !== undefined && { emoji: newEmoji }) }
        : c
    ));
    onCategoryChange?.();
    triggerHaptic();
  }, [onCategoryChange]);
  
  const handleAddCategory = useCallback((group: string, name: string) => {
    if (!name.trim()) return;
    
    const newId = `custom-${Date.now()}`;
    const newCat: BudgetCategoryDef = {
      id: newId,
      name: name.trim(),
      word: name.trim(),
      group: group as 'INCOME' | 'FUTURE' | 'LIVING' | 'PRESENT',
      emoji: '' // User types what they want
    };
    
    setCategories(prev => [...prev, newCat]);
    onCategoryChange?.();
    triggerHaptic();
  }, [onCategoryChange]);
  
  const getIncomeCategories = useCallback(() => 
    categories.filter(c => c.group === 'INCOME'), [categories]);
  
  const getFutureCategories = useCallback(() => 
    categories.filter(c => c.group === 'FUTURE'), [categories]);
  
  const getLivingCategories = useCallback(() => 
    categories.filter(c => c.group === 'LIVING'), [categories]);
  
  const getPresentCategories = useCallback(() => 
    categories.filter(c => c.group === 'PRESENT'), [categories]);
  
  return {
    categories,
    setCategories,
    isEditingCategories,
    setIsEditingCategories,
    handleDeleteCategory,
    handleRenameCategory,
    handleAddCategory,
    getIncomeCategories,
    getFutureCategories,
    getLivingCategories,
    getPresentCategories,
  };
}
