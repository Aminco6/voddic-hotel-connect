// ============================================================
// AUTH & SIGNUP HANDLER
// ============================================================

const API_BASE = 'https://connectapi.voddic.com.ng/api/v1/auth';

console.log('✅ Auth helpers loaded');

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

function clearAllErrors() {
    document.querySelectorAll('.field-error').forEach(e => e.textContent = '');
    document.querySelectorAll('input.error').forEach(e => e.classList.remove('error'));
    const fe = document.getElementById('formError');
    if (fe) { fe.classList.remove('show'); fe.textContent = ''; }
    const sm = document.getElementById('successMessage');
    if (sm) { sm.classList.remove('show'); sm.textContent = ''; }
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
// Signup Form Submission Handler
// ============================================================
const signupForm = document.getElementById('signupForm');

if (signupForm) {
    signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        clearAllErrors();

        // 1. Gather input values matching your HTML IDs
        const firstName = document.getElementById('firstName')?.value.trim() || '';
        const lastName = document.getElementById('lastName')?.value.trim() || '';
        const full_name = `${firstName} ${lastName}`.trim(); // Combined for Django backend
        
        const email = document.getElementById('email')?.value.trim();
        const hotel_name = document.getElementById('hotelName')?.value.trim();
        const phone = document.getElementById('phone')?.value.trim();
        const password = document.getElementById('password')?.value;
        const confirm_password = document.getElementById('confirmPassword')?.value;
        const agree_terms = document.getElementById('agreeTerms')?.checked;

        // 2. Client-side Validation Checks
        let isValid = true;

        if (!firstName) { showFieldError('firstName', 'First name is required'); isValid = false; }
        if (!lastName) { showFieldError('lastName', 'Last name is required'); isValid = false; }
        if (!email || !email.includes('@')) { showFieldError('email', 'Valid email is required'); isValid = false; }
        if (!hotel_name || hotel_name.length < 3) { showFieldError('hotelName', 'Hotel name is required (min 3 chars)'); isValid = false; }
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
            const response = await fetch(API_BASE + '/hotel-owner/signup/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    full_name,
                    email,
                    hotel_name,
                    phone,
                    password
                })
            });

            // Safely parse JSON response
            const textResponse = await response.text();
            let data;
            try {
                data = JSON.parse(textResponse);
            } catch (err) {
                console.error("Server returned non-JSON response:", textResponse);
                showFormError("Server error: Received invalid response format.");
                return;
            }

            if (response.ok && data.success) {
                showFormSuccess(data.message || 'Account created successfully! Redirecting...');
                
               setTimeout(() => {
    window.location.href = `/auth/verify-email.html?email=${encodeURIComponent(email)}`;
}, 1800);
            } else {
                // Handle field-specific errors returned from Django DRF
                if (data.errors && typeof data.errors === 'object') {
                    for (const [key, value] of Object.entries(data.errors)) {
                        const errorString = Array.isArray(value) ? value.join(', ') : value;
                        if (key === 'email') showFieldError('email', errorString);
                        if (key === 'password') showFieldError('password', errorString);
                        if (key === 'full_name') {
                            showFieldError('firstName', errorString);
                        }
                        if (key === 'hotel_name') showFieldError('hotelName', errorString);
                    }
                }
                showFormError(data.message || 'Registration failed. Please check your inputs.');
            }
        } catch (err) {
            console.error('Registration network error:', err);
            showFormError('Network error: Unable to connect to the server.');
        } finally {
            if (submitBtn) submitBtn.disabled = false;
            if (submitText) submitText.style.display = 'inline-block';
            if (submitLoader) submitLoader.style.display = 'none';
        }
    });
}