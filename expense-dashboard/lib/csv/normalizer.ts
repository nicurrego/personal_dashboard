import type { ExpenseTarget } from '@/types';
import { TARGET_MAPPING, CATEGORY_NORMALIZATION } from './constants';

/**
 * Normalize target value
 */
export function normalizeTarget(target: string): ExpenseTarget {
    const lower = target.toLowerCase().trim();
    return TARGET_MAPPING[lower] || 'Living';
}

/**
 * Normalize category value
 */
export function normalizeCategory(category: string): string {
    const lower = category.toLowerCase().trim();
    return CATEGORY_NORMALIZATION[lower] ||
        category.trim().replace(/\s+/g, ' ');
}
