import type { Expense } from '@/types';

export interface ImportError {
    row: number;
    field?: string;
    value?: string;
    message: string;
}

export interface ImportWarning {
    row: number;
    field: string;
    originalValue: string;
    correctedValue: string;
    message: string;
}

export interface ImportStats {
    totalRows: number;
    validRows: number;
    skippedRows: number;
    errorsCount: number;
    warningsCount: number;
    dateFormatUsed: string;
    valueFormatUsed: string;
}

export interface ImportResult {
    success: boolean;
    data: Expense[];
    errors: ImportError[];
    warnings: ImportWarning[];
    stats: ImportStats;
}

export interface ColumnMapping {
    year: number;
    month: number;
    date: number;
    target: number;
    category: number;
    value: number;
    item: number;
    context: number;
    method: number;
    shop: number;
    location: number;
}
