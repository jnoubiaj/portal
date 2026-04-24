// fix-biz-account-type.js — node fix-biz-account-type.js
// Business Banking step: conditional fields based on existing vs new account
const fs = require('fs');
let html = fs.readFileSync(__dirname + '/admin.html', 'utf8');

// ── 1. Replace the Business Banking step render block ─────────────────────
const OLD_STEP = "// ── STEP 4: Business Banking\r\n      body = '<div class=\"wiz-grid\">'\r\n        + wizSelect('wiz-has-biz', 'Has Business Account?', [\r\n            { value: '', label: '— Select —' },\r\n            { value: 'yes', label: 'Yes' },\r\n            { value: 'no',  label: 'No'  }\r\n          ], wd.hasBizAccount || '', 'wizToggleBizFields(this.value)')\r\n        + '<div class=\"wiz-field\"><label class=\"wiz-field-label\">How Long (Business Account)</label><div style=\"display:flex;gap:8px\"><input class=\"wiz-input\" id=\"wiz-biz-yrs\" type=\"number\" min=\"0\" placeholder=\"Years\" value=\"' + (wd.bizAcctYrs || '') + '\" style=\"width:50%\"><input class=\"wiz-input\" id=\"wiz-biz-mos\" type=\"number\" min=\"0\" max=\"11\" placeholder=\"Months\" value=\"' + (wd.bizAcctMos || '') + '\" style=\"width:50%\"></div></div>'\r\n        + wizInput('wiz-biz-balance', 'Avg Monthly Business Balance ($)', 'e.g. 10,000', wd.bizBalance || '', 'text', 'wizFormatDollar(this)')\r\n        + wizInput('wiz-biz-deposit', 'Amount Deposited ($)', 'e.g. 5,000', wd.bizDeposit || '', 'text', 'wizFormatDollar(this)')\r\n        + wizSelect('wiz-biz-acct-type', 'Account Type at ' + w.bankName, [\r\n            { value: '', label: '— Select —' },\r\n            { value: 'Business Checking', label: 'Business Checking' },\r\n            { value: 'Business Savings',  label: 'Business Savings'  },\r\n            { value: 'Business Money Market', label: 'Business Money Market' },\r\n            { value: 'Business Premium Checking', label: 'Business Premium Checking' },\r\n            { value: 'Business Interest Checking', label: 'Business Interest Checking' }\r\n          ], wd.bizAcctType || '')\r\n        + '</div>';\r\n      setTimeout(function(){ wizToggleBizFields(wd.hasBizAccount||''); }, 10);";

const NEW_STEP = "// ── STEP 4: Business Banking\r\n      body = '<div class=\"wiz-grid\">'\r\n        + wizSelect('wiz-has-biz', 'Business Account Status', [\r\n            { value: '',        label: '— Select —' },\r\n            { value: 'existing', label: 'Has Existing Account' },\r\n            { value: 'new',      label: 'Opening New Account' }\r\n          ], wd.hasBizAccount || '', 'wizToggleBizFields(this.value)')\r\n        + wizSelect('wiz-biz-acct-type', 'Account Type at ' + w.bankName, [\r\n            { value: '', label: '— Select —' },\r\n            { value: 'Business Checking', label: 'Business Checking' },\r\n            { value: 'Business Savings',  label: 'Business Savings'  },\r\n            { value: 'Business Money Market', label: 'Business Money Market' },\r\n            { value: 'Business Premium Checking', label: 'Business Premium Checking' },\r\n            { value: 'Business Interest Checking', label: 'Business Interest Checking' }\r\n          ], wd.bizAcctType || '')\r\n        + '</div>'\r\n        + '<div id=\"wiz-biz-existing-fields\" class=\"wiz-grid\">'\r\n        + '<div class=\"wiz-field\"><label class=\"wiz-field-label\">How Long (Business Account)</label><div style=\"display:flex;gap:8px\"><input class=\"wiz-input\" id=\"wiz-biz-yrs\" type=\"number\" min=\"0\" placeholder=\"Years\" value=\"' + (wd.bizAcctYrs || '') + '\" style=\"width:50%\"><input class=\"wiz-input\" id=\"wiz-biz-mos\" type=\"number\" min=\"0\" max=\"11\" placeholder=\"Months\" value=\"' + (wd.bizAcctMos || '') + '\" style=\"width:50%\"></div></div>'\r\n        + wizInput('wiz-biz-balance', 'Avg Monthly Business Balance ($)', 'e.g. 10,000', wd.bizBalance || '', 'text', 'wizFormatDollar(this)')\r\n        + '</div>'\r\n        + '<div id=\"wiz-biz-new-fields\" class=\"wiz-grid\">'\r\n        + wizInput('wiz-biz-deposit', 'Amount Deposited ($)', 'e.g. 5,000', wd.bizDeposit || '', 'text', 'wizFormatDollar(this)')\r\n        + '</div>';\r\n      setTimeout(function(){ wizToggleBizFields(wd.hasBizAccount||''); }, 10);";

const i1 = html.indexOf(OLD_STEP);
if (i1 === -1) { console.error('Business Banking step not found'); process.exit(1); }
html = html.slice(0, i1) + NEW_STEP + html.slice(i1 + OLD_STEP.length);
console.log('1. Business Banking step updated at', i1);

// ── 2. Replace wizToggleBizFields to handle existing/new ─────────────────
const OLD_TOGGLE = "function wizToggleBizFields(val) {\r\n    var disabled = val === 'no';\r\n    ['wiz-biz-yrs','wiz-biz-mos','wiz-biz-balance','wiz-biz-rev'].forEach(function(id){\r\n      var el = document.getElementById(id);\r\n      if (!el) return;\r\n      el.disabled = disabled;\r\n      el.style.opacity = disabled ? '0.35' : '1';\r\n      el.style.pointerEvents = disabled ? 'none' : '';\r\n      if (disabled) el.value = '';";

// Find full function end
const toggleStart = html.indexOf(OLD_TOGGLE);
if (toggleStart === -1) { console.error('wizToggleBizFields not found'); process.exit(1); }
const toggleEnd = html.indexOf('\n  }', toggleStart) + '\n  }'.length;

const NEW_TOGGLE = "function wizToggleBizFields(val) {\r\n    var existingEl = document.getElementById('wiz-biz-existing-fields');\r\n    var newEl      = document.getElementById('wiz-biz-new-fields');\r\n    if (existingEl) existingEl.style.display = (val === 'existing') ? '' : 'none';\r\n    if (newEl)      newEl.style.display      = (val === 'new')      ? '' : 'none';\r\n    // Clear hidden fields\r\n    if (val !== 'existing') {\r\n      ['wiz-biz-yrs','wiz-biz-mos','wiz-biz-balance'].forEach(function(id){\r\n        var el = document.getElementById(id); if (el) el.value = '';\r\n      });\r\n    }\r\n    if (val !== 'new') {\r\n      var dep = document.getElementById('wiz-biz-deposit'); if (dep) dep.value = '';\r\n    }\r\n  }";

html = html.slice(0, toggleStart) + NEW_TOGGLE + html.slice(toggleEnd);
console.log('2. wizToggleBizFields updated');

// ── 3. Verify syntax ──────────────────────────────────────────────────────
const scriptStart = html.indexOf('<script>') + '<script>'.length;
const scriptEnd   = html.lastIndexOf('</script>');
try { new Function(html.slice(scriptStart, scriptEnd)); console.log('SYNTAX OK'); }
catch (err) { console.error('SYNTAX ERROR:', err.message); process.exit(1); }

fs.writeFileSync(__dirname + '/admin.html', html, 'utf8');
console.log('Done. Size:', html.length);
