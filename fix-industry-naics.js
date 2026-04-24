// fix-industry-naics.js — node fix-industry-naics.js
// Converts Industry from free-text to a dropdown with low-risk NAICS codes
const fs = require('fs');
let html = fs.readFileSync(__dirname + '/admin.html', 'utf8');

// Replace the free-text industry wizInput with a wizSelect dropdown
const OLD_INDUSTRY = "+ wizInput('wiz-industry', 'Industry', 'e.g. Technology', wd.industry || ob.industry || '', 'text')";

const NEW_INDUSTRY = `+ wizSelect('wiz-industry', 'Industry / NAICS Code', [
            { value: '', label: '— Select Industry —' },
            { value: 'Accounting & Bookkeeping | 541219', label: 'Accounting & Bookkeeping — 541219' },
            { value: 'Auto Repair | 811111', label: 'Auto Repair / Automotive — 811111' },
            { value: 'Beauty / Salon / Barber | 812112', label: 'Beauty / Salon / Barber — 812112' },
            { value: 'Catering | 722330', label: 'Catering — 722330' },
            { value: 'Childcare / Daycare | 624410', label: 'Childcare / Daycare — 624410' },
            { value: 'Cleaning / Janitorial | 561720', label: 'Cleaning / Janitorial — 561720' },
            { value: 'Consulting | 541611', label: 'Consulting / Professional Services — 541611' },
            { value: 'Construction | 238220', label: 'Construction (HVAC/Plumbing) — 238220' },
            { value: 'E-commerce | 454110', label: 'E-commerce / Online Retail — 454110' },
            { value: 'Education / Tutoring | 611691', label: 'Education / Tutoring — 611691' },
            { value: 'Fitness / Gym | 713940', label: 'Fitness / Gym — 713940' },
            { value: 'Food Manufacturing | 311991', label: 'Food Manufacturing — 311991' },
            { value: 'Healthcare / Medical | 621211', label: 'Healthcare / Medical — 621211' },
            { value: 'Import / Export | 419120', label: 'Import / Export — 419120' },
            { value: 'Insurance Agency | 524210', label: 'Insurance Agency — 524210' },
            { value: 'Landscaping | 561730', label: 'Landscaping — 561730' },
            { value: 'Legal Services | 541110', label: 'Legal Services — 541110' },
            { value: 'Manufacturing | 311991', label: 'Manufacturing (Specialty Food) — 311991' },
            { value: 'Marketing / Advertising | 541810', label: 'Marketing / Advertising — 541810' },
            { value: 'Non-profit | 813410', label: 'Non-profit / Civic Org — 813410' },
            { value: 'Photography / Videography | 541922', label: 'Photography / Videography — 541922' },
            { value: 'Printing / Publishing | 323111', label: 'Printing / Publishing — 323111' },
            { value: 'Property Management | 531311', label: 'Property Management — 531311' },
            { value: 'Real Estate | 531311', label: 'Real Estate — 531311' },
            { value: 'Restaurant / Food Service | 722515', label: 'Restaurant / Food Service — 722515' },
            { value: 'Retail | 445110', label: 'Retail (Grocery/Staples) — 445110' },
            { value: 'Security Services | 561621', label: 'Security Services — 561621' },
            { value: 'Staffing Agency | 561320', label: 'Staffing / Temp Agency — 561320' },
            { value: 'Technology / IT | 541511', label: 'Technology / IT — 541511' },
            { value: 'Transportation / Trucking | 484110', label: 'Transportation / Trucking — 484110' },
            { value: 'Wholesale / Distribution | 425120', label: 'Wholesale / Distribution — 425120' }
          ], wd.industry || ob.industry || '')`;

const idx = html.indexOf(OLD_INDUSTRY);
if (idx === -1) { console.error('industry field not found'); process.exit(1); }
html = html.slice(0, idx) + NEW_INDUSTRY + html.slice(idx + OLD_INDUSTRY.length);
console.log('Industry dropdown added at', idx);

// Verify syntax
const fnS = html.indexOf('<script>') + '<script>'.length;
const fnE = html.lastIndexOf('</script>');
try { new Function(html.slice(fnS, fnE)); console.log('SYNTAX OK'); }
catch (err) { console.error('SYNTAX ERROR:', err.message); process.exit(1); }

fs.writeFileSync(__dirname + '/admin.html', html, 'utf8');
console.log('Done. Size:', html.length);
