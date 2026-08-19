var API = "https://connectapi.voddic.com.ng/api/v1";
var hotels = [];
var placeholderImages = [];
var currentHotelId = null;
var userLocation = null;
var scannerStream = null;
var scannerInterval = null;

// Preload placeholder images
for (var i = 1; i <= 10; i++) {
    placeholderImages.push("images/hotel-" + i + ".png");
}

// Helper function to create slug from hotel name
function createSlug(name) {
    if (!name) return "hotel";
    return name.toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, "")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "");
}

// Service Worker Registration
if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("/guest/sw.js");
}

// DOM Content Loaded
document.addEventListener("DOMContentLoaded", function() {
    fetchHotels();
    
    var searchInput = document.getElementById("searchInput");
    if (searchInput) {
        searchInput.addEventListener("input", function() {
            var q = this.value.toLowerCase().trim();
            if (q) {
                var filtered = hotels.filter(function(h) {
                    return h.name.toLowerCase().indexOf(q) !== -1 || 
                           (h.city || "").toLowerCase().indexOf(q) !== -1;
                });
                renderGrid(filtered);
            } else {
                renderGrid(null);
            }
        });
    }
});

// Fetch Hotels from API
async function fetchHotels() {
    try {
        var response = await fetch(API + "/hotels/public-list/");
        if (response.ok) {
            var data = await response.json();
            var list = Array.isArray(data) ? data : (data.results || []);
            
            console.log("📊 Raw API response:", list);
            
            hotels = list.map(function(h, i) {
                var slug = createSlug(h.name);
                // Handle duplicate slugs
                var slugCount = 0;
                hotels.forEach(function(existing) {
                    if (existing.slug === slug) slugCount++;
                });
                if (slugCount > 0) slug = slug + "-" + (slugCount + 1);
                
                var hotelData = {
                    id: h.id,
                    name: h.name || "Hotel",
                    city: h.city || "",
                    country: h.country || "",
                    address: h.address || "",
                    phone: h.care_phone || h.phone || "",
                    email: h.email || "",
                    image: h.hotel_image_url && h.hotel_image_url.length > 5 ? h.hotel_image_url : placeholderImages[i % 10],
                    rating: 4.2 + Math.random() * 0.7,
                    reviews: Math.floor(Math.random() * 200) + 20,
                    totalRooms: h.total_rooms || 0,
                    activeRooms: h.active_rooms || 0,
                    vacantRooms: h.vacant_rooms || 0,
                    rooms: h.rooms || [],
                    slug: slug,
                    latitude: h.latitude ? parseFloat(h.latitude) : null,
                    longitude: h.longitude ? parseFloat(h.longitude) : null
                };
                
                console.log("🏨 Hotel loaded:", hotelData.name, "ID:", hotelData.id, "Slug:", hotelData.slug, "Rooms:", hotelData.rooms.length);
                return hotelData;
            });
            
            console.log("✅ Total hotels loaded:", hotels.length);
            renderGrid();
        } else {
            console.error("❌ API Error:", response.status);
        }
    } catch (e) {
        console.error("Error fetching hotels:", e);
        showError("Unable to load hotels. Please refresh the page.");
    }
}

// Show Error Message
function showError(message) {
    var grid = document.getElementById("grid");
    if (grid) {
        grid.innerHTML = `
            <div style="grid-column:1/-1;text-align:center;padding:60px 20px;">
                <div style="font-size:48px;margin-bottom:16px;">⚠️</div>
                <h3 style="color:#eef1f4;margin-bottom:8px;">${message}</h3>
                <p style="color:#9aa4b2;font-size:14px;">Try refreshing the page or contact support.</p>
                <button onclick="location.reload()" style="margin-top:20px;padding:10px 30px;background:#c9a86a;color:#000;border:none;border-radius:8px;font-weight:600;cursor:pointer;">
                    🔄 Refresh Page
                </button>
            </div>
        `;
    }
}

// Render Grid
function renderGrid(filtered) {
    var list = filtered || hotels;
    var grid = document.getElementById("grid");
    
    if (!grid) return;
    
    document.getElementById("statProps").textContent = hotels.length;
    document.getElementById("statRooms").textContent = hotels.reduce(function(n, h) { return n + (h.vacantRooms || 0); }, 0);
    document.getElementById("resultCount").textContent = "— " + list.length + " hotels";
    
    if (!list.length) {
        grid.innerHTML = '<p style="color:var(--muted);text-align:center;grid-column:1/-1;padding:60px;">No hotels found.</p>';
        return;
    }
    
    grid.innerHTML = list.map(function(h, i) {
        var avail = h.vacantRooms || 0;
        var ac = avail >= 5 ? "avail-many" : avail >= 2 ? "avail-few" : "avail-none";
        var at = avail > 0 ? avail + " rooms" : "Full";
        
        var stars = '';
        var rating = Math.round(h.rating || 4.5);
        for (var s = 0; s < 5; s++) {
            stars += '<span class="star" style="opacity:' + (s < rating ? 1 : 0.25) + '"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.5 15 9l7 .9-5.1 4.8L18.2 21 12 17.4 5.8 21l1.3-6.3L2 9.9 9 9Z"/></svg></span>';
        }
        
        var imageUrl = h.image || placeholderImages[i % 10];
        
        return '<div class="card" style="--d:' + (i * 50) + 'ms">' +
            (avail > 0 ? '<div class="room-avail ' + ac + '">' + at + '</div>' : '') +
            '<div class="card-media"><img src="' + imageUrl + '" alt="' + h.name + '" loading="lazy" onerror="this.src=\'' + placeholderImages[i % 10] + '\'"><div class="card-rating">' + stars + ' ' + (h.rating || 4.5).toFixed(1) + '</div><div class="card-loc">📍 ' + (h.city || "") + '</div></div>' +
            '<div class="card-body"><div class="card-name">' + h.name + '</div></div><div class="card-addr">📍 ' + (h.address || "") + '</div>' +
            '<div class="card-actions">' +
                '<button onclick="showRooms(\'' + h.id + '\')">🚪 Rooms</button>' +
                '<button onclick="showReviews(\'' + h.id + '\')">⭐ Reviews</button>' +
                '<button onclick="openScannerForHotel(\'' + h.id + '\', \'' + h.slug + '\')">📱 Scan</button>' +
            '</div></div>';
    }).join("");
}

// Open Scanner for Specific Hotel
function openScannerForHotel(hotelId, hotelSlug) {
    console.log("🔍 openScannerForHotel called with ID:", hotelId, "Slug:", hotelSlug);
    console.log("📋 All hotels:", hotels.map(function(h) { return h.id + " - " + h.name + " (Slug: " + h.slug + ")"; }));
    
    // Find the hotel by ID
    var hotel = hotels.find(function(h) { return h.id === hotelId; });
    
    if (hotel) {
        currentHotelId = hotelId;
        console.log("🏨 Current hotel set to:", hotel.name);
        console.log("📋 Hotel ID:", hotel.id);
        console.log("📋 Hotel Slug:", hotel.slug);
        console.log("📋 Rooms:", hotel.rooms ? hotel.rooms.length : 0);
        console.log("📋 Room numbers:", hotel.rooms ? hotel.rooms.map(function(r) { return r.room_number; }) : []);
    } else {
        console.error("❌ Hotel not found with ID:", hotelId);
        // Try to find by slug
        if (hotelSlug) {
            hotel = hotels.find(function(h) { return h.slug === hotelSlug; });
            if (hotel) {
                currentHotelId = hotel.id;
                console.log("🏨 Found hotel by slug:", hotel.name);
            } else {
                alert("Hotel not found. Please refresh the page.");
                return;
            }
        } else {
            alert("Hotel not found. Please refresh the page.");
            return;
        }
    }
    
    openScanner();
}

// Enter Room from Scan
function enterRoomFromScan() {
    var rn = document.getElementById("scanRoomInput").value.trim();
    if (!rn) {
        alert("Enter room number");
        return;
    }
    
    console.log("🔍 Searching for room:", rn);
    console.log("Current hotel ID:", currentHotelId);
    
    // Log all hotels and their rooms for debugging
    console.log("📋 All hotels and their rooms:");
    hotels.forEach(function(h) {
        console.log("  🏨", h.name, "ID:", h.id, "Slug:", h.slug);
        console.log("  📋 Rooms:", h.rooms ? h.rooms.map(function(r) { return r.room_number; }) : []);
    });
    
    var foundHotel = null;
    
    // FIRST: Try to find the room in the currently selected hotel
    if (currentHotelId) {
        var currentHotel = hotels.find(function(h) { return h.id === currentHotelId; });
        if (currentHotel) {
            console.log("🏨 Checking current hotel:", currentHotel.name);
            console.log("📋 Rooms in current hotel:", currentHotel.rooms ? currentHotel.rooms.map(function(r) { return r.room_number; }) : []);
            
            if (currentHotel.rooms && currentHotel.rooms.length) {
                var roomFound = currentHotel.rooms.find(function(r) {
                    return String(r.room_number) === String(rn);
                });
                
                if (roomFound) {
                    foundHotel = currentHotel;
                    console.log("✅ Found room in current hotel:", currentHotel.name);
                } else {
                    console.log("❌ Room not found in current hotel");
                    alert("❌ Room " + rn + " not found in " + currentHotel.name + ".\n\nAvailable rooms: " + 
                          (currentHotel.rooms.map(function(r) { return r.room_number; }).join(", ") || "None"));
                    return;
                }
            } else {
                console.log("⚠️ No rooms data for current hotel");
                alert("❌ No rooms available for " + currentHotel.name);
                return;
            }
        } else {
            console.error("❌ Current hotel not found with ID:", currentHotelId);
            alert("❌ Selected hotel not found. Please try again.");
            return;
        }
    }
    
    // SECOND: If no hotel was selected, search all hotels (fallback)
    if (!foundHotel && !currentHotelId) {
        console.log("🔍 No hotel selected, searching all hotels...");
        for (var i = 0; i < hotels.length; i++) {
            var h = hotels[i];
            if (h.rooms && h.rooms.length) {
                for (var j = 0; j < h.rooms.length; j++) {
                    if (String(h.rooms[j].room_number) === String(rn)) {
                        foundHotel = h;
                        console.log("✅ Found in hotel:", h.name);
                        break;
                    }
                }
            }
            if (foundHotel) break;
        }
    }
    
    if (!foundHotel) {
        alert("❌ Room " + rn + " not found in any hotel. Please check the room number.");
        return;
    }
    
    // IMPORTANT: Use the hotel slug from the found hotel
    var slug = foundHotel.slug || createSlug(foundHotel.name);
    var url = "/guest/room/?hotel=" + slug + "&room=" + rn;
    
    console.log("🚀 Navigating to:", url);
    console.log("🏨 Hotel:", foundHotel.name, "Slug:", slug);
    console.log("🚪 Room:", rn);
    
    window.location.href = url;
}

// Open Scanner Modal
function openScanner() {
    // Update current hotel display
    var hotelNameSpan = document.getElementById("currentHotelName");
    if (hotelNameSpan) {
        if (currentHotelId) {
            var hotel = hotels.find(function(h) { return h.id === currentHotelId; });
            if (hotel) {
                hotelNameSpan.textContent = hotel.name + " (Slug: " + hotel.slug + ")";
                console.log("📱 Scanner opened for:", hotel.name);
            } else {
                hotelNameSpan.textContent = "None selected (ID: " + currentHotelId + ")";
            }
        } else {
            hotelNameSpan.textContent = "None selected";
        }
    }
    
    document.getElementById("overlay").classList.add("open");
    document.body.style.overflow = "hidden";
    startScanner();
}

// Close Scanner Modal
function closeModal() {
    document.getElementById("overlay").classList.remove("open");
    document.body.style.overflow = "";
    stopScanner();
}

// Start Scanner
function startScanner() {
    stopScanner();
    var video = document.getElementById("qrVideo");
    if (!video) return;
    
    navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } })
        .then(function(stream) {
            scannerStream = stream;
            video.srcObject = stream;
            video.play();
            
            var canvas = document.createElement("canvas");
            var ctx = canvas.getContext("2d");
            
            scannerInterval = setInterval(function() {
                if (video.readyState === video.HAVE_ENOUGH_DATA) {
                    canvas.width = video.videoWidth;
                    canvas.height = video.videoHeight;
                    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                    var imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                    var code = jsQR(imageData.data, imageData.width, imageData.height);
                    
                    if (code) {
                        stopScanner();
                        closeModal();
                        
                        var url = code.data;
                        var roomNum = "";
                        var hotelSlug = "";
                        
                        // Parse QR code URL
                        var parts = url.split("&room=");
                        if (parts.length === 2) {
                            roomNum = parts[1].split("&")[0];
                            var hp = parts[0].split("?hotel=");
                            hotelSlug = hp.length > 1 ? hp[1] : "";
                        } else {
                            var pathParts = url.replace(/https?:\/\/[^\/]+\//, "").split("/room/");
                            if (pathParts.length === 2) {
                                hotelSlug = pathParts[0];
                                roomNum = pathParts[1].split("?")[0];
                            } else {
                                var match = url.match(/room[\/=](\d+)/i);
                                if (match) {
                                    roomNum = match[1];
                                } else {
                                    roomNum = url.replace(/[^0-9]/g, "");
                                }
                            }
                        }
                        
                        roomNum = roomNum.replace(/[^0-9]/g, "");
                        
                        // IMPORTANT: Use current hotel if available
                        if (!hotelSlug && currentHotelId) {
                            var hotel = hotels.find(function(h) { return h.id === currentHotelId; });
                            if (hotel) {
                                hotelSlug = hotel.slug || createSlug(hotel.name);
                                console.log("Using current hotel slug:", hotelSlug);
                            }
                        }
                        
                        // If still no hotel slug, find by room number
                        if (!hotelSlug && roomNum) {
                            for (var i = 0; i < hotels.length; i++) {
                                var h = hotels[i];
                                if (h.rooms) {
                                    for (var j = 0; j < h.rooms.length; j++) {
                                        if (String(h.rooms[j].room_number) === roomNum) {
                                            hotelSlug = h.slug || createSlug(h.name);
                                            console.log("Found hotel for room:", h.name);
                                            break;
                                        }
                                    }
                                }
                                if (hotelSlug) break;
                            }
                        }
                        
                        // Navigate with proper hotel slug
                        if (hotelSlug && roomNum) {
                            console.log("🚀 QR Scan to: /guest/room/?hotel=" + hotelSlug + "&room=" + roomNum);
                            window.location.href = "/guest/room/?hotel=" + hotelSlug + "&room=" + roomNum;
                        } else if (roomNum && currentHotelId) {
                            var hotel = hotels.find(function(h) { return h.id === currentHotelId; });
                            if (hotel) {
                                window.location.href = "/guest/room/?hotel=" + (hotel.slug || createSlug(hotel.name)) + "&room=" + roomNum;
                                return;
                            }
                        } else if (roomNum) {
                            window.location.href = "/guest/room/?room=" + roomNum;
                        } else {
                            alert("❌ Could not read room number from QR code.");
                        }
                    }
                }
            }, 300);
        })
        .catch(function(e) {
            console.error("Camera error:", e);
            alert("Unable to access camera. Please check permissions.");
        });
}

// Stop Scanner
function stopScanner() {
    if (scannerInterval) {
        clearInterval(scannerInterval);
        scannerInterval = null;
    }
    if (scannerStream) {
        scannerStream.getTracks().forEach(function(t) { t.stop(); });
        scannerStream = null;
    }
}

// Show Rooms
function showRooms(hotelId) {
    // Set this as the current hotel
    currentHotelId = hotelId;
    
    var hotel = hotels.find(function(h) { return h.id === hotelId; });
    if (!hotel) {
        alert("Hotel not found");
        return;
    }
    if (!hotel.rooms || !hotel.rooms.length) {
        alert("No rooms available for " + hotel.name);
        return;
    }
    
    var overlay = document.createElement("div");
    overlay.id = "roomsModalOverlay";
    overlay.style.cssText = `
        position: fixed; inset: 0; z-index: 9999;
        background: rgba(11, 15, 22, 0.92); backdrop-filter: blur(12px);
        display: flex; align-items: center; justify-content: center;
        padding: 20px; animation: fadeIn 0.3s ease;
    `;
    
    var modal = document.createElement("div");
    modal.style.cssText = `
        background: #1a2332; border-radius: 16px;
        border: 1px solid rgba(238, 241, 244, 0.08);
        max-width: 500px; width: 100%; max-height: 85vh;
        overflow-y: auto; padding: 24px;
        box-shadow: 0 24px 80px rgba(0, 0, 0, 0.6);
    `;
    
    var availableRooms = hotel.rooms.filter(function(r) {
        return r.status === "AVAILABLE" || r.status === "ACTIVE_STAY";
    });
    var totalRooms = hotel.rooms.length;
    
    modal.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;padding-bottom:12px;border-bottom:1px solid rgba(238,241,244,0.06);">
            <div>
                <h3 style="font-family:'Fraunces',serif;font-size:1.2rem;font-weight:600;color:#eef1f4;">${hotel.name}</h3>
                <p style="font-size:0.75rem;color:#9aa4b2;margin-top:2px;">${availableRooms.length} available · ${totalRooms} total rooms</p>
            </div>
            <button onclick="document.getElementById('roomsModalOverlay').remove()" style="background:rgba(255,255,255,0.05);border:1px solid rgba(238,241,244,0.08);color:#9aa4b2;width:32px;height:32px;border-radius:50%;font-size:1rem;cursor:pointer;">✕</button>
        </div>
        
        <div style="display:flex;flex-direction:column;gap:8px;margin-bottom:16px;">
            ${hotel.rooms.map(function(r) {
                var statusColor = r.status === "AVAILABLE" ? "#2fa06a" : r.status === "ACTIVE_STAY" ? "#57C9BD" : "#6b7280";
                var statusLabel = r.status === "AVAILABLE" ? "Available" : r.status === "ACTIVE_STAY" ? "Active" : r.status || "Unknown";
                var roomType = r.room_type || "Standard";
                var capacity = r.capacity || 2;
                var price = r.price ? "₦" + parseInt(r.price).toLocaleString() : "—";
                
                return `
                    <div style="display:flex;justify-content:space-between;align-items:center;padding:12px 14px;background:rgba(11,15,22,0.4);border-radius:10px;border:1px solid rgba(238,241,244,0.04);">
                        <div>
                            <div style="font-weight:600;font-size:0.9rem;color:#eef1f4;">Room ${r.room_number}</div>
                            <div style="font-size:0.7rem;color:#9aa4b2;margin-top:2px;">
                                ${roomType} · ${capacity} guests · ${price}
                            </div>
                        </div>
                        <span style="font-size:0.6rem;font-weight:600;padding:2px 10px;border-radius:10px;background:rgba(47,160,106,0.15);color:${statusColor};border:1px solid ${statusColor}33;">
                            ${statusLabel}
                        </span>
                    </div>
                `;
            }).join('')}
        </div>
        
        <div style="display:flex;gap:8px;flex-wrap:wrap;padding-top:12px;border-top:1px solid rgba(238,241,244,0.06);">
            <button onclick="callHotel('${hotel.phone}')" style="flex:1;padding:10px;background:rgba(87,201,189,0.12);border:1px solid rgba(87,201,189,0.25);border-radius:8px;color:#57C9BD;font-weight:600;font-size:0.75rem;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px;">
                📞 Call Reception
            </button>
            <button onclick="emailHotel('${hotel.email}')" style="flex:1;padding:10px;background:rgba(201,168,106,0.12);border:1px solid rgba(201,168,106,0.25);border-radius:8px;color:#c9a86a;font-weight:600;font-size:0.75rem;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px;">
                ✉️ Email Hotel
            </button>
        </div>
    `;
    
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
    
    overlay.addEventListener("click", function(e) {
        if (e.target === overlay) {
            overlay.remove();
        }
    });
}

// Call Hotel
function callHotel(phone) {
    if (phone) {
        window.location.href = "tel:" + phone.replace(/\s/g, "");
    } else {
        alert("Phone number not available for this hotel.");
    }
}

// Email Hotel
function emailHotel(email) {
    if (email) {
        window.location.href = "mailto:" + email + "?subject=Inquiry about hotel stay";
    } else {
        alert("Email address not available for this hotel.");
    }
}

// Show Reviews
function showReviews(hotelId) {
    var hotel = hotels.find(function(h) { return h.id === hotelId; });
    if (!hotel) {
        alert("Hotel not found");
        return;
    }
    alert("⭐ " + hotel.name + "\n" +
        "Rating: " + hotel.rating.toFixed(1) + " / 5\n" +
        "Reviews: " + hotel.reviews + "\n\n" +
        "Featured Review: \"Great stay! Comfortable rooms and excellent service.\"");
}

// Find Nearby Hotels
function findNearbyHotels() {
    var btn = document.getElementById("nearbyBtn");
    var status = document.getElementById("nearbyStatus");
    
    if (!navigator.geolocation) {
        if (status) status.textContent = "Geolocation not supported";
        return;
    }
    
    if (btn) {
        btn.innerHTML = '⏳ Finding your location...';
    }
    if (status) status.textContent = "";
    
    navigator.geolocation.getCurrentPosition(
        function(pos) {
            userLocation = { lat: pos.coords.latitude, lng: pos.coords.longitude };
            
            if (btn) btn.innerHTML = '📍 Hotels Near Me';
            
            var RADIUS = 2000;
            var nearby = hotels.filter(function(h) {
                if (!h.latitude || !h.longitude) return false;
                var dist = calcDistance(userLocation.lat, userLocation.lng, parseFloat(h.latitude), parseFloat(h.longitude));
                h.distance = dist;
                return dist <= RADIUS;
            });
            
            nearby.sort(function(a, b) { return a.distance - b.distance; });
            
            if (nearby.length) {
                nearby.forEach(function(h) {
                    h.distanceText = h.distance < 1000 ? Math.round(h.distance) + 'm' : (h.distance / 1000).toFixed(1) + 'km';
                });
                if (status) status.textContent = "📍 " + nearby.length + " hotel(s) within 2km";
                renderGrid(nearby);
            } else {
                if (status) status.textContent = "No hotels within 2km. Showing all.";
                renderGrid();
            }
        },
        function(err) {
            if (btn) btn.innerHTML = '📍 Hotels Near Me';
            if (status) status.textContent = "Could not get location.";
        },
        { enableHighAccuracy: true, timeout: 10000 }
    );
}

// Calculate Distance
function calcDistance(lat1, lng1, lat2, lng2) {
    var R = 6371000;
    var dLat = (lat2 - lat1) * Math.PI / 180;
    var dLng = (lng2 - lng1) * Math.PI / 180;
    var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLng / 2) * Math.sin(dLng / 2);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}