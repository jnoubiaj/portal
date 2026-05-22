// Bank Relationship Preparation Rules
// Defines per-bank relationship requirements: deposits, seasoning, BRM, transactions.
// Sets window.BANK_RELATIONSHIP_RULES and window.PERSONAL_LOAN_OPTIONS.

window.BANK_RELATIONSHIP_RULES = {
  'chase': {
    bankName:'Chase', bureau:'EX+TU',
    requiresRelationship:false, businessCheckingRequired:true, businessCheckingRecommended:true,
    minimumDeposit:2000, recommendedDeposit:5000, seasoningDays:14, requiredTransactions:5,
    brmRecommended:true, applicationMethod:'online',
    relationshipNotes:'Chase checking account + $2,000+ balance + account activity is required per Evergreen. Dual pull: EX + TU. Apply AFTER US Bank to protect TU inquiry count. BRM relationship improves limits.',
    steps:['Open Chase business checking (REQUIRED)','Deposit $2,000 minimum ($5,000+ recommended)','Complete 5+ business transactions over 14 days','Request BRM introduction if possible','Apply online only — use Chase online application portal'],
    taskKeys:['chase-open-checking','chase-deposit','chase-transactions','chase-brm','chase-apply']
  },
  'boa': {
    bankName:'Bank of America', bureau:'TU',
    requiresRelationship:false, businessCheckingRequired:true, businessCheckingRecommended:true,
    minimumDeposit:5000, recommendedDeposit:10000, seasoningDays:14, requiredTransactions:5,
    brmRecommended:true, applicationMethod:'online or branch',
    relationshipNotes:'BOA checking + $5,000+ balance + account activity required per Evergreen. BRM strongly recommended — can get up to 5 cards in ONE day on one TU inquiry. Net Profit field = 45%–60% of Revenue.',
    steps:['Open BOA business checking (required)','Deposit $5,000 minimum ($10,000 recommended)','Complete 5+ transactions over 14 days','Request BRM introduction — up to 5 cards in one day','Apply online or with BRM; enter Net Profit = 45%–60% of annual revenue'],
    taskKeys:['boa-open-checking','boa-deposit','boa-season','boa-brm','boa-apply']
  },
  'wells-fargo': {
    bankName:'Wells Fargo', bureau:'EX',
    requiresRelationship:false, businessCheckingRequired:false, businessCheckingRecommended:true,
    minimumDeposit:2500, recommendedDeposit:5000, seasoningDays:7, requiredTransactions:0,
    brmRecommended:true, applicationMethod:'branch preferred',
    relationshipNotes:'Wells Fargo strongly prefers in-branch applications. BRM can increase starting limits. 7-day seasoning is minimal.',
    steps:['Open Wells Fargo business checking','Deposit $2,500 minimum','Season for 7 days','Request BRM introduction','Apply in branch with BRM if possible'],
    taskKeys:['wf-open-checking','wf-deposit','wf-season','wf-brm','wf-apply']
  },
  'us-bank': {
    bankName:'US Bank', bureau:'TU',
    requiresRelationship:false, businessCheckingRequired:false, businessCheckingRecommended:true,
    minimumDeposit:0, recommendedDeposit:5000, seasoningDays:0, requiredTransactions:0,
    brmRecommended:false, applicationMethod:'online or branch',
    relationshipNotes:'US Bank does NOT require an existing checking account — Evergreen confirmed. Apply online or via BRM directly. Account is recommended for better limits but not required. Apply BEFORE Chase — both pull TransUnion.',
    steps:['No prior relationship required — apply online at usbank.com or visit a US Bank branch','Opening a US Bank business checking account is recommended but not required','If opening account: deposit $5,000+ and season briefly before applying','Apply BEFORE Chase — both pull TransUnion; protect TU inquiry budget'],
    taskKeys:['usbank-apply']
  },
  'pnc': {
    bankName:'PNC', bureau:'EX',
    requiresRelationship:false, businessCheckingRequired:true, businessCheckingRecommended:true,
    minimumDeposit:2000, recommendedDeposit:5000, seasoningDays:30, requiredTransactions:0,
    brmRecommended:false, applicationMethod:'online or branch',
    relationshipNotes:'PNC requires account + $2,000+ balance + account activity per Evergreen. 0% for 13 months — longest of any national EX bank. Online or BRM.',
    steps:['Open PNC business checking (required)','Deposit $2,000 minimum','Ensure account activity (transactions)','Apply online or in branch'],
    taskKeys:['pnc-open-checking','pnc-deposit','pnc-season','pnc-apply']
  },
  'citizens': {
    bankName:'Citizens Bank', bureau:'EX',
    requiresRelationship:false, businessCheckingRequired:false, businessCheckingRecommended:true,
    minimumDeposit:2500, recommendedDeposit:5000, seasoningDays:7, requiredTransactions:0,
    brmRecommended:false, applicationMethod:'online or branch',
    relationshipNotes:'Citizens prefers existing checking customers. 7-day seasoning is easy to complete quickly.',
    steps:['Open Citizens business checking','Deposit $2,500','Season for 7 days','Apply online or in branch'],
    taskKeys:['citizens-open-checking','citizens-deposit','citizens-season','citizens-apply']
  },
  'keybank': {
    bankName:'KeyBank', bureau:'EQ',
    requiresRelationship:true, businessCheckingRequired:true, businessCheckingRecommended:true,
    minimumDeposit:1000, recommendedDeposit:2500, seasoningDays:0, requiredTransactions:0,
    brmRecommended:false, applicationMethod:'branch or brm',
    relationshipNotes:'KeyBank requires existing account with $1k+ balance. In-branch or BRM only — no online application. Request $25,000 credit line. EQ pull.',
    steps:['Open KeyBank business checking','Deposit $1,000 minimum','Apply in branch or via BRM — no online application','Request $25,000 credit line on application'],
    taskKeys:['keybank-open-checking','keybank-deposit','keybank-apply']
  },
  'truist': {
    bankName:'Truist', bureau:'EQ',
    requiresRelationship:false, businessCheckingRequired:false, businessCheckingRecommended:false,
    minimumDeposit:0, recommendedDeposit:0, seasoningDays:0, requiredTransactions:0,
    brmRecommended:false, applicationMethod:'online or branch',
    relationshipNotes:'Truist does not require existing account. Up to 2 cards per day on one EQ inquiry — strategic EQ bureau diversification. Available in SE states only.',
    steps:['No prior relationship required','Apply online or in branch','Can apply for up to 2 Truist cards in a single day on one inquiry'],
    taskKeys:['truist-apply']
  },
  'flagstar': {
    bankName:'Flagstar Bank', bureau:'EX',
    requiresRelationship:false, businessCheckingRequired:false, businessCheckingRecommended:false,
    minimumDeposit:0, recommendedDeposit:0, seasoningDays:0, requiredTransactions:0,
    brmRecommended:false, applicationMethod:'online',
    relationshipNotes:'Flagstar does not require existing account. Online applications only — no branch option. Best 0% intro in the sequence at 18 months. Enter Checking Balance field as $50,000+.',
    steps:['No prior relationship required','Apply online only at flagstar.com','Use a zip code in Flagstar service area','Enter "Checking Balance" field as $50,000+'],
    taskKeys:['flagstar-apply']
  },
  'bmo': {
    bankName:'BMO Harris', bureau:'TU',
    requiresRelationship:true, businessCheckingRequired:true, businessCheckingRecommended:true,
    minimumDeposit:1000, recommendedDeposit:3000, seasoningDays:30, requiredTransactions:0,
    brmRecommended:false, applicationMethod:'branch or brm',
    relationshipNotes:'BMO requires existing checking account with $1k+ balance. Wait 30 days after opening before applying. Sometimes requests docs. In branch or BRM.',
    steps:['Open BMO Harris business checking','Deposit $1,000 minimum','Wait 30 days after account opening','Apply in branch or via BRM — may request financial documents'],
    taskKeys:['bmo-open-checking','bmo-deposit','bmo-season','bmo-apply']
  },
  'valley-bank': {
    bankName:'Valley Bank', bureau:'TU',
    requiresRelationship:true, businessCheckingRequired:true, businessCheckingRecommended:true,
    minimumDeposit:2000, recommendedDeposit:5000, seasoningDays:30, requiredTransactions:0,
    brmRecommended:false, applicationMethod:'branch',
    relationshipNotes:'Valley Bank requires existing account with $2k+ balance. Wait 30 days after opening. In-branch applications only — no online option.',
    steps:['Open Valley Bank business checking','Deposit $2,000 minimum','Wait 30 days after account opening','Apply in branch only — no online application'],
    taskKeys:['valley-open-checking','valley-deposit','valley-season','valley-apply']
  },
  'regions': {
    bankName:'Regions Bank', bureau:'TU',
    requiresRelationship:true, businessCheckingRequired:true, businessCheckingRecommended:true,
    minimumDeposit:1000, recommendedDeposit:3000, seasoningDays:30, requiredTransactions:0,
    brmRecommended:false, applicationMethod:'branch',
    relationshipNotes:'Regions requires existing account with $1k+ balance. Wait 30 days after opening. In-branch applications only — no online option. Available in SE states.',
    steps:['Open Regions business checking','Deposit $1,000 minimum','Wait 30 days after account opening','Apply in branch only — no online application available'],
    taskKeys:['regions-open-checking','regions-deposit','regions-season','regions-apply']
  },
  'first-citizens': {
    bankName:'First Citizens Bank', bureau:'EX',
    requiresRelationship:false, businessCheckingRequired:false, businessCheckingRecommended:true,
    minimumDeposit:1000, recommendedDeposit:3000, seasoningDays:30, requiredTransactions:0,
    brmRecommended:false, applicationMethod:'online or branch',
    relationshipNotes:'First Citizens prefers existing customers. 30-day seasoning improves approval odds.',
    steps:['Open First Citizens business checking','Deposit $1,000','Season for 30 days','Apply online or in branch'],
    taskKeys:['firstcit-open-checking','firstcit-deposit','firstcit-season','firstcit-apply']
  }
};

// Personal loan options for funding required bank deposits when client lacks cash
window.PERSONAL_LOAN_OPTIONS = [
  { name:'LightStream',           pullType:'hard',        preapproval:false, apr:'7.99%–25.49%', maxAmount:100000, minScore:720, docs:'Income verification, employment history',                  notes:'No fees; same-day funding; best rates for excellent credit (720+).' },
  { name:'SoFi',                  pullType:'soft (check)',preapproval:true,  apr:'8.99%–29.99%', maxAmount:100000, minScore:700, docs:'Income, employment, bank statements',                      notes:'No fees; soft pull rate check; member benefits; ideal for 700+ scores.' },
  { name:'Discover Personal Loans',pullType:'soft (check)',preapproval:true, apr:'7.99%–24.99%', maxAmount:40000,  minScore:700, docs:'SSN, income, employer info',                               notes:'Soft pull pre-check available; same-day decision; good for 700+ scores.' },
  { name:'Best Egg',              pullType:'soft (check)',preapproval:true,  apr:'8.99%–35.99%', maxAmount:50000,  minScore:640, docs:'Income, identity verification',                            notes:'Soft pull to check rates; same-day approval; accessible for 640+ scores.' },
  { name:'Citi Personal Loan',    pullType:'hard',        preapproval:false, apr:'10.49%–19.49%',maxAmount:30000,  minScore:670, docs:'Income, employment, Citi account preferred',               notes:'Existing Citi relationship improves approval; competitive rates for good credit.' },
  { name:'TD Bank Personal Loan', pullType:'hard',        preapproval:false, apr:'8.99%–23.99%', maxAmount:50000,  minScore:660, docs:'Income, ID, TD Bank account preferred',                   notes:'Regional bank; better odds with existing TD account; Northeast-heavy.' },
  { name:'Navy Federal',          pullType:'hard',        preapproval:false, apr:'7.49%–18.00%', maxAmount:50000,  minScore:0,   docs:'Military membership required',                             notes:'Best rates for eligible members (military/veteran/family). TU pull.' }
];

// Return relationship rule for a bank by ID (with fallback to partial match)
function getBankRelationshipRule(bankId) {
  if (!bankId) return null;
  var id = String(bankId).toLowerCase().trim();
  var rules = window.BANK_RELATIONSHIP_RULES || {};
  if (rules[id]) return rules[id];
  // Partial match: 'bank-of-america' → 'boa', 'wells' → 'wells-fargo', etc.
  var aliases = { 'bank-of-america':'boa','bankofamerica':'boa','wellsfargo':'wells-fargo','usbank':'us-bank','firstcitizens':'first-citizens' };
  if (aliases[id] && rules[aliases[id]]) return rules[aliases[id]];
  return null;
}

// Calculate total deposit requirement across all strategy banks that need relationships
function calcTotalDepositRequired(bankIds, existingRelationships) {
  var rules = window.BANK_RELATIONSHIP_RULES || {};
  var total = 0;
  (bankIds || []).forEach(function(id) {
    var r = getBankRelationshipRule(id);
    if (!r) return;
    var hasRel = existingRelationships.some(function(rel) { return rel && rel.indexOf(id.split('-')[0]) !== -1; });
    if (!hasRel && r.businessCheckingRecommended) total += r.recommendedDeposit;
  });
  return total;
}

console.log('[Bank Relationship Rules] Loaded —', Object.keys(window.BANK_RELATIONSHIP_RULES).length, 'banks,', (window.PERSONAL_LOAN_OPTIONS||[]).length, 'personal loan options');
