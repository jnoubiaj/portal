// Bank Bureau Pull Rules — verified bureau mappings for business credit applications
// Sets window.BANK_BUREAU_RULES; loaded synchronously via <script> tag before FSG engine runs.

window.BANK_BUREAU_RULES = {
  'chase':            { bureaus:['TU','EX'],        primary:'TU',  multi:true,  label:'TransUnion / Experian',  notes:'Chase pulls TU primarily, may also pull EX in some states. 5/24 rule applies across bureaus.' },
  'barclays':         { bureaus:['EX'],             primary:'EX',  multi:false, label:'Experian',               notes:'Barclays pulls EX only. Apply same day as Chase for minimal combined impact.' },
  'fnbo':             { bureaus:['EX'],             primary:'EX',  multi:false, label:'Experian',               notes:'FNBO (First National Bank of Omaha) pulls Experian.' },
  'amex':             { bureaus:['EX'],             primary:'EX',  multi:false, label:'Experian',               notes:'American Express pulls Experian for business cards.' },
  'wells-fargo':      { bureaus:['EX'],             primary:'EX',  multi:false, label:'Experian',               notes:'Wells Fargo primarily pulls Experian for business cards.' },
  'pnc':              { bureaus:['EX'],             primary:'EX',  multi:false, label:'Experian',               notes:'PNC pulls Experian for business card applications.' },
  'citizens':         { bureaus:['EX'],             primary:'EX',  multi:false, label:'Experian',               notes:'Citizens Bank pulls Experian for business applications.' },
  'flagstar':         { bureaus:['EX'],             primary:'EX',  multi:false, label:'Experian',               notes:'Flagstar Bank pulls Experian.' },
  'first-citizens':   { bureaus:['EX'],             primary:'EX',  multi:false, label:'Experian',               notes:'First Citizens Bank pulls Experian.' },
  'fifth-third':      { bureaus:['EX'],             primary:'EX',  multi:false, label:'Experian',               notes:'Fifth Third Bank pulls Experian for business credit.' },
  'huntington':       { bureaus:['EX'],             primary:'EX',  multi:false, label:'Experian',               notes:'Huntington National Bank pulls Experian.' },
  'first-midwest':    { bureaus:['EX'],             primary:'EX',  multi:false, label:'Experian',               notes:'First Midwest Bank pulls Experian.' },
  'commerce-bank':    { bureaus:['EX'],             primary:'EX',  multi:false, label:'Experian',               notes:'Commerce Bank typically pulls Experian.' },
  'us-bank':          { bureaus:['TU'],             primary:'TU',  multi:false, label:'TransUnion',             notes:'US Bank pulls TransUnion primarily for business cards.' },
  'boa':              { bureaus:['TU'],             primary:'TU',  multi:false, label:'TransUnion',             notes:'Bank of America primarily pulls TransUnion for business cards.' },
  'citi':             { bureaus:['TU'],             primary:'TU',  multi:false, label:'TransUnion',             notes:'Citi primarily pulls TransUnion for business cards.' },
  'valley-bank':      { bureaus:['TU'],             primary:'TU',  multi:false, label:'TransUnion',             notes:'Valley Bank pulls TransUnion for business applications.' },
  'navy-federal':     { bureaus:['TU'],             primary:'TU',  multi:false, label:'TransUnion',             notes:'Navy Federal Credit Union primarily pulls TransUnion.' },
  'bmo-harris':       { bureaus:['TU'],             primary:'TU',  multi:false, label:'TransUnion',             notes:'BMO Harris pulls TransUnion for business cards.' },
  'regions':          { bureaus:['TU'],             primary:'TU',  multi:false, label:'TransUnion',             notes:'Regions Bank pulls TransUnion for business applications.' },
  'umb':              { bureaus:['TU'],             primary:'TU',  multi:false, label:'TransUnion',             notes:'UMB Bank pulls TransUnion.' },
  'truist':           { bureaus:['EQ'],             primary:'EQ',  multi:false, label:'Equifax',                notes:'Truist (formerly SunTrust/BB&T) pulls Equifax.' },
  'keybank':          { bureaus:['EQ'],             primary:'EQ',  multi:false, label:'Equifax',                notes:'KeyBank pulls Equifax for business credit cards.' },
  'discover':         { bureaus:['EQ'],             primary:'EQ',  multi:false, label:'Equifax',                notes:'Discover pulls Equifax for business card applications.' },
  'capital-one':      { bureaus:['EX','TU','EQ'],   primary:'ALL', multi:true,  label:'All 3 Bureaus',          notes:'Capital One pulls ALL 3 bureaus. Apply last — consumes inquiry budget on every bureau simultaneously.' },
  // Elan Financial-backed banks (all pull TransUnion)
  'elan-wintrust':    { bureaus:['TU'],             primary:'TU',  multi:false, label:'TransUnion',             notes:'Elan Financial-backed — pulls TransUnion.' },
  'elan-old-national':{ bureaus:['TU'],             primary:'TU',  multi:false, label:'TransUnion',             notes:'Elan Financial-backed — pulls TransUnion.' },
  'elan-commerce':    { bureaus:['TU'],             primary:'TU',  multi:false, label:'TransUnion',             notes:'Elan Financial-backed — pulls TransUnion.' },
  'elan-tcf':         { bureaus:['TU'],             primary:'TU',  multi:false, label:'TransUnion',             notes:'Elan Financial-backed — pulls TransUnion.' },
};

// Inquiry warn/block thresholds by bureau (kept in sync with FSG_INQ_WARN/BLOCK in admin.html)
var _BUREAU_WARN  = { EX:4, TU:5, EQ:5 };
var _BUREAU_BLOCK = { EX:7, TU:8, EQ:8 };

function getBankBureaus(bankIdOrName) {
  if (!bankIdOrName) return null;
  var id = String(bankIdOrName).toLowerCase().trim();
  var rules = window.BANK_BUREAU_RULES || {};
  if (rules[id]) return rules[id];
  // Elan family: any id starting with 'elan' → TU
  if (id.indexOf('elan') === 0) return { bureaus:['TU'], primary:'TU', multi:false, label:'TransUnion', notes:'Elan Financial Services pulls TransUnion.' };
  // Partial prefix match (e.g. 'commerce' matches 'commerce-bank')
  var keys = Object.keys(rules);
  for (var i = 0; i < keys.length; i++) {
    var k = keys[i];
    var kParts = k.split('-');
    if (k.indexOf(id) === 0 || id.indexOf(kParts[0]) === 0) return rules[k];
  }
  return null;
}

// Returns { risk:'clean'|'elevated'|'high'|'unknown', level:N, label:'...', bureaus:[] }
function getBureauInquiryRisk(profile, bankId) {
  var bureauInfo = getBankBureaus(bankId);
  if (!bureauInfo) return { risk:'unknown', level:0, label:'Bureau unknown — verify before applying', bureaus:[] };
  var inqMap = { EX: Number(profile.expInq||0), TU: Number(profile.tuInq||0), EQ: Number(profile.eqInq||0) };

  if (bureauInfo.primary === 'ALL') {
    var maxInq = Math.max(inqMap.EX, inqMap.TU, inqMap.EQ);
    var r = maxInq >= _BUREAU_BLOCK.EX ? 'high' : maxInq >= _BUREAU_WARN.EX ? 'elevated' : 'clean';
    var lbl = { clean:'All bureaus clean — safe to apply', elevated:'Elevated inquiries across bureaus — cleanup helps', high:'High inquiries on multiple bureaus — apply last' };
    return { risk:r, level:maxInq, label:lbl[r], bureaus:['EX','TU','EQ'] };
  }

  var worstRisk = 'clean', worstCount = 0;
  bureauInfo.bureaus.forEach(function(b) {
    var count = inqMap[b] || 0;
    var risk  = count >= (_BUREAU_BLOCK[b]||8) ? 'high' : count >= (_BUREAU_WARN[b]||5) ? 'elevated' : 'clean';
    if (risk === 'high' || (risk === 'elevated' && worstRisk === 'clean')) worstRisk = risk;
    if (count > worstCount) worstCount = count;
  });
  var riskLabels = { clean:'Bureau clean — safe to apply', elevated:'Inquiry cleanup recommended before applying', high:'Inquiry removal required before applying' };
  return { risk:worstRisk, level:worstCount, label:riskLabels[worstRisk], bureaus:bureauInfo.bureaus };
}

// Sort banks: clean bureau banks first within the same round/priority tier
function rankBanksByBureauHealth(profile, banks) {
  var order = { clean:0, elevated:1, high:2, unknown:3 };
  return banks.slice().sort(function(a, b) {
    var rA = getBureauInquiryRisk(profile, a.id).risk;
    var rB = getBureauInquiryRisk(profile, b.id).risk;
    if (order[rA] !== order[rB]) return order[rA] - order[rB];
    if (a.ev_priority !== b.ev_priority) return a.ev_priority - b.ev_priority;
    return (a.name||'').localeCompare(b.name||'');
  });
}

// Generate bureau-aware application sequence for a client
function generateBureauAwareSequence(profile, banks) {
  var result = banks.map(function(b) {
    var bureauRule = getBankBureaus(b.id);
    var riskInfo   = getBureauInquiryRisk(profile, b.id);
    return Object.assign({}, b, {
      bureauLabel:      bureauRule ? bureauRule.label : (b.bureau || 'Unknown'),
      bureauMulti:      bureauRule ? !!bureauRule.multi : false,
      bureauRisk:       riskInfo.risk,
      bureauRiskLabel:  riskInfo.label,
      needsCleanup:     riskInfo.risk === 'high',
      cleanupRecommended: riskInfo.risk === 'elevated'
    });
  });
  return result;
}

console.log('[Bureau Rules] Loaded —', Object.keys(window.BANK_BUREAU_RULES).length, 'bank bureau mappings');
