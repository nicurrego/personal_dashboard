/**
 * CSV Parser Module
 * 
 * @deprecated For new code, prefer using `importCSV` from `@/lib/csvImporter` 
 * which provides better error handling, validation, and data cleaning.
 * 
 * This module is maintained for backward compatibility.
 */

import { Expense } from './types';
import { importCSV } from './csvImporter';

/**
 * Parse CSV string into Expense objects
 * 
 * @deprecated Use `importCSV` from `@/lib/csvImporter` for production-ready imports.
 * This function is kept for backward compatibility.
 */
export function parseCSV(csvText: string): Expense[] {
  // Use the production-ready importer
  const result = importCSV(csvText);
  return result.data;
}

/**
 * Parse Budget CSV string into Budget objects
 */
export function parseBudgetCSV(csvText: string): import('./types').Budget[] {
  const lines = csvText.trim().split('\n');
  const budgetItems: import('./types').Budget[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const values = parseCSVLine(line);
    if (values.length < 5) continue;

    try {
      const budget: import('./types').Budget = {
        year: parseInt(values[0]) || 0,
        month: parseInt(values[1]) || 0,
        target: (values[2] as 'Living' | 'Present' | 'Future') || 'Living',
        category: values[3] || '',
        amount: parseFloat(values[4].replace(/,/g, '')) || 0
      };

      if (budget.year > 2000 && budget.amount >= 0) {
        budgetItems.push(budget);
      }
    } catch (error) {
      console.warn(`Failed to parse budget line ${i}:`, error);
    }
  }

  return budgetItems;
}

/**
 * Parse a single CSV line handling quoted fields
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  result.push(current.trim());
  return result;
}

/**
 * Get unique values from a field
 */
export function getUniqueValues(expenses: Expense[], field: keyof Expense): string[] {
  const unique = new Set(expenses.map(e => String(e[field])).filter(v => v));
  return Array.from(unique).sort();
}

/**
 * Get date range from expenses
 */
export function getDateRange(expenses: Expense[]): { start: Date; end: Date } {
  const dates = expenses.map(e => new Date(e.date)).filter(d => !isNaN(d.getTime()));

  return {
    start: new Date(Math.min(...dates.map(d => d.getTime()))),
    end: new Date(Math.max(...dates.map(d => d.getTime())))
  };
}
