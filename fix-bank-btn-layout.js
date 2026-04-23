// fix-bank-btn-layout.js — node fix-bank-btn-layout.js
// Fixes: buttons side-by-side, date shown in styled box below them
const fs = require('fs');
let html = fs.readFileSync(__dirname + '/admin.html', 'utf8');

// Step 1: change actions div to column so buttons stay in a row at top, date below
const OLD_A = '\'<div class="bnk-cli-actions" style="flex-direction:column;align-items:flex-end;gap:5px">\'';
const NEW_A = '\'<div class="bnk-cli-actions" style="display:flex;flex-direction:column;align-items:flex-end;gap:8px">\'';
let idx = html.indexOf(OLD_A);
if (idx === -1) { console.error('actions div not found'); process.exit(1); }
html = html.slice(0, idx) + NEW_A + html.slice(idx + OLD_A.length);
console.log('1. actions div updated at', idx);

// Step 2: remove margin-left:6px from Remove button (gap handles spacing)
const OLD_REM = '" style="margin-left:6px">Remove</button>\'';
const NEW_REM = '">Remove</button>\'';
idx = html.indexOf(OLD_REM);
if (idx === -1) { console.error('remove margin not found'); process.exit(1); }
html = html.slice(0, idx) + NEW_REM + html.slice(idx + OLD_REM.length);
console.log('2. Remove margin removed');

// Step 3: replace the plain date div with the styled dateTag box
const OLD_DATE = "+ (e.dateAdded ? '<div style=\"font-size:11px;font-weight:600;color:var(--gray-400)\">' + _fmtDateBnk(e.dateAdded) + '</div>' : '')";
const NEW_DATE = '+ dateTag';
idx = html.indexOf(OLD_DATE);
if (idx === -1) { console.error('date div not found'); process.exit(1); }
html = html.slice(0, idx) + NEW_DATE + html.slice(idx + OLD_DATE.length);
console.log('3. date replaced with styled dateTag at', idx);

// Verify syntax
const s = html.indexOf('function showBankDetail(bankName)');
const e = html.indexOf('\n  function bnkSearchClients', s);
try { new Function(html.slice(s, e)); console.log('SYNTAX OK'); }
catch (err) { console.error('SYNTAX ERROR:', err.message); process.exit(1); }

fs.writeFileSync(__dirname + '/admin.html', html, 'utf8');
console.log('Done. Size:', html.length);
