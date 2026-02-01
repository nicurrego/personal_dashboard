/**
 * useOfflineExpenses Hook
 * 
 * Provides offline-first CRUD operations for expenses.
 * All operations work offline and sync automatically when online.
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { v4 as uuidv4 } from 'uuid';
import {
    db,
    type LocalExpense,
    queueOperation,
    syncService,
    networkStatus,
    type SyncStatus
} from '@/lib/offline';
import type { Expense, ExpenseInput, ExpenseTarget } from '@/types/expense';

export interface UseOfflineExpensesOptions {
    /** Filter by year */
    year?: number;
    /** Filter by month */
    month?: number;
    /** Filter by target */
    target?: ExpenseTarget;
    /** Filter by category */
    category?: string;
    /** Auto-initialize sync service */
    autoInit?: boolean;
}

export interface UseOfflineExpensesReturn {
    /** List of expenses (filtered) */
    expenses: Expense[];
    /** Loading state */
    isLoading: boolean;
    /** Error state */
    error: string | null;
    /** Whether device is online */
    isOnline: boolean;
    /** Sync status */
    syncStatus: SyncStatus;
    /** Add a new expense */
    addExpense: (expense: ExpenseInput) => Promise<string>;
    /** Update an expense */
    updateExpense: (localId: string, updates: Partial<ExpenseInput>) => Promise<void>;
    /** Delete an expense */
    deleteExpense: (localId: string) => Promise<void>;
    /** Force sync with server */
    forceSync: () => Promise<void>;
    /** Refresh from server */
    refresh: () => Promise<void>;
}

/**
 * Convert LocalExpense to Expense format for components
 */
function toExpense(local: LocalExpense): Expense {
    return {
        id: local.localId, // Use localId as the ID in the UI
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
    };
}

export function useOfflineExpenses(
    options: UseOfflineExpensesOptions = {}
): UseOfflineExpensesReturn {
    const { year, month, target, category, autoInit = true } = options;

    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isOnline, setIsOnline] = useState(true);
    const [syncStatus, setSyncStatus] = useState<SyncStatus>({
        isSyncing: false,
        pendingCount: 0
    });
    const [isInitialized, setIsInitialized] = useState(false);

    // Live query from IndexedDB - automatically updates when data changes
    const localExpenses = useLiveQuery(
        async () => {
            let query = db.expenses.where('isDeleted').equals(0);

            // Note: Dexie compound queries are limited, so we filter in memory
            const all = await query.toArray();

            return all.filter(exp => {
                if (year !== undefined && exp.year !== year) return false;
                if (month !== undefined && exp.month !== month) return false;
                if (target && exp.target !== target) return false;
                if (category && exp.category !== category) return false;
                return true;
            });
        },
        [year, month, target, category],
        []
    );

    // Initialize sync service and network status
    useEffect(() => {
        if (!autoInit || isInitialized) return;

        const initAsync = async () => {
            try {
                // Subscribe to network status
                const unsubNetwork = networkStatus.subscribe(setIsOnline);

                // Subscribe to sync status
                const unsubSync = syncService.subscribe(setSyncStatus);

                // Initialize sync service
                await syncService.init();

                // If online and no local data, pull from server
                if (networkStatus.isOnline) {
                    const count = await db.expenses.count();
                    if (count === 0) {
                        await syncService.pullFromServer();
                    }
                }

                setIsInitialized(true);
                setIsLoading(false);

                return () => {
                    unsubNetwork();
                    unsubSync();
                };
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to initialize');
                setIsLoading(false);
            }
        };

        initAsync();
    }, [autoInit, isInitialized]);

    // Update loading state when query updates
    useEffect(() => {
        if (localExpenses !== undefined) {
            setIsLoading(false);
        }
    }, [localExpenses]);

    /**
     * Add a new expense
     */
    const addExpense = useCallback(async (expense: ExpenseInput): Promise<string> => {
        const localId = uuidv4();
        const now = Date.now();

        const newExpense: LocalExpense = {
            localId,
            syncStatus: 'pending',
            localUpdatedAt: now,
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
            isDeleted: false,
        };

        // Add to local DB
        await db.expenses.add(newExpense);

        // Queue for sync
        await queueOperation(localId, 'create', newExpense);

        // Try to sync immediately if online
        if (networkStatus.isOnline) {
            syncService.sync();
        }

        return localId;
    }, []);

    /**
     * Update an expense
     */
    const updateExpense = useCallback(async (
        localId: string,
        updates: Partial<ExpenseInput>
    ): Promise<void> => {
        const existing = await db.expenses.get(localId);
        if (!existing) {
            throw new Error('Expense not found');
        }

        const updatedData: Partial<LocalExpense> = {
            ...updates,
            localUpdatedAt: Date.now(),
            syncStatus: 'pending' as const,
        };

        // Update local DB
        await db.expenses.update(localId, updatedData);

        // Queue for sync
        await queueOperation(localId, 'update', updatedData, existing.serverId);

        // Try to sync immediately if online
        if (networkStatus.isOnline) {
            syncService.sync();
        }
    }, []);

    /**
     * Delete an expense
     */
    const deleteExpense = useCallback(async (localId: string): Promise<void> => {
        const existing = await db.expenses.get(localId);
        if (!existing) {
            throw new Error('Expense not found');
        }

        // Soft delete locally (mark as deleted)
        await db.expenses.update(localId, {
            isDeleted: true,
            localUpdatedAt: Date.now(),
        });

        // Queue for sync
        await queueOperation(localId, 'delete', {}, existing.serverId);

        // Try to sync immediately if online
        if (networkStatus.isOnline) {
            syncService.sync();
        }
    }, []);

    /**
     * Force sync with server
     */
    const forceSync = useCallback(async (): Promise<void> => {
        if (!networkStatus.isOnline) {
            throw new Error('Cannot sync while offline');
        }
        await syncService.sync();
    }, []);

    /**
     * Refresh data from server
     */
    const refresh = useCallback(async (): Promise<void> => {
        if (!networkStatus.isOnline) {
            throw new Error('Cannot refresh while offline');
        }
        setIsLoading(true);
        try {
            await syncService.pullFromServer();
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Convert local expenses to Expense format
    const expenses = (localExpenses || []).map(toExpense);

    return {
        expenses,
        isLoading,
        error,
        isOnline,
        syncStatus,
        addExpense,
        updateExpense,
        deleteExpense,
        forceSync,
        refresh,
    };
}

export default useOfflineExpenses;
