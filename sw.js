// Nama cache untuk versi yang berbeda
const CACHE_NAME = 'aduanmasyarakat-v1.0';
const DYNAMIC_CACHE_NAME = 'aduanmasyarakat-dynamic-v1.0';

// Daftar asset yang akan di-cache saat install
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
  'https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap',
  'https://unpkg.com/leaflet@1.7.1/dist/leaflet.css',
  'https://www.gstatic.com/firebasejs/9.22.1/firebase-app-compat.js',
  'https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore-compat.js',
  'https://www.gstatic.com/firebasejs/9.22.1/firebase-storage-compat.js',
  'https://unpkg.com/leaflet@1.7.1/dist/leaflet.js',
  'https://cdn-icons-png.flaticon.com/180/1006/1006771.png',
  'https://cdn-icons-png.flaticon.com/192/1006/1006771.png',
  'https://images.unsplash.com/photo-1519501025264-65ba15a82390?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=80'
];

// Install event - caching assets penting
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Caching App Shell');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('Service Worker: Skip waiting on install');
        return self.skipWaiting();
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME && cache !== DYNAMIC_CACHE_NAME) {
            console.log('Service Worker: Clearing old cache:', cache);
            return caches.delete(cache);
          }
        })
      );
    })
  );
  
  return self.clients.claim();
});

// Fetch event - serve from cache or network with fallback
self.addEventListener('fetch', (event) => {
  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin) && 
      !event.request.url.includes('firebase') &&
      !event.request.url.includes('leaflet') &&
      !event.request.url.includes('fontawesome') &&
      !event.request.url.includes('googleapis') &&
      !event.request.url.includes('flaticon') &&
      !event.request.url.includes('unsplash')) {
    return;
  }
  
  // Handle API requests differently
  if (event.request.url.includes('/api/') || event.request.url.includes('firestore')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Clone the response
          const responseClone = response.clone();
          
          // Cache the API response
          caches.open(DYNAMIC_CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
          
          return response;
        })
        .catch(() => {
          // If network fails, try to serve from cache
          return caches.match(event.request);
        })
    );
    return;
  }
  
  // For other requests, use cache-first strategy with network fallback
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          return response;
        }
        
        return fetch(event.request)
          .then((response) => {
            // Check if we received a valid response
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            
            // Clone the response
            const responseToCache = response.clone();
            
            caches.open(DYNAMIC_CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });
            
            return response;
          })
          .catch(() => {
            // If both cache and network fail, show a fallback
            if (event.request.destination === 'document') {
              return caches.match('/offline.html');
            }
            
            // For images, show a placeholder
            if (event.request.destination === 'image') {
              return caches.match('https://cdn-icons-png.flaticon.com/192/1006/1006771.png');
            }
          });
      })
  );
});

// Background sync for offline form submissions
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    console.log('Service Worker: Background sync fired!');
    event.waitUntil(doBackgroundSync());
  }
});

// Function to handle background sync
function doBackgroundSync() {
  // This would typically check IndexedDB for pending submissions
  // and attempt to sync them with the server
  return Promise.resolve();
}

// Push notifications
self.addEventListener('push', (event) => {
  if (!event.data) return;
  
  const data = event.data.json();
  const options = {
    body: data.body,
    icon: 'https://cdn-icons-png.flaticon.com/192/1006/1006771.png',
    badge: 'https://cdn-icons-png.flaticon.com/192/1006/1006771.png',
    vibrate: [100, 50, 100],
    data: {
      url: data.url || '/'
    }
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  event.waitUntil(
    clients.openWindow(event.notification.data.url)
  );
});