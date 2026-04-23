// fix-auth-persist.js — node fix-auth-persist.js
// Fixes admin login not persisting on refresh.
const fs = require('fs');
let html = fs.readFileSync(__dirname + '/admin.html', 'utf8');

// ── 1. Update _showAdminApp ───────────────────────────────────────────────
const OLD_SHOW = "  function _showAdminApp(user) {\r\n    const profile = ADMIN_PROFILES[user.email] || { name: user.email, initials: user.email[0].toUpperCase() };\r\n    currentAdmin = { email: user.email, ...profile };\r\n    try { sessionStorage.setItem('cq_admin_session', JSON.stringify(currentAdmin)); } catch(e) {}\r\n    document.getElementById('admin-login').style.display = 'none';\r\n    document.getElementById('admin-app').style.display = 'block';\r\n    document.getElementById('sb-avatar').textContent = profile.initials;\r\n    document.getElementById('sb-name').textContent = profile.name;\r\n    if (typeof initAdminApp === 'function') initAdminApp();\r\n  }";
const NEW_SHOW = "  var _adminAppInited = false;\r\n  function _showAdminApp(user) {\r\n    const profile = ADMIN_PROFILES[user.email] || { name: user.email, initials: user.email[0].toUpperCase() };\r\n    currentAdmin = { email: user.email, ...profile };\r\n    try { localStorage.setItem('cq_admin_user', JSON.stringify({ email: user.email })); } catch(e) {}\r\n    document.getElementById('admin-login').style.display = 'none';\r\n    document.getElementById('admin-app').style.display = 'block';\r\n    document.getElementById('sb-avatar').textContent = profile.initials;\r\n    document.getElementById('sb-name').textContent = profile.name;\r\n    if (!_adminAppInited) { _adminAppInited = true; if (typeof initAdminApp === 'function') initAdminApp(); }\r\n  }";

const i1 = html.indexOf(OLD_SHOW);
if (i1 === -1) { console.error('_showAdminApp not found'); process.exit(1); }
html = html.slice(0, i1) + NEW_SHOW + html.slice(i1 + OLD_SHOW.length);
console.log('1. _showAdminApp updated at', i1);

// ── 2. Update adminLogout ─────────────────────────────────────────────────
const OLD_LOGOUT = "  function adminLogout() {\r\n    fsAuthSignOut().then(() => {\r\n      try { sessionStorage.removeItem('cq_admin_session'); } catch(e) {}\r\n      location.reload();\r\n    });\r\n  }";
const NEW_LOGOUT = "  function adminLogout() {\r\n    try { localStorage.removeItem('cq_admin_user'); } catch(e) {}\r\n    _adminAppInited = false;\r\n    fsAuthSignOut().then(() => { location.reload(); });\r\n  }";

const i2 = html.indexOf(OLD_LOGOUT);
if (i2 === -1) { console.error('adminLogout not found'); process.exit(1); }
html = html.slice(0, i2) + NEW_LOGOUT + html.slice(i2 + OLD_LOGOUT.length);
console.log('2. adminLogout updated at', i2);

// ── 3. Replace fsAuthOnStateChange block with fast-restore + auth handler ──
const OLD_AUTH = "  // Firebase Auth state — auto-restore session on page load\r\n  fsAuthOnStateChange(function(user) {\r\n    if (user && ADMIN_PROFILES[user.email]) {\r\n      _showAdminApp(user);\r\n    } else if (user) {\r\n      fsAuthSignOut();\r\n      document.getElementById('admin-login').style.display = 'flex';\r\n    } else {\r\n      document.getElementById('admin-login').style.display = 'flex';\r\n    }\r\n  });";

const NEW_AUTH = "  // Fast-restore: show admin immediately from localStorage while Firebase resolves\r\n  (function() {\r\n    try {\r\n      var _cached = JSON.parse(localStorage.getItem('cq_admin_user') || 'null');\r\n      if (_cached && _cached.email && ADMIN_PROFILES[_cached.email]) {\r\n        var _profile = ADMIN_PROFILES[_cached.email];\r\n        currentAdmin = { email: _cached.email, name: _profile.name, initials: _profile.initials };\r\n        _adminAppInited = true;\r\n        document.getElementById('admin-login').style.display = 'none';\r\n        document.getElementById('admin-app').style.display = 'block';\r\n        document.getElementById('sb-avatar').textContent = _profile.initials;\r\n        document.getElementById('sb-name').textContent = _profile.name;\r\n        if (typeof initAdminApp === 'function') initAdminApp();\r\n      }\r\n    } catch(e) {}\r\n  })();\r\n\r\n  // Firebase Auth state — confirm or revoke fast-restore\r\n  fsAuthOnStateChange(function(user) {\r\n    if (user && ADMIN_PROFILES[user.email]) {\r\n      _showAdminApp(user);\r\n    } else if (user) {\r\n      // Signed in but not an admin\r\n      try { localStorage.removeItem('cq_admin_user'); } catch(e) {}\r\n      _adminAppInited = false;\r\n      currentAdmin = null;\r\n      fsAuthSignOut();\r\n      document.getElementById('admin-app').style.display = 'none';\r\n      document.getElementById('admin-login').style.display = 'flex';\r\n    } else {\r\n      // Not signed in — clear stale session, show login\r\n      try { localStorage.removeItem('cq_admin_user'); } catch(e) {}\r\n      _adminAppInited = false;\r\n      currentAdmin = null;\r\n      document.getElementById('admin-app').style.display = 'none';\r\n      document.getElementById('admin-login').style.display = 'flex';\r\n    }\r\n  });";

const i3 = html.indexOf(OLD_AUTH);
if (i3 === -1) { console.error('fsAuthOnStateChange block not found'); process.exit(1); }
html = html.slice(0, i3) + NEW_AUTH + html.slice(i3 + OLD_AUTH.length);
console.log('3. Auth handler replaced with fast-restore at', i3);

fs.writeFileSync(__dirname + '/admin.html', html, 'utf8');
console.log('Done. Size:', html.length);
