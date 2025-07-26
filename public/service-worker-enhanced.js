const CACHE_VERSION = 'v2';
const STATIC_CACHE = `static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `dynamic-${CACHE_VERSION}`;
const IMAGE_CACHE = `images-${CACHE_VERSION}`;
const API_CACHE = `api-${CACHE_VERSION}`;

// Assets to cache immediately
const STATIC_ASSETS = [
  '/',
  '/offline',
  '/manifest.json',
  '/favicon.ico',
];

// Cache strategies
const cacheStrategies = {
  // Cache first, fallback to network
  cacheFirst: async (request) => {
    const cached = await caches.match(request);
    return cached || fetch(request).then(response => {
      if (response.ok) {
        const clone = response.clone();
        caches.open(DYNAMIC_CACHE).then(cache => {
          cache.put(request, clone);
        });
      }
      return response;
    });
  },

  // Network first, fallback to cache
  networkFirst: async (request) => {
    try {
      const response = await fetch(request);
      if (response.ok) {
        const clone = response.clone();
        const cache = await caches.open(DYNAMIC_CACHE);
        cache.put(request, clone);
      }
      return response;
    } catch (error) {
      const cached = await caches.match(request);
      if (cached) return cached;
      
      // If it's a navigation request, return offline page
      if (request.mode === 'navigate') {
        return caches.match('/offline');
      }
      throw error;
    }
  },

  // Stale while revalidate
  staleWhileRevalidate: async (request) => {
    const cached = await caches.match(request);
    const fetchPromise = fetch(request).then(response => {
      if (response.ok) {
        const clone = response.clone();
        caches.open(DYNAMIC_CACHE).then(cache => {
          cache.put(request, clone);
        });
      }
      return response;
    });

    return cached || fetchPromise;
  }
};

// Install event
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then(cache => {
      console.log('[SW] Caching static assets');
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate event
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          // Delete old caches
          if (!cacheName.includes(CACHE_VERSION)) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Handle different request types
  if (request.mode === 'navigate') {
    // Navigation requests - network first
    event.respondWith(cacheStrategies.networkFirst(request));
  } else if (url.pathname.startsWith('/api/')) {
    // API requests - network first with short cache
    event.respondWith(cacheStrategies.networkFirst(request));
  } else if (url.pathname.match(/\.(png|jpg|jpeg|svg|gif|webp)$/i)) {
    // Images - cache first
    event.respondWith(
      caches.open(IMAGE_CACHE).then(cache => {
        return cache.match(request).then(cached => {
          return cached || fetch(request).then(response => {
            if (response.ok) {
              cache.put(request, response.clone());
            }
            return response;
          });
        });
      })
    );
  } else if (url.pathname.match(/\.(js|css)$/i)) {
    // JS/CSS - stale while revalidate
    event.respondWith(cacheStrategies.staleWhileRevalidate(request));
  } else {
    // Everything else - network first
    event.respondWith(cacheStrategies.networkFirst(request));
  }
});

// Background sync
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-forms') {
    event.waitUntil(syncOfflineForms());
  }
});

// Push notifications
self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : 'New notification',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1,
    },
    actions: [
      { action: 'explore', title: 'Open App' },
      { action: 'close', title: 'Close' },
    ],
  };

  event.waitUntil(
    self.registration.showNotification('Lex Business', options)
  );
});

// Notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Periodic background sync (for supported browsers)
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'update-cache') {
    event.waitUntil(updateCache());
  }
});

// Helper functions
async function syncOfflineForms() {
  // Get any cached form data and try to submit
  console.log('[SW] Syncing offline forms...');
  // Implementation depends on your form caching strategy
}

async function updateCache() {
  // Update critical resources in cache
  const cache = await caches.open(STATIC_CACHE);
  return cache.addAll(STATIC_ASSETS);
}

// Clean up old caches periodically
async function cleanupCaches() {
  const cacheWhitelist = [STATIC_CACHE, DYNAMIC_CACHE, IMAGE_CACHE, API_CACHE];
  const cacheNames = await caches.keys();
  
  return Promise.all(
    cacheNames.map(cacheName => {
      if (!cacheWhitelist.includes(cacheName)) {
        return caches.delete(cacheName);
      }
    })
  );
}