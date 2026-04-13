// --- UTILITIES ---
const formatCurrency = (n) => {
    if(Math.abs(n)>=10000000) return '₹'+(n/10000000).toFixed(2)+'Cr';
    if(Math.abs(n)>=100000)   return '₹'+(n/100000).toFixed(1)+'L';
    if(Math.abs(n)>=100)      return '₹'+Math.round(n).toLocaleString('en-IN');
    return '₹'+Math.round(n);
};

function calcRequiredSIP(targetAmt, years, rateAnnual) {
    if (years <= 0 || targetAmt <= 0) return 0;
    let r = (rateAnnual / 100) / 12;
    let n = years * 12;
    return (targetAmt * r) / (Math.pow(1 + r, n) - 1);
}

lucide.createIcons();

let engineMemory = {};
let privacyOn = false;

// ==================== PRIVACY TOGGLE ====================
function togglePrivacy() {
    privacyOn = !privacyOn;
    document.body.classList.toggle('privacy-on', privacyOn);
    const btn = document.querySelector('.privacy-toggle-btn');
    if(btn) btn.innerHTML = privacyOn
        ? '<i data-lucide="eye"></i> Show Values'
        : '<i data-lucide="eye-off"></i> Privacy Mode';
    lucide.createIcons();
}

// ==================== WEALTH WEATHER ENGINE ====================
function updateWealthWeather(hasBadDebt, isShortfall, hasIdleCash) {
    const topbar = document.getElementById('main-topbar');
    const badge = document.getElementById('weather-badge');
    const label = document.getElementById('weather-label');
    if (!topbar || !badge) return;
    topbar.classList.remove('weather-good','weather-warn','weather-bad');
    badge.classList.remove('good','warn','bad');
    if (hasBadDebt || isShortfall) {
        topbar.classList.add('weather-bad');
        badge.className = 'weather-badge bad';
        badge.innerHTML = '&#127787;&#65039; Attention Required';
        if(label) label.textContent = 'High-interest debt or funding gap detected \u2014 focus needed.';
    } else if (hasIdleCash) {
        topbar.classList.add('weather-warn');
        badge.className = 'weather-badge warn';
        badge.innerHTML = '&#127780;&#65039; Optimize Idle Cash';
        if(label) label.textContent = 'Idle cash detected \u2014 deploy to higher-yield instruments.';
    } else {
        topbar.classList.add('weather-good');
        badge.className = 'weather-badge good';
        badge.innerHTML = '&#9728;&#65039; Strategy On Track';
        if(label) label.textContent = 'Excellent portfolio health \u2014 stay the course.';
    }
}

// ==================== COMMAND BAR ENGINE ====================
const commandKnowledge = [
    { q: ['leaking','leak','fees','expense ratio','waste'], icon: '&#128269;', t: 'Check the Wealth Optimizer on your dashboard \u2014 it flags idle cash and high-fee instruments.', l: 'action', action: () => switchTab('dash') },
    { q: ['retire','financial freedom','fi','fat fire'], icon: '&#127958;&#65039;', t: 'Use the Financial Independence Accelerator slider to see your freedom date move in real time!', l: 'tip', action: () => switchTab('dash') },
    { q: ['fd','fixed deposit'], icon: '&#127981;', t: 'FDs: 7-7.5% ROI. Best for safety net and goals under 3 years. Emergency Fund belongs in an FD.', l: 'tip' },
    { q: ['sip','mutual fund'], icon: '&#128200;', t: 'Equity SIPs: 12-15% ROI over 7+ years. Never panic-sell during a market crash.', l: 'tip' },
    { q: ['ulip'], icon: '&#9888;&#65039;', t: 'ULIPs often have 4-5% CAGR drag. Consider switching to Pure Term + Index SIP after 5 years locked-in.', l: 'alert' },
    { q: ['debt','loan','emi','credit card'], icon: '&#128308;', t: 'Toxic debt above 10% APR obliterates wealth. Divert 100% surplus until cleared first.', l: 'alert', action: () => switchTab('dash') },
    { q: ['gold','sgb','sovereign'], icon: '&#129351;', t: 'SGBs: 8-10% ROI + income tax exempt. Far better than physical gold.', l: 'tip' },
    { q: ['crypto','bitcoin'], icon: '&#9889;', t: 'Crypto is speculative. Never invest more than 5% of liquid net worth.', l: 'alert' },
    { q: ['ppf','epf','nps'], icon: '&#128274;', t: 'PPF/EPF: Tax-free 7-8.1%. Very illiquid. Good for retirement but not short-term goals.', l: 'tip' },
    { q: ['tax','harvest','harvesting'], icon: '&#128161;', t: 'Tax-loss harvesting: Sell losing positions before March 31, offset capital gains, then rebuy similar asset.', l: 'action' },
    { q: ['emergency','safety','safety net'], icon: '&#128737;&#65039;', t: 'Target: 6 months of expenses in an FD. Keep Rs.10k liquid. Step 1 is locked until this is done.', l: 'tip' },
];

function handleCommand(val) {
    if (!val || val.length < 2) { hideCommandResults(); return; }
    const lower = val.toLowerCase();
    const matches = commandKnowledge.filter(k => k.q.some(q => lower.includes(q)));
    if (matches.length === 0) { hideCommandResults(); return; }
    window._cmdMatches = matches;
    const container = document.getElementById('command-results');
    container.className = 'visible';
    container.innerHTML = matches.slice(0, 4).map((m, i) => `
        <div class="cmd-result-item" onclick="commandAction(${i})">
            <div class="cmd-icon">${m.icon}</div>
            <div class="cmd-text">${m.t}</div>
            <span class="cmd-label ${m.l}">${m.l.toUpperCase()}</span>
        </div>
    `).join('');
}
function commandAction(i) {
    const m = window._cmdMatches && window._cmdMatches[i];
    if (m && m.action) m.action();
    hideCommandResults();
    document.getElementById('command-input').value = '';
}
function showCommandResults() {
    const inp = document.getElementById('command-input');
    if(inp && inp.value.length > 1) document.getElementById('command-results').className = 'visible';
}
function hideCommandResults() {
    const el = document.getElementById('command-results');
    if(el) el.className = '';
}

// ==================== FI ACCELERATOR SLIDER ====================
function updateFISlider(sipVal) {
    sipVal = parseFloat(sipVal);
    document.getElementById('fi-slider-display').innerText = formatCurrency(sipVal) + ' / month';
    const age = parseFloat(document.getElementById('u-age') ? document.getElementById('u-age').value : 28) || 28;
    const totalAssets = engineMemory.totalAssets || 0;
    const monthlyExp = engineMemory.totalExp || 50000;
    const fiTarget = monthlyExp * 12 * 25;
    const r = (12 / 100) / 12;
    let corpus = totalAssets;
    let months = 0;
    for (months = 0; months < 1200; months++) {
        corpus = corpus * (1 + r) + sipVal;
        if (corpus >= fiTarget) break;
    }
    const fiYear = new Date().getFullYear() + Math.ceil(months / 12);
    const fiAge = age + Math.ceil(months / 12);
    const fiDateEl = document.getElementById('fi-date');
    const fiInsight = document.getElementById('fi-insight');
    if (months >= 1199) {
        fiDateEl.textContent = 'Needs higher SIP';
        fiDateEl.style.color = '#ef4444';
        if(fiInsight) fiInsight.innerHTML = 'At this rate, investments may not outpace expenses. Increase your monthly SIP significantly.';
    } else {
        fiDateEl.textContent = fiYear + ' (Age ' + fiAge + ')';
        fiDateEl.style.color = '#34d399';
        if(fiInsight) fiInsight.innerHTML = 'Investing <strong>' + formatCurrency(sipVal) + '/month</strong> for <strong>' + (months/12).toFixed(1) + ' years</strong> will fund <strong>' + formatCurrency(fiTarget) + '</strong> FI corpus (25x rule). Each extra ' + formatCurrency(10000) + '/mo saves roughly ' + Math.floor(months * 0.015) + ' months of working life.';
    }
}

// ==================== WEALTH OPTIMIZER (MONEY LEAKS) ====================
function runWealthOptimizer(astCash, totalAssets, dArr, totalExp) {
    const leaks = [];
    const emFundReq = totalExp * 6;
    const idleCash = astCash - emFundReq - 10000;
    if (idleCash > 50000) {
        leaks.push({ icon: '&#128164;', title: 'Idle Cash: ' + formatCurrency(idleCash), desc: 'You have excess cash sitting at ~3.5% when it could earn 7.5% in an FD or 12% in Index Funds.', save: '+' + formatCurrency(idleCash * 0.04 * 5) + ' over 5 yrs' });
    }
    dArr.forEach(d => {
        if (d.rt > 10) {
            const annualInterest = d.p * (d.rt / 100);
            leaks.push({ icon: '&#128293;', title: 'Toxic Loan: ' + d.n + ' @ ' + d.rt + '%', desc: 'Costs you ' + formatCurrency(annualInterest) + '/year in interest. Clearing this is a guaranteed ' + d.rt + '% return — better than any mutual fund.', save: 'Save ' + formatCurrency(annualInterest) + '/yr' });
        } else if (d.rt > 7) {
            const annualInterest = d.p * (d.rt / 100);
            leaks.push({ icon: '&#128993;', title: 'Moderate Loan: ' + d.n + ' @ ' + d.rt + '%', desc: 'Costing ' + formatCurrency(annualInterest) + '/year. Split your surplus 50/50: prepay this while also running a Nifty SIP. Do not sacrifice equity SIP entirely.', save: 'Optimise split' });
        } else if (d.rt > 0) {
            leaks.push({ icon: '&#128994;', title: 'Good Debt: ' + d.n + ' @ ' + d.rt + '%', desc: 'This is low-cost debt. Do NOT prepay early — a Nifty SIP at 12% earns more than the ' + d.rt + '% you would save. Keep the EMI running.', save: 'Keep investing' });
        }
    });
    const hasULIP = Array.from(document.querySelectorAll('.a-t')).some(s => s.value === 'ulip');
    if (hasULIP) {
        leaks.push({ icon: '&#9888;&#65039;', title: 'ULIP in Portfolio', desc: 'ULIPs carry 3-5% hidden fee drag. Consider surrendering after year 5 and switching to Term Insurance + Nifty SIP for 2x better returns.', save: 'Save ~3% CAGR' });
    }
    const sec = document.getElementById('optimizer-section');
    const container = document.getElementById('leak-items-container');
    if (!sec || !container) return;
    if (leaks.length > 0) {
        sec.style.display = 'block';
        container.innerHTML = leaks.map(l => `
            <div class="leak-item">
                <div class="leak-icon">${l.icon}</div>
                <div class="leak-body">
                    <div class="leak-title">${l.title}</div>
                    <div class="leak-desc">${l.desc}</div>
                </div>
                <div class="leak-save">${l.save}</div>
            </div>
        `).join('');
    } else {
        sec.style.display = 'none';
    }
}


function switchTab(t) {
    document.querySelectorAll('.pg').forEach(p => p.classList.remove('on', 'animated-fade'));
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.getElementById(`pg-${t}`).classList.add('on', 'animated-fade');
    document.getElementById(`btn-${t}`).classList.add('active');
}

function addGoal() {
    const id = 'g_' + Date.now();
    const c = document.getElementById('goal-container');
    const r = document.createElement('div');
    r.className = 'dy-row dy-goal'; r.id = id;
    r.innerHTML = `
        <div class="form-group" style="margin:0;"><label>Objective</label><input type="text" class="g-name" value="Buy A Car"></div>
        <div class="form-group" style="margin:0;"><label>Target Cap (₹)</label><input type="number" class="g-tgt" value="1200000"></div>
        <div class="form-group" style="margin:0;"><label>Timeline</label><input type="number" class="g-yrs" value="3"></div>
        <button class="del-btn" onclick="document.getElementById('${id}').remove()">X</button>
    `;
    c.appendChild(r);
}

function addDebt() {
    const id = 'd_' + Date.now();
    const c = document.getElementById('debt-container');
    const r = document.createElement('div');
    r.className = 'dy-row dy-debt'; r.id = id;
    r.innerHTML = `
        <div class="form-group" style="margin:0;"><label>Lender</label><input type="text" class="d-n" value="Default CC"></div>
        <div class="form-group" style="margin:0;"><label>Active Principal</label><input type="number" class="d-p" value="150000"></div>
        <div class="form-group" style="margin:0;"><label>Rate (%)</label><input type="number" class="d-r" value="36"></div>
        <div class="form-group" style="margin:0;"><label>EMI (₹)</label><input type="number" class="d-e" value="8000"></div>
        <button class="del-btn" onclick="document.getElementById('${id}').remove()">X</button>
    `;
    c.appendChild(r);
}

// Default rates by asset type
const ASSET_DEFAULT_RATES = {
    savings: 3.5, fd: 7.5, rd: 7.0, corp_bonds: 10.0, po_schemes: 7.7,
    mutual_fund: 12.0, stocks_in: 15.0, stocks_us: 13.0, etf: 12.0,
    epf: 8.1, ppf: 7.1, nps: 10.0, endowment: 4.5,
    ulip: 8.0, gold_physical: 8.5, sgb: 10.0, real_estate: 10.0,
    crypto: 20.0, reit: 10.0, p2p: 12.0
};

function addAccount() {
    const id = 'a_' + Date.now();
    const c = document.getElementById('account-container');
    const r = document.createElement('div');
    r.className = 'dy-row dy-account'; r.id = id;
    r.style.gridTemplateColumns = '1.5fr 1.5fr 1fr 0.8fr auto';
    r.innerHTML = `
        <div class="form-group" style="margin:0;"><label>Bank / Platform Name</label><input type="text" class="a-n" value="ICICI Bank"></div>
        <div class="form-group" style="margin:0;"><label>Asset Type</label>
            <select class="a-t" onchange="onAssetTypeChange(this)">
                <optgroup label="&#127981; Banking &amp; Fixed Income">
                    <option value="savings">Savings Account</option>
                    <option value="fd">Fixed Deposit (FD)</option>
                    <option value="rd">Recurring Deposit (RD)</option>
                    <option value="corp_bonds">Corporate Bonds</option>
                    <option value="po_schemes">Post Office Schemes</option>
                </optgroup>
                <optgroup label="&#128200; Stock Market &amp; Equities">
                    <option value="mutual_fund">Equity Mutual Funds</option>
                    <option value="stocks_in">Direct Stocks (India)</option>
                    <option value="stocks_us">US / Global Stocks</option>
                    <option value="etf">Index Funds &amp; ETFs</option>
                </optgroup>
                <optgroup label="&#128274; Retirement &amp; Long-term">
                    <option value="epf">EPF (Employee Provident Fund)</option>
                    <option value="ppf">PPF (Public Provident Fund)</option>
                    <option value="nps">NPS (National Pension System)</option>
                    <option value="endowment">Endowment / Life Policies</option>
                </optgroup>
                <optgroup label="&#129351; Alternatives">
                    <option value="ulip">ULIP (Unit Linked Plan)</option>
                    <option value="gold_physical">Physical Gold</option>
                    <option value="sgb">SGB (Sovereign Gold Bond)</option>
                    <option value="real_estate">Real Estate</option>
                    <option value="reit">REIT</option>
                    <option value="p2p">P2P Lending</option>
                    <option value="crypto">Cryptocurrency</option>
                </optgroup>
            </select>
        </div>
        <div class="form-group" style="margin:0;"><label>Current Balance (&#8377;)</label><input type="number" class="a-p" value="100000"></div>
        <div class="form-group" style="margin:0;" title="Auto-filled. Edit to enter your actual XIRR or current interest rate.">
            <label>Return % p.a.</label>
            <input type="number" class="a-r" value="7.5" step="0.1" min="0" max="100" style="border-color:#d97706;">
        </div>
        <button class="del-btn" onclick="document.getElementById('${id}').remove()">&#10005;</button>
    `;
    c.appendChild(r);
}

function onAssetTypeChange(sel) {
    const row = sel.closest('.dy-account');
    if (!row) return;
    const rateInput = row.querySelector('.a-r');
    if (rateInput && ASSET_DEFAULT_RATES[sel.value] !== undefined) {
        rateInput.value = ASSET_DEFAULT_RATES[sel.value];
    }
}

window.onload = () => { addAccount(); addGoal(); addDebt(); };

// --- MASTER ALGORITHM (LADDER LOGIC & GOALS) ---
function calculateStrategy() {
    const name = document.getElementById('u-name').value;
    
    // Cashflow
    const income = parseFloat(document.getElementById('u-income').value) || 0;
    const sip = parseFloat(document.getElementById('u-sip').value) || 0;
    const stepUpPercent = parseFloat(document.getElementById('u-stepup').value) || 0;
    const totalExp = (parseFloat(document.getElementById('u-rent').value)||0) + (parseFloat(document.getElementById('u-groceries').value)||0) + (parseFloat(document.getElementById('u-cc').value)||0) + (parseFloat(document.getElementById('u-life').value)||0);
    const emFundReq = totalExp * 6; 
    
    // Dynamic Asset Aggregation Logic
    let astCash = 0; let astEq = 0; let astPF = 0; let astGold = 0;
    
    document.querySelectorAll('.dy-account').forEach(r => {
        let type = r.querySelector('.a-t').value;
        let bal = parseFloat(r.querySelector('.a-p').value) || 0;
        
        switch(type) {
            case 'savings':
            case 'fd':
            case 'rd':
            case 'po_schemes':
            case 'corp_bonds':
                astCash += bal;
                break;
            case 'mutual_fund':
            case 'stocks_in':
            case 'stocks_us':
            case 'etf':
            case 'ulip':
            case 'crypto':
                astEq += bal;
                break;
            case 'epf':
            case 'ppf':
            case 'nps':
            case 'endowment':
                astPF += bal;
                break;
            case 'gold_physical':
            case 'sgb':
            case 'real_estate':
                astGold += bal;
                break;
            default:
                astCash += bal;
        }
    });
    const totalAssets = astCash + astEq + astPF + astGold;

    // Liabilities — categorise ALL debt: good (<7%), moderate (7-10%), toxic (>10%)
    let totalLiabilities = 0; let totalEMI = 0; let dArr = [];
    let hasBadDebt = false; // toxic (>10%)
    let hasModerateDebt = false; // moderate (7-10%)
    let anyDebt = false;
    document.querySelectorAll('.dy-debt').forEach(r => {
        let p = parseFloat(r.querySelector('.d-p').value)||0;
        let e = parseFloat(r.querySelector('.d-e').value)||0;
        let rt = parseFloat(r.querySelector('.d-r').value)||0;
        if(p > 0) anyDebt = true;
        totalLiabilities += p; totalEMI += e;
        if(rt > 10)  hasBadDebt = true;
        if(rt > 7 && rt <= 10) hasModerateDebt = true;
        dArr.push({n: r.querySelector('.d-n').value, p, rt, e});
    });

    const netWorth = totalAssets - totalLiabilities;
    const unallocatedCashflow = income - totalExp - totalEMI;
    const sumSurplus = sip + (unallocatedCashflow > 0 ? unallocatedCashflow : 0);
    
    const hasTerm = document.getElementById('u-term').value === 'yes';
    const hasMed = document.getElementById('u-med').value === 'yes';

    // *** DISCRETIONARY GOAL PARSER (FEASIBILITY ENGINE) ***
    let totalRequiredSIP = 0;
    let goalAnalysisHTML = "";
    let extractedGoals = [];
    
    document.querySelectorAll('.dy-goal').forEach(r => {
        let nm = r.querySelector('.g-name').value;
        let tgt = parseFloat(r.querySelector('.g-tgt').value)||0;
        let yrs = parseFloat(r.querySelector('.g-yrs').value)||0;
        
        if(tgt > 0 && yrs > 0) {
            let rate = yrs <= 3 ? 7.0 : 12.0; // 7% FD for short term, 12% Equity for long term
            let rawSIP = calcRequiredSIP(tgt, yrs, rate);
            totalRequiredSIP += rawSIP;
            let instr = yrs <= 3 ? "Secure FD (7%)" : "Equity SIP (12%)";
            let color = yrs <= 3 ? "var(--accent-blue)" : "var(--accent-green)";
            
            goalAnalysisHTML += `<div style="margin-bottom:8px; padding-bottom:8px; border-bottom:1px dashed #cbd5e1;">🎯 <strong>${nm}</strong> (${yrs} Yrs): Need <strong style="color:${color}">${formatCurrency(rawSIP)}/mo</strong> mapped to ${instr}.</div>`;
            extractedGoals.push({ name: nm, target: tgt, monthDue: Math.floor(yrs * 12), hit: false });
        }
    });

    let fireText = "<strong>Priority 1: FINANCIAL INDEPENDENCE</strong> always comes first. Then, your lifestyle goals:<br><br>";
    if (goalAnalysisHTML !== "") {
        fireText += `<div style="font-size:13px;">${goalAnalysisHTML}</div>`;
        fireText += `<div style="margin-top:10px; font-weight:800; font-size:14px; text-transform:uppercase;">Total SIP Required For Goals: ${formatCurrency(totalRequiredSIP)}/mo</div>`;
        
        if (totalRequiredSIP <= sumSurplus) {
            fireText += `<div style="margin-top:8px; display:inline-block; background-color:#dcfce7; color:#166534; padding:6px 12px; border-radius:4px; font-size:13px; font-weight:bold;">✅ ACHIEVABLE: Your free surplus of ${formatCurrency(sumSurplus)} is enough to fuel all these goals. Stay disciplined.</div>`;
        } else {
            let shortfall = totalRequiredSIP - sumSurplus;
            fireText += `<div style="margin-top:8px; display:inline-block; background-color:#fee2e2; color:#991b1b; padding:6px 12px; border-radius:4px; font-size:13px; font-weight:bold;">🚨 SACRIFICE REQUIRED: You are short by ${formatCurrency(shortfall)} every month!</div>`;
            fireText += `<div style="margin-top:5px; font-size:13px; color:#991b1b; line-height: 1.4;">Math doesn't lie. You cannot currently afford this timeline. You must aggressively raise your income, cut your expenses by ${formatCurrency(shortfall)}, or explicitly delay these goals to give compounding more time.</div>`;
        }
    } else {
         fireText += `<div style="color:var(--text-muted); font-size:13px;">No lifestyle goals added. All your capital will compound purely towards massive financial freedom!</div>`;
    }

    // *** PREDICTIVE UNLOCK ENGINE — 3-tier debt classification ***
    let missingEmergency = Math.max(0, emFundReq - astCash);

    // Tier 1: Toxic debt (>10%) — personal loans, credit cards, payday loans
    let toxicDebtAmount = 0;
    let toxicDebtList = [];
    dArr.forEach(d => { if(d.rt > 10) { toxicDebtAmount += d.p; toxicDebtList.push(d); } });

    // Tier 2: Moderate debt (7–10%) — car loans, education loans
    let moderateDebtAmount = 0;
    let moderateDebtList = [];
    dArr.forEach(d => { if(d.rt > 7 && d.rt <= 10) { moderateDebtAmount += d.p; moderateDebtList.push(d); } });

    // Tier 3: Good / cheap debt (<=7%) — home loans, student loans
    let goodDebtAmount = 0;
    let goodDebtList = [];
    dArr.forEach(d => { if(d.rt > 0 && d.rt <= 7) { goodDebtAmount += d.p; goodDebtList.push(d); } });

    let p1UnlockText = "";
    if (toxicDebtAmount > 0) {
        const toxicNames = toxicDebtList.map(d => `${d.n} (${d.rt}%)`).join(', ');
        const annualDrain = toxicDebtList.reduce((s, d) => s + d.p * (d.rt/100), 0);
        if (sumSurplus > 0) {
            p1UnlockText = `<strong>ACTION REQUIRED — Toxic Debt Detected:</strong> ${toxicNames}.<br>These loans cost you <strong style="color:#ef4444;">${formatCurrency(annualDrain)}/year</strong> in interest alone. Divert your full <strong>${formatCurrency(sumSurplus)}/month</strong> surplus towards clearing them. Investing while carrying this debt is mathematically irrational.`;
        } else {
            p1UnlockText = `<strong>CRITICAL:</strong> You have toxic debt (${toxicNames}) but zero free cash flow. Cut expenses immediately or default becomes a risk.`;
        }
    } else if (moderateDebtAmount > 0 && missingEmergency > 0) {
        const modNames = moderateDebtList.map(d => `${d.n} (${d.rt}%)`).join(', ');
        p1UnlockText = `<strong>ACTION REQUIRED — Moderate Debt + No Emergency Fund:</strong> ${modNames}.<br>No toxic debt — good! But your safety net is incomplete. Build your Emergency FD first (${formatCurrency(emFundReq)} target). You can invest in equity once the emergency fund is secured.`;
    } else if (moderateDebtAmount > 0) {
        const modNames = moderateDebtList.map(d => `${d.n} (${d.rt}%)`).join(', ');
        const annualDrain = moderateDebtList.reduce((s, d) => s + d.p * (d.rt/100), 0);
        p1UnlockText = `<strong>MODERATE DEBT DETECTED:</strong> ${modNames} — costing ${formatCurrency(annualDrain)}/year. This rate is close to FD returns, so <strong>split your surplus 50/50</strong>: half to debt prepayment, half to Nifty SIP. Do NOT sacrifice equity SIP entirely.`;
    } else if (goodDebtAmount > 0 && missingEmergency > 0) {
        const goodNames = goodDebtList.map(d => `${d.n} (${d.rt}%)`).join(', ');
        p1UnlockText = `<strong>Good News:</strong> Your debt (${goodNames}) is low-cost and not blocking you. However, you still need to build your Emergency Fund (${formatCurrency(emFundReq)} target). Prioritise that before investing surplus.`;
    } else if (goodDebtAmount > 0) {
        const goodNames = goodDebtList.map(d => `${d.n} (${d.rt}%)`).join(', ');
        p1UnlockText = `<strong>Good Debt Only:</strong> ${goodNames} &mdash; this is manageable low-cost debt. <strong>Do NOT prepay this early.</strong> Your money earns more in a Nifty SIP (12%) than it saves in loan interest (${goodDebtList[0].rt}%). Keep investing and let the EMI run its course.`;
    } else if (missingEmergency > 0) {
        if (sumSurplus > 0) {
            let timeToUnlockP1 = Math.ceil(missingEmergency / sumSurplus);
            p1UnlockText = `<strong>ACTION REQUIRED:</strong> No bad debt — great! But your Safety Net is dangerously sparse. Divert 100% of your <strong>${formatCurrency(sumSurplus)}/month</strong> surplus into a Fixed Deposit until you hit your ${formatCurrency(emFundReq)} Emergency Fund target. You will unlock investing in exactly <strong style="color:var(--accent-red);">${timeToUnlockP1} Months</strong>.`;
        } else {
            p1UnlockText = `<strong>ACTION REQUIRED:</strong> You have zero debt but zero cashflow. Cut expenses to start building an Emergency Fund FD immediately.`;
        }
    } else if (!hasTerm || !hasMed) {
        p1UnlockText = `<strong>ACTION REQUIRED:</strong> You have the money, but your family is unprotected. Go to PolicyBazaar and buy a pure Term Life policy and a comprehensive Health Insurance plan immediately to unlock Step 2.`;
    }

    // *** LADDER EVALUATION (ORDER OF OPS) ***
    // p1 = Step 1 unlocked: emergency fund + insurance + NO TOXIC debt (moderate/good debt still OK to invest)
    let p1_secure = astCash >= emFundReq && hasTerm && hasMed && !hasBadDebt;
    let p2_secure = p1_secure && astEq >= 0;
    let p3_secure = p1_secure && astEq >= 500000;
    let p4_secure = p1_secure && astEq >= 2000000;

    let ladderHTML = `
        <div class="ladder-phase ${p1_secure ? 'phase-unlocked' : 'phase-locked'}">
            <div class="ladder-icon">${p1_secure ? '<i data-lucide="shield-check"></i>' : '<i data-lucide="lock"></i>'}</div>
            <div class="ladder-content"><h4>Step 1: Financial Safety Net</h4><p>${p1_secure ? 'Excellent. Your emergency fund is safely in an FD, you have insurance, and you have no bad debt.' : p1UnlockText}</p></div>
        </div>
        <div class="ladder-phase ${p1_secure ? 'phase-unlocked' : 'phase-locked'}">
            <div class="ladder-icon">${p1_secure ? '<i data-lucide="trending-up"></i>' : '<i data-lucide="lock"></i>'}</div>
            <div class="ladder-content"><h4>Step 2: Start Investing (₹0 to ₹5L)</h4><p>${p1_secure ? '<strong>ACTION REQUIRED:</strong> Open a brokerage account (e.g., Zerodha, Groww) and start monthly SIPs in a Nifty 50 Index Fund and a Mid Cap Fund. Try to increase your SIP by 10% every year.' : '<strong>ACTION REQUIRED:</strong> First complete Step 1 (clear debts, buy insurance, build an FD). Only then should you open a brokerage account to buy Mutual Funds.'}</p></div>
        </div>
        <div class="ladder-phase ${p3_secure ? 'phase-unlocked' : 'phase-locked'}">
            <div class="ladder-icon">${p3_secure ? '<i data-lucide="landmark"></i>' : '<i data-lucide="lock"></i>'}</div>
            <div class="ladder-content"><h4>Step 3: Diversify to Bonds (₹5L+)</h4><p>${p3_secure ? '<strong>ACTION REQUIRED:</strong> You have more than ₹5L in stocks. We recommend adding Corporate Bonds (via GoldenPi or WintWealth) for safety.' : '<strong>ACTION REQUIRED:</strong> Keep buying Nifty 50 Mutual Funds until your portfolio crosses ₹5 Lakhs. Only then should you seek out Corporate Bonds.'}</p></div>
        </div>
        <div class="ladder-phase ${p4_secure ? 'phase-unlocked' : 'phase-locked'}">
            <div class="ladder-icon">${p4_secure ? '<i data-lucide="globe"></i>' : '<i data-lucide="lock"></i>'}</div>
            <div class="ladder-content"><h4>Step 4: Go Global (₹20L+)</h4><p>${p4_secure ? '<strong>ACTION REQUIRED:</strong> Your wealth has crossed ₹20L. You should now use apps like Indmoney or Vested to invest in US Stocks (like the Nasdaq-100).' : '<strong>ACTION REQUIRED:</strong> Focus on growing your Indian Mutual Funds to ₹20 Lakhs before you worry about buying US Stocks or international funds.'}</p></div>
        </div>
    `;
    
    // PDF Variables Output
    let cfStat = unallocatedCashflow > 0 ? `Positive (${formatCurrency(unallocatedCashflow)}/mo)` : `Negative/Zero. Cut down your expenses immediately.`;
    let safeStat = astCash >= emFundReq ? `Secured (${formatCurrency(astCash)} in Savings)` : `At-Risk. Minimum required: ${formatCurrency(emFundReq)}.`;
    let liaStat = !hasBadDebt ? `Excellent. Zero Bad Debt.` : `WARNING. High-Interest Loan Detected. Stop investing and clear this now.`;
    let nextMilestone = "";
    if(!p1_secure) nextMilestone = "Clear your bad debt and build your safety net. Investing is locked.";
    else if(!p3_secure) nextMilestone = "Reach ₹5 Lakhs in Mutual Funds to unlock Bonds.";
    else if(!p4_secure) nextMilestone = "Reach ₹20 Lakhs in Mutual Funds to unlock US Stocks.";
    else nextMilestone = "You have reached the maximum diversification level.";

    // DOM Updates
    document.getElementById('goal-protocol-blocks').innerHTML = fireText;
    document.getElementById('ladder-container').innerHTML = ladderHTML;
    document.getElementById('v-ast').innerText = formatCurrency(totalAssets);
    document.getElementById('v-lia').innerText = formatCurrency(totalLiabilities);
    document.getElementById('v-nw').innerText = formatCurrency(netWorth);

    // Memory
    engineMemory = {
        name, income, totalExp, unallocatedCashflow,
        totalAssets, totalLiabilities, astCash, astEq, dArr, sip, sumSurplus,
        stepUpPercent,
        p1: p1_secure, p3: p3_secure, p4: p4_secure,
        cfStat, safeStat, liaStat, nextMilestone, goalAnalysisHTML
    };

    // ==== FIRE WEATHER ENGINE ====
    const isShortfall = (typeof totalRequiredSIP !== 'undefined') && (totalRequiredSIP > sumSurplus);
    const hasIdleCash = (astCash - emFundReq - 10000) > 50000;
    updateWealthWeather(hasBadDebt, isShortfall, hasIdleCash);

    // ==== FIRE FI SLIDER ====
    const sliderEl = document.getElementById('fi-slider');
    if(sliderEl) {
        sliderEl.value = sip || 50000;
        updateFISlider(sip || 50000);
    }

    // ==== FIRE WEALTH OPTIMIZER ====
    runWealthOptimizer(astCash, totalAssets, dArr, totalExp);

    // ==== FIRE DIVERSIFICATION METER (Library Tab) ====
    if (typeof updateDiversificationMeter === 'function') updateDiversificationMeter();

    // --- EXACT MONTHLY ALLOCATOR (10-COLUMN PRO MATRIX) ---
    let allocHTML = "";
    let simDebt = toxicDebtAmount;
    let simEm = astCash; // Contains liquid + FD combined initially for tracking
    let simEq = astEq;
    
    // Split astCash into liquid (up to 10k) and FD (the rest)
    let simLiquid = Math.min(simEm, 10000);
    let simFD = Math.max(0, simEm - 10000);
    let liquidReq = 10000;
    
    let monthsToProject = 24; // Show next 2 years
    let activeSurplus = sumSurplus;
    let activeEmFundReq = emFundReq;
    let trendData = []; // novelty wealth tracker

    for(let m=1; m<=monthsToProject; m++) {
        // Step Up Math (At month 13, 25, etc.)
        if (m > 1 && (m - 1) % 12 === 0) {
            if (engineMemory.stepUpPercent && engineMemory.stepUpPercent > 0) {
                activeSurplus = activeSurplus * (1 + (engineMemory.stepUpPercent / 100));
                activeEmFundReq = activeEmFundReq * (1 + (engineMemory.stepUpPercent / 100)); // Inflate safety net cost
            }
        }

        let monthSurplus = activeSurplus;
        let toDebt = 0; let toLiquid = 0; let toFD = 0; let toNifty = 0; let toMid = 0; let toBond = 0; let goalSpend = 0;

        if (monthSurplus <= 0) {
            let wth = simLiquid + simFD + simEq;
            allocHTML += `<tr><td>Month ${m}</td><td>₹0</td><td class="calc-val-zero">₹0</td><td class="calc-val-zero">₹0</td><td class="calc-val-zero">₹0</td><td class="calc-val-zero">₹0</td><td class="calc-val-zero">₹0</td><td class="calc-val-zero">₹0</td><td class="calc-val-zero">₹0</td><td class="calc-val-wealth">${formatCurrency(wth)}</td></tr>`;
            continue;
        }

        // 1. Critical Debt Loop (100% routing)
        if (simDebt > 0) {
            if (monthSurplus >= simDebt) {
                toDebt = simDebt;
                monthSurplus -= simDebt;
                simDebt = 0;
            } else {
                toDebt = monthSurplus;
                simDebt -= monthSurplus;
                monthSurplus = 0;
            }
        }

        // 2. Strict Liquid Waterfall (100% routing until 10k)
        if (monthSurplus > 0) {
            if (simLiquid < liquidReq) {
                let needed = liquidReq - simLiquid;
                if (monthSurplus >= needed) {
                    toLiquid = needed;
                    monthSurplus -= needed;
                    simLiquid += needed;
                } else {
                    toLiquid = monthSurplus;
                    simLiquid += monthSurplus;
                    monthSurplus = 0;
                }
            }
        }

        // 3. Strict FD Waterfall (Safety Net)
        if (monthSurplus > 0) {
            // Target FD is total safety net minus the 10k liquid buffer we just held
            let targetFD = activeEmFundReq > liquidReq ? activeEmFundReq - liquidReq : 0;
            if (simFD < targetFD) {
                let needed = targetFD - simFD;
                if (monthSurplus >= needed) {
                    toFD = needed;
                    monthSurplus -= needed;
                    simFD += needed;
                } else {
                    toFD = monthSurplus;
                    simFD += monthSurplus;
                    monthSurplus = 0;
                }
            }
        }

        // 4. Equity Asset Bifurcation Engine
        if (monthSurplus > 0) {
            let fundForEq = monthSurplus;
            if (simEq < 500000) {
                // Phase A: 70% Nifty, 30% Mid Cap
                toNifty = fundForEq * 0.70;
                toMid = fundForEq * 0.30;
                simEq += fundForEq;
            } else {
                // Phase B: 50% Nifty, 20% Mid Cap, 30% Bonds
                toNifty = fundForEq * 0.50;
                toMid = fundForEq * 0.20;
                toBond = fundForEq * 0.30;
                simEq += (toNifty + toMid + toBond); // Bonds map to portfolio net worth 
            }
        }

        // 5. Short-Term Goal Deduction Engine!
        if (extractedGoals && extractedGoals.length > 0) {
            extractedGoals.forEach(g => {
                if (g.monthDue === m && !g.allocTracked) {
                    g.allocTracked = true; // prevent re-fires
                    if (simEq >= g.target) {
                        simEq -= g.target; // Deduct from massive wealth builder
                        goalSpend += g.target;
                    } else if ((simEq + simFD) >= g.target) {
                        // Dip into FD if equity is short but goal is mandatory
                        let short = g.target - simEq;
                        simEq = 0;
                        simFD -= short;
                        goalSpend += g.target;
                    }
                }
            });
        }
        
        // 6. Aggregate Wealth
        let totalWealth = simLiquid + simFD + simEq;

        allocHTML += `<tr>
            <td>Month ${m}</td>
            <td>${formatCurrency(activeSurplus)}</td>
            <td class="${toDebt > 0 ? 'calc-val-debt' : 'calc-val-zero'}">${toDebt > 0 ? formatCurrency(toDebt) : '₹0'}</td>
            <td class="${toLiquid > 0 ? 'calc-val-liquid' : 'calc-val-zero'}">${toLiquid > 0 ? formatCurrency(toLiquid) : '₹0'}</td>
            <td class="${toFD > 0 ? 'calc-val-em' : 'calc-val-zero'}">${toFD > 0 ? formatCurrency(toFD) : '₹0'}</td>
            <td class="${toNifty > 0 ? 'calc-val-nifty' : 'calc-val-zero'}">${toNifty > 0 ? formatCurrency(toNifty) : '₹0'}</td>
            <td class="${toMid > 0 ? 'calc-val-mid' : 'calc-val-zero'}">${toMid > 0 ? formatCurrency(toMid) : '₹0'}</td>
            <td class="${toBond > 0 ? 'calc-val-bond' : 'calc-val-zero'}">${toBond > 0 ? formatCurrency(toBond) : '₹0'}</td>
            <td class="${goalSpend > 0 ? 'calc-val-spend' : 'calc-val-zero'}">${goalSpend > 0 ? '-'+formatCurrency(goalSpend) : '₹0'}</td>
            <td class="calc-val-wealth">${formatCurrency(totalWealth)}</td>
        </tr>`;
        
        trendData.push({ month: m, wealth: totalWealth, spend: goalSpend });
    }
    
    // Novelty Style Graph DOM rendering
    if (trendData.length > 0) {
        document.getElementById('nw-total-wealth').innerText = formatCurrency(trendData[trendData.length-1].wealth);
        
        let maxW = Math.max(...trendData.map(d => d.wealth));
        if (maxW === 0) maxW = 1; // div by zero safety
        
        let graphHTML = "";
        trendData.forEach(d => {
            let pct = (d.wealth / maxW) * 100;
            if(pct < 2) pct = 2; // min height
            let colorOv = d.spend > 0 ? "background: linear-gradient(to top, #b45309, #f59e0b);" : "";
            
            graphHTML += `<div class="nw-bar" style="height:${pct}%; ${colorOv}">
                <div class="nw-bar-tooltip">Month ${d.month}: ${formatCurrency(d.wealth)}${d.spend > 0 ? ' (Spend: -'+formatCurrency(d.spend)+')' : ''}</div>
            </div>`;
        });
        document.getElementById('nw-trend-graph').innerHTML = graphHTML;
    }

    document.getElementById('monthly-allocator-body').innerHTML = allocHTML;

    switchTab('dash');
    lucide.createIcons();
}

// --- TAB 3: DYNAMIC CRISIS SIMULATOR (WITH CELEBRATION PROTOCOL) ---
const delay = ms => new Promise(res => setTimeout(res, ms));

async function runCrisisSimulator() {
    if(engineMemory.totalAssets === undefined) return;
    const logBox = document.getElementById('timeline-log'); 
    logBox.innerHTML = '<div id="gif-overlay" style="display:none; position:absolute; top:50%; left:50%; transform:translate(-50%, -50%); flex-direction:column; align-items:center; z-index:10; background:rgba(255,255,255,0.95); padding:30px; border-radius:12px; box-shadow:0 10px 40px rgba(0,0,0,0.2); width:80%; text-align:center;"><div style="font-size:60px; margin-bottom:10px;">🎉</div><div id="gif-txt" style="font-size:16px; font-weight:800; color:#1e293b;"></div></div>';
    
    if(!engineMemory.p1) {
        logBox.innerHTML += `<div style="padding:40px; text-align:center; color:var(--accent-red); font-weight:bold;">Simulator Locked: Fill your Emergency Fund & clear Bad Debt first.</div>`;
        return;
    }

    // === FIX: Start from the full corpus (cash + equity + pf + gold), not just equity ===
    let corpus = engineMemory.totalAssets || 0; // Use ALL assets as starting point
    let surplus = engineMemory.sumSurplus;
    let stepUpPercent = engineMemory.stepUpPercent || 0;
    let monthlyRate = (12.0 / 100) / 12; // Base equity return

    logBox.innerHTML += `<div class="log-entry"><div class="log-header">Month 1 • Starting Point</div><div class="log-body">Safety net is secure. Starting with existing corpus of <strong>${formatCurrency(corpus)}</strong>. Investing <strong>${formatCurrency(surplus)}/month</strong> with ${stepUpPercent}% annual step-up.</div></div>`;

    // Skip milestones already reached
    let unlocked5L = corpus >= 500000;
    let unlocked20L = corpus >= 2000000;
    let hasCrashed = false;
    let hasRebounded = false;

    // If already past milestones, adjust rate accordingly
    if(unlocked20L) {
        monthlyRate = (12.5 / 100) / 12;
        logBox.innerHTML += `<div class="log-entry log-milestone"><div class="log-header">Already Unlocked: Step 4 — Global Stocks</div><div class="log-body">Your corpus of ${formatCurrency(corpus)} already qualifies for US Stocks allocation. Simulator continues with global-diversified returns.</div></div>`;
    } else if(unlocked5L) {
        monthlyRate = (11.5 / 100) / 12;
        logBox.innerHTML += `<div class="log-entry log-milestone"><div class="log-header">Already Unlocked: Step 3 — Bond Diversification</div><div class="log-body">Your corpus of ${formatCurrency(corpus)} already qualifies for Bonds. Watching for the ₹20L milestone next.</div></div>`;
    }

    // Initial Pause before run
    await delay(1000);

    for(let i=2; i<=144; i++) {
        // Compound
        corpus = (corpus * (1 + monthlyRate)) + surplus;
        
        // --- CRISIS DETECTED (Month 48) ---
        if(i === 48 && !hasCrashed) {
            hasCrashed = true;
            corpus = corpus * 0.75; // 25% drop!
            document.getElementById('gif-txt').innerHTML = `<span style="color:#ef4444; font-size:20px;">🚨 MARKET CRASH DETECTED! 🚨</span><br><br>The stock market just dropped by 25%.<br><br><div style="font-size:28px; font-weight:900; color:#ef4444;">Wealth Dropped to: ${formatCurrency(corpus)}</div><br>But do not panic. Your SIP of <span style="font-weight:bold;">${formatCurrency(surplus)}/mo</span> will now buy mutual funds at a massive 25% discount. Stay disciplined!`;
            document.getElementById('gif-overlay').style.display = 'flex';
            await delay(6500);
            document.getElementById('gif-overlay').style.display = 'none';

            let e = document.createElement('div'); e.className = 'log-entry';
            e.innerHTML = `<div class="log-header" style="color:#ef4444;">Month ${i} • MARKET CRASH (-25%)</div><div class="log-body">Wealth crashed to <span class="log-val" style="color:#ef4444;">${formatCurrency(corpus)}</span>. You kept investing ${formatCurrency(surplus)}/mo at lower prices.</div>`;
            logBox.appendChild(e); logBox.scrollTop = logBox.scrollHeight;
            await delay(1000);
            continue;
        }

        // --- MARKET REBOUND (Month 60) ---
        if(i === 60 && !hasRebounded) {
            hasRebounded = true;
            corpus = corpus * 1.40; // 40% rebound!
            document.getElementById('gif-txt').innerHTML = `<span style="color:#10b981; font-size:20px;">📈 MASSIVE MARKET REBOUND! 📈</span><br><br>The market recovered by 40%. Because you kept investing during the crash, your wealth exploded!<br><br><div style="font-size:28px; font-weight:900; color:#10b981;">Wealth Skyrocketed to: ${formatCurrency(corpus)}</div>`;
            document.getElementById('gif-overlay').style.display = 'flex';
            await delay(6500);
            document.getElementById('gif-overlay').style.display = 'none';

            let e = document.createElement('div'); e.className = 'log-entry';
            e.innerHTML = `<div class="log-header" style="color:#10b981;">Month ${i} • MARKET REBOUND (+40%)</div><div class="log-body">Wealth exploded to <span class="log-val" style="color:#10b981;">${formatCurrency(corpus)}</span>. Discipline pays off!</div>`;
            logBox.appendChild(e); logBox.scrollTop = logBox.scrollHeight;
            await delay(1000);
            continue;
        }

        // --- DYNAMIC GOAL FULFILLMENT CHECK ---
        if (engineMemory.extractedGoals && engineMemory.extractedGoals.length > 0) {
            for(let g of engineMemory.extractedGoals) {
                if (i === g.monthDue && !g.hit) {
                    g.hit = true;
                    if (corpus >= g.target) {
                        corpus -= g.target; // DRAIN THE ASSETS FOR THE PURCHASE
                        document.getElementById('gif-txt').innerHTML = `🎉 GOAL ACHIEVED! 🎉<br><br>Target Reached: <strong>${g.name}</strong><br><br><div style="font-size:24px; font-weight:900; color:#b45309;">Spent: ${formatCurrency(g.target)}</div><br>Your discipline paid off! You bought it in straight cash.`;
                        document.getElementById('gif-overlay').style.display = 'flex';
                        await delay(5000);
                        document.getElementById('gif-overlay').style.display = 'none';

                        let eG = document.createElement('div'); eG.className = 'log-entry log-milestone';
                        eG.innerHTML = `<div class="log-header" style="color:#b45309;">Month ${i} • LIFESTYLE GOAL HIT</div><div class="log-body">You successfully purchased <strong>${g.name}</strong> for ${formatCurrency(g.target)}! Your wealth dropped to <span class="log-val">${formatCurrency(corpus)}</span>, but you avoided taking out an expensive loan.</div>`;
                        logBox.appendChild(eG); logBox.scrollTop = logBox.scrollHeight;
                        await delay(1000);
                    } else {
                        let eG = document.createElement('div'); eG.className = 'log-entry';
                        eG.innerHTML = `<div class="log-header" style="color:#b91c1c;">Month ${i} • GOAL MISSED</div><div class="log-body">Timeline reached for <strong>${g.name}</strong>, but you only had ${formatCurrency(corpus)} out of the required ${formatCurrency(g.target)}. You must delay the purchase.</div>`;
                        logBox.appendChild(eG); logBox.scrollTop = logBox.scrollHeight;
                        await delay(1000);
                    }
                }
            }
        }

        // Annual Step up
        if(i % 12 === 0 && stepUpPercent > 0) {
            surplus = surplus * (1 + (stepUpPercent / 100));
        }

        // Extract expenses
        let expB = engineMemory.totalExp + engineMemory.dArr.reduce((s,d)=>s+d.e, 0);
        let allocEquity = surplus;
        let allocBonds = 0;
        let allocUS = 0;
        
        if (corpus >= 2000000) { allocEquity = surplus * 0.60; allocBonds = surplus * 0.20; allocUS = surplus * 0.20; }
        else if (corpus >= 500000) { allocEquity = surplus * 0.80; allocBonds = surplus * 0.20; }

        let breakdownHTML = `
            <div style="display:flex; justify-content:space-between; margin-bottom:4px;"><span>Expenses / EMI Paid:</span><span>${formatCurrency(expB)}</span></div>
            <div style="display:flex; justify-content:space-between; margin-bottom:4px;"><span>Total Invested (SIP):</span><span style="color:var(--accent-green)">${formatCurrency(surplus)}</span></div>
            <div style="margin-top:6px; font-weight:600; color:#334155;">Investment Split:</div>
            <div style="display:flex; justify-content:space-between; margin-left:10px;"><span>• Mutual Funds (Nifty & Midcap):</span><span>${formatCurrency(allocEquity)}</span></div>
        `;
        if (allocBonds > 0) breakdownHTML += `<div style="display:flex; justify-content:space-between; margin-left:10px;"><span>• Corporate Bonds (A+):</span><span>${formatCurrency(allocBonds)}</span></div>`;
        if (allocUS > 0) breakdownHTML += `<div style="display:flex; justify-content:space-between; margin-left:10px;"><span>• US Stocks (Nasdaq):</span><span>${formatCurrency(allocUS)}</span></div>`;

        // Month by Month Micro-Logging
        let eMonth = document.createElement('div'); eMonth.className = `log-entry log-expandable`; eMonth.style.opacity = '0.7'; eMonth.style.padding = '10px 15px';
        eMonth.innerHTML = `<div style="display:flex; justify-content:space-between; font-size:12px; align-items:center;"><span>Month ${i} <span style="font-size:10px; color:#94a3b8; font-style:italic;">(Click to view details)</span></span><span style="font-weight:bold;">${formatCurrency(corpus)} ▾</span></div>
                            <div class="log-details">${breakdownHTML}</div>`;
        eMonth.onclick = function() { this.classList.toggle('expanded'); };
        logBox.appendChild(eMonth); logBox.scrollTop = logBox.scrollHeight;
        await delay(30);

        // MILESTONE CHECK 5 LAKH -> BONDS
        if(corpus >= 500000 && !unlocked5L) {
            unlocked5L = true;
            document.getElementById('gif-txt').innerHTML = `🎉 CONGRATULATIONS! 🎉<br><br>₹5 Lakh Milestone Reached.<br>Step 3 Unlocked: Diversifying to Bonds.<br><br><div style="font-size:28px; font-weight:900; color:#22c55e;">Current Wealth: ${formatCurrency(corpus)}</div><br>Active SIP: <span style="font-weight:bold;">${formatCurrency(surplus)}/mo</span>`;
            document.getElementById('gif-overlay').style.display = 'flex';
            await delay(5000); // 5 second pause trigger
            document.getElementById('gif-overlay').style.display = 'none';

            let e = document.createElement('div'); e.className = 'log-entry log-milestone';
            e.innerHTML = `<div class="log-header">Month ${i} • MILESTONE REACHED</div><div class="log-body">Wealth exceeds 5 Lakh. Step 3 <strong>Bonds</strong> Unlocked. Diverting 20% of your new savings to Corporate Bonds to protect your money.</div>`;
            logBox.appendChild(e); logBox.scrollTop = logBox.scrollHeight;
            monthlyRate = (11.5 / 100) / 12; // Adjust yield for diversification
            await delay(1000);
        }

        // MILESTONE CHECK 20 LAKH -> US MARKET
        if(corpus >= 2000000 && !unlocked20L) {
            unlocked20L = true;
            document.getElementById('gif-txt').innerHTML = `🌍 MASSIVE WIN! 🌍<br><br>₹20 Lakh Milestone Reached.<br>Step 4 Unlocked: Global US Stocks.<br><br><div style="font-size:28px; font-weight:900; color:#22c55e;">Current Wealth: ${formatCurrency(corpus)}</div><br>Active SIP: <span style="font-weight:bold;">${formatCurrency(surplus)}/mo</span>`;
            document.getElementById('gif-overlay').style.display = 'flex';
            await delay(5000); // 5 second pause trigger
            document.getElementById('gif-overlay').style.display = 'none';

            let e = document.createElement('div'); e.className = 'log-entry log-milestone';
            e.innerHTML = `<div class="log-header">Month ${i} • MILESTONE REACHED</div><div class="log-body">Wealth exceeds 20 Lakh. Step 4 <strong>Global Investments</strong> Unlocked. Buying US Stocks to grow wealth in Dollars.</div>`;
            logBox.appendChild(e); logBox.scrollTop = logBox.scrollHeight;
            monthlyRate = (12.5 / 100) / 12; // Adjust yield for US alpha
            await delay(1000);
        }

        if(i % 12 === 0) {
            let e = document.createElement('div'); e.className = `log-entry`; e.style.borderLeft = '4px solid #3b82f6';
            e.innerHTML = `<div class="log-header">Year ${i/12} • ANNUAL UPDATE</div><div class="log-body">Wealth has grown to <span class="log-val">${formatCurrency(corpus)}</span>. Your SIP increased to <span class="log-val">${formatCurrency(surplus)}/mo</span>.</div>`;
            logBox.appendChild(e); logBox.scrollTop = logBox.scrollHeight;
            await delay(400);
        }
    }
}

// --- MACRO-ARCHITECTURAL BLUEPRINT (FORMAL PDF) ---
function generateWealthBlueprintPDF() {
    if(engineMemory.totalAssets === undefined) { alert("Generate Strategy first."); return; }

    document.getElementById('pdf-bp-title').innerText = `Antigravity CFO: ${engineMemory.name}`;

    // 1. Institutional Audit formatting
    document.getElementById('pdf-cf-stat').innerText = engineMemory.cfStat;
    if(engineMemory.cfStat.includes('Negative')) document.getElementById('pdf-cf-stat').style.color = '#dc2626';
    else document.getElementById('pdf-cf-stat').style.color = '#059669';

    document.getElementById('pdf-safe-stat').innerText = engineMemory.safeStat;
    if(engineMemory.safeStat.includes('At-Risk')) document.getElementById('pdf-safe-stat').style.color = '#dc2626';
    else document.getElementById('pdf-safe-stat').style.color = '#059669';

    document.getElementById('pdf-lia-stat').innerText = engineMemory.liaStat;
    if(engineMemory.liaStat.includes('CRITCAL')) document.getElementById('pdf-lia-stat').style.color = '#dc2626';
    else document.getElementById('pdf-lia-stat').style.color = '#059669';
    
    document.getElementById('pdf-next-stat').innerText = engineMemory.nextMilestone;
    
    if(document.getElementById('pdf-goal-text')) {
        document.getElementById('pdf-goal-text').innerHTML = engineMemory.goalAnalysisHTML;
    }

    // 2. Exact Alloc Table mapping
    let surplus = engineMemory.sumSurplus;
    let allocEmergency = 0; let allocEquity = 0; let allocBonds = 0; let allocUS = 0;
    
    if(!engineMemory.p1) {
        allocEmergency = surplus;
    } else if(engineMemory.p4) {
        allocEquity = surplus * 0.60; allocBonds = surplus * 0.20; allocUS = surplus * 0.20;
    } else if(engineMemory.p3) {
        allocEquity = surplus * 0.80; allocBonds = surplus * 0.20;
    } else {
        allocEquity = surplus;
    }

    let aBody = "";
    if(!engineMemory.p1) {
        aBody += `<tr><td>Liquid Savings Bank Buffer</td><td>0-4%</td><td style="color:#64748b; font-weight:bold;">First ₹10,000 diverted here.</td></tr>`;
        aBody += `<tr><td>Emergency Fund & Debt Clearance</td><td>0-7%</td><td style="color:#ef4444; font-weight:bold;">100% (${formatCurrency(allocEmergency)}/mo) diverted here.</td></tr>`;
        aBody += `<tr><td style="color:#94a3b8;">Mutual Funds (Nifty)</td><td>--</td><td style="color:#94a3b8;">LOCKED</td></tr>`;
    } else {
        aBody += `<tr><td>Mutual Funds (Nifty & Mid Cap)</td><td>12-15%</td><td style="font-weight:bold;">${formatCurrency(allocEquity)}/mo</td></tr>`;
        if(engineMemory.p3) aBody += `<tr><td>Corporate Bonds (A+)</td><td>9-11%</td><td style="font-weight:bold;">${formatCurrency(allocBonds)}/mo</td></tr>`;
        else aBody += `<tr><td style="color:#94a3b8;">Corporate Bonds</td><td>--</td><td style="color:#94a3b8;">LOCKED (Unlocks at ₹5L)</td></tr>`;
        
        if(engineMemory.p4) aBody += `<tr><td>US Equities (Nasdaq)</td><td>13-15%</td><td style="font-weight:bold;">${formatCurrency(allocUS)}/mo</td></tr>`;
        else aBody += `<tr><td style="color:#94a3b8;">US Equities</td><td>--</td><td style="color:#94a3b8;">LOCKED (Unlocks at ₹20L)</td></tr>`;
    }

    document.getElementById('pdf-alloc-body').innerHTML = aBody;

    // 3. Amortization and Ego Metrics
    let amBody = "";
    let baseTotalInterest = 0;
    let accTotalInterest = 0;
    let maxBaseYears = 0;
    let maxAccYears = 0;

    if(engineMemory.dArr.length === 0) {
        document.getElementById('pdf-amort-table').style.display = 'none';
        document.getElementById('pdf-amort-text').innerText = "Congratulations! You have no bad debt.";
        document.getElementById('pdf-ego-section').style.display = 'none';
    } else {
        document.getElementById('pdf-amort-table').style.display = 'table';
        document.getElementById('pdf-amort-text').innerText = "Warning: Bad Debt detected. Try paying just 1 extra EMI every year to clear it faster.";
        
        engineMemory.dArr.forEach(d => {
            let bM=0; let wM=0;
            if(d.p>0 && d.e>0) {
                let r=(d.rt/100)/12;
                
                // Normal Amortization
                let v1 = 1 - (d.p*r)/d.e; 
                bM = v1>0 ? -Math.log(v1)/Math.log(1+r) : 999;
                let interestBase = (bM * d.e) - d.p;
                if(v1 > 0) {
                    baseTotalInterest += interestBase;
                    if(bM > maxBaseYears) maxBaseYears = bM;
                }
                
                // Accelerated Amortization (1 extra EMI injected per year roughly = 1.0833x monthly)
                let wE = d.e * 1.0833; 
                let v2 = 1 - (d.p*r)/wE; 
                wM = v2>0 ? -Math.log(v2)/Math.log(1+r) : 999;
                let interestAcc = (wM * wE) - d.p;
                if(v2 > 0) {
                    accTotalInterest += interestAcc;
                    if(wM > maxAccYears) maxAccYears = wM;
                }
            }
            amBody += `<tr><td>${d.n} [${d.rt}%]</td><td>${formatCurrency(d.p)}</td><td>${(bM/12).toFixed(1)} Yrs</td><td style="color:#065f46; font-weight:bold;">${(wM/12).toFixed(1)} Yrs</td></tr>`;
        });

        // Compute Bragging Rights
        let interestSaved = Math.max(0, baseTotalInterest - accTotalInterest);
        let yearsSaved = Math.max(0, (maxBaseYears - maxAccYears) / 12);
        
        if(interestSaved > 0) {
            document.getElementById('pdf-ego-text').innerHTML = `By strictly following the Wealth Planner architecture, you are practically obliterating your bad debt. The math proves that you will permanently avoid handing over massive amounts of your hard-earned money to the banks!`;
            document.getElementById('pdf-ego-interest').innerText = formatCurrency(interestSaved);
            document.getElementById('pdf-ego-years').innerText = `${yearsSaved.toFixed(1)} Years`;
            document.getElementById('pdf-ego-section').style.display = 'block';
        } else {
            document.getElementById('pdf-ego-section').style.display = 'none';
        }
    }
    document.getElementById('pdf-amort-body').innerHTML = amBody;

    // Trigger Native Print Dialog (works universally)
    window.print();
}

// --- AI CHATBOT LOGIC ---
const openChatBtn = document.getElementById('open-chat-btn');
const closeChatBtn = document.getElementById('close-chat-btn');
const chatWindow = document.getElementById('chat-window');
const sendChatBtn = document.getElementById('send-chat-btn');
const chatInput = document.getElementById('chat-input');
const chatHistory = document.getElementById('chat-history');

if (openChatBtn && closeChatBtn && chatWindow) {
    openChatBtn.addEventListener('click', () => {
        chatWindow.classList.remove('hidden');
    });

    closeChatBtn.addEventListener('click', () => {
        chatWindow.classList.add('hidden');
    });
}

function addMessage(msg, type) {
    if (!chatHistory) return;
    const div = document.createElement('div');
    div.className = `chat-msg ${type}`;
    div.innerText = msg;
    chatHistory.appendChild(div);
    chatHistory.scrollTop = chatHistory.scrollHeight;
}

if (sendChatBtn && chatInput) {
    sendChatBtn.addEventListener('click', handleSend);
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleSend();
    });
}

let chatContextHistory = [];

async function handleSend() {
    const text = chatInput.value.trim();
    const apiKey = document.getElementById('gemini-api-key').value.trim();
    if (!text) return;
    if (!apiKey) {
        addMessage("Please paste your Gemini API Key in the box above to activate my AI engine.", "ai");
        return;
    }
    
    addMessage(text, 'user');
    chatInput.value = '';
    
    // Add user message to memory
    chatContextHistory.push({"role": "user", "parts": [{"text": text}]});

    // Provide the dynamic system context of their actual current metrics
    let sysPrompt = `You are Antigravity CFO, a strictly rigorous, no-nonsense financial advisor. 
You are currently talking to a user named ${engineMemory.name || "Client"}.
Their financial status:
- Income: ${engineMemory.income || 0}/mo
- Active SIP: ${engineMemory.sip || 0}/mo
- Emergency Fund target: ${engineMemory.totalExp ? engineMemory.totalExp * 6 : 0} (Current Cash: ${engineMemory.astCash || 0})
- Bad Debt: ${engineMemory.totalLiabilities || 0}
- Step-Up Strategy (yearly increase): ${engineMemory.stepUpPercent || 0}%
`
    if(engineMemory.extractedGoals) {
        sysPrompt += "Their Lifestyle Goals:\n";
        engineMemory.extractedGoals.forEach((g) => {
            sysPrompt += `- ${g.name}: Target ₹${g.target} in ${g.monthDue/12} Years\n`;
        });
    }

    sysPrompt += `\nINSTRUCTIONS:
You are an autonomous Agent. If you determine you must modify the dashboard to fix a problem (e.g. extending a goal timeline because they can't afford it, or increasing their Step-Up percentage), you MUST reply with ONLY a pure JSON block in this exact format. Do NOT use markdown ticks, just raw JSON:
{"action": "updateGoalTimeline", "goalName": "Car", "newTimelineYrs": 5}
{"action": "updateStepUp", "newPercent": 15}
{"action": "updateSIP", "newVal": 70000}

If no action is needed, just give ruthless financial advice in 1 or 2 short sentences.`;

    // Make the API Call to Gemini
    try {
        const payload = {
            "system_instruction": {
                "parts": { "text": sysPrompt }
            },
            "contents": chatContextHistory,
            // Settings for rigorous output
            "generationConfig": { "temperature": 0.2, "maxOutputTokens": 250 }
        };

        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await res.json();
        
        let aiText = data.candidates[0].content.parts[0].text.trim();
        // Save to history
        chatContextHistory.push({"role": "model", "parts": [{"text": aiText}]});

        // Intercept JSON Actions
        if (aiText.startsWith("{") && aiText.endsWith("}")) {
            try {
                let cmd = JSON.parse(aiText);
                if(cmd.action === "updateGoalTimeline") {
                    let goals = document.querySelectorAll('.dy-goal');
                    goals.forEach(g => {
                        if(g.querySelector('.g-name').value.toLowerCase().includes(cmd.goalName.toLowerCase())) {
                            g.querySelector('.g-yrs').value = cmd.newTimelineYrs;
                        }
                    });
                    addMessage(`SYSTEM ACTION: Modified timeline for '${cmd.goalName}' to ${cmd.newTimelineYrs} Years. Re-calculating strategy...`, 'ai');
                    calculateStrategy();
                } else if(cmd.action === "updateStepUp") {
                    document.getElementById('u-stepup').value = cmd.newPercent;
                    addMessage(`SYSTEM ACTION: Upgraded Annual Step-up to ${cmd.newPercent}%. Re-calculating strategy...`, 'ai');
                    calculateStrategy();
                } else if(cmd.action === "updateSIP") {
                    document.getElementById('u-sip').value = cmd.newVal;
                    addMessage(`SYSTEM ACTION: Upgraded Monthly SIP to ₹${cmd.newVal}. Re-calculating strategy...`, 'ai');
                    calculateStrategy();
                }
            } catch(e) {
                addMessage(aiText, 'ai');
            }
        } else {
            // Normal conversation
            addMessage(aiText, 'ai');
        }
    } catch(err) {
        addMessage("SYSTEM ERROR: Failed to reach Gemini network. Check API Key.", "ai");
    }
}
