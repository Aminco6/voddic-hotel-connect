/* ============================================================
   VODDIC HOTEL CONNECT — Dashboard Logic (real data)
   Requires: js/auth-guard.js loaded first (provides window.Voddic)
   ============================================================ */
(function () {
  'use strict';

  if (!window.Voddic) {
    console.error('[dashboard] auth-guard.js not loaded');
    window.location.replace('/auth/login.html');
    return;
  }
  var V = window.Voddic;
  var authFetch = V.authFetch;

  var EP = {
    rooms:        '/rooms/',
    staff:        '/staff/staff/',
    emergency:    '/emergency/',
    services:     '/services/',
    chat:         '/chat/',
    subscription: '/hotels/subscription/'
  };

  var CTA = {
    rooms:    { label: '＋ Add your first room', href: '/hotel-owner/pages/rooms.html' },
    staff:    { label: '＋ Invite staff',        href: '/hotel-owner/pages/staff.html' },
    services: { label: '＋ Create a service',    href: '/hotel-owner/pages/settings.html' },
    revenue:  { label: '＋ Set room prices',     href: '/hotel-owner/pages/rooms.html' }
  };

  var dashboardData = {
    user:  V.user  || {},
    hotel: V.hotel || {},
    stats: {},
    activity: []
  };

  // ============================================================
  // INIT
  // ============================================================
  document.addEventListener('DOMContentLoaded', function () {
    initNavigation();
    setGreeting();
    setCurrentDate();
    bindSidebarUser();

    window.addEventListener('voddic:ready', function (e) {
      if (e && e.detail) {
        dashboardData.user  = e.detail.user  || dashboardData.user;
        dashboardData.hotel = e.detail.hotel || dashboardData.hotel;
        bindSidebarUser();
      }
      loadDashboardData();
    });

    // Fallback if auth-guard is slow
    setTimeout(function () {
      if (!dashboardData.stats.roomsTotal) loadDashboardData();
    }, 2000);
  });

  function bindSidebarUser() {
    var name = dashboardData.user.full_name || dashboardData.user.email || 'Owner';
    var initial = (name.trim()[0] || 'O').toUpperCase();
    var hotelName = (dashboardData.hotel && dashboardData.hotel.name) || 'Your Hotel';

    setText('sidebarHotelName', hotelName);
    setText('userName', name);
    setText('userAvatar', initial);
    setText('ownerName', 'Welcome back, ' + name.split(' ')[0]);
    setText('hotelNameDisplay', hotelName);
  }

  function initNavigation() {
    document.querySelectorAll('.nav-item[data-page]').forEach(function (item) {
      item.addEventListener('click', function (e) {
        var href = this.getAttribute('href') || '#';
        var page = this.getAttribute('data-page');
        if (href && href !== '#' && (href.indexOf('pages/') !== -1 || href.charAt(0) === '/')) return;
        if (page) {
          e.preventDefault();
          showPage(page);
          if (window.innerWidth <= 768) toggleSidebar();
        }
      });
    });
  }

  function showPage(pageId) {
    document.querySelectorAll('.page').forEach(function (p) { p.classList.remove('active'); });
    var target = document.getElementById('page-' + pageId);
    if (target) target.classList.add('active');

    document.querySelectorAll('.nav-item[data-page]').forEach(function (item) {
      item.classList.remove('active');
      if (item.getAttribute('data-page') === pageId) item.classList.add('active');
    });

    var backBtn = document.getElementById('backBtn');
    if (backBtn) {
      if (pageId === 'overview') {
        backBtn.style.display = 'none';
      } else if (window.innerWidth <= 768) {
        backBtn.style.display = 'inline-flex';
      }
    }
  }

  function setGreeting() {
    var hour = new Date().getHours();
    var greeting = hour < 12 ? 'Good morning'
                 : hour < 17 ? 'Good afternoon'
                 : 'Good evening';
    setText('greeting', greeting);
  }

  function setCurrentDate() {
    var options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    setText('currentDate', new Date().toLocaleDateString('en-US', options));
  }

  // ============================================================
  // LOAD
  // ============================================================
  function loadDashboardData() {
    setShimmerState(true);

    Promise.all([
      safeGet(EP.rooms),
      safeGet(EP.staff),
      safeGet(EP.emergency),
      safeGet(EP.services),
      safeGet(EP.chat),
      safeGet(EP.subscription)
    ]).then(function (results) {
      var rooms        = toList(results[0]);
      var staff        = toList(results[1]);
      var emergencies  = toList(results[2]);
      var services     = toList(results[3]);
      var chats        = toList(results[4]);
      var subscription = (results[5] && !Array.isArray(results[5])) ? results[5] : {};

      computeStats(rooms, staff, emergencies, services, chats, subscription);
      computeActivity(rooms, emergencies, services);
      renderDashboard();
      setShimmerState(false);
    }).catch(function (err) {
      console.error('[dashboard] load error', err);
      setShimmerState(false);
      renderDashboard();
    });
  }

  function computeStats(rooms, staff, emergencies, services, chats, sub) {
    var roomActive   = rooms.filter(function (r) { return r.status === 'ACTIVE_STAY'; }).length;
    var roomVacant   = rooms.filter(function (r) { return r.status === 'AVAILABLE'; }).length;

    var staffActive = staff.filter(function (s) { return s.is_active !== false; }).length;

    var emergenciesActive = emergencies.filter(function (e) {
      var s = (e.status || '').toUpperCase();
      return s === 'ACTIVE' || s === 'PENDING' || s === 'OPEN';
    }).length;

    var servicesOpen = services.filter(function (s) {
      var st = (s.status || '').toLowerCase();
      return st === 'open' || st === 'pending' || st === 'in_progress' || st === '';
    }).length;

    var unreadChats = chats.filter(function (c) {
      return (c.unread_count || c.unread || 0) > 0;
    }).length;

    var today = new Date().toISOString().slice(0, 10);
    var revenue = services.reduce(function (sum, s) {
      var created = (s.created_at || '').slice(0, 10);
      if (created !== today) return sum;
      var amt = parseFloat(s.total || s.amount || s.price || 0);
      return sum + (isNaN(amt) ? 0 : amt);
    }, 0);

    dashboardData.stats = {
      roomsTotal:    rooms.length,
      roomsActive:   roomActive,
      roomsVacant:   roomVacant,
      staffTotal:    staff.length,
      staffActive:   staffActive,
      emergencies:   emergenciesActive,
      servicesOpen:  servicesOpen,
      servicesTotal: services.length,
      unreadChats:   unreadChats,
      revenueToday:  revenue,
      checkins:      '—',
      checkouts:     '—',
      orders:        services.length,
      activeCalls:   '—',
      pending:       servicesOpen + emergenciesActive,
      avgResponse:   '—',
      plan:          sub.plan || 'free',
      planStatus:    sub.status || 'active',
      maxRooms:      sub.room_limit || sub.max_rooms || 5
    };
  }

  function computeActivity(rooms, emergencies, services) {
    var items = [];

    emergencies.forEach(function (e) {
      items.push({
        icon: '🚨',
        title: 'Emergency: ' + (e.title || e.message || e.type || 'Alert') +
               (e.room_number ? ' — Room ' + e.room_number : ''),
        time: e.created_at || '',
        status: 'danger',
        statusText: (e.status || 'ACTIVE').toUpperCase()
      });
    });

    rooms.filter(function (r) { return r.status === 'ACTIVE_STAY'; }).forEach(function (r) {
      items.push({
        icon: '✅',
        title: 'Room ' + r.room_number + ' occupied',
        time: r.updated_at || r.created_at || '',
        status: 'success',
        statusText: 'ACTIVE'
      });
    });

    rooms.filter(function (r) { return r.status === 'MAINTENANCE'; }).forEach(function (r) {
      items.push({
        icon: '🔧',
        title: 'Room ' + r.room_number + ' in maintenance',
        time: r.updated_at || r.created_at || '',
        status: 'warning',
        statusText: 'MAINTENANCE'
      });
    });

    services.forEach(function (s) {
      items.push({
        icon: '📋',
        title: (s.title || s.name || 'Service request') +
               (s.room_number ? ' — Room ' + s.room_number : ''),
        time: s.created_at || '',
        status: 'info',
        statusText: (s.status || 'OPEN').toUpperCase()
      });
    });

    items.sort(function (a, b) {
      return (b.time || '').localeCompare(a.time || '');
    });

    dashboardData.activity = items.slice(0, 6);
  }

  function renderDashboard() {
    var s = dashboardData.stats;

    setStat('statGuests',      s.roomsActive,    CTA.rooms);
    setStat('statActiveRooms', s.roomsActive,    CTA.rooms);
    setStat('statVacantRooms', s.roomsVacant,    CTA.rooms);
    setStat('statEmergencies', s.emergencies,    null);
    setStat('statServices',    s.servicesOpen,   CTA.services);
    setStat('statStaff',       s.staffActive,    CTA.staff);
    setStat('statChats',       s.unreadChats,    null);
    setStat('statRevenue',     s.revenueToday,   CTA.revenue, '₦');   // <-- FIX

    setText('statCheckins',   s.checkins);
    setText('statCheckouts',  s.checkouts);
    setText('statOrders',     s.orders);
    setText('statCalls',      s.activeCalls);
    setText('statPending',    s.pending);
    setText('statResponse',   s.avgResponse);

    setText('roomsBadge',    s.roomsTotal);
    setText('guestsBadge',   s.roomsActive);
    setText('servicesBadge', s.servicesOpen);
    setText('chatBadge',     s.unreadChats);

    var emergBadge = document.getElementById('emergencyBadge');
    if (emergBadge) {
      if (s.emergencies > 0) {
        emergBadge.textContent = s.emergencies;
        emergBadge.style.display = 'inline';
      } else {
        emergBadge.style.display = 'none';
      }
    }

    renderActivity();
  }

  function renderActivity() {
    var container = document.getElementById('recentActivity');
    if (!container) return;

    if (!dashboardData.activity.length) {
      container.innerHTML =
        '<div class="activity-item">' +
          '<div class="activity-icon">📋</div>' +
          '<div class="activity-info">' +
            '<div class="activity-title">No activity yet</div>' +
            '<div class="activity-time">Add rooms, staff, or services to see activity here</div>' +
          '</div>' +
          '<a href="/hotel-owner/pages/rooms.html" class="activity-status info" style="text-decoration:none;">Add Room</a>' +
        '</div>';
      return;
    }

    container.innerHTML = dashboardData.activity.map(function (item) {
      return '<div class="activity-item">' +
        '<div class="activity-icon">' + item.icon + '</div>' +
        '<div class="activity-info">' +
          '<div class="activity-title">' + escapeHtml(item.title) + '</div>' +
          '<div class="activity-time">' + relativeTime(item.time) + '</div>' +
        '</div>' +
        '<span class="activity-status ' + item.status + '">' + escapeHtml(item.statusText) + '</span>' +
      '</div>';
    }).join('');
  }

  // ============================================================
  // HELPERS
  // ============================================================
  function safeGet(path) {
    return authFetch(path)
      .then(function (res) {
        if (!res.ok) {
          console.warn('[dashboard] ' + path + ' → HTTP ' + res.status);
          return null;
        }
        return res.json();
      })
      .catch(function (err) {
        console.warn('[dashboard] ' + path + ' failed:', err.message);
        return null;
      });
  }

  function toList(payload) {
    if (!payload) return [];
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload.results)) return payload.results;
    if (Array.isArray(payload.data)) return payload.data;
    return [];
  }

  function setText(id, value) {
    var el = document.getElementById(id);
    if (el) el.textContent = (value === null || value === undefined) ? '—' : String(value);
  }

  function setStat(id, value, cta, prefix) {
    var el = document.getElementById(id);
    if (!el) return;

    var display;
    if (value === null || value === undefined) {
      display = '—';
    } else if (prefix && typeof value === 'number') {
      display = prefix + value.toLocaleString();
    } else {
      display = String(value);
    }
    el.textContent = display;

    var card = el.closest('.stat-card');
    if (!card) return;
    var existing = card.querySelector('.stat-cta');
    if (existing) existing.remove();

    // FIX: also treat numeric zero
    var isZero = (value === 0 || value === '0');
    if (isZero && cta) {
      var a = document.createElement('a');
      a.className = 'stat-cta';
      a.href = cta.href;
      a.textContent = cta.label;
      a.style.cssText =
        'display:inline-block;margin-top:8px;font-size:.68rem;font-weight:700;' +
        'color:#e4af3e;text-decoration:none;line-height:1.3;';
      card.appendChild(a);
    }
  }

  function relativeTime(iso) {
    if (!iso) return '';
    var then = new Date(iso).getTime();
    if (isNaN(then)) return iso;
    var diff = Math.floor((Date.now() - then) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return Math.floor(diff / 60) + ' min ago';
    if (diff < 86400) return Math.floor(diff / 3600) + ' h ago';
    if (diff < 604800) return Math.floor(diff / 86400) + ' d ago';
    return new Date(iso).toLocaleDateString();
  }

  function escapeHtml(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function setShimmerState(active) {
    document.querySelectorAll('.stat-value').forEach(function (el) {
      if (active) {
        el.classList.add('loading-shimmer');
        el.style.minHeight = '28px';
        el.style.minWidth = '60px';
      } else {
        el.classList.remove('loading-shimmer');
        el.style.minHeight = '';
        el.style.minWidth = '';
      }
    });
  }

  // ============================================================
  // GLOBAL EXPORTS (for inline onclick in index.html)
  // ============================================================
  window.toggleSidebar = function () {
    var sidebar = document.getElementById('sidebar');
    var overlay = document.getElementById('sidebarOverlay');
    if (!sidebar) return;
    var isOpen = sidebar.classList.contains('open');
    if (isOpen) {
      sidebar.classList.remove('open');
      if (overlay) overlay.classList.remove('active');
      document.body.style.overflow = '';
    } else {
      sidebar.classList.add('open');
      if (overlay) overlay.classList.add('active');
      document.body.style.overflow = 'hidden';
    }
  };
  window.showPage = showPage;
  window.viewNotifications = function () { showPage('notifications'); };
  window.logout = function () { V.logout(); };

  setInterval(function () {
    if (document.visibilityState === 'visible') loadDashboardData();
  }, 30000);

  window.addEventListener('resize', function () {
    var backBtn = document.getElementById('backBtn');
    if (!backBtn) return;
    if (window.innerWidth <= 768) backBtn.classList.add('visible');
    else backBtn.classList.remove('visible');
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      var sidebar = document.getElementById('sidebar');
      if (sidebar && sidebar.classList.contains('open')) window.toggleSidebar();
    }
  });
})();
