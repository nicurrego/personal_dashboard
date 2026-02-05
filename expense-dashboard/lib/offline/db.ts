/**
 * Offline Database using Dexie (IndexedDB wrapper)
 * 
 * This is the local database that stores expenses and sync queue
 * for offline-first functionality.
 */

import Dexie, { type EntityTable } from 'dexie';
import type { Expense, ExpenseTarget } from '@/types/expense';

/**
 * Local expense record with sync metadata
 */
export interface LocalExpense {
    /** Local UUID - always present */
    localId: string;
    /** Server ID - only present after sync */
    serverId?: string;
    /** Sync status */
    syncStatus: 'synced' | 'pending' | 'conflict';
    /** Last modified timestamp (local) */
    localUpdatedAt: number;
    /** Last synced timestamp */
    lastSyncedAt?: number;
    /** Expense data */
    year: number;
    month: number;
    date: string;
    target: ExpenseTarget;
    category: string;
    value: number;
    item: string;
    context: string;
    method: string;
    shop: string;
    location: string;
    /** User's feeling at transaction time (1-5 scale) */
    feeling?: number;
    /** Reviewed feeling from retrospective prompt (1-5 scale) */
    feeling_review?: number;
    /** Soft delete flag */
    isDeleted: boolean;
}

/**
 * Operation types for sync queue
 */
export type SyncOperationType = 'create' | 'update' | 'delete';

/**
 * Sync queue entry - operations waiting to be synced
 */
export interface SyncQueueEntry {
    /** Auto-increment ID */
    id?: number;
    /** Local expense ID */
    localId: string;
    /** Server expense ID (for update/delete) */
    serverId?: string;
    /** Operation type */
    operation: SyncOperationType;
    /** Expense data snapshot at time of operation */
    data: Partial<LocalExpense>;
    /** Timestamp when operation was queued */
    createdAt: number;
    /** Number of sync attempts */
    attempts: number;
    /** Last error message if sync failed */
    lastError?: string;
}

/**
 * App metadata for tracking sync state
 */
export interface AppMeta {
    key: string;
    value: string | number | boolean;
}

/**
 * Dexie database class for offline storage
 */
class ExpenseDatabase extends Dexie {
    expenses!: EntityTable<LocalExpense, 'localId'>;
    syncQueue!: EntityTable<SyncQueueEntry, 'id'>;
    meta!: EntityTable<AppMeta, 'key'>;

    constructor() {
        super('ExpenseOfflineDB');

        // Schema version 1
        this.version(1).stores({
            expenses: 'localId, serverId, syncStatus, year, month, date, target, category, isDeleted, localUpdatedAt',
            syncQueue: '++id, localId, operation, createdAt',
            meta: 'key'
        });

        // Schema version 2 - Add feeling columns
        this.version(2).stores({
            expenses: 'localId, serverId, syncStatus, year, month, date, target, category, isDeleted, localUpdatedAt, feeling',
            syncQueue: '++id, localId, operation, createdAt',
            meta: 'key'
        });
    }
}

// Singleton database instance
export const db = new ExpenseDatabase();

/**
 * Convert server expense to local format
 */
export function serverToLocal(expense: Expense): LocalExpense {
    return {
        localId: expense.id || crypto.randomUUID(),
        serverId: expense.id,
        syncStatus: 'synced',
        localUpdatedAt: Date.now(),
        lastSyncedAt: Date.now(),
        year: expense.year,
        month: expense.month,
        date: expense.date,
        target: expense.target,
        category: expense.category,
        value: expense.value,
        item: expense.item || '',
        context: expense.context || '',
        method: expense.method || '',
        shop: expense.shop || '',
        location: expense.location || '',
        feeling: expense.feeling,
        feeling_review: expense.feeling_review,
        isDeleted: false,
    };
}

/**
 * Convert local expense to server format (for API calls)
 */
export function localToServer(local: LocalExpense): Omit<Expense, 'id'> & { id?: string } {
    return {
        id: local.serverId,
        year: local.year,
        month: local.month,
        date: local.date,
        target: local.target,
        category: local.category,
        value: local.value,
        item: local.item,
        context: local.context,
        method: local.method,
        shop: local.shop,
        location: local.location,
        feeling: local.feeling,
        feeling_review: local.feeling_review,
    };
}

/**
 * Clear all local data (useful for logout)
 */
export async function clearAllData(): Promise<void> {
    await db.expenses.clear();
    await db.syncQueue.clear();
    await db.meta.clear();
}

export default db;
