import { ColumnMapping } from './types';
import { EXPECTED_HEADERS, HEADER_ALIASES } from './constants';

/**
 * Detect column mapping from headers
 */
export function detectColumnMapping(headers: string[]): ColumnMapping | null {
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
