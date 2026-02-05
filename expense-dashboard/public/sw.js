/**
 * Service Worker for Expense.OS
 * 
 * Provides offline caching for the PWA.
 * Caches static assets, app shell, and API responses.
 */

const CACHE_NAME = 'expense-os-v3';
const STATIC_CACHE = 'expense-os-static-v3';
const DYNAMIC_CACHE = 'expense-os-dynamic-v3';

// Static assets to cache immediately
const STATIC_ASSETS = [
    '/',
    '/manifest.json',
    '/favicon.ico',
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(STATIC_CACHE).then((cache) => {
            console.log('[SW] Caching static assets');
            return cache.addAll(STATIC_ASSETS);
        })
    );
    // Activate immediately
    self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames
                    .filter((name) => name !== STATIC_CACHE && name !== DYNAMIC_CACHE)
                    .map((name) => caches.delete(name))
            );
        })
    );
    // Take control of all pages immediately
    self.clients.claim();
});

// Fetch event - network first, fallback to cache
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Skip non-GET requests
    if (request.method !== 'GET') {
        return;
    }

    // Skip API calls for expenses (handled by IndexedDB)
    if (url.pathname.startsWith('/api/expenses')) {
        return;
    }

    // Skip auth-related API calls
    if (url.pathname.startsWith('/api/auth') || url.pathname.includes('supabase')) {
        return;
    }

    // For navigation requests, try network first
    if (request.mode === 'navigate') {
        event.respondWith(
            fetch(request)
                .then((response) => {
                    // Clone and cache the response
                    const responseClone = response.clone();
                    caches.open(DYNAMIC_CACHE).then((cache) => {
                        cache.put(request, responseClone);
                    });
                    return response;
                })
                .catch(() => {
                    // If offline, try to serve from cache
                    return caches.match(request).then((cached) => {
                        if (cached) return cached;
                        // Fallback to root page
                        return caches.match('/');
                    });
                })
        );
        return;
    }

    // For Next.js chunks - use network-first (chunks change every deployment)
    // This prevents stale cache issues on custom domains
    if (url.pathname.startsWith('/_next/static/chunks')) {
        event.respondWith(
            fetch(request)
                .then((response) => {
                    // Only cache successful responses
                    if (response.ok) {
                        const responseClone = response.clone();
                        caches.open(STATIC_CACHE).then((cache) => {
                            cache.put(request, responseClone);
                        });
                    }
                    return response;
                })
                .catch(() => caches.match(request))
        );
        return;
    }

    // For other static assets (icons, fonts, images) - cache first is fine
    if (
        url.pathname.startsWith('/_next/static') ||
        url.pathname.startsWith('/icons') ||
        url.pathname.endsWith('.woff2') ||
        url.pathname.endsWith('.png') ||
        url.pathname.endsWith('.svg')
    ) {
        event.respondWith(
            caches.match(request).then((cached) => {
                if (cached) return cached;

                return fetch(request).then((response) => {
                    const responseClone = response.clone();
                    caches.open(STATIC_CACHE).then((cache) => {
                        cache.put(request, responseClone);
                    });
                    return response;
                });
            })
        );
        return;
    }

    // Default: network first with cache fallback
    event.respondWith(
        fetch(request)
            .then((response) => {
                const responseClone = response.clone();
                caches.open(DYNAMIC_CACHE).then((cache) => {
                    cache.put(request, responseClone);
                });
                return response;
            })
            .catch(() => caches.match(request))
    );
});

// Background sync for queued operations
self.addEventListener('sync', (event) => {
    if (event.tag === 'sync-expenses') {
        console.log('[SW] Background sync triggered');
        // The sync is handled by the SyncService in the main thread
        // This just notifies that we're back online
        self.clients.matchAll().then((clients) => {
            clients.forEach((client) => {
                client.postMessage({ type: 'SYNC_AVAILABLE' });
            });
        });
    }
});

// Listen for messages from the main thread
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});
