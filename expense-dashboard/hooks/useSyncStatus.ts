/**
 * useSyncStatus Hook
 * 
 * Hook to track sync status (pending operations, syncing state, etc.)
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { syncService, type SyncStatus } from '@/lib/offline';

export interface UseSyncStatusReturn extends SyncStatus {
    forceSync: () => Promise<void>;
}

export function useSyncStatus(): UseSyncStatusReturn {
    const [status, setStatus] = useState<SyncStatus>({
        isSyncing: false,
        pendingCount: 0
    });

    useEffect(() => {
        const unsubscribe = syncService.subscribe(setStatus);
        return unsubscribe;
    }, []);

    const forceSync = useCallback(async () => {
        await syncService.sync();
    }, []);

    return {
        ...status,
        forceSync
    };
}

export default useSyncStatus;
