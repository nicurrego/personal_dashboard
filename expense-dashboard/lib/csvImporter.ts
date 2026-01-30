/**
 * Production-ready CSV Importer
 * 
 * Handles multiple CSV formats, data cleaning, and common mistakes
 * for smooth expense data importation.
 */

import type { Expense, ExpenseTarget } from '@/types';

// ============================================================
// Types & Interfaces
// ============================================================

export interface ImportResult {
    success: boolean;
    data: Expense[];
    errors: ImportError[];
    warnings: ImportWarning[];
    stats: ImportStats;
}

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

// ============================================================
// Constants
// ============================================================

const EXPECTED_HEADERS = [
    'year', 'month', 'date', 'target', 'category', 'value',
    'item', 'context', 'method', 'shop', 'location'
];

const HEADER_ALIASES: Record<string, string> = {
    'detail': 'item',
    'description': 'item',
    'expense': 'item',
    'payment': 'method',
    'payment_method': 'method',
    'paymentmethod': 'method',
    'store': 'shop',
    'vendor': 'shop',
    'merchant': 'shop',
    'place': 'location',
    'area': 'location',
    'city': 'location',
    'amount': 'value',
    'price': 'value',
    'cost': 'value',
    'bucket': 'target',
    'goal': 'target',
    'type': 'category',
    'note': 'context',
    'notes': 'context',
    'reason': 'context',
};

const TARGET_MAPPING: Record<string, ExpenseTarget> = {
    'living': 'Living',
    'present': 'Present',
    'future': 'Future',
    'saving': 'Future',
    'savings': 'Future',
    'investment': 'Future',
    'investments': 'Future',
    'save': 'Future',
    'invest': 'Future',
};

const CATEGORY_NORMALIZATION: Record<string, string> = {
    'transportation': 'Transport',
    'transport': 'Transport',
    'transit': 'Transport',
    'travel & experiences': 'Travel & Experiences',
    'travel': 'Travel & Experiences',
    'hobbies & leisure': 'Hobbies & Leisure',
    'hobbies': 'Hobbies & Leisure',
    'leisure': 'Hobbies & Leisure',
    'entertainment': 'Enjoyment & Social Life',
    'social': 'Enjoyment & Social Life',
    'enjoyment & social life': 'Enjoyment & Social Life',
    'enjoyment': 'Enjoyment & Social Life',
    'utilities & services': 'Utilities & Services',
    'utilities': 'Utilities & Services',
    'services': 'Utilities & Services',
    'basic personal care': 'Basic Personal Care',
    'personal care': 'Basic Personal Care',
    'healthcare': 'Basic Personal Care',
    'health': 'Basic Personal Care',
    'subscriptions': 'Subscriptions',
    'subscription': 'Subscriptions',
    'food': 'Food',
    'groceries': 'Food',
    'dining': 'Food',
    'restaurants': 'Food',
    'clothing': 'Clothing',
    'clothes': 'Clothing',
    'apparel': 'Clothing',
    'fashion': 'Clothing',
    'housing': 'Housing',
    'rent': 'Housing',
    'home': 'Housing',
    '"life happens" fund': '"Life Happens" Fund',
    'life happens fund': '"Life Happens" Fund',
    'emergency': '"Life Happens" Fund',
    'emergency fund': '"Life Happens" Fund',
};

// ============================================================
// CSV Parser (handles quoted fields properly)
// ============================================================

function parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    let prevCharWasQuote = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];

        if (char === '"') {
            if (inQuotes && line[i + 1] === '"') {
                // Escaped quote
                current += '"';
                i++; // Skip next quote
            } else {
                inQuotes = !inQuotes;
                prevCharWasQuote = true;
            }
        } else if (char === ',' && !inQuotes) {
            result.push(current.trim());
            current = '';
            prevCharWasQuote = false;
        } else {
            current += char;
            prevCharWasQuote = false;
        }
    }

    result.push(current.trim());
    return result;
}

// ============================================================
// Data Cleaning Functions
// ============================================================

/**
 * Parse date from various formats
 * Supports: YYYY-MM-DD, M/D/YYYY, MM/DD/YYYY, D-M-YYYY
 */
function parseDate(dateStr: string): { date: string; format: string } | null {
    if (!dateStr || typeof dateStr !== 'string') {
        return null;
    }

    const cleaned = dateStr.trim();

    // ISO format: YYYY-MM-DD
    const isoMatch = cleaned.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
    if (isoMatch) {
        const [, year, month, day] = isoMatch;
        return {
            date: `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`,
            format: 'ISO'
        };
    }

    // US format: M/D/YYYY or MM/DD/YYYY
    const usMatch = cleaned.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (usMatch) {
        const [, month, day, year] = usMatch;
        return {
            date: `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`,
            format: 'US'
        };
    }

    // EU format: D-M-YYYY or DD-MM-YYYY
    const euMatch = cleaned.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
    if (euMatch) {
        const [, day, month, year] = euMatch;
        return {
            date: `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`,
            format: 'EU'
        };
    }

    // Try parsing as JavaScript Date
    const jsDate = new Date(cleaned);
    if (!isNaN(jsDate.getTime())) {
        return {
            date: jsDate.toISOString().split('T')[0],
            format: 'JS'
        };
    }

    return null;
}

/**
 * Parse value from various formats
 * Supports: 1234, 1,234, $1,234, $1234.56, "1,234"
 */
function parseValue(valueStr: string): { value: number; format: string } | null {
    if (!valueStr && valueStr !== '0') {
        return null;
    }

    const cleaned = String(valueStr)
        .trim()
        .replace(/^["']|["']$/g, '') // Remove quotes
        .replace(/^\$/, '')          // Remove dollar sign
        .replace(/^¥/, '')           // Remove yen sign
        .replace(/^€/, '')           // Remove euro sign
        .replace(/,/g, '');          // Remove commas

    const value = parseFloat(cleaned);

    if (isNaN(value)) {
        return null;
    }

    // Determine format used
    let format = 'plain';
    if (valueStr.includes('$')) format = 'USD';
    else if (valueStr.includes('¥')) format = 'JPY';
    else if (valueStr.includes(',')) format = 'comma';

    return { value, format };
}

/**
 * Normalize target value
 */
function normalizeTarget(target: string): ExpenseTarget {
    const lower = target.toLowerCase().trim();
    return TARGET_MAPPING[lower] || 'Living';
}

/**
 * Normalize category value
 */
function normalizeCategory(category: string): string {
    const lower = category.toLowerCase().trim();
    return CATEGORY_NORMALIZATION[lower] ||
        category.trim().replace(/\s+/g, ' ');
}

/**
 * Clean and normalize string values
 */
function cleanString(value: string): string {
    return value
        .trim()
        .replace(/\s+/g, ' ')        // Normalize whitespace
        .replace(/^["']|["']$/g, ''); // Remove surrounding quotes
}

// ============================================================
// Header Detection & Mapping
// ============================================================

/**
 * Detect column mapping from headers
 */
function detectColumnMapping(headers: string[]): ColumnMapping | null {
    const normalizedHeaders = headers.map(h =>
        h.toLowerCase().trim().replace(/[^a-z0-9]/g, '')
    );

    const mapping: Partial<ColumnMapping> = {};
    const foundColumns = new Set<string>();

    normalizedHeaders.forEach((header, index) => {
        // Check direct match
        const directMatch = EXPECTED_HEADERS.find(exp =>
            exp.replace(/[^a-z0-9]/g, '') === header
        );

        if (directMatch && !foundColumns.has(directMatch)) {
            (mapping as Record<string, number>)[directMatch] = index;
            foundColumns.add(directMatch);
            return;
        }

        // Check aliases
        for (const [alias, field] of Object.entries(HEADER_ALIASES)) {
            if (alias.replace(/[^a-z0-9]/g, '') === header && !foundColumns.has(field)) {
                (mapping as Record<string, number>)[field] = index;
                foundColumns.add(field);
                return;
            }
        }
    });

    // Check if we have minimum required columns
    const requiredColumns = ['year', 'month', 'date', 'target', 'category', 'value'];
    const hasRequired = requiredColumns.every(col => mapping[col as keyof ColumnMapping] !== undefined);

    if (!hasRequired) {
        // Try default positional mapping
        if (headers.length >= 11) {
            return {
                year: 0,
                month: 1,
                date: 2,
                target: 3,
                category: 4,
                value: 5,
                item: 6,
                context: 7,
                method: 8,
                shop: 9,
                location: 10,
            };
        }
        return null;
    }

    // Fill in optional columns with defaults or -1
    return {
        year: mapping.year ?? 0,
        month: mapping.month ?? 1,
        date: mapping.date ?? 2,
        target: mapping.target ?? 3,
        category: mapping.category ?? 4,
        value: mapping.value ?? 5,
        item: mapping.item ?? 6,
        context: mapping.context ?? 7,
        method: mapping.method ?? 8,
        shop: mapping.shop ?? 9,
        location: mapping.location ?? 10,
    };
}

// ============================================================
// Main Import Function
// ============================================================

/**
 * Import CSV data with full validation + cleaning
 */
export function importCSV(csvText: string): ImportResult {
    const errors: ImportError[] = [];
    const warnings: ImportWarning[] = [];
    const data: Expense[] = [];

    const lines = csvText.trim().split(/\r?\n/);

    if (lines.length < 2) {
        return {
            success: false,
            data: [],
            errors: [{ row: 0, message: 'CSV file is empty or has no data rows' }],
            warnings: [],
            stats: {
                totalRows: 0,
                validRows: 0,
                skippedRows: 0,
                errorsCount: 1,
                warningsCount: 0,
                dateFormatUsed: 'unknown',
                valueFormatUsed: 'unknown',
            }
        };
    }

    // Parse headers
    const headers = parseCSVLine(lines[0]);
    const mapping = detectColumnMapping(headers);

    if (!mapping) {
        return {
            success: false,
            data: [],
            errors: [{
                row: 0,
                message: 'Could not detect valid column headers. Expected: Year, Month, Date, Target, Category, Value, Item, Context, Method, Shop, Location'
            }],
            warnings: [],
            stats: {
                totalRows: lines.length - 1,
                validRows: 0,
                skippedRows: lines.length - 1,
                errorsCount: 1,
                warningsCount: 0,
                dateFormatUsed: 'unknown',
                valueFormatUsed: 'unknown',
            }
        };
    }

    let dateFormats = new Map<string, number>();
    let valueFormats = new Map<string, number>();
    let skippedRows = 0;

    // Process data rows
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) {
            skippedRows++;
            continue;
        }

        const values = parseCSVLine(line);
        const rowNum = i + 1; // 1-indexed for user display

        if (values.length < 6) {
            errors.push({
                row: rowNum,
                message: `Row has only ${values.length} columns, expected at least 6`
            });
            skippedRows++;
            continue;
        }

        try {
            // Parse Year
            const yearStr = values[mapping.year] || '';
            let year = parseInt(yearStr);
            if (isNaN(year) || year < 2000 || year > 2100) {
                errors.push({ row: rowNum, field: 'year', value: yearStr, message: 'Invalid year' });
                skippedRows++;
                continue;
            }

            // Parse Month
            const monthStr = values[mapping.month] || '';
            let month = parseInt(monthStr);
            if (isNaN(month) || month < 1 || month > 12) {
                errors.push({ row: rowNum, field: 'month', value: monthStr, message: 'Invalid month' });
                skippedRows++;
                continue;
            }

            // Parse Date
            const dateStr = values[mapping.date] || '';
            const parsedDate = parseDate(dateStr);
            if (!parsedDate) {
                errors.push({ row: rowNum, field: 'date', value: dateStr, message: 'Invalid date format' });
                skippedRows++;
                continue;
            }
            dateFormats.set(parsedDate.format, (dateFormats.get(parsedDate.format) || 0) + 1);

            // Parse Value
            const valueStr = values[mapping.value] || '';
            const parsedValue = parseValue(valueStr);
            if (!parsedValue || parsedValue.value <= 0) {
                errors.push({ row: rowNum, field: 'value', value: valueStr, message: 'Invalid or zero value' });
                skippedRows++;
                continue;
            }
            valueFormats.set(parsedValue.format, (valueFormats.get(parsedValue.format) || 0) + 1);

            // Parse Target (with normalization)
            const rawTarget = values[mapping.target] || 'Living';
            const target = normalizeTarget(rawTarget);
            if (rawTarget.toLowerCase() !== target.toLowerCase()) {
                warnings.push({
                    row: rowNum,
                    field: 'target',
                    originalValue: rawTarget,
                    correctedValue: target,
                    message: `Target "${rawTarget}" converted to "${target}"`
                });
            }

            // Parse Category (with normalization)
            const rawCategory = values[mapping.category] || 'Other';
            const category = normalizeCategory(rawCategory);
            if (rawCategory.toLowerCase() !== category.toLowerCase() && rawCategory.trim() !== category) {
                warnings.push({
                    row: rowNum,
                    field: 'category',
                    originalValue: rawCategory,
                    correctedValue: category,
                    message: `Category normalized`
                });
            }

            // Optional fields
            const item = cleanString(values[mapping.item] || '');
            const context = cleanString(values[mapping.context] || '');
            const method = cleanString(values[mapping.method] || '');
            const shop = cleanString(values[mapping.shop] || '');
            const location = cleanString(values[mapping.location] || '');

            // Check for whitespace warnings in optional fields
            const checkWhitespace = (field: string, original: string, cleaned: string) => {
                if (original && original !== cleaned && original.trim() !== cleaned) {
                    warnings.push({
                        row: rowNum,
                        field,
                        originalValue: original,
                        correctedValue: cleaned,
                        message: 'Whitespace normalized'
                    });
                }
            };

            if (values[mapping.location]) {
                checkWhitespace('location', values[mapping.location], location);
            }
            if (values[mapping.shop]) {
                checkWhitespace('shop', values[mapping.shop], shop);
            }

            // Create expense object
            const expense: Expense = {
                year,
                month,
                date: parsedDate.date,
                target,
                category,
                value: parsedValue.value,
                item,
                context,
                method,
                shop,
                location,
            };

            data.push(expense);

        } catch (error) {
            errors.push({
                row: rowNum,
                message: error instanceof Error ? error.message : 'Unknown parsing error'
            });
            skippedRows++;
        }
    }

    // Determine most common formats
    const getMostCommon = (map: Map<string, number>): string => {
        let max = 0;
        let result = 'unknown';
        map.forEach((count, format) => {
            if (count > max) {
                max = count;
                result = format;
            }
        });
        return result;
    };

    const stats: ImportStats = {
        totalRows: lines.length - 1,
        validRows: data.length,
        skippedRows,
        errorsCount: errors.length,
        warningsCount: warnings.length,
        dateFormatUsed: getMostCommon(dateFormats),
        valueFormatUsed: getMostCommon(valueFormats),
    };

    return {
        success: data.length > 0,
        data,
        errors,
        warnings,
        stats,
    };
}

/**
 * Quick validation without full import
 */
export function validateCSV(csvText: string): {
    valid: boolean;
    rowCount: number;
    hasCorrectHeaders: boolean;
    sampleErrors: ImportError[];
} {
    const lines = csvText.trim().split(/\r?\n/);

    if (lines.length < 2) {
        return {
            valid: false,
            rowCount: 0,
            hasCorrectHeaders: false,
            sampleErrors: [{ row: 0, message: 'File is empty' }]
        };
    }

    const headers = parseCSVLine(lines[0]);
    const mapping = detectColumnMapping(headers);

    if (!mapping) {
        return {
            valid: false,
            rowCount: lines.length - 1,
            hasCorrectHeaders: false,
            sampleErrors: [{ row: 0, message: 'Invalid headers' }]
        };
    }

    // Check first 5 data rows
    const sampleErrors: ImportError[] = [];
    const sampleSize = Math.min(5, lines.length - 1);

    for (let i = 1; i <= sampleSize; i++) {
        const values = parseCSVLine(lines[i]);
        if (values.length < 6) {
            sampleErrors.push({ row: i + 1, message: 'Insufficient columns' });
        } else {
            const year = parseInt(values[mapping.year]);
            const value = parseValue(values[mapping.value]);

            if (isNaN(year) || year < 2000) {
                sampleErrors.push({ row: i + 1, field: 'year', message: 'Invalid year' });
            }
            if (!value) {
                sampleErrors.push({ row: i + 1, field: 'value', message: 'Invalid value' });
            }
        }
    }

    return {
        valid: sampleErrors.length === 0,
        rowCount: lines.length - 1,
        hasCorrectHeaders: true,
        sampleErrors
    };
}

/**
 * Get preview of import results
 */
export function getImportPreview(csvText: string, maxRows: number = 10): {
    headers: string[];
    preview: Expense[];
    totalRows: number;
    format: {
        dateFormat: string;
        valueFormat: string;
    };
} {
    const result = importCSV(csvText);

    return {
        headers: EXPECTED_HEADERS,
        preview: result.data.slice(0, maxRows),
        totalRows: result.stats.validRows,
        format: {
            dateFormat: result.stats.dateFormatUsed,
            valueFormat: result.stats.valueFormatUsed,
        }
    };
}
