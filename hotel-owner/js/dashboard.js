/* Voddic Hotel Connect - Dashboard JS */
const API = 'https://connectapi.voddic.com.ng/api/v1';
const token = localStorage.getItem('access_token');
const user = JSON.parse(localStorage.getItem('user') || '{}');
const hotel = JSON.parse(localStorage.getItem('hotel') || '{}');

// Auth check
if (!token || !user.id) { window.location.href = '/auth/login.html'; }

// Set user info
document.getElementById('userName').textContent = user.full_name || user.email || 'Owner';
document.getElementById('userAvatar').textContent = (user.first_name || 'O')[0].toUpperCase();
document.getElementById('ownerName').textContent = 'Welcome, ' + (user.first_name || 'Owner');
document.getElementById('hotelNameDisplay').textContent = hotel.name || 'Your Hotel';
document.getElementById('sidebarHotelName').textContent = hotel.name || 'Hotel';
document.getElementById('currentDate').textContent = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

// Greeting
const hour = new Date().getHours();
document.getElementById('greeting').textContent = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

// Sidebar toggle
function toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('open');
    document.getElementById('sidebarOverlay').classList.toggle('show');
}

// Navigation
function showPage(page) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    const pageEl = document.getElementById('page-' + page);
    if (pageEl) pageEl.classList.add('active');
    
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    const navItem = document.querySelector(`[data-page="${page}"]`);
    if (navItem) navItem.classList.add('active');
    
    // Show back button on mobile for non-overview pages
    const backBtn = document.getElementById('backBtn');
    if (backBtn) backBtn.style.display = (page !== 'overview' && window.innerWidth < 900) ? 'inline-block' : 'none';
    
    // Close sidebar on mobile
    if (window.innerWidth < 900) toggleSidebar();
}

// Nav clicks
document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', function(e) {
        e.preventDefault();
        showPage(this.dataset.page);
    });
});

// Load stats
async function loadStats() {
    const h = { 'Authorization': `Bearer ${token}` };
    
    try {
        const r = await fetch(`${API}/rooms/`, { headers: h });
        if (r.ok) {
            const d = await r.json();
            const rooms = d.results || d;
            if (Array.isArray(rooms)) {
                document.getElementById('statActiveRooms').textContent = rooms.filter(r => r.status === 'ACTIVE_STAY').length;
                document.getElementById('statVacantRooms').textContent = rooms.filter(r => r.status === 'AVAILABLE').length;
                document.getElementById('roomsBadge').textContent = rooms.length;
            }
        }
    } catch(e) {}
    
    try {
        const r = await fetch(`${API}/staff/`, { headers: h });
        if (r.ok) {
            const d = await r.json();
            const staff = d.results || d;
            if (Array.isArray(staff)) {
                document.getElementById('statStaff').textContent = staff.filter(s => s.is_online).length;
            }
        }
    } catch(e) {}
    
    try {
        const r = await fetch(`${API}/emergency/`, { headers: h });
        if (r.ok) {
            const d = await r.json();
            const emergencies = d.results || d;
            if (Array.isArray(emergencies)) {
                const active = emergencies.filter(e => e.status === 'ACTIVE').length;
                document.getElementById('statEmergencies').textContent = active;
                if (active > 0) {
                    const badge = document.getElementById('emergencyBadge');
                    badge.textContent = active;
                    badge.style.display = 'inline';
                }
            }
        }
    } catch(e) {}
}

// Logout
function logout() {
    const email = user.email || '';
    localStorage.clear();
    window.location.href = `/auth/login.html?email=${encodeURIComponent(email)}`;
}

// Close sidebar when clicking overlay
document.getElementById('sidebarOverlay').addEventListener('click', toggleSidebar);

// Handle window resize
window.addEventListener('resize', () => {
    if (window.innerWidth > 900) {
        document.getElementById('sidebar').classList.remove('open');
        document.getElementById('sidebarOverlay').classList.remove('show');
        document.getElementById('backBtn').style.display = 'none';
    }
});

// Initialize
loadStats();
setInterval(loadStats, 30000); // Refresh every 30 seconds

console.log('✅ Voddic Dashboard Ready');
