// auth/auth.js - Shared authentication helpers

const API_BASE = 'https://connectapi.voddic.com.ng/api/v1/auth';

// ============================================================
// Password Strength Indicator
// ============================================================
const pw = document.getElementById('password');
if (pw) {
    pw.addEventListener('input', () => {
        const bar = document.getElementById('passwordStrength');
        if (!bar) return;
        const v = pw.value;
        let sc = 0;
        if (v.length >= 8) sc++; 
        if (/[A-Z]/.test(v)) sc++; 
        if (/[0-9]/.test(v)) sc++; 
        if (/[^A-Za-z0-9]/.test(v)) sc++;
        bar.className = 'password-strength-bar';
        if (!v) bar.style.width = '0';
        else if (sc <= 1) bar.classList.add('strength-weak');
        else if (sc === 2) bar.classList.add('strength-fair');
        else if (sc === 3) bar.classList.add('strength-good');
        else bar.classList.add('strength-strong');
    });
}

// ============================================================
// Field Error Helpers
// ============================================================
function showFieldError(id, msg) {
    const input = document.getElementById(id);
    if (input) input.classList.add('error');
    const el = document.getElementById(id + '-error');
    if (el) el.textContent = msg;
}

function clearFieldError(id) {
    const input = document.getElementById(id);
    if (input) input.classList.remove('error');
    const el = document.getElementById(id + '-error');
    if (el) el.textContent = '';
}

function clearAllErrors() {
    document.querySelectorAll('.field-error').forEach(e => e.textContent = '');
    document.querySelectorAll('input.error').forEach(e => e.classList.remove('error'));
    const fe = document.getElementById('formError');
    if (fe) { fe.classList.remove('show'); fe.textContent = ''; }
}

function showFormError(msg) {
    const el = document.getElementById('formError');
    if (el) { el.textContent = msg; el.classList.add('show'); }
}

function showFormSuccess(msg) {
    const el = document.getElementById('successMessage');
    if (el) { el.textContent = msg; el.classList.add('show'); }
}

// ============================================================
// Token Helpers
// ============================================================
function getToken() {
    return localStorage.getItem('access_token');
}

function setToken(token) {
    localStorage.setItem('access_token', token);
}

function removeToken() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    localStorage.removeItem('hotel');
    localStorage.removeItem('staff');
}

function getUser() {
    try {
        return JSON.parse(localStorage.getItem('user') || '{}');
    } catch {
        return {};
    }
}

function isAuthenticated() {
    return !!getToken();
}

// ============================================================
// Role Helpers
// ============================================================
function getUserRole() {
    const user = getUser();
    return user.role || 'GUEST';
}

function isStaff() {
    return getUserRole() === 'STAFF';
}

function isHotelOwner() {
    return getUserRole() === 'HOTEL_OWNER';
}

function isAdmin() {
    return getUserRole() === 'PLATFORM_ADMIN';
}

function getRedirectUrl() {
    const role = getUserRole();
    const roleMap = {
        'PLATFORM_ADMIN': '/admin/',
        'HOTEL_OWNER': '/hotel-owner/',
        'STAFF': '/staff/dashboard/index.html'
    };
    return roleMap[role] || '/dashboard/';
}

// ============================================================
// API Helpers
// ============================================================
function getHeaders() {
    const token = getToken();
    return {
        'Authorization': token ? 'Bearer ' + token : '',
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    };
}

async function apiRequest(url, options = {}) {
    const headers = { ...getHeaders(), ...(options.headers || {}) };
    const response = await fetch(API_BASE + url, {
        ...options,
        headers: headers
    });
    
    if (response.status === 401) {
        // Token expired - redirect to login
        removeToken();
        window.location.href = '/auth/login.html';
        return null;
    }
    
    return response;
}

// ============================================================
// Logout
// ============================================================
function logout() {
    removeToken();
    window.location.href = '/auth/login.html';
}

// ============================================================
// PWA Installation Helper
// ============================================================
let deferredPrompt;

window.addEventListener('beforeinstallprompt', function(e) {
    e.preventDefault();
    deferredPrompt = e;
    console.log('📱 PWA installation available');
    // Dispatch event for other scripts to listen
    document.dispatchEvent(new CustomEvent('pwa-ready', { detail: deferredPrompt }));
});

window.installPWA = async function() {
    if (deferredPrompt) {
        deferredPrompt.prompt();
        const result = await deferredPrompt.userChoice;
        console.log('User choice:', result.outcome);
        deferredPrompt = null;
        return result.outcome === 'accepted';
    }
    return false;
};

// Check if running as PWA
window.isPWA = function() {
    return window.matchMedia('(display-mode: standalone)').matches;
};

console.log('✅ Auth helpers loaded');