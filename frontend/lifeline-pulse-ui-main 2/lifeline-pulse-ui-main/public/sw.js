// Service Worker for LifeLine360 - Background Notifications and Offline Support
const CACHE_NAME = 'lifeline360-v1';
const STATIC_CACHE_URLS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
];

// Install event - cache static resources
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Caching static resources');
        return cache.addAll(STATIC_CACHE_URLS);
      })
      .then(() => {
        console.log('Service Worker installed successfully');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('Service Worker installation failed:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log('Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('Service Worker activated');
        return self.clients.claim();
      })
  );
});

// Fetch event - serve from cache when offline
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // Skip Firebase and external API requests
  if (event.request.url.includes('firebase') || 
      event.request.url.includes('googleapis') ||
      event.request.url.includes('chrome-extension')) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version if available
        if (response) {
          return response;
        }

        // Otherwise fetch from network
        return fetch(event.request)
          .then((response) => {
            // Don't cache non-successful responses
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clone the response
            const responseToCache = response.clone();

            // Cache the response for future use
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });

            return response;
          })
          .catch(() => {
            // Return offline page for navigation requests
            if (event.request.mode === 'navigate') {
              return caches.match('/index.html');
            }
          });
      })
  );
});

// Push event - handle background push notifications
self.addEventListener('push', (event) => {
  console.log('Push notification received:', event);

  let notificationData = {
    title: 'LifeLine360',
    body: 'You have a new notification',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-96x96.png',
    tag: 'default',
    data: {},
    actions: []
  };

  // Parse push data if available
  if (event.data) {
    try {
      const pushData = event.data.json();
      notificationData = { ...notificationData, ...pushData };
    } catch (error) {
      console.error('Error parsing push data:', error);
    }
  }

  // Show notification
  event.waitUntil(
    self.registration.showNotification(notificationData.title, {
      body: notificationData.body,
      icon: notificationData.icon,
      badge: notificationData.badge,
      tag: notificationData.tag,
      data: notificationData.data,
      actions: notificationData.actions,
      requireInteraction: notificationData.data.priority === 'critical',
      silent: notificationData.data.priority === 'low',
      vibrate: getVibrationPattern(notificationData.data.priority)
    })
  );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event);

  const notification = event.notification;
  const action = event.action;
  const data = notification.data;

  notification.close();

  // Handle notification actions
  if (action === 'respond') {
    event.waitUntil(
      clients.openWindow('/responder')
    );
  } else if (action === 'call') {
    event.waitUntil(
      clients.openWindow('tel:911')
    );
  } else if (action === 'view') {
    event.waitUntil(
      clients.openWindow('/family')
    );
  } else {
    // Default action - open the app
    event.waitUntil(
      clients.matchAll({ type: 'window' })
        .then((clientList) => {
          // If app is already open, focus it
          for (const client of clientList) {
            if (client.url.includes(self.location.origin) && 'focus' in client) {
              return client.focus();
            }
          }
          
          // Otherwise open new window
          let targetUrl = '/';
          if (data.type === 'emergency') {
            targetUrl = '/responder';
          } else if (data.type === 'vitals') {
            targetUrl = '/family';
          } else if (data.type === 'connection') {
            targetUrl = '/patient';
          }
          
          return clients.openWindow(targetUrl);
        })
    );
  }

  // Send message to client about notification click
  event.waitUntil(
    clients.matchAll()
      .then((clientList) => {
        clientList.forEach((client) => {
          client.postMessage({
            type: 'NOTIFICATION_CLICK',
            notification: data
          });
        });
      })
  );
});

// Background sync event (for offline data sync)
self.addEventListener('sync', (event) => {
  console.log('Background sync triggered:', event.tag);

  if (event.tag === 'vitals-sync') {
    event.waitUntil(syncVitalsData());
  } else if (event.tag === 'location-sync') {
    event.waitUntil(syncLocationData());
  }
});

// Sync vitals data when back online
async function syncVitalsData() {
  try {
    // Get stored vitals data from IndexedDB
    const vitalsData = await getStoredVitalsData();
    
    if (vitalsData.length > 0) {
      // Send to Firebase when back online
      for (const vital of vitalsData) {
        await sendVitalToFirebase(vital);
      }
      
      // Clear stored data after successful sync
      await clearStoredVitalsData();
      console.log('Vitals data synced successfully');
    }
  } catch (error) {
    console.error('Error syncing vitals data:', error);
  }
}

// Sync location data when back online
async function syncLocationData() {
  try {
    // Get stored location data from IndexedDB
    const locationData = await getStoredLocationData();
    
    if (locationData.length > 0) {
      // Send to Firebase when back online
      for (const location of locationData) {
        await sendLocationToFirebase(location);
      }
      
      // Clear stored data after successful sync
      await clearStoredLocationData();
      console.log('Location data synced successfully');
    }
  } catch (error) {
    console.error('Error syncing location data:', error);
  }
}

// Helper functions for IndexedDB operations
async function getStoredVitalsData() {
  // Implementation would use IndexedDB to retrieve stored vitals
  return [];
}

async function clearStoredVitalsData() {
  // Implementation would clear IndexedDB vitals data
}

async function getStoredLocationData() {
  // Implementation would use IndexedDB to retrieve stored location data
  return [];
}

async function clearStoredLocationData() {
  // Implementation would clear IndexedDB location data
}

async function sendVitalToFirebase(vital) {
  // Implementation would send vital data to Firebase
}

async function sendLocationToFirebase(location) {
  // Implementation would send location data to Firebase
}

// Get vibration pattern based on priority
function getVibrationPattern(priority) {
  const patterns = {
    low: [],
    normal: [200],
    high: [200, 100, 200],
    critical: [200, 100, 200, 100, 200, 100, 200]
  };
  return patterns[priority] || [200];
}

// Message event - handle messages from main thread
self.addEventListener('message', (event) => {
  console.log('Service Worker received message:', event.data);

  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  } else if (event.data.type === 'CACHE_VITAL') {
    // Cache vital data for offline sync
    cacheVitalData(event.data.vital);
  } else if (event.data.type === 'CACHE_LOCATION') {
    // Cache location data for offline sync
    cacheLocationData(event.data.location);
  }
});

// Cache vital data for offline sync
async function cacheVitalData(vital) {
  // Implementation would store vital data in IndexedDB
  console.log('Caching vital data for offline sync:', vital);
}

// Cache location data for offline sync
async function cacheLocationData(location) {
  // Implementation would store location data in IndexedDB
  console.log('Caching location data for offline sync:', location);
}
