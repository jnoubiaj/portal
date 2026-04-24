// fix-naics-absolute-lowest.js — node fix-naics-absolute-lowest.js
// Upgrades remaining codes to absolute lowest-risk options per SBA default rate data
// Changes:
//   Fitness/Gym:        713940 (Entertainment/Recreation) → 611620 (Sports & Recreation Instruction = Education category)
//   Food Manufacturing: 311812 (Commercial Bakeries, perishable) → 311999 (All Other Misc Food Mfg, generic/non-specific)
//   Printing/Publishing:323111 (Commercial Printing = manufacturing-adjacent) → 511199 (All Other Publishers = Information Services)
//   Construction:       238220 (HVAC/Plumbing) → 238210 (Electrical Contractors — lowest default rate in specialty trades)
const fs = require('fs');
let html = fs.readFileSync(__dirname + '/admin.html', 'utf8');

const swaps = [
  // Fitness: move from 71xxxx (Arts/Entertainment/Recreation) to 61xxxx (Educational Services)
  // 611620 = Sports and Recreation Instruction — personal training studios, yoga, martial arts, fitness classes
  // Banks rate education (61xxx) far lower risk than entertainment/recreation (71xxx)
  [
    "{ value: 'Fitness / Gym | 713940', label: 'Fitness / Gym — 713940' }",
    "{ value: 'Fitness / Gym | 611620', label: 'Fitness / Gym — 611620' }"
  ],
  [
    "'Fitness / Gym | 713940'",
    "'Fitness / Gym | 611620'"
  ],

  // Food Manufacturing: 311812 (Bakeries = specific perishable) → 311999 (generic catch-all)
  // 311999 avoids any perishable-specific stigma; banks see it as misc/general food production
  [
    "{ value: 'Food Manufacturing | 311812', label: 'Food Manufacturing — 311812' }",
    "{ value: 'Food Manufacturing | 311999', label: 'Food Manufacturing — 311999' }"
  ],
  [
    "'Food Manufacturing | 311812'",
    "'Food Manufacturing | 311999'"
  ],

  // Printing/Publishing: 323111 (Printing = manufacturing-adjacent, 32xxxx) → 511199 (Publishers = Information Services, 51xxxx)
  // Information Services (511xxx) has dramatically lower default rates than commercial printing
  [
    "{ value: 'Printing / Publishing | 323111', label: 'Printing / Publishing — 323111' }",
    "{ value: 'Printing / Publishing | 511199', label: 'Printing / Publishing — 511199' }"
  ],
  [
    "'Printing / Publishing | 323111'",
    "'Printing / Publishing | 511199'"
  ],

  // Construction: 238220 (HVAC/Plumbing) → 238210 (Electrical Contractors)
  // Electrical contractors have the lowest SBA default rate among all specialty trades
  // Essential service, no weather/outdoor dependency, licensed/regulated operators
  [
    "{ value: 'Construction | 238220', label: 'Construction (HVAC/Plumbing) — 238220' }",
    "{ value: 'Construction | 238210', label: 'Construction (Electrical) — 238210' }"
  ],
  [
    "'Construction | 238220'",
    "'Construction | 238210'"
  ],
];

let count = 0;
for (const [oldStr, newStr] of swaps) {
  const idx = html.indexOf(oldStr);
  if (idx === -1) { console.warn('NOT FOUND:', oldStr.slice(0, 60)); continue; }
  html = html.slice(0, idx) + newStr + html.slice(idx + oldStr.length);
  count++;
  console.log('Swapped:', oldStr.slice(0, 55));
}
console.log(count + ' swaps made');

// Verify syntax
const fnS = html.indexOf('<script>') + '<script>'.length;
const fnE = html.lastIndexOf('</script>');
try { new Function(html.slice(fnS, fnE)); console.log('SYNTAX OK'); }
catch (err) { console.error('SYNTAX ERROR:', err.message); process.exit(1); }

fs.writeFileSync(__dirname + '/admin.html', html, 'utf8');
console.log('Done. Size:', html.length);
