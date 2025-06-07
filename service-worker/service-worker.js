importScripts('https://storage.googleapis.com/workbox-cdn/releases/6.5.4/workbox-sw.js');

if (workbox) {
    console.log('Workbox is loaded');
    
    // Set up precaching
    workbox.precaching.precacheAndRoute(
        [
            { url: '/', revision: null },
            { url: '/offline', revision: null },
            { url: '/static/js/main.js', revision: null },
            { url: '/static/gen/css/main.min.css', revision: null },
            { url: '/static/images/logo.svg', revision: null },
            { url: '/static/icons/favicon.ico', revision: null },
            { url: '/static/manifest.json', revision: null },
        ]);

    const { CacheableResponsePlugin } = workbox.cacheableResponse;

    // Cache API responses
    workbox.routing.registerRoute(
        ({ request }) => request.destination === 'document' || request.destination === 'script',
        new workbox.strategies.CacheFirst({
        cacheName: 'images-cache',
        plugins: [
        new CacheableResponsePlugin({
            statuses: [0, 200],
        }),
        ],
    })
    );
    
    // Cache CSS and JS files
    workbox.routing.registerRoute(
        /\.(?:css|js)$/,
        new workbox.strategies.StaleWhileRevalidate({
        cacheName: 'static-resources',
        })
    );
    
    // Cache images
    workbox.routing.registerRoute(
    ({ request }) => request.destination === 'image',
    new workbox.strategies.CacheFirst({
        cacheName: 'images-cache',
        plugins: [
        new CacheableResponsePlugin({
            statuses: [0, 200],
        }),
        ],
    })
    );

    // Cache fonts
    workbox.routing.registerRoute(
        ({ url }) =>
            url.origin.startsWith('https://fonts.googleapis.com') ||
            url.origin.startsWith('https://fonts.gstatic.com'),
        new workbox.strategies.CacheFirst({
            cacheName: 'font-cache',
            plugins: [
                new workbox.expiration.ExpirationPlugin({
                    maxEntries: 20,
                    maxAgeSeconds: 365 * 24 * 60 * 60, // 1 Year
                }),
            ],
        })
    );

    // Fallback to offline page
    workbox.routing.setCatchHandler(({ event }) => {
        if (event.request.mode === 'navigate') {
            return caches.match('/offline');
        }
        return Response.error();
    });
    
    } else {
    console.log('Workbox failed to load');
    }