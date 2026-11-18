/* ============================================================
   VODDIC HOTEL CONNECT — Auth Guard
   Small, standalone helper. Load BEFORE dashboard.js.
   - Normalizes token key: access_token <-> access
   - Validates session against /auth/me/
   - Rehydrates localStorage.user / localStorage.hotel
   - Redirects to /auth/login.html when unauthenticated
   - Exposes window.Voddic = { api, token, user, hotel, authFetch, logout }
   ============================================================ */
(function () {
  'use strict';

  var API = 'https://connectapi.voddic.com.ng/api/v1';
  var LOGIN_URL = '/auth/login.html';

  // --- 1. Normalize token key ---
  var token =
    localStorage.getItem('access_token') ||
    localStorage.getItem('access') ||
    '';

  if (!token) {
    redirectToLogin('No token');
    return;
  }
  // Always keep both keys in sync so old & new code both work
  localStorage.setItem('access_token', token);
  localStorage.setItem('access', token);

  // --- 2. Parse cached user/hotel ---
  var user = safeParse(localStorage.getItem('user')) || {};
  var hotel = safeParse(localStorage.getItem('hotel')) || {};

  // --- 3. Public helper ---
  function authFetch(path, options) {
    options = options || {};
    options.headers = Object.assign(
      {
        'Authorization': 'Bearer ' + token,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      options.headers || {}
    );
    var url = path.indexOf('http') === 0 ? path : API + path;
    return fetch(url, options).then(function (res) {
      if (res.status === 401 || res.status === 403) {
        // Token no longer valid → kick to login
        redirectToLogin('Session expired');
        return Promise.reject(new Error('Unauthorized'));
      }
      return res;
    });
  }

  function redirectToLogin(reason) {
    // eslint-disable-next-line no-console
    console.warn('[auth-guard] redirecting to login:', reason);
    try {
      localStorage.removeItem('access_token');
      localStorage.removeItem('access');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
      localStorage.removeItem('hotel');
      localStorage.removeItem('staff');
    } catch (e) { /* ignore */ }
    window.location.replace(LOGIN_URL);
  }

  function safeParse(str) {
    try { return str ? JSON.parse(str) : null; } catch (e) { return null; }
  }

  function logout() {
    try { localStorage.clear(); } catch (e) { /* ignore */ }
    window.location.replace(LOGIN_URL);
  }

  // --- 4. Expose immediately (dashboard.js can start using it) ---
  window.Voddic = {
    api: API,
    token: token,
    user: user,
    hotel: hotel,
    authFetch: authFetch,
    logout: logout
  };

  // --- 5. Validate session in the background & rehydrate missing bits ---
  authFetch('/auth/me/')
    .then(function (res) {
      if (!res.ok) return null;
      return res.json();
    })
    .then(function (me) {
      if (!me) return;
      // Refresh cached user
      var freshUser = {
        id: me.id,
        email: me.email,
        full_name: me.full_name,
        role: me.role
      };
      localStorage.setItem('user', JSON.stringify(freshUser));
      window.Voddic.user = freshUser;

      // Refresh cached hotel (me.hotel may be null)
      if (me.hotel && me.hotel.id) {
        var freshHotel = { id: me.hotel.id, name: me.hotel.name };
        localStorage.setItem('hotel', JSON.stringify(freshHotel));
        window.Voddic.hotel = freshHotel;
      }

      // Let dashboard.js know we're ready (fires once)
      window.dispatchEvent(new CustomEvent('voddic:ready', {
        detail: { user: freshUser, hotel: window.Voddic.hotel }
      }));
    })
    .catch(function (err) {
      // authFetch already redirected on 401/403; other errors just log
      // eslint-disable-next-line no-console
      console.warn('[auth-guard] /auth/me/ check failed:', err.message);
    });
})();
