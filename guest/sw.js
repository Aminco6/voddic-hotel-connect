// Service Worker for Voddic Hotel Connect Push Notifications
const CACHE_NAME = 'voddic-guest-v1';

self.addEventListener('install', function(event) {
    console.log('Service Worker installed');
    event.waitUntil(
        caches.open(CACHE_NAME).then(function(cache) {
            return cache.addAll([
                '/guest/',
                '/guest/css/style.css',
                '/guest/js/app_fixed.js'
            ]);
        })
    );
});

self.addEventListener('activate', function(event) {
    console.log('Service Worker activated');
    event.waitUntil(
        caches.keys().then(function(cacheNames) {
            return Promise.all(
                cacheNames.map(function(cacheName) {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

self.addEventListener('push', function(event) {
    console.log('Push notification received:', event);
    
    let data = {
        title: 'Voddic Hotel Connect',
        body: 'You have a new notification',
        icon: '/guest/icons/icon-192x192.png',
        badge: '/guest/icons/icon-72x72.png',
        data: {
            url: '/guest/'
        }
    };
    
    if (event.data) {
        try {
            const payload = event.data.json();
            data.title = payload.title || data.title;
            data.body = payload.body || data.body;
            data.icon = payload.icon || data.icon;
            data.badge = payload.badge || data.badge;
            data.data.url = payload.data?.url || data.data.url;
            data.actions = payload.actions || [];
            data.image = payload.image || null;
        } catch (e) {
            // If not JSON, use the text as body
            data.body = event.data.text() || data.body;
        }
    }
    
    const options = {
        body: data.body,
        icon: data.icon,
        badge: data.badge,
        vibrate: [200, 100, 200],
        data: data.data,
        actions: data.actions,
        image: data.image,
        requireInteraction: true,
        tag: 'notification-' + Date.now()
    };
    
    event.waitUntil(
        self.registration.showNotification(data.title, options)
    );
});

self.addEventListener('notificationclick', function(event) {
    console.log('Notification clicked:', event);
    
    event.notification.close();
    
    const urlToOpen = event.notification.data?.url || '/guest/';
    
    event.waitUntil(
        clients.matchAll({
            type: 'window',
            includeUncontrolled: true
        }).then(function(clientList) {
            // Check if there's already a window/tab open with the target URL
            for (let i = 0; i < clientList.length; i++) {
                const client = clientList[i];
                if (client.url === urlToOpen && 'focus' in client) {
                    return client.focus();
                }
            }
            // If not, open a new window/tab
            if (clients.openWindow) {
                return clients.openWindow(urlToOpen);
            }
        })
    );
});

self.addEventListener('notificationclose', function(event) {
    console.log('Notification closed:', event);
});

// Handle push subscription changes
self.addEventListener('pushsubscriptionchange', function(event) {
    console.log('Push subscription changed:', event);
    // You can handle subscription renewal here
});
