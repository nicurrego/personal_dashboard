/**
 * Sync Queue Manager
 * 
 * Manages the queue of operations that need to be synced
 * to the server when the device comes back online.
 */

import { db, type SyncQueueEntry, type LocalExpense, type SyncOperationType } from './db';

/**
 * Add an operation to the sync queue
 */
export async function queueOperation(
    localId: string,
    operation: SyncOperationType,
    data: Partial<LocalExpense>,
    serverId?: string
): Promise<void> {
    // Check if there's already a pending operation for this expense
    const existingOps = await db.syncQueue
        .where('localId')
        .equals(localId)
        .toArray();

    // Optimize the queue - collapse operations
    if (existingOps.length > 0) {
        const lastOp = existingOps[existingOps.length - 1];

        // If we're updating after a create, just update the create data
        if (lastOp.operation === 'create' && operation === 'update') {
            await db.syncQueue.update(lastOp.id!, {
                data: { ...lastOp.data, ...data },
                createdAt: Date.now()
            });
            return;
        }

        // If we're deleting after a create, just remove the create
        if (lastOp.operation === 'create' && operation === 'delete') {
            await db.syncQueue.delete(lastOp.id!);
            return;
        }

        // If we're deleting after an update, replace with just delete
        if (lastOp.operation === 'update' && operation === 'delete') {
            await db.syncQueue.delete(lastOp.id!);
        }

        // If we're updating after an update, merge the updates
        if (lastOp.operation === 'update' && operation === 'update') {
            await db.syncQueue.update(lastOp.id!, {
                data: { ...lastOp.data, ...data },
                createdAt: Date.now()
            });
            return;
        }
    }

    // Add new operation to queue
    await db.syncQueue.add({
        localId,
        serverId,
        operation,
        data,
        createdAt: Date.now(),
        attempts: 0
    });
}

/**
 * Get all pending operations, ordered by creation time
 */
export async function getPendingOperations(): Promise<SyncQueueEntry[]> {
    return db.syncQueue.orderBy('createdAt').toArray();
}

/**
 * Get count of pending operations
 */
export async function getPendingCount(): Promise<number> {
    return db.syncQueue.count();
}

/**
 * Mark an operation as attempted (increment attempt count)
 */
export async function markAttempted(id: number, error?: string): Promise<void> {
    const entry = await db.syncQueue.get(id);
    if (entry) {
        await db.syncQueue.update(id, {
            attempts: entry.attempts + 1,
            lastError: error
        });
    }
}

/**
 * Remove a successfully synced operation from the queue
 */
export async function removeFromQueue(id: number): Promise<void> {
    await db.syncQueue.delete(id);
}

/**
 * Clear all operations from the queue (use with caution)
 */
export async function clearQueue(): Promise<void> {
    await db.syncQueue.clear();
}

/**
 * Get operations that have failed too many times
 */
export async function getFailedOperations(maxAttempts: number = 5): Promise<SyncQueueEntry[]> {
    return db.syncQueue
        .where('attempts')
        .aboveOrEqual(maxAttempts)
        .toArray();
}

export default {
    queueOperation,
    getPendingOperations,
    getPendingCount,
    markAttempted,
    removeFromQueue,
    clearQueue,
    getFailedOperations
};
