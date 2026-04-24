// fix-industry-automatch.js — node fix-industry-automatch.js
// Adds wizMatchIndustry() fuzzy-match so ob.industry auto-selects the dropdown option
const fs = require('fs');
let html = fs.readFileSync(__dirname + '/admin.html', 'utf8');

// 1. Replace prefill in wizSelect to use wizMatchIndustry()
const OLD_PREFILL = "], wd.industry || ob.industry || '', 'wizUpdateNaics(this.value)')";
const NEW_PREFILL  = "], wizMatchIndustry(wd.industry || ob.industry || ''), 'wizUpdateNaics(this.value)')";
const i1 = html.indexOf(OLD_PREFILL);
if (i1 === -1) { console.error('industry prefill not found'); process.exit(1); }
html = html.slice(0, i1) + NEW_PREFILL + html.slice(i1 + OLD_PREFILL.length);
console.log('1. Prefill updated to use wizMatchIndustry()');

// 2. Also update the NAICS display IIFE to use wizMatchIndustry() so it renders correctly on load
const OLD_NAICS_IIFE = "var _naics = (wd.industry || ob.industry || '').split(' | ')[1] || '';";
const NEW_NAICS_IIFE  = "var _naics = wizMatchIndustry(wd.industry || ob.industry || '').split(' | ')[1] || '';";
const i2 = html.indexOf(OLD_NAICS_IIFE);
if (i2 === -1) { console.error('naics iife not found'); process.exit(1); }
html = html.slice(0, i2) + NEW_NAICS_IIFE + html.slice(i2 + OLD_NAICS_IIFE.length);
console.log('2. NAICS display IIFE updated');

// 3. Add wizMatchIndustry before wizUpdateNaics
const INSERT_BEFORE = 'function wizUpdateNaics(val)';
const idx3 = html.indexOf(INSERT_BEFORE);
if (idx3 === -1) { console.error('wizUpdateNaics not found'); process.exit(1); }
const MATCH_FN = `function wizMatchIndustry(raw) {
    if (!raw) return '';
    if (raw.indexOf(' | ') !== -1) return raw;
    var lower = raw.toLowerCase().trim();
    var opts = [
      'Accounting & Bookkeeping | 541219',
      'Auto Repair | 811111',
      'Beauty / Salon / Barber | 812112',
      'Catering | 722330',
      'Childcare / Daycare | 624410',
      'Cleaning / Janitorial | 561720',
      'Consulting | 541611',
      'Construction | 238220',
      'E-commerce | 454110',
      'Education / Tutoring | 611691',
      'Fitness / Gym | 713940',
      'Food Manufacturing | 311991',
      'Healthcare / Medical | 621211',
      'Import / Export | 419120',
      'Insurance Agency | 524210',
      'Landscaping | 561730',
      'Legal Services | 541110',
      'Manufacturing | 311991',
      'Marketing / Advertising | 541810',
      'Non-profit | 813410',
      'Photography / Videography | 541922',
      'Printing / Publishing | 323111',
      'Property Management | 531311',
      'Real Estate | 531311',
      'Restaurant / Food Service | 722515',
      'Retail | 445110',
      'Security Services | 561621',
      'Staffing Agency | 561320',
      'Technology / IT | 541511',
      'Transportation / Trucking | 484110',
      'Wholesale / Distribution | 425120'
    ];
    for (var i = 0; i < opts.length; i++) {
      var name = opts[i].split(' | ')[0].toLowerCase();
      var parts = name.split(/[\\/,&]/);
      for (var p = 0; p < parts.length; p++) {
        var part = parts[p].trim();
        if (part && (lower.indexOf(part) !== -1 || part.indexOf(lower) !== -1)) return opts[i];
      }
    }
    return '';
  }
  `;
html = html.slice(0, idx3) + MATCH_FN + html.slice(idx3);
console.log('3. wizMatchIndustry helper added');

// Verify syntax
const fnS = html.indexOf('<script>') + '<script>'.length;
const fnE = html.lastIndexOf('</script>');
try { new Function(html.slice(fnS, fnE)); console.log('SYNTAX OK'); }
catch (err) { console.error('SYNTAX ERROR:', err.message); process.exit(1); }

fs.writeFileSync(__dirname + '/admin.html', html, 'utf8');
console.log('Done. Size:', html.length);
