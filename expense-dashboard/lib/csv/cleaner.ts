/**
 * Parse date from various formats
 * Supports: YYYY-MM-DD, M/D/YYYY, MM/DD/YYYY, D-M-YYYY
 */
export function parseDate(dateStr: string): { date: string; format: string } | null {
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
export function parseValue(valueStr: string): { value: number; format: string } | null {
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
 * Clean and normalize string values
 */
export function cleanString(value: string): string {
    return value
        .trim()
        .replace(/\s+/g, ' ')        // Normalize whitespace
        .replace(/^["']|["']$/g, ''); // Remove surrounding quotes
}
