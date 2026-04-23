// fix-bank-detail-ui.js — node fix-bank-detail-ui.js
// Redesigns the bank detail "Previously Logged" section:
//   - Shows date client was added to this bank
//   - Groups clients by month
//   - Cleaner card layout
const fs = require('fs');
let html = fs.readFileSync(__dirname + '/admin.html', 'utf8');

// ── 1. Add CSS for month headers and improved client cards ────────────────
const OLD_CLI_CSS = "    /* Client rows in bank detail */\r\n    .bnk-client-list { display:flex; flex-direction:column; gap:10px; }\r\n    .bnk-client-row {\r\n      background:var(--white); border-radius:12px; border:1.5px solid var(--gray-100);\r\n      padding:16px 18px; display:grid; grid-template-columns:auto 1fr auto; gap:14px; align-items:start;\r\n      box-shadow:0 1px 4px rgba(10,22,40,0.04); transition:border-color 0.13s;\r\n    }\r\n    .bnk-client-row:hover { border-color:var(--gray-200); }\r\n    .bnk-cli-avatar { width:36px; height:36px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-family:var(--font-h); font-weight:700; font-size:13px; color:var(--white); flex-shrink:0; }\r\n    .bnk-cli-name { font-family:var(--font-h); font-size:14px; font-weight:700; color:var(--navy); margin-bottom:3px; }\r\n    .bnk-cli-meta { font-size:12px; color:var(--gray-400); display:flex; gap:10px; flex-wrap:wrap; margin-bottom:6px; }\r\n    .bnk-apps-row { display:flex; gap:8px; flex-wrap:wrap; }\r\n    .bnk-app-chip {";

const NEW_CLI_CSS = "    /* Client rows in bank detail */\r\n    .bnk-month-group { margin-bottom:28px; }\r\n    .bnk-month-label {\r\n      display:flex; align-items:center; gap:10px;\r\n      font-family:var(--font-h); font-size:11px; font-weight:800; color:var(--gray-400);\r\n      text-transform:uppercase; letter-spacing:0.07em; margin-bottom:10px;\r\n    }\r\n    .bnk-month-label::after { content:''; flex:1; height:1px; background:var(--gray-100); }\r\n    .bnk-month-count { background:var(--gray-100); color:var(--gray-500); font-size:10px; font-weight:700; padding:2px 7px; border-radius:20px; }\r\n    .bnk-client-list { display:flex; flex-direction:column; gap:10px; }\r\n    .bnk-client-row {\r\n      background:var(--white); border-radius:12px; border:1.5px solid var(--gray-100);\r\n      padding:14px 16px; display:grid; grid-template-columns:auto 1fr auto; gap:14px; align-items:start;\r\n      box-shadow:0 1px 4px rgba(10,22,40,0.04); transition:border-color 0.13s,box-shadow 0.13s;\r\n    }\r\n    .bnk-client-row:hover { border-color:var(--blue); box-shadow:0 4px 14px rgba(34,167,240,0.1); }\r\n    .bnk-cli-avatar { width:38px; height:38px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-family:var(--font-h); font-weight:700; font-size:13px; color:var(--white); flex-shrink:0; margin-top:1px; }\r\n    .bnk-cli-name { font-family:var(--font-h); font-size:14px; font-weight:700; color:var(--navy); margin-bottom:2px; }\r\n    .bnk-cli-meta { font-size:12px; color:var(--gray-400); display:flex; gap:10px; flex-wrap:wrap; margin-bottom:7px; align-items:center; }\r\n    .bnk-cli-date { display:inline-flex; align-items:center; gap:4px; font-size:11px; font-weight:600; color:var(--gray-400); background:var(--gray-50); border:1px solid var(--gray-100); border-radius:6px; padding:2px 7px; }\r\n    .bnk-apps-row { display:flex; gap:6px; flex-wrap:wrap; }\r\n    .bnk-app-chip {";

const ic = html.indexOf(OLD_CLI_CSS);
if (ic === -1) { console.error('client CSS not found'); process.exit(1); }
html = html.slice(0, ic) + NEW_CLI_CSS + html.slice(ic + OLD_CLI_CSS.length);
console.log('1. CSS updated at', ic);

// ── 2. Rewrite clientRows + previously-logged section in showBankDetail ───
const OLD_SECTION = "    // Logged clients rows\r\n    const clientRows = clientsAtBank.map(c => {\r\n      const d = getDashData(c.id);\r\n      const cr = getCreditData(c.id);\r\n      const ob = getOnboardDataForClient(c.id) || {};\r\n      const rows = (d.fundingRows||[]).filter(r=>r.bank===bankName);\r\n      const logged = getBankApps(c.id).filter(a=>a.bank===bankName);\r\n      const chips = [\r\n        ...rows.map(r=>{const cls=r.status==='approved'?'approved':r.status==='denied'?'denied':r.status==='applied'?'applied':'pending';return`<span class=\"bnk-app-chip ${cls}\">${r.card||r.bank}${r.amount?' · $'+Number(r.amount).toLocaleString():''}</span>`;}),\r\n        ...logged.map(a=>{const cls=a.outcome==='approved'?'approved':a.outcome==='denied'?'denied':'pending';return`<span class=\"bnk-app-chip ${cls}\">${a.outcome}${a.amount?' · $'+Number(a.amount).toLocaleString():''}</span>`;})\r\n      ].join('');\r\n      const fico = cr?.fico||d.creditScore||c.fico||'—';\r\n      return `<div class=\"bnk-client-row\">\r\n        <div class=\"bnk-cli-avatar\" style=\"background:${c.color||'var(--blue)'}\">${(c.fname||'?')[0]}${(c.lname||'')[0]}</div>\r\n        <div>\r\n          <div class=\"bnk-cli-name\">${c.fname} ${c.lname}</div>\r\n          <div class=\"bnk-cli-meta\"><span>FICO ${fico}</span>${ob.annualIncome?`<span>${ob.annualIncome}/yr</span>`:''}<span>${c.state||ob.state||'—'}</span></div>\r\n          <div class=\"bnk-apps-row\">${chips||'<span style=\"font-size:12px;color:var(--gray-400)\">No applications logged</span>'}</div>\r\n        </div>\r\n        <div class=\"bnk-cli-actions\">\r\n          <button class=\"bac-btn\" onclick=\"bnkPickClient('${bankName.replace(/'/g,\"\\\\'\")}','${c.id}')\">Edit / Add App</button>\r\n          <button class=\"bac-btn danger\" onclick=\"removeClientFromBank('${bankName.replace(/'/g,\"\\\\'\")}','${c.id}')\" style=\"margin-left:6px\">Remove</button>\r\n        </div>\r\n      </div>`;\r\n    }).join('');";

const NEW_SECTION = `    // Logged clients rows — with date-added and month grouping
    function _bankClientDate(c, rows, logged) {
      var dates = []
        .concat(rows.map(function(r){ return r.date || (r.createdAt ? r.createdAt.slice(0,10) : ''); }))
        .concat(logged.map(function(a){ return a.date || (a.createdAt ? a.createdAt.slice(0,10) : ''); }))
        .filter(Boolean)
        .sort();
      return dates[0] || c.createdAt || '';
    }
    function _fmtDate(ds) {
      if (!ds) return '';
      try {
        var d = new Date(ds + (ds.length === 10 ? 'T12:00:00' : ''));
        return d.toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' });
      } catch(e) { return ds; }
    }
    function _monthKey(ds) {
      if (!ds) return 'Unknown';
      try {
        var d = new Date(ds + (ds.length === 10 ? 'T12:00:00' : ''));
        return d.toLocaleDateString('en-US', { month:'long', year:'numeric' });
      } catch(e) { return 'Unknown'; }
    }
    function _monthSort(key) {
      if (key === 'Unknown') return 0;
      try { return new Date(key).getTime(); } catch(e) { return 0; }
    }

    // Build enriched client data with dates
    var enrichedClients = clientsAtBank.map(function(c) {
      var d = getDashData(c.id);
      var cr = getCreditData(c.id);
      var ob = getOnboardDataForClient(c.id) || {};
      var rows = (d.fundingRows||[]).filter(function(r){ return r.bank===bankName; });
      var logged = getBankApps(c.id).filter(function(a){ return a.bank===bankName; });
      var dateAdded = _bankClientDate(c, rows, logged);
      var chips = [].concat(
        rows.map(function(r){ var cls=r.status==='approved'?'approved':r.status==='denied'?'denied':r.status==='applied'?'applied':'pending'; return '<span class="bnk-app-chip '+cls+'">'+(r.card||r.bank)+(r.amount?' · $'+Number(r.amount).toLocaleString():'')+' <span style="opacity:.6;font-size:10px">'+_fmtDate(r.date)+'</span></span>'; }),
        logged.map(function(a){ var cls=a.outcome==='approved'?'approved':a.outcome==='denied'?'denied':'pending'; return '<span class="bnk-app-chip '+cls+'">'+a.outcome+(a.amount?' · $'+Number(a.amount).toLocaleString():'')+' <span style="opacity:.6;font-size:10px">'+_fmtDate(a.date)+'</span></span>'; })
      ).join('');
      return { c:c, d:d, ob:ob, cr:cr, rows:rows, logged:logged, dateAdded:dateAdded, chips:chips, fico:cr?.fico||d.creditScore||c.fico||'—' };
    });

    // Group by month
    var monthMap = {};
    enrichedClients.forEach(function(e) {
      var mk = _monthKey(e.dateAdded);
      if (!monthMap[mk]) monthMap[mk] = [];
      monthMap[mk].push(e);
    });
    var monthKeys = Object.keys(monthMap).sort(function(a,b){ return _monthSort(b) - _monthSort(a); });

    function _buildClientRow(e) {
      var bn = bankName.replace(/'/g,"\\'");
      return '<div class="bnk-client-row">'
        + '<div class="bnk-cli-avatar" style="background:'+(e.c.color||'var(--blue)')+'">'+((e.c.fname||'?')[0])+((e.c.lname||'')[0])+'</div>'
        + '<div style="min-width:0">'
        + '<div class="bnk-cli-name">'+e.c.fname+' '+e.c.lname+'</div>'
        + '<div class="bnk-cli-meta">'
        + '<span>FICO '+e.fico+'</span>'
        + (e.ob.annualIncome ? '<span>'+e.ob.annualIncome+'/yr</span>' : '')
        + (e.c.state||e.ob.state ? '<span>'+(e.c.state||e.ob.state)+'</span>' : '')
        + (e.dateAdded ? '<span class="bnk-cli-date"><svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>Added '+_fmtDate(e.dateAdded)+'</span>' : '')
        + '</div>'
        + '<div class="bnk-apps-row">'+(e.chips||'<span style="font-size:12px;color:var(--gray-400)">No applications logged</span>')+'</div>'
        + '</div>'
        + '<div class="bnk-cli-actions">'
        + '<button class="bac-btn" onclick="bnkPickClient(\''+bn+'\',\''+e.c.id+'\')">Edit / Add App</button>'
        + '<button class="bac-btn danger" onclick="removeClientFromBank(\''+bn+'\',\''+e.c.id+'\')" style="margin-left:6px">Remove</button>'
        + '</div>'
        + '</div>';
    }

    var clientRows = monthKeys.map(function(mk) {
      var group = monthMap[mk];
      return '<div class="bnk-month-group">'
        + '<div class="bnk-month-label">'+mk+' <span class="bnk-month-count">'+group.length+' client'+(group.length>1?'s':'')+'</span></div>'
        + '<div class="bnk-client-list">'+group.map(_buildClientRow).join('')+'</div>'
        + '</div>';
    }).join('');`;

const is = html.indexOf(OLD_SECTION);
if (is === -1) { console.error('client rows section not found'); process.exit(1); }
html = html.slice(0, is) + NEW_SECTION + html.slice(is + OLD_SECTION.length);
console.log('2. Client rows section updated at', is);

// ── 3. Update Previously Logged header to remove the outer div wrapping ──
const OLD_LOGGED = '      ${clientsAtBank.length > 0 ? `\r\n      <div style="font-family:var(--font-h);font-size:13px;font-weight:800;color:var(--gray-500);letter-spacing:0.04em;text-transform:uppercase;margin-bottom:10px">Previously Logged</div>\r\n      <div class="bnk-client-list">${clientRows}</div>` : \'\'}';
const NEW_LOGGED = '      ${clientsAtBank.length > 0 ? `\n      <div style="font-family:var(--font-h);font-size:15px;font-weight:800;color:var(--navy);letter-spacing:-0.01em;margin-bottom:16px;margin-top:4px;display:flex;align-items:center;gap:10px">Logged Clients <span style=\\"font-family:var(--font-b);font-size:12px;font-weight:600;color:var(--gray-400);background:var(--gray-100);padding:3px 9px;border-radius:20px\\">${clientsAtBank.length}</span></div>\n      ${clientRows}` : \'\'}';

const il = html.indexOf(OLD_LOGGED);
if (il === -1) {
  console.log('Previously Logged header not found — checking alt...');
  const alt = html.indexOf('Previously Logged');
  console.log('Previously Logged at:', alt);
  console.log(JSON.stringify(html.slice(alt-10, alt+200)));
} else {
  html = html.slice(0, il) + NEW_LOGGED + html.slice(il + OLD_LOGGED.length);
  console.log('3. Previously Logged header updated at', il);
}

fs.writeFileSync(__dirname + '/admin.html', html, 'utf8');
console.log('Done. Size:', html.length);
