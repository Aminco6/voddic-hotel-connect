// ============================================================
// STAFF DASHBOARD - Complete JavaScript
// ============================================================

const API = "https://connectapi.voddic.com.ng/api/v1";
const token = localStorage.getItem("access_token");
const user = JSON.parse(localStorage.getItem("user") || "{}");
const hotel = JSON.parse(localStorage.getItem("hotel") || "{}");
const staff = JSON.parse(localStorage.getItem("staff") || "{}");

console.log("=== STAFF DASHBOARD DEBUG ===");
console.log("Token exists:", !!token);
console.log("User:", user);

if (!token) {
    console.log("No token found, redirecting to login");
    window.location.href = "/auth/login.html";
}

// ============================================================
// Helper Functions
// ============================================================

function getHeaders() {
    const token = localStorage.getItem("access_token");
    if (!token) {
        console.error("No token available");
        window.location.href = "/auth/login.html";
        return {};
    }
    return {
        "Authorization": "Bearer " + token,
        "Content-Type": "application/json"
    };
}

async function fetchWithAuth(url, options = {}) {
    const headers = getHeaders();
    if (!headers.Authorization) {
        window.location.href = "/auth/login.html";
        return null;
    }
    
    const response = await fetch(url, {
        ...options,
        headers: headers
    });
    
    if (response.status === 401) {
        console.log("Session expired, redirecting to login");
        localStorage.clear();
        window.location.href = "/auth/login.html";
        return null;
    }
    
    return response;
}

function showToast(msg, type) {
    var d = document.createElement("div");
    d.className = "toast " + (type || "info");
    d.textContent = msg;
    document.getElementById("toastContainer").appendChild(d);
    setTimeout(function() { d.remove(); }, 3000);
}

// ============================================================
// PWA Installation
// ============================================================

let deferredPrompt;

window.addEventListener('beforeinstallprompt', function(e) {
    e.preventDefault();
    deferredPrompt = e;
    console.log('📱 PWA installation available');
    
    // Show install banner
    const banner = document.getElementById('pwaInstallBanner');
    if (banner) {
        banner.style.display = 'flex';
        banner.classList.add('show');
    }
    
    // Show install link in sidebar
    const pwaNav = document.getElementById('pwaInstallNav');
    if (pwaNav) {
        pwaNav.style.display = 'flex';
    }
});

// Check if running as PWA
if (window.matchMedia('(display-mode: standalone)').matches) {
    console.log('📱 Running as PWA');
    const banner = document.getElementById('pwaInstallBanner');
    if (banner) {
        banner.style.display = 'none';
    }
    const pwaNav = document.getElementById('pwaInstallNav');
    if (pwaNav) {
        pwaNav.style.display = 'none';
    }
}

// Install button handler
document.addEventListener('DOMContentLoaded', function() {
    const installBtn = document.getElementById('installPwaBtn');
    if (installBtn) {
        installBtn.addEventListener('click', async function() {
            if (deferredPrompt) {
                deferredPrompt.prompt();
                const result = await deferredPrompt.userChoice;
                console.log('User choice:', result.outcome);
                deferredPrompt = null;
                const banner = document.getElementById('pwaInstallBanner');
                if (banner) {
                    banner.style.display = 'none';
                }
                const pwaNav = document.getElementById('pwaInstallNav');
                if (pwaNav) {
                    pwaNav.style.display = 'none';
                }
            }
        });
    }
});

window.installPWA = async function() {
    if (deferredPrompt) {
        deferredPrompt.prompt();
        const result = await deferredPrompt.userChoice;
        console.log('User choice:', result.outcome);
        deferredPrompt = null;
        const banner = document.getElementById('pwaInstallBanner');
        if (banner) {
            banner.style.display = 'none';
        }
        const pwaNav = document.getElementById('pwaInstallNav');
        if (pwaNav) {
            pwaNav.style.display = 'none';
        }
        return result.outcome === 'accepted';
    }
    return false;
};

// ============================================================
// Sidebar Toggle
// ============================================================

function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    
    if (!sidebar) return;
    
    const isOpen = sidebar.classList.contains('open');
    if (isOpen) {
        sidebar.classList.remove('open');
        if (overlay) overlay.classList.remove('active');
        document.body.style.overflow = '';
    } else {
        sidebar.classList.add('open');
        if (overlay) overlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

// ============================================================
// Variables
// ============================================================

var rooms = [];
var guestData = {};
var boundDevices = {};
var deviceCheckInterval = null;
var deactivatedRooms = {};
var sessionCheckoutTimes = {};
var timerInterval = null;
var expiredRooms = {};

// ============================================================
// DOM Ready
// ============================================================

document.addEventListener("DOMContentLoaded", function() {
    const token = localStorage.getItem("access_token");
    if (!token) {
        window.location.href = "/auth/login.html";
        return;
    }
    
    // Set user info
    document.getElementById("userName").textContent = user.full_name || user.email || "Staff";
    document.getElementById("userAvatar").textContent = (user.first_name || "S")[0].toUpperCase();
    document.getElementById("userRole").textContent = staff.position || staff.department || "Staff";
    document.getElementById("sidebarHotel").textContent = hotel.name || "Hotel";
    document.getElementById("sidebarDept").textContent = staff.department || "Staff";
    
    // Show/hide PWA install link in sidebar
    const isPWA = window.matchMedia('(display-mode: standalone)').matches;
    const pwaNav = document.getElementById('pwaInstallNav');
    if (pwaNav) {
        if (!isPWA && !localStorage.getItem('pwa_skipped')) {
            pwaNav.style.display = 'flex';
        } else {
            pwaNav.style.display = 'none';
        }
    }
    
    // Initialize
    initTabs();
    loadRooms();
    loadEmergencies();
    
    // Intervals
    setInterval(loadEmergencies, 30000);
    timerInterval = setInterval(updateAllTimers, 1000);
    deviceCheckInterval = setInterval(checkDeviceStatus, 5000);
    setInterval(checkExpiredSessions, 10000);
});

// ============================================================
// Tabs
// ============================================================

function initTabs() {
    document.querySelectorAll(".tab-btn[data-tab]").forEach(function(b) {
        b.addEventListener("click", function() { 
            switchTab(this.getAttribute("data-tab")); 
        });
    });
    document.querySelectorAll(".nav-item[data-tab]").forEach(function(item) {
        item.addEventListener("click", function(e) { 
            e.preventDefault();
            switchTab(this.getAttribute("data-tab")); 
        });
    });
}

function switchTab(tab) {
    document.querySelectorAll(".tab-btn").forEach(function(b) { b.classList.remove("active"); });
    document.querySelectorAll(".nav-item").forEach(function(n) { n.classList.remove("active"); });
    document.querySelectorAll(".tab-panel").forEach(function(p) { p.classList.remove("active"); });
    
    var btn = document.querySelector('.tab-btn[data-tab="' + tab + '"]');
    if (btn) btn.classList.add("active");
    
    var nav = document.querySelector('.nav-item[data-tab="' + tab + '"]');
    if (nav) nav.classList.add("active");
    
    var panel = document.getElementById("panel-" + tab);
    if (panel) panel.classList.add("active");
}

// ============================================================
// Rooms
// ============================================================

async function loadRooms() {
    console.log("Loading rooms...");
    try {
        const response = await fetchWithAuth(API + "/rooms/");
        if (!response) return;
        
        if (response.ok) {
            var d = await response.json();
            rooms = Array.isArray(d) ? d : (d.results || []);
            console.log("Rooms loaded:", rooms.length);
            await loadSessionDataForActiveRooms();
            populateRoomSelect();
            renderActiveRooms();
        } else {
            console.error("Failed to load rooms:", await response.text());
        }
    } catch (e) {
        console.error("Error loading rooms:", e);
    }
}

async function loadSessionDataForActiveRooms() {
    var activeRooms = rooms.filter(function(r) { return r.status === "ACTIVE_STAY"; });
    console.log("Loading session data for", activeRooms.length, "active rooms");

    for (var i = 0; i < activeRooms.length; i++) {
        var room = activeRooms[i];
        try {
            var response = await fetchWithAuth(API + "/sessions/status/" + room.room_number + "/");
            if (!response) continue;
            
            if (response.ok) {
                var data = await response.json();
                if (data.active && data.session) {
                    if (data.session.checkout_time) {
                        var checkoutDate = new Date(data.session.checkout_time);
                        if (!isNaN(checkoutDate.getTime())) {
                            sessionCheckoutTimes[room.id] = checkoutDate;
                            console.log("Room", room.room_number, "checkout time (Local):", checkoutDate.toLocaleString());
                        }
                    }
                    if (data.session.guest_name) {
                        guestData[room.id] = data.session.guest_name.split(',').map(function(s) { return s.trim(); });
                    }
                    boundDevices[room.id] = data.devices_bound || 0;
                    delete expiredRooms[room.id];
                } else if (!data.active && data.code === 'SESSION_EXPIRED') {
                    console.log("Room", room.room_number, "session is expired on server");
                    delete sessionCheckoutTimes[room.id];
                    delete guestData[room.id];
                    delete boundDevices[room.id];
                    delete deactivatedRooms[room.id];
                    expiredRooms[room.id] = true;
                    setTimeout(loadRooms, 1000);
                }
            }
        } catch (e) {
            console.error("Error loading session for room", room.room_number, ":", e);
        }
    }
}

function populateRoomSelect() {
    var sel = document.getElementById("roomSelect");
    if (!sel) return;
    
    var available = rooms.filter(function(r) { return r.status === "AVAILABLE" || r.status === "CLEANING"; });
    console.log("Available rooms:", available.length);
    
    if (available.length === 0) {
        sel.innerHTML = '<option value="">No rooms available</option>';
        return;
    }
    
    sel.innerHTML = '<option value="">Select room...</option>' + 
        available.map(function(r) {
            return '<option value="' + r.id + '">Room ' + r.room_number + ' (' + (r.room_type || "Standard") + ')</option>';
        }).join("");
}

function updateGuestFields() {
    var roomId = document.getElementById("roomSelect").value;
    var container = document.getElementById("guestFields");
    if (!roomId) { container.innerHTML = ''; return; }
    var room = rooms.find(function(r) { return r.id === roomId; });
    var capacity = room ? 2 : 1;
    var html = '<div style="margin-bottom:10px;"><label style="color:var(--text-dim);font-size:10px;text-transform:uppercase;">Guest Details (' + capacity + ' guest' + (capacity > 1 ? 's' : '') + ') <span style="color:var(--danger);">*Required</span></label></div>';
    for (var i = 1; i <= capacity; i++) {
        var required = i === 1 ? ' (Required)' : ' (Optional)';
        html += '<div class="guest-field"><input type="text" id="guestName' + i + '" placeholder="Guest ' + i + ' name or phone' + required + '" class="guest-input" ' + (i === 1 ? 'required' : '') + '></div>';
    }
    container.innerHTML = html;
}

// ============================================================
// Device Status
// ============================================================

async function checkDeviceStatus() {
    var activeRooms = rooms.filter(function(r) { return r.status === "ACTIVE_STAY"; });
    for (var i = 0; i < activeRooms.length; i++) {
        var room = activeRooms[i];
        try {
            var response = await fetchWithAuth(API + "/sessions/status/" + room.room_number + "/");
            if (!response) continue;
            
            if (response.ok) {
                var data = await response.json();
                if (data.active && data.session) {
                    var devicesBound = data.devices_bound || 0;
                    var roomId = room.id;
                    boundDevices[roomId] = devicesBound;

                    if (data.session.checkout_time) {
                        var checkoutDate = new Date(data.session.checkout_time);
                        if (!isNaN(checkoutDate.getTime())) {
                            sessionCheckoutTimes[roomId] = checkoutDate;
                        }
                    }

                    var roomElement = document.getElementById('room-' + roomId);
                    if (roomElement) {
                        var deviceContainer = roomElement.querySelector('.device-icons');
                        var deviceInfo = roomElement.querySelector('.device-info');

                        if (deviceContainer) {
                            var capacity = data.session.max_devices || 2;
                            var icons = '';
                            for (var j = 0; j < capacity; j++) {
                                var bound = j < devicesBound;
                                icons += '<div class="device-icon ' + (bound ? 'device-bound' : 'device-unbound') + '">&#128241;</div>';
                            }
                            deviceContainer.innerHTML = icons;
                        }

                        if (deviceInfo) {
                            deviceInfo.textContent = devicesBound + ' of ' + (data.session.max_devices || 2) + ' devices bound';
                        }
                    }
                } else if (!data.active && data.code === 'SESSION_EXPIRED') {
                    console.log("Device check: Room", room.room_number, "session expired");
                    var roomId = room.id;
                    delete sessionCheckoutTimes[roomId];
                    delete guestData[roomId];
                    delete boundDevices[roomId];
                    delete deactivatedRooms[roomId];
                    expiredRooms[roomId] = true;
                    setTimeout(loadRooms, 2000);
                }
            }
        } catch (e) {
            console.error("Error checking device status:", e);
        }
    }
}

// ============================================================
// Render Active Rooms
// ============================================================

function renderActiveRooms() {
    var grid = document.getElementById("activeRoomsGrid");
    if (!grid) return;
    
    var activeRooms = rooms.filter(function(r) { 
        return r.status === "ACTIVE_STAY" && !expiredRooms[r.id];
    });

    if (!activeRooms.length) {
        grid.innerHTML = '<p style="color:var(--text-dim);text-align:center;grid-column:1/-1;padding:40px;">No active rooms.</p>';
        return;
    }

    grid.innerHTML = activeRooms.map(function(r) {
        var capacity = 2;
        var deviceIcons = '';
        var boundCount = boundDevices[r.id] || 0;
        for (var i = 0; i < capacity; i++) {
            var bound = i < boundCount;
            deviceIcons += '<div class="device-icon ' + (bound ? 'device-bound' : 'device-unbound') + '">&#128241;</div>';
        }

        var guests = guestData[r.id] || [];
        var guestDisplay = guests.length ? guests.map(function(g, i) {
            return '<div style="font-size:.65rem;color:var(--text-dim);margin-top:2px;">&#128100; Guest ' + (i + 1) + ': ' + g + '</div>';
        }).join('') : '';
        var isDeactivated = deactivatedRooms[r.id] || false;

        return '<div class="room-card active" id="room-' + r.id + '">' +
            '<div class="room-header"><div class="room-number">Room ' + r.room_number + '</div><span class="room-type">' + (r.room_type || "Standard") + '</span></div>' +
            '<div class="room-details"><div><div class="rd-label">Floor</div><div class="rd-value">' + (r.floor || "—") + '</div></div>' +
            '<div><div class="rd-label">Price</div><div class="rd-value">₦' + (r.price || 0) + '</div></div>' +
            '<div><div class="rd-label">Capacity</div><div class="rd-value">' + capacity + ' guests</div></div>' +
            '<div><div class="rd-label">Status</div><div class="rd-value" style="color:' + (isDeactivated ? 'var(--warning)' : 'var(--success)') + ';">' + (isDeactivated ? 'Deactivated' : 'Active') + '</div></div></div>' +
            guestDisplay +
            '<div style="display:flex;gap:8px;align-items:center;margin:8px 0;"><div style="flex:1;text-align:center;font-size:.6rem;color:var(--text-dim);">Time Remaining</div><div style="flex:1;" class="countdown" id="timer-' + r.id + '">--:--:--</div></div>' +
            '<div class="device-icons">' + deviceIcons + '</div>' +
            '<div class="device-info">' + boundCount + ' of ' + capacity + ' devices bound</div>' +
            '<div class="room-actions">' +
            '<button class="btn btn-sm ' + (isDeactivated ? 'btn-success' : 'btn-danger') + '" onclick="toggleRoomActivation(\'' + r.id + '\',\'' + r.room_number + '\')">' + (isDeactivated ? '&#9654; Activate' : '&#10071; Deactivate') + '</button>' +
            '<button class="btn btn-sm btn-outline" onclick="resetRoom(\'' + r.id + '\',\'' + r.room_number + '\')">&#128472; Reset</button>' +
            '</div></div>';
    }).join('');
}

// ============================================================
// Timers
// ============================================================

function updateAllTimers() {
    var activeRooms = rooms.filter(function(r) { 
        return r.status === "ACTIVE_STAY" && !expiredRooms[r.id];
    });
    var now = new Date();

    activeRooms.forEach(function(r) {
        var timerEl = document.getElementById("timer-" + r.id);
        if (!timerEl) return;

        var checkoutTime = sessionCheckoutTimes[r.id];
        if (!checkoutTime) {
            timerEl.textContent = "--:--:--";
            timerEl.className = "countdown";
            return;
        }

        var diff = checkoutTime - now;
        var graceEnd = new Date(checkoutTime.getTime() + 10 * 60 * 1000);

        if (now > graceEnd) {
            timerEl.textContent = "EXPIRED";
            timerEl.className = "countdown danger";
            if (!expiredRooms[r.id]) {
                console.log("Timer: Room", r.room_number, "has expired, triggering cleanup");
                expiredRooms[r.id] = true;
                cleanupExpiredRoom(r.id, r.room_number);
            }
            return;
        }

        if (now > checkoutTime) {
            var graceMinutes = Math.ceil((graceEnd - now) / 60000);
            timerEl.textContent = "GRACE: " + graceMinutes + "m";
            timerEl.className = "countdown danger";
            return;
        }

        if (diff > 0) {
            var hours = Math.floor(diff / 3600000);
            var minutes = Math.floor((diff % 3600000) / 60000);
            var seconds = Math.floor((diff % 60000) / 1000);

            var display = "";
            if (hours > 0) {
                display += String(hours).padStart(2, '0') + ":";
            }
            display += String(minutes).padStart(2, '0') + ":" + String(seconds).padStart(2, '0');

            timerEl.textContent = display;

            if (diff < 3600000) {
                timerEl.className = "countdown warning";
            } else {
                timerEl.className = "countdown";
            }
        }
    });
}

// ============================================================
// Room Actions
// ============================================================

async function cleanupExpiredRoom(roomId, roomNumber) {
    console.log("Cleaning up expired room:", roomNumber);
    try {
        var response = await fetchWithAuth(API + "/sessions/status/" + roomNumber + "/");
        if (!response) return;
        
        if (response.ok) {
            var data = await response.json();
            if (!data.active && data.code === 'SESSION_EXPIRED') {
                console.log("Room", roomNumber, "cleaned up and archived");
                delete sessionCheckoutTimes[roomId];
                delete guestData[roomId];
                delete boundDevices[roomId];
                delete deactivatedRooms[roomId];
                delete expiredRooms[roomId];
                setTimeout(loadRooms, 1000);
            }
        }
    } catch (e) {
        console.error("Error cleaning up expired room:", e);
    }
}

async function checkExpiredSessions() {
    var activeRooms = rooms.filter(function(r) { 
        return r.status === "ACTIVE_STAY" && !expiredRooms[r.id];
    });
    var now = new Date();

    for (var i = 0; i < activeRooms.length; i++) {
        var room = activeRooms[i];
        var checkoutTime = sessionCheckoutTimes[room.id];
        if (checkoutTime) {
            var graceEnd = new Date(checkoutTime.getTime() + 10 * 60 * 1000);
            if (now > graceEnd) {
                console.log("Found expired session for room:", room.room_number);
                expiredRooms[room.id] = true;
                await cleanupExpiredRoom(room.id, room.room_number);
            }
        }
    }
}

async function toggleRoomActivation(roomId, roomNumber) {
    var room = rooms.find(function(r) { return r.id === roomId; });
    if (!room) { showToast("Room not found", "error"); return; }

    var isDeactivated = deactivatedRooms[roomId] || false;

    if (isDeactivated) {
        await reactivateRoom(roomId, roomNumber);
    } else {
        await deactivateRoom(roomId, roomNumber);
    }
}

async function deactivateRoom(roomId, roomNumber) {
    if (!confirm("Deactivate this room? Devices will be disconnected.")) return;

    try {
        var response = await fetchWithAuth(API + "/sessions/deactivate/" + roomNumber + "/", { method: "POST" });
        if (!response) return;
        
        if (response.ok) {
            var d = await response.json();
            showToast(d.message || "Room deactivated", "info");
            deactivatedRooms[roomId] = true;
            boundDevices[roomId] = 0;
            loadRooms();
        } else {
            var err = await response.json();
            showToast(err.error || "Failed", "error");
        }
    } catch (e) {
        showToast("Network error", "error");
    }
}

async function reactivateRoom(roomId, roomNumber) {
    try {
        var response = await fetchWithAuth(API + "/sessions/reactivate/" + roomNumber + "/", { method: "POST" });
        if (!response) return;
        
        if (response.ok) {
            var d = await response.json();
            showToast(d.message || "Room reactivated", "success");
            delete deactivatedRooms[roomId];
            loadRooms();
        } else {
            var err = await response.json();
            if (err.error && err.error.includes("expired")) {
                showToast("Session expired. Please create a new session.", "error");
                await resetRoom(roomId, roomNumber);
            } else {
                showToast(err.error || "Failed", "error");
            }
        }
    } catch (e) {
        showToast("Network error", "error");
    }
}

async function resetRoom(roomId, roomNumber) {
    if (!confirm("RESET this room?")) return;

    try {
        var response = await fetchWithAuth(API + "/sessions/reset/" + roomNumber + "/", { method: "POST" });
        if (!response) return;
        
        if (response.ok) {
            delete sessionCheckoutTimes[roomId];
            delete guestData[roomId];
            delete boundDevices[roomId];
            delete deactivatedRooms[roomId];
            delete expiredRooms[roomId];
            showToast("Room reset successfully", "info");
            loadRooms();
        } else {
            var err = await response.json();
            showToast(err.error || "Failed", "error");
        }
    } catch (e) {
        showToast("Network error", "error");
    }
}

async function activateRoom() {
    console.log("Activating room...");
    var roomId = document.getElementById("roomSelect").value;
    var date = document.getElementById("checkoutDate").value;
    var time = document.getElementById("checkoutTime").value || "12:00";
    if (!roomId || !date) { showToast("Select room and checkout date", "error"); return; }

    var guests = [];
    var guestFields = document.querySelectorAll("#guestFields input");
    var hasAtLeastOne = false;
    guestFields.forEach(function(inp, i) {
        var val = inp.value.trim();
        if (val) {
            guests.push(val);
            hasAtLeastOne = true;
        }
    });

    if (!hasAtLeastOne || guests.length === 0) {
        showToast("Please enter at least the first guest name", "error");
        return;
    }

    guestData[roomId] = guests;

    var checkoutDateTime = new Date(date + "T" + time + ":00");
    console.log("Checkout time set to (Local):", checkoutDateTime.toLocaleString());
    console.log("Checkout time sent to server (UTC):", checkoutDateTime.toISOString());

    sessionCheckoutTimes[roomId] = checkoutDateTime;
    var guestIdentifier = guests.join(", ");

    try {
        var body = {
            room_id: roomId,
            checkout_time: checkoutDateTime.toISOString(),
            guest_identifier: guestIdentifier,
            guest_names: guests,
            guest_phone: guests[0] || "",
            max_devices: guests.length || 1
        };
        console.log("Activate room payload:", body);
        
        var response = await fetchWithAuth(API + "/sessions/create/", {
            method: "POST",
            body: JSON.stringify(body)
        });
        if (!response) return;
        
        console.log("Activate response status:", response.status);

        if (response.ok) {
            var d = await response.json();
            console.log("Activate response:", d);
            showToast("Room activated! Guest session created.", "success");
            guestFields.forEach(function(inp) { inp.value = ""; });
            delete deactivatedRooms[roomId];
            delete expiredRooms[roomId];
            setTimeout(loadRooms, 500);
        } else {
            var d = await response.json();
            console.error("Activate error response:", d);
            showToast(d.error || "Failed", "error");
        }
    } catch (e) {
        console.error("Activate error:", e);
        showToast("Network error", "error");
    }
}

// ============================================================
// Emergencies
// ============================================================

async function loadEmergencies() {
    try {
        var response = await fetchWithAuth(API + "/emergency/");
        if (!response) return;
        
        if (response.ok) {
            var d = await response.json();
            var list = Array.isArray(d) ? d : (d.results || []);
            var active = list.filter(function(e) { return e.status === "ACTIVE"; });
            var badge = document.getElementById("emergBadge");
            var banner = document.getElementById("emergBanner");
            if (active.length > 0) {
                badge.style.display = "inline-block";
                badge.textContent = active.length;
                banner.classList.add("active");
            } else {
                badge.style.display = "none";
                banner.classList.remove("active");
            }
            document.getElementById("emergenciesList").innerHTML = active.length ?
                active.map(function(e) { return '<div style="background:var(--card);border-left:3px solid var(--danger);padding:14px;margin-bottom:8px;border-radius:8px;"><strong style="color:var(--danger);">&#128680; Room ' + e.room_number + '</strong></div>'; }).join("") :
                '<p style="color:var(--text-dim);text-align:center;padding:40px;">No active emergencies</p>';
        }
    } catch (e) {
        console.error("Load emergencies error:", e);
    }
}

// ============================================================
// Logout
// ============================================================

function logout() {
    localStorage.clear();
    window.location.href = "/auth/login.html";
}

// ============================================================
// Export Functions for Global Access
// ============================================================

window.toggleSidebar = toggleSidebar;
window.showToast = showToast;
window.logout = logout;
window.switchTab = switchTab;
window.loadRooms = loadRooms;
window.activateRoom = activateRoom;
window.updateGuestFields = updateGuestFields;
window.toggleRoomActivation = toggleRoomActivation;
window.resetRoom = resetRoom;
window.fetchWithAuth = fetchWithAuth;
window.getHeaders = getHeaders;

console.log("✅ Staff.js loaded successfully");




// staff/sw.js - Add this message handler

self.addEventListener('message', function(event) {
    console.log('Message received in SW:', event.data);
    
    if (event.data && event.data.type === 'check_install') {
        // Check if we have an install prompt available
        // We can't store the prompt in SW, but we can notify the client
        event.ports[0].postMessage({
            type: 'install_check_response',
            available: false // SW can't hold the prompt
        });
    }
});