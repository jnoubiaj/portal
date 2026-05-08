// Auto-generated from funding-state-database.json — do not edit manually
// Loaded synchronously via <script> tag in admin.html — no fetch required
window.FUNDING_DATABASE = {
  "_meta": {
    "version": "2.0",
    "updated": "2026-05-08",
    "description": "0% Business Credit Card funding database by state — Experian / TransUnion / Equifax / Regional / Elan"
  },
  "banks": {
    "chase": {
      "name": "Chase",
      "card": "Ink Business Cash / Ink Business Unlimited",
      "bureau": "Experian",
      "revenue": 50000,
      "income": 3000,
      "monthlySpend": 5000,
      "requirements": "Under Chase 5/24 rule; no Chase biz card opened in last 24 months",
      "notes": "Best 0% intro APR; apply online or in branch; 3+ years in business preferred",
      "riskLevel": "low",
      "whySelected": "Highest 0% business card success rate of any national issuer. Apply first while Experian inquiry count is clean — Chase's 5/24 rule is inquiry-sensitive."
    },
    "barclays": {
      "name": "Barclays",
      "card": "Barclays Business Rewards Mastercard",
      "bureau": "Experian",
      "revenue": 50000,
      "income": 3000,
      "monthlySpend": 3000,
      "requirements": "Good Experian profile; 2+ years in business",
      "notes": "Pulls Experian primary; good for EX-heavy strategy",
      "riskLevel": "low",
      "whySelected": "EX-only pull — apply same day as Chase for zero additional inquiry impact. Barclays and Chase combine for maximum Round 1 EX coverage in a single day."
    },
    "fnbo": {
      "name": "FNBO",
      "card": "FNBO Business Edition Visa",
      "bureau": "Experian",
      "revenue": 50000,
      "income": 2500,
      "monthlySpend": 3000,
      "requirements": "Select states only; good Experian profile",
      "notes": "First National Bank of Omaha; pulls Experian",
      "riskLevel": "low",
      "whySelected": "Same-day application with Chase and Barclays — all three pull Experian. Stacking all EX banks on one day counts as a single inquiry-event, maximizing coverage at minimum bureau cost."
    },
    "boa": {
      "name": "Bank of America",
      "card": "Business Advantage Unlimited Cash Rewards",
      "bureau": "TransUnion",
      "revenue": 50000,
      "income": 2500,
      "monthlySpend": 3000,
      "requirements": "Preferred Rewards for Business membership helps; 2+ years business",
      "notes": "Pulls TransUnion primarily; existing BofA relationship improves odds significantly",
      "riskLevel": "low",
      "whySelected": "TU-only pull keeps Experian and Equifax clean for other rounds. Existing BofA customers are approved at 2–3× the base rate with materially higher credit limits."
    },
    "capital-one": {
      "name": "Capital One",
      "card": "Spark Cash Select for Business",
      "bureau": "Equifax + TransUnion + Experian",
      "revenue": 36000,
      "income": 2000,
      "monthlySpend": 2000,
      "requirements": "Pulls all 3 bureaus — counts as 3 separate inquiries; apply LAST in sequence",
      "notes": "Apply last in sequence; bureau diversity killer — save for when other inquiries are low",
      "riskLevel": "medium",
      "whySelected": "Apply LAST — Capital One pulls all 3 bureaus simultaneously, consuming inquiry budget on EX, TU, and EQ at once. Strong 2% cash back. Only use after all other bureau-specific banks are applied."
    },
    "navy-federal": {
      "name": "Navy Federal",
      "card": "Navy Federal Business Visa",
      "bureau": "TransUnion",
      "revenue": 36000,
      "income": 2500,
      "monthlySpend": 2000,
      "requirements": "Military membership required (veteran, active duty, or eligible family member)",
      "notes": "Excellent approval odds for members; pulls TransUnion only; high limits",
      "riskLevel": "low",
      "whySelected": "Best approval odds in its class for eligible members. TU-only pull preserves EX and EQ for other rounds. NFCU underwrites with a member-first philosophy — approval rates far exceed national banks."
    },
    "citizens": {
      "name": "Citizens Bank",
      "card": "Citizens Business Platinum Mastercard",
      "bureau": "TransUnion",
      "revenue": 50000,
      "income": 2500,
      "monthlySpend": 3000,
      "requirements": "NE states; existing Citizens relationship preferred",
      "notes": "Pulls TransUnion; strong NE regional bank",
      "riskLevel": "low",
      "whySelected": "TU-only pull in New England and Mid-Atlantic. Relationship-focused underwriting means existing Citizens checking customers approve at 3× the base rate."
    },
    "key-bank": {
      "name": "KeyBank",
      "card": "KeyBank Business Rewards Visa",
      "bureau": "TransUnion",
      "revenue": 50000,
      "income": 3000,
      "monthlySpend": 3000,
      "requirements": "Existing KeyBank relationship preferred; select states",
      "notes": "Pulls TransUnion; relationship banking required",
      "riskLevel": "low",
      "whySelected": "TU-only pull in NE and Pacific Northwest states. Community banking model gives underwriters flexibility not seen at national issuers — strong for existing KeyBank customers."
    },
    "us-bank": {
      "name": "US Bank",
      "card": "Business Triple Cash Rewards World Elite",
      "bureau": "Equifax",
      "revenue": 75000,
      "income": 3000,
      "monthlySpend": 4000,
      "requirements": "MUST open US Bank business checking ($100 min) before applying — relationship is required for approval",
      "notes": "Highest limits; must have existing US Bank relationship to approve",
      "riskLevel": "medium",
      "whySelected": "Highest credit limits of any EQ bank. US Bank approves at dramatically higher rates for existing checking customers — open the account first. EQ-only pull saves EX and TU for other rounds."
    },
    "wells-fargo": {
      "name": "Wells Fargo",
      "card": "Business Platinum Credit Card",
      "bureau": "Equifax",
      "revenue": 50000,
      "income": 2000,
      "monthlySpend": 3000,
      "requirements": "Existing Wells Fargo business account preferred; apply in branch for best results",
      "notes": "Pulls Equifax; relationship banking; branch visit improves approval odds ~40%",
      "riskLevel": "low",
      "whySelected": "EQ-only pull preserves EX and TU for other rounds. In-branch applications outperform online by ~40% approval rate. Existing Wells Fargo business checking customers see materially better outcomes."
    },
    "amex": {
      "name": "American Express",
      "card": "Blue Business Cash Card / Business Gold Card",
      "bureau": "Equifax",
      "revenue": 100000,
      "income": 4000,
      "monthlySpend": 5000,
      "requirements": "700+ FICO required; clean EQ bureau; strong annual revenue",
      "notes": "Highest limits available; no preset spending limit options; charge card also available",
      "riskLevel": "low",
      "whySelected": "Highest potential credit limits of all issuers. No preset spending cap on Charge cards means effective limits can reach $100K+. EQ-only pull. Apply after US Bank to keep EQ clean for as long as possible."
    },
    "citi": {
      "name": "Citi",
      "card": "Citi Double Cash Business Card",
      "bureau": "Equifax",
      "revenue": 75000,
      "income": 3000,
      "monthlySpend": 4000,
      "requirements": "Good Equifax profile; existing Citi relationship helps",
      "notes": "Pulls Equifax; good for clients with clean EQ bureau",
      "riskLevel": "medium",
      "whySelected": "EQ-only pull with strong 0% intro APR offers. Existing Citi relationship improves both approval odds and starting credit limits. Apply after Amex and US Bank in Round 2."
    },
    "discover": {
      "name": "Discover",
      "card": "Discover it Business Card",
      "bureau": "Equifax",
      "revenue": 36000,
      "income": 2500,
      "monthlySpend": 2000,
      "requirements": "700+ FICO; clean payment history; no specific relationship required",
      "notes": "Good entry-level business card; pulls Equifax; easier approval threshold",
      "riskLevel": "low",
      "whySelected": "Easiest Equifax approval of any national issuer. Excellent fallback if US Bank, Amex, or Citi decline. EQ-only pull. 1.5% unlimited cash back on all purchases."
    },
    "truist": {
      "name": "Truist",
      "card": "Truist Business Cash Rewards Credit Card",
      "bureau": "Equifax",
      "revenue": 50000,
      "income": 2500,
      "monthlySpend": 3000,
      "requirements": "SE and Mid-Atlantic states; existing Truist relationship preferred",
      "notes": "Formerly BB&T/SunTrust; pulls Equifax; strong regional presence",
      "riskLevel": "low",
      "whySelected": "Formed from BB&T/SunTrust — strong in SE and Mid-Atlantic. Existing Truist customers approved at 3× rate. EQ-only pull fits Round 2 strategy perfectly."
    },
    "fifth-third": {
      "name": "Fifth Third Bank",
      "card": "Fifth Third Business Cash Rewards Credit Card",
      "bureau": "Equifax",
      "revenue": 50000,
      "income": 2500,
      "monthlySpend": 3000,
      "requirements": "Midwest and SE states; Fifth Third relationship preferred",
      "notes": "Pulls Equifax; great for Midwest/SE clients with Fifth Third account",
      "riskLevel": "low",
      "whySelected": "Flexible SB underwriting with strong Midwest and SE presence. EQ-only pull. Existing Fifth Third checking customers see 2–3× better approval outcomes in business credit."
    },
    "huntington": {
      "name": "Huntington Bank",
      "card": "Huntington Business Credit Card",
      "bureau": "Equifax",
      "revenue": 50000,
      "income": 2500,
      "monthlySpend": 3000,
      "requirements": "Midwest states; Huntington business account preferred",
      "notes": "Pulls Equifax; strong Midwest regional; good relationship bank",
      "riskLevel": "low",
      "whySelected": "One of the most flexible Midwest banks for small businesses. EQ-only pull. Known for relationship-first underwriting and a 24-hour grace period on payments."
    },
    "pnc": {
      "name": "PNC Bank",
      "card": "PNC Visa Business Credit Card",
      "bureau": "Equifax",
      "revenue": 50000,
      "income": 2500,
      "monthlySpend": 3000,
      "requirements": "Existing PNC relationship preferred; most states",
      "notes": "Pulls Equifax; widely available regional bank",
      "riskLevel": "low",
      "whySelected": "Broad national coverage — available in 28+ states. EQ-only pull fits Round 2 strategy. Relationship banking model favors existing PNC checking customers with competitive SB card limits."
    },
    "regions": {
      "name": "Regions Bank",
      "card": "Regions Business Visa Platinum",
      "bureau": "Equifax",
      "revenue": 50000,
      "income": 2500,
      "monthlySpend": 3000,
      "requirements": "SE and Midwest states; Regions relationship preferred",
      "notes": "Pulls Equifax; strong SE regional bank",
      "riskLevel": "low",
      "whySelected": "Strong SE and South presence. EQ-only pull. Flexible underwriting for small businesses — Regions is known for giving newer businesses a chance when Amex and Citi won't."
    },
    "frost": {
      "name": "Frost Bank",
      "card": "Frost Bank Business Visa",
      "bureau": "Experian",
      "revenue": 50000,
      "income": 2500,
      "monthlySpend": 3000,
      "requirements": "Texas only; Frost Bank business relationship strongly preferred",
      "notes": "Strong TX regional bank; pulls Experian; great for TX EX strategy",
      "riskLevel": "low",
      "whySelected": "Texas-only community bank with deep local relationships. EX pull pairs with Chase/Barclays on the same day — maximum Round 1 EX strategy for Texas clients."
    },
    "bokf": {
      "name": "BOK Financial",
      "card": "BOK Business Visa",
      "bureau": "Equifax",
      "revenue": 50000,
      "income": 2500,
      "monthlySpend": 3000,
      "requirements": "OK, TX, NM, CO, AZ, KS, MO; existing BOKF relationship preferred",
      "notes": "Bank of Oklahoma parent company; solid regional option",
      "riskLevel": "low",
      "whySelected": "South-Central leader covering OK, TX, NM, CO, AZ, KS, MO. EQ-only pull fits Round 2 perfectly. BOKF's community banking approach yields flexible approvals for established local businesses."
    },
    "umb": {
      "name": "UMB Bank",
      "card": "UMB Business Visa",
      "bureau": "Equifax",
      "revenue": 50000,
      "income": 2500,
      "monthlySpend": 3000,
      "requirements": "MO, KS, CO, AZ, NM, NE, OK, IL; UMB relationship preferred",
      "notes": "Strong Midwest/Plains bank; pulls Equifax",
      "riskLevel": "low",
      "whySelected": "MO and KS regional stronghold with Plains and Southwest reach. EQ-only pull — solid addition to Round 2. Relationship banking model with competitive SB credit programs."
    },
    "commerce": {
      "name": "Commerce Bank",
      "card": "Commerce Bank Business Visa",
      "bureau": "Equifax",
      "revenue": 50000,
      "income": 2500,
      "monthlySpend": 3000,
      "requirements": "MO, KS, IL, OK, CO, NE; Commerce relationship preferred",
      "notes": "Strong MO/KS bank; pulls Equifax",
      "riskLevel": "low",
      "whySelected": "MO/KS community bank with IL and OK reach. EQ-only pull. Community banking flexibility means approval for businesses that national banks turn away."
    },
    "banner": {
      "name": "Banner Bank",
      "card": "Banner Bank Business Visa",
      "bureau": "Equifax",
      "revenue": 50000,
      "income": 2000,
      "monthlySpend": 2500,
      "requirements": "WA, OR, ID, CA; Banner Bank relationship preferred",
      "notes": "Pacific Northwest regional bank; pulls Equifax",
      "riskLevel": "low",
      "whySelected": "Pacific Northwest community bank with flexible SB underwriting. EQ-only pull rounds out Round 2 PNW strategy. Local relationship banking yields faster approvals and more flexible limits."
    },
    "glacier": {
      "name": "Glacier Bank",
      "card": "Glacier Bank Business Visa",
      "bureau": "Equifax",
      "revenue": 36000,
      "income": 2000,
      "monthlySpend": 2000,
      "requirements": "MT, ID, WY, CO, AZ, NV, UT, WA; Glacier relationship preferred",
      "notes": "Mountain West regional bank; pulls Equifax",
      "riskLevel": "low",
      "whySelected": "Mountain West community bank covering MT, ID, WY, CO, AZ, NV, UT, WA. EQ-only pull. Very flexible underwriting for local businesses — one of the most accessible regional approvals in the Mountain West."
    },
    "columbia-bank": {
      "name": "Columbia Bank",
      "card": "Columbia Bank Business Visa",
      "bureau": "Equifax",
      "revenue": 50000,
      "income": 2000,
      "monthlySpend": 2500,
      "requirements": "OR, WA, ID; Columbia Bank relationship preferred",
      "notes": "Pacific Northwest regional; pulls Equifax",
      "riskLevel": "low",
      "whySelected": "Pacific NW community bank with OR, WA, and ID coverage. EQ-only pull. Relationship-focused approval process — local banker advocates significantly improve outcomes."
    },
    "independent-tx": {
      "name": "Independent Bank (TX)",
      "card": "Independent Bank Business Visa",
      "bureau": "Experian",
      "revenue": 50000,
      "income": 2500,
      "monthlySpend": 3000,
      "requirements": "Texas only; Independent Bank relationship preferred",
      "notes": "Texas regional bank; pulls Experian",
      "riskLevel": "low",
      "whySelected": "Texas-focused community bank with EX pull — can apply same day as Chase and Barclays for maximum Round 1 EX coverage without added bureau cost."
    },
    "mercantile-mi": {
      "name": "Mercantile Bank (MI)",
      "card": "Mercantile Business Visa",
      "bureau": "Equifax",
      "revenue": 50000,
      "income": 2000,
      "monthlySpend": 2500,
      "requirements": "Michigan only; Mercantile relationship preferred",
      "notes": "Michigan community bank; pulls Equifax",
      "riskLevel": "low",
      "whySelected": "Michigan community bank with local relationship advantage and EQ pull. Ideal Round 2 addition for Michigan clients who have Mercantile business checking."
    },
    "flagstar": {
      "name": "Flagstar Bank",
      "card": "Flagstar Business Credit Card",
      "bureau": "Equifax",
      "revenue": 50000,
      "income": 2500,
      "monthlySpend": 3000,
      "requirements": "MI, IN, CA, WI, OH; Flagstar relationship preferred",
      "notes": "Pulls Equifax; Michigan-based national bank",
      "riskLevel": "low",
      "whySelected": "Michigan-headquartered with multi-state reach including CA. EQ-only pull adds to Midwest and West Coast EQ diversity in Round 2 — especially valuable for clients with MI or CA operations."
    },
    "comerica": {
      "name": "Comerica Bank",
      "card": "Comerica Business Visa",
      "bureau": "Equifax",
      "revenue": 75000,
      "income": 3000,
      "monthlySpend": 4000,
      "requirements": "MI, TX, CA, FL, AZ; Comerica relationship preferred",
      "notes": "Pulls Equifax; strong MI/TX commercial bank",
      "riskLevel": "medium",
      "whySelected": "Commercial-focused with MI and TX strongholds. EQ pull. Higher revenue requirement but yields stronger limits for established businesses — particularly well-suited for TX clients as an EQ complement to Frost's EX."
    },
    "first-midwest": {
      "name": "First Midwest Bank",
      "card": "First Midwest Business Visa",
      "bureau": "Equifax",
      "revenue": 50000,
      "income": 2500,
      "monthlySpend": 3000,
      "requirements": "IL, IA, WI, MN, IN; relationship preferred",
      "notes": "Pulls Equifax; solid Midwest option",
      "riskLevel": "low",
      "whySelected": "Strong Illinois and Midwest regional bank with flexible SB underwriting. EQ-only pull. Good fallback when larger Midwest banks (Huntington, Fifth Third) are not available in-state."
    },
    "east-west": {
      "name": "East West Bank",
      "card": "East West Business Visa",
      "bureau": "Equifax",
      "revenue": 50000,
      "income": 3000,
      "monthlySpend": 3000,
      "requirements": "CA, NY, TX, WA; East West relationship preferred",
      "notes": "Pulls Equifax; strong CA presence",
      "riskLevel": "low",
      "whySelected": "CA-focused with NY and TX reach. EQ-only pull. Strong in Asian-American business community and broader CA small business market — often more accessible than Pacific Premier for first-time applicants."
    },
    "pacific-premier": {
      "name": "Pacific Premier Bank",
      "card": "Pacific Premier Business Visa",
      "bureau": "Equifax",
      "revenue": 50000,
      "income": 2500,
      "monthlySpend": 3000,
      "requirements": "CA, WA, AZ, NV, OR; relationship preferred",
      "notes": "Pulls Equifax; West Coast commercial bank",
      "riskLevel": "low",
      "whySelected": "West Coast commercial bank leader covering CA, WA, AZ, NV, OR. EQ-only pull. Relationship-oriented underwriting — existing Pacific Premier commercial clients approved at significantly higher rates."
    },
    "elan-tcf": {
      "name": "TCF / Huntington (Elan)",
      "card": "Elan Business Visa via TCF/Huntington",
      "bureau": "Equifax",
      "revenue": 36000,
      "income": 2000,
      "monthlySpend": 2000,
      "requirements": "MN, MI, IL, CO; TCF/Huntington bank relationship required",
      "notes": "Elan-issued white-label card; pulls Equifax; good for additional credit",
      "riskLevel": "low",
      "whySelected": "Elan-processed card through Huntington/TCF network — typically easier approval than direct national bank applications. EQ-only pull. Ideal for stacking additional 0% credit in Round 3 for MN, MI, IL, CO clients."
    },
    "elan-isabella": {
      "name": "Isabella Bank (Elan)",
      "card": "Isabella Bank Business Visa via Elan",
      "bureau": "Equifax",
      "revenue": 36000,
      "income": 2000,
      "monthlySpend": 2000,
      "requirements": "Michigan only; Isabella Bank relationship required",
      "notes": "Elan-issued; Michigan community bank partner",
      "riskLevel": "low",
      "whySelected": "Elan-issued through Isabella Bank — Michigan community bank partner with less scrutiny than national issuers. EQ-only pull. Excellent Round 3 addition for Michigan clients who want maximum 0% stacking."
    },
    "elan-associated": {
      "name": "Associated Bank (Elan)",
      "card": "Associated Bank Business Visa via Elan",
      "bureau": "Equifax",
      "revenue": 36000,
      "income": 2000,
      "monthlySpend": 2000,
      "requirements": "WI, IL, MN; Associated Bank relationship required",
      "notes": "Elan-issued; pulls Equifax",
      "riskLevel": "low",
      "whySelected": "Elan-processed through Associated Bank — WI, IL, MN community bank with straightforward underwriting. EQ-only pull. Good for stacking additional 0% credit in Round 3 for Midwest clients."
    },
    "elan-old-national": {
      "name": "Old National Bank (Elan)",
      "card": "Old National Business Visa via Elan",
      "bureau": "Equifax",
      "revenue": 36000,
      "income": 2000,
      "monthlySpend": 2000,
      "requirements": "IN, IL, KY, MI, MN, WI; Old National relationship required",
      "notes": "Elan-issued; Midwest community bank",
      "riskLevel": "low",
      "whySelected": "Elan-issued through Old National Bank — Midwest community bank covering IN, IL, KY, MI, MN, WI. Community bank flexibility and less national-bank scrutiny make this a strong Round 3 approval."
    },
    "elan-commerce": {
      "name": "Commerce Bank (Elan)",
      "card": "Commerce Business Visa via Elan",
      "bureau": "Equifax",
      "revenue": 36000,
      "income": 2000,
      "monthlySpend": 2000,
      "requirements": "MO, KS; Commerce Bank relationship required",
      "notes": "Elan-issued; pulls Equifax",
      "riskLevel": "low",
      "whySelected": "Elan-processed through Commerce Bank in MO and KS — excellent Round 3 addition stacking on top of the direct Commerce Bank approval. Two bites at the same apple via Elan."
    },
    "elan-midwest": {
      "name": "MidWestOne Bank (Elan)",
      "card": "MidWestOne Business Visa via Elan",
      "bureau": "Equifax",
      "revenue": 36000,
      "income": 2000,
      "monthlySpend": 2000,
      "requirements": "IA, MN, WI, FL; MidWestOne relationship required",
      "notes": "Elan-issued; Iowa-headquartered community bank",
      "riskLevel": "low",
      "whySelected": "Iowa-headquartered Elan partner with IA, MN, WI, and FL reach. Community bank underwriting with less national scrutiny — ideal Round 3 to stack additional 0% credit."
    },
    "elan-columbia": {
      "name": "Columbia Bank (Elan)",
      "card": "Columbia Business Visa via Elan",
      "bureau": "Equifax",
      "revenue": 36000,
      "income": 2000,
      "monthlySpend": 2000,
      "requirements": "OR, WA; Columbia Bank relationship required",
      "notes": "Elan-issued; Pacific Northwest regional",
      "riskLevel": "low",
      "whySelected": "Elan-issued through Columbia Bank — OR and WA community bank. Complements the direct Columbia Bank Round 2 card with a second 0% product via Elan in Round 3."
    },
    "elan-glacier": {
      "name": "Glacier Bank (Elan)",
      "card": "Glacier Business Visa via Elan",
      "bureau": "Equifax",
      "revenue": 36000,
      "income": 2000,
      "monthlySpend": 2000,
      "requirements": "MT, ID, WY, CO; Glacier Bank relationship required",
      "notes": "Elan-issued; Mountain West community bank",
      "riskLevel": "low",
      "whySelected": "Elan-issued through Glacier Bank — MT, ID, WY, CO community bank. Round 3 addition that stacks on top of the direct Glacier Bank Round 2 approval for Mountain West clients."
    },
    "elan-wintrust": {
      "name": "Wintrust Bank (Elan)",
      "card": "Wintrust Business Visa via Elan",
      "bureau": "Equifax",
      "revenue": 36000,
      "income": 2000,
      "monthlySpend": 2000,
      "requirements": "IL, WI; Wintrust relationship required",
      "notes": "Elan-issued; Chicago-area regional bank",
      "riskLevel": "low",
      "whySelected": "Elan-processed through Wintrust — Chicago-area community bank powerhouse. Less scrutiny than national issuers with EQ-only pull. Ideal Round 3 for IL and WI clients wanting maximum credit stacking."
    },
    "elan-heartland": {
      "name": "Heartland Bank (Elan)",
      "card": "Heartland Business Visa via Elan",
      "bureau": "Equifax",
      "revenue": 36000,
      "income": 2000,
      "monthlySpend": 2000,
      "requirements": "OH, MN; Heartland relationship required",
      "notes": "Elan-issued; Midwest community bank",
      "riskLevel": "low",
      "whySelected": "Elan-issued through Heartland Bank for OH and MN clients. Straightforward community bank underwriting — easier approval than national issuers. Strong Round 3 for Midwest 0% stacking."
    },
    "elan-independent-tx": {
      "name": "Independent Bank TX (Elan)",
      "card": "Independent Business Visa via Elan",
      "bureau": "Equifax",
      "revenue": 36000,
      "income": 2000,
      "monthlySpend": 2000,
      "requirements": "TX; Independent Bank relationship required",
      "notes": "Elan-issued; Texas community bank partner",
      "riskLevel": "low",
      "whySelected": "Elan-processed through Independent Bank Texas — stacks a Round 3 EQ product on top of the direct Independent Bank Round 1 EX card. Two products from one banking relationship."
    },
    "elan-nb": {
      "name": "National Community Bank (Elan)",
      "card": "Community Business Visa via Elan",
      "bureau": "Equifax",
      "revenue": 36000,
      "income": 2000,
      "monthlySpend": 2000,
      "requirements": "Select states; community bank relationship required",
      "notes": "Elan white-label card through local partner banks",
      "riskLevel": "low",
      "whySelected": "Elan Financial Services white-label card through local community bank partner — typically the most accessible approval in Round 3. Community bank underwriting with EQ-only pull for clean stacking."
    },
    "elan-banner": {
      "name": "Banner Bank (Elan)",
      "card": "Banner Business Visa via Elan",
      "bureau": "Equifax",
      "revenue": 36000,
      "income": 2000,
      "monthlySpend": 2000,
      "requirements": "WA, OR, ID; Banner Bank relationship required",
      "notes": "Elan-issued; Pacific Northwest community bank",
      "riskLevel": "low",
      "whySelected": "Elan-processed through Banner Bank — Round 3 EQ product stacking on top of the direct Banner Bank Round 2 card. WA, OR, ID clients can leverage one banking relationship for two separate 0% products."
    },
    "elan-pinnacle": {
      "name": "Pinnacle Bank (Elan)",
      "card": "Pinnacle Business Visa via Elan",
      "bureau": "Equifax",
      "revenue": 36000,
      "income": 2000,
      "monthlySpend": 2000,
      "requirements": "TN, VA, NC, TX; Pinnacle relationship required",
      "notes": "Elan-issued; SE community bank",
      "riskLevel": "low",
      "whySelected": "Elan-issued through Pinnacle Bank for TN, VA, NC, TX clients. Strong Southeast community bank with relationship-focused underwriting — excellent Round 3 approval for SE clients."
    },
    "elan-bokf": {
      "name": "BOK Financial (Elan)",
      "card": "BOK Business Visa via Elan",
      "bureau": "Equifax",
      "revenue": 36000,
      "income": 2000,
      "monthlySpend": 2000,
      "requirements": "OK, TX, NM, CO, AZ; BOKF relationship required",
      "notes": "Elan-issued; South-Central regional",
      "riskLevel": "low",
      "whySelected": "Elan-processed through BOK Financial — Round 3 EQ product that stacks on top of the direct BOKF Round 2 card. South-Central clients (OK, TX, NM, CO, AZ) can maximize 0% stacking through one BOKF relationship."
    }
  },
  "states": {
    "AL": {
      "experian": [
        "chase",
        "barclays"
      ],
      "transunion": [
        "boa",
        "capital-one",
        "navy-federal"
      ],
      "equifax": [
        "us-bank",
        "wells-fargo",
        "amex",
        "citi",
        "discover",
        "truist",
        "regions",
        "pnc"
      ],
      "regional": [
        "regions",
        "truist"
      ],
      "elan": [
        "elan-nb",
        "elan-pinnacle"
      ]
    },
    "AK": {
      "experian": [
        "chase",
        "barclays"
      ],
      "transunion": [
        "boa",
        "capital-one",
        "navy-federal",
        "key-bank"
      ],
      "equifax": [
        "us-bank",
        "wells-fargo",
        "amex",
        "citi",
        "discover",
        "glacier"
      ],
      "regional": [
        "glacier",
        "key-bank"
      ],
      "elan": [
        "elan-glacier",
        "elan-nb"
      ]
    },
    "AZ": {
      "experian": [
        "chase",
        "barclays",
        "fnbo"
      ],
      "transunion": [
        "boa",
        "capital-one",
        "navy-federal"
      ],
      "equifax": [
        "us-bank",
        "wells-fargo",
        "amex",
        "citi",
        "discover",
        "glacier",
        "bokf",
        "umb",
        "comerica",
        "pacific-premier"
      ],
      "regional": [
        "glacier",
        "bokf",
        "umb",
        "pacific-premier"
      ],
      "elan": [
        "elan-glacier",
        "elan-bokf",
        "elan-nb"
      ]
    },
    "AR": {
      "experian": [
        "chase",
        "barclays"
      ],
      "transunion": [
        "boa",
        "capital-one",
        "navy-federal"
      ],
      "equifax": [
        "us-bank",
        "wells-fargo",
        "amex",
        "citi",
        "discover",
        "truist",
        "regions"
      ],
      "regional": [
        "regions",
        "truist"
      ],
      "elan": [
        "elan-nb"
      ]
    },
    "CA": {
      "experian": [
        "chase",
        "barclays",
        "fnbo"
      ],
      "transunion": [
        "boa",
        "capital-one",
        "navy-federal"
      ],
      "equifax": [
        "us-bank",
        "wells-fargo",
        "amex",
        "citi",
        "discover",
        "east-west",
        "pacific-premier",
        "banner",
        "flagstar",
        "comerica"
      ],
      "regional": [
        "east-west",
        "pacific-premier",
        "banner",
        "comerica"
      ],
      "elan": [
        "elan-banner",
        "elan-nb"
      ]
    },
    "CO": {
      "experian": [
        "chase",
        "barclays",
        "fnbo"
      ],
      "transunion": [
        "boa",
        "capital-one",
        "navy-federal",
        "key-bank"
      ],
      "equifax": [
        "us-bank",
        "wells-fargo",
        "amex",
        "citi",
        "discover",
        "glacier",
        "umb",
        "bokf",
        "huntington"
      ],
      "regional": [
        "glacier",
        "umb",
        "bokf"
      ],
      "elan": [
        "elan-glacier",
        "elan-tcf",
        "elan-bokf"
      ]
    },
    "CT": {
      "experian": [
        "chase",
        "barclays"
      ],
      "transunion": [
        "boa",
        "capital-one",
        "navy-federal",
        "citizens"
      ],
      "equifax": [
        "us-bank",
        "wells-fargo",
        "amex",
        "citi",
        "discover",
        "pnc"
      ],
      "regional": [
        "citizens",
        "pnc"
      ],
      "elan": [
        "elan-nb"
      ]
    },
    "DE": {
      "experian": [
        "chase",
        "barclays"
      ],
      "transunion": [
        "boa",
        "capital-one",
        "navy-federal",
        "citizens"
      ],
      "equifax": [
        "us-bank",
        "wells-fargo",
        "amex",
        "citi",
        "discover",
        "truist",
        "pnc"
      ],
      "regional": [
        "citizens",
        "pnc",
        "truist"
      ],
      "elan": [
        "elan-nb"
      ]
    },
    "FL": {
      "experian": [
        "chase",
        "barclays"
      ],
      "transunion": [
        "boa",
        "capital-one",
        "navy-federal"
      ],
      "equifax": [
        "us-bank",
        "wells-fargo",
        "amex",
        "citi",
        "discover",
        "truist",
        "regions",
        "fifth-third",
        "pnc"
      ],
      "regional": [
        "truist",
        "regions",
        "fifth-third"
      ],
      "elan": [
        "elan-midwest",
        "elan-nb"
      ]
    },
    "GA": {
      "experian": [
        "chase",
        "barclays"
      ],
      "transunion": [
        "boa",
        "capital-one",
        "navy-federal"
      ],
      "equifax": [
        "us-bank",
        "wells-fargo",
        "amex",
        "citi",
        "discover",
        "truist",
        "regions",
        "fifth-third",
        "pnc"
      ],
      "regional": [
        "truist",
        "regions",
        "fifth-third"
      ],
      "elan": [
        "elan-pinnacle",
        "elan-nb"
      ]
    },
    "HI": {
      "experian": [
        "chase",
        "barclays"
      ],
      "transunion": [
        "boa",
        "capital-one",
        "navy-federal"
      ],
      "equifax": [
        "us-bank",
        "wells-fargo",
        "amex",
        "citi",
        "discover"
      ],
      "regional": [],
      "elan": [
        "elan-nb"
      ]
    },
    "ID": {
      "experian": [
        "chase",
        "barclays"
      ],
      "transunion": [
        "boa",
        "capital-one",
        "navy-federal",
        "key-bank"
      ],
      "equifax": [
        "us-bank",
        "wells-fargo",
        "amex",
        "citi",
        "discover",
        "glacier",
        "banner",
        "columbia-bank"
      ],
      "regional": [
        "glacier",
        "banner",
        "columbia-bank"
      ],
      "elan": [
        "elan-glacier",
        "elan-banner",
        "elan-columbia"
      ]
    },
    "IL": {
      "experian": [
        "chase",
        "barclays",
        "fnbo"
      ],
      "transunion": [
        "boa",
        "capital-one",
        "navy-federal"
      ],
      "equifax": [
        "us-bank",
        "wells-fargo",
        "amex",
        "citi",
        "discover",
        "first-midwest",
        "regions",
        "huntington",
        "pnc",
        "umb"
      ],
      "regional": [
        "first-midwest",
        "huntington",
        "umb"
      ],
      "elan": [
        "elan-wintrust",
        "elan-old-national",
        "elan-commerce",
        "elan-tcf"
      ]
    },
    "IN": {
      "experian": [
        "chase",
        "barclays",
        "fnbo"
      ],
      "transunion": [
        "boa",
        "capital-one",
        "navy-federal",
        "key-bank"
      ],
      "equifax": [
        "us-bank",
        "wells-fargo",
        "amex",
        "citi",
        "discover",
        "fifth-third",
        "huntington",
        "pnc",
        "flagstar",
        "regions",
        "truist"
      ],
      "regional": [
        "fifth-third",
        "huntington",
        "flagstar"
      ],
      "elan": [
        "elan-old-national",
        "elan-tcf",
        "elan-nb"
      ]
    },
    "IA": {
      "experian": [
        "chase",
        "barclays",
        "fnbo"
      ],
      "transunion": [
        "boa",
        "capital-one",
        "navy-federal"
      ],
      "equifax": [
        "us-bank",
        "wells-fargo",
        "amex",
        "citi",
        "discover",
        "first-midwest",
        "commerce"
      ],
      "regional": [
        "first-midwest",
        "commerce"
      ],
      "elan": [
        "elan-midwest",
        "elan-nb"
      ]
    },
    "KS": {
      "experian": [
        "chase",
        "barclays",
        "fnbo"
      ],
      "transunion": [
        "boa",
        "capital-one",
        "navy-federal"
      ],
      "equifax": [
        "us-bank",
        "wells-fargo",
        "amex",
        "citi",
        "discover",
        "umb",
        "commerce",
        "bokf"
      ],
      "regional": [
        "umb",
        "commerce",
        "bokf"
      ],
      "elan": [
        "elan-commerce",
        "elan-bokf",
        "elan-nb"
      ]
    },
    "KY": {
      "experian": [
        "chase",
        "barclays"
      ],
      "transunion": [
        "boa",
        "capital-one",
        "navy-federal"
      ],
      "equifax": [
        "us-bank",
        "wells-fargo",
        "amex",
        "citi",
        "discover",
        "fifth-third",
        "huntington",
        "pnc",
        "regions",
        "truist"
      ],
      "regional": [
        "fifth-third",
        "huntington",
        "regions"
      ],
      "elan": [
        "elan-old-national",
        "elan-nb"
      ]
    },
    "LA": {
      "experian": [
        "chase",
        "barclays"
      ],
      "transunion": [
        "boa",
        "capital-one",
        "navy-federal"
      ],
      "equifax": [
        "us-bank",
        "wells-fargo",
        "amex",
        "citi",
        "discover",
        "regions",
        "truist"
      ],
      "regional": [
        "regions"
      ],
      "elan": [
        "elan-nb"
      ]
    },
    "ME": {
      "experian": [
        "chase",
        "barclays"
      ],
      "transunion": [
        "boa",
        "capital-one",
        "navy-federal",
        "citizens",
        "key-bank"
      ],
      "equifax": [
        "us-bank",
        "wells-fargo",
        "amex",
        "citi",
        "discover",
        "pnc"
      ],
      "regional": [
        "citizens",
        "key-bank"
      ],
      "elan": [
        "elan-nb"
      ]
    },
    "MD": {
      "experian": [
        "chase",
        "barclays"
      ],
      "transunion": [
        "boa",
        "capital-one",
        "navy-federal",
        "citizens"
      ],
      "equifax": [
        "us-bank",
        "wells-fargo",
        "amex",
        "citi",
        "discover",
        "truist",
        "pnc"
      ],
      "regional": [
        "truist",
        "pnc"
      ],
      "elan": [
        "elan-nb"
      ]
    },
    "MA": {
      "experian": [
        "chase",
        "barclays"
      ],
      "transunion": [
        "boa",
        "capital-one",
        "navy-federal",
        "citizens"
      ],
      "equifax": [
        "us-bank",
        "wells-fargo",
        "amex",
        "citi",
        "discover",
        "pnc"
      ],
      "regional": [
        "citizens",
        "pnc"
      ],
      "elan": [
        "elan-nb"
      ]
    },
    "MI": {
      "experian": [
        "chase",
        "barclays",
        "fnbo"
      ],
      "transunion": [
        "boa",
        "capital-one",
        "navy-federal",
        "citizens",
        "key-bank"
      ],
      "equifax": [
        "us-bank",
        "wells-fargo",
        "amex",
        "citi",
        "discover",
        "fifth-third",
        "huntington",
        "pnc",
        "flagstar",
        "mercantile-mi",
        "comerica"
      ],
      "regional": [
        "fifth-third",
        "huntington",
        "flagstar",
        "mercantile-mi",
        "comerica"
      ],
      "elan": [
        "elan-tcf",
        "elan-isabella",
        "elan-old-national"
      ]
    },
    "MN": {
      "experian": [
        "chase",
        "barclays",
        "fnbo"
      ],
      "transunion": [
        "boa",
        "capital-one",
        "navy-federal"
      ],
      "equifax": [
        "us-bank",
        "wells-fargo",
        "amex",
        "citi",
        "discover",
        "first-midwest",
        "huntington"
      ],
      "regional": [
        "first-midwest",
        "huntington"
      ],
      "elan": [
        "elan-tcf",
        "elan-associated",
        "elan-midwest",
        "elan-heartland"
      ]
    },
    "MS": {
      "experian": [
        "chase",
        "barclays"
      ],
      "transunion": [
        "boa",
        "capital-one",
        "navy-federal"
      ],
      "equifax": [
        "us-bank",
        "wells-fargo",
        "amex",
        "citi",
        "discover",
        "regions",
        "truist"
      ],
      "regional": [
        "regions",
        "truist"
      ],
      "elan": [
        "elan-nb"
      ]
    },
    "MO": {
      "experian": [
        "chase",
        "barclays",
        "fnbo"
      ],
      "transunion": [
        "boa",
        "capital-one",
        "navy-federal"
      ],
      "equifax": [
        "us-bank",
        "wells-fargo",
        "amex",
        "citi",
        "discover",
        "umb",
        "commerce",
        "bokf",
        "regions"
      ],
      "regional": [
        "umb",
        "commerce",
        "bokf"
      ],
      "elan": [
        "elan-commerce",
        "elan-nb"
      ]
    },
    "MT": {
      "experian": [
        "chase",
        "barclays"
      ],
      "transunion": [
        "boa",
        "capital-one",
        "navy-federal"
      ],
      "equifax": [
        "us-bank",
        "wells-fargo",
        "amex",
        "citi",
        "discover",
        "glacier"
      ],
      "regional": [
        "glacier"
      ],
      "elan": [
        "elan-glacier",
        "elan-nb"
      ]
    },
    "NE": {
      "experian": [
        "chase",
        "barclays",
        "fnbo"
      ],
      "transunion": [
        "boa",
        "capital-one",
        "navy-federal"
      ],
      "equifax": [
        "us-bank",
        "wells-fargo",
        "amex",
        "citi",
        "discover",
        "umb",
        "commerce"
      ],
      "regional": [
        "umb",
        "commerce"
      ],
      "elan": [
        "elan-nb"
      ]
    },
    "NV": {
      "experian": [
        "chase",
        "barclays"
      ],
      "transunion": [
        "boa",
        "capital-one",
        "navy-federal"
      ],
      "equifax": [
        "us-bank",
        "wells-fargo",
        "amex",
        "citi",
        "discover",
        "glacier"
      ],
      "regional": [
        "glacier"
      ],
      "elan": [
        "elan-glacier",
        "elan-nb"
      ]
    },
    "NH": {
      "experian": [
        "chase",
        "barclays"
      ],
      "transunion": [
        "boa",
        "capital-one",
        "navy-federal",
        "citizens",
        "key-bank"
      ],
      "equifax": [
        "us-bank",
        "wells-fargo",
        "amex",
        "citi",
        "discover"
      ],
      "regional": [
        "citizens"
      ],
      "elan": [
        "elan-nb"
      ]
    },
    "NJ": {
      "experian": [
        "chase",
        "barclays"
      ],
      "transunion": [
        "boa",
        "capital-one",
        "navy-federal",
        "citizens"
      ],
      "equifax": [
        "us-bank",
        "wells-fargo",
        "amex",
        "citi",
        "discover",
        "truist",
        "pnc"
      ],
      "regional": [
        "citizens",
        "pnc",
        "truist"
      ],
      "elan": [
        "elan-nb"
      ]
    },
    "NM": {
      "experian": [
        "chase",
        "barclays"
      ],
      "transunion": [
        "boa",
        "capital-one",
        "navy-federal"
      ],
      "equifax": [
        "us-bank",
        "wells-fargo",
        "amex",
        "citi",
        "discover",
        "bokf",
        "umb"
      ],
      "regional": [
        "bokf",
        "umb"
      ],
      "elan": [
        "elan-bokf",
        "elan-nb"
      ]
    },
    "NY": {
      "experian": [
        "chase",
        "barclays"
      ],
      "transunion": [
        "boa",
        "capital-one",
        "navy-federal",
        "citizens",
        "key-bank"
      ],
      "equifax": [
        "us-bank",
        "wells-fargo",
        "amex",
        "citi",
        "discover",
        "east-west",
        "pnc"
      ],
      "regional": [
        "citizens",
        "east-west",
        "pnc"
      ],
      "elan": [
        "elan-nb"
      ]
    },
    "NC": {
      "experian": [
        "chase",
        "barclays"
      ],
      "transunion": [
        "boa",
        "capital-one",
        "navy-federal"
      ],
      "equifax": [
        "us-bank",
        "wells-fargo",
        "amex",
        "citi",
        "discover",
        "truist",
        "fifth-third",
        "pnc",
        "regions"
      ],
      "regional": [
        "truist",
        "fifth-third"
      ],
      "elan": [
        "elan-pinnacle",
        "elan-nb"
      ]
    },
    "ND": {
      "experian": [
        "chase",
        "barclays",
        "fnbo"
      ],
      "transunion": [
        "boa",
        "capital-one",
        "navy-federal"
      ],
      "equifax": [
        "us-bank",
        "wells-fargo",
        "amex",
        "citi",
        "discover"
      ],
      "regional": [],
      "elan": [
        "elan-nb"
      ]
    },
    "OH": {
      "experian": [
        "chase",
        "barclays"
      ],
      "transunion": [
        "boa",
        "capital-one",
        "navy-federal",
        "citizens",
        "key-bank"
      ],
      "equifax": [
        "us-bank",
        "wells-fargo",
        "amex",
        "citi",
        "discover",
        "fifth-third",
        "huntington",
        "pnc",
        "truist",
        "regions"
      ],
      "regional": [
        "fifth-third",
        "huntington",
        "pnc"
      ],
      "elan": [
        "elan-heartland",
        "elan-old-national",
        "elan-nb"
      ]
    },
    "OK": {
      "experian": [
        "chase",
        "barclays",
        "fnbo"
      ],
      "transunion": [
        "boa",
        "capital-one",
        "navy-federal"
      ],
      "equifax": [
        "us-bank",
        "wells-fargo",
        "amex",
        "citi",
        "discover",
        "bokf",
        "umb",
        "commerce",
        "regions"
      ],
      "regional": [
        "bokf",
        "umb",
        "commerce"
      ],
      "elan": [
        "elan-bokf",
        "elan-commerce",
        "elan-nb"
      ]
    },
    "OR": {
      "experian": [
        "chase",
        "barclays"
      ],
      "transunion": [
        "boa",
        "capital-one",
        "navy-federal",
        "key-bank"
      ],
      "equifax": [
        "us-bank",
        "wells-fargo",
        "amex",
        "citi",
        "discover",
        "banner",
        "columbia-bank"
      ],
      "regional": [
        "banner",
        "columbia-bank"
      ],
      "elan": [
        "elan-banner",
        "elan-columbia",
        "elan-nb"
      ]
    },
    "PA": {
      "experian": [
        "chase",
        "barclays"
      ],
      "transunion": [
        "boa",
        "capital-one",
        "navy-federal",
        "citizens",
        "key-bank"
      ],
      "equifax": [
        "us-bank",
        "wells-fargo",
        "amex",
        "citi",
        "discover",
        "truist",
        "huntington",
        "pnc"
      ],
      "regional": [
        "pnc",
        "huntington",
        "truist"
      ],
      "elan": [
        "elan-nb"
      ]
    },
    "RI": {
      "experian": [
        "chase",
        "barclays"
      ],
      "transunion": [
        "boa",
        "capital-one",
        "navy-federal",
        "citizens"
      ],
      "equifax": [
        "us-bank",
        "wells-fargo",
        "amex",
        "citi",
        "discover"
      ],
      "regional": [
        "citizens"
      ],
      "elan": [
        "elan-nb"
      ]
    },
    "SC": {
      "experian": [
        "chase",
        "barclays"
      ],
      "transunion": [
        "boa",
        "capital-one",
        "navy-federal"
      ],
      "equifax": [
        "us-bank",
        "wells-fargo",
        "amex",
        "citi",
        "discover",
        "truist",
        "regions",
        "pnc"
      ],
      "regional": [
        "truist",
        "regions"
      ],
      "elan": [
        "elan-nb"
      ]
    },
    "SD": {
      "experian": [
        "chase",
        "barclays",
        "fnbo"
      ],
      "transunion": [
        "boa",
        "capital-one",
        "navy-federal"
      ],
      "equifax": [
        "us-bank",
        "wells-fargo",
        "amex",
        "citi",
        "discover",
        "huntington"
      ],
      "regional": [
        "huntington"
      ],
      "elan": [
        "elan-nb"
      ]
    },
    "TN": {
      "experian": [
        "chase",
        "barclays"
      ],
      "transunion": [
        "boa",
        "capital-one",
        "navy-federal"
      ],
      "equifax": [
        "us-bank",
        "wells-fargo",
        "amex",
        "citi",
        "discover",
        "truist",
        "regions",
        "fifth-third"
      ],
      "regional": [
        "truist",
        "regions",
        "fifth-third"
      ],
      "elan": [
        "elan-pinnacle",
        "elan-nb"
      ]
    },
    "TX": {
      "experian": [
        "chase",
        "barclays",
        "fnbo",
        "frost",
        "independent-tx"
      ],
      "transunion": [
        "boa",
        "capital-one",
        "navy-federal"
      ],
      "equifax": [
        "us-bank",
        "wells-fargo",
        "amex",
        "citi",
        "discover",
        "bokf",
        "comerica",
        "regions",
        "truist"
      ],
      "regional": [
        "frost",
        "bokf",
        "comerica",
        "independent-tx"
      ],
      "elan": [
        "elan-independent-tx",
        "elan-bokf",
        "elan-nb"
      ]
    },
    "UT": {
      "experian": [
        "chase",
        "barclays"
      ],
      "transunion": [
        "boa",
        "capital-one",
        "navy-federal",
        "key-bank"
      ],
      "equifax": [
        "us-bank",
        "wells-fargo",
        "amex",
        "citi",
        "discover",
        "glacier"
      ],
      "regional": [
        "glacier"
      ],
      "elan": [
        "elan-glacier",
        "elan-nb"
      ]
    },
    "VT": {
      "experian": [
        "chase",
        "barclays"
      ],
      "transunion": [
        "boa",
        "capital-one",
        "navy-federal",
        "citizens",
        "key-bank"
      ],
      "equifax": [
        "us-bank",
        "wells-fargo",
        "amex",
        "citi",
        "discover"
      ],
      "regional": [
        "citizens",
        "key-bank"
      ],
      "elan": [
        "elan-nb"
      ]
    },
    "VA": {
      "experian": [
        "chase",
        "barclays"
      ],
      "transunion": [
        "boa",
        "capital-one",
        "navy-federal",
        "citizens"
      ],
      "equifax": [
        "us-bank",
        "wells-fargo",
        "amex",
        "citi",
        "discover",
        "truist",
        "pnc"
      ],
      "regional": [
        "truist",
        "pnc"
      ],
      "elan": [
        "elan-pinnacle",
        "elan-nb"
      ]
    },
    "WA": {
      "experian": [
        "chase",
        "barclays"
      ],
      "transunion": [
        "boa",
        "capital-one",
        "navy-federal",
        "key-bank"
      ],
      "equifax": [
        "us-bank",
        "wells-fargo",
        "amex",
        "citi",
        "discover",
        "banner",
        "columbia-bank",
        "glacier",
        "east-west",
        "pacific-premier"
      ],
      "regional": [
        "banner",
        "columbia-bank",
        "glacier",
        "pacific-premier"
      ],
      "elan": [
        "elan-banner",
        "elan-columbia",
        "elan-glacier"
      ]
    },
    "WV": {
      "experian": [
        "chase",
        "barclays"
      ],
      "transunion": [
        "boa",
        "capital-one",
        "navy-federal"
      ],
      "equifax": [
        "us-bank",
        "wells-fargo",
        "amex",
        "citi",
        "discover",
        "truist",
        "huntington",
        "pnc"
      ],
      "regional": [
        "huntington",
        "truist"
      ],
      "elan": [
        "elan-nb"
      ]
    },
    "WI": {
      "experian": [
        "chase",
        "barclays",
        "fnbo"
      ],
      "transunion": [
        "boa",
        "capital-one",
        "navy-federal"
      ],
      "equifax": [
        "us-bank",
        "wells-fargo",
        "amex",
        "citi",
        "discover",
        "first-midwest",
        "huntington",
        "flagstar"
      ],
      "regional": [
        "first-midwest",
        "huntington",
        "flagstar"
      ],
      "elan": [
        "elan-associated",
        "elan-old-national",
        "elan-wintrust"
      ]
    },
    "WY": {
      "experian": [
        "chase",
        "barclays",
        "fnbo"
      ],
      "transunion": [
        "boa",
        "capital-one",
        "navy-federal"
      ],
      "equifax": [
        "us-bank",
        "wells-fargo",
        "amex",
        "citi",
        "discover",
        "glacier"
      ],
      "regional": [
        "glacier"
      ],
      "elan": [
        "elan-glacier",
        "elan-pinnacle",
        "elan-nb"
      ]
    },
    "DC": {
      "experian": [
        "chase",
        "barclays"
      ],
      "transunion": [
        "boa",
        "capital-one",
        "navy-federal",
        "citizens"
      ],
      "equifax": [
        "us-bank",
        "wells-fargo",
        "amex",
        "citi",
        "discover",
        "truist",
        "pnc"
      ],
      "regional": [
        "truist",
        "pnc"
      ],
      "elan": [
        "elan-nb"
      ]
    }
  }
};
console.log("[FSG DB] Loaded inline: " + Object.keys(window.FUNDING_DATABASE.banks).length + " banks, " + Object.keys(window.FUNDING_DATABASE.states).length + " states");