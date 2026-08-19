#!/bin/bash

# Update Guest PWA with beautiful centralized design
PROJECT_DIR="$HOME/voddic_frontend/guest"

echo "============================================"
echo "🎨 Redesigning Guest PWA"
echo "============================================"

cd "$PROJECT_DIR"

# =============================================
# UPDATED CSS
# =============================================
cat > css/style.css << 'EOF'
:root{
  --ink:#0b0f16;
  --ink-2:#111827;
  --card:#1a2332;
  --card-hover:#1f2b3d;
  --brass:#c9a86a;
  --brass-soft:rgba(201,168,106,.14);
  --brass-line:rgba(201,168,106,.35);
  --teal:#57C9BD;
  --coral:#E2707A;
  --ivory:#eef1f4;
  --muted:#9aa4b2;
  --muted-2:#6b7280;
  --line:rgba(238,241,244,.08);
  --line-strong:rgba(238,241,244,.14);
  --radius:16px;
  --shadow-lg:0 24px 60px -20px rgba(0,0,0,.6);
  --safe-bottom: env(safe-area-inset-bottom, 20px);
}

*{box-sizing:border-box; margin:0; padding:0;}
html{-webkit-tap-highlight-color:transparent; scroll-behavior:smooth;}
body{
  background:
    radial-gradient(1200px 600px at 50% -5%, rgba(201,168,106,.08), transparent 60%),
    radial-gradient(900px 500px at 50% 100%, rgba(87,201,189,.04), transparent 55%),
    var(--ink);
  color:var(--ivory);
  font-family:'Inter', sans-serif;
  min-height:100vh;
  -webkit-font-smoothing:antialiased;
  padding-bottom:var(--safe-bottom);
}
::selection{ background:var(--brass-soft); color:var(--ivory); }
a{ color:inherit; text-decoration:none; }
button{ font-family:inherit; cursor:pointer; }
:focus-visible{ outline:2px solid var(--teal); outline-offset:3px; border-radius:4px; }

.mono{ font-family:'IBM Plex Mono', monospace; letter-spacing:.02em; }

/* ============================================
   HERO SECTION - Centered & Attractive
   ============================================ */
.hero{
  text-align:center;
  padding:max(50px, 10vh) 24px 40px;
  position:relative;
  overflow:hidden;
}
.hero::before{
  content:"";
  position:absolute; inset:0;
  background-image:
    repeating-linear-gradient(0deg, rgba(255,255,255,.012) 0px, rgba(255,255,255,.012) 1px, transparent 1px, transparent 3px);
  pointer-events:none;
}
.hero-container{
  max-width:600px;
  margin:0 auto;
  position:relative;
}

.hero-badge{
  display:inline-flex;
  align-items:center; gap:8px;
  background:var(--brass-soft);
  border:1px solid var(--brass-line);
  padding:8px 20px;
  border-radius:999px;
  font-family:'IBM Plex Mono', monospace;
  font-size:11px; letter-spacing:.12em;
  text-transform:uppercase;
  color:var(--brass);
  margin-bottom:28px;
}
.hero-badge .live-dot{
  width:7px; height:7px; border-radius:50%;
  background:var(--teal);
  box-shadow:0 0 0 3px rgba(87,201,189,.2);
  animation:pulse 2.4s ease-in-out infinite;
}
@keyframes pulse{ 0%,100%{opacity:1;} 50%{opacity:.35;} }

.hero-title{
  font-family:'Fraunces', serif;
  font-weight:600;
  font-size:clamp(32px, 7vw, 56px);
  line-height:1.05;
  letter-spacing:-.01em;
  margin-bottom:12px;
}
.hero-title .accent{
  background:linear-gradient(135deg, var(--brass), #e2c87a);
  -webkit-background-clip:text;
  -webkit-text-fill-color:transparent;
  background-clip:text;
}

.hero-subtitle{
  font-size:clamp(13px, 2vw, 15px);
  color:var(--muted);
  line-height:1.7;
  max-width:500px;
  margin:0 auto 24px;
}
.hero-subtitle strong{
  color:var(--ivory);
  font-weight:600;
}

.hero-stats{
  display:flex;
  justify-content:center;
  gap:32px;
  padding-top:20px;
  border-top:1px dashed var(--line-strong);
  margin-top:8px;
}
.hero-stat{
  text-align:center;
}
.hero-stat-number{
  font-family:'Fraunces', serif;
  font-size:28px; font-weight:600;
  color:var(--brass);
  line-height:1;
}
.hero-stat-label{
  font-family:'IBM Plex Mono', monospace;
  font-size:10px;
  color:var(--muted-2);
  letter-spacing:.06em;
  text-transform:uppercase;
  margin-top:4px;
}

/* ============================================
   SEARCH BAR - Centered
   ============================================ */
.search-section{
  text-align:center;
  padding:0 24px 32px;
}
.search-container{
  max-width:480px;
  margin:0 auto;
}
.section-label{
  font-family:'Fraunces', serif;
  font-weight:500;
  font-size:18px;
  color:var(--ivory);
  margin-bottom:16px;
}
.section-label .count{
  color:var(--muted-2);
  font-family:'IBM Plex Mono';
  font-size:11px;
  margin-left:6px;
  font-weight:400;
}

.search-box{
  display:flex; align-items:center; gap:10px;
  background:var(--card);
  border:1.5px solid var(--line-strong);
  border-radius:16px;
  padding:14px 18px;
  transition:border-color .3s, box-shadow .3s;
}
.search-box:focus-within{
  border-color:var(--brass-line);
  box-shadow:0 0 0 4px rgba(201,168,106,.08);
}
.search-box svg{
  flex:none;
  opacity:.5;
  color:var(--muted);
}
.search-box input{
  background:none; border:none; outline:none;
  color:var(--ivory); font-size:14px;
  width:100%; font-family:'Inter';
}
.search-box input::placeholder{
  color:var(--muted-2);
  font-size:13px;
}

/* ============================================
   HOTEL CARDS GRID - 2 on mobile, 3-4 desktop
   ============================================ */
.grid-section{
  padding:0 24px 80px;
}
.grid-container{
  max-width:1100px;
  margin:0 auto;
}

.grid{
  display:grid;
  grid-template-columns:repeat(4, 1fr);
  gap:18px;
}
@media(max-width:1100px){ .grid{ grid-template-columns:repeat(3, 1fr); gap:16px; } }
@media(max-width:768px){ .grid{ grid-template-columns:repeat(2, 1fr); gap:12px; } }
@media(max-width:420px){ .grid{ grid-template-columns:1fr; gap:10px; } }

/* Card */
.card{
  background:var(--card);
  border:1px solid var(--line);
  border-radius:var(--radius);
  overflow:hidden;
  display:flex; flex-direction:column;
  transition:transform .3s cubic-bezier(.2,.8,.2,1), border-color .3s, box-shadow .3s;
  opacity:0; transform:translateY(14px);
  animation:rise .5s cubic-bezier(.2,.8,.2,1) forwards;
  animation-delay:var(--d);
  position:relative;
}
@keyframes rise{ to{ opacity:1; transform:translateY(0);} }
.card:active{ transform:scale(.98); }
@media(hover:hover){
  .card:hover{
    transform:translateY(-4px);
    border-color:var(--brass-line);
    box-shadow:0 12px 30px -10px rgba(0,0,0,.4);
  }
}

/* Room availability badge */
.room-availability{
  position:absolute;
  top:10px;
  left:10px;
  z-index:5;
  padding:5px 10px;
  border-radius:999px;
  font-family:'IBM Plex Mono', monospace;
  font-size:10px;
  letter-spacing:.05em;
  font-weight:600;
  backdrop-filter:blur(8px);
}
.availability-many{
  background:rgba(47,160,106,.2);
  color:#2fa06a;
  border:1px solid rgba(47,160,106,.3);
}
.availability-few{
  background:rgba(245,158,11,.2);
  color:#f59e0b;
  border:1px solid rgba(245,158,11,.3);
}
.availability-none{
  background:rgba(226,65,44,.2);
  color:#e2412c;
  border:1px solid rgba(226,65,44,.3);
}

.card-media{
  position:relative;
  aspect-ratio:4/3;
  overflow:hidden;
  background:linear-gradient(140deg,#2a2f38,#1a1d23);
}
.card-media img{
  width:100%; height:100%; object-fit:cover;
  display:block;
  transition:transform .6s cubic-bezier(.2,.8,.2,1);
}
@media(hover:hover){
  .card:hover .card-media img{ transform:scale(1.06); }
}
.card-media .veil{
  position:absolute; inset:0;
  background:linear-gradient(180deg, transparent 50%, rgba(11,15,22,.9) 100%);
}

.card-rating{
  position:absolute; top:10px; right:10px;
  display:flex; align-items:center; gap:4px;
  background:rgba(11,15,22,.75); backdrop-filter:blur(6px);
  border:1px solid rgba(238,241,244,.12);
  padding:4px 9px; border-radius:999px;
  font-family:'IBM Plex Mono'; font-size:10.5px;
  color:var(--brass);
}

.card-location{
  position:absolute; left:12px; bottom:12px;
  font-family:'IBM Plex Mono'; font-size:9.5px;
  letter-spacing:.06em; text-transform:uppercase;
  color:var(--muted);
  display:flex; align-items:center; gap:4px;
}

.card-body{ padding:14px 15px 0; }
.card-name{
  font-family:'Fraunces', serif;
  font-size:clamp(15px, 2vw, 18px);
  font-weight:600;
  letter-spacing:-.005em;
  line-height:1.2;
}
.card-desc{
  margin-top:5px;
  font-size:12px;
  color:var(--muted);
  line-height:1.45;
  display:-webkit-box;
  -webkit-line-clamp:2;
  -webkit-box-orient:vertical;
  overflow:hidden;
}

.card-actions{
  margin-top:auto;
  display:grid;
  grid-template-columns:1fr 1fr 1fr;
  border-top:1px solid var(--line);
}
.card-actions button{
  background:none; border:none; color:var(--muted);
  display:flex; flex-direction:column;
  align-items:center; gap:5px;
  padding:11px 4px 13px;
  font-size:9px; letter-spacing:.06em;
  text-transform:uppercase;
  font-family:'IBM Plex Mono';
  border-right:1px solid var(--line);
  transition:color .2s, background .2s;
  white-space:nowrap;
}
.card-actions button:last-child{ border-right:none; }
.card-actions button:active{
  color:var(--ivory);
  background:var(--brass-soft);
}
.card-actions button.scan-btn:active{
  color:var(--teal);
  background:rgba(87,201,189,.1);
}

/* ============================================
   MODAL
   ============================================ */
.overlay{
  position:fixed; inset:0; z-index:60;
  background:rgba(9,10,13,.75); backdrop-filter:blur(3px);
  display:flex; align-items:flex-end; justify-content:center;
  opacity:0; pointer-events:none;
  transition:opacity .3s ease;
}
.overlay.open{ opacity:1; pointer-events:auto; }
@media(min-width:720px){ .overlay{ align-items:center; padding:24px; } }

.modal{
  background:var(--ink-2);
  border:1px solid var(--line-strong);
  width:100%; max-width:480px;
  max-height:85vh;
  border-radius:22px 22px 0 0;
  display:flex; flex-direction:column;
  transform:translateY(24px);
  transition:transform .35s cubic-bezier(.2,.85,.25,1);
  box-shadow:var(--shadow-lg);
}
.overlay.open .modal{ transform:translateY(0); }
@media(min-width:720px){ .modal{ border-radius:18px; max-height:78vh; } }

.modal-grip{ display:none; }
@media(max-width:719px){
  .modal-grip{
    display:block; width:28px; height:4px;
    border-radius:2px; background:var(--line-strong);
    margin:10px auto 0; flex:none;
  }
}

.modal-head{
  display:flex; align-items:flex-start; justify-content:space-between;
  padding:18px 20px 14px;
  border-bottom:1px solid var(--line); flex:none;
}
.modal-head .modal-eyebrow{
  font-family:'IBM Plex Mono'; font-size:9.5px;
  letter-spacing:.12em; text-transform:uppercase;
  color:var(--brass); margin-bottom:3px;
}
.modal-head h3{
  font-family:'Fraunces', serif;
  font-weight:600; font-size:19px;
}
.modal-close{
  background:var(--card); border:1px solid var(--line-strong);
  color:var(--muted); width:28px; height:28px;
  border-radius:50%; display:flex;
  align-items:center; justify-content:center;
  flex:none; transition:.2s;
}
.modal-close:active{ color:var(--ivory); border-color:var(--brass-line); }

.modal-body{ padding:14px 18px 22px; overflow-y:auto; }
.modal-body::-webkit-scrollbar{ width:4px; }
.modal-body::-webkit-scrollbar-thumb{ background:var(--line-strong); border-radius:3px; }

/* Room list in modal */
.room-list-header{
  display:flex; justify-content:space-between;
  align-items:center; margin-bottom:14px;
}
.room-count-badge{
  font-family:'IBM Plex Mono'; font-size:10.5px;
  color:var(--muted); background:var(--card);
  padding:6px 12px; border-radius:999px;
  border:1px solid var(--line-strong);
}

.room-row{
  display:flex; align-items:center; gap:12px;
  padding:12px 4px; border-bottom:1px solid var(--line);
}
.room-row:last-child{ border-bottom:none; }
.room-num{
  font-family:'IBM Plex Mono'; font-size:13px; font-weight:500;
  background:var(--card); border:1px solid var(--line-strong);
  width:44px; height:38px; border-radius:8px;
  display:flex; align-items:center; justify-content:center;
  flex:none;
}
.room-info{ flex:1; min-width:0; }
.room-type{ font-size:12.5px; font-weight:600; }
.room-sub{ font-size:10.5px; color:var(--muted-2); margin-top:2px; font-family:'IBM Plex Mono'; }

.badge{
  font-family:'IBM Plex Mono'; font-size:9px;
  letter-spacing:.05em; text-transform:uppercase;
  padding:4px 9px; border-radius:999px;
  flex:none; border:1px solid transparent;
  white-space:nowrap;
}
.badge.active{ color:var(--teal); background:rgba(87,201,189,.1); border-color:rgba(87,201,189,.3); }
.badge.vacant{ color:var(--muted); background:rgba(238,241,244,.05); border-color:var(--line-strong); }
.badge.clean{ color:var(--brass); background:var(--brass-soft); border-color:var(--brass-line); }

/* Reviews */
.review-summary{
  display:flex; align-items:center; gap:14px;
  padding:6px 4px 16px; margin-bottom:8px;
  border-bottom:1px solid var(--line);
}
.review-score{
  font-family:'Fraunces', serif;
  font-size:34px; font-weight:600;
  color:var(--brass); line-height:1;
}
.review-stars{ display:flex; gap:2px; margin-top:5px; }
.review-summary-sub{
  color:var(--muted); font-size:10.5px;
  margin-top:5px; font-family:'IBM Plex Mono';
}
.review-item{ padding:11px 4px; border-bottom:1px solid var(--line); }
.review-item:last-child{ border-bottom:none; }
.review-top{
  display:flex; align-items:center;
  justify-content:space-between; margin-bottom:4px;
}
.review-name{ font-weight:600; font-size:12px; }
.review-date{ font-family:'IBM Plex Mono'; font-size:9.5px; color:var(--muted-2); }
.review-quote{ font-size:12px; color:var(--muted); line-height:1.6; }

/* Footer */
footer{
  text-align:center;
  padding:30px 24px 50px;
  font-family:'IBM Plex Mono';
  font-size:10px;
  color:var(--muted-2);
  letter-spacing:.04em;
}
footer .brass{ color:var(--brass); }

/* Install Banner */
.install-banner{
  position:fixed; bottom:24px; left:50%;
  transform:translateX(-50%);
  background:var(--card);
  border:1.5px solid var(--brass-line);
  border-radius:18px;
  z-index:100;
  display:none;
  box-shadow:0 10px 40px rgba(0,0,0,.5);
  width:calc(100% - 40px);
  max-width:360px;
}
.install-banner.show{
  display:block;
  animation:slideUp .4s ease-out;
}
@keyframes slideUp{
  from{ transform:translateX(-50%) translateY(24px); opacity:0; }
  to{ transform:translateX(-50%) translateY(0); opacity:1; }
}
.install-content{
  display:flex; align-items:center; gap:12px;
  padding:15px 18px;
}
.install-icon{ font-size:24px; }
.install-text{ flex:1; }
.install-title{ font-weight:600; font-size:13px; }
.install-desc{ font-size:10.5px; color:var(--muted); margin-top:2px; }
.install-btn{
  background:var(--brass); color:#000;
  border:none; padding:8px 15px;
  border-radius:20px; font-weight:600;
  font-size:11px;
}
.install-dismiss{
  background:none; border:none;
  color:var(--muted); font-size:15px;
  padding:4px;
}
EOF

# ============================================
# UPDATED HTML
# ============================================
cat > index.html << 'EOF'
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">
    <meta name="theme-color" content="#0b0f16">
    <meta name="description" content="Voddic Hotel Digital Assistance — Smart hotel room access and services">
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
    <meta name="mobile-web-app-capable" content="yes">
    <title>Voddic — Hotel Digital Assistance</title>
    <link rel="manifest" href="/manifest.json">
    <link rel="apple-touch-icon" href="/icons/icon-192.png">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&family=Inter:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="css/style.css">
</head>
<body>

<!-- Hero Section - Centered -->
<header class="hero">
  <div class="hero-container">
    <div class="hero-badge">
      <span class="live-dot"></span> Guest Directory — Live
    </div>
    <h1 class="hero-title">
      Voddic<br>
      <span class="accent">Hotel Digital Assistance</span>
    </h1>
    <p class="hero-subtitle">
      One scan connects you to everything your hotel offers. 
      <strong>No app, no account, no hassle</strong> — find your hotel, 
      scan the room code, and unlock instant service.
    </p>
    <div class="hero-stats">
      <div class="hero-stat">
        <div class="hero-stat-number" id="statProps">—</div>
        <div class="hero-stat-label">Properties</div>
      </div>
      <div class="hero-stat">
        <div class="hero-stat-number" id="statRooms">—</div>
        <div class="hero-stat-label">Rooms Available</div>
      </div>
      <div class="hero-stat">
        <div class="hero-stat-number">1m 40s</div>
        <div class="hero-stat-label">Avg Response</div>
      </div>
    </div>
  </div>
</header>

<!-- Search Section - Centered -->
<section class="search-section">
  <div class="search-container">
    <div class="section-label">
      Find your hotel <span class="count" id="resultCount"></span>
    </div>
    <div class="search-box">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
        <circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>
      </svg>
      <input id="searchInput" type="text" placeholder="Search by name or city..." autocomplete="off">
    </div>
  </div>
</section>

<!-- Hotel Grid -->
<section class="grid-section">
  <div class="grid-container">
    <div class="grid" id="grid"></div>
  </div>
</section>

<footer>VODDIC HOTEL DIGITAL ASSISTANCE · <span class="brass">GUEST DIRECTORY</span></footer>

<!-- Modal -->
<div class="overlay" id="overlay" role="dialog" aria-modal="true" aria-hidden="true">
  <div class="modal" id="modal">
    <div class="modal-grip"></div>
    <div class="modal-head">
      <div>
        <div class="modal-eyebrow" id="modalEyebrow">—</div>
        <h3 id="modalTitle">—</h3>
      </div>
      <button class="modal-close" id="modalClose" aria-label="Close">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
          <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
        </svg>
      </button>
    </div>
    <div class="modal-body" id="modalBody"></div>
  </div>
</div>

<!-- Install Banner -->
<div class="install-banner" id="installBanner">
  <div class="install-content">
    <div class="install-icon">🏨</div>
    <div class="install-text">
      <div class="install-title">Add to Home Screen</div>
      <div class="install-desc">Quick access to your hotel services</div>
    </div>
    <button class="install-btn" id="installBtn">Install</button>
    <button class="install-dismiss" id="installDismiss">✕</button>
  </div>
</div>

<script src="js/app.js"></script>
</body>
</html>
EOF

# ============================================
# UPDATED JAVASCRIPT
# ============================================
cat > js/app.js << 'EOF'
/* ============================================
   Voddic Hotel Digital Assistance - Guest PWA
   ============================================ */

const API_BASE_URL = 'https://connectapi.voddic.com.ng/api/v1';

// Icons as SVG strings
const I = {
  star: (s=13) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.5 15 9l7 .9-5.1 4.8L18.2 21 12 17.4 5.8 21l1.3-6.3L2 9.9 9 9Z"/></svg>`,
  pin: `<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>`,
  key: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="7.5" cy="15.5" r="4.5"/><path d="m10.6 12.4 8-8M15 4l3 3M18 7l3 3"/></svg>`,
  qr: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><path d="M14 14h3v3h-3zM20 14v.01M17 20v.01M20 20v.01M14 20v.01"/></svg>`,
  check: `<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#57C9BD" stroke-width="2.2" stroke-linecap="round"><path d="m5 13 4 4L19 7"/></svg>`,
};

// ============================================
// PWA Registration
// ============================================
let deferredPrompt = null;

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(reg => console.log('✅ SW registered'))
      .catch(err => console.log('SW registration:', err));
  });
}

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  setTimeout(() => {
    const banner = document.getElementById('installBanner');
    if (banner && !localStorage.getItem('pwaDismissed')) {
      banner.classList.add('show');
    }
  }, 3000);
});

document.addEventListener('DOMContentLoaded', () => {
  const installBtn = document.getElementById('installBtn');
  const installDismiss = document.getElementById('installDismiss');
  const installBanner = document.getElementById('installBanner');
  
  installBtn?.addEventListener('click', async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const result = await deferredPrompt.userChoice;
      deferredPrompt = null;
    }
    installBanner.classList.remove('show');
  });
  
  installDismiss?.addEventListener('click', () => {
    installBanner.classList.remove('show');
    localStorage.setItem('pwaDismissed', 'true');
  });
});

// ============================================
// HOTEL DATA
// ============================================
const HOTELS = [
  {
    id:'marlow', name:'The Marlow House', city:'Lisbon', country:'Portugal',
    rating:4.8, reviews:214,
    img:'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&w=800&q=80',
    desc:'A restored townhouse with views over Alfama rooftops.',
    rooms:[
      {num:'101', type:'Courtyard Twin', status:'vacant'},
      {num:'102', type:'Courtyard Twin', status:'vacant'},
      {num:'205', type:'Rooftop King', status:'active', device:'D8F4A21'},
      {num:'206', type:'Rooftop King', status:'vacant'},
      {num:'310', type:'Tiled Suite', status:'vacant'},
      {num:'311', type:'Tiled Suite', status:'clean'},
      {num:'312', type:'Garden Room', status:'vacant'},
    ]
  },
  {
    id:'bellcourt', name:'Bellcourt Hotel', city:'Marrakech', country:'Morocco',
    rating:4.6, reviews:389,
    img:'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=800&q=80',
    desc:'A medina riad rebuilt around a fragrant citrus courtyard.',
    rooms:[
      {num:'A1', type:'Riad Double', status:'active', device:'D9B7712'},
      {num:'A2', type:'Riad Double', status:'vacant'},
    ]
  },
  {
    id:'anchorage', name:'Anchorage Suites', city:'Reykjavik', country:'Iceland',
    rating:4.9, reviews:156,
    img:'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=800&q=80',
    desc:'Harbourfront rooms with fjord views and geothermal heating.',
    rooms:[
      {num:'201', type:'Fjord View', status:'vacant'},
      {num:'202', type:'Fjord View', status:'active', device:'D5A3F09'},
      {num:'203', type:'Fjord View', status:'vacant'},
      {num:'318', type:'Glass Loft', status:'vacant'},
      {num:'319', type:'Glass Loft', status:'vacant'},
      {num:'320', type:'Corner Suite', status:'vacant'},
    ]
  },
  {
    id:'kestrel', name:'Kestrel & Vine', city:'Napa Valley', country:'USA',
    rating:4.7, reviews:271,
    img:'https://images.unsplash.com/photo-1445019980597-93fa8acb246c?auto=format&fit=crop&w=800&q=80',
    desc:'Vineyard cottages spread among century-old oak rows.',
    rooms:[
      {num:'C1', type:'Vineyard Cottage', status:'active', device:'D1D4B88'},
      {num:'C2', type:'Vineyard Cottage', status:'vacant'},
      {num:'C3', type:'Barrel Suite', status:'vacant'},
    ]
  },
  {
    id:'unionyard', name:'The Union Yard Hotel', city:'Brooklyn', country:'USA',
    rating:4.5, reviews:502,
    img:'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80',
    desc:'Converted freight warehouse with skyline views.',
    rooms:[
      {num:'401', type:'Loft King', status:'vacant'},
      {num:'402', type:'Loft King', status:'vacant'},
      {num:'403', type:'Loft Twin', status:'vacant'},
      {num:'404', type:'Loft Twin', status:'vacant'},
      {num:'505', type:'Skylight Suite', status:'vacant'},
      {num:'506', type:'Skylight Suite', status:'vacant'},
      {num:'507', type:'Corner Loft', status:'clean'},
    ]
  },
  {
    id:'northlight', name:'Northlight Residences', city:'Kyoto', country:'Japan',
    rating:4.9, reviews:118,
    img:'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?auto=format&fit=crop&w=800&q=80',
    desc:'Machiya-style rooms opening onto a private moss garden.',
    rooms:[
      {num:'01', type:'Garden Room', status:'vacant'},
      {num:'02', type:'Garden Room', status:'vacant'},
      {num:'03', type:'Tatami Suite', status:'vacant'},
    ]
  },
  {
    id:'coralbay', name:'Coral Bay Resort', city:'Zanzibar', country:'Tanzania',
    rating:4.8, reviews:203,
    img:'https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=800&q=80',
    desc:'Beachfront villas with private plunge pools.',
    rooms:[
      {num:'V1', type:'Ocean Villa', status:'vacant'},
      {num:'V2', type:'Ocean Villa', status:'vacant'},
      {num:'V3', type:'Garden Villa', status:'vacant'},
      {num:'V4', type:'Garden Villa', status:'vacant'},
      {num:'V5', type:'Presidential Villa', status:'vacant'},
    ]
  },
  {
    id:'aurora', name:'Aurora Mountain Lodge', city:'Queenstown', country:'New Zealand',
    rating:4.7, reviews:189,
    img:'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=800&q=80',
    desc:'Alpine lodge with floor-to-ceiling mountain views.',
    rooms:[
      {num:'301', type:'Alpine Suite', status:'vacant'},
      {num:'302', type:'Alpine Suite', status:'clean'},
      {num:'303', type:'Peak View', status:'vacant'},
      {num:'304', type:'Peak View', status:'vacant'},
    ]
  },
];

const REVIEWS = [
  {name:'Priya M.', date:'Jul 2026', rating:5, quote:'Scanned the code and reception picked up immediately. Best hotel experience ever.'},
  {name:'Daan V.', date:'Jun 2026', rating:5, quote:'No app download, no login. Housekeeping request handled in under ten minutes.'},
  {name:'S. Okafor', date:'Jun 2026', rating:4, quote:'Clean interface, big clear buttons. Everything just works intuitively.'},
  {name:'Marta L.', date:'May 2026', rating:5, quote:'Transferred my session to my partner\'s phone in seconds. Brilliant system.'},
];

// ============================================
// HELPER: Count available rooms
// ============================================
function getAvailableCount(hotel) {
  return hotel.rooms.filter(r => r.status === 'vacant' || r.status === 'clean').length;
}

function getAvailabilityLabel(count) {
  if (count >= 5) return { text: `${count} rooms left`, class: 'availability-many' };
  if (count >= 2) return { text: `${count} rooms left`, class: 'availability-few' };
  if (count === 1) return { text: '1 room left', class: 'availability-few' };
  return { text: 'Full', class: 'availability-none' };
}

// ============================================
// RENDER GRID
// ============================================
const grid = document.getElementById('grid');
const resultCount = document.getElementById('resultCount');

function starRow(rating) {
  const full = Math.round(rating);
  return Array.from({length:5}).map((_, i) =>
    `<span style="opacity:${i < full ? 1 : 0.25}; color:var(--brass); display:flex;">${I.star(12)}</span>`
  ).join('');
}

function renderGrid(list) {
  grid.innerHTML = list.map((h, i) => {
    const availCount = getAvailableCount(h);
    const avail = getAvailabilityLabel(availCount);
    
    return `
    <article class="card" style="--d:${i * 70}ms" data-id="${h.id}">
      ${availCount > 0 ? 
        `<div class="room-availability ${avail.class}">${avail.text}</div>` : ''}
      <div class="card-media">
        <img src="${h.img}" alt="${h.name}" loading="lazy" 
          onerror="this.parentElement.style.background='linear-gradient(140deg, rgba(201,168,106,.15), rgba(87,201,189,.06))'; this.remove();">
        <div class="veil"></div>
        <div class="card-rating">${I.star(11)} ${h.rating}</div>
        <div class="card-location">${I.pin} ${h.city}, ${h.country}</div>
      </div>
      <div class="card-body">
        <div class="card-name">${h.name}</div>
        <div class="card-desc">${h.desc}</div>
      </div>
      <div class="card-actions">
        <button data-action="rooms" data-id="${h.id}">${I.key} Rooms</button>
        <button data-action="reviews" data-id="${h.id}">${I.star(11)} Reviews</button>
        <button class="scan-btn" data-action="scan" data-id="${h.id}">${I.qr} Scan</button>
      </div>
    </article>`;
  }).join('');
  
  resultCount.textContent = `— ${list.length} hotels`;
}

renderGrid(HOTELS);

// Update stats
document.getElementById('statProps').textContent = HOTELS.length;
document.getElementById('statRooms').textContent = HOTELS.reduce((n, h) => n + getAvailableCount(h), 0);

// Search
document.getElementById('searchInput').addEventListener('input', (e) => {
  const q = e.target.value.trim().toLowerCase();
  const filtered = q 
    ? HOTELS.filter(h => h.name.toLowerCase().includes(q) || h.city.toLowerCase().includes(q) || h.country.toLowerCase().includes(q))
    : HOTELS;
  renderGrid(filtered);
});

// ============================================
// MODAL
// ============================================
const overlay = document.getElementById('overlay');
const modalTitle = document.getElementById('modalTitle');
const modalEyebrow = document.getElementById('modalEyebrow');
const modalBody = document.getElementById('modalBody');
let lastFocused = null;

function openModal({eyebrow, title, bodyHTML}) {
  lastFocused = document.activeElement;
  modalEyebrow.textContent = eyebrow;
  modalTitle.textContent = title;
  modalBody.innerHTML = bodyHTML;
  overlay.classList.add('open');
  overlay.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  overlay.classList.remove('open');
  overlay.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
  if (lastFocused) lastFocused.focus();
}

overlay.addEventListener('click', (e) => {
  if (e.target === overlay) closeModal();
});
document.getElementById('modalClose').addEventListener('click', closeModal);
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && overlay.classList.contains('open')) closeModal();
});

// ============================================
// CONTENT BUILDERS
// ============================================
function badgeFor(status) {
  if (status === 'active') return '<span class="badge active">Active</span>';
  if (status === 'clean') return '<span class="badge clean">Cleaning</span>';
  return '<span class="badge vacant">Vacant</span>';
}

function subFor(r) {
  if (r.status === 'active') return `Bound · ${r.device}`;
  if (r.status === 'clean') return 'Ready for check-in';
  return 'Available now';
}

function roomsHTML(hotel) {
  const availCount = getAvailableCount(hotel);
  const totalRooms = hotel.rooms.length;
  
  return `
    <div class="room-list-header">
      <span style="font-weight:600;font-size:14px;">All Rooms</span>
      <span class="room-count-badge">${availCount} of ${totalRooms} available</span>
    </div>
    ${hotel.rooms.map(r => `
      <div class="room-row">
        <div class="room-num mono">${r.num}</div>
        <div class="room-info">
          <div class="room-type">${r.type}</div>
          <div class="room-sub">${subFor(r)}</div>
        </div>
        ${badgeFor(r.status)}
      </div>
    `).join('')}
  `;
}

function reviewsHTML(hotel) {
  return `
    <div class="review-summary">
      <div>
        <div class="review-score">${hotel.rating}</div>
        <div class="review-stars">${starRow(hotel.rating)}</div>
      </div>
      <div class="review-summary-sub">Based on ${hotel.reviews} verified stays<br>via room-service activity</div>
    </div>
    ${REVIEWS.map(rv => `
      <div class="review-item">
        <div class="review-top">
          <span class="review-name">${rv.name}</span>
          <span class="review-date mono">${rv.date}</span>
        </div>
        <div class="review-stars" style="margin-bottom:5px;">${starRow(rv.rating)}</div>
        <div class="review-quote">"${rv.quote}"</div>
      </div>
    `).join('')}
  `;
}

function scanHTML(hotel) {
  return `
    <div style="text-align:center;padding:8px 4px;">
      <div style="position:relative;width:200px;height:200px;margin:0 auto 16px;
        background:linear-gradient(140deg,#1a1d23,#0d0f13);
        border-radius:16px;border:1px solid var(--line-strong);
        display:flex;align-items:center;justify-content:center;">
        <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="var(--brass)" stroke-width="1" opacity="0.6">
          <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
          <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="12" y="12" width="3" height="3"/>
          <rect x="17" y="12" width="2" height="2"/><rect x="12" y="17" width="2" height="2"/>
          <rect x="17" y="17" width="4" height="4"/>
        </svg>
        <div style="position:absolute;left:15%;right:15%;height:2px;
          background:linear-gradient(90deg,transparent,var(--teal),transparent);
          animation:scanLine 2s ease-in-out infinite;top:30%;"></div>
      </div>
      <p style="color:var(--muted);font-size:12px;max-width:260px;margin:0 auto 20px;line-height:1.6;">
        Point your camera at the <b style="color:var(--ivory);">QR code</b> beside the bed or at the entrance of your room
      </p>
      <button id="simulateScan" style="width:100%;max-width:260px;background:var(--brass);color:#000;
        border:none;padding:13px 20px;border-radius:12px;font-weight:600;font-size:14px;
        display:flex;align-items:center;justify-content:center;gap:8px;margin:0 auto;">
        ${I.qr} Simulate Room Scan
      </button>
    </div>
  `;
}

// ============================================
// CARD CLICK HANDLERS
// ============================================
grid.addEventListener('click', (e) => {
  const btn = e.target.closest('button[data-action]');
  if (!btn) return;
  
  const hotel = HOTELS.find(h => h.id === btn.dataset.id);
  if (!hotel) return;
  
  const action = btn.dataset.action;
  
  if (action === 'rooms') {
    openModal({
      eyebrow: `${hotel.city}, ${hotel.country}`,
      title: hotel.name,
      bodyHTML: roomsHTML(hotel)
    });
  }
  
  if (action === 'reviews') {
    openModal({
      eyebrow: 'Guest feedback',
      title: hotel.name,
      bodyHTML: reviewsHTML(hotel)
    });
  }
  
  if (action === 'scan') {
    openModal({
      eyebrow: 'Activate your room',
      title: hotel.name,
      bodyHTML: scanHTML(hotel)
    });
  }
});

// Handle simulate scan button
modalBody.addEventListener('click', (e) => {
  if (e.target.closest('#simulateScan')) {
    const btn = document.getElementById('simulateScan');
    btn.textContent = '✓ Room Activated!';
    btn.style.background = '#2fa06a';
    btn.style.color = 'white';
    btn.disabled = true;
    
    setTimeout(() => closeModal(), 1500);
  }
});

// Add scan line animation
const scanStyle = document.createElement('style');
scanStyle.textContent = `
  @keyframes scanLine {
    0%,100% { top:30%; opacity:0.2; }
    50% { top:65%; opacity:1; }
  }
`;
document.head.appendChild(scanStyle);

console.log('✅ Voddic Hotel Digital Assistance ready');
console.log('🏨 Hotels:', HOTELS.length);
console.log('🛏️ Rooms available:', HOTELS.reduce((n,h) => n + getAvailableCount(h), 0));
EOF

# Update manifest with new name
cat > manifest.json << 'EOF'
{
  "name": "Voddic Hotel Digital Assistance",
  "short_name": "Voddic",
  "description": "Smart hotel room access and digital services",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#0b0f16",
  "theme_color": "#c9a86a",
  "orientation": "portrait-primary",
  "icons": [
    {
      "src": "icons/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "icons/icon-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ],
  "categories": ["travel", "utilities"],
  "lang": "en-US"
}
EOF

echo ""
echo "============================================"
echo "✅ Guest PWA Redesigned!"
echo "============================================"
echo ""
echo "📱 New Design Features:"
echo "   ✓ Centered hero section"
echo "   ✓ Room availability badges"
echo "   ✓ '2 rooms left', '5 rooms left' etc."
echo "   ✓ Cleaner search bar"
echo "   ✓ Product name: Voddic Hotel Digital Assistance"
echo "   ✓ 2-grid on mobile, 4-grid on desktop"
echo ""
echo "🚀 To start: cd ~/voddic_frontend/guest && python3 -m http.server 3000 --bind 0.0.0.0"
echo ""

