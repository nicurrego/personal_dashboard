/**
 * Sync Status Indicator
 * 
 * A small UI component that shows the current sync status.
 * Shows online/offline state and pending sync operations.
 */

'use client';

import { useNetworkStatus, useSyncStatus } from '@/hooks';
import { Cloud, CloudOff, RefreshCw, AlertCircle, Check } from 'lucide-react';

interface SyncStatusIndicatorProps {
    /** Show as a compact badge */
    compact?: boolean;
    /** Custom class name */
    className?: string;
}

export function SyncStatusIndicator({
    compact = false,
    className = ''
}: SyncStatusIndicatorProps) {
    const { isOnline } = useNetworkStatus();
    const { isSyncing, pendingCount, lastError } = useSyncStatus();

    // Determine the state
    const hasError = !!lastError;
    const hasPending = pendingCount > 0;
    const isSynced = isOnline && !hasPending && !isSyncing;

    // Choose icon and colors
    let Icon = Cloud;
    let statusColor = 'text-emerald-500';
    let bgColor = 'bg-emerald-500/10';
    let statusText = 'Synced';

    if (!isOnline) {
        Icon = CloudOff;
        statusColor = 'text-amber-500';
        bgColor = 'bg-amber-500/10';
        statusText = hasPending ? `Offline (${pendingCount} pending)` : 'Offline';
    } else if (isSyncing) {
        Icon = RefreshCw;
        statusColor = 'text-blue-500';
        bgColor = 'bg-blue-500/10';
        statusText = 'Syncing...';
    } else if (hasError) {
        Icon = AlertCircle;
        statusColor = 'text-red-500';
        bgColor = 'bg-red-500/10';
        statusText = 'Sync error';
    } else if (hasPending) {
        Icon = RefreshCw;
        statusColor = 'text-amber-500';
        bgColor = 'bg-amber-500/10';
        statusText = `${pendingCount} pending`;
    } else if (isSynced) {
        Icon = Check;
    }

    if (compact) {
        return (
            <div
                className={`inline-flex items-center justify-center w-8 h-8 rounded-full ${bgColor} ${className}`}
                title={statusText}
            >
                <Icon
                    className={`w-4 h-4 ${statusColor} ${isSyncing ? 'animate-spin' : ''}`}
                />
            </div>
        );
    }

    return (
        <div
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full ${bgColor} ${className}`}
        >
            <Icon
                className={`w-4 h-4 ${statusColor} ${isSyncing ? 'animate-spin' : ''}`}
            />
            <span className={`text-sm font-medium ${statusColor}`}>
                {statusText}
            </span>
        </div>
    );
}

export default SyncStatusIndicator;
