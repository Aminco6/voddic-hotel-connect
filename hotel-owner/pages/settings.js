const API = "https://connectapi.voddic.com.ng/api/v1";
const token = localStorage.getItem("access_token");
const user = JSON.parse(localStorage.getItem("user") || "{}");
const hotel = JSON.parse(localStorage.getItem("hotel") || "{}");
const jsonHeaders = { "Authorization": "Bearer " + token, "Content-Type": "application/json" };
if (!token) window.location.href = "/auth/login.html";

var settingsData = {};

// ==================== INIT ====================
document.addEventListener("DOMContentLoaded", function() {
    document.getElementById("userName").textContent = user.full_name || user.email || "Owner";
    document.getElementById("userAvatar").textContent = (user.first_name || "O")[0].toUpperCase();
    document.getElementById("sidebarHotelName").textContent = hotel.name || "Hotel";
    initTabs();
    loadSettings();
});

function initTabs() {
    document.querySelectorAll(".tab-btn[data-tab]").forEach(function(btn) {
        btn.addEventListener("click", function() {
            document.querySelectorAll(".tab-btn").forEach(function(b) { b.classList.remove("active"); });
            this.classList.add("active");
            document.querySelectorAll(".tab-panel").forEach(function(p) { p.classList.remove("active"); });
            var panel = document.getElementById("panel-" + this.getAttribute("data-tab"));
            if (panel) {
                panel.classList.add("active");
                if (this.getAttribute("data-tab") === "departments") loadDepartments();
            }
        });
    });
}

// ==================== LOAD SETTINGS ====================
async function loadSettings() {
    try {
        var res = await fetch(API + "/hotels/settings/all_settings/", { headers: jsonHeaders });
        if (res.ok) {
            settingsData = await res.json();
            populateForm();
        }
    } catch(e) {}
}

function populateForm() {
    var h = settingsData.hotel || {};
    var s = settingsData.settings || {};
    document.getElementById("sHotelName").value = h.name || "";
    document.getElementById("sPhone").value = h.phone || "";
    document.getElementById("sAddress").value = h.address || "";
    document.getElementById("sEmail").value = h.email || "";
    document.getElementById("sWebsite").value = h.website || "";
    document.getElementById("sCountry").value = h.country || "";
    document.getElementById("sState").value = h.state || "";
    document.getElementById("sCity").value = h.city || "";
    document.getElementById("sCarePhone").value = s.care_phone || "";
    document.getElementById("sWelcome").value = s.welcome_message || "";
    document.getElementById("colorPrimary").value = s.primary_color || "#e4af3e";
    document.getElementById("colorSecondary").value = s.secondary_color || "#e54545";
    document.getElementById("colorBg").value = s.bg_color || "#0c0c18";
    document.getElementById("colorText").value = s.text_color || "#eaeaf0";
    document.getElementById("policyCheckin").value = s.checkin_policy || "";
    document.getElementById("policyCheckout").value = s.checkout_policy || "";
    document.getElementById("policyCancel").value = s.cancel_policy || "";
    document.getElementById("policyPets").value = s.pet_policy || "";
    document.getElementById("policySmoking").value = s.smoking_policy || "";
    document.getElementById("policyOther").value = s.other_policy || "";
    showSavedPolicies();
    if (h.logo_url_display) document.getElementById("logoPreview").innerHTML = '<img src="' + h.logo_url_display + '">';
    if (h.hotel_image_url) document.getElementById("hotelImgPreview").innerHTML = '<img src="' + h.hotel_image_url + '">';
}

// ==================== GENERAL ====================
async function saveGeneral() {
    var hotelData = { name: document.getElementById("sHotelName").value.trim(), phone: document.getElementById("sPhone").value.trim(), address: document.getElementById("sAddress").value.trim(), email: document.getElementById("sEmail").value.trim(), website: document.getElementById("sWebsite").value.trim(), country: document.getElementById("sCountry").value.trim(), state: document.getElementById("sState").value.trim(), city: document.getElementById("sCity").value.trim() };
    var s = { care_phone: document.getElementById("sCarePhone").value.trim(), welcome_message: document.getElementById("sWelcome").value.trim() };
    try {
        var res = await fetch(API + "/hotels/settings/all_settings/", { method: "PUT", headers: jsonHeaders, body: JSON.stringify({ hotel: hotelData, settings: s }) });
        showToast(res.ok ? "Saved!" : "Failed", res.ok ? "success" : "error");
    } catch(e) { showToast("Network error", "error"); }
}

async function changePassword() {
    var c = document.getElementById("pwCurrent").value, n = document.getElementById("pwNew").value;
    if (!c || !n) { showToast("Fill all fields", "error"); return; }
    if (n.length < 8) { showToast("Password must be 8+ chars", "error"); return; }
    try {
        var res = await fetch(API + "/hotels/settings/change_password/", { method: "POST", headers: jsonHeaders, body: JSON.stringify({ current_password: c, new_password: n }) });
        var d = await res.json();
        if (res.ok) { showToast("Password changed!", "success"); document.getElementById("pwCurrent").value = ""; document.getElementById("pwNew").value = ""; }
        else showToast(d.error || "Failed", "error");
    } catch(e) { showToast("Network error", "error"); }
}

// ==================== BRANDING ====================
function updateColorPreview() {}
async function saveBranding() {
    var s = { primary_color: document.getElementById("colorPrimary").value, secondary_color: document.getElementById("colorSecondary").value, bg_color: document.getElementById("colorBg").value, text_color: document.getElementById("colorText").value };
    try {
        var res = await fetch(API + "/hotels/settings/all_settings/", { method: "PUT", headers: jsonHeaders, body: JSON.stringify({ settings: s }) });
        showToast(res.ok ? "Branding saved!" : "Failed", res.ok ? "success" : "error");
    } catch(e) { showToast("Network error", "error"); }
}

async function uploadLogo() {
    var f = document.getElementById("logoFileInput").files[0]; if (!f) return;
    var fd = new FormData(); fd.append("logo_image", f);
    try {
        var res = await fetch(API + "/hotels/settings/upload_logo/", { method: "POST", headers: { "Authorization": "Bearer " + token }, body: fd });
        var d = await res.json();
        if (res.ok) { document.getElementById("logoPreview").innerHTML = '<img src="' + d.logo_url + '?t=' + Date.now() + '">'; showToast("Logo uploaded!", "success"); }
        else showToast(d.error || "Failed", "error");
    } catch(e) { showToast("Network error", "error"); }
}

async function uploadHotelImage() {
    var f = document.getElementById("hotelImgInput").files[0]; if (!f) return;
    var fd = new FormData(); fd.append("hotel_image", f);
    try {
        var res = await fetch(API + "/hotels/settings/upload_hotel_image/", { method: "POST", headers: { "Authorization": "Bearer " + token }, body: fd });
        var d = await res.json();
        if (res.ok) { document.getElementById("hotelImgPreview").innerHTML = '<img src="' + d.image_url + '?t=' + Date.now() + '">'; showToast("Image uploaded!", "success"); }
        else showToast(d.error || "Failed", "error");
    } catch(e) { showToast("Network error", "error"); }
}

function captureFromCamera(inputId) {
    var inp = document.createElement("input"); inp.type = "file"; inp.accept = "image/*"; inp.capture = "environment";
    inp.onchange = function() { if (inp.files[0]) { var dt = new DataTransfer(); dt.items.add(inp.files[0]); document.getElementById(inputId).files = dt.files; if (inputId === "logoFileInput") uploadLogo(); else uploadHotelImage(); } };
    inp.click();
}

// ==================== DEPARTMENTS ====================
async function loadDepartments() {
    var grid = document.getElementById("deptGrid"); if (!grid) return;
    grid.innerHTML = '<p style="color:#55556e;text-align:center;padding:20px;">Loading...</p>';
    try {
        var res = await fetch(API + "/hotels/departments/", { headers: jsonHeaders });
        if (!res.ok) res = await fetch(API + "/staff/departments/", { headers: jsonHeaders });
        if (res.ok) {
            var data = await res.json(), depts = Array.isArray(data) ? data : (data.results || []);
            grid.innerHTML = depts.length ? depts.map(function(d) { return '<div class="dept-card-item"><div class="dept-card-dot" style="background:' + (d.color || '#e4af3e') + '"></div><div class="dept-card-name">' + (d.name || 'Unknown') + '</div></div>'; }).join("") : '<p style="color:#55556e;text-align:center;padding:20px;">No departments found.</p>';
        }
    } catch(e) { grid.innerHTML = '<p style="color:#f87171;text-align:center;padding:20px;">Error loading</p>'; }
}

// ==================== POLICIES ====================
async function savePolicies() {
    var s = { checkin_policy: document.getElementById("policyCheckin").value.trim(), checkout_policy: document.getElementById("policyCheckout").value.trim(), cancel_policy: document.getElementById("policyCancel").value.trim(), pet_policy: document.getElementById("policyPets").value.trim(), smoking_policy: document.getElementById("policySmoking").value.trim(), other_policy: document.getElementById("policyOther").value.trim() };
    try {
        var res = await fetch(API + "/hotels/settings/all_settings/", { method: "PUT", headers: jsonHeaders, body: JSON.stringify({ settings: s }) });
        if (res.ok) { showToast("Policies saved!", "success"); showSavedPolicies(); }
        else showToast("Failed", "error");
    } catch(e) { showToast("Network error", "error"); }
}

function showSavedPolicies() {
    var c = document.getElementById("savedPolicies"); if (!c) return;
    var items = [{ label: "Check-In", val: document.getElementById("policyCheckin").value }, { label: "Check-Out", val: document.getElementById("policyCheckout").value }, { label: "Cancellation", val: document.getElementById("policyCancel").value }, { label: "Pets", val: document.getElementById("policyPets").value }, { label: "Smoking", val: document.getElementById("policySmoking").value }, { label: "Other", val: document.getElementById("policyOther").value }];
    var html = items.filter(function(i) { return i.val.trim(); }).map(function(i) { return '<div style="margin-bottom:12px;"><strong style="color:#e0e0f0;">' + i.label + ':</strong><br>' + i.val + '</div>'; }).join("");
    c.innerHTML = html || '<p style="color:#55556e;">No policies saved yet.</p>';
}

// ==================== HELPERS ====================
function showToast(msg, type) {
    var t = document.createElement("div");
    t.className = "toast " + (type || "info");
    t.textContent = msg;
    document.getElementById("toastContainer").appendChild(t);
    setTimeout(function() { t.remove(); }, 3500);
}

function toggleSidebar() {
    var sb = document.getElementById("sidebar");
    sb.classList.toggle("open");
    document.getElementById("sidebarOverlay").classList.toggle("active");
}

function logout() {
    localStorage.clear();
    window.location.href = "/auth/login.html";
}

document.addEventListener("keydown", function(e) {
    if (e.key === "Escape") {
        var sb = document.getElementById("sidebar");
        if (sb.classList.contains("open")) toggleSidebar();
    }
});

document.querySelectorAll(".sidebar-overlay").forEach(function(o) {
    o.addEventListener("click", function(e) { if (e.target === o) toggleSidebar(); });
});

// ==================== GPS LOCATION ====================
function captureLocation() {
    if (!navigator.geolocation) {
        showToast("Geolocation not supported on this device", "error");
        return;
    }
    
    showToast("Getting location...", "info");
    
    navigator.geolocation.getCurrentPosition(
        function(position) {
            var lat = position.coords.latitude.toFixed(6);
            var lng = position.coords.longitude.toFixed(6);
            document.getElementById("sLatitude").value = lat;
            document.getElementById("sLongitude").value = lng;
            showToast("Location captured! Lat: " + lat + ", Lng: " + lng, "success");
        },
        function(error) {
            showToast("Failed to get location: " + error.message, "error");
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
}

// Update populateForm to include lat/lng
var oldPopulateForm2 = populateForm;
populateForm = function() {
    oldPopulateForm2();
    var h = settingsData.hotel || {};
    document.getElementById("sLatitude").value = h.latitude || "";
    document.getElementById("sLongitude").value = h.longitude || "";
};

// Update saveGeneral to include lat/lng
var oldSaveGeneral = saveGeneral;
saveGeneral = async function() {
    var hotelData = { 
        name: document.getElementById("sHotelName").value.trim(), 
        phone: document.getElementById("sPhone").value.trim(), 
        address: document.getElementById("sAddress").value.trim(), 
        email: document.getElementById("sEmail").value.trim(), 
        website: document.getElementById("sWebsite").value.trim(), 
        country: document.getElementById("sCountry").value.trim(), 
        state: document.getElementById("sState").value.trim(), 
        city: document.getElementById("sCity").value.trim(),
        latitude: document.getElementById("sLatitude").value || null,
        longitude: document.getElementById("sLongitude").value || null
    };
    var s = { care_phone: document.getElementById("sCarePhone").value.trim(), welcome_message: document.getElementById("sWelcome").value.trim() };
    try {
        var res = await fetch(API + "/hotels/settings/all_settings/", { method: "PUT", headers: jsonHeaders, body: JSON.stringify({ hotel: hotelData, settings: s }) });
        showToast(res.ok ? "Saved!" : "Failed", res.ok ? "success" : "error");
    } catch(e) { showToast("Network error", "error"); }
};
