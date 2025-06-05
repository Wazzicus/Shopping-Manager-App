// service-worker.js

const CACHE_VERSION = 'shopping-manager-cache-v1.6.1';
const STATIC_CACHE = `static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `dynamic-${CACHE_VERSION}`;
const STATIC_ASSETS = ["/",
    "/offline",
    "/static/gen/css/main.min.css",
    "/static/js/main.js",
    "/static/js/dashboard.js",
    "/static/icons/favicon.ico",
    "https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css",
    "https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css",
    "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap",
    "/static/manifest.json"
];

// Pre-caching of essential static assets.
self.addEventListener("install", event => {
    event.waitUntil(
        caches.open(STATIC_CACHE).then(cache => {
            return cache.addAll(STATIC_ASSETS);
        })
    );
});

// Activate event to clean up old caches.
self.addEventListener("activate", event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.filter(cacheNames => 
                    cacheNames !== STATIC_CACHE && cacheNames !== DYNAMIC_CACHE).map(cacheName => 
                    caches.delete(cacheName))
                );
        })
    );
});

// Network-first Cache(For Dashboard and Shared Lists)
self.addEventListener("fetch", event => {
    const url = new URL(event.request.url);
    if (url.pathname.startsWith('/dashboard') || url.pathname.startsWith('/shopping/lists/')) {
        event.respondWith(networkFirst(event.request));
    }

    else if(STATIC_ASSETS.includes(url.href) || STATIC_ASSETS.includes(url.pathname)) {
        event.respondWith(cacheFirst(event.request));
    }

    else {
        event.respondWith(
            fetch(event.request).catch(() => {
                if (event.request.destination === "document") {
                    return caches.match("/offline");
                }
            })
        );
    }
});

// Cache-first strategy function
async function cacheFirst(request) {
    const cache = await caches.open(STATIC_CACHE);
    const cachedResponse = await cache.match(request);
    return cachedResponse || fetch(request);
}

// Network-first strategy function
async function networkFirst(request) {
    const cache = await caches.open(DYNAMIC_CACHE);
    try {
        const networkResponse = await fetch(request);
        cache.put(request.url, networkResponse.clone());
        return networkResponse;
    } catch (error) {
        const cachedResponse = await cache.match(request);
        return cachedResponse || caches.match("/offline");
    }
}