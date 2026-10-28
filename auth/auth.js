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



// ============================================================
// Signup Form Handler
// ============================================================
const signupForm = document.getElementById('signupForm');

if (signupForm) {
    signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        clearAllErrors();

        // 1. Gather input values matching your HTML IDs
        const first_name = document.getElementById('firstName')?.value.trim();
        const last_name = document.getElementById('lastName')?.value.trim();
        const email = document.getElementById('email')?.value.trim();
        const hotel_name = document.getElementById('hotelName')?.value.trim();
        const phone = document.getElementById('phone')?.value.trim();
        const password = document.getElementById('password')?.value;
        const confirm_password = document.getElementById('confirmPassword')?.value;
        const agree_terms = document.getElementById('agreeTerms')?.checked;

        // 2. Client-side Validation Checks
        let isValid = true;

        if (!first_name) { showFieldError('firstName', 'First name is required'); isValid = false; }
        if (!last_name) { showFieldError('lastName', 'Last name is required'); isValid = false; }
        if (!email) { showFieldError('email', 'Email address is required'); isValid = false; }
        if (!hotel_name) { showFieldError('hotelName', 'Hotel name is required'); isValid = false; }
        if (!password || password.length < 8) { showFieldError('password', 'Password must be at least 8 characters'); isValid = false; }
        if (password !== confirm_password) { showFieldError('confirmPassword', 'Passwords do not match'); isValid = false; }
        if (!agree_terms) { showFormError('You must agree to the Terms of Service'); isValid = false; }

        if (!isValid) return;

        // 3. UI Loading State
        const submitBtn = document.getElementById('submitBtn');
        const submitText = document.getElementById('submitText');
        const submitLoader = document.getElementById('submitLoader');

        if (submitBtn) submitBtn.disabled = true;
        if (submitText) submitText.style.display = 'none';
        if (submitLoader) submitLoader.style.display = 'inline-block';

        try {
            // 4. Send Request to Backend API
            // Note: Update '/hotel-owner/signup/' if your backend uses a different route suffix
            const response = await fetch(API_BASE + '/hotel-owner/signup/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    first_name,
                    last_name,
                    email,
                    hotel_name,
                    phone,
                    password
                })
            });

            const data = await response.json();

            if (response.ok) {
                showFormSuccess('Account created successfully! Redirecting...');
                
                // If backend returns a token or user session automatically on sign-up
                if (data.access) {
                    setToken(data.access);
                    if (data.refresh) localStorage.setItem('refresh_token', data.refresh);
                    if (data.user) localStorage.setItem('user', JSON.stringify(data.user));
                }

                setTimeout(() => {
                    window.location.href = '/hotel-owner/index.html'; // Or your target post-signup page
                }, 1500);
            } else {
                // Handle API error dictionaries (e.g., email already exists)
                if (typeof data === 'object') {
                    let errorMessage = '';
                    for (const [key, value] of Object.entries(data)) {
                        errorMessage += `${key}: ${Array.isArray(value) ? value.join(', ') : value} \n`;
                        if (key === 'email') showFieldError('email', value);
                        if (key === 'password') showFieldError('password', value);
                    }
                    showFormError(errorMessage || 'Registration failed. Please check your inputs.');
                } else {
                    showFormError(data.message || data.error || 'Registration failed.');
                }
            }
        } catch (err) {
            console.error('Registration error:', err);
            showFormError('Network error: Unable to connect to server.');
        } finally {
            if (submitBtn) submitBtn.disabled = false;
            if (submitText) submitText.style.display = 'inline-block';
            if (submitLoader) submitLoader.style.display = 'none';
        }
    });
}