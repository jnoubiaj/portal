// fix-biz-date-shared.js — node fix-biz-date-shared.js
// Removes duplicate wiz-biz-opened from both sections, adds it as a shared
// always-visible field outside the conditional divs.
const fs = require('fs');
let html = fs.readFileSync(__dirname + '/admin.html', 'utf8');

// Remove date field from existing-fields section
const OLD_EX_DATE = "\r\n        + wizInput('wiz-biz-opened', 'Date Account Opened', '', wd.bizAcctOpened || '', 'date')\r\n        + '</div>'\r\n        + '<div id=\"wiz-biz-new-fields\"";
const NEW_EX_DATE = "\r\n        + '</div>'\r\n        + '<div id=\"wiz-biz-new-fields\"";
const i1 = html.indexOf(OLD_EX_DATE);
if (i1 === -1) { console.error('existing date not found'); process.exit(1); }
html = html.slice(0, i1) + NEW_EX_DATE + html.slice(i1 + OLD_EX_DATE.length);
console.log('1. Removed date from existing section at', i1);

// Replace date field in new-fields section closing + setTimeout with date outside + setTimeout
const OLD_NEW_DATE = "\r\n        + wizInput('wiz-biz-opened', 'Date Account Opened', '', wd.bizAcctOpened || '', 'date')\r\n        + '</div>';\r\n      setTimeout(function(){ wizToggleBizFields(wd.hasBizAccount||''); }, 10);";
const NEW_NEW_DATE = "\r\n        + '</div>'\r\n        + '<div class=\"wiz-grid\">'\r\n        + wizInput('wiz-biz-opened', 'Date Account Opened', '', wd.bizAcctOpened || '', 'date')\r\n        + '</div>';\r\n      setTimeout(function(){ wizToggleBizFields(wd.hasBizAccount||''); }, 10);";
const i2 = html.indexOf(OLD_NEW_DATE);
if (i2 === -1) { console.error('new date not found'); process.exit(1); }
html = html.slice(0, i2) + NEW_NEW_DATE + html.slice(i2 + OLD_NEW_DATE.length);
console.log('2. Date moved outside conditional sections at', i2);

// Verify syntax
const fnS = html.indexOf('<script>') + '<script>'.length;
const fnE = html.lastIndexOf('</script>');
try { new Function(html.slice(fnS, fnE)); console.log('SYNTAX OK'); }
catch (err) { console.error('SYNTAX ERROR:', err.message); process.exit(1); }

fs.writeFileSync(__dirname + '/admin.html', html, 'utf8');
console.log('Done. Size:', html.length);
