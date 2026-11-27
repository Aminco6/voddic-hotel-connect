// staff/sw.js - Service Worker for Staff Push Notifications

const CACHE_NAME = 'voddic-staff-v3';
const ASSETS_TO_CACHE = [
    '/staff/dashboard/index.html',
    '/staff/dashboard/staff.js'
];

// ============================================================
// Install Event - Cache assets
// ============================================================
self.addEventListener('install', function(event) {
    console.log('[sw] installing');
    event.waitUntil(
        caches.open(CACHE_NAME).then(function(cache) {
            // Cache each asset individually — one 404 must not fail install
            return Promise.all(
                ASSETS_TO_CACHE.map(function(url) {
                    return cache.add(url).catch(function(err) {
                        console.warn('[sw] cache miss (safe):', url, err && err.message);
                    });
                })
            );
        }).then(function() {
            return self.skipWaiting();
        }).catch(function(err) {
            console.error('[sw] install FAILED:', err);
            // Never reject install — let it proceed without cache
        })
    );
});

// ============================================================
// Activate Event - Clean old caches
// ============================================================
self.addEventListener('activate', function(event) {
    console.log('⚡ Service Worker activating...');
    event.waitUntil(
        caches.keys().then(function(cacheNames) {
            return Promise.all(
                cacheNames.map(function(cacheName) {
                    if (cacheName !== CACHE_NAME) {
                        console.log('🗑️ Removing old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(function() {
            return self.clients.claim();
        })
    );
});

// ============================================================
// Fetch Event - Serve from cache when offline
// ============================================================
self.addEventListener('fetch', function(event) {
    // Network-first for API calls; cache-first for static assets
    var url = event.request.url || '';
    var isApi = url.indexOf('/api/') !== -1 || url.indexOf('connectapi.') !== -1;
    var isNavigation = event.request.mode === 'navigate';

    if (isApi || isNavigation) {
        // Pass-through — never fake a 503 for network requests
        return;   // let the browser handle it natively
    }

    event.respondWith(
        caches.match(event.request).then(function(response) {
            return response || fetch(event.request).catch(function() {
                return new Response('', { status: 504, statusText: 'Offline' });
            });
        })
    );
});

// ============================================================
// Push Event - Handle incoming push notifications
// ============================================================
self.addEventListener('push', function(event) {
    console.log('📨 Push received');

    let data = {};
    try {
        if (event.data) data = event.data.json();
    } catch (e) {
        console.log('❌ parse error', e);
        data = { title: 'Voddic', body: 'New notification' };
    }

    var payload = data.data || {};
    var isCall = (payload.type === 'incoming_call' || payload.call_id);

    if (isCall) {
        // ===== INCOMING CALL =====
        var callId = payload.call_id || 'unknown';
        var roomNumber = payload.room_number || 'Guest';
        var department = payload.department || 'Reception';
        var callerName = payload.caller_name || 'Guest';
        var title = data.title || '📞 Incoming Call';
        var body = data.body || ('Room ' + roomNumber + ' is calling ' + department);

        var callOptions = {
            body: body,
            icon: '/static/icons/phone-icon.png',
            badge: '/static/icons/badge-icon.png',
            vibrate: [200, 100, 200, 100, 200, 100, 200],
            tag: 'incoming-call-' + callId,
            requireInteraction: true,
            renotify: true,
            silent: false,
            data: {
                type: 'incoming_call',
                call_id: callId,
                room_number: roomNumber,
                department: department,
                department_id: payload.department_id,
                caller_name: callerName,
                timestamp: Date.now()
            },
            actions: [
                { action: 'answer', title: '✅ Answer' },
                { action: 'decline', title: '❌ Decline' }
            ]
        };
        event.waitUntil(
            self.registration.showNotification(title, callOptions)
                .then(function(){ console.log('✅ Call notification shown:', callId); })
                .catch(function(err){ console.log('❌ showNotification error:', err); })
        );
        return;
    }

    // ===== CHAT / ORDER / GENERAL =====
    var title = data.title || 'Voddic';
    var body = data.body || '';
    var url = (payload.url) || '/staff/dashboard/';
    var icon = data.icon || '/static/icons/icon-192.png';

    var options = {
        body: body,
        icon: icon,
        badge: '/static/icons/badge-icon.png',
        vibrate: [200, 100, 200],
        tag: 'notification-' + Date.now(),
        data: { url: url, type: payload.type || 'general' }
    };

    event.waitUntil(
        self.registration.showNotification(title, options)
            .then(function(){ console.log('✅ Notification shown:', title); })
            .catch(function(err){ console.log('❌ showNotification error:', err); })
    );
});

self.addEventListener('notificationclick', function(event) {
    console.log('🔔 Notification clicked:', event);
    
    // Close the notification immediately
    event.notification.close();
    
    const action = event.action;
    const notificationData = event.notification.data || {};
    const callId = notificationData.call_id;
    const roomNumber = notificationData.room_number || '---';
    const department = notificationData.department || 'Reception';
    const callerName = notificationData.caller_name || 'Guest';
    
    console.log('🔔 Action:', action);
    console.log('🔔 Call ID:', callId);
    console.log('🔔 Room:', roomNumber);
    console.log('🔔 Department:', department);
    console.log('🔔 Caller:', callerName);
    
    // Build the call interface URL
    const callInterfaceUrl = '/staff/dashboard/call-interface.html?call_id=' + callId + 
                            '&room=' + encodeURIComponent(roomNumber) + 
                            '&dept=' + encodeURIComponent(department) + 
                            '&caller=' + encodeURIComponent(callerName);
    
    if (action === 'answer') {
        // ANSWER - Open the call interface and auto-answer
        console.log('✅ Staff answered the call via notification');
        
        event.waitUntil(
            // First, try to find and focus existing call interface
            clients.matchAll({
                type: 'window',
                includeUncontrolled: true
            })
            .then(function(clientList) {
                console.log('📱 Found clients:', clientList.length);
                
                // Check if there's already a call interface open
                let existingCallWindow = null;
                for (var i = 0; i < clientList.length; i++) {
                    var client = clientList[i];
                    if (client.url && client.url.includes('call-interface.html')) {
                        existingCallWindow = client;
                        break;
                    }
                }
                
                // If call interface exists, focus it and send message
                if (existingCallWindow) {
                    console.log('📱 Focusing existing call interface');
                    return existingCallWindow.focus()
                        .then(function() {
                            // Send message to auto-answer
                            existingCallWindow.postMessage({
                                type: 'answer_call',
                                call_id: callId,
                                room_number: roomNumber,
                                department: department,
                                department_id: notificationData.department_id,
                                caller_name: callerName
                            });
                            return existingCallWindow;
                        });
                }
                
                // Open new call interface window
                console.log('📱 Opening new call interface:', callInterfaceUrl);
                return clients.openWindow(callInterfaceUrl)
                    .then(function(newWindow) {
                        if (newWindow) {
                            console.log('📱 New window opened, sending answer message');
                            // Send auto-answer message to the new window
                            setTimeout(function() {
                                newWindow.postMessage({
                                    type: 'answer_call',
                                    call_id: callId,
                                    room_number: roomNumber,
                                    department: department,
                                    department_id: notificationData.department_id,
                                    caller_name: callerName
                                });
                            }, 1500);
                        }
                        return newWindow;
                    });
            })
            .catch(function(err) {
                console.log('❌ Error opening call interface:', err);
                // Fallback: just open the call page
                return clients.openWindow('/staff/dashboard/call.html');
            })
        );
        
    } else if (action === 'decline') {
        // DECLINE - Decline the call
        console.log('❌ Staff declined the call via notification');
        
        event.waitUntil(
            // Send decline message to any open windows
            clients.matchAll({
                type: 'window',
                includeUncontrolled: true
            })
            .then(function(clientList) {
                clientList.forEach(function(client) {
                    client.postMessage({
                        type: 'decline_call',
                        call_id: callId,
                        room_number: roomNumber,
                        department: department
                    });
                });
            })
            .then(function() {
                // Open call page with decline status
                return clients.openWindow('/staff/dashboard/call.html?declined=true&call_id=' + callId);
            })
        );
        
    } else {
        // DEFAULT - Just open the call dashboard
        console.log('📱 Opening call dashboard');
        event.waitUntil(
            clients.openWindow('/staff/dashboard/call.html')
        );
    }
});

// ============================================================
// Message Event - Handle messages from client pages
// ============================================================
self.addEventListener('message', function(event) {
    console.log('📨 Message received in Service Worker:', event.data);
    
    const data = event.data || {};
    
    if (data.type === 'answer_call') {
        console.log('📨 Answer call message received for call:', data.call_id);
        
        // Show notification that call is being connected
        self.registration.showNotification('📞 Connecting Call', {
            body: 'Connecting you to the guest...',
            icon: '/static/icons/phone-icon.png',
            tag: 'connecting-call-' + data.call_id,
            requireInteraction: false
        }).then(function() {
            // Close the connecting notification after 3 seconds
            setTimeout(function() {
                self.registration.getNotifications({ tag: 'connecting-call-' + data.call_id })
                    .then(function(notifications) {
                        notifications.forEach(function(notif) {
                            notif.close();
                        });
                    });
            }, 3000);
        });
    }
    
    if (data.type === 'call_connected') {
        console.log('📨 Call connected message received for call:', data.call_id);
    }
    
    if (data.type === 'call_ended') {
        console.log('📨 Call ended message received for call:', data.call_id);
    }
});

// ============================================================
// Notification Close Event - Handle when notification is dismissed
// ============================================================
self.addEventListener('notificationclose', function(event) {
    console.log('🔕 Notification closed without action');
    const notificationData = event.notification.data || {};
    const callId = notificationData.call_id;
    
    if (callId) {
        console.log('🔕 Call notification dismissed for:', callId);
    }
});