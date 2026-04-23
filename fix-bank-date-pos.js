// fix-bank-date-pos.js — node fix-bank-date-pos.js
// Moves date from meta line to bottom-right of client card
const fs = require('fs');
let html = fs.readFileSync(__dirname + '/admin.html', 'utf8');

// Step 1: remove dateTag from meta line
const A = "stateTag + dateTag + '</div>'";
const B = "stateTag + '</div>'";
let idx = html.indexOf(A);
if (idx === -1) { console.error('step1 not found'); process.exit(1); }
html = html.slice(0, idx) + B + html.slice(idx + A.length);
console.log('1. dateTag removed from meta at', idx);

// Step 2: change actions div to column layout
const C = '\'<div class="bnk-cli-actions">\'';
const D = '\'<div class="bnk-cli-actions" style="flex-direction:column;align-items:flex-end;gap:5px">\'';
idx = html.indexOf(C);
if (idx === -1) { console.error('step2 not found'); process.exit(1); }
html = html.slice(0, idx) + D + html.slice(idx + C.length);
console.log('2. actions column layout at', idx);

// Step 3: add date label after the Remove button line
// Find the Remove button line - look for a unique anchor
const REMOVE_ANCHOR = 'style="margin-left:6px">Remove</button>\'';
idx = html.indexOf(REMOVE_ANCHOR);
if (idx === -1) { console.error('step3 anchor not found'); process.exit(1); }
// Insert after the closing quote of this line, before the next line
const insertAt = idx + REMOVE_ANCHOR.length;
const DATE_LINE = "\r\n          + (e.dateAdded ? '<div style=\"font-size:11px;font-weight:600;color:var(--gray-400)\">' + _fmtDateBnk(e.dateAdded) + '</div>' : '')";
html = html.slice(0, insertAt) + DATE_LINE + html.slice(insertAt);
console.log('3. date line added after Remove at', insertAt);

// Verify syntax
const s = html.indexOf('function showBankDetail(bankName)');
const e = html.indexOf('\n  function bnkSearchClients', s);
try { new Function(html.slice(s, e)); console.log('SYNTAX OK'); }
catch (err) { console.error('SYNTAX ERROR:', err.message); process.exit(1); }

fs.writeFileSync(__dirname + '/admin.html', html, 'utf8');
console.log('Done. Size:', html.length);
