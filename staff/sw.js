// staff/sw.js - Service Worker for Staff Push Notifications

const CACHE_NAME = 'voddic-staff-v1';
const ASSETS_TO_CACHE = [
    '/staff/dashboard/index.html',
    '/staff/dashboard/call.html',
    '/staff/dashboard/call-interface.html',
    '/staff/dashboard/staff.js',
    '/static/icons/phone-icon.png',
    '/static/icons/badge-icon.png'
];

// ============================================================
// Install Event - Cache assets
// ============================================================
self.addEventListener('install', function(event) {
    console.log('📦 Service Worker installing...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(function(cache) {
                console.log('📦 Caching assets...');
                return cache.addAll(ASSETS_TO_CACHE);
            })
            .then(function() {
                return self.skipWaiting();
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
    event.respondWith(
        caches.match(event.request)
            .then(function(response) {
                if (response) {
                    return response;
                }
                return fetch(event.request);
            })
            .catch(function() {
                // If offline and not cached, return a fallback
                return new Response('Offline', {
                    status: 503,
                    statusText: 'Service Unavailable'
                });
            })
    );
});

// ============================================================
// Push Event - Handle incoming push notifications
// ============================================================
self.addEventListener('push', function(event) {
    console.log('📨 Push notification received:', event);
    
    let data = {};
    let callData = {};
    
    try {
        if (event.data) {
            data = event.data.json();
            console.log('📨 Push data parsed:', data);
            callData = data.data || {};
        }
    } catch(e) {
        console.log('❌ Error parsing push data:', e);
        // Use fallback data
        data = {
            title: '📞 Incoming Call',
            body: 'A guest is calling',
            data: {}
        };
        callData = {};
    }
    
    // Extract call information
    const callId = callData.call_id || 'unknown';
    const roomNumber = callData.room_number || 'Guest';
    const department = callData.department || 'Reception';
    const callerName = callData.caller_name || 'Guest';
    const title = data.title || '📞 Incoming Call';
    const body = data.body || `Room ${roomNumber} is calling ${department}`;
    
    console.log('📞 Call Info:', { callId, roomNumber, department, callerName });
    
    const options = {
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
            department_id: callData.department_id,
            caller_name: callerName,
            timestamp: Date.now()
        },
        actions: [
            { action: 'answer', title: '✅ Answer', icon: '/static/icons/answer-icon.png' },
            { action: 'decline', title: '❌ Decline', icon: '/static/icons/decline-icon.png' }
        ]
    };
    
    event.waitUntil(
        self.registration.showNotification(title, options)
            .then(function() {
                console.log('✅ Notification shown for call:', callId);
            })
            .catch(function(err) {
                console.log('❌ Error showing notification:', err);
            })
    );
});

// ============================================================
// Notification Click Event - Handle notification interactions
// ============================================================
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