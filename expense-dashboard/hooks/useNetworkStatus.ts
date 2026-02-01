/**
 * useNetworkStatus Hook
 * 
 * Simple hook to track online/offline status
 */

'use client';

import { useState, useEffect } from 'react';
import { networkStatus } from '@/lib/offline';

export interface UseNetworkStatusReturn {
    isOnline: boolean;
    checkConnectivity: () => Promise<boolean>;
}

export function useNetworkStatus(): UseNetworkStatusReturn {
    const [isOnline, setIsOnline] = useState(true);

    useEffect(() => {
        const unsubscribe = networkStatus.subscribe(setIsOnline);
        return unsubscribe;
    }, []);

    return {
        isOnline,
        checkConnectivity: () => networkStatus.checkConnectivity()
    };
}

export default useNetworkStatus;
