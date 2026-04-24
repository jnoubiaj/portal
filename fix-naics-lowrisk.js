// fix-naics-lowrisk.js — node fix-naics-lowrisk.js
// Replaces high-risk NAICS codes with bank-preferred low-risk alternatives
const fs = require('fs');
let html = fs.readFileSync(__dirname + '/admin.html', 'utf8');

// Map of exact replacements: [oldStr, newStr]
// Each pair appears in both the wizSelect options AND the wizMatchIndustry opts array
const replacements = [
  // Catering: 722330 (Mobile Food Services - food trucks) → 722320 (Caterers - proper, lower risk)
  ["'Catering | 722330'",                   "'Catering | 722320'"],
  ["{ value: 'Catering | 722330', label: 'Catering — 722330' }",
   "{ value: 'Catering | 722320', label: 'Catering — 722320' }"],

  // Food Manufacturing: 311991 (Perishable Prepared Food - HIGH RISK) → 311812 (Commercial Bakeries - staple, lower risk)
  ["'Food Manufacturing | 311991'",         "'Food Manufacturing | 311812'"],
  ["{ value: 'Food Manufacturing | 311991', label: 'Food Manufacturing — 311991' }",
   "{ value: 'Food Manufacturing | 311812', label: 'Food Manufacturing — 311812' }"],

  // Healthcare: 621211 (Dentists only) → 621111 (Offices of Physicians - general, banks' preferred medical)
  ["'Healthcare / Medical | 621211'",       "'Healthcare / Medical | 621111'"],
  ["{ value: 'Healthcare / Medical | 621211', label: 'Healthcare / Medical — 621211' }",
   "{ value: 'Healthcare / Medical | 621111', label: 'Healthcare / Medical — 621111' }"],

  // Import / Export: 419120 (INVALID - Canadian code) → 425120 (Wholesale Trade Agents & Brokers - proper US code, low risk)
  ["'Import / Export | 419120'",            "'Import / Export | 425120'"],
  ["{ value: 'Import / Export | 419120', label: 'Import / Export — 419120' }",
   "{ value: 'Import / Export | 425120', label: 'Import / Export — 425120' }"],

  // Manufacturing (general): 311991 (food/perishable) → 339999 (Miscellaneous Manufacturing - non-food, lower risk)
  ["'Manufacturing | 311991'",              "'Manufacturing | 339999'"],
  ["{ value: 'Manufacturing | 311991', label: 'Manufacturing (Specialty Food) — 311991' }",
   "{ value: 'Manufacturing | 339999', label: 'Manufacturing — 339999' }"],

  // Real Estate: 531311 (same as Property Management) → 531210 (Offices of Real Estate Agents & Brokers - lower risk than landlords)
  // Only replace the Real Estate one, not Property Management
  ["{ value: 'Real Estate | 531311', label: 'Real Estate — 531311' }",
   "{ value: 'Real Estate | 531210', label: 'Real Estate — 531210' }"],

  // Staffing: 561320 (Temporary Help - high payroll liability) → 561311 (Employment Placement - lower risk)
  ["'Staffing Agency | 561320'",            "'Staffing Agency | 561311'"],
  ["{ value: 'Staffing Agency | 561320', label: 'Staffing / Temp Agency — 561320' }",
   "{ value: 'Staffing Agency | 561311', label: 'Staffing Agency — 561311' }"],
];

// Also fix Real Estate in the opts array (only one occurrence after Property Management)
// We need to handle this carefully since both have 531311
const OLD_RE_OPTS = "'Real Estate | 531311'";
const NEW_RE_OPTS = "'Real Estate | 531210'";
// Find the second occurrence (first is Property Management)
const first = html.indexOf("'Property Management | 531311'");
const second = html.indexOf(OLD_RE_OPTS, first + 1);
if (second !== -1) {
  html = html.slice(0, second) + NEW_RE_OPTS + html.slice(second + OLD_RE_OPTS.length);
  console.log('Real Estate opts array updated');
} else {
  console.log('Real Estate opts: no second occurrence found (may already be different)');
}

let count = 0;
for (const [oldStr, newStr] of replacements) {
  const idx = html.indexOf(oldStr);
  if (idx === -1) {
    console.warn('NOT FOUND:', oldStr.slice(0, 60));
    continue;
  }
  html = html.slice(0, idx) + newStr + html.slice(idx + oldStr.length);
  count++;
  console.log('Fixed:', oldStr.slice(0, 50));
}
console.log(count + ' replacements made');

// Verify syntax
const fnS = html.indexOf('<script>') + '<script>'.length;
const fnE = html.lastIndexOf('</script>');
try { new Function(html.slice(fnS, fnE)); console.log('SYNTAX OK'); }
catch (err) { console.error('SYNTAX ERROR:', err.message); process.exit(1); }

fs.writeFileSync(__dirname + '/admin.html', html, 'utf8');
console.log('Done. Size:', html.length);
