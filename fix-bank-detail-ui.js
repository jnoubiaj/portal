// fix-bank-detail-ui.js — node fix-bank-detail-ui.js
// Redesigns bank detail: month grouping, date-added badge, 5-col KPI row
const fs = require('fs');
let html = fs.readFileSync(__dirname + '/admin.html', 'utf8');

// ── 1. KPI row: 4 cols → 5 cols ──────────────────────────────────────────
const OLD_KPI_CSS = '.bnk-kpi-row { display:grid; grid-template-columns:repeat(4,1fr); gap:14px; margin-bottom:24px; }';
const NEW_KPI_CSS = '.bnk-kpi-row { display:grid; grid-template-columns:repeat(5,1fr); gap:12px; margin-bottom:24px; }';
const ik = html.indexOf(OLD_KPI_CSS);
if (ik === -1) { console.error('KPI CSS not found'); process.exit(1); }
html = html.slice(0, ik) + NEW_KPI_CSS + html.slice(ik + OLD_KPI_CSS.length);
console.log('1. KPI row updated');

// ── 2. Add CSS for month headers + improved client rows ───────────────────
const OLD_CLI_CSS = '    /* Client rows in bank detail */\r\n    .bnk-client-list { display:flex; flex-direction:column; gap:10px; }';
const NEW_CLI_CSS = '    /* Client rows in bank detail */\r\n    .bnk-month-group { margin-bottom:24px; }\r\n    .bnk-month-label { display:flex; align-items:center; gap:10px; font-family:var(--font-h); font-size:11px; font-weight:800; color:var(--gray-400); text-transform:uppercase; letter-spacing:0.07em; margin-bottom:10px; }\r\n    .bnk-month-label::after { content:\'\'; flex:1; height:1px; background:var(--gray-100); }\r\n    .bnk-month-count { background:var(--gray-100); color:var(--gray-500); font-size:10px; font-weight:700; padding:2px 7px; border-radius:20px; }\r\n    .bnk-cli-date { display:inline-flex; align-items:center; gap:4px; font-size:11px; font-weight:600; color:var(--gray-400); background:var(--gray-50); border:1px solid var(--gray-100); border-radius:6px; padding:2px 7px; }\r\n    .bnk-client-list { display:flex; flex-direction:column; gap:10px; }';
const ic = html.indexOf(OLD_CLI_CSS);
if (ic === -1) { console.error('Client CSS not found'); process.exit(1); }
html = html.slice(0, ic) + NEW_CLI_CSS + html.slice(ic + OLD_CLI_CSS.length);
console.log('2. CSS updated');

// ── 3. Rewrite the showBankDetail function body ────────────────────────────
// We'll replace from "// Logged clients rows" to the end of clientRows.join('')
const OLD_ROWS_START = '    // Logged clients rows\r\n    const clientRows = clientsAtBank.map(c => {';
const OLD_ROWS_END   = "    }).join('');\r\n\r\n    el.innerHTML";
const rs = html.indexOf(OLD_ROWS_START);
const re = html.indexOf(OLD_ROWS_END, rs);
if (rs === -1 || re === -1) { console.error('clientRows block not found', rs, re); process.exit(1); }

// Build the replacement — using only single-quoted strings, no template literals,
// so there are zero escaping ambiguities.
const NEW_ROWS = [
  '    // Logged clients rows — grouped by month with date-added',
  '    var _fmtDateBnk = function(ds) {',
  "      if (!ds) return '';",
  "      try { var d = new Date(ds + (ds.length === 10 ? 'T12:00:00' : '')); return d.toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' }); } catch(x) { return ds; }",
  '    };',
  '    var _monthKeyBnk = function(ds) {',
  "      if (!ds) return 'Unknown';",
  "      try { var d = new Date(ds + (ds.length === 10 ? 'T12:00:00' : '')); return d.toLocaleDateString('en-US', { month:'long', year:'numeric' }); } catch(x) { return 'Unknown'; }",
  '    };',
  '    var enrichedBnk = clientsAtBank.map(function(c) {',
  '      var d = getDashData(c.id);',
  '      var cr = getCreditData(c.id);',
  '      var ob = getOnboardDataForClient(c.id) || {};',
  '      var rows = (d.fundingRows||[]).filter(function(r){ return r.bank===bankName; });',
  '      var logged = getBankApps(c.id).filter(function(a){ return a.bank===bankName; });',
  '      var allDates = [].concat(',
  "        rows.map(function(r){ return r.date || (r.createdAt ? r.createdAt.slice(0,10) : ''); }),",
  "        logged.map(function(a){ return a.date || (a.createdAt ? a.createdAt.slice(0,10) : ''); })",
  "      ).filter(Boolean).sort();",
  "      var dateAdded = allDates[0] || c.createdAt || '';",
  '      var chips = [].concat(',
  "        rows.map(function(r){",
  "          var cls = r.status==='approved' ? 'approved' : r.status==='denied' ? 'denied' : r.status==='applied' ? 'applied' : 'pending';",
  "          return '<span class=\"bnk-app-chip ' + cls + '\">' + (r.card||r.bank) + (r.amount ? ' · $' + Number(r.amount).toLocaleString() : '') + '</span>';",
  '        }),',
  "        logged.map(function(a){",
  "          var cls = a.outcome==='approved' ? 'approved' : a.outcome==='denied' ? 'denied' : 'pending';",
  "          return '<span class=\"bnk-app-chip ' + cls + '\">' + a.outcome + (a.amount ? ' · $' + Number(a.amount).toLocaleString() : '') + '</span>';",
  '        })',
  "      ).join('');",
  "      var fico = (cr && cr.fico) ? cr.fico : (d.creditScore || c.fico || '—');",
  "      return { c:c, d:d, ob:ob, cr:cr, rows:rows, logged:logged, dateAdded:dateAdded, chips:chips, fico:fico };",
  '    });',
  '    var monthMapBnk = {};',
  '    enrichedBnk.forEach(function(e) {',
  '      var mk = _monthKeyBnk(e.dateAdded);',
  '      if (!monthMapBnk[mk]) monthMapBnk[mk] = [];',
  '      monthMapBnk[mk].push(e);',
  '    });',
  '    var monthKeysBnk = Object.keys(monthMapBnk).sort(function(a,b) {',
  "      var ta = (a === 'Unknown') ? 0 : (new Date(a).getTime() || 0);",
  "      var tb = (b === 'Unknown') ? 0 : (new Date(b).getTime() || 0);",
  '      return tb - ta;',
  '    });',
  '    var bnkSafe = bankName.replace(/\'/g, "\\\\\'");',
  "    var clientRows = monthKeysBnk.map(function(mk) {",
  '      var group = monthMapBnk[mk];',
  "      var rows2 = group.map(function(e) {",
  "        var calIcon = '<svg width=\"11\" height=\"11\" fill=\"none\" viewBox=\"0 0 24 24\" stroke=\"currentColor\" stroke-width=\"2\"><rect x=\"3\" y=\"4\" width=\"18\" height=\"18\" rx=\"2\"/><line x1=\"16\" y1=\"2\" x2=\"16\" y2=\"6\"/><line x1=\"8\" y1=\"2\" x2=\"8\" y2=\"6\"/><line x1=\"3\" y1=\"10\" x2=\"21\" y2=\"10\"/></svg>';",
  "        var dateTag = e.dateAdded ? '<span class=\"bnk-cli-date\">' + calIcon + 'Added ' + _fmtDateBnk(e.dateAdded) + '</span>' : '';",
  "        var incomeTag = e.ob.annualIncome ? '<span>' + e.ob.annualIncome + '/yr</span>' : '';",
  "        var stateTag  = (e.c.state || e.ob.state) ? '<span>' + (e.c.state || e.ob.state) + '</span>' : '';",
  "        var noApps = '<span style=\"font-size:12px;color:var(--gray-400)\">No applications logged</span>';",
  "        return '<div class=\"bnk-client-row\">'",
  "          + '<div class=\"bnk-cli-avatar\" style=\"background:' + (e.c.color || 'var(--blue)') + '\">' + (e.c.fname||'?')[0] + (e.c.lname||'')[0] + '</div>'",
  "          + '<div style=\"min-width:0\">'",
  "          + '<div class=\"bnk-cli-name\">' + e.c.fname + ' ' + e.c.lname + '</div>'",
  "          + '<div class=\"bnk-cli-meta\"><span>FICO ' + e.fico + '</span>' + incomeTag + stateTag + dateTag + '</div>'",
  "          + '<div class=\"bnk-apps-row\">' + (e.chips || noApps) + '</div>'",
  "          + '</div>'",
  "          + '<div class=\"bnk-cli-actions\">'",
  "          + '<button class=\"bac-btn\" onclick=\"bnkPickClient(\\'' + bnkSafe + '\\',\\'' + e.c.id + '\\')\">Edit / Add App</button>'",
  "          + '<button class=\"bac-btn danger\" onclick=\"removeClientFromBank(\\'' + bnkSafe + '\\',\\'' + e.c.id + '\\')\" style=\"margin-left:6px\">Remove</button>'",
  "          + '</div>'",
  "          + '</div>';",
  '      });',
  "      var cnt = group.length + ' client' + (group.length > 1 ? 's' : '');",
  "      return '<div class=\"bnk-month-group\">'",
  "        + '<div class=\"bnk-month-label\">' + mk + ' <span class=\"bnk-month-count\">' + cnt + '</span></div>'",
  "        + '<div class=\"bnk-client-list\">' + rows2.join('') + '</div>'",
  "        + '</div>';",
  '    }).join(\'\');'
].join('\r\n');

html = html.slice(0, rs) + NEW_ROWS + html.slice(re + '    }).join(\'\');\r\n\r\n    el.innerHTML'.length - '    el.innerHTML'.length);

// Verify the join was done right — find where el.innerHTML now starts
const elIdx = html.indexOf('    el.innerHTML', rs);
if (elIdx === -1) { console.error('el.innerHTML not found after replacement'); process.exit(1); }
console.log('3. clientRows replaced, el.innerHTML at', elIdx);

// ── 4. Fix Previously Logged label + wrap ─────────────────────────────────
const OLD_LOG_HDR = '      <div style="font-family:var(--font-h);font-size:13px;font-weight:800;color:var(--gray-500);letter-spacing:0.04em;text-transform:uppercase;margin-bottom:10px">Previously Logged</div>\r\n      <div class="bnk-client-list">${clientRows}</div>';
const NEW_LOG_HDR = '      <div style="font-family:var(--font-h);font-size:15px;font-weight:800;color:var(--navy);letter-spacing:-0.01em;margin-bottom:14px;display:flex;align-items:center;gap:8px">Logged Clients <span style=\\"font-size:12px;font-weight:600;color:var(--gray-400);background:var(--gray-100);padding:2px 8px;border-radius:20px\\">${clientsAtBank.length}</span></div>\r\n      ${clientRows}';
const il = html.indexOf(OLD_LOG_HDR);
if (il === -1) { console.error('Previously Logged header not found'); process.exit(1); }
html = html.slice(0, il) + NEW_LOG_HDR + html.slice(il + OLD_LOG_HDR.length);
console.log('4. Section header updated');

fs.writeFileSync(__dirname + '/admin.html', html, 'utf8');
console.log('Done. Size:', html.length);
