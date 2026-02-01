/**
 * Sync Service
 * 
 * Handles synchronization between local IndexedDB and the server.
 * Processes the sync queue when online and handles conflict resolution.
 */

import { db, serverToLocal, localToServer, type LocalExpense, type SyncQueueEntry } from './db';
import { getPendingOperations, removeFromQueue, markAttempted } from './syncQueue';
import { networkStatus } from './networkStatus';
import type { Expense } from '@/types/expense';

type SyncCallback = (status: SyncStatus) => void;

export interface SyncStatus {
    isSyncing: boolean;
    pendingCount: number;
    lastSyncAt?: number;
    lastError?: string;
}

class SyncService {
    private listeners: Set<SyncCallback> = new Set();
    private _status: SyncStatus = {
        isSyncing: false,
        pendingCount: 0
    };
    private syncInterval: ReturnType<typeof setInterval> | null = null;
    private isInitialized = false;

    /**
     * Initialize the sync service
     * Call this once when the app starts
     */
    async init(): Promise<void> {
        if (this.isInitialized || typeof window === 'undefined') return;

        this.isInitialized = true;

        // Subscribe to network changes
        networkStatus.subscribe((isOnline) => {
            if (isOnline) {
                // Trigger sync when coming back online
                this.sync();
            }
        });

        // Periodic sync check (every 30 seconds when online)
        this.syncInterval = setInterval(() => {
            if (networkStatus.isOnline) {
                this.sync();
            }
        }, 30000);

        // Initial sync
        if (networkStatus.isOnline) {
            await this.sync();
        }

        // Update pending count
        await this.updatePendingCount();
    }

    /**
     * Clean up (call on unmount/logout)
     */
    destroy(): void {
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
            this.syncInterval = null;
        }
        this.listeners.clear();
        this.isInitialized = false;
    }

    /**
     * Get current sync status
     */
    get status(): SyncStatus {
        return { ...this._status };
    }

    /**
     * Subscribe to sync status changes
     */
    subscribe(callback: SyncCallback): () => void {
        this.listeners.add(callback);
        callback(this._status);
        return () => this.listeners.delete(callback);
    }

    private notifyListeners(): void {
        this.listeners.forEach(cb => cb(this._status));
    }

    private updateStatus(partial: Partial<SyncStatus>): void {
        this._status = { ...this._status, ...partial };
        this.notifyListeners();
    }

    private async updatePendingCount(): Promise<void> {
        const count = await db.syncQueue.count();
        this.updateStatus({ pendingCount: count });
    }

    /**
     * Sync all pending operations with the server
     */
    async sync(): Promise<void> {
        if (this._status.isSyncing || !networkStatus.isOnline) {
            return;
        }

        this.updateStatus({ isSyncing: true, lastError: undefined });

        try {
            const operations = await getPendingOperations();

            for (const op of operations) {
                try {
                    await this.processOperation(op);
                    await removeFromQueue(op.id!);
                } catch (error) {
                    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                    await markAttempted(op.id!, errorMessage);
                    console.error(`Sync failed for operation ${op.id}:`, error);
                }
            }

            this.updateStatus({
                isSyncing: false,
                lastSyncAt: Date.now()
            });
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Sync failed';
            this.updateStatus({
                isSyncing: false,
                lastError: errorMessage
            });
        }

        await this.updatePendingCount();
    }

    /**
     * Process a single sync queue operation
     */
    private async processOperation(op: SyncQueueEntry): Promise<void> {
        switch (op.operation) {
            case 'create':
                await this.syncCreate(op);
                break;
            case 'update':
                await this.syncUpdate(op);
                break;
            case 'delete':
                await this.syncDelete(op);
                break;
        }
    }

    private async syncCreate(op: SyncQueueEntry): Promise<void> {
        const localExpense = await db.expenses.get(op.localId);
        if (!localExpense) return;

        const serverData = localToServer(localExpense);
        delete serverData.id; // Remove ID for create

        const response = await fetch('/api/expenses', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(serverData)
        });

        if (!response.ok) {
            throw new Error(`Create failed: ${response.status}`);
        }

        const created: Expense = await response.json();

        // Update local record with server ID
        await db.expenses.update(op.localId, {
            serverId: created.id,
            syncStatus: 'synced',
            lastSyncedAt: Date.now()
        });
    }

    private async syncUpdate(op: SyncQueueEntry): Promise<void> {
        const serverId = op.serverId;
        if (!serverId) {
            throw new Error('Cannot update: no server ID');
        }

        const localExpense = await db.expenses.get(op.localId);
        if (!localExpense) return;

        const serverData = localToServer(localExpense);

        const response = await fetch(`/api/expenses/${serverId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(serverData)
        });

        if (!response.ok) {
            throw new Error(`Update failed: ${response.status}`);
        }

        // Mark as synced
        await db.expenses.update(op.localId, {
            syncStatus: 'synced',
            lastSyncedAt: Date.now()
        });
    }

    private async syncDelete(op: SyncQueueEntry): Promise<void> {
        const serverId = op.serverId;

        // If we never synced this expense, just remove locally
        if (!serverId) {
            await db.expenses.delete(op.localId);
            return;
        }

        const response = await fetch(`/api/expenses/${serverId}`, {
            method: 'DELETE'
        });

        if (!response.ok && response.status !== 404) {
            throw new Error(`Delete failed: ${response.status}`);
        }

        // Remove from local DB
        await db.expenses.delete(op.localId);
    }

    /**
     * Pull fresh data from the server
     * Used for initial load or refresh
     */
    async pullFromServer(): Promise<void> {
        if (!networkStatus.isOnline) {
            return;
        }

        try {
            const response = await fetch('/api/expenses');
            if (!response.ok) {
                throw new Error(`Fetch failed: ${response.status}`);
            }

            const serverExpenses: Expense[] = await response.json();

            // Get all local expenses
            const localExpenses = await db.expenses.toArray();
            const localByServerId = new Map(
                localExpenses
                    .filter(e => e.serverId)
                    .map(e => [e.serverId, e])
            );

            // Process server expenses
            for (const serverExp of serverExpenses) {
                const existing = localByServerId.get(serverExp.id);

                if (existing) {
                    // Only update if server is newer and local is synced
                    if (existing.syncStatus === 'synced') {
                        await db.expenses.update(existing.localId, {
                            ...serverToLocal(serverExp),
                            localId: existing.localId
                        });
                    }
                    localByServerId.delete(serverExp.id);
                } else {
                    // New expense from server
                    await db.expenses.add(serverToLocal(serverExp));
                }
            }

            // Handle expenses deleted on server (only if they were synced)
            for (const [, local] of localByServerId) {
                if (local.syncStatus === 'synced' && !local.isDeleted) {
                    // Expense was deleted on server, remove locally
                    await db.expenses.delete(local.localId);
                }
            }

            this.updateStatus({ lastSyncAt: Date.now() });
        } catch (error) {
            console.error('Pull from server failed:', error);
            throw error;
        }
    }
}

// Singleton instance
export const syncService = new SyncService();

export default syncService;
