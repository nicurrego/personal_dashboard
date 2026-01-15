import { Expense } from './types';

/**
 * Parse CSV string into Expense objects
 */
export function parseCSV(csvText: string): Expense[] {
  const lines = csvText.trim().split('\n');
  const headers = lines[0].split(',');
  
  const expenses: Expense[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    // Handle CSV with potential commas in quoted fields
    const values = parseCSVLine(line);
    
    if (values.length < 11) continue; // Skip invalid rows
    
    try {
      const expense: Expense = {
        year: parseInt(values[0]) || 0,
        month: parseInt(values[1]) || 0,
        date: values[2],
        target: (values[3] as 'Living' | 'Present' | 'Future') || 'Living',
        category: values[4] || '',
        value: parseFloat(values[5].replace(/,/g, '')) || 0,
        detail: values[6] || '',
        context: values[7] || '',
        method: values[8] || '',
        shop: values[9] || '',
        location: values[10] || '',
      };
      
      // Only add valid expenses
      if (expense.year > 2000 && expense.value > 0) {
        expenses.push(expense);
      }
    } catch (error) {
      console.warn(`Failed to parse line ${i}:`, error);
    }
  }
  
  return expenses;
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
        amount: parseFloat(values[4]) || 0 // Assuming budget numbers don't have commas, but if they do: parseFloat(values[4].replace(/,/g, ''))
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
