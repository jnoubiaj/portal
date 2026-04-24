// fix-cc-all-cards.js — node fix-cc-all-cards.js
// Personal CC section: show ALL credit cards from report (remove bank filter)
// Business CC section: stays as its own separate dropdown section
const fs = require('fs');
let html = fs.readFileSync(__dirname + '/admin.html', 'utf8');

// 1. Remove bank-name filter — show all open credit cards from report
const OLD_FILTER = "      var _personalCCs = _allAccts.filter(function(a){\r\n        if (!a.isOpen) return false;\r\n        if (a.type !== 'Credit Card' && a.type !== 'Line of Credit') return false;\r\n        var aName = (a.name || '').toLowerCase();\r\n        return _bnkWords.some(function(wrd){ return aName.indexOf(wrd) !== -1; });\r\n      });";
const NEW_FILTER = "      var _personalCCs = _allAccts.filter(function(a){\r\n        if (!a.isOpen) return false;\r\n        return a.type === 'Credit Card' || a.type === 'Line of Credit';\r\n      });";
const i1 = html.indexOf(OLD_FILTER);
if (i1 === -1) { console.error('filter not found'); process.exit(1); }
html = html.slice(0, i1) + NEW_FILTER + html.slice(i1 + OLD_FILTER.length);
console.log('1. Bank filter removed');

// 2. Update section title from "Personal Credit Cards at [Bank] AUTO" to "Personal Credit Cards AUTO"
const OLD_TITLE = "'<div style=\"font-size:11px;font-weight:700;letter-spacing:.05em;color:var(--gray-500);text-transform:uppercase;margin-bottom:8px\">Personal Credit Cards at ' + w.bankName + ' <span class=\"wiz-autobadge\">AUTO</span></div>'";
const NEW_TITLE = "'<div style=\"font-size:11px;font-weight:700;letter-spacing:.05em;color:var(--gray-500);text-transform:uppercase;margin-bottom:8px\">Personal Credit Cards <span class=\"wiz-autobadge\">AUTO</span></div>'";
const i2 = html.indexOf(OLD_TITLE);
if (i2 === -1) { console.error('title not found'); process.exit(1); }
html = html.slice(0, i2) + NEW_TITLE + html.slice(i2 + OLD_TITLE.length);
console.log('2. Section title updated');

// 3. Update "no cards" message
const OLD_NO = "'<div style=\"font-size:12px;color:var(--gray-400);font-style:italic;padding:8px 0\">No ' + w.bankName + ' credit cards found in credit report</div>'";
const NEW_NO = "'<div style=\"font-size:12px;color:var(--gray-400);font-style:italic;padding:8px 0\">No credit cards found in credit report</div>'";
const i3 = html.indexOf(OLD_NO);
if (i3 === -1) { console.error('no-cards msg not found'); process.exit(1); }
html = html.slice(0, i3) + NEW_NO + html.slice(i3 + OLD_NO.length);
console.log('3. No-cards message updated');

// Verify syntax
const fnS = html.indexOf('<script>') + '<script>'.length;
const fnE = html.lastIndexOf('</script>');
try { new Function(html.slice(fnS, fnE)); console.log('SYNTAX OK'); }
catch (err) { console.error('SYNTAX ERROR:', err.message); process.exit(1); }

fs.writeFileSync(__dirname + '/admin.html', html, 'utf8');
console.log('Done. Size:', html.length);
