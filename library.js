// ============================================================
//  AARTH SUTRA — INVESTMENT LIBRARY (library.js)
//  Complete Indian Investment Ecosystem — 30+ Asset Classes
// ============================================================

const INVESTMENT_LIBRARY = [
    // ===== SAFE / SOVEREIGN =====
    {
        id: 'savings',
        category: 'safe',
        icon: '🏦',
        name: 'Savings Account',
        tagline: 'Your daily liquid cash home',
        risk: 'safe', riskLabel: 'Sovereign Safe', badgeClass: 'badge-safe',
        returns: '3–4% p.a.',
        pros: ['Instant liquidity 24/7', 'DICGC insured up to ₹5L', 'Zero lock-in', 'Automates salary credit'],
        cons: ['Returns below inflation (6%)', 'No wealth creation', 'Tax on interest above ₹10k'],
        worstCase: 'Bank goes bankrupt — DICGC covers only ₹5L per bank. Keep surplus across 2 banks.',
        bestFor: 'Emergency pocket money (₹10,000 liquid reserve) + Salary parking only. Not for wealth building.',
        reinvest: 'Move anything above ₹10k liquid buffer into a Sweep FD to earn 7% automatically without losing access.',
        platforms: ['HDFC Bank', 'ICICI Bank', 'SBI', 'Kotak 811', 'Fi Money', 'Jupiter'],
    },
    {
        id: 'fd',
        category: 'safe',
        icon: '📦',
        name: 'Fixed Deposits (FD)',
        tagline: 'Guaranteed returns, zero volatility',
        risk: 'safe', riskLabel: 'Sovereign Safe', badgeClass: 'badge-safe',
        riskRating: 1, speedRating: 1,
        returns: '6.5–8.1% p.a.',
        pros: ['DICGC insured up to ₹5L', 'Guaranteed returns', 'Flexible tenure 7 days–10 yrs', 'Senior citizen bonus 0.5%'],
        cons: ['Taxed as per income slab', 'Penalty on premature withdrawal', 'Barely beats inflation'],
        worstCase: 'Bank failure — only ₹5L protected per bank. Small Finance Banks offer higher rates but carry slightly more risk.',
        bestFor: 'Your 6-month Emergency Fund. Goals maturing in <3 years: child\'s school fees, car down-payment, vacation.',
        reinvest: 'Take the FD interest (7.5%) and auto-route it into a Nifty 50 SIP. Your capital is safe, but its child grows 12% in equities.',
        platforms: ['SBI', 'HDFC', 'ICICI', 'Small Finance Banks', 'Stable Money', 'Jar App'],
    },
    {
        id: 'rd',
        category: 'safe',
        icon: '🔄',
        name: 'Recurring Deposit (RD)',
        tagline: 'Disciplined monthly savings with guaranteed returns',
        risk: 'safe', riskLabel: 'Sovereign Safe', badgeClass: 'badge-safe',
        returns: '6–7.5% p.a.',
        pros: ['Forces savings discipline', 'Guaranteed returns on each instalment', 'DICGC insured', 'Flexible amounts from ₹100/mo'],
        cons: ['Same tax problem as FD', 'Penalty if you miss a month', 'Lower than equity long-term'],
        worstCase: 'Missing instalments reduces effective returns. No flexibility once started.',
        bestFor: 'Beginners who need help automating savings. Great for saving towards a goal in 1–3 years with zero market risk.',
        reinvest: 'Use RD for a 2-year laptop fund. Simultaneously start an SIP in Mid-cap for your 7-year retirement engine.',
        platforms: ['Post Office', 'SBI', 'All Major Banks'],
    },
    {
        id: 'govt_bonds',
        category: 'safe',
        icon: '🇮🇳',
        name: 'Government Bonds',
        tagline: 'Sovereign-guaranteed stability',
        risk: 'safe', riskLabel: 'Sovereign Safe', badgeClass: 'badge-safe',
        riskRating: 1, speedRating: 1,
        returns: '6.5–8% p.a.',
        pros: ['100% sovereign guarantee (cannot default)', 'Tax-free options (54EC bonds)', 'Predictable income', 'Long tenure options up to 40 years'],
        cons: ['Interest rate risk if sold before maturity', 'Low liquidity in secondary market', 'Complex for beginners'],
        worstCase: 'India defaults on debt — unprecedented and extremely unlikely. Main risk is selling before maturity when prices fall.',
        bestFor: 'Long-term wealth preservation (10+ years). Retirees wanting safe monthly income. Capital gains tax saving via 54EC bonds.',
        reinvest: 'Use the 7.5% interest from G-Secs to fund a monthly Nifty SIP. Never touch the principal.',
        platforms: ['RBI Retail Direct', 'GoldenPi', 'Zerodha Coin', 'NSE goBID'],
    },
    {
        id: 'po_schemes',
        category: 'safe',
        icon: '📮',
        name: 'Post Office Schemes',
        tagline: 'Government-backed, ideal for rural India',
        risk: 'safe', riskLabel: 'Sovereign Safe', badgeClass: 'badge-safe',
        returns: '6.9–8.2% p.a.',
        pros: ['100% sovereign guarantee', 'High interest (NSC: 7.7%, SCSS: 8.2%)', 'Tax deduction under 80C', 'Widely accessible even in rural areas'],
        cons: ['Lock-in periods (NSC: 5 years, SCSS: 5 years)', 'Premature withdrawal penalty', 'Old-school process, limited digital access'],
        worstCase: 'No realistic downside — government-backed. Main frustration is paperwork and branch visits.',
        bestFor: 'Senior Citizens (SCSS gives 8.2% quarterly payouts). Tax-saving with safety. Parents saving for children (SSY gives 8.2%).',
        reinvest: 'Sukanya Samriddhi Yojana for your daughter\'s education + marriage fund — 8.2% tax-free compounding is unbeatable.',
        platforms: ['India Post App', 'Post Office Branches', 'SBI (authorized agent)'],
    },
    // ===== RETIREMENT / LONG-TERM =====
    {
        id: 'ppf',
        category: 'retirement',
        icon: '🔒',
        name: 'PPF (Public Provident Fund)',
        tagline: 'The safest 15-year wealth compounder',
        risk: 'safe', riskLabel: 'Sovereign Safe', badgeClass: 'badge-safe',
        returns: '7.1% p.a. (Tax-Free EEE)',
        pros: ['EEE Tax status: Invest, Earn, Withdraw — ALL tax-free', '₹1.5L/year under Section 80C', 'Sovereign guarantee', 'Cannot be attached by court order'],
        cons: ['15-year lock-in (partial exits from year 7)', 'Max ₹1.5L per year investment', 'No inflation-beating over very long term'],
        worstCase: 'Premature closure only allowed in special cases (medical emergency, education). Main risk is liquidity lock.',
        bestFor: 'Your retirement safety net. Every Indian should max ₹1.5L/year in PPF before investing in equity.',
        reinvest: 'Max out PPF (₹1.5L/year) = guaranteed tax-free corpus. Then invest ALL remaining surplus in equity SIPs.',
        platforms: ['SBI', 'Post Office', 'Bank Branches'],
    },
    {
        id: 'epf',
        category: 'retirement',
        icon: '👔',
        name: 'EPF (Employee Provident Fund)',
        tagline: 'Mandatory retirement savings for salaried employees',
        risk: 'safe', riskLabel: 'Sovereign Safe', badgeClass: 'badge-safe',
        returns: '8.1% p.a. (Tax-Free)',
        pros: ['Employer also contributes 12% of your basic', 'Tax-free at 8.1%', 'Compulsory discipline', 'Partial withdrawal for home/medical allowed'],
        cons: ['Cannot increase voluntarily beyond salary % easily', 'Locked until retirement (age 58)', 'TDS if withdrawn before 5 years of service'],
        worstCase: 'Company shuts down — EPFO still holds your money safely and you can claim it. Takes time but is yours.',
        bestFor: 'Every salaried person. Never withdraw EPF for lifestyle goals — let it compound for 30 years for a multi-crore retirement corpus.',
        reinvest: 'Your EPF builds your "Sleep Well" corpus. Treat it as untouchable. Build all other goals via mutual funds separately.',
        platforms: ['EPFO Portal (epfindia.gov.in)', 'UMANG App'],
    },
    {
        id: 'nps',
        category: 'retirement',
        icon: '🧓',
        name: 'NPS (National Pension System)',
        tagline: 'Market-linked pension with extra tax benefits',
        risk: 'low', riskLabel: 'Low Risk', badgeClass: 'badge-low',
        returns: '9–12% p.a. (Market Linked)',
        pros: ['Extra ₹50k deduction under 80CCD(1B) beyond 80C', 'Market-linked growth (Equity + Bonds)', 'Professionally managed by PFMs', 'Annuity ensures monthly pension at retirement'],
        cons: ['40% must be converted to annuity at retirement (taxed)', 'Cannot exit fully before 60', 'Complex product for beginners'],
        worstCase: 'Market crashes near retirement — equity portion loses value. Mitigate by switching to "Conservative" lifecycle fund after age 50.',
        bestFor: 'Salaried people who want extra ₹50k tax savings beyond 80C. Long-term retirement planning with market upside.',
        reinvest: 'Open NPS for the ₹50k extra tax saving. Invest remaining surplus in Nifty index for cleaner equity exposure.',
        platforms: ['eNPS (enps.nsdl.com)', 'Banks', 'Zerodha'],
    },
    {
        id: 'atal',
        category: 'retirement',
        icon: '👷',
        name: 'Atal Pension Yojana (APY)',
        tagline: 'Government-guaranteed pension for informal workers',
        risk: 'safe', riskLabel: 'Sovereign Safe', badgeClass: 'badge-safe',
        returns: '₹1,000–₹5,000 guaranteed monthly pension',
        pros: ['Government guarantees fixed pension amount', 'Government co-contributes 50% for BPL subscribers', 'Very low monthly premiums (₹42–₹210)'],
        cons: ['Only for ages 18–40', 'Maximum pension ₹5,000/month', 'Not suitable for high-income earners'],
        worstCase: 'Inflation makes ₹5,000/month feel like nothing in 30 years. Use APY only as a floor, not primary retirement plan.',
        bestFor: 'Domestic workers, gig workers, auto drivers — anyone without a formal pension. Basic social security floor.',
        reinvest: 'APY gives a safety floor pension. Build your real retirement wealth via PPF + Nifty SIP on top of it.',
        platforms: ['Banks', 'Post Office', 'Jan Suvidha Kendra'],
    },
    // ===== EQUITY / GROWTH =====
    {
        id: 'nifty_index',
        category: 'moderate',
        icon: '📈',
        name: 'Index Funds (Nifty 50)',
        tagline: 'Own India\'s top 50 companies',
        risk: 'moderate', riskLabel: 'Moderate', badgeClass: 'badge-moderate',
        riskRating: 3, speedRating: 4,
        returns: '12–14% p.a.',
        pros: ['Very low expense ratio (0.05–0.2%)', 'Automatically tracks India\'s top 50 companies', 'No fund manager risk', 'Diversified across sectors automatically'],
        cons: ['Market can drop 30–50% in crashes', 'Boring — not exciting for short-term traders', 'Returns not guaranteed year-on-year'],
        worstCase: '2020 Covid crash: Nifty fell 38% in 45 days. Recovered in 7 months. Every long-term investor who stayed made record gains.',
        bestFor: 'EVERY investor. This is the one investment that should form the backbone of 60–80% of your equity portfolio.',
        reinvest: 'Enable Step-Up SIP: Auto-increment your SIP by 10% every January. This alone can build a ₹10 Crore retirement corpus.',
        platforms: ['Zerodha Coin', 'Groww', 'Kuvera', 'INDmoney', 'Paytm Money'],
    },
    {
        id: 'momentum_etf',
        category: 'aggressive',
        icon: '🚀',
        name: 'Momentum ETFs',
        tagline: 'Ride the fastest growing stock trends',
        risk: 'high', riskLabel: 'High Risk', badgeClass: 'badge-high',
        riskRating: 4, speedRating: 5,
        returns: '18–25% p.a.',
        pros: ['Capitalizes on existing market trends', 'Systematic & rule-based', 'Beats Nifty 50 in bull runs'],
        cons: ['High turnover costs', 'Can crash harder in sudden reversals', 'Not for the emotional investor'],
        worstCase: 'Market regime change — momentum stops working for years. Exit strategy is key.',
        bestFor: 'Alpha seekers with 5+ year horizon. Allocate 10-15% of equity satellite.',
        reinvest: 'Harvest momentum gains and move them to SGBs or Liquid funds during market peaks.',
        platforms: ['Zerodha', 'Groww', 'Nippon India', 'Edelweiss'],
    },
    {
        id: 'midcap',
        category: 'moderate',
        icon: '🚀',
        name: 'Mid Cap Fund',
        tagline: 'India\'s emerging corporate champions',
        risk: 'high', riskLabel: 'Aggressive', badgeClass: 'badge-high',
        returns: '14–18% p.a. (long-term)',
        pros: ['Higher return potential than large caps', 'Catch companies growing from small to large', 'Still relatively diversified'],
        cons: ['Can fall 40–60% in a market crash', 'High volatility, not for the faint-hearted', 'Requires 7+ year horizon minimum'],
        worstCase: '2018–2019: Mid Caps fell 40% while Large Caps were flat. Recovery took 2+ years. Never invest money needed within 5 years.',
        bestFor: 'Investors with 7+ year horizon and high risk tolerance. Allocate 20–30% of equity portfolio here alongside your Nifty Index core.',
        reinvest: 'Take mid-cap gains during market highs and shift them to debt. Reinvest in mid-cap after every 20%+ crash.',
        platforms: ['Zerodha', 'Groww', 'Kuvera', 'MFCentral'],
    },
    {
        id: 'smallcap',
        category: 'aggressive',
        icon: '🌱',
        name: 'Small Cap Fund',
        tagline: 'High risk, highest reward over 10+ years',
        risk: 'extreme', riskLabel: 'Very Aggressive', badgeClass: 'badge-extreme',
        returns: '15–22% p.a. (very long-term)',
        pros: ['Extreme wealth creation potential over 10+ years', 'Early access to tomorrow\'s large-cap companies', 'Some funds 10x\'d in 10 years'],
        cons: ['Can crash 60–70% in bear markets', 'Very illiquid in crashes (hard to sell)', 'Requires iron stomach and 10+ year hold'],
        worstCase: 'Many small-cap stocks become ZERO. Fund NAV drops 60% and takes 4+ years to recover. Never invest emergency money here.',
        bestFor: 'Investors under 35 with 10+ year horizon. Max 10–15% of total portfolio. Only money you can forget about for a decade.',
        reinvest: 'Set it, forget it, never check it monthly. The mental trick: treat it as non-existent for 10 years.',
        platforms: ['Zerodha', 'Groww', 'Paytm Money'],
    },
    {
        id: 'direct_stocks',
        category: 'aggressive',
        icon: '📊',
        name: 'Direct Stocks (India)',
        tagline: 'Own pieces of Indian companies directly',
        risk: 'high', riskLabel: 'Aggressive', badgeClass: 'badge-high',
        returns: '15–30%+ p.a. (requires skill)',
        pros: ['Unlimited upside (multibagger potential)', 'Full control over portfolio', 'Dividends + capital appreciation', 'No fund management fees'],
        cons: ['Requires deep research and time', 'Single stock can go to ZERO', 'Emotional trading leads to massive losses', 'Tax: 10% LTCG, 15% STCG'],
        worstCase: 'DHFL, Yes Bank, Reliance Power — top stocks that became near zero. Individual stocks carry company-specific risk that mutual funds don\'t.',
        bestFor: 'Experienced investors who research deeply. Allocate only 10–20% of equity to individual stocks. Rest in index funds.',
        reinvest: 'Strategy: "Coffee Can" — buy quality stocks (Infosys, HDFC Bank type) and don\'t touch for 10 years. Re-invest dividends.',
        platforms: ['Zerodha', 'Groww', 'Upstox', 'Angel One', 'ICICI Direct'],
    },
    {
        id: 'us_stocks',
        category: 'aggressive',
        icon: '🌍',
        name: 'US / Global Stocks',
        tagline: 'Invest in Apple, Google, Tesla from India',
        risk: 'moderate', riskLabel: 'Moderate', badgeClass: 'badge-moderate',
        returns: '12–18% p.a. + currency gain',
        pros: ['Dollar appreciation adds returns when ₹ weakens', 'Access to world\'s best companies', 'Portfolio diversification beyond India', 'Nasdaq 100 has beaten Nifty over 10 years'],
        cons: ['RBI LRS limit: $250,000/year', 'Currency conversion costs', 'Different tax rules (Foreign assets disclosure)', '30% US withholding tax on dividends'],
        worstCase: '2022 Nasdaq crash: -33% in one year. Dollar-hedged returns can disappoint if $ weakens against ₹.',
        bestFor: 'Investors with ₹20L+ portfolio wanting global diversification. Limit to 15–20% of equity portfolio.',
        reinvest: 'The "Dollar Drip": Invest $100/month in S&P 500 ETF. Currency averaging + market averaging compounds powerfully over decades.',
        platforms: ['INDmoney', 'Vested Finance', 'Winvesta', 'ICICI Direct iDirect'],
    },
    // ===== FIXED INCOME / BONDS =====
    {
        id: 'corp_bonds',
        category: 'moderate',
        icon: '🏢',
        name: 'Corporate Bonds',
        tagline: 'Lend to companies, earn fixed high interest',
        risk: 'moderate', riskLabel: 'Moderate Risk', badgeClass: 'badge-moderate',
        returns: '9–13% p.a.',
        pros: ['Higher returns than FD (9–13%)', 'Credit-rated (AAA/AA safer)', 'Fixed, predictable income', 'Monthly/quarterly interest payment'],
        cons: ['Company can default, losing your principal', 'Less liquid than equity', 'Tax: Interest taxed at slab rate', 'Minimum ₹10,000–₹1 Lakh per bond'],
        worstCase: 'IL&FS 2018, DHFL 2019 — AAA-rated bonds went bankrupt. Never put >10% of savings in any single corporate bond.',
        bestFor: 'Investors who crossed ₹5L in equity and want to add fixed income. Diversify across 5–10 bonds minimum.',
        reinvest: 'Use "The Interest Redirect": Take monthly bond interest (10%) and automatically invest it in a Nifty SIP. Capital stays safe, child grows in equity.',
        platforms: ['Wint Wealth', 'BondBazaar', 'GoldenPi', 'IndiaBonds', 'Zerodha Coin'],
    },
    {
        id: 'p2p',
        category: 'aggressive',
        icon: '🤝',
        name: 'P2P Lending',
        tagline: 'Lend directly for higher yields',
        risk: 'high', riskLabel: 'High Risk', badgeClass: 'badge-high',
        riskRating: 4, speedRating: 2,
        returns: '10–14% p.a.',
        pros: ['High monthly income potential', 'Small ticket sizes (₹500–₹50k per loan)', 'Monthly cash flow', 'Platform does credit checks'],
        cons: ['Borrower can default — no insurance', 'RBI capped P2P investment at ₹50L max', 'Not DICGC insured', 'Platform may shut down (3 major platforms closed 2021–2023)'],
        worstCase: 'Borrower defaults: You lose your principal. Platform shuts down: Recovery takes years via courts. NEVER put >5% of savings here.',
        bestFor: 'Sophisticated investors with > ₹10L portfolio. Treat it as "exciting fixed income" — keep exposure below 5% of total wealth.',
        reinvest: 'Never reinvest P2P interest in P2P. Route monthly P2P income into an index fund to reduce concentration risk.',
        platforms: ['Lendbox', 'Faircent', 'LiquiLoans', '12% Club (CAUTION: celebrity endorsement ≠ safety)'],
    },
    {
        id: 'debt_mf',
        category: 'safe',
        icon: '💼',
        name: 'Debt Mutual Funds',
        tagline: 'FD-like safety with slightly better returns',
        risk: 'low', riskLabel: 'Low Risk', badgeClass: 'badge-low',
        returns: '6–9% p.a.',
        pros: ['More tax-efficient than FD (indexation benefit for 3yr+)', 'More liquid than FD (T+1 redemption)', 'Professional management', 'Better than savings account for idle cash'],
        cons: ['Returns not guaranteed (slight market risk)', 'Credit risk in corporate debt funds', 'Slightly complex to choose the right one'],
        worstCase: '2020 Franklin Templeton shut 6 debt funds suddenly — investors could not redeem for months. Stick to Govt Bond / Liquid funds.',
        bestFor: 'Parking surplus cash for 3–12 months. Better than FD if in 30% tax bracket (due to indexation). Good alternative to sweep FD.',
        reinvest: 'Liquid funds = parking lot. When equity falls 20%+, redeem debt funds and buy Nifty at a discount.',
        platforms: ['Paytm Money', 'Groww', 'Zerodha Coin', 'Kuvera'],
    },
    // ===== GOLD =====
    {
        id: 'sgb',
        category: 'moderate',
        icon: '🥇',
        name: 'Sovereign Gold Bonds (SGB)',
        tagline: 'The best way to own gold in India',
        risk: 'low', riskLabel: 'Low-Moderate', badgeClass: 'badge-low',
        returns: '8–12% p.a. (Gold price + 2.5% interest)',
        pros: ['2.5% annual interest over gold price appreciation', 'Zero capital gains tax if held to maturity (8 years)', 'No storage risk or making charges', '100% sovereign backed'],
        cons: ['8-year lock-in (exit from year 5 allowed)', 'Priced in grams — fluctuates with international gold price', 'Limited issuance windows per year'],
        worstCase: 'Gold prices fall globally (rare historically). Even if gold falls 20%, the 2.5% interest partially compensates.',
        bestFor: 'Ideal hedge for 10% of your portfolio against inflation and currency devaluation. Buy during every SGB issue window.',
        reinvest: 'Collect the 2.5% annual SGB interest and deploy it into a MidCap SIP. Gold protects, equity grows.',
        platforms: ['RBI (rbidirectonline)', 'Zerodha', 'Groww', 'HDFC Securities'],
    },
    {
        id: 'physical_gold',
        category: 'moderate',
        icon: '💛',
        name: 'Physical Gold / Jewellery',
        tagline: 'Traditional gold with hidden costs',
        risk: 'moderate', riskLabel: 'Moderate', badgeClass: 'badge-moderate',
        returns: '7–10% p.a. (price only)',
        pros: ['Cultural & emotional value', 'Can be pledged as collateral for loans', 'No digital risk', 'Works as emergency backup'],
        cons: ['Making charges 10–25% lost immediately', 'Storage risk (theft, locker fees)', 'No interest/dividend', 'Impure (purity issues in non-hallmarked gold)'],
        worstCase: 'Buy jewellery for ₹1L. Pay ₹15k making charges. On Day 1 your asset is worth ₹85k. That is a 15% instant loss.',
        bestFor: 'Cultural occasions and as emergency physical backup only. For investment, ALWAYS choose SGB or Gold ETF over jewellery.',
        reinvest: 'Never buy jewellery as investment. Convert existing gold into SGB when the window opens for better returns and zero storage risk.',
        platforms: ['Local Jewellers (hallmarked BIS only)', 'Gold ETF via NSE'],
    },
    {
        id: 'gold_etf',
        category: 'moderate',
        icon: '📉',
        name: 'Gold ETF',
        tagline: 'Digital gold, instantly tradeable',
        risk: 'low', riskLabel: 'Low Risk', badgeClass: 'badge-low',
        returns: '7–10% p.a.',
        pros: ['No storage cost or theft risk', 'Can buy as little as 1 gram', 'Instantly tradeable like a stock', 'Pure 99.5% gold exposure'],
        cons: ['No interest income (unlike SGB)', 'Small expense ratio (0.5%)', 'Capital gains tax: 20% with indexation after 3 years'],
        worstCase: 'Gold price globally tanks — same risk as physical gold but without storage hassle.',
        bestFor: 'If you miss the SGB window or need more frequent trading. Keep 5–10% of portfolio in gold via ETF or SGB.',
        reinvest: 'Use Gold ETF as a "crisis hedge". When equities are crashing, often gold is rising — rebalance out of gold into equities.',
        platforms: ['Zerodha', 'Groww', 'Upstox', 'HDFC Securities'],
    },
    // ===== REAL ESTATE =====
    {
        id: 'real_estate',
        category: 'alternative',
        icon: '🏠',
        name: 'Real Estate (Direct)',
        tagline: 'Buy property — India\'s oldest wealth creator',
        risk: 'moderate', riskLabel: 'Moderate', badgeClass: 'badge-moderate',
        returns: '8–14% p.a. (rent + appreciation)',
        pros: ['Tangible asset that rarely goes to zero', 'Rental income + capital appreciation', 'Leverage (loan amplifies returns)', 'Can live in it — dual purpose'],
        cons: ['Very illiquid (takes months to sell)', 'High entry cost (₹30L+)', 'Maintenance, tenant headaches', 'Stamp duty, registration, brokerage: 8–12% loss upfront'],
        worstCase: 'No buyer found when you need money urgently. Prices stuck for 10+ years in some cities (Noida: 2011–2022 flat). Illiquidity is the real risk.',
        bestFor: 'Your primary home: A lifestyle asset, not purely investment. For investment, REITs give same exposure without the headaches.',
        reinvest: 'Collect rental income (3–4% yield). Invest it fully in equity SIP. Real estate builds stability, equity builds wealth velocity.',
        platforms: ['NoBroker', 'MagicBricks', '99acres', 'Square Yards'],
    },
    {
        id: 'reit',
        category: 'alternative',
        icon: '🏙️',
        name: 'REITs (Real Estate Investment Trusts)',
        tagline: 'Own Grade-A offices and malls for ₹300',
        risk: 'moderate', riskLabel: 'Moderate', badgeClass: 'badge-moderate',
        returns: '8–12% p.a. (dividends + appreciation)',
        pros: ['Own Grade-A commercial property with ₹300–400', 'Quarterly dividend income (5–6% yield)', 'Highly liquid (traded on NSE)', 'SEBI regulated, transparent'],
        cons: ['Affected by vacancy rates and corporate leasing trends', 'Interest rate sensitive', 'Limited choice in India currently (3 major REITs)'],
        worstCase: 'Work-from-home trend: Office vacancy increases, rental income drops, REIT unit price falls.',
        bestFor: 'Investors wanting real estate exposure without the hassle. Diversify 5–10% of portfolio into REITs for quarterly income.',
        reinvest: 'REIT distributions come quarterly. Route them into a Nifty fund to diversify out of real estate over time.',
        platforms: ['Zerodha', 'Groww', 'HDFC Securities (Embassy REIT, Mindspace REIT, Nexus Mall)'],
    },
    {
        id: 'invit',
        category: 'alternative',
        icon: '⚡',
        name: 'InvITs (Infrastructure Trusts)',
        tagline: 'Own India\'s toll roads and power lines',
        risk: 'moderate', riskLabel: 'Moderate', badgeClass: 'badge-moderate',
        returns: '8–14% p.a.',
        pros: ['Infrastructure assets are very stable revenue generators', 'High dividend yield (8–10%)', 'Government-backed project pipelines', 'Diversifies beyond corporate risk'],
        cons: ['Regulatory risk if govt changes toll policy', 'Less liquid than equity', 'Complex to analyse for retail investors'],
        worstCase: 'Government removes tolls on a key road. Revenue drops drastically. InvIT unit price craters.',
        bestFor: 'Income-focused investors wanting stable 8–10% quarterly dividends. Good addition for 5% of portfolio after ₹10L corpus.',
        reinvest: 'InvIT payouts are quarterly. Rebalance into equity SIP monthly to maintain asset allocation.',
        platforms: ['Zerodha', 'HDFC Securities (IRB InvIT, India Grid Trust, POWERGRID InvIT)'],
    },
    // ===== INSURANCE =====
    {
        id: 'term_insurance',
        category: 'safe',
        icon: '🛡️',
        name: 'Term Insurance',
        tagline: 'NOT an investment — pure life protection',
        risk: 'safe', riskLabel: 'NOT Investment', badgeClass: 'badge-safe',
        returns: '0% — pure protection',
        pros: ['Cheapest way to protect family (₹1 Crore cover for ₹800/month)', 'Simple: pay premium, family gets sum on death', 'Online terms are 30–40% cheaper than agent sales'],
        cons: ['Zero returns if you survive', 'Premiums rise sharply with age', 'NOT an investment product — never treat it as one'],
        worstCase: 'You outlive the policy term and get nothing back. This is by design. "Returns" come via not dying — your family is protected.',
        bestFor: 'MANDATORY for all earning members with dependents. Every family needs term insurance equal to 10–15x annual income.',
        reinvest: 'Do NOT buy ULIP or Endowment mixing insurance+investment. Buy pure Term (cheapest insurance) + Nifty SIP (best investment. They are separate.',
        platforms: ['PolicyBazaar', 'Ditto Insurance', 'LIC eTerm', 'HDFC Life', 'ICICI Prudential'],
    },
    {
        id: 'ulip',
        category: 'moderate',
        icon: '⚠️',
        name: 'ULIP (Unit Linked Insurance Plan)',
        tagline: 'Insurance + Investment — usually not the best of either',
        risk: 'moderate', riskLabel: 'Moderate', badgeClass: 'badge-moderate',
        returns: '6–10% p.a. (after charges)',
        pros: ['Dual benefit: life coverage + market returns', 'Tax exemption on maturity under 10(10D)', 'Lock-in ensures discipline (5 years)'],
        cons: ['Premium Allocation charge: 1–5% of each premium', 'Mortality + Policy admin charges: 1–3% per year', 'Worse insurance than term + worse investment than index fund'],
        worstCase: 'If you need to exit in first 5 years, you lose heavily to charges. True story: ₹5L ULIP premium → ₹3.8L invested after charges in year 1.',
        bestFor: 'Only if you have already maxed PPF, 80C, and need a specific tax-exempt corpus for 10+ years. Otherwise: avoid.',
        reinvest: 'Already have a ULIP? Complete the 5-year lock-in (to avoid surrender charges). Then surrender and reinvest in Index Fund + Term Insurance combo.',
        platforms: ['LIC', 'HDFC Life', 'ICICI Prudential', 'SBI Life'],
    },
    {
        id: 'lic_endowment',
        category: 'moderate',
        icon: '👴',
        name: 'LIC / Endowment Plans',
        tagline: 'Traditional insurance-savings combo',
        risk: 'low', riskLabel: 'Low Risk', badgeClass: 'badge-low',
        returns: '4–5.5% p.a.',
        pros: ['Guaranteed maturity benefit (capital protected)', 'Bonus additions over years', 'Tax benefits under 80C', 'Good psychological "forced saving"'],
        cons: ['Very low returns (4–5%) below inflation', 'Very high agent commission (30% of first year premium)', 'Very long lock-in (15–25 years)', 'Surrender value much lower than premiums paid'],
        worstCase: 'Inflation at 6%, LIC Endowment at 4.5% = You are getting poorer in real terms every year while thinking you are safe.',
        bestFor: 'Nobody, ideally. If you have already started one, calculate surrender value and compare with reinvesting in index fund. Often better to surrender after 3+ years.',
        reinvest: 'Switch strategy: Buy cheapest Term Plan (PolicyBazaar) + Invest the same premium in Nifty index = much higher corpus at maturity.',
        platforms: ['LIC India', 'PolicyBazaar'],
    },
    // ===== ALTERNATIVE / SPECULATIVE =====
    {
        id: 'crypto',
        category: 'aggressive',
        icon: '🔮',
        name: 'Cryptocurrency',
        tagline: 'Highest risk, highest potential — 30% flat tax in India',
        risk: 'extreme', riskLabel: 'Very Aggressive', badgeClass: 'badge-extreme',
        returns: '-90% to +10,000% (unpredictable)',
        pros: ['Explosive growth potential (Bitcoin 1000x in 10 years)', '24/7 market, globally accessible', 'Decentralized — not controlled by any government', 'Hedge against ₹ devaluation'],
        cons: ['30% flat tax on gains in India + TDS on every transaction', 'Can lose 80–90% in bear markets', 'Exchange hacks: WazirX hack 2024 — ₹2000 Crore stolen', 'No regulatory protection in India currently'],
        worstCase: 'FTX collapse 2022: Billions locked, exchange went bankrupt, users lost everything. Never keep crypto on an exchange long-term.',
        bestFor: 'Only with money you can afford to lose entirely. Max 2–5% of total portfolio. Never borrow to buy crypto.',
        reinvest: 'If crypto gains — take profits, pay taxes, then move profits into boring index funds. Let crypto be a lottery ticket, not a retirement plan.',
        platforms: ['CoinDCX', 'WazirX (CAUTION post-hack)', 'Mudrex', 'Ledger (hardware wallet — must have)'],
    },
    {
        id: 'angel',
        category: 'aggressive',
        icon: '👼',
        name: 'Angel Investing / Startup Equity',
        tagline: 'Fund the next Zepto or Zomato early',
        risk: 'extreme', riskLabel: 'Very Aggressive', badgeClass: 'badge-extreme',
        returns: '0x to 1000x (majority fail)',
        pros: ['Potential for 100x returns if startup succeeds', 'SEBI AIFs give structured access', 'Exciting involvement in building companies', 'Growing India startup ecosystem'],
        cons: ['90%+ of startups fail — you lose 100% of investment', 'Very illiquid (8–10 years before exit)', 'Minimum ₹25L per deal typically', 'No secondary market to exit early'],
        worstCase: 'Startup shuts down in 2 years. Your ₹5L investment is zero. Cannot even claim a tax loss in most cases.',
        bestFor: 'Only use surplus wealth that is truly spare (not needed for 10 years). Maximum 5% of net worth. Only if you can say NO to the deal.',
        reinvest: 'Angel investing is for fun money. Your real wealth comes from boring index fund SIPs. Keep these separate.',
        platforms: ['AngelList India', 'LetsVenture', 'Ah! Ventures', 'Titan Capital (institutional)'],
    },
    {
        id: 'commodity',
        category: 'aggressive',
        icon: '⚙️',
        name: 'Commodities (Silver, Oil, Agri)',
        tagline: 'Trade on raw materials and natural resources',
        risk: 'high', riskLabel: 'High Risk', badgeClass: 'badge-high',
        returns: 'Highly variable (0–30%+)',
        pros: ['Inflation hedge (oil rises when inflation rises)', 'Portfolio diversification', 'Can trade via MCX without physical delivery'],
        cons: ['Very complex, driven by global geopolitics', 'Futures-based — contango can erode returns', 'Not suitable for beginners'],
        worstCase: '2020: Oil futures went NEGATIVE (price below zero) — traders had to pay to deliver oil. Extreme events can wipe beginner accounts.',
        bestFor: 'Sophisticated traders only. Retail investors should use Gold/SGB as their commodity exposure. Skip directly trading oil/silver futures.',
        reinvest: 'Not recommended for wealth building. Use Gold SGB for inflation hedge instead of complex commodity trading.',
        platforms: ['Zerodha (MCX)', 'Angel One', 'ICICI Direct'],
    },
    {
        id: 'chit',
        category: 'aggressive',
        icon: '⚠️',
        name: 'Chit Funds',
        tagline: 'Old-school rotating savings — high risk',
        risk: 'high', riskLabel: 'High Risk', badgeClass: 'badge-high',
        returns: '7–15% p.a. (if legitimate)',
        pros: ['Flexible borrowing and saving combined', 'Good for South Indian communities with trusted social contracts', 'Higher return than FD if you get the chit early'],
        cons: ['Chit organizer (foreman) can abscond with money', 'No DICGC protection', 'Many illegal unregistered chits', 'If you get the chit at the end, your return is lowest'],
        worstCase: 'Hundreds of chit fund scams in Kerala, TN, AP — people lost life savings. Saradha, Rose Valley, etc. Always verify State Registrar registration.',
        bestFor: 'Only if: (1) You personally know every participant, (2) It is registered with the state Registrar of Chits. Otherwise — avoid completely.',
        reinvest: 'Instead of a chit fund, use a Kuvera goal-based SIP. Same forced discipline, regulated, and historically 12% returns vs 8% chit.',
        platforms: ['Only registered chit companies: Margadarsi, KPC, registered state chit funds'],
    },
    {
        id: 'nsc',
        category: 'safe',
        icon: '📜',
        name: 'NSC (National Savings Certificate)',
        tagline: 'Government 5-year savings bond',
        risk: 'safe', riskLabel: 'Sovereign Safe', badgeClass: 'badge-safe',
        returns: '7.7% p.a. (compounded, taxable)',
        pros: ['Sovereign guarantee', 'Section 80C benefit (up to ₹1.5L)', 'Annual interest qualifies as fresh investment for 80C', 'Available at all post offices'],
        cons: ['5-year lock-in', 'Interest taxed at slab rate', 'TDS applicable', 'Returns lower than Mid-Cap equity over 7+ years'],
        worstCase: 'No realistic downside as it is sovereign-backed. Main limitation is illiquidity for 5 years.',
        bestFor: 'Conservative investors who have maxed PPF and want more Section 80C savings with guaranteed returns.',
        reinvest: 'Use NSC for your safe 80C quota. Then invest surplus in index funds for actual returns above inflation.',
        platforms: ['All India Post Offices', 'Online via India Post Payments Bank'],
    },
    {
        id: 'scss',
        category: 'retirement',
        icon: '👵',
        name: 'SCSS (Senior Citizen Saving Scheme)',
        tagline: 'Highest safe returns for retirees — 8.2% p.a.',
        risk: 'safe', riskLabel: 'Sovereign Safe', badgeClass: 'badge-safe',
        returns: '8.2% p.a. (Highest govt rate)',
        pros: ['8.2% p.a. — highest government scheme rate', 'Quarterly payouts — perfect for retiree income', 'Section 80C benefit', '100% sovereign guarantee'],
        cons: ['Only for 60+ age (55+ if retired via VRS)', 'Max ₹30L investment per account', '5-year tenure (extendable by 3 years)', 'TDS above ₹50k interest'],
        worstCase: 'Rate changes at maturity — not guaranteed to remain 8.2% when you renew. Lock rates while they are high.',
        bestFor: 'Every retiree must park retirement corpus here first. ₹30L in SCSS = ₹2,460/month guaranteed income without touching principal.',
        reinvest: 'Take SCSS quarterly payout → invest 50% in liquid fund for emergency → 50% in conservative balanced fund for preservation.',
        platforms: ['SBI', 'Post Offices', 'Other nationalized banks'],
    },
    {
        id: 'ssy',
        category: 'safe',
        icon: '👧',
        name: 'Sukanya Samriddhi Yojana (SSY)',
        tagline: 'Best investment for your daughter\'s future',
        risk: 'safe', riskLabel: 'Sovereign Safe', badgeClass: 'badge-safe',
        returns: '8.2% p.a. (Tax-Free EEE)',
        pros: ['8.2% tax-free — best risk-free return available', 'EEE status: invest, earn, withdraw all tax-free', 'Only valid for daughters under 10 years', 'Section 80C benefit up to ₹1.5L'],
        cons: ['Locked until daughter turns 21 (partial exit at 18)', 'Max ₹1.5L/year per account', 'Only 2 accounts per family (max daughters)'],
        worstCase: 'Marginal. Locked for 21 years is the only downside. The compounding at 8.2% over 21 years is extraordinary.',
        bestFor: 'Every parent of a girl child under 10 years MUST open SSY immediately. ₹12,500/month for 15 years = potential ₹70L+ corpus at 21.',
        reinvest: 'Max SSY every year. The 8.2% tax-free rate beats most fixed income options. It is the easiest financial gift you can give your daughter.',
        platforms: ['Post Office', 'SBI', 'Most nationalized banks'],
    },
    // ===== HIGH REWARD / SMALL AMOUNT OPTIONS =====
    {
        id: 'smallcase',
        category: 'moderate',
        icon: '🧩',
        name: 'Smallcases (Thematic Baskets)',
        tagline: 'Curated stock baskets from ₹500',
        risk: 'high', riskLabel: 'Aggressive', badgeClass: 'badge-high',
        returns: '12–25% p.a. (theme-dependent)',
        pros: ['Start with ₹500–₹1,000', 'Pre-researched expert stock baskets', 'One-click rebalancing', 'Multiple themes: EV, AI, Bharat, Defence'],
        cons: ['Management fee 0.5–2% per rebalance', 'Stock-level risk — not diversified like index', 'Themes can go out of fashion (eg: PSU theme, Pharma)'],
        worstCase: 'Thematic basket falls out of favour. All stocks crash together since they are correlated. You lose 40–50% in sector downturns.',
        bestFor: 'Investors who want curated thematic exposure beyond plain Nifty. Excellent for small amounts (₹500) to start learning stock investing.',
        reinvest: 'Treat Smallcase as 10–15% satellite around a Nifty core. Rebalance annually based on theme performance.',
        platforms: ['Smallcase.com', 'Zerodha', 'Groww', 'Angel One'],
    },
    {
        id: 'digital_gold',
        category: 'safe',
        icon: '✨',
        name: 'Digital Gold',
        tagline: 'Buy 24K gold from ₹1',
        risk: 'low', riskLabel: 'Low Risk', badgeClass: 'badge-low',
        returns: '7–10% p.a.',
        pros: ['Start from just ₹1', 'No storage risk', '24K purity guaranteed', 'Can be converted to physical gold or SGB'],
        cons: ['GST 3% on buying', 'Not SEBI regulated (platform risk)', 'Slightly worse than SGB — no 2.5% interest income', 'Storage fees charged after 5 years on some platforms'],
        worstCase: 'Platform (MMTC-PAMP, SafeGold) shuts down. Your gold is held in vaults but recovery can take months.',
        bestFor: 'Beginners who want gold exposure with ₹100–₹500 to start. Gateway product before moving to SGB.',
        reinvest: 'Accumulate digital gold until you have 1 gram. Then convert to SGB when window opens for 2.5% interest bonus.',
        platforms: ['PhonePe', 'Google Pay', 'Paytm (via SafeGold)', 'Zerodha (via MMTC-PAMP)'],
    },
    {
        id: 'fo',
        category: 'aggressive',
        icon: '🎰',
        name: 'F&O Trading (Futures & Options)',
        tagline: 'Leverage-based derivatives — extreme risk',
        risk: 'extreme', riskLabel: 'Extreme Risk', badgeClass: 'badge-extreme',
        returns: '-100% to +1000% (most lose money)',
        pros: ['Leverage: control ₹10L position with ₹1L margin', 'Can profit in falling markets (PUT options)', 'Short-term income for experts'],
        cons: ['SEBI study: 89% of F&O traders lose money', 'Can lose MORE than your investment (negative balance)', 'New tax rule: 23% tax on all gains from 2024', 'Extremely addictive — behavioural gambling risk'],
        worstCase: 'SEBI 2023 study: Average F&O retail trader loses ₹1.1 Lakh per year. 9 out of 10 traders are net losers. This is not trading — for most, it is gambling.',
        bestFor: 'Nobody is recommended. If you insist: only after 5+ years of profitable equity investing, strict position sizing, and treating losses as tuition fees.',
        reinvest: 'Every rupee in F&O is a rupee NOT compounding in an index fund. The opportunity cost alone makes it unviable for most retail investors.',
        platforms: ['Zerodha', 'Upstox', 'Angel One (CAUTION: have a strict stop-loss plan)'],
    },
    {
        id: 'liquid_mf',
        category: 'safe',
        icon: '💧',
        name: 'Liquid / Overnight Funds',
        tagline: 'Park cash overnight, earn better than savings',
        risk: 'safe', riskLabel: 'Low Risk', badgeClass: 'badge-safe',
        returns: '6.5–7.5% p.a.',
        pros: ['Withdraw in T+1 day (instant with Instant Redemption)', 'Better than savings account (7% vs 3.5%)', 'No exit load in most funds', 'Invest any amount from ₹100'],
        cons: ['Returns slightly variable month-to-month', 'Taxed as per slab if held < 3 years', 'Slightly complex vs savings account'],
        worstCase: 'Extremely rare — Liquid funds can technically have 1-day loss in extreme credit events (like Franklin Debt Fund crisis).',
        bestFor: 'Parking salary before investing. Keep 1–2 months of expenses here instead of savings account. Emergency fund access with better returns.',
        reinvest: 'Liquid Fund = Your Smart Emergency Parking. When equities fall 20%+, redeem and deploy into Nifty lumpsum.',
        platforms: ['Groww', 'Zerodha Coin', 'Kuvera', 'Paytm Money (Parag Parikh Liquid, HDFC Liquid)'],
    },
];

// ===== PER-ASSET CHECKLIST (before you invest) =====
const INVEST_CHECKLIST = {
    default: [
        'Is your 6-month Emergency FD fully funded first?',
        'Have you checked the SEBI/RBI registration of this platform?',
        'Does this investment match your goal timeline?',
        'Do you understand how this investment makes money?',
        'Have you read the "What Can Go Wrong?" section above?',
    ],
    crypto: [
        'Are you prepared to lose 100% of this money?',
        'Is this <5% of your total investment corpus?',
        'Have you set up a hardware wallet (Ledger/Trezor)?',
        'Have you turned on 2FA on your exchange account?',
        'Do you understand the 30% flat tax + TDS rules in India?',
    ],
    mutual_fund: [
        'Have you compared Expense Ratio (lower is better, target <0.5%)?',
        'Did you check 5-year and 10-year rolling returns, not just 1-year?',
        'Have you set up Step-Up SIP (+10% every year automatically)?',
        'Is the fund direct plan, not regular plan? (Regular = 1% less returns per year)',
        'Have you enabled auto-debit so you never miss a month?',
    ],
    fd: [
        'Is the bank DICGC insured? (All RBI-scheduled banks are)',
        'Check your total deposits in this bank — DICGC covers only ₹5L per bank',
        'Have you compared Small Finance Bank rates (often 0.5% higher)?',
        'Is the interest payout monthly/quarterly to reinvest into SIP?',
        'Have you checked no TDS will be deducted (keep below ₹40k/year threshold)?',
    ],
    p2p: [
        'Is the platform RBI registered as NBFC-P2P?',
        'Are you spreading across 100+ borrowers to reduce default risk?',
        'Is this <5% of your total portfolio?',
        'Have you read the NBFC-P2P RBI circular on ₹50L cap?',
        'Are you never using borrowed money to invest in P2P?',
    ],
    sgb: [
        'Is the SGB issue window currently open? (Check RBI calendar)',
        'Are you buying through HDFC/SBI/Zerodha for online discount?',
        'Are you planning to hold to 8-year maturity for tax-free redemption?',
        'Have you checked the current issue price vs spot gold price?',
        'Is this max 10% of your total portfolio?',
    ],
    stocks_in: [
        'Have you read the company\'s last 3 Annual Reports?',
        'Is the Debt-to-Equity ratio below 1.0?',
        'Is the promoter holding above 50%?',
        'Have you checked for recent pledging of promoter shares?',
        'Can you hold this for 5+ years without needing the money?',
    ],
    fo: [
        'STOP. 89% of F&O traders lose money per SEBI data.',
        'Have you been consistently profitable in equity investing for 5+ years?',
        'Do you have a strict stop-loss for every trade before entering?',
        'Is the maximum capital you can lose here less than 2% of net worth?',
        'Have you practised for 6 months on paper (non-real money) trading first?',
    ],
};

// ===================== RENDER GRID =====================
function renderLibGrid(filter = 'all') {
    const grid = document.getElementById('lib-grid');
    if (!grid) return;
    const filtered = filter === 'all'
        ? INVESTMENT_LIBRARY
        : INVESTMENT_LIBRARY.filter(i => i.category === filter);
        
    grid.innerHTML = filtered.map(item => {
        const ratingsHTML = item.riskRating ? `
            <div class="lib-ratings">
                <div class="rating-row"><span>Logic Risk</span><div class="rating-dots">${'⬬'.repeat(item.riskRating)}${'⬩'.repeat(5-item.riskRating)}</div></div>
                <div class="rating-row"><span>Growth Alpha</span><div class="rating-dots" style="color:var(--indigo)">${'⬬'.repeat(item.speedRating)}${'⬩'.repeat(5-item.speedRating)}</div></div>
            </div>
        ` : '';
        return `
            <div class="app-card ${item.risk === 'safe' ? 'glow-emerald' : 'glow-indigo'}" onclick="openLibModal('${item.id}')" data-cat="${item.category}" style="cursor:pointer; margin-bottom:12px;">
                <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:12px;">
                    <span style="font-size:24px;">${item.icon}</span>
                    <span class="lib-risk-badge badge-${item.risk}">${item.riskLabel}</span>
                </div>
                <div style="font-family:var(--font-display); font-weight:800; color:white; font-size:16px; margin-bottom:2px;">${item.name}</div>
                <div style="font-size:11px; color:var(--slate); margin-bottom:12px; line-height:1.4;">${item.tagline}</div>
                ${ratingsHTML}
                <div style="margin-top:12px; display:flex; justify-content:space-between; align-items:center;">
                    <span style="font-size:14px; font-weight:800; color:var(--emerald); font-family:var(--font-mono);">${item.returns}</span>
                    <i data-lucide="chevron-right" style="width:14px; color:var(--slate-mid);"></i>
                </div>
            </div>
        `;
    }).join('');
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

function filterLib(cat, btn) {
    document.querySelectorAll('.lib-filter').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    renderLibGrid(cat);
}

// ===================== DEEP DIVE MODAL (with checklist) =====================
function openLibModal(id) {
    const item = INVESTMENT_LIBRARY.find(i => i.id === id);
    if (!item) return;
    const overlay = document.getElementById('lib-modal-overlay');
    const inner = document.getElementById('lib-modal-inner');
    const prosHTML = item.pros.map(p => `• ${p}`).join('<br>');
    const consHTML = item.cons.map(c => `• ${c}`).join('<br>');
    const checklist = INVEST_CHECKLIST[item.id] || INVEST_CHECKLIST.default;
    const checklistHTML = checklist.map((q, i) => `
        <label style="display:flex; align-items:flex-start; gap:8px; margin-bottom:6px; cursor:pointer; font-size:12px; line-height:1.4;">
            <input type="checkbox" id="chk_${id}_${i}" style="margin-top:2px; accent-color:#059669;">
            <span>${q}</span>
        </label>
    `).join('');
    inner.innerHTML = `
        <div class="lib-modal-header" style="background:var(--obsidian-dark); padding:32px 24px; border-bottom:1px solid var(--glass-border);">
            <div style="font-size:48px; margin-bottom:12px;">${item.icon}</div>
            <div class="lib-modal-header-info">
                <div style="font-family:var(--font-display); font-weight:800; font-size:24px; color:white; line-height:1.2;">${item.name}</div>
                <div style="font-size:12px; color:var(--slate); text-transform:uppercase; letter-spacing:1px; margin-top:4px;">${item.tagline}</div>
                <div style="margin-top:16px; display:flex; gap:12px; align-items:center;">
                    <span class="lib-risk-badge badge-${item.risk}">${item.riskLabel}</span>
                    <span style="font-size:20px; font-weight:900; color:var(--emerald); font-family:var(--font-mono);">${item.returns}</span>
                </div>
            </div>
        </div>
        <div class="lib-modal-body" style="background:var(--obsidian); padding:24px; color:var(--slate-light);">
            <div class="lib-modal-section">
                <div style="font-weight:800; font-size:14px; color:white; margin-bottom:8px; display:flex; align-items:center; gap:6px;">
                    <i data-lucide="info" style="width:16px;"></i> Strategic Best Use
                </div>
                <div style="font-size:13px; line-height:1.6; color:var(--slate);">${item.bestFor}</div>
            </div>

            <div class="app-card" style="background:rgba(248, 113, 113, 0.05); border-color:rgba(248, 113, 113, 0.2); margin:20px 0;">
                <div style="font-weight:800; font-size:13px; color:var(--error); margin-bottom:6px; display:flex; align-items:center; gap:6px;">
                    <i data-lucide="alert-triangle" style="width:16px;"></i> Critical Risk Analysis
                </div>
                <div style="font-size:12px; line-height:1.5; color:var(--slate-light);">${item.worstCase}</div>
            </div>

            <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-bottom:24px;">
                <div class="lib-pros">
                    <div style="font-weight:800; font-size:12px; color:var(--success); margin-bottom:8px;">PROS</div>
                    <div style="font-size:12px; line-height:1.5;">${prosHTML}</div>
                </div>
                <div class="lib-cons">
                    <div style="font-weight:800; font-size:12px; color:var(--error); margin-bottom:8px;">CONS</div>
                    <div style="font-size:12px; line-height:1.5;">${consHTML}</div>
                </div>
            </div>

            <div class="lib-modal-section" style="background:rgba(129, 140, 248, 0.05); border:1px solid rgba(129, 140, 248, 0.1); border-radius:12px; padding:16px;">
                <div style="font-weight:800; font-size:14px; color:var(--indigo); margin-bottom:6px;">Algorithmic Reinvestment</div>
                <div style="font-size:12px; line-height:1.6; color:var(--slate-light);">${item.reinvest}</div>
            </div>

            <div style="margin-top:24px;">
                <div style="font-weight:800; font-size:12px; color:var(--slate-mid); text-transform:uppercase; margin-bottom:12px;">Institutional Access Platforms</div>
                <div style="display:flex; flex-wrap:wrap; gap:8px;">
                    ${item.platforms.map(p => `<span style="background:var(--surface); border:1px solid var(--glass-border); padding:4px 10px; border-radius:6px; font-size:11px; font-weight:700; color:var(--slate);">${p}</span>`).join('')}
                </div>
            </div>
        </div>
        <button class="app-btn-sm" onclick="closeLibModal()" style="position:absolute; top:12px; right:12px; width:40px; height:40px; border-radius:50%;"><i data-lucide="x"></i></button>
    `;
    overlay.style.display = 'block';
    document.body.style.overflow = 'hidden';
}

function closeLibModal(event) {
    if (event && event.target !== document.getElementById('lib-modal-overlay')) return;
    document.getElementById('lib-modal-overlay').style.display = 'none';
    document.body.style.overflow = '';
}

// ===================== DIVERSIFICATION METER =====================
function updateDiversificationMeter() {
    const content = document.getElementById('div-meter-content');
    if (!content || !engineMemory.totalAssets) return;
    const total = engineMemory.totalAssets || 0;
    const cash = engineMemory.astCash || 0;
    const eq = engineMemory.astEq || 0;
    const pf = engineMemory.astPF || 0;
    if (total === 0) return;
    const cashPct = Math.round((cash / total) * 100);
    const eqPct = Math.round((eq / total) * 100);
    const pfPct = Math.round((pf / total) * 100);
    let advice = '';
    let meterPos = 50;
    if (cashPct > 70) {
        advice = `<span style="color:#b45309; font-weight:800;">&#9888;&#65039; Over-Safe Zone:</span> ${cashPct}% in cash/FDs. While safe, you are losing money to inflation (6%). Add at least 30% in equity index funds to grow faster.`;
        meterPos = 15;
    } else if (eqPct > 90) {
        advice = `<span style="color:#ef4444; font-weight:800;">&#128293; Over-Aggressive:</span> ${eqPct}% in volatile assets. A 30% market crash could devastate your portfolio. Build a 6-month FD emergency fund first.`;
        meterPos = 85;
    } else if (cashPct >= 20 && cashPct <= 40 && eqPct >= 40 && eqPct <= 70) {
        advice = `<span style="color:#059669; font-weight:800;">&#9989; Well-Balanced Portfolio:</span> Your mix of ${cashPct}% safe assets and ${eqPct}% equity is excellent. Consider adding 5&#8211;10% in SGBs or REITs for further diversification.`;
        meterPos = 50;
    } else {
        advice = `Your portfolio: ${cashPct}% Safe | ${eqPct}% Equity | ${pfPct}% Retirement. Target: 20&#8211;30% safe, 50&#8211;60% equity, 15&#8211;20% retirement, 5&#8211;10% alternatives.`;
        meterPos = cashPct > 50 ? 25 : 65;
    }
    content.innerHTML = `
        <div style="display:grid; grid-template-columns: repeat(3, 1fr); gap:12px; margin-bottom:14px;">
            <div style="text-align:center; padding:10px; background:#f0fdf4; border-radius:8px;">
                <div style="font-size:22px; font-weight:900; color:#166534;">${cashPct}%</div>
                <div style="font-size:11px; color:#064e3b; font-weight:700;">Safe Assets</div>
            </div>
            <div style="text-align:center; padding:10px; background:#eff6ff; border-radius:8px;">
                <div style="font-size:22px; font-weight:900; color:#1d4ed8;" class="money-value">${eqPct}%</div>
                <div style="font-size:11px; color:#1e40af; font-weight:700;">Growth Assets</div>
            </div>
            <div style="text-align:center; padding:10px; background:#faf5ff; border-radius:8px;">
                <div style="font-size:22px; font-weight:900; color:#6b21a8;">${pfPct}%</div>
                <div style="font-size:11px; color:#581c87; font-weight:700;">Retirement</div>
            </div>
        </div>
        <div class="div-meter-bar">
            <div class="div-meter-thumb" style="left: calc(${meterPos}% - 10px);"></div>
        </div>
        <div style="display:flex; justify-content:space-between; font-size:10px; color:#94a3b8; margin-bottom:10px;">
            <span>Too Safe</span><span>Balanced</span><span>Too Risky</span>
        </div>
        <div style="font-size:13px; line-height:1.6;">${advice}</div>
    `;
}

// ===================== INIT =====================
document.addEventListener('DOMContentLoaded', () => {
    renderLibGrid('all');
});
