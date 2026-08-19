/* ============================================
   Voddic SaaS - Authentication Logic
   Hotel Owner Signup + Staff/Admin Login
   ============================================ */

const API_BASE = 'https://connectapi.voddic.com.ng/api/v1/auth';
const FRONTEND_URL = window.location.origin;

// ============================================
// PASSWORD STRENGTH CHECKER
// ============================================
const passwordInput = document.getElementById('password');
const strengthBar = document.getElementById('passwordStrength');

if (passwordInput) {
  passwordInput.addEventListener('input', () => {
    const val = passwordInput.value;
    let score = 0;
    
    if (val.length >= 8) score++;
    if (/[A-Z]/.test(val)) score++;
    if (/[0-9]/.test(val)) score++;
    if (/[^A-Za-z0-9]/.test(val)) score++;
    
    strengthBar.className = 'password-strength';
    if (score <= 1) strengthBar.classList.add('strength-weak');
    else if (score <= 2) strengthBar.classList.add('strength-medium');
    else strengthBar.classList.add('strength-strong');
  });
}

// ============================================
// TOGGLE PASSWORD VISIBILITY
// ============================================
function togglePassword(id) {
  const input = document.getElementById(id);
  input.type = input.type === 'password' ? 'text' : 'password';
}

// ============================================
// SHOW ERROR
// ============================================
function showError(message) {
  const errorEl = document.getElementById('formError');
  if (errorEl) {
    errorEl.textContent = message;
    errorEl.classList.add('show');
  }
}

function hideError() {
  const errorEl = document.getElementById('formError');
  if (errorEl) errorEl.classList.remove('show');
}

// ============================================
// HOTEL OWNER SIGNUP
// ============================================
const signupForm = document.getElementById('signupForm');
if (signupForm) {
  signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideError();
    
    const fullName = document.getElementById('fullName').value.trim();
    const email = document.getElementById('email').value.trim();
    const hotelName = document.getElementById('hotelName').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    // Validation
    if (!fullName || !email || !hotelName || !password) {
      return showError('Please fill in all required fields');
    }
    
    if (password !== confirmPassword) {
      return showError('Passwords do not match');
    }
    
    if (password.length < 8) {
      return showError('Password must be at least 8 characters');
    }
    
    if (!document.getElementById('agreeTerms').checked) {
      return showError('Please agree to the Terms of Service');
    }
    
    // Submit
    const submitBtn = document.getElementById('submitBtn');
    const submitText = document.getElementById('submitText');
    const submitLoader = document.getElementById('submitLoader');
    
    submitBtn.disabled = true;
    submitText.style.display = 'none';
    submitLoader.style.display = 'inline';
    
    try {
      const response = await fetch(`${API_BASE}/owner/signup/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          full_name: fullName,
          hotel_name: hotelName,
          phone
        })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        // Show verification modal
        document.getElementById('verifyEmail').textContent = email;
        document.getElementById('verifyModal').classList.add('show');
        
        // Store email for resend
        localStorage.setItem('pendingVerifyEmail', email);
      } else {
        showError(data.error || 'Registration failed. Please try again.');
      }
    } catch (error) {
      showError('Network error. Please check your connection.');
    } finally {
      submitBtn.disabled = false;
      submitText.style.display = 'inline';
      submitLoader.style.display = 'none';
    }
  });
}

// ============================================
// GOOGLE SIGNUP
// ============================================
const googleSignupBtn = document.getElementById('googleSignupBtn');
if (googleSignupBtn) {
  googleSignupBtn.addEventListener('click', () => {
    // Trigger Google One Tap
    google.accounts.id.prompt();
  });
}

// Handle Google callback
function handleGoogleCredential(response) {
  const googleToken = response.credential;
  
  // Decode JWT to get user info
  const payload = JSON.parse(atob(googleToken.split('.')[1]));
  
  fetch(`${API_BASE}/google/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      google_token: googleToken,
      full_name: payload.name,
      hotel_name: document.getElementById('hotelName')?.value || ''
    })
  })
  .then(res => res.json())
  .then(data => {
    if (data.access) {
      localStorage.setItem('access_token', data.access);
      localStorage.setItem('refresh_token', data.refresh);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      if (data.next_step === 'create_hotel') {
        window.location.href = '/hotel-owner/setup/';
      } else {
        window.location.href = '/hotel-owner/dashboard/';
      }
    } else {
      showError(data.error || 'Google signup failed');
    }
  })
  .catch(() => showError('Network error'));
}

// ============================================
// STAFF / ADMIN LOGIN
// ============================================
const signinForm = document.getElementById('signinForm');
if (signinForm) {
  signinForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideError();
    
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    
    if (!email || !password) {
      return showError('Please enter your email and password');
    }
    
    const submitBtn = document.getElementById('submitBtn');
    const submitText = document.getElementById('submitText');
    const submitLoader = document.getElementById('submitLoader');
    
    submitBtn.disabled = true;
    submitText.style.display = 'none';
    submitLoader.style.display = 'inline';
    
    try {
      const response = await fetch(`${API_BASE}/staff/login/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        localStorage.setItem('access_token', data.access);
        localStorage.setItem('refresh_token', data.refresh);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        if (data.staff) localStorage.setItem('staff', JSON.stringify(data.staff));
        if (data.hotel) localStorage.setItem('hotel', JSON.stringify(data.hotel));
        
        // Redirect based on role
        window.location.href = data.redirect_url || '/staff/dashboard/';
      } else {
        showError(data.error || 'Invalid credentials');
      }
    } catch (error) {
      showError('Network error. Please try again.');
    } finally {
      submitBtn.disabled = false;
      submitText.style.display = 'inline';
      submitLoader.style.display = 'none';
    }
  });
}

// ============================================
// ROLE TABS
// ============================================
document.querySelectorAll('.role-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.role-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    
    const role = tab.dataset.role;
    const googleBtn = document.getElementById('googleSigninBtn');
    const divider = document.getElementById('dividerGoogle');
    
    if (role === 'owner') {
      googleBtn.style.display = 'flex';
      divider.style.display = 'flex';
    } else {
      googleBtn.style.display = 'none';
      divider.style.display = 'none';
    }
  });
});

// ============================================
// VERIFICATION MODAL
// ============================================
function closeVerifyModal() {
  document.getElementById('verifyModal').classList.remove('show');
}

async function resendVerification() {
  const email = localStorage.getItem('pendingVerifyEmail');
  if (!email) return;
  
  const resendBtn = document.getElementById('resendBtn');
  resendBtn.disabled = true;
  resendBtn.textContent = 'Sending...';
  
  try {
    await fetch(`${API_BASE}/resend-verification/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    resendBtn.textContent = 'Sent! Check your email';
  } catch {
    resendBtn.textContent = 'Resend email';
    resendBtn.disabled = false;
  }
}

// ============================================
// EMAIL VERIFICATION PAGE
// ============================================
if (window.location.pathname.includes('verify-email')) {
  const params = new URLSearchParams(window.location.search);
  const token = params.get('token');
  
  if (token) {
    fetch(`${API_BASE}/verify-email/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token })
    })
    .then(res => res.json())
    .then(data => {
      document.getElementById('verifyLoading').style.display = 'none';
      
      if (data.code === 'VERIFIED') {
        document.getElementById('verifySuccess').style.display = 'block';
        localStorage.setItem('access_token', data.access);
        localStorage.setItem('refresh_token', data.refresh);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        setTimeout(() => {
          window.location.href = '/hotel-owner/setup/';
        }, 2000);
      } else {
        document.getElementById('verifyError').style.display = 'block';
        document.getElementById('verifyErrorMessage').textContent = data.error;
      }
    })
    .catch(() => {
      document.getElementById('verifyLoading').style.display = 'none';
      document.getElementById('verifyError').style.display = 'block';
      document.getElementById('verifyErrorMessage').textContent = 'Network error. Please try again.';
    });
  } else {
    document.getElementById('verifyLoading').style.display = 'none';
    document.getElementById('verifyError').style.display = 'block';
    document.getElementById('verifyErrorMessage').textContent = 'No verification token found.';
  }
}

console.log('✅ Voddic Auth System Ready');
