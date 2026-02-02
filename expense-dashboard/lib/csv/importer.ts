import type { Expense } from '@/types';
import { ImportResult, ImportError, ImportWarning, ImportStats } from './types';
import { EXPECTED_HEADERS } from './constants';
import { parseCSVLine } from './parser';
import { detectColumnMapping } from './mapper';
import { parseDate, parseValue, cleanString } from './cleaner';
import { normalizeTarget, normalizeCategory } from './normalizer';

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
