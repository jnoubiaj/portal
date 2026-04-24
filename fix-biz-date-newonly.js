// fix-biz-date-newonly.js — node fix-biz-date-newonly.js
// Date Account Opened only shows for "Opening New Account"
const fs = require('fs');
let html = fs.readFileSync(__dirname + '/admin.html', 'utf8');

// Move the shared date div back inside wiz-biz-new-fields
const OLD = "        + '</div>'\r\n        + '<div class=\"wiz-grid\">'\r\n        + wizInput('wiz-biz-opened', 'Date Account Opened', '', wd.bizAcctOpened || '', 'date')\r\n        + '</div>';\r\n      setTimeout(function(){ wizToggleBizFields(wd.hasBizAccount||''); }, 10);";

const NEW = "        + wizInput('wiz-biz-opened', 'Date Account Opened', '', wd.bizAcctOpened || '', 'date')\r\n        + '</div>';\r\n      setTimeout(function(){ wizToggleBizFields(wd.hasBizAccount||''); }, 10);";

const idx = html.indexOf(OLD);
if (idx === -1) { console.error('not found'); process.exit(1); }
html = html.slice(0, idx) + NEW + html.slice(idx + OLD.length);
console.log('Date moved into new-account section at', idx);

// Verify syntax
const fnS = html.indexOf('<script>') + '<script>'.length;
const fnE = html.lastIndexOf('</script>');
try { new Function(html.slice(fnS, fnE)); console.log('SYNTAX OK'); }
catch (err) { console.error('SYNTAX ERROR:', err.message); process.exit(1); }

fs.writeFileSync(__dirname + '/admin.html', html, 'utf8');
console.log('Done. Size:', html.length);
