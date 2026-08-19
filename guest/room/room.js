const API = "https://connectapi.voddic.com.ng/api/v1";
var hotelData = null;
var roomData = null;
var hotelPhone = "";
var deviceId = localStorage.getItem("voddic_device_id") || "DEV_" + Math.random().toString(36).substr(2, 9).toUpperCase();
localStorage.setItem("voddic_device_id", deviceId);

// Parse URL params
var params = new URLSearchParams(window.location.search);
var roomNumber = params.get("room") || params.get("rn") || "";
var hotelSlug = params.get("hotel") || params.get("h") || "";

document.addEventListener("DOMContentLoaded", function() {
    if (!roomNumber) {
        showError("No room number provided");
        return;
    }
    loadRoomData();
});

async function loadRoomData() {
    try {
        // First get hotel by slug or search
        if (hotelSlug) {
            var hotelRes = await fetch(API + "/hotels/slug/" + hotelSlug + "/");
            if (hotelRes.ok) {
                hotelData = await hotelRes.json();
            }
        }
        
        // If no hotel found by slug, search all hotels
        if (!hotelData) {
            var r = await fetch(API + "/hotels/public-list/");
            if (r.ok) {
                var hotels = await r.json();
                var list = Array.isArray(hotels) ? hotels : (hotels.results || []);
                
                for (var i = 0; i < list.length; i++) {
                    var h = list[i];
                    var rooms = h.rooms || [];
                    for (var j = 0; j < rooms.length; j++) {
                        if (rooms[j].room_number === roomNumber || rooms[j].id === roomNumber) {
                            hotelData = h;
                            roomData = rooms[j];
                            break;
                        }
                    }
                    if (hotelData) break;
                }
            }
        }
        
        if (hotelData && roomData) {
            document.getElementById("hotelName").textContent = hotelData.name || "Hotel";
            document.getElementById("hotelAddr").textContent = hotelData.address || hotelData.city || "";
            document.getElementById("roomNum").textContent = roomData.room_number || roomNumber;
            document.getElementById("roomDetail").textContent = (roomData.room_type || "Standard") + " · Floor " + (roomData.floor || "—");
            if (hotelData.phone) hotelPhone = hotelData.phone;
            if (hotelData.logo_url_display || hotelData.logo) {
                document.getElementById("hotelLogo").innerHTML = '<img src="' + (hotelData.logo_url_display || hotelData.logo) + '" style="width:100%;height:100%;object-fit:cover;border-radius:16px;">';
            }
            
            // Check if session exists
            checkSession();
        } else {
            document.getElementById("hotelName").textContent = "Hotel Not Found";
            document.getElementById("roomNum").textContent = roomNumber;
        }
    } catch (e) {
        console.error("Error loading room:", e);
        showError("Could not load room data");
    }
}

async function checkSession() {
    try {
        var res = await fetch(API + "/sessions/status/" + roomNumber + "/");
        if (res.ok) {
            var data = await res.json();
            
            if (data.active && data.session) {
                document.getElementById("sessionInfo").style.display = "block";
                var dots = "";
                var maxDevices = data.session.max_devices || 2;
                var boundCount = data.devices_bound || 0;
                
                for (var i = 0; i < maxDevices; i++) {
                    dots += '<div class="device-dot ' + (i < boundCount ? 'dot-bound' : 'dot-free') + '"></div>';
                }
                document.getElementById("deviceDots").innerHTML = dots;
                document.getElementById("deviceCount").textContent = boundCount + "/" + maxDevices + " devices";
                document.getElementById("sessionStatus").textContent = data.can_bind ? "Room Active · Space Available" : "Room Full";
                
                // Check if device already bound
                var checkRes = await fetch(API + "/sessions/verify-device/", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ device_id: deviceId, room_number: roomNumber })
                });
                
                if (checkRes.ok) {
                    // Already bound - auto redirect
                    autoRedirect();
                    return;
                }
                
                if (!data.can_bind) {
                    document.getElementById("stepVerify").style.display = "none";
                    document.getElementById("stepDone").style.display = "block";
                    document.getElementById("doneTitle").textContent = "Device Limit Reached";
                    document.getElementById("doneMsg").textContent = "All " + maxDevices + " device slots are filled.";
                }
            } else {
                document.getElementById("stepVerify").style.display = "none";
                document.getElementById("stepDone").style.display = "block";
                document.getElementById("doneTitle").textContent = "Room Not Active";
                document.getElementById("doneMsg").textContent = "This room hasn't been activated. Please visit reception.";
            }
        }
    } catch (e) {
        console.error("Session check error:", e);
    }
}

async function verifyGuest() {
    var identifier = document.getElementById("guestIdentifier").value.trim();
    if (!identifier) {
        showError("Please enter your name or phone number");
        return;
    }

    showError("");
    showSuccess("");
    
    var btn = document.getElementById("verifyBtn");
    btn.disabled = true;
    btn.textContent = "Verifying...";
    
    try {
        var res = await fetch(API + "/sessions/bind-device/", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                room_number: roomNumber,
                device_id: deviceId,
                guest_identifier: identifier,
                public_key: "pk_" + deviceId,
                device_name: "Guest Device"
            })
        });
        
        var data = await res.json();
        
        if (res.ok) {
            // Store session
            localStorage.setItem("voddic_session_" + roomNumber, JSON.stringify({
                deviceId: deviceId,
                roomNumber: roomNumber,
                hotelId: hotelData ? hotelData.id : "",
                hotelSlug: hotelSlug,
                boundAt: new Date().toISOString()
            }));
            
            document.getElementById("stepVerify").style.display = "none";
            document.getElementById("stepDone").style.display = "block";
            document.getElementById("doneTitle").textContent = "✅ Device Bound!";
            document.getElementById("doneMsg").textContent = "Your device is now securely connected.";
            
            showSuccess("Connected!");
            
            // Auto redirect to services
            setTimeout(function() {
                autoRedirect();
            }, 2000);
        } else {
            showError(data.error || "Verification failed");
        }
    } catch (e) {
        showError("Network error");
    } finally {
        btn.disabled = false;
        btn.textContent = "Verify & Activate Room";
    }
}

function autoRedirect() {
    var sessionData = {
        roomNumber: roomNumber,
        hotelSlug: hotelSlug,
        hotelId: hotelData ? hotelData.id : "",
        deviceId: deviceId,
        hotelName: hotelData ? hotelData.name : "",
        hotelAddress: hotelData ? hotelData.address : "",
        hotelPhone: hotelPhone
    };
    localStorage.setItem("voddic_guest_session", JSON.stringify(sessionData));
    window.location.href = "/guest/room/services.html?room=" + roomNumber + "&hotel=" + hotelSlug + "&device=" + deviceId;
}

function goToServices() {
    autoRedirect();
}

function callReception() {
    var phone = hotelPhone || "";
    if (phone) {
        window.location.href = "tel:" + phone.replace(/\s/g, "");
    } else {
        alert("Reception phone not available");
    }
}

function showError(msg) {
    var el = document.getElementById("errorMsg");
    el.textContent = msg;
    el.classList.add("show");
    setTimeout(function() { el.classList.remove("show"); }, 5000);
}

function showSuccess(msg) {
    var el = document.getElementById("successMsg");
    el.textContent = msg;
    el.classList.add("show");
    setTimeout(function() { el.classList.remove("show"); }, 3000);
}
