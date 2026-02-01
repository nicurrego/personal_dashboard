/**
 * Offline Provider
 * 
 * Context provider that initializes the offline sync system.
 * Wrap your app with this to enable offline functionality.
 */

'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { syncService, networkStatus, clearAllData, type SyncStatus } from '@/lib/offline';

interface OfflineContextValue {
    isOnline: boolean;
    isReady: boolean;
    syncStatus: SyncStatus;
    forceSync: () => Promise<void>;
    clearLocalData: () => Promise<void>;
}

const OfflineContext = createContext<OfflineContextValue | null>(null);

interface OfflineProviderProps {
    children: ReactNode;
}

export function OfflineProvider({ children }: OfflineProviderProps) {
    const [isReady, setIsReady] = useState(false);
    const [isOnline, setIsOnline] = useState(true);
    const [syncStatus, setSyncStatus] = useState<SyncStatus>({
        isSyncing: false,
        pendingCount: 0
    });

    useEffect(() => {
        // Initialize the offline system
        const init = async () => {
            try {
                // Subscribe to network status
                const unsubNetwork = networkStatus.subscribe(setIsOnline);

                // Subscribe to sync status
                const unsubSync = syncService.subscribe(setSyncStatus);

                // Initialize sync service
                await syncService.init();

                setIsReady(true);

                return () => {
                    unsubNetwork();
                    unsubSync();
                    syncService.destroy();
                };
            } catch (error) {
                console.error('Failed to initialize offline system:', error);
                // Still mark as ready so app can function
                setIsReady(true);
            }
        };

        const cleanup = init();

        return () => {
            cleanup.then(fn => fn?.());
        };
    }, []);

    const forceSync = async () => {
        await syncService.sync();
    };

    const clearLocalData = async () => {
        await clearAllData();
    };

    return (
        <OfflineContext.Provider
            value={{
                isOnline,
                isReady,
                syncStatus,
                forceSync,
                clearLocalData
            }}
        >
            {children}
        </OfflineContext.Provider>
    );
}

export function useOfflineContext(): OfflineContextValue {
    const context = useContext(OfflineContext);
    if (!context) {
        throw new Error('useOfflineContext must be used within an OfflineProvider');
    }
    return context;
}

export default OfflineProvider;
