// ============================================================
// Voddic QR Code Management - JavaScript
// ============================================================

const API = "https://connectapi.voddic.com.ng/api/v1";
const token = localStorage.getItem("access_token");
const user = JSON.parse(localStorage.getItem("user") || "{}");
const hotel = JSON.parse(localStorage.getItem("hotel") || "{}");
const headers = { "Authorization": "Bearer " + token, "Content-Type": "application/json" };

if (!token) window.location.href = "/auth/login.html";

// Global variables
var rooms = [];
var qrGenerated = {};
var hotelSlug = "";
var hotelName = "";
var hotelId = "";

console.log("🚀 QR Codes JS loaded");
console.log("🔑 Token:", token ? "Present" : "Missing");
console.log("👤 User:", user);
console.log("🏨 Hotel from localStorage:", hotel);

// ============================================================
// DOM Ready
// ============================================================
document.addEventListener("DOMContentLoaded", function() {
    console.log("📄 DOM Ready");
    initSidebar();
    populateSidebarInfo();
    fetchHotelData().then(function() {
        loadRooms();
    });
});

// ============================================================
// Sidebar Functions
// ============================================================
function toggleSidebar() {
    var sidebar = document.getElementById('sidebar');
    var overlay = document.getElementById('sidebarOverlay');
    var isOpen = sidebar.classList.contains('open');
    if (isOpen) {
        sidebar.classList.remove('open');
        overlay.classList.remove('active');
        document.body.style.overflow = '';
    } else {
        sidebar.classList.add('open');
        overlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

function initSidebar() {
    var navItems = document.querySelectorAll('.nav-item[data-page]');
    navItems.forEach(function(item) {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            var page = this.getAttribute('data-page');
            if (page === 'qrcodes') return;
            navItems.forEach(function(ni) { ni.classList.remove('active'); });
            this.classList.add('active');
            if (window.innerWidth <= 768) toggleSidebar();
            showToast('Navigating to ' + this.textContent.trim() + '...', 'info');
        });
    });
}

function populateSidebarInfo() {
    var hn = document.getElementById('sidebarHotelName');
    if (hn) hn.textContent = hotel.name || 'Hotel';
    var un = document.getElementById('userName');
    if (un) {
        var name = user.name || user.full_name || user.email || 'User';
        un.textContent = name;
    }
    var ua = document.getElementById('userAvatar');
    if (ua) {
        var name = user.name || user.full_name || user.email || 'U';
        ua.textContent = name.charAt(0).toUpperCase();
    }
    var ur = document.getElementById('userRole');
    if (ur) {
        ur.textContent = user.role || user.user_type || 'Hotel Staff';
    }
}

function logout() {
    showToast('Signing out...', 'info');
    setTimeout(function() {
        localStorage.removeItem('access_token');
        localStorage.removeItem('user');
        localStorage.removeItem('hotel');
        window.location.href = '/auth/login.html';
    }, 800);
}

// ============================================================
// Slug Helper
// ============================================================
function createSlug(name) {
    if (!name) return "hotel";
    return name.toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, "")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "");
}

// ============================================================
// Fetch Hotel Data
// ============================================================
async function fetchHotelData() {
    try {
        var userId = user.id || user.user_id;
        console.log("👤 Current User ID:", userId);
        
        // FIRST: Try the /hotels/my_hotel/ endpoint
        try {
            console.log("📡 Fetching my hotel from:", API + "/hotels/my_hotel/");
            var myHotelRes = await fetch(API + "/hotels/my_hotel/", { headers: headers });
            
            if (myHotelRes.ok) {
                var hotelData = await myHotelRes.json();
                console.log("✅ My hotel data:", hotelData);
                
                if (hotelData && hotelData.id) {
                    hotelName = hotelData.name || "Hotel";
                    hotelSlug = hotelData.slug || createSlug(hotelName);
                    hotelId = hotelData.id;
                    
                    localStorage.setItem('hotel', JSON.stringify({
                        id: hotelId,
                        name: hotelName,
                        slug: hotelSlug
                    }));
                    
                    var hn = document.getElementById('sidebarHotelName');
                    if (hn) hn.textContent = hotelName;
                    
                    console.log("🏨 FINAL - Hotel Name:", hotelName);
                    console.log("📋 FINAL - Hotel Slug:", hotelSlug);
                    console.log("🆔 FINAL - Hotel ID:", hotelId);
                    return true;
                }
            }
        } catch(e) {
            console.log("⚠️ Error fetching my hotel:", e.message);
        }
        
        // SECOND: Try the /hotels/ endpoint
        try {
            console.log("📡 Fetching hotels from:", API + "/hotels/");
            var res = await fetch(API + "/hotels/", { headers: headers });
            
            if (res.ok) {
                var data = await res.json();
                console.log("✅ Hotels data:", data);
                
                var hotelsList = null;
                if (data.results && data.results.length > 0) {
                    hotelsList = data.results;
                } else if (Array.isArray(data) && data.length > 0) {
                    hotelsList = data;
                }
                
                if (hotelsList && hotelsList.length > 0) {
                    var hotelData = hotelsList[0];
                    hotelName = hotelData.name || "Hotel";
                    hotelSlug = hotelData.slug || createSlug(hotelName);
                    hotelId = hotelData.id;
                    
                    localStorage.setItem('hotel', JSON.stringify({
                        id: hotelId,
                        name: hotelName,
                        slug: hotelSlug
                    }));
                    
                    var hn = document.getElementById('sidebarHotelName');
                    if (hn) hn.textContent = hotelName;
                    
                    console.log("🏨 FINAL - Hotel Name:", hotelName);
                    console.log("📋 FINAL - Hotel Slug:", hotelSlug);
                    console.log("🆔 FINAL - Hotel ID:", hotelId);
                    return true;
                }
            }
        } catch(e) {
            console.log("⚠️ Error fetching from /hotels/:", e.message);
        }
        
        // THIRD: Try the hotel/slug/ endpoint
        try {
            console.log("📡 Fetching hotel slug from:", API + "/hotels/hotel/slug/");
            var slugRes = await fetch(API + "/hotels/hotel/slug/", { headers: headers });
            
            if (slugRes.ok) {
                var slugData = await slugRes.json();
                console.log("✅ Hotel slug data:", slugData);
                
                if (slugData && slugData.id) {
                    hotelName = slugData.name || "Hotel";
                    hotelSlug = slugData.slug || createSlug(hotelName);
                    hotelId = slugData.id;
                    
                    localStorage.setItem('hotel', JSON.stringify({
                        id: hotelId,
                        name: hotelName,
                        slug: hotelSlug
                    }));
                    
                    var hn = document.getElementById('sidebarHotelName');
                    if (hn) hn.textContent = hotelName;
                    
                    console.log("🏨 FINAL - Hotel Name:", hotelName);
                    console.log("📋 FINAL - Hotel Slug:", hotelSlug);
                    console.log("🆔 FINAL - Hotel ID:", hotelId);
                    return true;
                }
            }
        } catch(e) {
            console.log("⚠️ Error fetching slug:", e.message);
        }
        
        // FOURTH: Check localStorage
        if (hotel.id) {
            console.log("📦 Using hotel from localStorage:", hotel);
            hotelName = hotel.name || "Hotel";
            hotelSlug = hotel.slug || createSlug(hotelName);
            hotelId = hotel.id;
            
            var hn = document.getElementById('sidebarHotelName');
            if (hn) hn.textContent = hotelName;
            
            console.log("🏨 FINAL - Hotel Name:", hotelName);
            console.log("📋 FINAL - Hotel Slug:", hotelSlug);
            console.log("🆔 FINAL - Hotel ID:", hotelId);
            return true;
        }
        
        // FINAL FALLBACK
        console.log("⚠️ Using fallback - no hotel found");
        hotelName = "Hotel";
        hotelSlug = "hotel";
        hotelId = "";
        
    } catch(e) {
        console.log("❌ Error fetching hotel data:", e);
        hotelName = hotel.name || "Hotel";
        hotelSlug = createSlug(hotelName);
        hotelId = hotel.id || "";
    }
    
    return true;
}

// ============================================================
// Load Rooms - FIXED
// ============================================================
async function loadRooms() {
    try {
        console.log("📡 Fetching rooms from:", API + "/rooms/");
        console.log("🏨 Filtering for hotel ID:", hotelId);
        console.log("🏨 Hotel Name:", hotelName);
        
        var res = await fetch(API + "/rooms/", { headers: headers });
        
        if (res.ok) {
            var data = await res.json();
            console.log("✅ Rooms data received:", data);
            
            var allRooms = Array.isArray(data) ? data : (data.results || []);
            console.log("📊 Total rooms from API:", allRooms.length);
            
            // Log room details to see the data structure
            if (allRooms.length > 0) {
                console.log("📋 Room data sample:", allRooms[0]);
                console.log("📋 All room hotel IDs:", allRooms.map(function(r) {
                    return "Room " + r.room_number + " - Hotel: " + (r.hotel || r.hotel_id || "unknown");
                }));
            } else {
                console.log("📋 No rooms found in API response");
            }
            
            // Filter rooms - try multiple ways to match
            if (hotelId && allRooms.length > 0) {
                rooms = allRooms.filter(function(r) {
                    // Check multiple possible field names for hotel ID
                    var roomHotelId = r.hotel || r.hotel_id || r.hotelId || r.hotelID;
                    
                    // If roomHotelId is an object with an id property
                    if (roomHotelId && typeof roomHotelId === 'object') {
                        roomHotelId = roomHotelId.id || roomHotelId;
                    }
                    
                    // Compare as strings to handle UUID format
                    var match = String(roomHotelId) === String(hotelId);
                    
                    // Also check if the room has a hotel object with name
                    if (!match && r.hotel && typeof r.hotel === 'object' && r.hotel.name) {
                        match = r.hotel.name === hotelName;
                    }
                    
                    // Also check if room has a hotel_name field
                    if (!match && r.hotel_name) {
                        match = r.hotel_name === hotelName;
                    }
                    
                    return match;
                });
                console.log("📊 Rooms for hotel " + hotelName + ":", rooms.length);
            } else {
                rooms = allRooms;
                console.log("📊 All rooms (no hotel filter or no rooms):", rooms.length);
            }
            
            // If no rooms found but there are rooms in the API, try a fallback
            if (rooms.length === 0 && allRooms.length > 0) {
                console.log("⚠️ No rooms matched. Debugging room hotel IDs:");
                allRooms.forEach(function(r) {
                    console.log("Room:", r.room_number, "Hotel ID:", r.hotel || r.hotel_id || "null", "Type:", typeof (r.hotel || r.hotel_id));
                });
                console.log("🔍 Expected Hotel ID:", hotelId, "Type:", typeof hotelId);
                
                // Check if the first room has a hotel object with id
                if (allRooms[0] && allRooms[0].hotel && typeof allRooms[0].hotel === 'object') {
                    var firstHotelId = allRooms[0].hotel.id || allRooms[0].hotel;
                    console.log("💡 First room's hotel ID format:", firstHotelId);
                    
                    // If the hotel ID format is different, try to match by the hotel name from the room
                    if (allRooms[0].hotel && allRooms[0].hotel.name) {
                        rooms = allRooms.filter(function(r) {
                            return r.hotel && r.hotel.name === hotelName;
                        });
                        console.log("📊 Rooms matched by hotel name:", rooms.length);
                    }
                }
                
                // If still no rooms, show all rooms as fallback
                if (rooms.length === 0) {
                    console.log("💡 Showing all rooms as fallback (no filter)");
                    rooms = allRooms;
                }
            }
            
            var rb = document.getElementById('roomsBadge');
            if (rb) rb.textContent = rooms.length;
            renderCards();
            
            // Auto-generate all QR codes
            setTimeout(function() {
                generateAllQR();
            }, 500);
        } else {
            console.error("❌ Failed to load rooms:", res.status, res.statusText);
            showToast("Failed to load rooms. Please add rooms first.", "error");
            var row = document.getElementById("cardsRow");
            row.innerHTML = '<p style="color:#666;text-align:center;padding:80px;width:100%;">Failed to load rooms. Please add rooms first.</p>';
        }
    } catch(e) {
        console.log("❌ Room load error:", e);
        showToast("Failed to load rooms", "error");
        var row = document.getElementById("cardsRow");
        row.innerHTML = '<p style="color:#666;text-align:center;padding:80px;width:100%;">Error loading rooms. Please refresh the page.</p>';
    }
}

function updateSummary() {
    document.getElementById("sumTotal").textContent = rooms.length;
    document.getElementById("sumActive").textContent = rooms.filter(function(r) { return r.status === "ACTIVE_STAY"; }).length;
    document.getElementById("sumVacant").textContent = rooms.filter(function(r) { return r.status === "AVAILABLE"; }).length;
    document.getElementById("sumQR").textContent = Object.keys(qrGenerated).length;
}

// ============================================================
// Render Cards
// ============================================================
function renderCards(filtered) {
    var list = filtered || rooms;
    var row = document.getElementById("cardsRow");
    updateSummary();
    
    var slug = hotelSlug || createSlug(hotelName || "Hotel");
    var displayName = hotelName || hotel.name || "Hotel";
    
    console.log("🎨 Rendering cards with slug:", slug, "name:", displayName);
    console.log("📊 Rooms to render:", list.length);
    
    if (!list.length) {
        row.innerHTML = '<p style="color:#666;text-align:center;padding:80px;width:100%;">No rooms found for ' + displayName + '. Please add rooms first.</p>';
        return;
    }
    
    var baseUrl = "https://connect.voddic.com.ng";
    row.innerHTML = "";
    
    list.forEach(function(r, index) {
        var qid = "qr_" + r.id;
        var rn = r.room_number || "---";
        var qrUrl = baseUrl + "/guest/room/?hotel=" + slug + "&room=" + rn;
        
        var logoHtml = '<div class="card-shield"><svg viewBox="0 0 24 24" fill="none"><path d="M12 2L4 5v6c0 5 3.4 8.7 8 9 4.6-.3 8-4 8-9V5l-8-3z" fill="currentColor"/><path d="M9 12c0-1.7 1.3-3 3-3s3 1.3 3 3" stroke="#0d2149" stroke-width="1.4" fill="none"/><circle cx="12" cy="9" r="1.1" fill="#0d2149"/><path d="M12 13v2.5" stroke="#0d2149" stroke-width="1.4"/></svg></div>';
        
        var div = document.createElement("div");
        div.className = "card-stand";
        div.setAttribute("data-room-id", r.id);
        div.innerHTML =
            '<div class="qr-card" id="card_' + r.id + '">' +
                '<div class="card-brand">' + logoHtml +
                    '<div class="card-brand-text">' +
                        '<div class="card-hotel-name">' + displayName + '</div>' +
                        '<div class="card-tag">Hotel Connect</div>' +
                    '</div>' +
                '</div>' +
                '<div class="card-room">Room <b>' + rn + '</b></div>' +
                '<div class="card-scan">SCAN FOR ALL<br>HOTEL SERVICES</div>' +
                '<div class="card-qr-box" id="' + qid + '"></div>' +
                '<div class="card-visit">OR VISIT<br><span class="card-visit-url">' + baseUrl.replace(/^https?:\/\//, '') + '/guest/room/?hotel=' + slug + '&room=' + rn + '</span></div>' +
                '<div class="card-icons">' +
                    '<div class="card-icon-item"><div class="card-icon-circle">&#128680;</div><div class="card-icon-label">Emergency</div></div>' +
                    '<div class="card-icon-item"><div class="card-icon-circle">&#128203;</div><div class="card-icon-label">Services</div></div>' +
                    '<div class="card-icon-item"><div class="card-icon-circle">&#128172;</div><div class="card-icon-label">Chat</div></div>' +
                    '<div class="card-icon-item"><div class="card-icon-circle">&#128222;</div><div class="card-icon-label">Call</div></div>' +
                '</div>' +
                '<div class="card-footer-bar">We are here to serve you better!</div>' +
            '</div>' +
            '<div class="card-base"></div>' +
            '<div class="card-btns">' +
                '<button class="btn btn-gold" onclick="generateQR(\'' + r.id + '\', \'' + qid + '\', \'' + qrUrl + '\')">Generate QR</button>' +
                '<button class="btn btn-outline" onclick="downloadCard(\'' + r.id + '\', \'' + rn + '\')">Download Card</button>' +
                '<button class="btn btn-outline" onclick="printCard(\'' + r.id + '\')">Print Card</button>' +
            '</div>';
        row.appendChild(div);
    });
    
    Object.keys(qrGenerated).forEach(function(rid) {
        var container = document.getElementById("qr_" + rid);
        if (container && !container.innerHTML && qrGenerated[rid]) {
            new QRCode(container, {
                text: qrGenerated[rid],
                width: 256,
                height: 256,
                colorDark: "#0d2149",
                colorLight: "#ffffff",
                correctLevel: QRCode.CorrectLevel.M
            });
        }
    });
}

// ============================================================
// QR Code Functions
// ============================================================
function generateQR(rid, qid, qurl) {
    console.log("🔲 Generating QR for room:", rid, "URL:", qurl);
    qrGenerated[rid] = qurl;
    var container = document.getElementById(qid);
    if (!container) {
        console.error("❌ Container not found:", qid);
        return;
    }
    container.innerHTML = "";
    new QRCode(container, {
        text: qurl,
        width: 256,
        height: 256,
        colorDark: "#0d2149",
        colorLight: "#ffffff",
        correctLevel: QRCode.CorrectLevel.M
    });
    updateSummary();
    showToast("QR code generated for Room " + getRoomNumber(rid), "success");
}

function generateAllQR() {
    var slug = hotelSlug || createSlug(hotelName || hotel.name || "Hotel");
    var baseUrl = "https://connect.voddic.com.ng";
    
    console.log("🔄 Generating all QR codes with slug:", slug);
    console.log("📊 Rooms count:", rooms.length);
    
    if (!rooms.length) {
        showToast("No rooms found for " + hotelName + " to generate QR codes", "warning");
        return;
    }
    
    rooms.forEach(function(r) {
        var qid = "qr_" + r.id;
        var qrUrl = baseUrl + "/guest/room/?hotel=" + slug + "&room=" + (r.room_number || "");
        if (!qrGenerated[r.id]) {
            generateQR(r.id, qid, qrUrl);
        }
    });
    showToast("All QR codes for " + hotelName + " generated!", "success");
}

function getRoomNumber(rid) {
    var room = rooms.find(function(r) { return r.id === rid; });
    return room ? room.room_number : "---";
}

// ============================================================
// DOWNLOAD FULL CARD - Using html2canvas
// ============================================================
function downloadCard(rid, rn) {
    var cardElement = document.getElementById("card_" + rid);
    if (!cardElement) {
        showToast("Card not found for Room " + rn, "error");
        return;
    }
    
    // Make sure QR code is generated
    var container = document.getElementById("qr_" + rid);
    if (!container || !container.querySelector("canvas")) {
        var slug = hotelSlug || createSlug(hotelName || hotel.name || "Hotel");
        var baseUrl = "https://connect.voddic.com.ng";
        var qrUrl = baseUrl + "/guest/room/?hotel=" + slug + "&room=" + rn;
        generateQR(rid, "qr_" + rid, qrUrl);
        setTimeout(function() { downloadCard(rid, rn); }, 800);
        return;
    }
    
    showToast("Generating card image for Room " + rn + "...", "info");
    
    // Use html2canvas to capture the full card
    html2canvas(cardElement, {
        scale: 3,
        backgroundColor: "#ffffff",
        allowTaint: true,
        useCORS: true,
        logging: false,
        width: cardElement.scrollWidth,
        height: cardElement.scrollHeight,
        windowWidth: cardElement.scrollWidth,
        windowHeight: cardElement.scrollHeight
    }).then(function(canvas) {
        var link = document.createElement("a");
        link.download = (hotelName || hotel.name || "Hotel").replace(/\s+/g, "_") + "_Room_" + rn + "_Card.png";
        link.href = canvas.toDataURL("image/png");
        link.click();
        showToast("Card downloaded for Room " + rn, "success");
    }).catch(function(err) {
        console.error("Error downloading card:", err);
        showToast("Error downloading card. Please try again.", "error");
    });
}

function downloadAllCards() {
    if (!rooms.length) {
        showToast("No rooms found to download", "warning");
        return;
    }
    showToast("Downloading all cards for " + hotelName + "...", "info");
    rooms.forEach(function(r, i) {
        setTimeout(function() {
            downloadCard(r.id, r.room_number);
        }, i * 2000);
    });
}

// ============================================================
// PRINT FULL CARD
// ============================================================
function printCard(rid) {
    var cardElement = document.getElementById("card_" + rid);
    if (!cardElement) {
        showToast("Card not found", "error");
        return;
    }
    
    // Make sure QR code is generated
    var container = document.getElementById("qr_" + rid);
    if (!container || !container.querySelector("canvas")) {
        var room = rooms.find(function(r) { return r.id === rid; });
        if (room) {
            var slug = hotelSlug || createSlug(hotelName || hotel.name || "Hotel");
            var baseUrl = "https://connect.voddic.com.ng";
            var qrUrl = baseUrl + "/guest/room/?hotel=" + slug + "&room=" + room.room_number;
            generateQR(rid, "qr_" + rid, qrUrl);
            setTimeout(function() { printCard(rid); }, 800);
        }
        return;
    }
    
    // Get the full card stand (includes the card base)
    var stand = cardElement.parentElement;
    
    // Clone the card stand for printing
    var clone = stand.cloneNode(true);
    
    // Remove buttons from the clone
    var btns = clone.querySelector(".card-btns");
    if (btns) btns.remove();
    
    // Create print window
    var w = window.open("", "_blank", "width=500,height=700");
    w.document.write('<!DOCTYPE html><html><head><title>Room Card - ' + (hotelName || hotel.name || "Hotel") + '</title>');
    w.document.write('<style>');
    w.document.write('*{margin:0;padding:0;box-sizing:border-box}');
    w.document.write('body{font-family:"Segoe UI",Arial,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;background:#f0f0f0;padding:20px}');
    w.document.write('.card-stand{display:flex;flex-direction:column;align-items:center;max-width:380px;width:100%}');
    w.document.write('.qr-card{width:100%;background:#fff;border-radius:18px;box-shadow:0 30px 60px rgba(0,0,0,0.15);overflow:hidden}');
    w.document.write('.card-brand{padding:22px 20px 6px;display:flex;align-items:center;justify-content:center;gap:10px}');
    w.document.write('.card-shield{width:34px;height:34px;color:#f5891f}');
    w.document.write('.card-shield svg{width:100%;height:100%}');
    w.document.write('.card-brand-text{line-height:1;text-align:left}');
    w.document.write('.card-hotel-name{font-size:22px;font-weight:800;color:#0d2149}');
    w.document.write('.card-tag{font-size:9.5px;font-weight:700;letter-spacing:2.5px;color:#f5891f;margin-top:3px;text-transform:uppercase}');
    w.document.write('.card-room{display:inline-block;align-self:center;margin:14px 0 0;background:#0d2149;color:#fff;padding:7px 26px;border-radius:22px;font-size:15px;font-weight:600;box-shadow:0 4px 10px rgba(13,33,73,0.25)}');
    w.document.write('.card-room b{color:#ffb35c;font-weight:800;margin-left:6px}');
    w.document.write('.card-scan{text-align:center;margin-top:16px;color:#0d2149;font-weight:800;font-size:15px;line-height:1.35;padding:0 18px}');
    w.document.write('.card-visit{text-align:center;margin-top:8px;color:#5b6478;font-weight:600;font-size:10px;line-height:1.4}');
    w.document.write('.card-visit-url{color:#f5891f;font-weight:700;font-size:11px}');
    w.document.write('.card-qr-box{margin:12px auto 0;width:55%;aspect-ratio:1/1;border:2.5px solid #0d2149;border-radius:10px;display:flex;align-items:center;justify-content:center;padding:6%;background:#fff}');
    w.document.write('.card-qr-box canvas,.card-qr-box img{width:100%!important;height:100%!important}');
    w.document.write('.card-icons{display:grid;grid-template-columns:repeat(4,1fr);gap:4px;padding:16px 10px 4px;margin-top:auto}');
    w.document.write('.card-icon-item{display:flex;flex-direction:column;align-items:center;gap:6px}');
    w.document.write('.card-icon-circle{width:38px;height:38px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#0d2149;font-size:1rem}');
    w.document.write('.card-icon-label{font-size:9.5px;font-weight:700;color:#0d2149;text-transform:uppercase}');
    w.document.write('.card-footer-bar{background:linear-gradient(180deg,#132b5e,#0d2149);color:#fff;text-align:center;font-size:13px;font-weight:700;padding:11px 10px;margin-top:14px}');
    w.document.write('.card-base{width:100%;display:flex;justify-content:center;margin-top:-2px}');
    w.document.write('.card-base::before{content:"";width:34%;height:14px;background:linear-gradient(180deg,#cfd3d8,#9aa0a8);border-radius:0 0 6px 6px;box-shadow:0 10px 18px rgba(0,0,0,0.2)}');
    w.document.write('@media print{body{background:#fff!important;padding:0!important;-webkit-print-color-adjust:exact;print-color-adjust:exact}.card-stand{max-width:100%}.qr-card{box-shadow:none!important;border:1px solid #ddd;border-radius:12px}}');
    w.document.write('</style></head><body>');
    w.document.write(clone.outerHTML);
    w.document.write('<script>');
    w.document.write('setTimeout(function(){ window.print(); }, 1000);');
    w.document.write('<\/script>');
    w.document.write('</body></html>');
    w.document.close();
}

// ============================================================
// Legacy Functions (for backward compatibility)
// ============================================================
function downloadQR(rid, rn) {
    downloadCard(rid, rn);
}

function downloadAllQR() {
    downloadAllCards();
}

// ============================================================
// Filter Rooms
// ============================================================
function filterRooms() {
    var search = (document.getElementById("roomSearch") ? document.getElementById("roomSearch").value : "").toLowerCase();
    var status = (document.getElementById("filterStatus") ? document.getElementById("filterStatus").value : "");
    
    var filtered = rooms.filter(function(r) {
        var matchSearch = !search || (r.room_number || "").toLowerCase().indexOf(search) !== -1;
        var matchStatus = !status || r.status === status;
        return matchSearch && matchStatus;
    });
    
    renderCards(filtered);
}

// ============================================================
// Toast Notification
// ============================================================
function showToast(msg, type) {
    var t = document.createElement("div");
    t.className = "toast " + (type || "info");
    t.textContent = msg;
    document.getElementById("toastContainer").appendChild(t);
    setTimeout(function() { t.remove(); }, 3500);
}