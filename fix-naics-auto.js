// fix-naics-auto.js — node fix-naics-auto.js
// Adds auto NAICS code field next to Employees, wired to industry dropdown
const fs = require('fs');
let html = fs.readFileSync(__dirname + '/admin.html', 'utf8');

// 1. Add NAICS display field next to Employees in the grid
const OLD_EMP = "+ wizInput('wiz-employees', 'Employees', 'e.g. 5', wd.employees || ob.employees || '', 'text')\r\n        + '</div>'";
const NEW_EMP = "+ wizInput('wiz-employees', 'Employees', 'e.g. 5', wd.employees || ob.employees || '', 'text')\r\n        + (function(){ var _naics = (wd.industry || ob.industry || '').split(' | ')[1] || ''; return '<div class=\"wiz-field auto\"><div class=\"wiz-field-label\">NAICS Code <span class=\"wiz-autobadge\">AUTO</span></div><div id=\"wiz-naics-display\" class=\"wiz-field-val\" style=\"font-size:15px;font-weight:700;color:var(--navy);letter-spacing:0.04em\">' + (_naics || '—') + '</div></div>'; })()\r\n        + '</div>'";

const i1 = html.indexOf(OLD_EMP);
if (i1 === -1) { console.error('employees field not found'); process.exit(1); }
html = html.slice(0, i1) + NEW_EMP + html.slice(i1 + OLD_EMP.length);
console.log('1. NAICS display field added');

// 2. Wire industry onchange to also update the NAICS display
const OLD_INDUSTRY_SEL = "wizSelect('wiz-industry', 'Industry / NAICS Code', [";
const idx2 = html.indexOf(OLD_INDUSTRY_SEL);
if (idx2 === -1) { console.error('industry select not found'); process.exit(1); }
// Find the closing of this wizSelect call — it ends with ], wd.industry || ob.industry || '')
const OLD_INDUSTRY_END = "], wd.industry || ob.industry || '')";
const idx2e = html.indexOf(OLD_INDUSTRY_END, idx2);
if (idx2e === -1) { console.error('industry select end not found'); process.exit(1); }
const NEW_INDUSTRY_END = "], wd.industry || ob.industry || '', 'wizUpdateNaics(this.value)')";
html = html.slice(0, idx2e) + NEW_INDUSTRY_END + html.slice(idx2e + OLD_INDUSTRY_END.length);
console.log('2. Industry onchange wired');

// 3. Add wizUpdateNaics helper function before wizSaveCurrentFields
const INSERT_BEFORE = 'function wizSaveCurrentFields()';
const idx3 = html.indexOf(INSERT_BEFORE);
if (idx3 === -1) { console.error('wizSaveCurrentFields not found'); process.exit(1); }
const NAICS_FN = "function wizUpdateNaics(val) {\r\n    var el = document.getElementById('wiz-naics-display');\r\n    if (!el) return;\r\n    var code = val ? val.split(' | ')[1] : '';\r\n    el.textContent = code || '—';\r\n  }\r\n  ";
html = html.slice(0, idx3) + NAICS_FN + html.slice(idx3);
console.log('3. wizUpdateNaics helper added');

// Verify syntax
const fnS = html.indexOf('<script>') + '<script>'.length;
const fnE = html.lastIndexOf('</script>');
try { new Function(html.slice(fnS, fnE)); console.log('SYNTAX OK'); }
catch (err) { console.error('SYNTAX ERROR:', err.message); process.exit(1); }

fs.writeFileSync(__dirname + '/admin.html', html, 'utf8');
console.log('Done. Size:', html.length);
