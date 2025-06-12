importScripts('https://storage.googleapis.com/workbox-cdn/releases/6.5.4/workbox-sw.js');

const CACHE_VERSION = 'v1.3.1';
const API_BASE_URL = 'https://api.shoppingmanager.com'; 
const OFFLINE_PAGE = '/offline';


if (workbox) {
    console.log('Shopping Manager Service Worker loaded with Workbox');
    
    // Skip waiting and claim clients immediately for faster updates
    workbox.core.skipWaiting();
    workbox.core.clientsClaim();

    // ==========================================
    // PRECACHING CONFIGURATION
    // ==========================================
    
    // Precache essential app shell resources
    workbox.precaching.precacheAndRoute([
        // Core app files
        { url: '/', revision: CACHE_VERSION },
        { url: '/dashboard', revision: CACHE_VERSION },
        { url: OFFLINE_PAGE, revision: CACHE_VERSION },
        
        // Static assets
        { url: '/static/js/main.js', revision: CACHE_VERSION },
        { url: '/static/gen/css/main.min.css', revision: CACHE_VERSION },
        { url: '/static/css/offline.css', revision: CACHE_VERSION },
        
        // Essential images and icons
        { url: '/static/images/logo.svg', revision: CACHE_VERSION },
        { url: '/static/icons/favicon.ico', revision: CACHE_VERSION },
        { url: '/static/icons/web-app-manifest-192x192.png', revision: CACHE_VERSION },
        { url: '/static/icons/web-app-manifest-512x512.png', revision: CACHE_VERSION },
        
        // PWA manifest
        { url: '/static/manifest.json', revision: CACHE_VERSION },
    ]);

    // ==========================================
    // API CACHING STRATEGIES
    // ==========================================

    // Shopping Lists - Network First with extensive fallback
    
    workbox.routing.registerRoute(
        new RegExp(`${API_BASE_URL}/shopping/list.*`),
        new workbox.strategies.NetworkFirst({
            cacheName: 'shopping-lists-cache',
            networkTimeoutSeconds: 5,
            plugins: [
                new workbox.cacheableResponse.CacheableResponsePlugin({
                    statuses: [0, 200, 404],
                }),
                new workbox.expiration.ExpirationPlugin({
                    maxEntries: 100,
                    maxAgeSeconds: 24 * 60 * 60, // 24 hours
                }),
                {
                    handlerDidError: async ({ request }) => {
                        const cache = await caches.open('shopping-lists-cache');
                        const cachedResponse = await cache.match(request);

                        if (cachedResponse) {
                            console.log('Network failed. Serving stale data from cache.');
                            const data = await cachedResponse.json();
                            
                            // Add our custom flag to inform the UI it's stale
                            data._isStale = true;
                            data._message = "Showing offline data. This may not be the latest version.";

                            return new Response(JSON.stringify(data), {
                                status: 200, 
                                headers: { 'Content-Type': 'application/json' }
                            });
                        }
                        
                        return Response.error(); 
                    }
                }
            ],
        })
    );

    // Household Data - Network First with longer cache
    workbox.routing.registerRoute(
        new RegExp(`${API_BASE_URL}/household.*`),
        new workbox.strategies.NetworkFirst({
            cacheName: 'household-cache',
            networkTimeoutSeconds: 3,
            plugins: [
                new workbox.cacheableResponse.CacheableResponsePlugin({
                    statuses: [0, 200],
                }),
                new workbox.expiration.ExpirationPlugin({
                    maxEntries: 10,
                    maxAgeSeconds: 7 * 24 * 60 * 60, // 7 days
                }),
                new workbox.backgroundSync.BackgroundSyncPlugin('household-sync', {
                    maxRetentionTime: 24 * 60,
                }),
            ],
        })
    );

    // User Settings - Stale While Revalidate
    workbox.routing.registerRoute(
        new RegExp(`${API_BASE_URL}/settings.*`),
        new workbox.strategies.StaleWhileRevalidate({
            cacheName: 'user-data-cache',
            plugins: [
                new workbox.cacheableResponse.CacheableResponsePlugin({
                    statuses: [0, 200],
                }),
                new workbox.expiration.ExpirationPlugin({
                    maxEntries: 20,
                    maxAgeSeconds: 24 * 60 * 60, // 30 days
                }),
            ],
        })
    );

    // ==========================================
    // STATIC RESOURCE CACHING
    // ==========================================

    // App Shell (HTML pages) - Network First for freshness
    workbox.routing.registerRoute(
        ({ request }) => request.mode === 'navigate',
        new workbox.strategies.NetworkFirst({
            cacheName: 'app-shell-cache',
            networkTimeoutSeconds: 3,
            plugins: [
                new workbox.cacheableResponse.CacheableResponsePlugin({
                    statuses: [0, 200],
                }),
            ],
        })
    );

    // JavaScript and CSS - Stale While Revalidate
    workbox.routing.registerRoute(
        /\.(?:js|css)$/,
        new workbox.strategies.StaleWhileRevalidate({
            cacheName: 'static-resources-cache',
            plugins: [
                new workbox.expiration.ExpirationPlugin({
                    maxEntries: 60,
                    maxAgeSeconds: 7 * 24 * 60 * 60, // 7 days
                }),
            ],
        })
    );

    // Images - Cache First with long expiration
    workbox.routing.registerRoute(
        ({ request }) => request.destination === 'image',
        new workbox.strategies.CacheFirst({
            cacheName: 'images-cache',
            plugins: [
                new workbox.cacheableResponse.CacheableResponsePlugin({
                    statuses: [0, 200],
                }),
                new workbox.expiration.ExpirationPlugin({
                    maxEntries: 100,
                    maxAgeSeconds: 90 * 24 * 60 * 60, // 90 days
                    purgeOnQuotaError: true,
                }),
            ],
        })
    );

    // External Fonts - Cache First with long expiration
    workbox.routing.registerRoute(
        ({ url }) =>
            url.origin === 'https://fonts.googleapis.com' ||
            url.origin === 'https://fonts.gstatic.com',
        new workbox.strategies.CacheFirst({
            cacheName: 'google-fonts-cache',
            plugins: [
                new workbox.cacheableResponse.CacheableResponsePlugin({
                    statuses: [0, 200],
                }),
                new workbox.expiration.ExpirationPlugin({
                    maxEntries: 30,
                    maxAgeSeconds: 365 * 24 * 60 * 60, // 1 year
                }),
            ],
        })
    );

    // ==========================================
    // OFFLINE FALLBACK STRATEGIES
    // ==========================================

    // Custom offline fallback handler
    const offlineFallback = async ({ event, url }) => {
        const { request } = event;
        
        // Handle navigation requests (page loads)
        if (request.mode === 'navigate') {
            const cachedResponse = await caches.match(OFFLINE_PAGE);
            return cachedResponse || new Response('Offline - Please check your connection', {
                status: 503,
                statusText: 'Service Unavailable'
            });
        }

        // Handle other resource requests
        if (request.destination === 'image') {
            // Return a placeholder offline image if available
            return caches.match('/static/images/offline-placeholder.svg') ||
                   new Response('', { status: 503 });
        }

        return new Response('Resource not available offline', {
            status: 503,
            statusText: 'Service Unavailable'
        });
    };

    // Set the offline fallback
    workbox.routing.setCatchHandler(offlineFallback);


    // ==========================================
    // MESSAGE HANDLING & CACHE MANAGEMENT
    // ==========================================

    // Handle messages from the main thread
    self.addEventListener('message', event => {
        if (event.data && event.data.type === 'SKIP_WAITING') {
            self.skipWaiting();
        } else if (event.data && event.data.type === 'CACHE_UPDATE') {
            // Force update specific cache entries
            handleCacheUpdate(event.data.payload);
        } else if (event.data && event.data.type === 'CLEAR_CACHE') {
            // Clear specific cache
            handleCacheClear(event.data.cacheName);
        }
    });

    const handleCacheUpdate = async (payload) => {
        try {
            const cache = await caches.open(payload.cacheName);
            await cache.delete(payload.url);
            console.log(`Cache entry updated: ${payload.url}`);
        } catch (error) {
            console.error('Cache update failed:', error);
        }
    };

    const handleCacheClear = async (cacheName) => {
        try {
            await caches.delete(cacheName);
            console.log(`Cache cleared: ${cacheName}`);
        } catch (error) {
            console.error('Cache clear failed:', error);
        }
    };

    // ==========================================
    // INSTALLATION & ACTIVATION HANDLERS
    // ==========================================

    self.addEventListener('install', event => {
        console.log('Shopping Manager Service Worker installing...');
        // Force activation without waiting for existing clients
        self.skipWaiting();
    });

    self.addEventListener('activate', event => {
        console.log('Shopping Manager Service Worker activated');
        
        event.waitUntil(
            Promise.all([
                // Clean up old caches
                cleanupOldCaches(),
                // Take control of all clients
                self.clients.claim()
            ])
        );
    });

    const cleanupOldCaches = async () => {
        const cacheNames = await caches.keys();
        const validCaches = [
            'shopping-lists-cache',
            'household-cache', 
            'user-data-cache',
            'updates-cache',
            'app-shell-cache',
            'static-resources-cache',
            'images-cache',
            'google-fonts-cache'
        ];

        return Promise.all(
            cacheNames
                .filter(cacheName => !validCaches.includes(cacheName))
                .map(cacheName => caches.delete(cacheName))
        );
    };

} else {
    console.error('Workbox failed to load - Shopping Manager will have limited offline functionality');
    
    // Basic fallback service worker without Workbox
    self.addEventListener('fetch', event => {
        if (event.request.mode === 'navigate') {
            event.respondWith(
                fetch(event.request).catch(() => 
                    caches.match('/offline').then(response => 
                        response || new Response('Offline')
                    )
                )
            );
        }
    });
    
}

self.addEventListener('push', function(event) {
    if (event.data) {
        const payload = event.data.json();
        const title = payload.title || "Shopping Manager";
        const options = {
            body: payload.body || "There's something new. Tap to learn more",
            icon: '/static/icons/web-app-manifest-192x192.png',
            badge: '/static/icons/web-app-manifest-192x192.png',
            data: {
                click_action: payload.click_action || '/dashboard',
                household_id: payload.household_id || null,
            }
        };

    event.waitUntil(self.registration.showNotification(title, options));
    }
});

self.addEventListener('notificationclick', function(event) {
    const click_action = event.notification.data?.click_action || "/dashboard";
    event.notification.close();

    event.waitUntil(
        clients.matchAll({
            type: 'window',
            includeUncontrolled: true
        }).then(clientList => {
            for (const client of clientList) {
                if (client.url === click_action && 'focus' in client) {
                    return client.focus();
                }
            }
            if (clients.openWindow) {
                return clients.openWindow(click_action);
            }
        })

    );
});