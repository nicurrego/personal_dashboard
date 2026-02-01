/**
 * Network Status Detection
 * 
 * Provides utilities for detecting online/offline status
 * and subscribing to network changes.
 */

type NetworkCallback = (isOnline: boolean) => void;

class NetworkStatusManager {
    private listeners: Set<NetworkCallback> = new Set();
    private _isOnline: boolean = true;
    private initialized: boolean = false;

    constructor() {
        // Will be initialized on first access (client-side only)
    }

    private init() {
        if (this.initialized || typeof window === 'undefined') return;

        this._isOnline = navigator.onLine;

        window.addEventListener('online', () => {
            this._isOnline = true;
            this.notifyListeners();
        });

        window.addEventListener('offline', () => {
            this._isOnline = false;
            this.notifyListeners();
        });

        this.initialized = true;
    }

    private notifyListeners() {
        this.listeners.forEach(callback => callback(this._isOnline));
    }

    /**
     * Check if currently online
     */
    get isOnline(): boolean {
        this.init();
        return this._isOnline;
    }

    /**
     * Subscribe to network status changes
     * Returns unsubscribe function
     */
    subscribe(callback: NetworkCallback): () => void {
        this.init();
        this.listeners.add(callback);

        // Immediately call with current status
        callback(this._isOnline);

        return () => {
            this.listeners.delete(callback);
        };
    }

    /**
     * Perform a real connectivity check (ping the server)
     * More reliable than just checking navigator.onLine
     */
    async checkConnectivity(): Promise<boolean> {
        if (typeof window === 'undefined') return true;

        if (!navigator.onLine) {
            this._isOnline = false;
            return false;
        }

        try {
            // Try to fetch a small resource from our own API
            const response = await fetch('/api/health', {
                method: 'HEAD',
                cache: 'no-store',
                signal: AbortSignal.timeout(5000)
            });
            this._isOnline = response.ok;
        } catch {
            // If fetch fails, we might still be "online" but server unreachable
            // Fall back to navigator.onLine
            this._isOnline = navigator.onLine;
        }

        return this._isOnline;
    }
}

// Singleton instance
export const networkStatus = new NetworkStatusManager();

export default networkStatus;
