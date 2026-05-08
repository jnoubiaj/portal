// Bank Relationship Preparation Rules
// Defines per-bank relationship requirements: deposits, seasoning, BRM, transactions.
// Sets window.BANK_RELATIONSHIP_RULES and window.PERSONAL_LOAN_OPTIONS.

window.BANK_RELATIONSHIP_RULES = {
  'chase': {
    bankName:'Chase', bureau:'TU/EX',
    requiresRelationship:false, businessCheckingRequired:false, businessCheckingRecommended:true,
    minimumDeposit:5000, recommendedDeposit:10000, seasoningDays:14, requiredTransactions:10,
    brmRecommended:true, applicationMethod:'online or branch',
    relationshipNotes:'Chase BRM relationship and 90-day banking history significantly improve approval odds and starting limits.',
    steps:['Open Chase business checking','Deposit $10,000 minimum','Complete 10+ business transactions over 14 days','Request BRM introduction before applying','Apply online or in-branch with BRM present'],
    taskKeys:['chase-open-checking','chase-deposit','chase-transactions','chase-brm','chase-apply']
  },
  'boa': {
    bankName:'Bank of America', bureau:'TU',
    requiresRelationship:false, businessCheckingRequired:false, businessCheckingRecommended:true,
    minimumDeposit:5000, recommendedDeposit:10000, seasoningDays:14, requiredTransactions:0,
    brmRecommended:true, applicationMethod:'online or branch',
    relationshipNotes:'BofA Preferred Rewards for Business membership improves approval rate 2–3x. BRM introduction strongly recommended.',
    steps:['Open BofA business checking','Deposit $5,000–$10,000','Season account for 14 days','Request BRM introduction','Apply online or with BRM in branch'],
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
    requiresRelationship:true, businessCheckingRequired:true, businessCheckingRecommended:true,
    minimumDeposit:5000, recommendedDeposit:10000, seasoningDays:30, requiredTransactions:0,
    brmRecommended:false, applicationMethod:'branch required',
    relationshipNotes:'US Bank REQUIRES existing business checking. This is a hard requirement — applications without it are declined.',
    steps:['Open US Bank business checking (REQUIRED)','Deposit $5,000 minimum','Season account for 30 days','Apply in branch — bring checking account info'],
    taskKeys:['usbank-open-checking','usbank-deposit','usbank-season','usbank-apply']
  },
  'pnc': {
    bankName:'PNC', bureau:'EX',
    requiresRelationship:false, businessCheckingRequired:false, businessCheckingRecommended:true,
    minimumDeposit:3000, recommendedDeposit:5000, seasoningDays:60, requiredTransactions:0,
    brmRecommended:false, applicationMethod:'online or branch',
    relationshipNotes:'PNC rewards existing checking customers. 60-day seasoning period significantly improves outcomes.',
    steps:['Open PNC business checking','Deposit $3,000 minimum','Season for 60 days','Apply online or in branch'],
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
    requiresRelationship:false, businessCheckingRequired:false, businessCheckingRecommended:false,
    minimumDeposit:1000, recommendedDeposit:2500, seasoningDays:0, requiredTransactions:0,
    brmRecommended:false, applicationMethod:'online or branch',
    relationshipNotes:'KeyBank does not require a prior relationship. Good option for clients with limited existing bank relationships.',
    steps:['No prior relationship required','Apply online or in branch directly'],
    taskKeys:['keybank-apply']
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
