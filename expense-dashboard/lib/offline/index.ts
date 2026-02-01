/**
 * Offline-First Module
 * 
 * Provides IndexedDB storage, sync queue, and network status
 * for offline-first expense management.
 */

// Database
export {
    db,
    serverToLocal,
    localToServer,
    clearAllData,
    type LocalExpense,
    type SyncQueueEntry,
    type SyncOperationType
} from './db';

// Network status
export { networkStatus } from './networkStatus';

// Sync queue
export {
    queueOperation,
    getPendingOperations,
    getPendingCount,
    removeFromQueue,
    clearQueue
} from './syncQueue';

// Sync service
export { syncService, type SyncStatus } from './syncService';
