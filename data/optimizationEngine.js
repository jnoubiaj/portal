// Funding Optimization + Bank Relationship Preparation Engine
// Analyzes a client profile and returns structured warnings, action items, and recommendations.
// Pure data — no DOM access. Rendering happens in admin.html renderFundingStrategy().

window.FSG_OPTIMIZATION_ENGINE = {

  analyze: function(profile) {
    var warnings     = [];
    var actions      = [];
    var relationships= [];
    var bankingHealth= null;
    var fundingImpact= [];
    var personalCardRecs = [];
    var cashRecs     = null;
    var creditAgeRecs= [];
    var inquiryRecs  = { ex:[], tu:[], eq:[] };
    var tasks        = [];

    var util    = Number(profile.utilization) || 0;
    var score   = Number(profile.creditScore) || 0;
    var expInq  = Number(profile.expInq) || 0;
    var tuInq   = Number(profile.tuInq)  || 0;
    var eqInq   = Number(profile.eqInq)  || 0;
    var bizAge  = Number(profile.businessAge) || 0;
    var avgAge  = Number(profile.avgCreditAge) || 0;
    var goal    = Number(profile.fundingGoal) || 0;
    var approved= Number(profile.approvedAmount) || 0;
    var relCount= (profile.existingRelationships||[]).length;
    var personalCCLimit      = Number(profile.personalCCLimit) || 0;
    var totalPersonalCCLimit = Number(profile.totalPersonalCCLimit || profile.personalCCLimit) || 0;
    var highestCardLimit     = Number(profile.highestPersonalCardLimit) || 0;
    var highUtilCards        = profile.highUtilCards || [];
    var availCash  = Number(profile.availableCash) || 0;
    var monthlyRev = Number(profile.monthlyRevenue) || 0;

    // ── RULE 1: HIGH LIMIT PERSONAL CARD ──────────────────────────────────
    // Only trigger if no single card is $10K+ AND total revolving credit is under $25K
    var hasStrongPersonalCard = highestCardLimit >= 10000;
    var hasStrongTotalRevCard = totalPersonalCCLimit >= 25000;
    if (!hasStrongPersonalCard && !hasStrongTotalRevCard) {
      var ccLimitMsg = '';
      if (totalPersonalCCLimit > 0) {
        ccLimitMsg = 'Total open revolving limits: $' + totalPersonalCCLimit.toLocaleString() + '. Highest single card: ' + (highestCardLimit > 0 ? '$' + highestCardLimit.toLocaleString() : 'none detected') + '. A single card over $10K or $25K+ total significantly improves business card approval odds and starting limits.';
      } else {
        ccLimitMsg = 'No personal credit card limits detected from credit analyzer. Strong personal revolving credit (any card $10K+ or $25K+ total) significantly improves business card approval odds and limits.';
      }
      warnings.push({
        id:'low-personal-cc', severity:'medium',
        title:'Personal Credit Limits May Limit Business Card Approvals',
        message: ccLimitMsg
      });
      personalCardRecs = [
        { name:'Chase Sapphire Preferred', bureau:'TU/EX', estimatedLimit:'$5,000–$15,000', minScore:700, notes:'Best travel rewards; strong card for building Chase relationship', reason:'Builds Chase banking relationship and lifts personal credit profile simultaneously.' },
        { name:'Capital One Venture X',    bureau:'EQ/TU', estimatedLimit:'$10,000–$30,000', minScore:720, notes:'Premium travel card; high limit for qualified applicants', reason:'High starting limit card. Boosts personal available credit significantly.' },
        { name:'Wells Fargo OneKey+',      bureau:'EX',    estimatedLimit:'$5,000–$20,000',  minScore:680, notes:'Good everyday rewards; builds WF banking relationship', reason:'Builds Wells Fargo relationship and adds to personal credit depth.' },
        { name:'AMEX Delta Gold',          bureau:'EX',    estimatedLimit:'$3,000–$15,000',  minScore:670, notes:'Amex pulls EX; good for clients with strong EX profile', reason:'Amex relationship card — having personal Amex card can improve business Amex odds.' },
        { name:'AMEX Hilton Honors',       bureau:'EX',    estimatedLimit:'$2,000–$10,000',  minScore:660, notes:'Easier Amex approval; builds Amex relationship', reason:'Entry-level Amex product — builds Amex relationship for future business cards.' }
      ].filter(function(c) { return !score || score >= c.minScore - 30; });
      actions.push({
        id:'add-personal-card', priority:3,
        action: 'Add a high-limit personal credit card before business applications (target: $10,000+ single card)',
        reason: 'No single personal card over $10K and total revolving under $25K reduces business card approval odds and starting limits at Chase, Amex, and Citizens.',
        urgency:'medium',
        fundingImpact:'A single $10K+ personal card can add $5,000–$15,000 in business card limits through improved credit profile depth.'
      });
      tasks.push({ key:'fsg-personal-card', title:'Add high-limit personal credit card ($10K+ target)', reason:'Low personal revolving limits reduce business card approval odds', priority:'medium', daysToComplete:30, relatedBank:null });
    }

    // ── RULE 2: UTILIZATION OPTIMIZATION ─────────────────────────────────
    if (util > 9) {
      var severity = util > 50 ? 'high' : util > 30 ? 'medium' : 'low';
      // Build card-level detail if available
      var cardDetail = '';
      if (highUtilCards.length > 0) {
        cardDetail = ' Specific cards above 30%: ' + highUtilCards.map(function(a) {
          return a.name + ' (' + a.util + '% — $' + (a.balance||0).toLocaleString() + ' of $' + (a.limit||0).toLocaleString() + ' limit)';
        }).join('; ') + '.';
      }
      warnings.push({
        id:'high-utilization', severity:severity,
        title:'Utilization Too High — ' + util + '%',
        message: (util > 50
          ? 'Utilization of ' + util + '% signals credit dependency. Most banks cap approvals or auto-decline above 50%. Pay down to below 30% immediately.'
          : util > 30
          ? 'Utilization of ' + util + '% is above the 30% industry threshold. Approval odds and starting limits decrease meaningfully above 30%.'
          : 'Utilization of ' + util + '% is above the optimal 9% target. Paying down to single digits maximizes approval odds and credit limits offered.') + cardDetail
      });
      var paydownActions = [
        { action:'Pay down revolving balances to below 9% utilization', reason:'Utilization below 9% is the optimization threshold — most lenders offer their best terms at this level', urgency:'high', fundingImpact:'Reducing from ' + util + '% to below 9% may add $5,000–$20,000 to total approved limits.' }
      ];
      if (highUtilCards.length > 0) {
        var topCard = highUtilCards[0];
        paydownActions.push({ action:'Pay down ' + topCard.name + ' from ' + topCard.util + '% to below 30% first', reason:'This card has the highest utilization — reducing it has the most immediate score impact', urgency:'high', fundingImpact:'Paying down the highest-utilization card can add 20–40 points to FICO score within one billing cycle.' });
      }
      if (util > 30) {
        paydownActions.push({ action:'Request credit limit increase on existing personal cards', reason:'Higher limits lower utilization ratio without paying down debt — faster path to under 30%', urgency:'medium', fundingImpact:'A $5,000 limit increase on one card can drop utilization by 5–10 percentage points.' });
      }
      paydownActions.forEach(function(a, i) {
        actions.push(Object.assign({ id:'util-' + i, priority:1 }, a));
      });
      if (util > 50 && availCash < 5000) {
        actions.push({ id:'util-loan', priority:2, action:'Consider personal loan to pay off high-balance credit cards', reason:'A personal installment loan replaces revolving debt — installment debt does not count toward utilization ratio', urgency:'high', fundingImpact:'Converting $10,000 revolving debt to installment could drop utilization by 15–25 points immediately.' });
      }
      fundingImpact.push('Reducing utilization from ' + util + '% to below 9% could increase total approved business card limits by $10,000–$25,000 and improve approval odds at Chase, Citizens, and US Bank.');
      tasks.push({ key:'fsg-util-paydown', title:'Pay down utilization below 9%', reason:'High utilization reduces approval odds at all major business card issuers', priority:severity, daysToComplete:30, relatedBank:null });
    }

    // ── RULE 3: BUSINESS ACCOUNT FUNDING CASH ────────────────────────────
    var relRules = window.BANK_RELATIONSHIP_RULES || {};
    var strategyBankIds = Object.keys(relRules);
    var totalDepositNeeded = 0;
    strategyBankIds.forEach(function(id) {
      var r = relRules[id];
      if (!r || !r.businessCheckingRecommended) return;
      var hasRel = profile.hasRelationship && profile.hasRelationship(id);
      if (!hasRel) totalDepositNeeded += r.recommendedDeposit;
    });
    var totalDepositNeededFiltered = Math.min(totalDepositNeeded, goal > 0 ? goal * 0.1 : 35000);

    if (totalDepositNeededFiltered > 0) {
      // If revenue is on file but cash is unknown (0), show a softer "unconfirmed" warning instead of loan push
      var cashUnknown = availCash === 0 && monthlyRev > 0;
      if (cashUnknown) {
        warnings.push({
          id:'cash-unknown', severity:'low',
          title:'Available Cash for Bank Deposits Not Confirmed',
          message: 'Bank relationship deposits (estimated $' + totalDepositNeededFiltered.toLocaleString() + ' total) are required before applying to Chase, US Bank, BofA, Wells Fargo, and PNC. Cash availability is not on file — confirm with client before planning deposit timeline.'
        });
        cashRecs = { needed:false, cashUnknown:true, totalNeeded:totalDepositNeededFiltered, shortfall:0, loanOptions:[] };
        actions.push({ id:'cash-confirm', priority:3, action:'Confirm client available cash for bank relationship deposits', reason:'Banking relationships require $' + totalDepositNeededFiltered.toLocaleString() + ' in deposits — confirm cash availability before setting deposit timeline', urgency:'low', fundingImpact:'Confirming cash availability unlocks the full bank relationship setup timeline.' });
      } else if (availCash < totalDepositNeededFiltered) {
        var cashShortfall = totalDepositNeededFiltered - availCash;
        warnings.push({
          id:'cash-needed', severity:'medium',
          title:'Business Account Funding Cash Needed',
          message: 'Opening bank relationships for recommended strategy banks requires an estimated $' + totalDepositNeededFiltered.toLocaleString() + ' in deposits. ' +
            (availCash > 0 ? '$' + availCash.toLocaleString() + ' available — shortfall of ~$' + cashShortfall.toLocaleString() + '.' : 'No available cash on file — personal loan may be needed.')
        });
        var loanOpts = (window.PERSONAL_LOAN_OPTIONS || []).filter(function(l) { return l.maxAmount >= cashShortfall && (!score || !l.minScore || score >= l.minScore - 40); });
        cashRecs = { needed:true, totalNeeded:totalDepositNeededFiltered, shortfall:cashShortfall, loanOptions:loanOpts.slice(0,4) };
        if (cashShortfall > 0) {
          actions.push({ id:'cash-loan', priority:2, action:'Use personal loan to fund required bank account deposits ($' + cashShortfall.toLocaleString() + ' shortfall)', reason:'Banking relationships require $' + totalDepositNeededFiltered.toLocaleString() + ' in deposits. A personal installment loan preserves personal cash flow.', urgency:'medium', fundingImpact:'Establishing relationships with Chase, BofA, and US Bank can increase total approved limits by $30,000–$80,000.' });
          tasks.push({ key:'fsg-cash-loan', title:'Secure funding for bank deposit requirements', reason:'Personal loan recommended to fund $' + cashShortfall.toLocaleString() + ' in bank relationship deposits', priority:'medium', daysToComplete:14, relatedBank:null });
        }
      }
    }

    // ── RULE 4: CREDIT AGE OPTIMIZATION ──────────────────────────────────
    if (avgAge > 0 && avgAge < 5) {
      warnings.push({
        id:'low-credit-age', severity:avgAge < 2 ? 'high' : 'medium',
        title:'Average Credit Age Below 5 Years',
        message: 'Average credit age of ' + avgAge.toFixed(1) + ' years is below the 5-year preferred threshold. Lenders weigh credit history length heavily in business card underwriting.'
      });
      creditAgeRecs = [
        { strategy:'Rent Reporting Services', effectiveness:'medium', notes:'Services like Rental Kharma or RentReporters report rent payment history to all 3 bureaus, building payment history without new accounts.' },
        { strategy:'Primary Tradelines', effectiveness:'medium-high', notes:'Become a primary account holder on established accounts. Adds real credit history. Verify legal compliance before proceeding.' },
        { strategy:'Secured Credit Cards (aged)', effectiveness:'medium', notes:'Open secured cards from established banks and keep them active. After 12–24 months, they age into valuable history anchors.' }
      ];
      actions.push({ id:'credit-age', priority:3, action:'Enroll in rent reporting to build credit age and payment history', reason:'Average credit age of ' + avgAge.toFixed(1) + ' years reduces limits at Chase and Amex; rent reporting adds 1–3 years of history within 90 days', urgency:'medium', fundingImpact:'Improving average credit age to 5+ years can increase starting limits by $3,000–$8,000 per card.' });
      tasks.push({ key:'fsg-credit-age', title:'Enroll in rent reporting service', reason:'Build credit age to improve funding approval odds', priority:'medium', daysToComplete:7, relatedBank:null });
    }

    // ── RULE 5: INQUIRY CLEANUP ───────────────────────────────────────────
    var inquiryWarn = { EX:4, TU:5, EQ:5 };
    var inquiryBlock = { EX:7, TU:8, EQ:8 };
    if (expInq > inquiryWarn.EX) {
      var exSeverity = expInq >= inquiryBlock.EX ? 'high' : 'medium';
      warnings.push({ id:'inq-ex', severity:exSeverity, title:expInq + ' Experian Inquiries — ' + (exSeverity==='high' ? 'Removal Required' : 'Cleanup Recommended'), message:'Citizens, Chase (5/24 rule), Wells Fargo, PNC, and Flagstar all pull Experian. ' + (expInq >= inquiryBlock.EX ? 'At ' + expInq + ' inquiries, Chase 5/24 will auto-decline. Remove before applying.' : 'At ' + expInq + ' inquiries, inquiry removal improves approval odds and limits at all EX banks.') });
      inquiryRecs.ex = [{ action:'Start Experian inquiry removal before Round 1 EX banks (Citizens, Chase, Wells Fargo)', priority:'high', timing:'Complete removal before any EX bank applications', note:'Do NOT skip EX banks — run removal first, then apply full sequence same day.' }];
      actions.push({ id:'inq-ex', priority:1, action:'Run Experian inquiry removal before Citizens, Chase, Wells Fargo, and PNC applications', reason:'Chase 5/24 counts all EX inquiries; Citizens and Wells Fargo also pull EX — removal before application day maximizes approval odds across all Round 1 and 2 banks', urgency:exSeverity, fundingImpact:'Reducing EX inquiries below 4 can unlock full Chase 5/24 quota and add $15,000–$30,000 in expected Round 1 approvals.' });
      tasks.push({ key:'fsg-inq-ex', title:'Run Experian inquiry removal', reason:'EX inquiries impact Chase 5/24, Citizens, Wells Fargo, and PNC approvals', priority:exSeverity, daysToComplete:21, relatedBank:'Citizens / Chase / Wells Fargo / PNC' });
    }
    if (tuInq > inquiryWarn.TU) {
      var tuSeverity = tuInq >= inquiryBlock.TU ? 'high' : 'medium';
      warnings.push({ id:'inq-tu', severity:tuSeverity, title:tuInq + ' TransUnion Inquiries — ' + (tuSeverity==='high' ? 'Removal Required' : 'Cleanup Recommended'), message:'Chase, Bank of America, US Bank, Citi, Regions, and Elan banks all pull TransUnion. High TU inquiries reduce approval odds and starting limits at these banks.' });
      inquiryRecs.tu = [{ action:'Run TransUnion inquiry removal before TU banks (Chase, BofA, US Bank, Elan)', priority:tuSeverity, timing:'Complete before Round 1 and 2 applications', note:'TU banks include Chase (Round 1), BofA and US Bank (Round 1/2), and all Elan-backed cards — cleanup helps across all rounds.' }];
      actions.push({ id:'inq-tu', priority:1, action:'Run TransUnion inquiry removal before Chase, BofA, and US Bank applications', reason:'Chase, BofA, and US Bank pull TU; high TU inquiry count reduces approval odds and starting limits at the three most important TU banks', urgency:tuSeverity, fundingImpact:'Cleaning TU bureau unlocks Chase + BofA + US Bank — estimated $20,000–$40,000 in approvals.' });
      tasks.push({ key:'fsg-inq-tu', title:'Run TransUnion inquiry removal', reason:'TU inquiries impact Chase, BofA, US Bank, and Elan approvals', priority:tuSeverity, daysToComplete:21, relatedBank:'Chase / BofA / US Bank / Elan' });
    }
    if (eqInq > inquiryWarn.EQ) {
      var eqSeverity = eqInq >= inquiryBlock.EQ ? 'high' : 'medium';
      warnings.push({ id:'inq-eq', severity:eqSeverity, title:eqInq + ' Equifax Inquiries — ' + (eqSeverity==='high' ? 'Removal Required' : 'Cleanup Recommended'), message:'Truist and KeyBank pull Equifax for business cards. High EQ inquiries directly impact Round 2 Equifax banks and can affect bureau-diverse sequencing.' });
      inquiryRecs.eq = [{ action:'Run Equifax inquiry removal before Round 2 EQ banks (Truist, KeyBank)', priority:eqSeverity, timing:'Complete before Round 2 applications', note:'Truist and KeyBank are the primary EQ banks in our sequence — clean EQ is important for Round 2 approvals.' }];
      actions.push({ id:'inq-eq', priority:1, action:'Run Equifax inquiry removal before Truist and KeyBank applications', reason:'Truist and KeyBank pull Equifax; high EQ inquiries suppress approval odds and starting limits at these banks', urgency:eqSeverity, fundingImpact:'Clean Equifax bureau improves Truist and KeyBank approval odds for Round 2.' });
      tasks.push({ key:'fsg-inq-eq', title:'Run Equifax inquiry removal', reason:'EQ inquiries impact Truist and KeyBank approvals', priority:eqSeverity, daysToComplete:21, relatedBank:'Truist / KeyBank' });
    }

    // ── BANK RELATIONSHIP PREPARATION ────────────────────────────────────
    var relRuleEntries = window.BANK_RELATIONSHIP_RULES || {};
    var priorityBanks = ['chase','boa','wells-fargo','us-bank','pnc'];
    priorityBanks.forEach(function(bankId) {
      var rule = relRuleEntries[bankId];
      if (!rule) return;
      var hasRel = profile.hasRelationship && profile.hasRelationship(bankId);
      if (hasRel) return;
      if (!rule.businessCheckingRecommended && !rule.requiresRelationship) return;
      var depositNeeded = rule.recommendedDeposit;
      var status = 'needed';
      relationships.push({
        bankId: bankId,
        bankName: rule.bankName,
        bureau: rule.bureau,
        status: status,
        requiresRelationship: rule.requiresRelationship,
        businessCheckingRequired: rule.businessCheckingRequired,
        businessCheckingRecommended: rule.businessCheckingRecommended,
        depositAmount: depositNeeded,
        minimumDeposit: rule.minimumDeposit,
        seasoningDays: rule.seasoningDays,
        requiredTransactions: rule.requiredTransactions,
        brmRecommended: rule.brmRecommended,
        applicationMethod: rule.applicationMethod,
        relationshipNotes: rule.relationshipNotes,
        steps: rule.steps
      });
      if (rule.seasoningDays > 0) {
        tasks.push({ key:'fsg-rel-' + bankId, title:'Open ' + rule.bankName + ' business checking ($' + rule.minimumDeposit.toLocaleString() + ' min)', reason:rule.businessCheckingRequired ? 'REQUIRED for ' + rule.bankName + ' card approval' : 'Significantly improves ' + rule.bankName + ' approval odds and limits', priority:rule.requiresRelationship ? 'high' : 'medium', daysToComplete:rule.seasoningDays, relatedBank:rule.bankName });
      }
    });

    // ── BUSINESS BANKING HEALTH ───────────────────────────────────────────
    bankingHealth = this._scoreBankingHealth(profile);

    // ── FUNDING IMPACT SUMMARY ────────────────────────────────────────────
    if (util > 9) fundingImpact.push('Reducing utilization to below 9% may increase total approved limits by $10,000–$25,000 across all Round 1 and Round 2 banks.');
    if (expInq > 4) fundingImpact.push('Removing Experian inquiries before Round 1 preserves full Chase 5/24 quota and improves Citizens + Wells Fargo approval odds — estimated impact: $15,000–$30,000 in additional Round 1 approvals.');
    if (relationships.length > 0) fundingImpact.push('Opening recommended bank relationships (Chase, BofA, Wells Fargo, US Bank) before applying is projected to increase starting limits by $10,000–$20,000 per bank.');
    if (!hasStrongPersonalCard && !hasStrongTotalRevCard) fundingImpact.push('Adding one high-limit personal card ($10K+ limit) could add $5,000–$15,000 to available business card credit through improved credit profile depth.');
    if (fundingImpact.length === 0 && warnings.length === 0) fundingImpact.push('Profile is well-optimized. Proceed with recommended funding sequence to maximize approvals.');

    return {
      warnings:       warnings,
      actions:        actions.sort(function(a,b){ return a.priority - b.priority; }),
      relationships:  relationships,
      bankingHealth:  bankingHealth,
      fundingImpact:  fundingImpact,
      personalCardRecs: personalCardRecs,
      cashRecs:       cashRecs,
      creditAgeRecs:  creditAgeRecs,
      inquiryRecs:    inquiryRecs,
      tasks:          tasks,
      hasIssues:      warnings.length > 0
    };
  },

  _scoreBankingHealth: function(profile) {
    var d = (typeof getDashData === 'function') ? getDashData(profile.clientId) : {};
    var ob = (typeof getOnboardDataForClient === 'function') ? getOnboardDataForClient(profile.clientId) : {};

    var bizBanks   = (ob && ob.bizBanks) || [];
    var bizCards   = (ob && ob.bizCreditCards) || [];
    var monthlyRev = Number((ob && ob.monthlySales) || 0);
    var bizAge     = Number(profile.businessAge) || 0;

    var score = 0;
    var factors = {};
    var riskFlags = [];

    // Account presence (20 pts)
    if (bizBanks.length > 0)  { score += 15; factors.businessChecking = 'Has ' + bizBanks.length + ' business checking account' + (bizBanks.length > 1 ? 's' : ''); }
    else                       { factors.businessChecking = 'No business checking accounts on file'; riskFlags.push('No business banking accounts detected'); }
    if (bizCards.length > 0)   { score += 5;  factors.businessCards = 'Has ' + bizCards.length + ' business credit card' + (bizCards.length > 1 ? 's' : ''); }

    // Business age (20 pts)
    if (bizAge >= 3)      { score += 20; factors.businessAge = bizAge.toFixed(1) + ' years in business — strong'; }
    else if (bizAge >= 2) { score += 14; factors.businessAge = bizAge.toFixed(1) + ' years in business — good'; }
    else if (bizAge >= 1) { score += 8;  factors.businessAge = bizAge.toFixed(1) + ' years in business — building'; }
    else if (bizAge > 0)  { score += 3;  factors.businessAge = 'Under 1 year — early stage'; riskFlags.push('Business under 1 year old — limits bank options'); }
    else                   { factors.businessAge = 'No business age data on file'; }

    // Monthly revenue (20 pts)
    if (monthlyRev >= 20000)    { score += 20; factors.monthlyRevenue = '$' + monthlyRev.toLocaleString() + '/mo revenue — excellent'; }
    else if (monthlyRev >= 10000) { score += 14; factors.monthlyRevenue = '$' + monthlyRev.toLocaleString() + '/mo revenue — strong'; }
    else if (monthlyRev >= 5000)  { score += 8;  factors.monthlyRevenue = '$' + monthlyRev.toLocaleString() + '/mo revenue — acceptable'; }
    else if (monthlyRev > 0)      { score += 3;  factors.monthlyRevenue = '$' + monthlyRev.toLocaleString() + '/mo revenue — below recommended'; riskFlags.push('Monthly revenue below $5,000 recommended minimum'); }
    else                           { factors.monthlyRevenue = 'No monthly revenue on file'; riskFlags.push('Monthly revenue not on file — add to improve strategy accuracy'); }

    // Bank relationships (20 pts)
    var relCount = (profile.existingRelationships||[]).length;
    if (relCount >= 3)     { score += 20; factors.bankRelationships = relCount + ' bank relationships — strong network'; }
    else if (relCount >= 2){ score += 14; factors.bankRelationships = relCount + ' bank relationships'; }
    else if (relCount >= 1){ score += 7;  factors.bankRelationships = relCount + ' bank relationship — building'; }
    else                    { factors.bankRelationships = 'No bank relationships detected'; riskFlags.push('No existing bank relationships — open accounts before applying'); }

    // Credit score contribution to banking health (20 pts)
    var cscore = Number(profile.creditScore) || 0;
    if (cscore >= 760)      { score += 20; factors.creditScore = 'FICO ' + cscore + ' — excellent'; }
    else if (cscore >= 720) { score += 16; factors.creditScore = 'FICO ' + cscore + ' — very good'; }
    else if (cscore >= 680) { score += 10; factors.creditScore = 'FICO ' + cscore + ' — good'; }
    else if (cscore >= 640) { score += 5;  factors.creditScore = 'FICO ' + cscore + ' — below preferred'; }
    else if (cscore > 0)    { score += 0;  factors.creditScore = 'FICO ' + cscore + ' — needs improvement'; riskFlags.push('Credit score below 640 — limited bank options'); }
    else                     { factors.creditScore = 'No credit score on file'; }

    var status = score >= 80 ? 'Excellent' : score >= 60 ? 'Strong' : score >= 35 ? 'Building' : 'Weak';
    return { score:score, status:status, factors:factors, riskFlags:riskFlags, bizBanks:bizBanks, bizCards:bizCards, monthlyRevenue:monthlyRev };
  }
};

console.log('[Optimization Engine] Loaded — 5 optimization rules ready');
