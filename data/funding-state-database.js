// Evergreen Funding Sequence — State Database v3.0
// Source of truth: "Evergreen Funding Sequence & 0% Business Cards by State"
// ALL bureau assignments, data points, card names, and recon lines are sourced directly
// from the Evergreen Funding Sequence guide. Do not edit without updating the source guide.
// Loaded synchronously via <script> tag in admin.html — no fetch required.

window.FUNDING_DATABASE = {
  "_meta": {
    "version": "3.0",
    "updated": "2026-05-21",
    "source": "Evergreen Funding Sequence & 0% Business Cards by State",
    "description": "Complete 0% business credit card database — all 50 states, Evergreen-sourced bureau assignments and data points"
  },

  // ─── BANK MASTER DEFINITIONS ─────────────────────────────────────────────────
  // revenue/income = annual amounts in dollars (midpoint of Evergreen range)
  // revenueRange/incomeRange = display strings shown to admin
  // introPeriod = 0% APR term
  // reconLine = reconsideration phone number
  // accountRequired = true means client must have existing checking account
  // minBalance = minimum checking balance if account required (or recommended)
  // applicationMethod = online | branch | brm | online-or-brm | branch-or-brm | online-only

  "banks": {

    // ── NATIONAL — Experian pull ───────────────────────────────────────────────

    "amex": {
      "name": "American Express",
      "cards": ["AMEX Blue Business Cash", "AMEX Blue Business Plus"],
      "card": "AMEX Blue Business Cash / Blue Business Plus",
      "bureau": "Experian",
      "bureauNote": "Soft pull Experian when existing AMEX relationship — hard pull if no prior relationship",
      "introPeriod": "0% APR for 12 months",
      "revenueRange": "$325k – $350k",
      "incomeRange": "$115k – $125k",
      "revenue": 337500,
      "income": 120000,
      "monthlySpend": 21500,
      "monthlySpendNote": "Estimated Monthly Spend: $18k–$25k",
      "accountRequired": false,
      "minBalance": 0,
      "docsRequired": false,
      "applicationMethod": "online",
      "brmRecommended": false,
      "nationallyAvailable": true,
      "reconLine": "1-800-567-1083",
      "requirements": "Apply ONLY if client has existing AMEX personal card relationship — ensures soft pull and higher limits. No account required. Online only.",
      "notes": "Start the sequence with AMEX only when client has prior AMEX relationship. Without it, skip to Chase. Soft pull Experian = no inquiry impact. Highest potential limits of any issuer.",
      "riskLevel": "low",
      "whySelected": "Highest available limits. AMEX provides the best starting credit balances of any issuer. Existing relationship ensures soft Experian pull — zero inquiry cost. Apply first when relationship exists."
    },

    "chase": {
      "name": "Chase",
      "cards": ["Chase Ink Business Unlimited", "Chase Ink Business Cash"],
      "card": "Chase Ink Business Unlimited / Ink Business Cash",
      "bureau": "Experian",
      "bureauSecondary": "TransUnion",
      "bureauNote": "Hard pull BOTH Experian AND TransUnion — go after US Bank to protect TU",
      "introPeriod": "0% APR for 12 months",
      "revenueRange": "$550k – $600k",
      "incomeRange": "$150k – $305k",
      "revenue": 575000,
      "income": 227500,
      "monthlySpend": 25000,
      "monthlySpendNote": "Estimated Monthly Spend: $25k",
      "accountRequired": true,
      "minBalance": 2000,
      "docsRequired": false,
      "applicationMethod": "online",
      "brmRecommended": true,
      "nationallyAvailable": true,
      "reconLine": "1-800-453-9719",
      "requirements": "Chase checking account required with $2,000+ balance and account activity. Apply online. BRM relationship improves limits significantly.",
      "notes": "Most generous limits of any national bank. Inquiry-sensitive — go early. Pulls BOTH Experian AND TransUnion on hard pull. Must have Chase checking account with $2k+ and active transactions.",
      "riskLevel": "low",
      "whySelected": "Most generous limits available. Chase 5/24 rule and inquiry sensitivity mean applying early is critical. Dual EX+TU pull — go after US Bank to protect TransUnion count."
    },

    "pnc": {
      "name": "PNC Bank",
      "cards": ["PNC Visa Business Credit Card"],
      "card": "PNC Visa Business Credit Card",
      "bureau": "Experian",
      "bureauNote": "Hard pull Experian",
      "introPeriod": "0% APR for 13 months",
      "revenueRange": "$523k – $700k",
      "incomeRange": "$224k – $300k",
      "revenue": 611500,
      "income": 262000,
      "monthlySpend": 25000,
      "monthlySpendNote": "Estimated Monthly Spend: $25k",
      "accountRequired": true,
      "minBalance": 2000,
      "docsRequired": false,
      "applicationMethod": "online-or-brm",
      "brmRecommended": false,
      "nationallyAvailable": true,
      "reconLine": "1-800-474-2101",
      "requirements": "PNC checking account required with $2,000+ balance and account activity. Online or BRM.",
      "notes": "Best 0% term at 13 months among national banks. Pulls Experian. Checking account with $2k+ required.",
      "riskLevel": "low",
      "whySelected": "Best 0% intro term of any national EX bank at 13 months. Pulls Experian — pairs well with Round 2 after Truist handles EQ. Checking account required."
    },

    "wells-fargo": {
      "name": "Wells Fargo",
      "cards": ["Wells Fargo Signify Business Cash"],
      "card": "Wells Fargo Signify Business Cash",
      "bureau": "Experian",
      "bureauNote": "Hard pull Experian",
      "introPeriod": "0% APR for 12 months",
      "revenueRange": "$225k – $325k",
      "incomeRange": "$125k – $300k",
      "revenue": 275000,
      "income": 212500,
      "monthlySpend": 25000,
      "monthlySpendNote": "Estimated Monthly Spend: $25k",
      "accountRequired": false,
      "minBalance": 2000,
      "docsRequired": false,
      "applicationMethod": "online-or-brm",
      "brmRecommended": true,
      "nationallyAvailable": true,
      "reconLine": "1-800-967-9521",
      "requirements": "No account required, but $2k–$5k balance recommended. Online or BRM. In-branch visit improves approval odds and limits.",
      "notes": "Lowest revenue requirement of national EX banks ($225k–$325k range). Account not required but recommended with $2k–$5k. BRM or branch visit strongly improves outcome.",
      "riskLevel": "low",
      "whySelected": "Lowest revenue threshold of any national bank — accessible for lower-revenue clients. EX pull fits Round 2. No account required but recommended."
    },

    // ── NATIONAL — TransUnion pull ─────────────────────────────────────────────

    "us-bank": {
      "name": "US Bank",
      "cards": ["US Bank Business Triple Cash Rewards", "US Bank Business Shield"],
      "card": "US Bank Business Triple Cash Rewards / Business Shield",
      "bureau": "TransUnion",
      "bureauNote": "Hard pull TransUnion — go BEFORE Chase (Chase also pulls TU)",
      "introPeriod": "0% APR for 12 months",
      "revenueRange": "$625k – $750k",
      "incomeRange": "$250k – $350k",
      "revenue": 687500,
      "income": 300000,
      "monthlySpend": 25000,
      "monthlySpendNote": "Estimated Monthly Spend: $25k",
      "accountRequired": false,
      "minBalance": 0,
      "docsRequired": false,
      "applicationMethod": "online-or-brm",
      "brmRecommended": false,
      "nationallyAvailable": true,
      "reconLine": "1-800-282-8111",
      "requirements": "No account required. Online or BRM. Apply BEFORE Chase — both pull TransUnion, and US Bank is inquiry-sensitive.",
      "notes": "Go before Chase in the sequence because both pull TransUnion. Inquiry-sensitive. No checking account required per Evergreen guide. Decent limits.",
      "riskLevel": "low",
      "whySelected": "TransUnion pull — must apply BEFORE Chase since Chase also pulls TU. Inquiry-sensitive. No account required. Decent limits with clean TU bureau."
    },

    "boa": {
      "name": "Bank of America",
      "cards": ["BOA Business Customized Cash Rewards", "BOA Business Unlimited Cash Rewards", "BOA Business Travel Rewards", "BOA Platinum Plus Mastercard"],
      "card": "BOA Business Customized Cash / Unlimited Cash / Travel Rewards / Platinum Plus",
      "bureau": "TransUnion",
      "bureauNote": "Hard pull TransUnion — can get up to 5 cards in ONE day off ONE inquiry",
      "introPeriod": "0% APR for 7 months",
      "revenueRange": "$600k – $750k",
      "incomeRange": "$250k – $325k",
      "revenue": 675000,
      "income": 287500,
      "monthlySpend": 25000,
      "monthlySpendNote": "Net Profit on BRM app = 45%–60% of Revenue",
      "accountRequired": true,
      "minBalance": 5000,
      "docsRequired": false,
      "applicationMethod": "online-or-brm",
      "brmRecommended": true,
      "nationallyAvailable": true,
      "reconLine": "1-866-422-8089",
      "requirements": "BOA checking account required with $5,000+ balance and account activity. Online or BRM. BRM application uses 'Net Profit' = 45%–60% of Revenue.",
      "notes": "Can apply for up to 5 different cards in ONE day off ONE TransUnion inquiry. Checking account $5k+ required with activity. BRM data point: Net Profit = 45–60% of Revenue.",
      "riskLevel": "low",
      "whySelected": "TU pull. Unique advantage: up to 5 cards same day, one inquiry. Checking account required with $5k+. BRM strongly recommended for best limits."
    },

    "bmo": {
      "name": "BMO Harris",
      "cards": ["BMO Business Platinum Rewards Card", "BMO Business Platinum Card"],
      "card": "BMO Business Platinum Rewards (0% 9mo) / BMO Business Platinum (0% 12mo)",
      "bureau": "TransUnion",
      "bureauNote": "Hard pull TransUnion",
      "introPeriod": "0% APR for 9–12 months",
      "revenueRange": "$500k – $650k",
      "incomeRange": "$180k – $250k",
      "revenue": 575000,
      "income": 215000,
      "monthlySpend": 0,
      "monthlySpendNote": "",
      "accountRequired": true,
      "minBalance": 1000,
      "docsRequired": false,
      "applicationMethod": "branch-or-brm",
      "brmRecommended": false,
      "nationallyAvailable": true,
      "reconLine": "1-888-340-2265",
      "requirements": "BMO checking account required with $1,000+ balance. Wait 30 days after opening account. In Branch or BRM — no online application.",
      "notes": "TU pull. Account required $1k+, wait 30 days after opening. Two card options: Platinum Rewards (0% 9mo) and Platinum (0% 12mo). No online application.",
      "riskLevel": "low",
      "whySelected": "TU pull — adds to TransUnion coverage alongside BOA and US Bank. Account required $1k+ with 30-day seasoning. In-branch or BRM only."
    },

    // ── REGIONAL — Experian pull ───────────────────────────────────────────────

    "citizens": {
      "name": "Citizens Bank",
      "cards": ["Citizens Business Platinum Mastercard"],
      "card": "Citizens Business Platinum Mastercard",
      "bureau": "Experian",
      "bureauNote": "Soft pull Experian personal / hard pull Experian business — go EARLY for soft pull advantage",
      "introPeriod": "0% APR for 12 months",
      "revenueRange": "$750k – $925k",
      "incomeRange": "$180k – $230k",
      "revenue": 837500,
      "income": 205000,
      "monthlySpend": 0,
      "monthlySpendNote": "Net Revenue = 74% of Revenue",
      "accountRequired": false,
      "minBalance": 0,
      "docsRequired": false,
      "applicationMethod": "branch-or-brm",
      "brmRecommended": false,
      "nationallyAvailable": false,
      "reconLine": "1-888-798-4600",
      "requirements": "No account required. In Branch or BRM only — no online application. Soft pull Experian on personal, hard pull Experian on business. Apply early for soft pull advantage.",
      "notes": "Regional bank. Soft pull on personal Experian = generous limits without damaging EX inquiry count. BRM data point: Net Revenue = 74% of Revenue. In-branch or BRM only. Available in select states.",
      "riskLevel": "low",
      "whySelected": "Soft pull Experian — highest limits with minimum inquiry damage. Go early in sequence. No account required. Net Revenue = 74% of total revenue on app."
    },

    "flagstar": {
      "name": "Flagstar Bank",
      "cards": ["Flagstar Business Edition Visa Card (0% 18mo)", "Flagstar Absolute Rewards (0% 12mo)"],
      "card": "Flagstar Business Edition Visa (0% 18mo) / Absolute Rewards (0% 12mo)",
      "bureau": "Experian",
      "bureauNote": "Hard pull Experian",
      "introPeriod": "0% APR for 18 months (Business Edition Visa) / 12 months (Absolute Rewards)",
      "revenueRange": "$480k – $600k",
      "incomeRange": "N/A",
      "revenue": 540000,
      "income": 0,
      "monthlySpend": 0,
      "monthlySpendNote": "Checking Balance on app: $50k+",
      "accountRequired": false,
      "minBalance": 0,
      "docsRequired": false,
      "applicationMethod": "online",
      "brmRecommended": false,
      "nationallyAvailable": false,
      "reconLine": "1-888-757-1140",
      "requirements": "No account required. Online only. Use Checking Balance = $50k+ on application. Available in select states.",
      "notes": "BEST 0% TERM: 18 months on Business Edition Visa — longest 0% intro period of any bank in the sequence. If available in client's state, prioritize. EX pull. Online only.",
      "riskLevel": "medium",
      "whySelected": "Best 0% APR term available — 18 months. If available in client's state, always include. EX pull. No account required. Use Checking Balance $50k+ on app."
    },

    "fnbo": {
      "name": "FNBO (First National Bank of Omaha)",
      "cards": ["FNBO Evergreen Business Mastercard"],
      "card": "FNBO Evergreen Business Mastercard",
      "bureau": "Experian",
      "bureauNote": "Hard pull Experian",
      "introPeriod": "0% APR for 6 months",
      "revenueRange": "$480k – $600k",
      "incomeRange": "N/A",
      "revenue": 540000,
      "income": 0,
      "monthlySpend": 0,
      "monthlySpendNote": "Use zip code of a nearby branch to access online application",
      "accountRequired": false,
      "minBalance": 0,
      "docsRequired": false,
      "applicationMethod": "online",
      "brmRecommended": false,
      "nationallyAvailable": false,
      "reconLine": "1-888-757-1140",
      "requirements": "No account required. Online application — use zip code near a branch to access application. Available in select states.",
      "notes": "Regional Experian bank. Use zip code near a branch to unlock online application. 0% 6 months. Shorter 0% term than Flagstar — use Flagstar when available in same state.",
      "riskLevel": "low",
      "whySelected": "Additional EX bank for Round 2–3. No account required. Use local branch zip code to access online application. 0% 6 months."
    },

    // ── REGIONAL — TransUnion pull ─────────────────────────────────────────────

    "valley-bank": {
      "name": "Valley Bank",
      "cards": ["Valley Bank Visa Business Card"],
      "card": "Valley Bank Visa Business Card",
      "bureau": "TransUnion",
      "bureauNote": "Hard pull TransUnion",
      "introPeriod": "0% APR for 6 months",
      "revenueRange": "$375k – $425k",
      "incomeRange": "$150k – $200k",
      "revenue": 400000,
      "income": 175000,
      "monthlySpend": 0,
      "monthlySpendNote": "Credit Line Requested on app: $25k. Wait 30 days after opening account.",
      "accountRequired": true,
      "minBalance": 2000,
      "docsRequired": false,
      "applicationMethod": "branch",
      "brmRecommended": false,
      "nationallyAvailable": false,
      "reconLine": "1-800-522-4100",
      "requirements": "Valley Bank checking account required with $2,000+ balance. Wait 30 days after opening. In Branch only — no online application. Credit Line Requested = $25k on app.",
      "notes": "Regional TU bank. Account required $2k+, 30-day seasoning. In-branch only. Lower revenue requirement ($375k–$425k). Select states only.",
      "riskLevel": "low",
      "whySelected": "TU pull. Lower revenue threshold than BOA/US Bank. Good supplemental TU option after main sequence. Account required with $2k+ and 30-day wait."
    },

    "regions": {
      "name": "Regions Bank",
      "cards": ["Regions Business Enhanced Visa Card", "Regions Business Visa Card"],
      "card": "Regions Business Enhanced Visa (0% 12mo) / Business Visa (0% 12mo)",
      "bureau": "TransUnion",
      "bureauNote": "Hard pull TransUnion",
      "introPeriod": "0% APR for 12 months",
      "revenueRange": "$500k – $650k",
      "incomeRange": "$180k – $250k",
      "revenue": 575000,
      "income": 215000,
      "monthlySpend": 0,
      "monthlySpendNote": "Wait 30 days after opening account",
      "accountRequired": true,
      "minBalance": 1000,
      "docsRequired": false,
      "applicationMethod": "branch-or-brm",
      "brmRecommended": false,
      "nationallyAvailable": false,
      "reconLine": "1-800-734-4667",
      "requirements": "Regions checking account required with $1,000+ balance. Wait 30 days after opening. In Branch or BRM — no online application. Southeast and Midwest states.",
      "notes": "Regional TU bank. Southeast and Midwest states. Account $1k+, 30-day seasoning. Two card options both 0% 12 months. No online application.",
      "riskLevel": "low",
      "whySelected": "TU pull. Regional expansion for Southeast/Midwest clients. Account required $1k+ with 30-day wait. Two 0% 12-month card options."
    },

    "elan": {
      "name": "Elan Financial (local bank partner)",
      "cards": ["Multiple 0% APR cards (6–18 months) via Elan-underwritten local bank"],
      "card": "Elan Financial Underwritten Card (0% APR 6–18 months)",
      "bureau": "TransUnion",
      "bureauNote": "Hard pull TransUnion — Elan is the underwriter for all partner banks. One application covers all.",
      "introPeriod": "0% APR for 6–18 months",
      "revenueRange": "$300k – $400k",
      "incomeRange": "$150k – $225k",
      "revenue": 350000,
      "income": 187500,
      "monthlySpend": 25000,
      "monthlySpendNote": "Estimated Monthly Spend: $25k",
      "accountRequired": false,
      "minBalance": 0,
      "docsRequired": false,
      "applicationMethod": "online-or-branch",
      "brmRecommended": false,
      "nationallyAvailable": false,
      "reconLine": "1-866-552-8855",
      "requirements": "No account required. Elan Financial underwrites for local/regional banks — apply at ONE bank only (same application process, same underwriting). Online or In Branch.",
      "notes": "Elan Financial underwrites cards for local banks across the country. All have identical application, identical underwriting, identical data points. Apply at ONE Elan bank per state — they all use the same system. TU pull.",
      "riskLevel": "low",
      "whySelected": "TU pull. Lowest revenue requirement of any TransUnion bank ($300k–$400k). No account required. Elan-underwritten = consistent approval criteria across all partner banks."
    },

    // ── REGIONAL — Equifax pull ────────────────────────────────────────────────

    "truist": {
      "name": "Truist",
      "cards": ["Truist Business Card", "Truist Business Cash Rewards"],
      "card": "Truist Business Card (0% 12mo) / Truist Business Cash Rewards (0% 9mo)",
      "bureau": "Equifax",
      "bureauNote": "Hard pull Equifax — strategic: diversifies bureau inquiries away from EX/TU stack. Up to 2 cards per day.",
      "introPeriod": "0% APR for 12 months (Business Card) / 9 months (Cash Rewards)",
      "revenueRange": "$500k – $650k",
      "incomeRange": "$225k – $300k",
      "revenue": 575000,
      "income": 262500,
      "monthlySpend": 0,
      "monthlySpendNote": "",
      "accountRequired": false,
      "minBalance": 0,
      "docsRequired": false,
      "applicationMethod": "online-or-brm",
      "brmRecommended": false,
      "nationallyAvailable": false,
      "reconLine": "1-800-878-2265",
      "requirements": "No account required. Online or BRM. Up to 2 cards in one day. Equifax pull — strategic for clients with high EX/TU inquiry counts. Southeast and Mid-Atlantic states.",
      "notes": "Equifax pull = bureau diversification. When EX and TU inquiry counts are climbing, Truist keeps EQ clean. Up to 2 cards per day from one inquiry. No account required.",
      "riskLevel": "low",
      "whySelected": "Equifax pull — diversifies bureau inquiries when EX and TU are getting stacked. Up to 2 cards per day, one EQ inquiry. No account required. Strategic EQ card."
    },

    "keybank": {
      "name": "KeyBank",
      "cards": ["KeyBank Business Card"],
      "card": "KeyBank Business Card",
      "bureau": "Equifax",
      "bureauNote": "Hard pull Equifax",
      "introPeriod": "0% APR for 6 months",
      "revenueRange": "$150k – $250k",
      "incomeRange": "$100k – $150k",
      "revenue": 200000,
      "income": 125000,
      "monthlySpend": 0,
      "monthlySpendNote": "Credit Line/Limit Requested on app: $25k",
      "accountRequired": true,
      "minBalance": 1000,
      "docsRequired": false,
      "applicationMethod": "branch-or-brm",
      "brmRecommended": false,
      "nationallyAvailable": false,
      "reconLine": "1-888-539-4249",
      "requirements": "KeyBank checking account required with $1,000+ balance. In Branch or BRM — no online application. Credit Line Requested = $25k on app. Lowest revenue requirement of any bank.",
      "notes": "EQ pull. Lowest revenue requirement of all banks ($150k–$250k). Good for lower-revenue clients. Account $1k+ required. In-branch or BRM only. Select states.",
      "riskLevel": "low",
      "whySelected": "EQ pull. Lowest revenue threshold of any bank in the sequence ($150k–$250k range). Great for lower-revenue clients with clean EQ bureau. Account required $1k+."
    }

  }, // end banks

  // ─── STATE DATA ───────────────────────────────────────────────────────────────
  // experian: banks that pull EX available in this state
  // transunion: banks that pull TU available in this state (national only; elan listed separately)
  // equifax: banks that pull EQ available in this state
  // regional: non-national banks (used for regional bank promotion logic)
  // elan: ["elan"] if state has Elan-underwritten banks
  // elanBanks: specific Elan-partner institution names for this state (display only)

  "states": {

    "AL": {
      "experian":   ["amex","chase","pnc","wells-fargo","citizens"],
      "transunion": ["us-bank","boa","bmo","valley-bank","regions"],
      "equifax":    ["truist"],
      "regional":   ["citizens","valley-bank","regions","truist"],
      "elan":       ["elan"],
      "elanBanks":  ["TraditionsBank","Bryant Bank","The First Bank","Smart Bank","Progress Bank & Trust"]
    },

    "AK": {
      "experian":   ["amex","chase","pnc","wells-fargo"],
      "transunion": ["us-bank","boa","bmo"],
      "equifax":    ["keybank"],
      "regional":   ["keybank"],
      "elan":       ["elan"],
      "elanBanks":  ["Denali State Bank"]
    },

    "AZ": {
      "experian":   ["amex","chase","pnc","wells-fargo","flagstar"],
      "transunion": ["us-bank","boa","bmo","valley-bank"],
      "equifax":    [],
      "regional":   ["flagstar","valley-bank"],
      "elan":       ["elan"],
      "elanBanks":  ["Desert Financial","First Convenience Bank","Parkway Bank","BOK Financial","Banterra Bank","Alerus Financial"]
    },

    "AR": {
      "experian":   ["amex","chase","pnc","wells-fargo"],
      "transunion": ["us-bank","boa","bmo","regions"],
      "equifax":    ["truist"],
      "regional":   ["regions","truist"],
      "elan":       ["elan"],
      "elanBanks":  ["Southern Bank"]
    },

    "CA": {
      "experian":   ["amex","chase","pnc","wells-fargo","flagstar"],
      "transunion": ["us-bank","boa","bmo","valley-bank"],
      "equifax":    [],
      "regional":   ["flagstar","valley-bank"],
      "elan":       ["elan"],
      "elanBanks":  ["LA Financial Credit Union","Flagship Bank","Mechanics Bank","Westamerica Bank","Citizens Business Bank","Umpqua Bank","Bank of the Sierra","Bank of Marin","Banc of California","Farmers & Merchants Bank","Central Valley Community Bank","Exchange Bank","HomeStreet Bank","Poppy Bank","Royal Business Bank"]
    },

    "CO": {
      "experian":   ["amex","chase","pnc","wells-fargo","fnbo"],
      "transunion": ["us-bank","boa","bmo"],
      "equifax":    ["keybank"],
      "regional":   ["fnbo","keybank"],
      "elan":       ["elan"],
      "elanBanks":  ["Community Banks of Colorado","TBK Bank","Independent Bank","BOK Financial"]
    },

    "CT": {
      "experian":   ["amex","chase","pnc","wells-fargo","citizens","flagstar"],
      "transunion": ["us-bank","boa","bmo"],
      "equifax":    ["keybank"],
      "regional":   ["citizens","flagstar","keybank"],
      "elan":       ["elan"],
      "elanBanks":  ["Union Savings Bank","Webster Bank","Liberty Bank","Ion Bank","Savings Bank of Danbury","First County Bank","Thomaston Savings Bank","Chelsea Groton Bank","Dime Bank","Bankwell Bank","Centreville Bank","Torrington Savings Bank","Hometown Bank","Eastern Connecticut Savings Bank","Westfield Bank","NBT Bank"]
    },

    "DE": {
      "experian":   ["amex","chase","pnc","wells-fargo","citizens"],
      "transunion": ["us-bank","boa","bmo"],
      "equifax":    [],
      "regional":   ["citizens"],
      "elan":       ["elan"],
      "elanBanks":  ["Community Bank of Delaware","Artisans' Bank","Fulton Bank","Provident State Bank"]
    },

    "FL": {
      "experian":   ["amex","chase","pnc","wells-fargo","citizens","flagstar"],
      "transunion": ["us-bank","boa","bmo","valley-bank","regions"],
      "equifax":    ["truist"],
      "regional":   ["citizens","flagstar","valley-bank","regions","truist"],
      "elan":       ["elan"],
      "elanBanks":  ["First State Bank","SouthState Bank","Seacoast National Bank","TrustCo Bank","Ameris Bank","Capital City Bank","The First Bank","Seaside National Bank & Trust","First State Bank of Florida"]
    },

    "GA": {
      "experian":   ["amex","chase","pnc","wells-fargo","citizens"],
      "transunion": ["us-bank","boa","bmo","valley-bank","regions"],
      "equifax":    ["truist"],
      "regional":   ["citizens","valley-bank","regions","truist"],
      "elan":       ["elan"],
      "elanBanks":  ["Ameris Bank","United Community Bank","Renasant Bank","SouthState Bank","Colony Bank","The Heritage Bank","The First Bank","Capital City Bank","Hyperion Bank","Home Trust Bank"]
    },

    "HI": {
      "experian":   ["amex","chase","pnc","wells-fargo"],
      "transunion": ["us-bank","boa","bmo"],
      "equifax":    [],
      "regional":   [],
      "elan":       ["elan"],
      "elanBanks":  ["American Savings Bank","Central Pacific Bank","Territorial Savings Bank","HomeStreet Bank","Commonwealth Business Bank","Royal Business Bank"]
    },

    "ID": {
      "experian":   ["amex","chase","pnc","wells-fargo"],
      "transunion": ["us-bank","boa","bmo","valley-bank"],
      "equifax":    ["keybank"],
      "regional":   ["keybank","valley-bank"],
      "elan":       ["elan"],
      "elanBanks":  ["First Federal Savings Bank","Umpqua Bank","Idaho First Bank","Twin River Bank","Idaho Trust Bank"]
    },

    "IL": {
      "experian":   ["amex","chase","pnc","wells-fargo","fnbo"],
      "transunion": ["us-bank","boa","bmo","valley-bank","regions"],
      "equifax":    [],
      "regional":   ["fnbo","valley-bank","regions"],
      "elan":       ["elan"],
      "elanBanks":  ["Midland State Bank","Heartland Credit Union","First American Bank","Old Second National Bank","Busey Bank","Midland States Bank","Parkway Bank","Banterra Bank","Marquette Bank","BankFinancial","Peoples National Bank","TBK Bank","FCB Banks","First National Bank of Waterloo","Dieterich Bank"]
    },

    "IN": {
      "experian":   ["amex","chase","pnc","wells-fargo","flagstar"],
      "transunion": ["us-bank","boa","bmo"],
      "equifax":    ["keybank"],
      "regional":   ["flagstar","keybank"],
      "elan":       ["elan"],
      "elanBanks":  ["The Farmers Bank","First Merchants Bank","1st Source Bank","Lake City Bank","Horizon Bank","Star Financial Bank","The Farmers & Merchants State Bank","United Fidelity Bank","Civista Bank","WesBanco Bank","Campbell & Fetter Bank"]
    },

    "IA": {
      "experian":   ["amex","chase","pnc","wells-fargo","fnbo"],
      "transunion": ["us-bank","boa","bmo","regions"],
      "equifax":    [],
      "regional":   ["fnbo","regions"],
      "elan":       ["elan"],
      "elanBanks":  ["Exchange Bank","CBI Bank & Trust","Rolling Hills Bank & Trust","Community Savings Bank","City State Bank"]
    },

    "KS": {
      "experian":   ["amex","chase","pnc","wells-fargo","fnbo"],
      "transunion": ["us-bank","boa","bmo"],
      "equifax":    [],
      "regional":   ["fnbo"],
      "elan":       ["elan"],
      "elanBanks":  ["Emprise Bank","Intrust Bank","Country Club Bank","Bank Midwest","Farmers Bank & Trust"]
    },

    "KY": {
      "experian":   ["amex","chase","pnc","wells-fargo"],
      "transunion": ["us-bank","boa","bmo","regions"],
      "equifax":    ["truist"],
      "regional":   ["regions","truist"],
      "elan":       ["elan"],
      "elanBanks":  ["South Central Bank","City National Bank","First Kentucky Bank","United Southern Bank"]
    },

    "LA": {
      "experian":   ["amex","chase","pnc","wells-fargo"],
      "transunion": ["us-bank","boa","bmo","regions"],
      "equifax":    [],
      "regional":   ["regions"],
      "elan":       ["elan"],
      "elanBanks":  ["The First Bank"]
    },

    "ME": {
      "experian":   ["amex","chase","pnc","wells-fargo"],
      "transunion": ["us-bank","boa","bmo"],
      "equifax":    ["keybank"],
      "regional":   ["keybank"],
      "elan":       ["elan"],
      "elanBanks":  ["Camden National Bank","Bar Harbor Bank & Trust","First National Bank","Kennebunk Savings Bank","Skowhegan Savings Bank","Androscoggin Bank","Maine Community Bank","Northeast Bank","Franklin Savings Bank","Auburn Savings Bank","NBT Bank"]
    },

    "MD": {
      "experian":   ["amex","chase","pnc","wells-fargo","citizens"],
      "transunion": ["us-bank","boa","bmo"],
      "equifax":    ["truist"],
      "regional":   ["citizens","truist"],
      "elan":       ["elan"],
      "elanBanks":  ["Sandy Spring Bank","WesBanco Bank","Provident State Bank","Rosedale Federal S&L","Middletown Valley Bank","EagleBank","Orrstown Bank","PeoplesBank","Congressional Bank"]
    },

    "MA": {
      "experian":   ["amex","chase","pnc","wells-fargo","citizens"],
      "transunion": ["us-bank","boa","bmo"],
      "equifax":    [],
      "regional":   ["citizens"],
      "elan":       ["elan"],
      "elanBanks":  ["Rockland Trust","Eastern Bank","Salem Five Cents Savings Bank","Middlesex Savings Bank","HarborOne Bank","Westfield Bank","Enterprise Bank","Webster Bank","Cambridge Trust Company","North Shore Bank","Lowell Five Cent Savings Bank","Bluestone Bank","BankFive","Easthampton Savings Bank","Hometown Bank","Dedham Savings","East Cambridge Savings Bank"]
    },

    "MI": {
      "experian":   ["amex","chase","pnc","wells-fargo","citizens","flagstar"],
      "transunion": ["us-bank","boa","bmo"],
      "equifax":    ["keybank"],
      "regional":   ["citizens","flagstar","keybank"],
      "elan":       ["elan"],
      "elanBanks":  ["County National Bank","Independent Bank","First Merchants Bank","Horizon Bank","Macatawa Bank","Sturgis Bank & Trust","First State Bank","United Bank of Michigan","Eastern Michigan Bank","Shelby State Bank","Northstar Bank","Superior National Bank","Commercial Bank","Citizens National Bank of Cheboygan","1st Source Bank","Range Bank","Honor Bank","Oxford Bank","Highpoint Community Bank","Eaton Community Bank"]
    },

    "MN": {
      "experian":   ["amex","chase","pnc","wells-fargo","flagstar","fnbo"],
      "transunion": ["us-bank","boa","bmo"],
      "equifax":    [],
      "regional":   ["flagstar","fnbo"],
      "elan":       ["elan"],
      "elanBanks":  ["Bremer Bank","Frandsen Bank & Trust","Premier Bank","MidCountry Bank","RiverWood Bank","CCF Bank","United Prairie Bank","Think Mutual Bank","Border Bank","Pioneer Bank","Kensington Bank","Cornerstone State Bank","Sterling State Bank","Midwest Bank"]
    },

    "MS": {
      "experian":   ["amex","chase","pnc","wells-fargo"],
      "transunion": ["us-bank","boa","bmo","regions"],
      "equifax":    ["truist"],
      "regional":   ["regions","truist"],
      "elan":       ["elan"],
      "elanBanks":  ["Renasant Bank","Community Bank","The First Bank","Planters Bank & Trust","Merchants & Marine Bank","Merchants and Planters Bank"]
    },

    "MO": {
      "experian":   ["amex","chase","pnc","wells-fargo","fnbo"],
      "transunion": ["us-bank","boa","bmo","regions"],
      "equifax":    [],
      "regional":   ["fnbo","regions"],
      "elan":       ["elan"],
      "elanBanks":  ["Southern Bank","Bank Midwest","HNB National Bank","Mid-Missouri Bank","Wood & Huston Bank","Montgomery Bank","Country Club Bank","Midland States Bank","Town & Country Bank","Nodaway Valley Bank","Sullivan Bank"]
    },

    "MT": {
      "experian":   ["amex","chase","pnc","wells-fargo"],
      "transunion": ["us-bank","boa","bmo"],
      "equifax":    [],
      "regional":   [],
      "elan":       ["elan"],
      "elanBanks":  ["American Bank","Little Horn State Bank","Unity Bank","First Federal Bank & Trust","First Citizens Bank of Butte"]
    },

    "NE": {
      "experian":   ["amex","chase","pnc","wells-fargo","fnbo"],
      "transunion": ["us-bank","boa","bmo"],
      "equifax":    [],
      "regional":   ["fnbo"],
      "elan":       ["elan"],
      "elanBanks":  ["Security First Bank","Five Points Bank","Home Federal S&L","Exchange Bank","MNB Bank","Access Bank","Waypoint Bank"]
    },

    "NV": {
      "experian":   ["amex","chase","pnc","wells-fargo","flagstar"],
      "transunion": ["us-bank","boa","bmo","valley-bank"],
      "equifax":    [],
      "regional":   ["flagstar","valley-bank"],
      "elan":       ["elan"],
      "elanBanks":  ["Valley Bank of Nevada","Umpqua Bank","Royal Business Bank"]
    },

    "NH": {
      "experian":   ["amex","chase","pnc","wells-fargo","citizens"],
      "transunion": ["us-bank","boa","bmo"],
      "equifax":    [],
      "regional":   ["citizens"],
      "elan":       ["elan"],
      "elanBanks":  ["Bank of New Hampshire","Bar Harbor Bank & Trust","Northway Bank","Enterprise Bank","Eastern Bank","Kennebunk Savings Bank","Newburyport Five Cents Savings Bank","Primary Bank","NBT Bank","Camden National Bank","Lowell Five Cent Savings Bank","North Shore Bank","Haverhill Bank"]
    },

    "NJ": {
      "experian":   ["amex","chase","pnc","wells-fargo","citizens","flagstar"],
      "transunion": ["us-bank","boa","bmo","valley-bank"],
      "equifax":    ["truist"],
      "regional":   ["citizens","flagstar","valley-bank","truist"],
      "elan":       ["elan"],
      "elanBanks":  ["Provident Bank","Lakeland Bank","Kearny Bank","OceanFirst Bank","Spencer Savings Bank","Peapack-Gladstone Bank","The Bank of Princeton","Blue Foundry Bank","Unity Bank","Manasquan Bank","First Bank","The First National Bank of Elmer","First Hope Bank","Bogota Savings Bank"]
    },

    "NM": {
      "experian":   ["amex","chase","pnc","wells-fargo"],
      "transunion": ["us-bank","boa","bmo"],
      "equifax":    [],
      "regional":   [],
      "elan":       ["elan"],
      "elanBanks":  ["First Convenience Bank","Bank of Albuquerque","The Citizens Bank","Four Corners Community Bank","Hillcrest Bank","TBK Bank"]
    },

    "NY": {
      "experian":   ["amex","chase","pnc","wells-fargo","citizens","flagstar"],
      "transunion": ["us-bank","boa","bmo","valley-bank"],
      "equifax":    ["keybank"],
      "regional":   ["citizens","flagstar","valley-bank","keybank"],
      "elan":       ["elan"],
      "elanBanks":  ["Jeff Bank","NBT Bank","Trust Co Bank","Webster Bank","Dime Community Bank","Five Star Bank","Tompkins Community Bank","Flushing Bank","Ulster Savings Bank","Orange Bank & Trust","PCSB Bank"]
    },

    "NC": {
      "experian":   ["amex","chase","pnc","wells-fargo","flagstar"],
      "transunion": ["us-bank","boa","bmo","valley-bank","regions"],
      "equifax":    ["truist"],
      "regional":   ["flagstar","valley-bank","regions","truist"],
      "elan":       ["elan"],
      "elanBanks":  ["Carolina Bank","United Community Bank","HomeTrust Bank","SouthState Bank","Towne Bank","Farmers & Merchants Bank","Atlantic Union Bank"]
    },

    "ND": {
      "experian":   ["amex","chase","pnc","wells-fargo","fnbo"],
      "transunion": ["us-bank","boa","bmo"],
      "equifax":    [],
      "regional":   ["fnbo"],
      "elan":       ["elan"],
      "elanBanks":  ["Cornerstone Bank","First United Bank","Alerus Financial","Ramsey National Bank","Kirkwood Bank","Union State Bank","Citizens State Bank of Lankin","VISIONBank"]
    },

    "OH": {
      "experian":   ["amex","chase","pnc","wells-fargo","citizens","flagstar"],
      "transunion": ["us-bank","boa","bmo"],
      "equifax":    ["keybank"],
      "regional":   ["citizens","flagstar","keybank"],
      "elan":       ["elan"],
      "elanBanks":  ["Fahey Bank","Park National Bank","Premier Bank","WesBanco Bank","LCNB National Bank","Civista Bank","The Farmers & Merchants State Bank","Unified Bank","The Union Bank Company","First State Bank","Wayne Savings Community Bank","Old Fort Banking","First Merchants Bank","Mechanics Bank"]
    },

    "OK": {
      "experian":   ["amex","chase","pnc","wells-fargo"],
      "transunion": ["us-bank","boa","bmo"],
      "equifax":    [],
      "regional":   [],
      "elan":       ["elan"],
      "elanBanks":  ["BancFirst","Bank of Oklahoma","City National Bank and Trust","First Bank & Trust Co.","Intrust Bank"]
    },

    "OR": {
      "experian":   ["amex","chase","pnc","wells-fargo"],
      "transunion": ["us-bank","boa","bmo","valley-bank"],
      "equifax":    ["keybank"],
      "regional":   ["keybank","valley-bank"],
      "elan":       ["elan"],
      "elanBanks":  ["Columbia State Bank","Umpqua Bank","HomeStreet Bank","Peoples Bank","First Financial Northwest Bank","Riverview Community Bank","SaviBank","Olympia Federal Savings","Commencement Bank","Twin River Bank"]
    },

    "PA": {
      "experian":   ["amex","chase","pnc","wells-fargo","citizens"],
      "transunion": ["us-bank","boa","bmo"],
      "equifax":    [],
      "regional":   ["citizens"],
      "elan":       ["elan"],
      "elanBanks":  ["Univest Bank","Fulton Bank","Mid Penn Bank","WesBanco Bank","NBT Bank","Peoples Security Bank & Trust","PeoplesBank","Penn Community Bank","Orrstown Bank","Fidelity Deposit & Discount Bank","First Keystone Community Bank","AmeriServ Financial Bank","Jersey Shore State Bank"]
    },

    "RI": {
      "experian":   ["amex","chase","pnc","wells-fargo","citizens"],
      "transunion": ["us-bank","boa","bmo"],
      "equifax":    [],
      "regional":   ["citizens"],
      "elan":       ["elan"],
      "elanBanks":  ["The Washington Trust Company","BankNewport","HarborOne Bank","Centreville Bank","Webster Bank","Bristol County Savings Bank","BankFive","Dime Bank"]
    },

    "SC": {
      "experian":   ["amex","chase","pnc","wells-fargo"],
      "transunion": ["us-bank","boa","bmo","regions"],
      "equifax":    ["truist"],
      "regional":   ["truist","regions"],
      "elan":       ["elan"],
      "elanBanks":  ["Carolina Bank","SouthState Bank","United Community Bank","Anderson Brothers Bank","Carolina Bank & Trust","Ameris Bank","Countybank","Coastal Carolina National Bank","The Commercial Bank","Park National Bank"]
    },

    "SD": {
      "experian":   ["amex","chase","pnc","wells-fargo","fnbo"],
      "transunion": ["us-bank","boa","bmo"],
      "equifax":    [],
      "regional":   ["fnbo"],
      "elan":       ["elan"],
      "elanBanks":  ["American Bank & Trust","Pioneer Bank & Trust","Liberty National Bank","Merchants State Bank","Security First Bank"]
    },

    "TN": {
      "experian":   ["amex","chase","pnc","wells-fargo","citizens"],
      "transunion": ["us-bank","boa","bmo","valley-bank","regions"],
      "equifax":    ["truist"],
      "regional":   ["citizens","valley-bank","regions","truist"],
      "elan":       ["elan"],
      "elanBanks":  ["United Community Bank","First Citizens National Bank","SmartBank","Home Federal Bank","First Farmers & Merchants Bank","Citizens Bank of Lafayette","Bank of Tennessee","F&M Bank","Renasant Bank","SouthEast Bank","Volunteer State Bank","Independent Bank"]
    },

    "TX": {
      "experian":   ["amex","chase","pnc","wells-fargo","fnbo"],
      "transunion": ["us-bank","boa","bmo","valley-bank","regions"],
      "equifax":    ["truist"],
      "regional":   ["fnbo","valley-bank","regions","truist"],
      "elan":       ["elan"],
      "elanBanks":  ["Bank of Texas","First Convenience Bank","First Financial Bank","PlainsCapital Bank","Southside Bank","VeraBank","Lone Star National Bank","Broadway National Bank","American Momentum Bank"]
    },

    "UT": {
      "experian":   ["amex","chase","pnc","wells-fargo"],
      "transunion": ["us-bank","boa","bmo"],
      "equifax":    ["keybank"],
      "regional":   ["keybank"],
      "elan":       ["elan"],
      "elanBanks":  ["Zions Bank","Bank of Utah","Rock Canyon Bank","Hillcrest Bank"]
    },

    "VT": {
      "experian":   ["amex","chase","pnc","wells-fargo","citizens"],
      "transunion": ["us-bank","boa","bmo"],
      "equifax":    ["keybank"],
      "regional":   ["citizens","keybank"],
      "elan":       ["elan"],
      "elanBanks":  ["Bar Harbor Bank & Trust","NBT Bank","TrustCo Bank"]
    },

    "VA": {
      "experian":   ["amex","chase","pnc","wells-fargo","citizens"],
      "transunion": ["us-bank","boa","bmo","valley-bank"],
      "equifax":    ["truist"],
      "regional":   ["citizens","valley-bank","truist"],
      "elan":       ["elan"],
      "elanBanks":  ["Carolina Bank","Atlantic Union Bank","Towne Bank","Virginia National Bank","City National Bank","Sandy Spring Bank","Fulton Bank","EagleBank"]
    },

    "WA": {
      "experian":   ["amex","chase","pnc","wells-fargo"],
      "transunion": ["us-bank","boa","bmo"],
      "equifax":    ["keybank"],
      "regional":   ["keybank"],
      "elan":       ["elan"],
      "elanBanks":  ["Columbia State Bank","Umpqua Bank","HomeStreet Bank","Peoples Bank","First Financial Northwest Bank","Riverview Community Bank","SaviBank","Olympia Federal Savings","Commencement Bank","Twin River Bank"]
    },

    "WV": {
      "experian":   ["amex","chase","pnc","wells-fargo"],
      "transunion": ["us-bank","boa","bmo"],
      "equifax":    ["truist"],
      "regional":   ["truist"],
      "elan":       ["elan"],
      "elanBanks":  ["City National Bank","WesBanco Bank","MVB Bank","BCBank","Whitesville State Bank","Bank of Mingo","Community Bank"]
    },

    "WI": {
      "experian":   ["amex","chase","pnc","wells-fargo","flagstar"],
      "transunion": ["us-bank","boa","bmo"],
      "equifax":    [],
      "regional":   ["flagstar"],
      "elan":       ["elan"],
      "elanBanks":  ["Bank of Luxemburg","North Shore Bank","Tri City National Bank","Johnson Bank","Royal Bank","Peoples State Bank","WaterStone Bank","Bank Five Nine","River Bank","Waukesha State Bank","The First National Bank and Trust","Dairy State Bank","Forward Bank","Community First Bank","Prevail Bank","Westbury Bank","IncredibleBank","Great Midwest Bank","Bremer Bank"]
    },

    "WY": {
      "experian":   ["amex","chase","pnc","wells-fargo","fnbo"],
      "transunion": ["us-bank","boa","bmo"],
      "equifax":    [],
      "regional":   ["fnbo"],
      "elan":       ["elan"],
      "elanBanks":  ["Bank of Jackson Hole","Hilltop National Bank","Rolling Hills Bank & Trust","NebraskaLand Bank"]
    },

    "DC": {
      "experian":   ["amex","chase","pnc","wells-fargo","citizens"],
      "transunion": ["us-bank","boa","bmo"],
      "equifax":    ["truist"],
      "regional":   ["citizens","truist"],
      "elan":       ["elan"],
      "elanBanks":  ["Sandy Spring Bank","EagleBank","Congressional Bank","National Capital Bank"]
    }

  } // end states
};
