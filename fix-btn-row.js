// fix-btn-row.js — node fix-btn-row.js
// Puts Edit/Remove buttons side by side, keeps date box below
const fs = require('fs');
let html = fs.readFileSync(__dirname + '/admin.html', 'utf8');

// 1. Change gap:8px → gap:6px in actions div (cosmetic)
html = html.replace(
  'flex-direction:column;align-items:flex-end;gap:8px',
  'flex-direction:column;align-items:flex-end;gap:6px'
);
console.log('1. gap updated');

// 2. Insert opening flex-row wrapper right after the actions div opening tag
const AFTER_ACTIONS_OPEN = 'flex-direction:column;align-items:flex-end;gap:6px">\'';
const idx2 = html.indexOf(AFTER_ACTIONS_OPEN);
if (idx2 === -1) { console.error('step2 anchor not found'); process.exit(1); }
const insertPos2 = idx2 + AFTER_ACTIONS_OPEN.length;
const BTN_OPEN = "\r\n          + '<div style=\"display:flex;gap:6px\">'";
html = html.slice(0, insertPos2) + BTN_OPEN + html.slice(insertPos2);
console.log('2. flex-row wrapper opened at', insertPos2);

// 3. Insert closing </div> right before the dateTag line
const BEFORE_DATETAG = "\r\n          + dateTag";
const idx3 = html.indexOf(BEFORE_DATETAG);
if (idx3 === -1) { console.error('step3 anchor not found'); process.exit(1); }
const BTN_CLOSE = "\r\n          + '</div>'";
html = html.slice(0, idx3) + BTN_CLOSE + html.slice(idx3);
console.log('3. flex-row wrapper closed at', idx3);

// Verify syntax
const fnS = html.indexOf('function showBankDetail(bankName)');
const fnE = html.indexOf('\n  function bnkSearchClients', fnS);
try { new Function(html.slice(fnS, fnE)); console.log('SYNTAX OK'); }
catch (err) { console.error('SYNTAX ERROR:', err.message); process.exit(1); }

fs.writeFileSync(__dirname + '/admin.html', html, 'utf8');
console.log('Done. Size:', html.length);
