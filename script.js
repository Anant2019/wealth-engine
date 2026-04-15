// --- UTILITIES ---
const formatCurrency = (n) => {
    const absN = Math.abs(n);
    if (absN >= 1000000000) return '₹' + (n / 1000000000).toFixed(2) + ' kCr'; // Thousand Crores (Billions)
    if (absN >= 10000000) return '₹' + (n / 10000000).toFixed(2) + ' Cr';
    if (absN >= 100000) return '₹' + (n / 100000).toFixed(2) + ' L';
    if (absN >= 1000) return '₹' + Math.round(n).toLocaleString('en-IN');
    return '₹' + Math.round(n);
};

function calcRequiredSIP(targetAmt, years, rateAnnual) {
    if (years <= 0 || targetAmt <= 0) return 0;
    let r = (rateAnnual / 100) / 12;
    let n = years * 12;
    return (targetAmt * r) / (Math.pow(1 + r, n) - 1);
}

// Lucide will be initialized inside DOMContentLoaded
// lucide.createIcons(); (moved)

let engineMemory = {};
let privacyOn = false;
let marketMode = 'bull'; // 'bull' or 'bear'

// ==================== CELEBRATION SYSTEM ====================
let _confettiCtx = null;
let _confettiParticles = [];
let _confettiRAF = null;

function launchConfetti(duration = 2800) {
    // Create canvas if not present
    let canvas = document.getElementById('confetti-canvas');
    if (!canvas) {
        canvas = document.createElement('canvas');
        canvas.id = 'confetti-canvas';
        canvas.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:9998;';
        document.body.appendChild(canvas);
    }
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
    _confettiCtx = canvas.getContext('2d');

    const COLORS = ['#10B981','#34D399','#22D3EE','#818CF8','#FFB800','#F472B6','#FFFFFF'];
    _confettiParticles = Array.from({length: 90}, () => ({
        x: Math.random() * canvas.width,
        y: -20 - Math.random() * 60,
        r: 4 + Math.random() * 5,
        d: 0.8 + Math.random() * 1.4,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        tilt: Math.random() * 10 - 10,
        tiltSpeed: 0.1 + Math.random() * 0.3,
        tiltAngle: 0,
        opacity: 1,
        shape: Math.random() > 0.5 ? 'circle' : 'rect'
    }));

    const startTime = Date.now();
    if (_confettiRAF) cancelAnimationFrame(_confettiRAF);

    function draw() {
        _confettiCtx.clearRect(0, 0, canvas.width, canvas.height);
        const elapsed = Date.now() - startTime;
        const fade = elapsed > duration * 0.6 ? 1 - (elapsed - duration * 0.6) / (duration * 0.4) : 1;

        _confettiParticles.forEach(p => {
            p.tiltAngle += p.tiltSpeed;
            p.y += p.d + Math.sin(p.tiltAngle) * 1.2;
            p.x += Math.sin(p.tiltAngle * 0.4) * 0.8;
            p.tilt = Math.sin(p.tiltAngle) * 12;
            p.opacity = Math.max(0, fade);

            _confettiCtx.save();
            _confettiCtx.globalAlpha = p.opacity;
            _confettiCtx.fillStyle = p.color;
            _confettiCtx.translate(p.x + p.r, p.y + p.r);
            _confettiCtx.rotate((p.tilt * Math.PI) / 180);
            if (p.shape === 'circle') {
                _confettiCtx.beginPath();
                _confettiCtx.arc(0, 0, p.r, 0, Math.PI * 2);
                _confettiCtx.fill();
            } else {
                _confettiCtx.fillRect(-p.r, -p.r / 2, p.r * 2, p.r);
            }
            _confettiCtx.restore();

            // Reset particles that fall off screen
            if (p.y > canvas.height + 20) {
                p.y = -20; p.x = Math.random() * canvas.width;
            }
        });

        if (elapsed < duration) {
            _confettiRAF = requestAnimationFrame(draw);
        } else {
            _confettiCtx.clearRect(0, 0, canvas.width, canvas.height);
        }
    }
    draw();
}

function showSuccessToast(msg, icon = '🎉') {
    let toast = document.getElementById('success-toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'success-toast';
        toast.className = 'success-toast';
        document.body.appendChild(toast);
    }
    toast.innerHTML = `<span class="success-toast-icon">${icon}</span><span>${msg}</span>`;
    toast.classList.remove('show');
    // Force reflow then animate in
    void toast.offsetWidth;
    toast.classList.add('show');
    clearTimeout(toast._hideTimer);
    toast._hideTimer = setTimeout(() => toast.classList.remove('show'), 4000);
}

function showMilestonePop(emoji, title, sub) {
    let pop = document.getElementById('milestone-pop');
    if (!pop) {
        pop = document.createElement('div');
        pop.id = 'milestone-pop';
        pop.className = 'milestone-pop';
        pop.innerHTML = `
            <div class="milestone-pop-emoji" id="mp-emoji"></div>
            <div class="milestone-pop-title" id="mp-title"></div>
            <div class="milestone-pop-sub" id="mp-sub"></div>
            <button class="milestone-pop-close" onclick="document.getElementById('milestone-pop').classList.remove('show')">Keep Going! 🚀</button>`;
        document.body.appendChild(pop);
    }
    document.getElementById('mp-emoji').textContent = emoji;
    document.getElementById('mp-title').textContent = title;
    document.getElementById('mp-sub').textContent   = sub;
    pop.classList.add('show');
    setTimeout(() => pop.classList.remove('show'), 8000);
}

// ==================== PRIVACY TOGGLE ====================
function togglePrivacy() {
    privacyOn = !privacyOn;
    document.body.classList.toggle('privacy-on', privacyOn);
    const icon = document.getElementById('privacy-icon');
    if (icon && typeof lucide !== 'undefined') {
        icon.setAttribute('data-lucide', privacyOn ? 'eye-off' : 'eye');
        lucide.createIcons();
    }
}

// ==================== SURVIVAL RUNWAY ====================
function calcSurvivalRunway(astCash, totalExp) {
    const runwayMonths = totalExp > 0 ? Math.floor(astCash / totalExp) : 0;
    const cappedMonths = Math.min(runwayMonths, 12);
    const pct = (cappedMonths / 12) * 100;
    const isDanger = runwayMonths < 3;

    const card = document.getElementById('survival-runway-card');
    const valEl = document.getElementById('runway-value');
    const subEl = document.getElementById('runway-subtitle');
    const fillEl = document.getElementById('runway-bar-fill');

    if (!valEl) return runwayMonths;

    // Animate number
    let prev = engineMemory.prevRunway || 0;
    if (prev < runwayMonths) celebrateRunwayGain();
    engineMemory.prevRunway = runwayMonths;

    valEl.textContent = runwayMonths + (runwayMonths === 1 ? ' month' : ' months');
    valEl.classList.toggle('danger-text', isDanger);

    if (runwayMonths < 3) {
        subEl.innerHTML = '⚠️ <strong>You are safe for a very short time.</strong> Build your emergency fund immediately — it is your first financial duty.';
        subEl.style.color = '#d97706';
        if(card) card.classList.add('danger');
        if(fillEl) fillEl.classList.add('danger-bar');
    } else if (runwayMonths < 6) {
        subEl.innerHTML = '⚡ Getting there. Target is <strong>6 months of expenses</strong>. Keep investing into your Safety FD.';
        subEl.style.color = '';
        if(card) card.classList.remove('danger');
        if(fillEl) fillEl.classList.remove('danger-bar');
    } else {
        subEl.innerHTML = '✅ <strong>Excellent.</strong> You are safe for ' + runwayMonths + ' months. Your family is protected from life\'s surprises.';
        subEl.style.color = 'var(--emerald)';
        if(card) card.classList.remove('danger');
        if(fillEl) fillEl.classList.remove('danger-bar');
    }

    // Animate bar width after frame
    setTimeout(() => {
        if(fillEl) fillEl.style.width = Math.max(pct, 2) + '%';
    }, 100);

    return runwayMonths;
}

// ==================== FREEDOM METER ====================
function calcFreedomMeter(totalAssets, totalExp) {
    const fiTarget = totalExp * 12 * 25; // 25x rule
    const pct = fiTarget > 0 ? Math.min((totalAssets / fiTarget) * 100, 100) : 0;
    // Daily passive income at 12% CAGR
    const dailyEarning = (totalAssets * 0.12) / 365;
    // Hours of work money does per day (arbitrary: 1 L/yr = 1 hr/day)
    const hrsPerDay = Math.min((dailyEarning / 274), 24).toFixed(1);

    const pctEl = document.getElementById('freedom-pct');
    const arcEl = document.getElementById('freedom-arc');
    const workersEl = document.getElementById('freedom-workers');

    if (pctEl) {
        pctEl.textContent = pct.toFixed(1) + '%';
        pctEl.classList.add('count-up-anim');
        setTimeout(() => pctEl.classList.remove('count-up-anim'), 600);
    }

    if (arcEl) {
        const circumference = 339.3;
        const dashoffset = circumference - (circumference * pct / 100);
        setTimeout(() => { arcEl.style.strokeDashoffset = dashoffset; }, 200);
    }

    if (workersEl) {
        workersEl.innerHTML = 'Your money works <strong>' + hrsPerDay + ' hrs/day</strong> for you right now.';
    }

    return { pct, dailyEarning };
}

// ==================== DAILY INSIGHT ====================
function renderDailyInsight(totalAssets) {
    const earned = (totalAssets * 0.12) / 365;
    if (earned < 1) return;
    const coffees = Math.floor(earned / 60);
    const textEl = document.getElementById('daily-insight-text');
    const earningsEl = document.getElementById('daily-insight-earnings');

    if (textEl) {
        const msgs = [
            `Your corpus earned ${formatCurrency(earned)} today while you slept. That's ${coffees > 0 ? coffees + ' cups of coffee ☕' : 'a start — keep investing!'}` ,
            `Money working for you 24/7: ${formatCurrency(earned)} generated today at 12% CAGR.`,
            `Even while you rest, your Aarth Sutra engine runs. Simulated daily appreciation: ${formatCurrency(earned)}.`
        ];
        textEl.textContent = msgs[Math.floor(Math.random() * msgs.length)];
    }
    if (earningsEl) {
        earningsEl.textContent = '+' + formatCurrency(earned) + '/day';
        earningsEl.style.display = 'block';
    }
}

// ==================== SMART WITHDRAWAL MODAL ====================
function openWithdrawModal() {
    // Reset to step 1
    document.querySelectorAll('.withdraw-step').forEach(s => s.classList.remove('active'));
    const s1 = document.getElementById('w-step-1');
    if (s1) s1.classList.add('active');
    const overlay = document.getElementById('withdraw-modal-overlay');
    if (overlay) overlay.classList.add('open');
}

function closeWithdrawModal() {
    const overlay = document.getElementById('withdraw-modal-overlay');
    if (overlay) overlay.classList.remove('open');
}

function withdrawStep2(type) {
    document.querySelectorAll('.withdraw-step').forEach(s => s.classList.remove('active'));
    
    // Goal Shield Logic: If Bear Market and user wants to withdraw from growth, warn them.
    if (marketMode === 'bear' && type === 'near-high') {
        const warningBox = document.getElementById('goal-shield-warning');
        if (warningBox) {
            warningBox.style.display = 'block';
            warningBox.innerHTML = `
                <div style="background:rgba(251, 140, 0, 0.1); border:1.5px solid var(--warning); padding:16px; border-radius:12px; margin-bottom:16px; color:var(--evergreen);">
                    <div style="display:flex; align-items:center; gap:8px; font-weight:800; margin-bottom:8px; color:var(--warning);">
                        <i data-lucide="shield-alert"></i> GOAL SHIELD ACTIVE
                    </div>
                    <p style="font-size:12px; line-height:1.5;"><strong>Market Regime: Bearish.</strong> Asset liquidation at this junction suboptimal. Strategic recommendation: **Loan Against Mutual Funds (LAMF)** @ ~9% to preserve compounding momentum.</p>
                </div>
            `;
            if (typeof lucide !== 'undefined') lucide.createIcons();
        }
    }

    const step = document.getElementById(type === 'near-high' ? 'w-step-2a' : 'w-step-2b');
    if (step) step.classList.add('active');
}

function toggleMarketPulse() {
    marketMode = marketMode === 'bull' ? 'bear' : 'bull';
    const text = document.getElementById('regime-text');
    if (text) {
        text.style.color = marketMode === 'bull' ? 'var(--emerald)' : 'var(--amber)';
        text.textContent = marketMode === 'bull' ? 'Positive — Good Time to Invest' : 'Caution — Markets Are Down';
    }
}

// Close modal on overlay click — deferred to avoid parse-time crash
document.addEventListener('DOMContentLoaded', function() {
    console.log("Aarth Sutra: Initializing Logic Engine...");

    // Privacy starts OFF — user toggles manually
    document.body.classList.remove('privacy-on');

    if (typeof lucide !== 'undefined') lucide.createIcons();
    const wmo = document.getElementById('withdraw-modal-overlay');
    if (wmo) wmo.addEventListener('click', function(e){ if(e.target === this) closeWithdrawModal(); });
    const pmo = document.getElementById('pillar-modal-overlay');
    if (pmo) pmo.addEventListener('click', function(e){ if(e.target === this) closePillarModal(e); });

    // Welcome modal — check if first visit
    checkFirstVisit();

    // Setup default portfolio rows if containers are empty
    setupDefaultPortfolio();
    const gc = document.getElementById('goal-container');
    if (gc && gc.children.length === 0) addGoal();
    const dc = document.getElementById('debt-container');
    if (dc && dc.children.length === 0) addDebt();

    // Wire debt total updates
    document.addEventListener('input', function(e) {
        if (e.target.classList.contains('d-p')) updateDebtTotal();
    });

    // Initial insurance display
    updateInsuranceImpact();

    // Call initial calculation (skip if welcome overlay is open)
    const overlay = document.getElementById('welcome-overlay');
    if (!overlay || overlay.classList.contains('hidden')) {
        setTimeout(calculateStrategy, 200);
    }
});

// ==================== PILLAR MODALS ====================
const PILLAR_DATA = {
    govtbond: {
        emoji: '🏛️', name: 'Govt Bonds & T-Bills', sub: 'Pillar 1 — The Vault',
        hook: '"Safe as a bank, but pays more. Backed by the Indian Government."',
        risk: 'Risk: 0% — Sovereign guarantee. Your principal is 100% safe. The only risk is low liquidity (locked for a period).',
        pros: '✅ 100% safe principal\n✅ 7–8% returns (better than savings account)\n✅ Government backstop',
        cons: '⚠️ Low liquidity — hard to exit early\n⚠️ Fixed rates — won\'t beat inflation in the long run',
        tip: 'Goldman Tip: Allocate 20–30% of your FI corpus here as your "Never Touch" layer.',
        color: '#059669', riskLabel: 'ZERO RISK', riskClass: 'risk-zero',
        platform: 'RBI Retail Direct — rbidirect.rbi.org.in'
    },
    corpbond: {
        emoji: '🏢', name: 'FD & Corporate Bonds', sub: 'Pillar 2 — Steady Income',
        hook: '"Be the lender. Big companies pay you interest every month."',
        risk: 'Risk: Low-Medium — Credit default risk. If the company goes bankrupt, you may lose money. Stick to AA+ rated bonds only.',
        pros: '✅ 9–12% returns — significantly better than FDs\n✅ Monthly income stream\n✅ Diversification from equity',
        cons: '⚠️ Credit default risk (company may fail)\n⚠️ Less regulated than bank FDs',
        tip: 'Goldman Tip: Only buy AA+ rated bonds. Max 25% of total corpus. Diversify across 5+ companies.',
        color: '#2563eb', riskLabel: 'LOW–MED RISK', riskClass: 'risk-low',
        platform: 'Wint Wealth · GoldenPi · Groww Fixed Income'
    },
    indexfund: {
        emoji: '📈', name: 'Index Funds — Core Engine', sub: 'Pillar 3 — The Wealth Builder',
        hook: '"Own a piece of India\'s 50 largest companies with one click."',
        risk: 'Risk: Moderate — Short-term volatility. In a bad year (2020, 2008), index funds dropped 20–50%. But in 10+ years, they have NEVER given negative returns.',
        pros: '✅ 12–15% long-term CAGR (historically)\n✅ Best risk-adjusted return over 10+ years\n✅ Low cost (0.1–0.2% expense ratio)\n✅ Highly liquid',
        cons: '⚠️ Volatile in the short term\n⚠️ Requires discipline — "Panic selling" is the #1 wealth destroyer',
        tip: 'Goldman Tip: This is your CORE logic engine. 60–70% of your SIP should go here. Never stop investing during a crash — that is when you buy the cheapest.',
        color: '#7c3aed', riskLabel: 'MOD. RISK', riskClass: 'risk-medium',
        platform: 'Zerodha Coin · Groww · Kuvera · Smallcase'
    },
    momentum: {
        emoji: '🚀', name: 'Momentum ETFs & P2P', sub: 'Pillar 4 — The Accelerator',
        hook: '"High monthly cash flow. Ride the fastest-moving stocks."',
        risk: 'Risk: HIGH — Momentum ETFs can drop 20-30% in a week. P2P lending has no collateral — borrowers can default. This is your highest-risk allocation.',
        pros: '✅ Momentum ETFs: 18–25% in bull markets\n✅ P2P: 11–14% monthly income\n✅ Portfolio diversification boost',
        cons: '⚠️ Can lose 20-30% rapidly\n⚠️ P2P has NO collateral — high default risk\n⚠️ No SEBI guarantee on P2P returns',
        tip: 'Goldman Tip: MAXIMUM 5% of your total corpus here. Treat this like a "speculation bet" — money you can afford to lose 100%. NEVER borrow to invest here.',
        color: '#d97706', riskLabel: 'HIGH RISK', riskClass: 'risk-high',
        platform: '12% Club · Faircent · Zerodha (Momentum ETFs)'
    },
    sgb: {
        emoji: '🛡️', name: 'SGB & Insurance Shield', sub: 'Pillar 5 — The Shield',
        hook: '"Gold that pays you 2.5% rent. Your hedge against everything."',
        risk: 'Risk: Medium — Gold price fluctuates with global macro events. But it is your hedge against currency devaluation, inflation, and geopolitical shocks.',
        pros: '✅ 2.5% p.a. interest PAID BY GOVERNMENT\n✅ Capital gains FULLY TAX-FREE if held to maturity\n✅ Tracks gold price (8–10% CAGR historically)\n✅ No storage risk (digital)',
        cons: '⚠️ 8-year lock-in (can exit after 5th year)\n⚠️ Gold price is volatile',
        tip: 'Goldman Tip: 10–15% of your corpus as your permanent insurance + inflation hedge. Pure Term + Health insurance are NON-NEGOTIABLE before any investment.',
        color: '#be185d', riskLabel: 'MED. RISK', riskClass: 'risk-medium',
        platform: 'Any Nationalized Bank · Zerodha · Groww (during SGB issuance window)'
    }
};

function openPillarModal(key) {
    const d = PILLAR_DATA[key];
    if (!d) return;
    const inner = document.getElementById('pillar-modal-inner');
    if (!inner) return;
    inner.innerHTML = `
        <button class="lib-close-btn" onclick="closePillarModal()">✕</button>
        <div style="text-align:center; margin-bottom:24px;">
            <div style="font-size:56px; margin-bottom:8px;">${d.emoji}</div>
            <h2 style="font-family:var(--font-display); font-size:26px; color:var(--emerald-deep); margin-bottom:4px;">${d.name}</h2>
            <div style="font-size:12px; font-weight:700; color:var(--slate-light); text-transform:uppercase; letter-spacing:1px;">${d.sub}</div>
        </div>
        <div class="real-talk-card" style="--pillar-c:${d.color}">
            <div>
                <div class="real-talk-item-label">The Hook</div>
                <div class="real-talk-item-val" style="font-style:italic;">${d.hook}</div>
            </div>
            <div>
                <div class="real-talk-item-label">Risk Level</div>
                <div><span class="pillar-risk-badge ${d.riskClass}">${d.riskLabel}</span></div>
            </div>
            <div>
                <div class="real-talk-item-label">Best For</div>
                <div class="real-talk-item-val">See pros below</div>
            </div>
            <div class="goldman-tip">💼 <strong>Goldman Tip:</strong> ${d.tip.replace('Goldman Tip: ','')}</div>
        </div>
        <div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:var(--r-md);padding:16px;margin-bottom:16px;">
            <div style="font-size:11px;font-weight:800;text-transform:uppercase;color:#92400e;margin-bottom:6px;">Real Risk — Read Before Investing</div>
            <div style="font-size:13px;color:#92400e;line-height:1.6;">${d.risk}</div>
        </div>
        <div class="lib-pros-cons">
            <div class="lib-pros"><strong>✅ Pros</strong>${d.pros.split('\n').map(l=>'<div>'+l+'</div>').join('')}</div>
            <div class="lib-cons"><strong>⚠️ Considerations</strong>${d.cons.split('\n').map(l=>'<div>'+l+'</div>').join('')}</div>
        </div>
        <div style="margin-top:20px;">
            <div class="lib-modal-section-title">Trusted Platforms</div>
            <div class="lib-platforms">${d.platform.split('·').map(p=>`<span class="lib-platform-tag">${p.trim()}</span>`).join('')}</div>
        </div>
    `;
    document.getElementById('pillar-modal-overlay').style.display = 'block';
    lucide.createIcons();
}

function closePillarModal(e) {
    if (!e || e.target === document.getElementById('pillar-modal-overlay') || e.target.classList.contains('lib-close-btn')) {
        document.getElementById('pillar-modal-overlay').style.display = 'none';
    }
}

// ==================== MICRO-NUDGE HELPERS ====================
function scrollToOptimizer() {
    const el = document.getElementById('optimizer-anchor');
    if (el) { switchTab('dash'); setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'center' }), 300); }
}

// ==================== CELEBRATION ====================
function celebrateRunwayGain() {
    const card = document.getElementById('survival-runway-card');
    if (card) {
        card.classList.add('celebrating');
        setTimeout(() => card.classList.remove('celebrating'), 700);
    }
    // Spawn confetti
    const colors = ['#059669','#6ee7b7','#fbbf24','#34d399','#a7f3d0'];
    for (let i = 0; i < 18; i++) {
        const p = document.createElement('div');
        p.className = 'confetti-piece';
        p.style.cssText = `left:${Math.random()*100}vw; top:${Math.random()*30+10}vh; background:${colors[Math.floor(Math.random()*colors.length)]}; animation-delay:${Math.random()*0.4}s;`;
        document.body.appendChild(p);
        setTimeout(() => p.remove(), 1600);
    }
}

// ==================== WEALTH WEATHER ENGINE ====================
function updateWealthWeather(hasBadDebt, isShortfall, hasIdleCash) {
    const banner = document.getElementById('weather-banner');
    if (!banner) return;
    const text = document.getElementById('regime-text');
    if (hasBadDebt || isShortfall) {
        text.textContent = 'Action Required (Logic Leak)';
        text.style.color = 'var(--error)';
    } else if (hasIdleCash) {
        text.textContent = 'Optimization Available';
        text.style.color = 'var(--amber)';
    } else {
        text.textContent = 'Logic Stable (Bullish)';
        text.style.color = 'var(--emerald)';
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
    sipVal = Number(sipVal);
    document.getElementById('fi-slider-display').innerText = formatCurrency(sipVal) + ' / month';
    const ageRaw = document.getElementById('u-age') ? document.getElementById('u-age').value : 28;
    const age = Number(ageRaw) || 28;
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
    const fiYear = new Date().getFullYear() + Math.floor(months / 12);
    const fiAge = age + Math.floor(months / 12);
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
    document.querySelectorAll('.pg').forEach(p => {
        p.classList.remove('on');
        p.classList.add('off');
    });
    document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
    
    // Mapping section IDs to nav IDs
    const sectionMap = {
        'intake': 'pg-onboard',
        'dash': 'pg-dash',
        'simulator': 'pg-sim',
        'lib': 'pg-lib',
        'ai': 'pg-ai'
    };
    
    const pg = document.getElementById(sectionMap[t]);
    const nav = document.getElementById('nav-' + t);
    
    if (pg) {
        pg.classList.remove('off');
        pg.classList.add('on', 'animated-fade');
    }
    if (nav) nav.classList.add('active');
    
    // Auto-calculating strategy when moving to Blueprint
    if (t === 'dash') calculateStrategy();
    
    setTimeout(() => lucide.createIcons(), 50);
}

// ==================== FIXED: addGoal ========================
function addGoal() {
    const id = 'g_' + Date.now();
    const c = document.getElementById('goal-container');
    if (!c) return;
    const r = document.createElement('div');
    r.className = 'dy-row dy-goal'; r.id = id;
    r.innerHTML = `
        <div class="form-group" style="margin:0;">
            <label>Goal Name</label>
            <input type="text" class="g-name" placeholder="e.g. Car, Home, Europe Trip">
        </div>
        <div class="form-group" style="margin:0;">
            <label>Target Amount (₹)</label>
            <input type="number" class="g-tgt" placeholder="e.g. 1500000" min="0">
        </div>
        <div class="form-group" style="margin:0;">
            <label>Years Away</label>
            <input type="number" class="g-yrs" placeholder="e.g. 3" min="1" max="40">
        </div>
        <button class="del-btn" onclick="document.getElementById('${id}').remove()" title="Remove">✕</button>
    `;
    c.appendChild(r);
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

// Legacy aliases (safe to call)
function addGoalField() { addGoal(); }

// ==================== FIXED: addDebt ========================
function addDebt() {
    const id = 'd_' + Date.now();
    const c = document.getElementById('debt-container');
    if (!c) return;
    const r = document.createElement('div');
    r.className = 'dy-row dy-debt'; r.id = id;
    r.innerHTML = `
        <div class="form-group" style="margin:0;">
            <label>Lender / Loan Name</label>
            <input type="text" class="d-n" placeholder="e.g. HDFC Home Loan, Credit Card">
        </div>
        <div class="form-group" style="margin:0;">
            <label>Outstanding Principal (₹)</label>
            <input type="number" class="d-p" placeholder="e.g. 1500000" min="0" oninput="updateDebtTotal()">
        </div>
        <div class="form-group" style="margin:0;">
            <label>Interest Rate (% p.a.)</label>
            <input type="number" class="d-r" placeholder="e.g. 8.5" min="0" max="60" step="0.1">
        </div>
        <div class="form-group" style="margin:0;">
            <label>Monthly EMI (₹)</label>
            <input type="number" class="d-e" placeholder="e.g. 15000" min="0">
        </div>
        <button class="del-btn" onclick="document.getElementById('${id}').remove(); updateDebtTotal();" title="Remove">✕</button>
    `;
    c.appendChild(r);
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

function addDebtField() { addDebt(); }

// Default rates by asset type
const ASSET_DEFAULT_RATES = {
    savings: 3.5, fd: 7.5, rd: 7.0, corp_bonds: 10.0, po_schemes: 7.7,
    mutual_fund: 12.0, stocks_in: 15.0, stocks_us: 13.0, etf: 12.0,
    epf: 8.1, ppf: 7.1, nps: 10.0, endowment: 4.5,
    ulip: 8.0, gold_physical: 8.5, sgb: 10.0, real_estate: 10.0,
    crypto: 20.0, reit: 10.0, p2p: 12.0
};

const ASSET_LABELS = {
    savings: { label: '🏦 Savings Account', liq: true },
    fd:      { label: '🏦 Fixed Deposit (FD)', liq: true },
    rd:      { label: '🏦 Recurring Deposit (RD)', liq: true },
    corp_bonds: { label: '📋 Corporate Bonds', liq: true },
    po_schemes: { label: '📮 Post Office / NSC', liq: true },
    mutual_fund: { label: '📈 Equity Mutual Funds', liq: true },
    mutual_debt: { label: '📊 Debt Mutual Funds', liq: true },
    stocks_in:   { label: '📉 Direct Stocks (India)', liq: true },
    stocks_us:   { label: '🌍 US / Global Stocks', liq: true },
    etf:         { label: '📈 Index Funds & ETFs', liq: true },
    epf:  { label: '🏛️ EPF / Provident Fund', liq: false },
    ppf:  { label: '📮 PPF (Public Provident Fund)', liq: false },
    nps:  { label: '🏅 NPS (National Pension)', liq: false },
    endowment: { label: '🔒 Endowment / LIC Policy', liq: false },
    ulip: { label: '🔒 ULIP', liq: false },
    gold_physical: { label: '🥇 Physical Gold', liq: true },
    sgb:  { label: '🥇 Sovereign Gold Bond (SGB)', liq: true },
    real_estate: { label: '🏠 Real Estate / Land', liq: false },
    reit: { label: '🏢 REIT', liq: true },
    p2p:  { label: '🔗 P2P Lending', liq: false },
    crypto: { label: '₿ Cryptocurrency', liq: true },
};

function addAccount(defType = 'savings', defName = '', defValue = 0, defRate = null) {
    const id = 'a_' + Date.now();
    const c = document.getElementById('account-container');
    if (!c) return;
    const r = document.createElement('div');
    r.className = 'dy-row dy-account'; r.id = id;
    const rate = defRate !== null ? defRate : (ASSET_DEFAULT_RATES[defType] || 8);
    const isIlliquid = ASSET_LABELS[defType] && !ASSET_LABELS[defType].liq;

    r.innerHTML = `
        <div class="form-group" style="margin:0;">
            <label>Asset Type</label>
            <select class="a-t" onchange="onAssetTypeChange(this)">
                <optgroup label="🏦 Banking & Fixed Income">
                    <option value="savings">🏦 Savings Account (3.5%)</option>
                    <option value="fd">🏦 Fixed Deposit / FD (7.5%)</option>
                    <option value="rd">🏦 Recurring Deposit / RD (7%)</option>
                    <option value="corp_bonds">📋 Corporate Bonds (10%)</option>
                    <option value="po_schemes">📮 Post Office / NSC (7.7%)</option>
                </optgroup>
                <optgroup label="📈 Market Investments">
                    <option value="mutual_fund">📈 Equity Mutual Funds (12%)</option>
                    <option value="mutual_debt">📊 Debt Mutual Funds (7.5%)</option>
                    <option value="stocks_in">📉 Direct Stocks India (15%)</option>
                    <option value="stocks_us">🌍 US / Global Stocks (13%)</option>
                    <option value="etf">📈 Index Funds & ETFs (12%)</option>
                </optgroup>
                <optgroup label="🏛️ Retirement & Long-Term">
                    <option value="epf">🏛️ EPF / Provident Fund (8.15%)</option>
                    <option value="ppf">📮 PPF (7.1%)</option>
                    <option value="nps">🏅 NPS Pension (10%)</option>
                    <option value="endowment">🔒 LIC / Endowment (4.5%)</option>
                </optgroup>
                <optgroup label="🌟 Alternatives">
                    <option value="gold_physical">🥇 Physical Gold (8.5%)</option>
                    <option value="sgb">🥇 Sovereign Gold Bond (10%)</option>
                    <option value="real_estate">🏠 Real Estate / Land (8%) 🔴Illiquid</option>
                    <option value="reit">🏢 REIT (10%)</option>
                    <option value="p2p">🔗 P2P Lending (12%) ⚠️Risk</option>
                    <option value="crypto">₿ Cryptocurrency (20%) ⚠️High Risk</option>
                    <option value="ulip">🔒 ULIP (8%)</option>
                </optgroup>
            </select>
        </div>
        <div class="form-group" style="margin:0;">
            <label>Description / Platform</label>
            <input type="text" class="a-n" placeholder="e.g. Zerodha Nifty 50 SIP" value="${defName}">
        </div>
        <div class="form-group" style="margin:0;">
            <label>Current Value (₹)</label>
            <input type="number" class="a-p" placeholder="0" value="${defValue || ''}" min="0" oninput="updatePortfolioTotal()">
        </div>
        <div class="form-group" style="margin:0;">
            <label>Return % p.a.</label>
            <div style="display:flex;align-items:center;gap:4px;">
                <input type="number" class="a-r" value="${rate}" step="0.1" min="0" max="100" style="border-color:var(--amber); width:100%;">
            </div>
        </div>
        <button class="del-btn" onclick="document.getElementById('${id}').remove(); updatePortfolioTotal();" title="Remove">✕</button>
    `;
    c.appendChild(r);
    // Set the selected type
    const sel = r.querySelector('.a-t');
    if (sel) sel.value = defType;
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

function onAssetTypeChange(sel) {
    const row = sel.closest('.dy-account');
    if (!row) return;
    const rateInput = row.querySelector('.a-r');
    if (rateInput && ASSET_DEFAULT_RATES[sel.value] !== undefined) {
        rateInput.value = ASSET_DEFAULT_RATES[sel.value];
    }
}

// window.onload moved to DOMContentLoaded listener above

// ==================== PORTFOLIO TOTALS ====================
function updatePortfolioTotal() {
    let total = 0;
    document.querySelectorAll('.dy-account .a-p').forEach(inp => {
        total += parseFloat(inp.value) || 0;
    });
    const el = document.getElementById('portfolio-total-display');
    if (el) el.textContent = formatCurrency(total);
}

function updateDebtTotal() {
    let total = 0;
    document.querySelectorAll('.dy-debt .d-p').forEach(inp => {
        total += parseFloat(inp.value) || 0;
    });
    const el = document.getElementById('debt-total-display');
    if (el) el.textContent = formatCurrency(total);
}

// ==================== INSURANCE IMPACT DISPLAY ====================
function updateInsuranceImpact() {
    const hasMed  = (document.getElementById('u-med')  || {}).value === 'yes';
    const hasTerm = (document.getElementById('u-term') || {}).value === 'yes';
    const income  = parseFloat((document.getElementById('u-income') || {}).value) || 0;
    const totalExp = (parseFloat((document.getElementById('u-rent')      || {}).value) || 0) +
                     (parseFloat((document.getElementById('u-groceries') || {}).value) || 0) +
                     (parseFloat((document.getElementById('u-cc')        || {}).value) || 0) +
                     (parseFloat((document.getElementById('u-life')      || {}).value) || 0);

    const warnEl = document.getElementById('insurance-warning');
    if (!warnEl) return;

    const missing = [];
    if (!hasMed)  missing.push('health');
    if (!hasTerm) missing.push('term');

    if (missing.length === 0) {
        warnEl.style.display = 'none';
        warnEl.innerHTML = '';
        return;
    }

    const isDouble = missing.length === 2;
    let title, text;
    const efMonths = hasMed ? 6 : 12;
    const efRequired = formatCurrency(totalExp * efMonths);

    if (isDouble) {
        title = '🚨 Critical Gap: No Health + No Term Insurance';
        text  = `Without both shields your family faces <strong>double exposure</strong>. We've set your Emergency Fund target to <strong>12 months</strong> (${efRequired}) instead of 6. Budget ~₹2,500/mo for term life and ~₹1,000/mo for a ₹5L health floater — this is non-negotiable. Get these before any SIP.`;
    } else if (!hasMed) {
        title = '⚠️ Missing: Health Insurance';
        text  = `Without health cover, a single hospitalisation can destroy years of savings. Emergency Fund set to <strong>12 months</strong> (${efRequired}). A ₹5L family floater costs ~₹1,000/mo — add it before increasing any SIP.`;
    } else {
        title = '⚠️ Missing: Term Life Insurance';
        text  = `Your family has no income protection. A ₹1 Crore term plan at your age costs only ~₹1,200/mo. Get it today — it unlocks your full financial freedom runway.`;
    }

    warnEl.style.display = 'block';
    warnEl.innerHTML = `
        <div class="insurance-warning-card ${isDouble ? '' : 'amber'}">
            <div class="insurance-warning-icon">${isDouble ? '🚨' : '⚠️'}</div>
            <div class="insurance-warning-body">
                <div class="insurance-warning-title">${title}</div>
                <div class="insurance-warning-text">${text}</div>
            </div>
        </div>`;
}

// ==================== DEFAULT PORTFOLIO SETUP ====================
function setupDefaultPortfolio() {
    const container = document.getElementById('account-container');
    if (!container || container.children.length > 0) return;
    // Pre-populate with 3 common assets
    addAccount('savings',     'Emergency / Salary Account', 50000);
    addAccount('mutual_fund', 'Nifty 50 Index SIP',         200000);
    addAccount('epf',         'EPFO / Company PF',          150000);
    // Update total display
    updatePortfolioTotal();
}

// ==================== WELCOME MODAL LOGIC ====================
function completeWelcome() {
    const nameInp = document.getElementById('welcome-name');
    const keyInp  = document.getElementById('welcome-api-key');

    const name = nameInp ? nameInp.value.trim() : '';
    const key  = keyInp  ? keyInp.value.trim()  : '';

    if (name) {
        // Pre-fill main name field
        const mainName = document.getElementById('u-name');
        if (mainName) mainName.value = name;
        // Persist
        try { localStorage.setItem('aarth_user_name', name); } catch(e){}
    }
    if (key) {
        // Sync to all API key fields
        ['gemini-api-key', 'gemini-api-key-2'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.value = key;
        });
        try { localStorage.setItem('aarth_api_key', key); } catch(e){}
    }

    // Mark visited
    try { localStorage.setItem('aarth_visited', '1'); } catch(e){}

    // Hide overlay with fade
    const overlay = document.getElementById('welcome-overlay');
    if (overlay) {
        overlay.style.opacity = '0';
        overlay.style.transition = 'opacity 0.4s ease';
        setTimeout(() => overlay.classList.add('hidden'), 420);
    }

    // Run initial calculation after a short delay
    setTimeout(calculateStrategy, 500);
}

function checkFirstVisit() {
    let visited = false;
    try { visited = !!localStorage.getItem('aarth_visited'); } catch(e){}

    // Restore persisted data
    try {
        const savedName = localStorage.getItem('aarth_user_name');
        const savedKey  = localStorage.getItem('aarth_api_key');
        if (savedName) {
            const el = document.getElementById('u-name');
            if (el) el.value = savedName;
            const wn = document.getElementById('welcome-name');
            if (wn) wn.value = savedName;
        }
        if (savedKey) {
            ['gemini-api-key', 'gemini-api-key-2'].forEach(id => {
                const el = document.getElementById(id);
                if (el) el.value = savedKey;
            });
        }
    } catch(e){}

    const overlay = document.getElementById('welcome-overlay');
    if (visited && overlay) {
        overlay.classList.add('hidden');
    }
    // If not visited, overlay stays visible (it's shown by default in HTML)
}

// --- MASTER ALGORITHM (LADDER LOGIC & GOALS) ---
function calculateStrategy() {
    // Visual feedback on the compute button
    const ctaBtn = document.querySelector('.compute-cta');
    if (ctaBtn) ctaBtn.classList.add('computing');

    const name = document.getElementById('u-name').value;

    // Cashflow
    const income = parseFloat(document.getElementById('u-income').value) || 0;
    const sip = parseFloat(document.getElementById('u-sip').value) || 0;
    const stepUpPercent = parseFloat(document.getElementById('u-stepup').value) || 0;
    const totalExp = (parseFloat(document.getElementById('u-rent').value)||0) + (parseFloat(document.getElementById('u-groceries').value)||0) + (parseFloat(document.getElementById('u-cc').value)||0) + (parseFloat(document.getElementById('u-life').value)||0);

    // Insurance flags affect emergency fund requirement
    const hasMedIns  = (document.getElementById('u-med')  || {}).value === 'yes';
    const hasTermIns = (document.getElementById('u-term') || {}).value === 'yes';
    const emFundMonths = hasMedIns ? 6 : 12; // no health insurance = double emergency fund
    const emFundReq = totalExp * emFundMonths;

    // Dynamic Asset Aggregation — uses ASSET_LABELS for liquid/illiquid classification
    let astCash = 0; let astEq = 0; let astPF = 0; let astGold = 0;
    let astIlliquid = 0; // real estate, P2P, PPF lock-in etc.
    let totalWeightedReturn = 0; let totalWeightedValue = 0;

    document.querySelectorAll('.dy-account').forEach(r => {
        let type = r.querySelector('.a-t') ? r.querySelector('.a-t').value : 'savings';
        let bal = parseFloat(r.querySelector('.a-p') ? r.querySelector('.a-p').value : 0) || 0;
        let rt  = parseFloat(r.querySelector('.a-r') ? r.querySelector('.a-r').value : (ASSET_DEFAULT_RATES[type]||8)) || (ASSET_DEFAULT_RATES[type]||8);

        // Weighted return tracking for blended portfolio CAGR
        if (bal > 0) { totalWeightedValue += bal; totalWeightedReturn += bal * rt; }

        const liqInfo = ASSET_LABELS[type];
        const isLiquid = !liqInfo || liqInfo.liq; // default to liquid if unknown

        if (!isLiquid) {
            // Illiquid: P2P, real estate, PPF, EPF, NPS, endowment, SGB, ULIP
            astIlliquid += bal;
            // Still count illiquid assets in the right category for net worth
        }

        switch(type) {
            case 'savings': case 'fd': case 'rd': case 'po_schemes':
            case 'corp_bonds': case 'mutual_debt':
                astCash += bal; break;
            case 'mutual_fund': case 'stocks_in': case 'stocks_us':
            case 'etf': case 'crypto': case 'reit':
                astEq += bal; break;
            case 'ulip': case 'epf': case 'ppf': case 'nps': case 'endowment':
                astPF += bal; break;
            case 'gold_physical': case 'sgb':
                astGold += bal; break;
            case 'real_estate':
                astGold += bal; break; // bucket real estate with alternatives
            case 'p2p':
                astEq += bal; break;   // bucket P2P with equity-risk assets
            default:
                astCash += bal;
        }
    });
    const totalAssets = astCash + astEq + astPF + astGold;
    const liquidAssets = totalAssets - astIlliquid;
    const blendedCAGR = totalWeightedValue > 0 ? (totalWeightedReturn / totalWeightedValue) : 12;
    // For FI projection: only liquid/deployable assets serve as corpus base
    const fiCorpusBase = liquidAssets;

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

    // ══ NEW PREMIUM WIDGETS ══
    calcSurvivalRunway(astCash, totalExp);
    const { dailyEarning } = calcFreedomMeter(totalAssets, totalExp);
    renderDailyInsight(totalAssets);

    // Memory
    engineMemory = {
        name, income, totalExp, unallocatedCashflow,
        totalAssets, totalLiabilities, astCash, astEq, dArr, sip, sumSurplus,
        stepUpPercent,
        p1: p1_secure, p3: p3_secure, p4: p4_secure,
        cfStat, safeStat, liaStat, nextMilestone, goalAnalysisHTML,
        // Insurance & portfolio intelligence
        hasMedIns, hasTermIns, emFundMonths, blendedCAGR,
        liquidAssets, astIlliquid, fiCorpusBase,
        netWorth: totalAssets - totalLiabilities,
        surplus: sumSurplus
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
        // Strategic Target Tracking Update (Aarth Sutra Refactor)
        const fireNumber = engineMemory.fireNumber || (totalExp * 12 * 25);
        const freedomPct = Math.min(Math.round((totalAssets / fireNumber) * 100), 100);
        
        const gaugePct = document.getElementById('freedom-gauge-pct');
        const gaugeFill = document.getElementById('freedom-gauge-fill');
        const gaugeStatus = document.getElementById('freedom-gauge-status');

        if (gaugePct) gaugePct.textContent = freedomPct + '%';
        if (gaugeFill) gaugeFill.style.width = freedomPct + '%';
        if (gaugeStatus) {
            if (freedomPct >= 100) gaugeStatus.innerHTML = '<span style="color:var(--success)">🏆 You\'ve reached Financial Independence! You can stop working for money.</span>';
            else if (freedomPct >= 75) gaugeStatus.textContent = '🚀 Almost there! 75% of the way to freedom. Stay consistent.';
            else if (freedomPct >= 50) gaugeStatus.textContent = '💪 You\'re halfway! Your money is growing. Keep adding every month.';
            else if (freedomPct >= 25) gaugeStatus.textContent = '🌱 Good start! A quarter done. Compounding will do the heavy lifting from here.';
            else gaugeStatus.textContent = '✨ Your wealth journey begins. Every rupee invested today is worth 10x tomorrow.';
        }
    }

    document.getElementById('monthly-allocator-body').innerHTML = allocHTML;

    // ══ POP THE COMPUTE BUTTON BACK ══
    if (ctaBtn) ctaBtn.classList.remove('computing');

    // ══ CELEBRATION & NET WORTH MILESTONE CHECK ══
    const nw = engineMemory.netWorth || 0;
    const prevNW = engineMemory._prevNetWorth || 0;
    engineMemory._prevNetWorth = nw;
    const isFirstRun = !engineMemory._hasRun;
    engineMemory._hasRun = true;

    // Animate the net worth number pop
    const nwEl = document.getElementById('nw-total-wealth');
    if (nwEl) { nwEl.classList.remove('value-pop'); void nwEl.offsetWidth; nwEl.classList.add('value-pop'); }

    // Determine celebration intensity
    let milestone = null;
    if (nw >= 100000000)       milestone = { e: '🏆', t: 'One Crore Club!', s: 'You have crossed ₹1 Crore in net worth. You are in the top 1% of India. Keep compounding.' };
    else if (nw >= 10000000)   milestone = { e: '💎', t: '₹10 Lakh Milestone!', s: 'Double digits in lakhs. Most people never get here. You are building real generational wealth.' };
    else if (nw >= 500000)     milestone = { e: '🚀', t: '₹5 Lakh Achieved!', s: 'Your money is now working for you. Every rupee invested multiplies. Stay consistent!' };
    else if (nw >= 100000)     milestone = { e: '🌱', t: 'Journey Started!', s: 'Your first ₹1 Lakh in the journey. This seed will become a forest. Never stop planting.' };
    else if (nw > 0 && isFirstRun) milestone = { e: '✨', t: 'Blueprint Ready!', s: 'Your personalised wealth plan is live. Small steps now = massive freedom later. Let\'s go!' };

    if (milestone) {
        launchConfetti(milestone.e === '🏆' ? 5000 : 3000);
        setTimeout(() => showMilestonePop(milestone.e, milestone.t, milestone.s), 600);
    } else if (nw > prevNW && !isFirstRun) {
        showSuccessToast('Your plan is updated! Stay on track 💪', '📈');
    } else if (isFirstRun) {
        showSuccessToast('Blueprint ready! Scroll down to see your plan.', '🎯');
    }

    switchTab('dash');
    if (typeof lucide !== 'undefined') lucide.createIcons();
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

    document.getElementById('pdf-bp-title').innerText = `Aarth Sutra | Algorithmic Strategy: ${engineMemory.name}`;

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

// ==================== EXCEL / CSV REPORT GENERATOR ====================
function generateExcelReport() {
    if (!engineMemory || engineMemory.totalAssets === undefined) {
        alert("Please fill in your details and click 'Compute My Wealth Blueprint' first, then ask for the report.");
        return;
    }
    const m = engineMemory;
    const fmt = (n) => Math.round(n || 0);
    const rows = [];

    // Section A — Summary
    rows.push(['AARTH SUTRA — MY FINANCIAL REPORT', '', '', '']);
    rows.push(['Generated on', new Date().toLocaleDateString('en-IN'), '', '']);
    rows.push(['Name', m.name || '', '', '']);
    rows.push(['', '', '', '']);

    rows.push(['=== MY MONEY SUMMARY ===', '', '', '']);
    rows.push(['What I earn every month (₹)', fmt(m.income), '', '']);
    rows.push(['What I spend every month (₹)', fmt(m.totalExp), '', '']);
    rows.push(['What I invest every month (₹)', fmt(m.sip), '', '']);
    rows.push(['Money left after expenses (₹)', fmt(m.unallocatedCashflow), '', '']);
    rows.push(['', '', '', '']);

    rows.push(['=== MY WEALTH STATUS ===', '', '', '']);
    rows.push(['Total Savings & Investments (₹)', fmt(m.totalAssets), '', '']);
    rows.push(['Money I owe (Loans/Debts) (₹)', fmt(m.totalLiabilities), '', '']);
    rows.push(['My Net Worth (₹)', fmt(m.netWorth), '', '']);
    rows.push(['Cash I can use right now (₹)', fmt(m.astCash), '', '']);
    rows.push(['Money locked up in property/PF (₹)', fmt(m.astIlliquid), '', '']);
    rows.push(['My portfolio is growing at', (m.blendedCAGR || 12).toFixed(1) + '% per year', '', '']);
    rows.push(['', '', '', '']);

    rows.push(['=== MY SAFETY NET ===', '', '', '']);
    rows.push(['Emergency fund I need (₹)', fmt((m.totalExp || 0) * (m.emFundMonths || 6)), '', '']);
    rows.push(['Months of expenses covered', (m.emFundMonths || 6) + ' months', '', '']);
    rows.push(['Health insurance active?', m.hasMedIns ? 'Yes ✓' : 'No — please get one!', '', '']);
    rows.push(['Term life insurance active?', m.hasTermIns ? 'Yes ✓' : 'No — please get one!', '', '']);
    rows.push(['', '', '', '']);

    // Section B — All assets
    rows.push(['=== MY SAVINGS & INVESTMENTS (Each Account) ===', '', '', '']);
    rows.push(['Asset Type', 'Account / Platform', 'Current Value (₹)', 'Return % per year']);
    document.querySelectorAll('.dy-account').forEach(r => {
        const type = (r.querySelector('.a-t') || {}).value || '';
        const name = (r.querySelector('.a-n') || {}).value || '';
        const val  = parseFloat((r.querySelector('.a-p') || {}).value) || 0;
        const rt   = parseFloat((r.querySelector('.a-r') || {}).value) || 0;
        const label = (ASSET_LABELS[type] || {}).label || type;
        if (val > 0) rows.push([label, name, fmt(val), rt + '%']);
    });
    rows.push(['', '', '', '']);

    // Section C — Debts
    rows.push(['=== MY LOANS & DEBTS ===', '', '', '']);
    rows.push(['Lender / Loan Name', 'Outstanding Amount (₹)', 'Interest Rate %', 'Monthly EMI (₹)']);
    document.querySelectorAll('.dy-debt').forEach(r => {
        const n = (r.querySelector('.d-n') || {}).value || '';
        const p = parseFloat((r.querySelector('.d-p') || {}).value) || 0;
        const rt= parseFloat((r.querySelector('.d-r') || {}).value) || 0;
        const e = parseFloat((r.querySelector('.d-e') || {}).value) || 0;
        if (p > 0) rows.push([n, fmt(p), rt + '%', fmt(e)]);
    });
    rows.push(['', '', '', '']);

    // Section D — Goals
    rows.push(['=== MY GOALS & DREAMS ===', '', '', '']);
    rows.push(['Goal', 'Money I Need (₹)', 'Years Away', 'Monthly Saving Needed (₹)']);
    document.querySelectorAll('.dy-goal').forEach(r => {
        const nm  = (r.querySelector('.g-name') || {}).value || '';
        const tgt = parseFloat((r.querySelector('.g-tgt') || {}).value) || 0;
        const yrs = parseFloat((r.querySelector('.g-yrs') || {}).value) || 0;
        if (tgt > 0 && yrs > 0) {
            const rate = yrs <= 3 ? 7 : 12;
            const sip  = Math.round(calcRequiredSIP(tgt, yrs, rate));
            rows.push([nm, fmt(tgt), yrs + ' years', fmt(sip)]);
        }
    });

    // Build CSV
    const csv = rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' }); // BOM for Excel
    const url  = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href     = url;
    link.download = `Aarth_Sutra_Report_${(m.name || 'My').replace(/\s+/g, '_')}_${new Date().toISOString().slice(0,10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
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
    let sysPrompt = `You are Aarth Sutra — a warm, caring Indian personal finance guide. You speak simply, like a knowledgeable friend, not a bank manager. Use plain Hindi-English (Hinglish) terms where helpful.

Your ONLY areas of help:
- Personal finance: savings, budgeting, spending habits
- Wealth building: SIP, mutual funds, FD, stocks, gold, EPF, PPF, NPS
- Debt freedom: loans, credit cards, EMI planning, prepayment strategy
- Insurance: term life, health, why both matter
- Indian taxes: 80C, HRA, capital gains, basic tax saving — only finance-related law
- Retirement & financial independence planning
- Emotional support when someone feels stressed, anxious, or hopeless about money

If the user asks ANYTHING outside these topics (cricket, cooking, coding, politics, relationships, medical advice, etc.), respond EXACTLY with:
"I'm your money guide and I can only help with finance, wealth, and debt. For this, please talk to the right expert 😊 Want me to help you with something about your money instead?"

Current user profile — ${engineMemory.name || "Friend"}:
- Monthly income: ₹${engineMemory.income || 0} | Monthly expenses: ₹${engineMemory.totalExp || 0}
- Monthly investment (SIP): ₹${engineMemory.sip || 0} | Free surplus: ₹${engineMemory.unallocatedCashflow || 0}
- Net worth: ₹${engineMemory.netWorth || 0} | Liquid savings: ₹${engineMemory.astCash || 0}
- Money locked in property/PF: ₹${engineMemory.astIlliquid || 0}
- Portfolio growing at: ${(engineMemory.blendedCAGR||12).toFixed(1)}% per year
- Health insurance: ${engineMemory.hasMedIns ? 'Yes ✓' : 'No — needs one urgently'} | Term insurance: ${engineMemory.hasTermIns ? 'Yes ✓' : 'No — needs one urgently'}
- Total debt: ₹${engineMemory.totalLiabilities || 0}
- Annual SIP step-up: ${engineMemory.stepUpPercent || 0}%
`
    if(engineMemory.extractedGoals && engineMemory.extractedGoals.length > 0) {
        sysPrompt += "Their goals:\n";
        engineMemory.extractedGoals.forEach((g) => {
            sysPrompt += `- ${g.name}: Need ₹${g.target} in ${(g.monthDue/12).toFixed(0)} years\n`;
        });
    }

    sysPrompt += `\nACTION INSTRUCTIONS — if a change is needed or the user asks for a report, reply ONLY with one of these raw JSON formats (no markdown):
{"action": "updateGoalTimeline", "goalName": "Car", "newTimelineYrs": 5}
{"action": "updateStepUp", "newPercent": 15}
{"action": "updateSIP", "newVal": 70000}
{"action": "generatePDF"}
{"action": "generateExcel"}

For reports: if user says "download report", "get PDF", "give me Excel", "export my data" — use the correct action above.
For all other finance questions: give warm, clear advice in 2–3 simple sentences. No jargon. Use ₹ for amounts. Be encouraging but honest.`;

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
                    addMessage(`Done! I've moved your "${cmd.goalName}" goal to ${cmd.newTimelineYrs} years. This gives your money more time to grow. Re-calculating your plan...`, 'ai');
                    calculateStrategy();
                } else if(cmd.action === "updateStepUp") {
                    document.getElementById('u-stepup').value = cmd.newPercent;
                    addMessage(`Done! Your yearly SIP increase is now set to ${cmd.newPercent}%. This small step will make a huge difference over time. Re-calculating...`, 'ai');
                    calculateStrategy();
                } else if(cmd.action === "updateSIP") {
                    document.getElementById('u-sip').value = cmd.newVal;
                    addMessage(`Done! Your monthly investment is now set to ₹${cmd.newVal.toLocaleString('en-IN')}. Re-calculating your plan...`, 'ai');
                    calculateStrategy();
                } else if(cmd.action === "generatePDF") {
                    addMessage("Creating your PDF report... The print dialog will open now. Choose 'Save as PDF' to download it.", 'ai');
                    setTimeout(generateWealthBlueprintPDF, 600);
                } else if(cmd.action === "generateExcel") {
                    addMessage("Downloading your Excel report now! Open it in Microsoft Excel or Google Sheets to see all your numbers.", 'ai');
                    setTimeout(generateExcelReport, 400);
                }
            } catch(e) {
                addMessage(aiText, 'ai');
            }
        } else {
            // Normal conversation
            addMessage(aiText, 'ai');
        }
    } catch(err) {
        addMessage("Hmm, could not reach the AI right now. Please check your API key and internet connection.", "ai");
    }
}
// ==================== AI INLINE CHAT (AI TAB) ====================
function triggerAIPrompt(text) {
    // Sync API key from tab input to chat widget if filled
    const tabKey = document.getElementById('gemini-api-key-2');
    const mainKey = document.getElementById('gemini-api-key');
    if (tabKey && tabKey.value && mainKey) mainKey.value = tabKey.value;

    const inlineInput = document.getElementById('ai-inline-input');
    if (inlineInput) { inlineInput.value = text; sendInlineChat(); }
}

async function sendInlineChat() {
    const input = document.getElementById('ai-inline-input');
    const history = document.getElementById('ai-inline-history');
    if (!input || !history) return;
    const text = input.value.trim();
    if (!text) return;

    // Sync API key
    const tabKey = document.getElementById('gemini-api-key-2');
    const mainKey = document.getElementById('gemini-api-key');
    if (tabKey && tabKey.value && mainKey) mainKey.value = tabKey.value;

    // Add user message
    const uMsg = document.createElement('div');
    uMsg.className = 'chat-msg user';
    uMsg.textContent = text;
    history.appendChild(uMsg);
    input.value = '';
    history.scrollTop = history.scrollHeight;

    // Add AI thinking indicator
    const thinking = document.createElement('div');
    thinking.className = 'chat-msg ai';
    thinking.textContent = 'Analyzing your portfolio...';
    thinking.id = 'ai-thinking-inline';
    history.appendChild(thinking);
    history.scrollTop = history.scrollHeight;

    // Call the main chat handler
    const apiKey = mainKey ? mainKey.value.trim() : '';
    if (!apiKey) {
        thinking.textContent = 'Please connect your Gemini API key above to activate AI responses.';
        return;
    }

    // Build context from engine memory
    const ctx = window.engineMemory || {};
    const sysPrompt = `You are Aarth Sutra — a warm, caring Indian personal finance guide. Speak simply like a knowledgeable friend. Use plain language, avoid jargon.

You ONLY help with: personal finance, savings, SIP, mutual funds, loans, debt freedom, insurance, basic Indian tax saving, retirement planning, and emotional support for money stress.

If asked anything else (sports, cooking, coding, health, politics, etc.) say: "I'm your money guide and I only help with finance and wealth 😊 Want to ask me something about your money?"

User's numbers — Net Worth ₹${ctx.netWorth || 0}, Monthly Income ₹${ctx.income || 0}, Monthly Expenses ₹${ctx.totalExp || 0}, Monthly Investment ₹${ctx.sip || 0}, Cash Available ₹${ctx.astCash || 0}, Portfolio growing at ${(ctx.blendedCAGR||12).toFixed(1)}%/yr, Health Insurance: ${ctx.hasMedIns ? 'Yes' : 'No ⚠️'}, Term Insurance: ${ctx.hasTermIns ? 'Yes' : 'No ⚠️'}.

Special commands — if the user asks to "download report", "get PDF", or "export Excel", reply with ONLY this raw JSON (no markdown):
{"action": "generatePDF"} or {"action": "generateExcel"}

For all other finance questions: 2–3 simple sentences, warm and encouraging, in plain Hindi-English. Use ₹ for amounts.`;

    try {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: sysPrompt + '\n\nUser: ' + text }] }] })
        });
        const data = await res.json();
        let reply = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || 'Could not get a response. Please check your API key.';

        // Handle report generation commands from inline chat too
        if (reply.startsWith('{') && reply.endsWith('}')) {
            try {
                const cmd = JSON.parse(reply);
                if (cmd.action === 'generatePDF') {
                    thinking.textContent = 'Opening your PDF report... Choose "Save as PDF" in the print dialog!';
                    setTimeout(generateWealthBlueprintPDF, 600);
                    return;
                } else if (cmd.action === 'generateExcel') {
                    thinking.textContent = 'Downloading your Excel sheet now! Open it in Excel or Google Sheets.';
                    setTimeout(generateExcelReport, 400);
                    return;
                }
            } catch(_) {}
        }
        thinking.textContent = reply;
    } catch(e) {
        thinking.textContent = 'Could not reach the AI right now. Please check your key and internet connection.';
    }
    thinking.id = '';
    history.scrollTop = history.scrollHeight;
}

// Enter key support for inline chat
document.addEventListener('DOMContentLoaded', () => {
    const inlineInput = document.getElementById('ai-inline-input');
    if (inlineInput) {
        inlineInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendInlineChat(); }
        });
    }
});

// ==================== AI TAB INTEGRATION ====================
async function handleSendTab() {
    const input = document.getElementById('chat-input-tab');
    const history = document.getElementById('chat-history-tab');
    const text = input.value.trim();
    if (!text) return;
    
    // Add user message
    const uMsg = document.createElement('div');
    uMsg.className = 'chat-msg user';
    uMsg.innerText = text;
    history.appendChild(uMsg);
    input.value = '';
    history.scrollTop = history.scrollHeight;

    // Call the master handleSend logic (redirected)
    // We'll reuse the handleSend function but target the history-tab
    const originalHistory = chatHistory;
    window.chatHistory = history; // Temporary override
    await handleSend(text);
    window.chatHistory = originalHistory;
}
