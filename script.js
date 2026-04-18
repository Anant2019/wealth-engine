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

// ══ GUARD LOADER STATE ══
let isComputing = false; // State: true while calculation runs, false when complete

// ══════════════════════════════════════════════════════════════════════════════
// INSURANCE COST ESTIMATOR
// Standard yearly insurance costs deducted from budget
// ══════════════════════════════════════════════════════════════════════════════

function estimateInsuranceCost(age = 30, income = 50000) {
    // Conservative estimates for India:
    // Term Life: ~₹40-50/month per ₹1Cr coverage (₹1Cr = 20x annual income)
    // Health: ~₹250-400/month for individual coverage

    const termLifeYearly = 500;  // ₹500/month × 12 = ₹6,000/year (₹50L coverage)
    const healthYearly = 3000;   // ₹250/month × 12 = ₹3,000/year (basic plan)

    return {
        termLifeYearly,
        healthYearly,
        totalYearly: termLifeYearly + healthYearly,
        monthlyDeduction: (termLifeYearly + healthYearly) / 12
    };
}

// ══════════════════════════════════════════════════════════════════════════════
// RISK PROFILING ENGINE
// Scores user on 4 questions → Conservative / Moderate / Aggressive / Very Aggressive
// Determines which asset classes are allowed for the user
// ══════════════════════════════════════════════════════════════════════════════

function getRiskProfile() {
    const numVal = id => { const el = document.getElementById(id); return el ? (parseInt(el.value) || 2) : 2; };
    const q1 = numVal('u-risk-q1'); // Market drop reaction
    const q2 = numVal('u-risk-q2'); // Experience level
    const q3 = numVal('u-risk-q3'); // Time horizon
    const q4 = numVal('u-risk-q4'); // Age factor

    const totalScore = q1 + q2 + q3 + q4; // Range: 4-16

    let profile = {};
    if (totalScore <= 6) {
        profile = {
            level: 'conservative',
            label: 'Conservative Investor',
            icon: '🛡️',
            score: totalScore,
            desc: 'Safety first. Stick to FDs, PPF, and Debt Mutual Funds. Avoid direct stocks and crypto.',
            maxEquityPct: 30,
            allowP2P: false,
            allowCrypto: false,
            allowSmallCap: false,
            allowMidCap: false,
            color: '#3B82F6'
        };
    } else if (totalScore <= 10) {
        profile = {
            level: 'moderate',
            label: 'Moderate Investor',
            icon: '⚖️',
            score: totalScore,
            desc: 'You can handle some ups and downs. Good for balanced mutual funds and index investing.',
            maxEquityPct: 60,
            allowP2P: false,
            allowCrypto: false,
            allowSmallCap: false,
            allowMidCap: true,
            color: '#A855F7'
        };
    } else if (totalScore <= 13) {
        profile = {
            level: 'aggressive',
            label: 'Aggressive Investor',
            icon: '🔥',
            score: totalScore,
            desc: 'You understand risk and can stomach volatility. Mid caps, small caps, and tactical bets are OK in moderation.',
            maxEquityPct: 80,
            allowP2P: true,
            allowCrypto: false,
            allowSmallCap: true,
            allowMidCap: true,
            color: '#F59E0B'
        };
    } else {
        profile = {
            level: 'very_aggressive',
            label: 'Very Aggressive Investor',
            icon: '🚀',
            score: totalScore,
            desc: 'Max growth mode. You understand derivatives, crypto volatility, and P2P default risk. Allocate carefully.',
            maxEquityPct: 90,
            allowP2P: true,
            allowCrypto: true,
            allowSmallCap: true,
            allowMidCap: true,
            color: '#EF4444'
        };
    }

    // Update the UI badge
    const iconEl = document.getElementById('risk-profile-icon');
    const labelEl = document.getElementById('risk-profile-label');
    const descEl = document.getElementById('risk-profile-desc');
    if (iconEl) iconEl.textContent = profile.icon;
    if (labelEl) { labelEl.textContent = profile.label; labelEl.style.color = profile.color; }
    if (descEl) descEl.textContent = profile.desc;

    return profile;
}

// Validate portfolio against risk profile — returns warnings for mismatched allocations
function validateRiskAllocation(riskProfile, totalAssets) {
    const warnings = [];
    let hasP2P = false, hasCrypto = false, hasSmallCap = false;
    let p2pValue = 0, cryptoValue = 0, smallCapValue = 0;

    document.querySelectorAll('.dy-account').forEach(r => {
        const type = r.querySelector('.a-t') ? r.querySelector('.a-t').value : '';
        const bal = parseFloat(r.querySelector('.a-p') ? r.querySelector('.a-p').value : 0) || 0;
        if (type === 'p2p') { hasP2P = true; p2pValue += bal; }
        if (type === 'crypto') { hasCrypto = true; cryptoValue += bal; }
        if (type === 'stocks_small') { hasSmallCap = true; smallCapValue += bal; }
    });

    if (hasP2P && !riskProfile.allowP2P) {
        const pct = totalAssets > 0 ? ((p2pValue / totalAssets) * 100).toFixed(1) : 0;
        warnings.push({
            icon: '🚨', severity: 'HIGH',
            title: `P2P Lending Not Suitable (${pct}% of portfolio)`,
            message: `Your risk profile is "${riskProfile.label}". P2P lending has NO collateral and high default risk. SEBI recommends this only for experienced investors. Move this ${formatCurrency(p2pValue)} to Debt Mutual Funds for similar returns with lower risk.`,
            color: '#EF4444'
        });
    }

    if (hasCrypto && !riskProfile.allowCrypto) {
        const pct = totalAssets > 0 ? ((cryptoValue / totalAssets) * 100).toFixed(1) : 0;
        warnings.push({
            icon: '⚠️', severity: 'HIGH',
            title: `Crypto Not Suitable for Your Profile (${pct}% of portfolio)`,
            message: `Crypto is extremely volatile (can drop 50%+ in weeks). Your "${riskProfile.label}" profile suggests you should not hold crypto. Also note: India taxes crypto gains at flat 30% + 1% TDS. Consider moving to SGBs (gold) for safer diversification.`,
            color: '#F59E0B'
        });
    }

    if (hasSmallCap && !riskProfile.allowSmallCap) {
        const pct = totalAssets > 0 ? ((smallCapValue / totalAssets) * 100).toFixed(1) : 0;
        warnings.push({
            icon: '📉', severity: 'MEDIUM',
            title: `Small Cap Funds May Be Too Risky (${pct}% of portfolio)`,
            message: `Small cap funds can drop 40-60% in bear markets. Your "${riskProfile.label}" profile suggests sticking to Large Cap Index Funds (Nifty 50) for equity exposure. These give 12% returns with much less volatility.`,
            color: '#D97706'
        });
    }

    // Check if total equity exceeds recommended % for profile
    let equityTotal = 0;
    document.querySelectorAll('.dy-account').forEach(r => {
        const type = r.querySelector('.a-t') ? r.querySelector('.a-t').value : '';
        const bal = parseFloat(r.querySelector('.a-p') ? r.querySelector('.a-p').value : 0) || 0;
        if (['mutual_fund', 'stocks_mid', 'stocks_small', 'stocks_in', 'stocks_us', 'etf', 'crypto', 'p2p'].includes(type)) {
            equityTotal += bal;
        }
    });

    if (totalAssets > 0) {
        const equityPct = (equityTotal / totalAssets) * 100;
        if (equityPct > riskProfile.maxEquityPct + 10) {
            warnings.push({
                icon: '📊', severity: 'MEDIUM',
                title: `Equity Overweight: ${equityPct.toFixed(0)}% vs recommended max ${riskProfile.maxEquityPct}%`,
                message: `For your "${riskProfile.label}" profile, SEBI guidelines suggest max ${riskProfile.maxEquityPct}% in equity. Consider moving ${formatCurrency(equityTotal - (totalAssets * riskProfile.maxEquityPct / 100))} to Debt MF or FD for balance.`,
                color: '#D97706'
            });
        }
    }

    return warnings;
}

// ══════════════════════════════════════════════════════════════════════════════
// TAX ALPHA ENGINE
// Identifies tax-saving opportunities based on portfolio composition
// Returns array of { icon, title, message, color } alert objects
// ══════════════════════════════════════════════════════════════════════════════

function generateTaxAlpha(totalAssets, astEq, astCash, income) {
    const alerts = [];

    // Section 80C: ELSS / PPF / EPF
    let hasPPF = false, hasEPF = false, hasELSS = false;
    let ppfValue = 0, epfValue = 0, elssValue = 0;
    document.querySelectorAll('.dy-account').forEach(r => {
        const type = r.querySelector('.a-t') ? r.querySelector('.a-t').value : '';
        const bal = parseFloat(r.querySelector('.a-p') ? r.querySelector('.a-p').value : 0) || 0;
        if (type === 'ppf') { hasPPF = true; ppfValue += bal; }
        if (type === 'epf') { hasEPF = true; epfValue += bal; }
        if (type === 'mutual_fund') { hasELSS = true; elssValue += bal; } // Proxy for ELSS
    });

    // 80C Alert
    if (!hasPPF && !hasEPF && income > 0) {
        alerts.push({
            icon: '🏛️',
            title: 'Section 80C: Save ₹46,800 in Tax',
            message: 'You may not be using your full ₹1.5L Section 80C deduction. Invest in PPF (safe, 7.1% tax-free), ELSS Mutual Funds (best returns), or top up EPF. This alone saves ₹46,800/year in tax at the 30% bracket.',
            color: '#10B981'
        });
    }

    // Long-Term Capital Gains alert for equity
    if (astEq > 100000) {
        alerts.push({
            icon: '📊',
            title: 'LTCG Harvest: Keep Equity Gains Under ₹1 Lakh/Year',
            message: `You have ${formatCurrency(astEq)} in equity. Gains up to ₹1 Lakh/year from equity are tax-free (LTCG exemption). If you book profits, plan your redemptions across financial years to minimize your 10% LTCG tax liability.`,
            color: '#6366F1'
        });
    }

    // NPS for additional 80CCD(1B) deduction
    let hasNPS = false;
    document.querySelectorAll('.dy-account').forEach(r => {
        const type = r.querySelector('.a-t') ? r.querySelector('.a-t').value : '';
        if (type === 'nps') hasNPS = true;
    });
    if (!hasNPS && income >= 50000) {
        alerts.push({
            icon: '🧾',
            title: 'NPS: Extra ₹15,600 Tax Savings via 80CCD(1B)',
            message: 'NPS (National Pension System) gives an additional ₹50,000 tax deduction over and above 80C. At the 30% bracket, this saves ₹15,600 extra per year. Open an NPS account at any bank or online at enps.nsdl.com.',
            color: '#F59E0B'
        });
    }

    // FD interest tax alert
    if (astCash > 500000) {
        alerts.push({
            icon: '🏦',
            title: 'FD Interest is Fully Taxable — Consider Debt MFs',
            message: `Your savings/FD balance of ${formatCurrency(astCash)} earns interest that is added to your income and taxed at your slab rate (up to 30%). Debt Mutual Funds held 3+ years are taxed at 20% with indexation benefit — a significant saving. Consider moving some to Debt MFs.`,
            color: '#EF4444'
        });
    }

    return alerts;
}

// ══════════════════════════════════════════════════════════════════════════════
// REBALANCING ENGINE
// Compares current allocation vs target for risk profile
// Returns { recommendations, assetBreakdown, targets }
// ══════════════════════════════════════════════════════════════════════════════

function generateRebalancingPlan(riskProfile, totalAssets) {
    const recommendations = [];

    // Build asset breakdown by risk category
    let safe = 0, moderate = 0, aggressive = 0, speculative = 0;
    document.querySelectorAll('.dy-account').forEach(r => {
        const type = r.querySelector('.a-t') ? r.querySelector('.a-t').value : '';
        const bal = parseFloat(r.querySelector('.a-p') ? r.querySelector('.a-p').value : 0) || 0;
        if (['savings', 'fd', 'rd', 'po_schemes', 'ppf', 'epf', 'nps', 'endowment'].includes(type)) safe += bal;
        else if (['mutual_debt', 'corp_bonds', 'sgb', 'gold_physical', 'mutual_fund'].includes(type)) moderate += bal;
        else if (['stocks_in', 'stocks_us', 'etf', 'reit', 'stocks_mid'].includes(type)) aggressive += bal;
        else if (['stocks_small', 'crypto', 'p2p', 'ulip'].includes(type)) speculative += bal;
    });

    const assetBreakdown = { safe, moderate, aggressive, speculative };

    // Target allocations by risk profile
    const targetMap = {
        conservative:    { safe: 60, moderate: 30, aggressive: 10, speculative: 0 },
        moderate:        { safe: 40, moderate: 30, aggressive: 25, speculative: 5 },
        aggressive:      { safe: 20, moderate: 25, aggressive: 40, speculative: 15 },
        very_aggressive: { safe: 10, moderate: 15, aggressive: 45, speculative: 30 }
    };
    const targets = targetMap[riskProfile.level] || targetMap.moderate;

    if (totalAssets === 0) return { recommendations, assetBreakdown, targets };

    // Compare current vs target and generate recommendations
    const safePct        = (safe / totalAssets) * 100;
    const moderatePct    = (moderate / totalAssets) * 100;
    const aggressivePct  = (aggressive / totalAssets) * 100;
    const speculativePct = (speculative / totalAssets) * 100;

    if (safePct > targets.safe + 15) {
        const excess = safe - (totalAssets * targets.safe / 100);
        recommendations.push({
            icon: '🔄',
            title: `Too Much in Safe Assets (${safePct.toFixed(0)}% vs target ${targets.safe}%)`,
            message: `You have ${formatCurrency(excess)} more in FDs/savings than your risk profile recommends. This is costing you returns. Consider moving some to Nifty 50 Index Funds for better long-term growth.`,
            color: '#3B82F6',
            action: `Move ${formatCurrency(Math.min(excess, 50000))} to a Nifty 50 Index Fund SIP`
        });
    }

    if (safePct < targets.safe - 15) {
        const deficit = (totalAssets * targets.safe / 100) - safe;
        recommendations.push({
            icon: '🛡️',
            title: `Insufficient Safety Net (${safePct.toFixed(0)}% vs target ${targets.safe}%)`,
            message: `Your safe assets are below your risk profile's minimum recommendation. Build up your FD and liquid savings before increasing equity exposure. This protects you during market downturns.`,
            color: '#EF4444',
            action: `Move ${formatCurrency(Math.min(deficit, 100000))} to an FD or Liquid Mutual Fund`
        });
    }

    if (speculativePct > targets.speculative + 10) {
        const excess = speculative - (totalAssets * targets.speculative / 100);
        recommendations.push({
            icon: '⚠️',
            title: `High Speculative Exposure (${speculativePct.toFixed(0)}% vs target ${targets.speculative}%)`,
            message: `Your "${riskProfile.label}" profile recommends max ${targets.speculative}% in speculative assets (crypto, small cap, P2P). You currently have ${speculativePct.toFixed(0)}%. Consider trimming ${formatCurrency(excess)} to reduce volatility risk.`,
            color: '#F59E0B',
            action: `Reduce speculative assets by ${formatCurrency(excess)}`
        });
    }

    if (recommendations.length === 0 && totalAssets > 0) {
        recommendations.push({
            icon: '✅',
            title: 'Portfolio is Well-Balanced',
            message: `Your current allocation is aligned with your "${riskProfile.label}" risk profile. Continue your SIPs and review again when your portfolio grows by 20% or your life situation changes.`,
            color: '#10B981',
            action: null
        });
    }

    return { recommendations, assetBreakdown, targets };
}

// ══════════════════════════════════════════════════════════════════════════════
// SMART GOAL ALLOCATION ENGINE
// Splits investment across FD, Bonds, MF, Equity based on timeline
// WITHOUT damaging corpus — smarter returns with appropriate risk
// ══════════════════════════════════════════════════════════════════════════════

function getSmartGoalAllocation(yearsUntilGoal) {
    // Returns optimal allocation based on timeline
    // Goal: Maximize returns while keeping risk appropriate for timeline

    let allocation = {};

    if (yearsUntilGoal <= 0.5) {
        // ┌─ EMERGENCY GOAL (< 6 months) ─────────────────────────────┐
        // 100% FD — completely safe, no market risk
        allocation = {
            fd:      { pct: 100, rate: 7.0,  label: 'Fixed Deposit (FD)' },
            debt:    { pct: 0,   rate: 7.5,  label: 'Debt Mutual Funds' },
            balanced:{ pct: 0,   rate: 9.0,  label: 'Balanced Funds' },
            equity:  { pct: 0,   rate: 12.0, label: 'Nifty 50 / Mid Cap' },
            blended: 7.0
        };
    } else if (yearsUntilGoal <= 1) {
        // ┌─ SHORT TERM (6mo - 1yr) ──────────────────────────────────┐
        // 80% FD + 20% Debt MF — very safe, slight return boost
        allocation = {
            fd:      { pct: 80,  rate: 7.0,  label: 'Fixed Deposit (FD)' },
            debt:    { pct: 20,  rate: 7.5,  label: 'Debt Mutual Funds' },
            balanced:{ pct: 0,   rate: 9.0,  label: 'Balanced Funds' },
            equity:  { pct: 0,   rate: 12.0, label: 'Nifty 50 / Mid Cap' },
            blended: (0.80 * 7.0) + (0.20 * 7.5)  // 7.1%
        };
    } else if (yearsUntilGoal <= 2) {
        // ┌─ MEDIUM SHORT TERM (1-2yr) ───────────────────────────────┐
        // 60% FD + 30% Debt MF + 10% Balanced — safe with better growth
        allocation = {
            fd:      { pct: 60,  rate: 7.0,  label: 'Fixed Deposit (FD)' },
            debt:    { pct: 30,  rate: 7.5,  label: 'Debt Mutual Funds' },
            balanced:{ pct: 10,  rate: 9.0,  label: 'Balanced Funds' },
            equity:  { pct: 0,   rate: 12.0, label: 'Nifty 50 / Mid Cap' },
            blended: (0.60 * 7.0) + (0.30 * 7.5) + (0.10 * 9.0)  // 7.35%
        };
    } else if (yearsUntilGoal <= 3) {
        // ┌─ MEDIUM TERM (2-3yr) ─────────────────────────────────────┐
        // 45% FD + 35% Debt MF + 15% Balanced + 5% Equity
        allocation = {
            fd:      { pct: 45,  rate: 7.0,  label: 'Fixed Deposit (FD)' },
            debt:    { pct: 35,  rate: 7.5,  label: 'Debt Mutual Funds' },
            balanced:{ pct: 15,  rate: 9.0,  label: 'Balanced Funds' },
            equity:  { pct: 5,   rate: 12.0, label: 'Nifty 50 / Mid Cap' },
            blended: (0.45 * 7.0) + (0.35 * 7.5) + (0.15 * 9.0) + (0.05 * 12.0)  // 7.775%
        };
    } else if (yearsUntilGoal <= 5) {
        // ┌─ MEDIUM-LONG TERM (3-5yr) ────────────────────────────────┐
        // 35% FD + 30% Debt MF + 20% Balanced + 15% Equity
        allocation = {
            fd:      { pct: 35,  rate: 7.0,  label: 'Fixed Deposit (FD)' },
            debt:    { pct: 30,  rate: 7.5,  label: 'Debt Mutual Funds' },
            balanced:{ pct: 20,  rate: 9.0,  label: 'Balanced Funds' },
            equity:  { pct: 15,  rate: 12.0, label: 'Nifty 50 / Mid Cap' },
            blended: (0.35 * 7.0) + (0.30 * 7.5) + (0.20 * 9.0) + (0.15 * 12.0)  // 8.375%
        };
    } else {
        // ┌─ LONG TERM (5yr+) ────────────────────────────────────────┐
        // 20% FD + 20% Debt MF + 20% Balanced + 40% Equity — aggressive growth
        allocation = {
            fd:      { pct: 20,  rate: 7.0,  label: 'Fixed Deposit (FD)' },
            debt:    { pct: 20,  rate: 7.5,  label: 'Debt Mutual Funds' },
            balanced:{ pct: 20,  rate: 9.0,  label: 'Balanced Funds' },
            equity:  { pct: 40,  rate: 12.0, label: 'Nifty 50 / Mid Cap' },
            blended: (0.20 * 7.0) + (0.20 * 7.5) + (0.20 * 9.0) + (0.40 * 12.0)  // 9.8%
        };
    }

    return allocation;
}

// ══════════════════════════════════════════════════════════════════════════════
// DETERMINISTIC FINANCIAL HIERARCHY VALIDATOR
// Enforces: Safety Net → Insurance → Investments (in strict order)
// ══════════════════════════════════════════════════════════════════════════════

function validateFinancialHierarchy(income, totalExp, hasMedIns, hasTermIns, astCash, totalEMI, sip) {
    const alerts = [];
    let isBlockedFromInvesting = false;

    // ┌─ STEP 1: INSURANCE MANDATE CHECK ─────────────────────────────────────┐
    // If user has NO insurance, BLOCK all investments until they buy it
    if (!hasMedIns || !hasTermIns) {
        isBlockedFromInvesting = true;
        const missing = [];
        if (!hasTermIns) missing.push('Term Life Insurance');
        if (!hasMedIns) missing.push('Health Insurance');

        alerts.push({
            level: 'CRITICAL',
            icon: '🛡️',
            title: 'Insurance Shield Broken',
            message: `Your family is unprotected. You must buy ${missing.join(' & ')} before investing. Visit PolicyBazaar.com immediately.`,
            color: '#EF4444'
        });
    }

    // ┌─ STEP 2: EMERGENCY FUND (FD SHIELD) MANDATE ──────────────────────────┐
    // User MUST have 6 months of SALARY in liquid savings (FD, Savings, RD)
    // This is the safety net that protects against job loss
    const emFundRequired = income * 6;  // 6 months of SALARY
    const emFundGap = Math.max(0, emFundRequired - astCash);

    if (emFundGap > 0) {
        isBlockedFromInvesting = true;
        const monthsComplete = astCash > 0 ? (astCash / totalExp).toFixed(1) : 0;

        alerts.push({
            level: 'CRITICAL',
            icon: '🏦',
            title: 'Safety Net Incomplete',
            message: `You have ${monthsComplete}/6 months of emergency funds. Complete your safety net first (need ₹${formatCurrency(emFundGap)} more). Your family depends on this.`,
            color: '#D97706',
            progressCurrent: astCash,
            progressTarget: emFundRequired
        });
    }

    // ┌─ STEP 3: SURPLUS VALIDATION ──────────────────────────────────────────┐
    // Monthly surplus = Salary - Expenses - EMI
    // Can't invest more than we earn
    const monthlySurplus = income - totalExp - totalEMI;

    if (monthlySurplus <= 0) {
        isBlockedFromInvesting = true;
        const insEstimate = estimateInsuranceCost();
        alerts.push({
            level: 'CRITICAL',
            icon: '⚠️',
            title: 'Negative Cash Flow',
            message: `Your expenses (${formatCurrency(totalExp)}) + EMI (${formatCurrency(totalEMI)}) + Insurance (${formatCurrency(insEstimate.monthlyDeduction)}) exceed your income (${formatCurrency(income)}). You're going backwards. Cut expenses or increase income first.`,
            color: '#DC2626'
        });
    } else if (sip > monthlySurplus) {
        // ┌─ RED FLAG: Investment exceeds surplus ────────────────────────┐
        alerts.push({
            level: 'WARNING',
            icon: '🚨',
            title: 'Caution: Over-Investment',
            message: `You're planning to invest ₹${formatCurrency(sip)}/month but your surplus is only ₹${formatCurrency(monthlySurplus)}. Adjust to ₹${formatCurrency(Math.floor(monthlySurplus * 0.8))} to stay debt-free.`,
            color: '#F59E0B'
        });
    }

    return {
        isBlockedFromInvesting,
        alerts,
        monthlySurplus,
        emFundRequired,
        emFundGap
    };
}

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

// ==================== LOCAL STORAGE PERSISTENCE ====================
// Save all user input to browser storage so they don't have to re-enter

function saveAllData() {
    const userData = {};

    // Personal info
    userData.name = document.getElementById('u-name')?.value || '';
    userData.age = document.getElementById('u-age')?.value || '';
    userData.income = document.getElementById('u-income')?.value || '';
    userData.sip = document.getElementById('u-sip')?.value || '';
    userData.stepup = document.getElementById('u-stepup')?.value || '10';

    // Expenses
    userData.rent = document.getElementById('u-rent')?.value || '';
    userData.groceries = document.getElementById('u-groceries')?.value || '';
    userData.cc = document.getElementById('u-cc')?.value || '';
    userData.life = document.getElementById('u-life')?.value || '';

    // Insurance
    userData.med = document.getElementById('u-med')?.value || 'yes';
    userData.term = document.getElementById('u-term')?.value || 'yes';

    // Risk Profile
    userData.riskQ1 = document.getElementById('u-risk-q1')?.value || '3';
    userData.riskQ2 = document.getElementById('u-risk-q2')?.value || '2';
    userData.riskQ3 = document.getElementById('u-risk-q3')?.value || '3';
    userData.riskQ4 = document.getElementById('u-risk-q4')?.value || '3';

    // Accounts (Assets)
    const accounts = [];
    document.querySelectorAll('.dy-account').forEach(row => {
        accounts.push({
            type: row.querySelector('.a-t')?.value || '',
            name: row.querySelector('.a-n')?.value || '',
            value: row.querySelector('.a-p')?.value || '',
            rate: row.querySelector('.a-r')?.value || ''
        });
    });
    userData.accounts = accounts;

    // Debts
    const debts = [];
    document.querySelectorAll('.dy-debt').forEach(row => {
        debts.push({
            name: row.querySelector('.d-n')?.value || '',
            principal: row.querySelector('.d-p')?.value || '',
            rate: row.querySelector('.d-r')?.value || '',
            emi: row.querySelector('.d-e')?.value || ''
        });
    });
    userData.debts = debts;

    // Goals
    const goals = [];
    document.querySelectorAll('.dy-goal').forEach(row => {
        goals.push({
            name: row.querySelector('.g-name')?.value || '',
            target: row.querySelector('.g-tgt')?.value || '',
            years: row.querySelector('.g-yrs')?.value || ''
        });
    });
    userData.goals = goals;

    // Save to localStorage
    localStorage.setItem('aarthSutraData', JSON.stringify(userData));
    showSuccessToast('✅ Your data saved! You can close the app anytime.', '💾');
}

// Silent version — same save, no toast. Used for background auto-save on input.
function saveAllDataSilent() {
    const userData = {};
    userData.name = document.getElementById('u-name')?.value || '';
    userData.age = document.getElementById('u-age')?.value || '';
    userData.income = document.getElementById('u-income')?.value || '';
    userData.sip = document.getElementById('u-sip')?.value || '';
    userData.stepup = document.getElementById('u-stepup')?.value || '10';
    userData.rent = document.getElementById('u-rent')?.value || '';
    userData.groceries = document.getElementById('u-groceries')?.value || '';
    userData.cc = document.getElementById('u-cc')?.value || '';
    userData.life = document.getElementById('u-life')?.value || '';
    userData.med = document.getElementById('u-med')?.value || 'yes';
    userData.term = document.getElementById('u-term')?.value || 'yes';
    userData.riskQ1 = document.getElementById('u-risk-q1')?.value || '3';
    userData.riskQ2 = document.getElementById('u-risk-q2')?.value || '2';
    userData.riskQ3 = document.getElementById('u-risk-q3')?.value || '3';
    userData.riskQ4 = document.getElementById('u-risk-q4')?.value || '3';
    const accounts = [];
    document.querySelectorAll('.dy-account').forEach(row => {
        accounts.push({ type: row.querySelector('.a-t')?.value || '', name: row.querySelector('.a-n')?.value || '', value: row.querySelector('.a-p')?.value || '', rate: row.querySelector('.a-r')?.value || '' });
    });
    userData.accounts = accounts;
    const debts = [];
    document.querySelectorAll('.dy-debt').forEach(row => {
        debts.push({ name: row.querySelector('.d-n')?.value || '', principal: row.querySelector('.d-p')?.value || '', rate: row.querySelector('.d-r')?.value || '', emi: row.querySelector('.d-e')?.value || '' });
    });
    userData.debts = debts;
    const goals = [];
    document.querySelectorAll('.dy-goal').forEach(row => {
        goals.push({ name: row.querySelector('.g-name')?.value || '', target: row.querySelector('.g-tgt')?.value || '', years: row.querySelector('.g-yrs')?.value || '' });
    });
    userData.goals = goals;
    try { localStorage.setItem('aarthSutraData', JSON.stringify(userData)); } catch(e) {}
}

function loadAllData() {
    const saved = localStorage.getItem('aarthSutraData');

    // Prevent auto-save from firing while we're programmatically populating fields
    window._isLoadingData = true;

    if (!saved) {
        // No saved data — add default portfolio rows so the page isn't empty
        setupDefaultPortfolio();
        const gc = document.getElementById('goal-container');
        if (gc && gc.children.length === 0) addGoal();
        const dc = document.getElementById('debt-container');
        if (dc && dc.children.length === 0) addDebt();
        window._isLoadingData = false;
        return;
    }

    try {
        const userData = JSON.parse(saved);

        // Load personal info
        if (userData.name) document.getElementById('u-name').value = userData.name;
        if (userData.age) document.getElementById('u-age').value = userData.age;
        if (userData.income) document.getElementById('u-income').value = userData.income;
        if (userData.sip) document.getElementById('u-sip').value = userData.sip;
        if (userData.stepup) document.getElementById('u-stepup').value = userData.stepup;

        // Load expenses
        if (userData.rent) document.getElementById('u-rent').value = userData.rent;
        if (userData.groceries) document.getElementById('u-groceries').value = userData.groceries;
        if (userData.cc) document.getElementById('u-cc').value = userData.cc;
        if (userData.life) document.getElementById('u-life').value = userData.life;

        // Load insurance
        document.getElementById('u-med').value = userData.med || 'yes';
        document.getElementById('u-term').value = userData.term || 'yes';

        // Load risk profile
        if (userData.riskQ1) document.getElementById('u-risk-q1').value = userData.riskQ1;
        if (userData.riskQ2) document.getElementById('u-risk-q2').value = userData.riskQ2;
        if (userData.riskQ3) document.getElementById('u-risk-q3').value = userData.riskQ3;
        if (userData.riskQ4) document.getElementById('u-risk-q4').value = userData.riskQ4;

        // Load accounts — use hasOwnProperty so that a saved empty array (user deleted all)
        // is respected instead of falling back to defaults
        const accountContainer = document.getElementById('account-container');
        if (userData.hasOwnProperty('accounts')) {
            accountContainer.innerHTML = '';
            userData.accounts.forEach(acc => {
                addAccount(acc.type, acc.name, parseFloat(acc.value) || 0, parseFloat(acc.rate) || null);
            });
            // If user deliberately has 0 assets saved, leave it empty (respect their choice)
        } else {
            // Old save format without accounts key — add defaults
            setupDefaultPortfolio();
        }

        // Load debts — use lastElementChild (skips text nodes) instead of lastChild
        const debtContainer = document.getElementById('debt-container');
        if (userData.hasOwnProperty('debts')) {
            debtContainer.innerHTML = '';
            userData.debts.forEach(debt => {
                addDebt();
                const lastDebtRow = debtContainer.lastElementChild;
                if (lastDebtRow) {
                    lastDebtRow.querySelector('.d-n').value = debt.name || '';
                    lastDebtRow.querySelector('.d-p').value = debt.principal || '';
                    lastDebtRow.querySelector('.d-r').value = debt.rate || '';
                    lastDebtRow.querySelector('.d-e').value = debt.emi || '';
                }
            });
            if (userData.debts.length === 0) addDebt(); // always show at least one empty row
        } else {
            addDebt();
        }

        // Load goals — use lastElementChild (skips text nodes) instead of lastChild
        const goalContainer = document.getElementById('goal-container');
        if (userData.hasOwnProperty('goals')) {
            goalContainer.innerHTML = '';
            userData.goals.forEach(goal => {
                addGoal();
                const lastGoalRow = goalContainer.lastElementChild;
                if (lastGoalRow) {
                    lastGoalRow.querySelector('.g-name').value = goal.name || '';
                    lastGoalRow.querySelector('.g-tgt').value = goal.target || '';
                    lastGoalRow.querySelector('.g-yrs').value = goal.years || '';
                }
            });
            if (userData.goals.length === 0) addGoal(); // always show at least one empty row
        } else {
            addGoal();
        }

        // No toast on load — silently restoring data is the expected behaviour
        updateInsuranceImpact();
    } catch(e) {
        console.error('Error loading data:', e);
        // On parse failure fall back to defaults so the page isn't blank
        setupDefaultPortfolio();
        const gc = document.getElementById('goal-container');
        if (gc && gc.children.length === 0) addGoal();
        const dc = document.getElementById('debt-container');
        if (dc && dc.children.length === 0) addDebt();
    } finally {
        window._isLoadingData = false;
    }
}

function clearAllData() {
    if (confirm('⚠️ Are you sure? This will delete all your saved data. This cannot be undone.')) {
        localStorage.removeItem('aarthSutraData');
        location.reload();
    }
}

// ==================== SAVE PROMPT & VANISH ====================

// Called when user clicks "Compute My Wealth Blueprint"
function promptSaveAndCompute() {
    // Reset stuck isComputing guard (can get stuck if page was force-refreshed mid-compute)
    isComputing = false;

    // Hide the compute backdrop in case it was stuck from a previous run
    const backdrop = document.getElementById('compute-backdrop');
    if (backdrop) backdrop.classList.add('hidden');

    // Restore button state in case it was stuck
    const ctaDefault = document.querySelector('.cta-default');
    const ctaLoading = document.querySelector('.cta-loading');
    if (ctaDefault) ctaDefault.style.display = 'flex';
    if (ctaLoading) ctaLoading.style.display = 'none';

    const overlay = document.getElementById('save-prompt-overlay');
    if (overlay) {
        overlay.style.display = 'flex';
    } else {
        // Fallback if modal not found
        calculateStrategy();
    }
}

function closeSavePrompt() {
    const overlay = document.getElementById('save-prompt-overlay');
    if (overlay) overlay.style.display = 'none';
}

function saveAndCompute() {
    closeSavePrompt();
    saveAllData();
    calculateStrategy();
}

function computeWithoutSaving() {
    closeSavePrompt();
    calculateStrategy();
}

// Vanish: wipes every localStorage key this app uses, then reloads fresh
function vanishAllData() {
    if (!confirm('🔥 This will permanently erase all your data on this device. Are you absolutely sure?')) return;
    ['aarthSutraData', 'aarth_user_name', 'aarth_api_key', 'aarth_visited', 'aarth_active_tab'].forEach(k => {
        try { localStorage.removeItem(k); } catch(e) {}
    });
    showSuccessToast('Your data has vanished. Starting fresh.', '🌫️');
    setTimeout(() => location.reload(), 1200);
}

// ==================== FORM VALIDATION ====================
function validateForm() {
    const errors = [];
    const errorFields = [];

    // Clear all previous error states
    document.querySelectorAll('.form-group.error').forEach(fg => fg.classList.remove('error'));

    // Required fields - Step 1
    const nameField = document.getElementById('u-name');
    const ageField = document.getElementById('u-age');
    if (!nameField || !nameField.value.trim()) {
        errors.push({ field: 'u-name', label: 'Your Name', step: 1 });
        errorFields.push('u-name');
    }
    if (!ageField || !ageField.value) {
        errors.push({ field: 'u-age', label: 'Your Current Age', step: 1 });
        errorFields.push('u-age');
    }

    // Required fields - Step 2
    const incomeField = document.getElementById('u-income');
    const sipField = document.getElementById('u-sip');
    if (!incomeField || !incomeField.value) {
        errors.push({ field: 'u-income', label: 'Monthly In-Hand Income', step: 2 });
        errorFields.push('u-income');
    }

    // Required fields - Step 3
    const rentField = document.getElementById('u-rent');
    const groceriesField = document.getElementById('u-groceries');
    const ccField = document.getElementById('u-cc');
    const lifeField = document.getElementById('u-life');
    if (!rentField || !rentField.value) {
        errors.push({ field: 'u-rent', label: 'Rent & Utilities', step: 3 });
        errorFields.push('u-rent');
    }
    if (!groceriesField || !groceriesField.value) {
        errors.push({ field: 'u-groceries', label: 'Food & Essentials', step: 3 });
        errorFields.push('u-groceries');
    }
    if (!ccField || !ccField.value) {
        errors.push({ field: 'u-cc', label: 'Existing EMIs & Bills', step: 3 });
        errorFields.push('u-cc');
    }
    if (!lifeField || !lifeField.value) {
        errors.push({ field: 'u-life', label: 'Lifestyle & Entertainment', step: 3 });
        errorFields.push('u-life');
    }

    // Required fields - Step 4 (Insurance)
    const medField = document.getElementById('u-med');
    const termField = document.getElementById('u-term');
    if (!medField || !medField.value) {
        errors.push({ field: 'u-med', label: 'Health Insurance', step: 4 });
        errorFields.push('u-med');
    }
    if (!termField || !termField.value) {
        errors.push({ field: 'u-term', label: 'Term Life Insurance', step: 4 });
        errorFields.push('u-term');
    }

    // Add error class to all error fields
    errorFields.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (field) {
            const fg = field.closest('.form-group');
            if (fg) fg.classList.add('error');
        }
    });

    // Display error container
    const errorContainer = document.getElementById('validation-error-container');
    const errorList = document.getElementById('validation-error-list');

    if (errors.length > 0) {
        if (errorList) {
            errorList.innerHTML = errors.map(err => `
                <li>
                    <strong>Step ${err.step}:</strong> ${err.label}
                    <button type="button" onclick="document.getElementById('${err.field}').focus(); document.getElementById('${err.field}').scrollIntoView({behavior: 'smooth', block: 'center'});">
                        Go to field →
                    </button>
                </li>
            `).join('');
        }

        if (errorContainer) {
            errorContainer.classList.add('show');
            // Scroll to error container
            errorContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }

        return false;
    } else {
        if (errorContainer) {
            errorContainer.classList.remove('show');
        }
        return true;
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

    // Always make sure the save prompt is hidden on load (browser may restore DOM state)
    const savePrompt = document.getElementById('save-prompt-overlay');
    if (savePrompt) savePrompt.style.display = 'none';

    if (typeof lucide !== 'undefined') lucide.createIcons();
    const wmo = document.getElementById('withdraw-modal-overlay');
    if (wmo) wmo.addEventListener('click', function(e){ if(e.target === this) closeWithdrawModal(); });
    const pmo = document.getElementById('pillar-modal-overlay');
    if (pmo) pmo.addEventListener('click', function(e){ if(e.target === this) closePillarModal(e); });

    // Welcome modal — check if first visit
    checkFirstVisit();

    // Wire debt total updates
    document.addEventListener('input', function(e) {
        if (e.target.classList.contains('d-p')) updateDebtTotal();
    });

    // Silent auto-save on every input (no toast) — keeps data safe across refreshes.
    let autoSaveTimer;
    document.addEventListener('input', function(e) {
        if (window._isLoadingData) return;
        clearTimeout(autoSaveTimer);
        autoSaveTimer = setTimeout(saveAllDataSilent, 1500);
    });

    // Save immediately before the page unloads (refresh/close/navigate away).
    // Doing this WITHOUT calling preventDefault so the browser shows NO confirmation dialog.
    window.addEventListener('beforeunload', function() {
        saveAllDataSilent();
    });

    // Load saved data first — defaults are only added if nothing was saved
    loadAllData();

    // Initial insurance display
    updateInsuranceImpact();

    // Update profile topbar initial whenever name field changes
    const nameField = document.getElementById('u-name');
    if (nameField) {
        nameField.addEventListener('input', refreshProfileTopbar);
    }
    refreshProfileTopbar(); // run once on load

    // Restore last active tab
    const lastTab = (() => { try { return localStorage.getItem('aarth_active_tab') || 'intake'; } catch(e) { return 'intake'; } })();

    // Run initial calculation in silent mode (no tab switch), then restore tab
    const welcomeOverlay = document.getElementById('welcome-overlay');
    if (!welcomeOverlay || welcomeOverlay.classList.contains('hidden')) {
        setTimeout(() => {
            calculateStrategy(true); // silentMode = don't switch to dash
            switchTab(lastTab);      // restore the tab user was on before refresh
            refreshProfileTopbar();  // ensure initial is correct after data load
        }, 200);
    }
});

/** Refresh the profile avatar in the topbar.
 *  Name saved → coloured circle with initial, no icon.
 *  No name    → hide circle, show user-circle icon. */
function refreshProfileTopbar() {
    const initialEl = document.getElementById('profile-topbar-initial');
    const iconEl    = document.querySelector('#profile-topbar-btn [data-lucide]');
    if (!initialEl) return;

    // Pull name from input OR from saved localStorage
    let name = (document.getElementById('u-name')?.value || '').trim();
    if (!name) {
        try {
            const saved = JSON.parse(localStorage.getItem('aarthSutraData') || '{}');
            name = (saved.name || '').trim();
        } catch(e) {}
    }

    if (name) {
        // Show coloured initial circle
        initialEl.textContent = name[0].toUpperCase();
        initialEl.style.display = 'flex';
        if (iconEl) iconEl.style.display = 'none';
    } else {
        // Show plain icon, hide circle
        initialEl.style.display = 'none';
        if (iconEl) iconEl.style.display = '';
    }
}

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
// ══════════════════════════════════════════════════════════════════════════════
// INSURANCE SHIELD STATUS INDICATOR
// Shows visual feedback whether family is protected (Gold) or at risk (Broken)
// ══════════════════════════════════════════════════════════════════════════════
function updateInsuranceShield(hasTerm, hasMed) {
    const card = document.getElementById('insurance-shield-card');
    const icon = document.getElementById('shield-icon');
    const title = document.getElementById('shield-title');
    const status = document.getElementById('shield-status');

    if (!card || !icon || !title || !status) return;

    if (hasTerm && hasMed) {
        // ── PROTECTED: Gold shield ──
        card.style.borderLeftColor = '#FBBF24';
        icon.textContent = '🛡️✨';
        title.textContent = 'Insurance Shield: Active';
        title.style.color = '#FBBF24';
        status.innerHTML = '✅ Your family is protected. You can invest with peace of mind. Continue building wealth!';
        status.style.color = '#D4AF37';
    } else {
        // ── AT RISK: Broken shield ──
        card.style.borderLeftColor = '#EF4444';
        icon.textContent = '🛡️💔';
        title.textContent = 'Insurance Shield: Broken';
        title.style.color = '#EF4444';

        const missing = [];
        if (!hasTerm) missing.push('Term Life Insurance');
        if (!hasMed) missing.push('Health Insurance');

        status.innerHTML = `⚠️ Missing: ${missing.join(' & ')}. <br>Your family is unprotected. Visit <strong>PolicyBazaar.com</strong> and buy insurance immediately before investing a single rupee.`;
        status.style.color = '#FCA5A5';
    }
}

function updateWealthWeather(hasBadDebt, isShortfall, hasIdleCash) {
    const banner = document.getElementById('weather-banner');
    if (!banner) return;
    const text = document.getElementById('regime-text');
    if (!text) return;
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
    try {
    sipVal = Number(sipVal);
    const dispEl = document.getElementById('fi-slider-display');
    if (dispEl) dispEl.innerText = formatCurrency(sipVal) + ' / month';

    const ageRaw = document.getElementById('u-age') ? document.getElementById('u-age').value : 28;
    const age = Number(ageRaw) || 28;

    // Use liquid corpus base (already computed by engine), not raw totalAssets
    const corpusStart = engineMemory.fiCorpusBase || engineMemory.totalAssets || 0;
    const monthlyExp  = engineMemory.totalExp || 50000;
    const fiTarget    = monthlyExp * 12 * 25; // 25x rule

    // Use the user's actual blended portfolio CAGR, not hardcoded 12%
    const annualRate  = (engineMemory.blendedCAGR || 12) / 100;
    const monthlyRate = annualRate / 12;

    // Apply annual step-up if the user selected one
    const stepUpPct = (engineMemory.stepUpPercent || 0) / 100;

    let corpus     = corpusStart;
    let currentSIP = sipVal;
    let months     = 0;

    for (months = 0; months < 1200; months++) {
        // Step up SIP at the start of each new year (month 12, 24, 36 …)
        if (months > 0 && months % 12 === 0 && stepUpPct > 0) {
            currentSIP = currentSIP * (1 + stepUpPct);
        }
        corpus = corpus * (1 + monthlyRate) + currentSIP;
        if (corpus >= fiTarget) break;
    }

    const fiYear = new Date().getFullYear() + Math.floor(months / 12);
    const fiAge  = age + Math.floor(months / 12);
    const fiDateEl  = document.getElementById('fi-date');
    const fiInsight = document.getElementById('fi-insight');

    const rateLabel   = (engineMemory.blendedCAGR || 12).toFixed(1) + '% CAGR';
    const stepUpLabel = stepUpPct > 0 ? ` + ${engineMemory.stepUpPercent}% step-up/yr` : '';
    const gapAmt      = Math.max(0, fiTarget - corpusStart);

    // Populate the three stat pills
    const corpusPillEl = document.getElementById('fi-corpus-val');
    const targetPillEl = document.getElementById('fi-target-val');
    const gapPillEl    = document.getElementById('fi-gap-val');
    if (corpusPillEl) corpusPillEl.textContent = corpusStart > 0 ? formatCurrency(corpusStart) : '₹0 (add portfolio)';
    if (targetPillEl) targetPillEl.textContent = formatCurrency(fiTarget);
    if (gapPillEl)    gapPillEl.textContent    = gapAmt > 0 ? formatCurrency(gapAmt) : '✅ Already there!';

    if (months >= 1199) {
        if (fiDateEl) { fiDateEl.textContent = 'Needs higher SIP'; fiDateEl.style.color = '#ef4444'; }
        if (fiInsight) fiInsight.innerHTML = `At <strong>${rateLabel}${stepUpLabel}</strong>, this SIP won't reach the FI target in time. Try increasing your monthly investment.`;
    } else {
        if (fiDateEl) { fiDateEl.textContent = fiYear + ' (Age ' + fiAge + ')'; fiDateEl.style.color = '#34d399'; }
        if (fiInsight) fiInsight.innerHTML =
            `<strong>${formatCurrency(sipVal)}/mo</strong>${stepUpLabel} at <strong>${rateLabel}</strong> ` +
            `for <strong>${(months / 12).toFixed(1)} yrs</strong> — starting from your current corpus of <strong>${formatCurrency(corpusStart)}</strong>, ` +
            `you reach <strong>${formatCurrency(fiTarget)}</strong> (25× expenses).`;
    }
    } catch(e) { console.warn('updateFISlider error:', e); }
}

// ==================== WEALTH OPTIMIZER (MONEY LEAKS) ====================
function runWealthOptimizer(astCash, totalAssets, dArr, totalExp, income) {
    const leaks = [];
    const emFundReq = (income || totalExp) * 6; // 6 months salary
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
    // Persist active tab so refresh restores it
    try { localStorage.setItem('aarth_active_tab', t); } catch(e) {}

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
        'ai': 'pg-ai',
        'child': 'pg-child',
        'profile': 'pg-profile'
    };

    // Refresh profile display when switching to it
    if (t === 'profile') {
        const nameEl = document.getElementById('profile-name-display');
        if (nameEl) {
            const n = (document.getElementById('u-name') || {}).value || '';
            nameEl.textContent = n || 'Anonymous';
        }
        const statusEl = document.getElementById('profile-save-status');
        if (statusEl) {
            const hasSave = !!localStorage.getItem('aarthSutraData');
            statusEl.innerHTML = hasSave
                ? '✅ You have saved data on this device. It will load automatically next time you open the app.'
                : '⚠️ No saved data yet. Hit <strong>Compute My Wealth Blueprint</strong> and choose to save.';
        }
    }
    
    const pg = document.getElementById(sectionMap[t]);
    const nav = document.getElementById('nav-' + t);
    
    if (pg) {
        pg.classList.remove('off');
        pg.classList.add('on', 'animated-fade');
    }
    if (nav) nav.classList.add('active');
    
    // Auto-calculating strategy when user manually navigates to Blueprint tab
    // silentMode=true so it doesn't re-trigger another switchTab('dash') recursively
    if (t === 'dash') calculateStrategy(true);
    if (t === 'simulator') setTimeout(j2Setup, 60);
    
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
    mutual_fund: 12.0, stocks_mid: 15.0, stocks_small: 18.0, stocks_in: 13.0,
    mutual_debt: 7.5, stocks_us: 13.0, etf: 12.0,
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
    mutual_fund: { label: '📈 Nifty 50 & Index Funds', liq: true },
    stocks_mid: { label: '🎯 Mid Cap Funds', liq: true },
    stocks_small: { label: '🚀 Small Cap Funds', liq: true },
    mutual_debt: { label: '🏦 Debt Mutual Funds', liq: true },
    stocks_in:   { label: '📊 Large Cap & Blue Chip Stocks', liq: true },
    stocks_us:   { label: '🌍 US / International Stocks', liq: true },
    etf:         { label: '📈 ETFs & Exchange Traded Funds', liq: true },
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
                <optgroup label="📈 Stock Market Investments">
                    <option value="mutual_fund">📈 Nifty 50 & Index Funds (12%) - Safest stocks</option>
                    <option value="stocks_mid">🎯 Mid Cap Funds (15%) - Medium risk, good growth</option>
                    <option value="stocks_small">🚀 Small Cap Funds (18%) - Higher risk, highest growth</option>
                    <option value="stocks_in">📊 Large Cap & Blue Chip Stocks (13%) - Quality companies</option>
                    <option value="mutual_debt">🏦 Debt Mutual Funds (7.5%) - Low risk, stable returns</option>
                    <option value="stocks_us">🌍 US / International Stocks (13%) - Diversification</option>
                    <option value="etf">📈 ETFs & Exchange Traded Funds (12%) - Low cost investing</option>
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
function calculateStrategy(silentMode = false) {
    // Guard: prevent multiple simultaneous computations
    if (isComputing) return;
    isComputing = true;

    const ctaBtn     = document.querySelector('.compute-cta');
    const ctaDefault = document.querySelector('.cta-default');
    const ctaLoading = document.querySelector('.cta-loading');
    const backdrop   = document.getElementById('compute-backdrop');

    // ── STATE ON CLICK: Show button loading state + full-screen guard backdrop ──
    if (ctaBtn)     ctaBtn.classList.add('computing');
    if (ctaDefault) ctaDefault.style.display = 'none';
    if (ctaLoading) ctaLoading.style.display = 'flex';
    if (backdrop)   backdrop.classList.remove('hidden');

    // ── rAF + setTimeout ensures browser PAINTS the guard backdrop + spinner
    //    before the heavy synchronous calculation blocks the thread ──
    requestAnimationFrame(() => setTimeout(() => {
    try {
    const name = (document.getElementById('u-name') || {}).value || '';

    // Helper: safely read a numeric field
    const numVal = id => { const el = document.getElementById(id); return el ? (parseFloat(el.value) || 0) : 0; };
    const strVal = id => { const el = document.getElementById(id); return el ? (el.value || '') : ''; };

    // Cashflow
    const income       = numVal('u-income');
    const stepUpPercent= numVal('u-stepup');
    const totalExp     = numVal('u-rent') + numVal('u-groceries') + numVal('u-cc') + numVal('u-life');
    // Auto-derive investable surplus: income minus expenses (floored at 0)
    const autoSurplus  = Math.max(0, income - totalExp);
    // Keep hidden u-sip in sync so downstream reads stay consistent
    const sipEl = document.getElementById('u-sip');
    if (sipEl) sipEl.value = autoSurplus;
    const sip = autoSurplus;

    // Insurance flags affect emergency fund requirement
    const hasMedIns  = strVal('u-med')  === 'yes';
    const hasTermIns = strVal('u-term') === 'yes';
    // FD Shield: 6 months of SALARY (not expenses) — protects against job loss
    const emFundMonths = 6;
    const emFundReq = income * emFundMonths;

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
            case 'mutual_fund': case 'stocks_mid': case 'stocks_small':
            case 'stocks_in': case 'stocks_us': case 'etf': case 'crypto': case 'reit':
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
        const dpEl = r.querySelector('.d-p'), deEl = r.querySelector('.d-e'),
              drEl = r.querySelector('.d-r'), dnEl = r.querySelector('.d-n');
        let p  = parseFloat((dpEl && dpEl.value) || 0) || 0;
        let e  = parseFloat((deEl && deEl.value) || 0) || 0;
        let rt = parseFloat((drEl && drEl.value) || 0) || 0;
        if(p > 0) anyDebt = true;
        totalLiabilities += p; totalEMI += e;
        if(rt > 10)  hasBadDebt = true;
        if(rt > 7 && rt <= 10) hasModerateDebt = true;
        dArr.push({n: (dnEl && dnEl.value) || 'Debt', p, rt, e});
    });

    const netWorth = totalAssets - totalLiabilities;
    const unallocatedCashflow = income - totalExp - totalEMI;
    const sumSurplus = sip + (unallocatedCashflow > 0 ? unallocatedCashflow : 0);

    // ┌─ ENFORCE DETERMINISTIC FINANCIAL HIERARCHY ────────────────────────────┐
    // Check: Insurance → Safety Net → Surplus
    const hierarchy = validateFinancialHierarchy(
        income, totalExp, hasMedIns, hasTermIns, astCash, totalEMI, sip
    );

    // If critical issues exist, show alerts BEFORE proceeding
    let hierarchyWarnings = '';
    hierarchy.alerts.forEach(alert => {
        const bgColor = alert.level === 'CRITICAL' ? 'rgba(239,68,68,0.1)' : 'rgba(245,158,11,0.1)';
        const borderColor = alert.color;

        if (alert.progressCurrent !== undefined) {
            // Show progress bar for emergency fund
            const pct = Math.min((alert.progressCurrent / alert.progressTarget) * 100, 100);
            hierarchyWarnings += `
                <div style="margin-bottom:12px; padding:12px; background:${bgColor}; border-left:4px solid ${borderColor}; border-radius:6px;">
                    <div style="font-weight:800; color:${borderColor}; font-size:13px;">${alert.icon} ${alert.title}</div>
                    <div style="color:rgba(255,255,255,0.7); font-size:12px; margin-top:6px;">${alert.message}</div>
                    <div style="margin-top:8px; background:rgba(0,0,0,0.3); border-radius:4px; height:8px; overflow:hidden;">
                        <div style="background:linear-gradient(90deg, #10B981, #34D399); height:100%; width:${pct}%; transition:width 0.3s ease;"></div>
                    </div>
                    <div style="font-size:11px; color:rgba(255,255,255,0.5); margin-top:4px;">${(pct).toFixed(0)}% complete (${formatCurrency(alert.progressCurrent)} / ${formatCurrency(alert.progressTarget)})</div>
                </div>
            `;
        } else {
            hierarchyWarnings += `
                <div style="margin-bottom:12px; padding:12px; background:${bgColor}; border-left:4px solid ${borderColor}; border-radius:6px;">
                    <div style="font-weight:800; color:${borderColor}; font-size:13px;">${alert.icon} ${alert.title}</div>
                    <div style="color:rgba(255,255,255,0.7); font-size:12px; margin-top:6px;">${alert.message}</div>
                </div>
            `;
        }
    });

    // Show hierarchy warnings in the goal-protocol section
    if (hierarchyWarnings) {
        const protocolEl = document.getElementById('goal-protocol-blocks');
        if (protocolEl) {
            protocolEl.innerHTML = `
                <div style="background:rgba(239,68,68,0.05); border:1px solid rgba(239,68,68,0.3); border-radius:12px; padding:16px; margin-bottom:20px;">
                    <div style="font-size:16px; font-weight:900; color:#EF4444; margin-bottom:12px;">🔴 Financial Hierarchy Warnings</div>
                    ${hierarchyWarnings}
                </div>
                ${hierarchy.isBlockedFromInvesting ? `
                    <div style="text-align:center; padding:40px 20px; color:rgba(255,255,255,0.5);">
                        <div style="font-size:48px; margin-bottom:8px;">🔒</div>
                        <div style="font-size:16px; font-weight:800; color:#EF4444;">Investments Locked</div>
                        <div style="font-size:13px; margin-top:8px; color:rgba(255,255,255,0.6); line-height:1.5;">
                            Fix the critical issues above to unlock your wealth strategy. Your financial foundation comes first.
                        </div>
                    </div>
                ` : '<div style="color:rgba(255,255,255,0.5); font-size:12px; margin-top:12px;">⚠️ Warnings above — review and adjust before investing.</div>'}
            `;
        }
    }
    
    // hasTerm / hasMed reuse the already-null-guarded variables above
    const hasTerm = hasTermIns;
    const hasMed  = hasMedIns;

    // *** DISCRETIONARY GOAL PARSER (FEASIBILITY ENGINE) ***
    // Uses SMART GOAL ALLOCATION for optimal returns without damaging corpus
    let totalRequiredSIP = 0;
    let goalAnalysisHTML = "";
    let extractedGoals = [];
    let allGoalAllocations = []; // Track all goal allocations for chart

    document.querySelectorAll('.dy-goal').forEach(r => {
        const gnEl = r.querySelector('.g-name'), gtEl = r.querySelector('.g-tgt'), gyEl = r.querySelector('.g-yrs');
        let nm  = (gnEl && gnEl.value) || 'My Goal';
        let tgt = parseFloat((gtEl && gtEl.value) || 0) || 0;
        let yrs = parseFloat((gyEl && gyEl.value) || 0) || 0;

        if(tgt > 0 && yrs > 0) {
            // ┌─ GET SMART ALLOCATION ───────────────────────────────────┐
            let allocation = getSmartGoalAllocation(yrs);
            let rawSIP = calcRequiredSIP(tgt, yrs, allocation.blended);

            totalRequiredSIP += rawSIP;

            // Build allocation breakdown HTML
            let allocationBreakdown = `
                <div style="background:rgba(16,185,129,0.08); border-radius:6px; padding:8px; margin:8px 0; font-size:11px;">
                    <div style="font-weight:700; margin-bottom:4px; color:var(--text-hi);">💼 Smart Allocation (${(allocation.blended).toFixed(2)}% return):</div>
                    <div style="display:grid; grid-template-columns:1fr 1fr; gap:4px;">
            `;

            // Show non-zero allocations
            if (allocation.fd.pct > 0) allocationBreakdown += `<div>🏦 FD: <strong>${allocation.fd.pct}%</strong></div>`;
            if (allocation.debt.pct > 0) allocationBreakdown += `<div>🏦 Debt MF: <strong>${allocation.debt.pct}%</strong></div>`;
            if (allocation.balanced.pct > 0) allocationBreakdown += `<div>⚖️ Balanced: <strong>${allocation.balanced.pct}%</strong></div>`;
            if (allocation.equity.pct > 0) allocationBreakdown += `<div>📈 Equity: <strong>${allocation.equity.pct}%</strong></div>`;

            allocationBreakdown += `</div></div>`;

            goalAnalysisHTML += `
                <div style="margin-bottom:12px; padding:10px; background:rgba(255,255,255,0.03); border-left:3px solid var(--emerald); border-radius:4px;">
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <div>
                            <div style="font-weight:800; color:var(--text-hi);">🎯 ${nm}</div>
                            <div style="font-size:12px; color:rgba(255,255,255,0.6);">Target: ${formatCurrency(tgt)} in ${yrs} year(s)</div>
                        </div>
                        <div style="text-align:right;">
                            <div style="font-size:16px; font-weight:900; color:var(--emerald);">${formatCurrency(rawSIP)}/mo</div>
                            <div style="font-size:11px; color:rgba(255,255,255,0.5);">Blended return: ${allocation.blended.toFixed(2)}%</div>
                        </div>
                    </div>
                    ${allocationBreakdown}
                </div>
            `;

            extractedGoals.push({
                name: nm,
                target: tgt,
                monthDue: Math.floor(yrs * 12),
                hit: false,
                allocation: allocation,
                monthlyAmount: rawSIP
            });

            allGoalAllocations.push({
                name: nm,
                years: yrs,
                target: tgt,
                sip: rawSIP,
                allocation: allocation
            });
        }
    });

    // ┌─ ALLOCATION CHART ──────────────────────────────────────────────┐
    let allocationChartHTML = "";
    if (allGoalAllocations.length > 0) {
        allocationChartHTML = `
            <div style="margin:20px 0; background:rgba(16,185,129,0.05); border:1px solid rgba(16,185,129,0.2); border-radius:12px; padding:16px;">
                <div style="font-weight:900; font-size:14px; color:var(--text-hi); margin-bottom:12px;">📊 Goal-by-Goal Allocation Breakdown</div>
                <div style="overflow-x:auto;">
                    <table style="width:100%; font-size:12px; color:rgba(255,255,255,0.8); border-collapse:collapse;">
                        <thead>
                            <tr style="border-bottom:2px solid rgba(16,185,129,0.3);">
                                <th style="text-align:left; padding:8px; font-weight:800;">Goal</th>
                                <th style="text-align:center; padding:8px; font-weight:800;">Timeline</th>
                                <th style="text-align:right; padding:8px; font-weight:800;">Monthly SIP</th>
                                <th style="text-align:center; padding:8px; font-weight:800;">FD</th>
                                <th style="text-align:center; padding:8px; font-weight:800;">Debt MF</th>
                                <th style="text-align:center; padding:8px; font-weight:800;">Balanced</th>
                                <th style="text-align:center; padding:8px; font-weight:800;">Equity</th>
                                <th style="text-align:right; padding:8px; font-weight:800;">Blended %</th>
                            </tr>
                        </thead>
                        <tbody>
        `;

        allGoalAllocations.forEach((goal, idx) => {
            const bgColor = idx % 2 === 0 ? 'rgba(255,255,255,0.01)' : 'transparent';
            allocationChartHTML += `
                            <tr style="border-bottom:1px dashed rgba(16,185,129,0.15); background:${bgColor};">
                                <td style="padding:8px; font-weight:700;">🎯 ${goal.name}</td>
                                <td style="text-align:center; padding:8px;">${goal.years}y</td>
                                <td style="text-align:right; padding:8px; color:var(--emerald); font-weight:800;">${formatCurrency(goal.sip)}</td>
                                <td style="text-align:center; padding:8px;">${goal.allocation.fd.pct}%</td>
                                <td style="text-align:center; padding:8px;">${goal.allocation.debt.pct}%</td>
                                <td style="text-align:center; padding:8px;">${goal.allocation.balanced.pct}%</td>
                                <td style="text-align:center; padding:8px;">${goal.allocation.equity.pct}%</td>
                                <td style="text-align:right; padding:8px; font-weight:700; color:var(--accent-hi);">${goal.allocation.blended.toFixed(2)}%</td>
                            </tr>
            `;
        });

        allocationChartHTML += `
                        </tbody>
                    </table>
                </div>
                <div style="margin-top:12px; font-size:11px; color:rgba(255,255,255,0.6); line-height:1.6;">
                    💡 <strong>How This Works:</strong> Short-term goals (1-2 years) are mostly in FD (safe). Medium-term goals (3-5 years) blend in Debt MF & Balanced funds. Long-term goals (5+ years) can invest more in Equity for better growth. All allocations are calculated to hit your goal without excessive risk.
                </div>
            </div>
        `;
    }

    let fireText = "<strong>Priority 1: FINANCIAL INDEPENDENCE</strong> always comes first. Then, your lifestyle goals:<br><br>";
    if (goalAnalysisHTML !== "") {
        fireText += `<div style="font-size:13px;">${goalAnalysisHTML}</div>`;
        fireText += allocationChartHTML;
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
    // ┌─ STRICT HIERARCHY: Block investing if hierarchy validation fails ───────┐
    let p1_secure = !hierarchy.isBlockedFromInvesting && astCash >= emFundReq && hasTerm && hasMed && !hasBadDebt;
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

    // DOM Updates — all guarded to never crash
    const _sid = id => document.getElementById(id);
    if (_sid('goal-protocol-blocks')) _sid('goal-protocol-blocks').innerHTML = fireText;
    if (_sid('ladder-container'))     _sid('ladder-container').innerHTML = ladderHTML;
    if (_sid('v-ast')) _sid('v-ast').innerText = formatCurrency(totalAssets);
    if (_sid('v-lia')) _sid('v-lia').innerText = formatCurrency(totalLiabilities);
    if (_sid('v-nw'))  _sid('v-nw').innerText  = formatCurrency(netWorth);

    // ══ NEW PREMIUM WIDGETS ══
    calcSurvivalRunway(astCash, totalExp);
    const { dailyEarning } = calcFreedomMeter(totalAssets, totalExp);
    renderDailyInsight(totalAssets);

    // ─── Insurance Shield Status (Gold if protected, Broken if at risk) ───
    updateInsuranceShield(hasTermIns, hasMedIns);

    // ─── SEBI COMPLIANCE & GOLDMAN SACHS AUDIT ENGINE ────────────────────────
    // 1. Risk Profiling
    const riskProfile = getRiskProfile();
    const riskWarnings = validateRiskAllocation(riskProfile, totalAssets);

    // 2. Tax Alpha Optimization
    const taxAlerts = generateTaxAlpha(totalAssets, astEq, astCash, income);

    // 3. Rebalancing Recommendations
    const rebalanceData = generateRebalancingPlan(riskProfile, totalAssets);

    // ─── RENDER: Risk Warnings in Goal Protocol section ───
    if (riskWarnings.length > 0) {
        let riskHTML = `<div style="margin-top:16px; background:rgba(168,85,247,0.05); border:1px solid rgba(168,85,247,0.3); border-radius:12px; padding:16px; margin-bottom:20px;">
            <div style="font-size:14px; font-weight:900; color:#A855F7; margin-bottom:12px;">⚠️ Risk Profile Warnings (${riskProfile.label})</div>`;
        riskWarnings.forEach(w => {
            riskHTML += `<div style="margin-bottom:10px; padding:10px; background:rgba(0,0,0,0.15); border-left:3px solid ${w.color}; border-radius:4px;">
                <div style="font-weight:800; font-size:12px; color:${w.color};">${w.icon} ${w.title}</div>
                <div style="font-size:11px; color:rgba(255,255,255,0.6); margin-top:4px; line-height:1.5;">${w.message}</div>
            </div>`;
        });
        riskHTML += `</div>`;
        const protocolEl = _sid('goal-protocol-blocks');
        if (protocolEl) protocolEl.innerHTML += riskHTML;
    }

    // ─── RENDER: Tax Alpha ───
    const taxSection = _sid('tax-alpha-section');
    const taxContent = _sid('tax-alpha-content');
    if (taxSection && taxContent && taxAlerts.length > 0) {
        taxSection.style.display = 'block';
        let taxHTML = '';
        taxAlerts.forEach(a => {
            taxHTML += `<div style="margin-bottom:10px; padding:10px; background:rgba(0,0,0,0.15); border-left:3px solid ${a.color}; border-radius:4px;">
                <div style="font-weight:800; font-size:12px; color:${a.color};">${a.icon} ${a.title}</div>
                <div style="font-size:11px; color:rgba(255,255,255,0.6); margin-top:4px; line-height:1.5;">${a.message}</div>
            </div>`;
        });
        taxContent.innerHTML = taxHTML;
    }

    // ─── RENDER: Rebalancing ───
    const rebalSection = _sid('rebalance-section');
    const rebalContent = _sid('rebalance-content');
    if (rebalSection && rebalContent && rebalanceData.recommendations.length > 0) {
        rebalSection.style.display = 'block';
        let rebalHTML = '';

        // Asset breakdown pie-like bar
        if (totalAssets > 0) {
            const bd = rebalanceData.assetBreakdown;
            const tgt = rebalanceData.targets;
            rebalHTML += `<div style="margin-bottom:12px;">
                <div style="font-weight:800; font-size:12px; margin-bottom:6px; color:var(--text-hi);">Current vs Target Allocation</div>
                <div style="display:flex; height:24px; border-radius:6px; overflow:hidden; margin-bottom:4px;">
                    <div style="width:${bd.safe/totalAssets*100}%; background:#3B82F6;" title="Safe: ${(bd.safe/totalAssets*100).toFixed(0)}%"></div>
                    <div style="width:${bd.moderate/totalAssets*100}%; background:#10B981;" title="Moderate: ${(bd.moderate/totalAssets*100).toFixed(0)}%"></div>
                    <div style="width:${bd.aggressive/totalAssets*100}%; background:#F59E0B;" title="Aggressive: ${(bd.aggressive/totalAssets*100).toFixed(0)}%"></div>
                    <div style="width:${bd.speculative/totalAssets*100}%; background:#EF4444;" title="Speculative: ${(bd.speculative/totalAssets*100).toFixed(0)}%"></div>
                </div>
                <div style="display:flex; gap:12px; font-size:10px; color:rgba(255,255,255,0.5); flex-wrap:wrap;">
                    <span>🔵 Safe: ${(bd.safe/totalAssets*100).toFixed(0)}% (target: ${tgt.safe}%)</span>
                    <span>🟢 Moderate: ${(bd.moderate/totalAssets*100).toFixed(0)}% (target: ${tgt.moderate}%)</span>
                    <span>🟡 Growth: ${(bd.aggressive/totalAssets*100).toFixed(0)}% (target: ${tgt.aggressive}%)</span>
                    <span>🔴 Speculative: ${(bd.speculative/totalAssets*100).toFixed(0)}% (target: ${tgt.speculative}%)</span>
                </div>
            </div>`;
        }

        rebalanceData.recommendations.forEach(r => {
            rebalHTML += `<div style="margin-bottom:10px; padding:10px; background:rgba(0,0,0,0.15); border-left:3px solid ${r.color}; border-radius:4px;">
                <div style="font-weight:800; font-size:12px; color:${r.color};">${r.icon} ${r.title}</div>
                <div style="font-size:11px; color:rgba(255,255,255,0.6); margin-top:4px; line-height:1.5;">${r.message}</div>
                ${r.action ? `<div style="margin-top:6px; font-size:10px; font-weight:700; color:${r.color}; text-transform:uppercase;">Action: ${r.action}</div>` : ''}
            </div>`;
        });
        rebalContent.innerHTML = rebalHTML;
    }

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
        surplus: sumSurplus,
        // Risk Profile
        riskProfile: riskProfile.label,
        riskLevel: riskProfile.level,
        extractedGoals
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
    runWealthOptimizer(astCash, totalAssets, dArr, totalExp, income);

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
        if (_sid('nw-total-wealth')) _sid('nw-total-wealth').innerText = formatCurrency(trendData[trendData.length-1].wealth);
        
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

    if (_sid('monthly-allocator-body')) _sid('monthly-allocator-body').innerHTML = allocHTML;

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

    // Celebrations & toasts — only fire when user explicitly clicked Compute, not on page-load auto-run
    if (!silentMode) {
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
    }

    // Only navigate to dash if user explicitly clicked Compute (not on page-load auto-run)
    if (!silentMode) switchTab('dash');
    if (typeof lucide !== 'undefined') lucide.createIcons();

    } catch(err) {
        console.error('calculateStrategy error:', err);
        showSuccessToast('Something went wrong — please fill in your numbers and try again.', '⚠️');
    } finally {
        // ── STATE COMPLETION: Hide guard backdrop + restore button ──
        isComputing = false; // State back to false — allow next computation

        // Hide backdrop to show celebration/dashboard underneath
        if (backdrop) backdrop.classList.add('hidden');

        // Restore button to default state whether calculation succeeded or failed
        if (ctaBtn)     ctaBtn.classList.remove('computing');
        if (ctaDefault) ctaDefault.style.display = 'flex';
        if (ctaLoading) ctaLoading.style.display = 'none';

        // ── DOM CLEANUP: Ensure no stale references remain ──
        // (The hidden class uses display: none, so the element stays in DOM but is invisible)
        // This is safer than removing/remounting which can cause state loss
    }

    })); // end requestAnimationFrame + setTimeout
}

// --- TAB 3: DYNAMIC CRISIS SIMULATOR (WITH CELEBRATION PROTOCOL) ---
const delay = ms => new Promise(res => setTimeout(res, ms));

async function runCrisisSimulator() {
    if(engineMemory.totalAssets === undefined) return;
    const logBox = document.getElementById('timeline-log');
    logBox.innerHTML = '<div id="gif-overlay" style="display:none; position:absolute; top:50%; left:50%; transform:translate(-50%, -50%); flex-direction:column; align-items:center; z-index:10; background:rgba(255,255,255,0.95); padding:30px; border-radius:12px; box-shadow:0 10px 40px rgba(0,0,0,0.2); width:80%; text-align:center;"><div style="font-size:60px; margin-bottom:10px;">🎉</div><div id="gif-txt" style="font-size:16px; font-weight:800; color:#1e293b;"></div></div>';

    // ══ SIMULATOR NOW WORKS WITH DEBT & INCOMPLETE EMERGENCY FUND ══
    // Shows realistic "what-if" scenarios
    let corpus = engineMemory.totalAssets || 0; // Use ALL assets as starting point
    let surplus = engineMemory.sumSurplus;
    let stepUpPercent = engineMemory.stepUpPercent || 0;
    let monthlyRate = (12.0 / 100) / 12; // Base equity return

    // ── Track Emergency Fund (FD Shield) Separately ──
    const emFundTarget = (engineMemory.income || 50000) * 6; // 6 months salary
    let emFundCurrent = engineMemory.astCash || 0; // Start with liquid cash
    let emFundDepletion = 0; // Track how much was used in crisis

    // ── Track Debt ──
    let totalDebt = engineMemory.totalLiabilities || 0;
    let monthlyDebtEMI = (engineMemory.dArr || []).reduce((sum, d) => sum + d.e, 0);
    let debtPayoffMonth = 0; // When debt is cleared

    // ── Adjust surplus for debt ──
    const investableSurplus = Math.max(0, surplus - monthlyDebtEMI);

    // Display scenario header
    let scenarioWarning = '';
    if (!engineMemory.p1) {
        scenarioWarning = `<div style="background:rgba(168,85,247,0.1); border:1px solid rgba(168,85,247,0.3); border-radius:8px; padding:12px; margin-bottom:16px; font-size:12px; color:rgba(255,255,255,0.7); line-height:1.6;">
            ⚠️ <strong>Realistic Scenario:</strong> Your emergency fund is incomplete (${((emFundCurrent/emFundTarget)*100).toFixed(0)}% of target) and/or you have ${monthlyDebtEMI > 0 ? 'debt.' : 'issues.'} This simulation shows what happens during a market crash in this realistic situation. The crisis will tap into your emergency fund first.
        </div>`;
    }

    logBox.innerHTML += scenarioWarning + `<div class="log-entry"><div class="log-header">Month 1 • Starting Scenario</div><div class="log-body">
        <strong>Assets:</strong> ${formatCurrency(corpus)} |
        <strong>Emergency Fund:</strong> ${formatCurrency(emFundCurrent)} / ${formatCurrency(emFundTarget)} |
        <strong>Debt:</strong> ${formatCurrency(totalDebt)} (₹${monthlyDebtEMI}/mo EMI) |
        <strong>Monthly Investable Surplus:</strong> ${formatCurrency(investableSurplus)}/mo (after debt repayment)
        <br/>
        <em>Market scenario: Normal bull market first, then 25% crash at month 48, then recovery. Debt EMI paid continuously.</em>
    </div></div>`;

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
        // ── Step 1: Debt Repayment (Priority 1) ──
        if (totalDebt > 0 && investableSurplus > 0) {
            // Aggressively pay down debt each month
            const debtPaydown = monthlyDebtEMI;
            totalDebt = Math.max(0, totalDebt - debtPaydown);
            if (totalDebt === 0 && debtPayoffMonth === 0) {
                debtPayoffMonth = i;
            }
        }

        // ── Step 2: Rebuild Emergency Fund (Priority 2) ──
        // Before investing, rebuild emergency fund if it's below target
        let emFundFill = 0;
        if (emFundCurrent < emFundTarget && investableSurplus > 0) {
            emFundFill = Math.min(investableSurplus * 0.5, emFundTarget - emFundCurrent); // Use 50% of surplus to refill
            emFundCurrent += emFundFill;
        }

        // ── Step 3: Compound & Invest remaining surplus ──
        const investableAmount = Math.max(0, investableSurplus - emFundFill);
        corpus = (corpus * (1 + monthlyRate)) + investableAmount;
        
        // --- CRISIS DETECTED (Month 48) ---
        if(i === 48 && !hasCrashed) {
            hasCrashed = true;
            corpus = corpus * 0.75; // 25% drop!

            // During crisis, emergency fund gets partially depleted
            emFundDepletion = emFundCurrent * 0.30; // Lose 30% of emergency fund in crisis (job loss, medical)
            emFundCurrent = Math.max(0, emFundCurrent - emFundDepletion);

            const crisisMsg = emFundDepletion > 0 ?
                `Your emergency fund dropped by ${formatCurrency(emFundDepletion)} due to unexpected expenses (health emergency, job layoff). This is exactly why you need it!` :
                `Your emergency fund remained intact since it was already complete.`;

            document.getElementById('gif-txt').innerHTML = `<span style="color:#ef4444; font-size:20px;">🚨 MARKET CRASH + JOB CRISIS! 🚨</span><br><br>Stock market dropped 25% AND you face a personal crisis.<br><br><div style="font-size:28px; font-weight:900; color:#ef4444;">Investment Wealth: ${formatCurrency(corpus)}</div><br>Emergency Fund Status: ${formatCurrency(emFundCurrent)} remaining<br><br>${crisisMsg}<br><br>This is the real test. Your SIP stops temporarily to cover expenses. The good news: when the market rebounds, you will have bought at the lowest prices!`;
            document.getElementById('gif-overlay').style.display = 'flex';
            await delay(7500);
            document.getElementById('gif-overlay').style.display = 'none';

            let e = document.createElement('div'); e.className = 'log-entry';
            e.innerHTML = `<div class="log-header" style="color:#ef4444;">Month ${i} • DOUBLE CRISIS: Market Crash + Personal Emergency</div><div class="log-body">Investment Wealth crashed to <span class="log-val" style="color:#ef4444;">${formatCurrency(corpus)}</span>. Emergency Fund depleted by ${formatCurrency(emFundDepletion)}, now at ${formatCurrency(emFundCurrent)}. SIP paused temporarily to rebuild emergency funds. Your discipline in building the FD shield is now paying off!</div>`;
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

        // EMERGENCY FUND REBUILD MILESTONE
        if(emFundCurrent >= emFundTarget && i > 50 && emFundDepletion > 0 && !engineMemory._emFundRebuildMsg) {
            engineMemory._emFundRebuildMsg = true;
            document.getElementById('gif-txt').innerHTML = `🛡️ EMERGENCY FUND RESTORED! 🛡️<br><br>Your 6-month safety net is complete again.<br><br><div style="font-size:24px; font-weight:900; color:#10b981;">Emergency Shield: ${formatCurrency(emFundCurrent)}</div><br>You survived the crisis and rebuilt. Now you can invest more aggressively!`;
            document.getElementById('gif-overlay').style.display = 'flex';
            await delay(5000);
            document.getElementById('gif-overlay').style.display = 'none';

            let e = document.createElement('div'); e.className = 'log-entry log-milestone';
            e.innerHTML = `<div class="log-header" style="color:#10b981;">Month ${i} • EMERGENCY FUND REBUILT</div><div class="log-body">Your 6-month safety net is back at ${formatCurrency(emFundCurrent)}. You recovered from the crisis! Now investments can accelerate. Total wealth: ${formatCurrency(corpus)}.</div>`;
            logBox.appendChild(e); logBox.scrollTop = logBox.scrollHeight;
            await delay(1000);
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
            <div style="display:flex; justify-content:space-between; margin-bottom:4px;"><span>Monthly Income (Surplus):</span><span style="color:#10b981; font-weight:bold;">${formatCurrency(surplus)}</span></div>
            <div style="display:flex; justify-content:space-between; margin-bottom:4px;"><span>Debt EMI Paid:</span><span style="color:${totalDebt > 0 ? '#ef4444' : '#10b981'}">${formatCurrency(monthlyDebtEMI)}</span></div>
            <div style="display:flex; justify-content:space-between; margin-bottom:4px;"><span>Emergency Fund Top-up:</span><span style="color:#22d3ee;">${formatCurrency(emFundFill)}</span></div>
            <div style="display:flex; justify-content:space-between; margin-bottom:4px;"><span>Available to Invest:</span><span style="color:var(--accent-green); font-weight:bold;">${formatCurrency(investableAmount)}</span></div>
            <div style="margin-top:6px; font-weight:600; color:#334155;">Emergency Fund Status:</div>
            <div style="display:flex; justify-content:space-between; margin-left:10px; font-size:11px;"><span>Current: ${formatCurrency(emFundCurrent)} / Target: ${formatCurrency(emFundTarget)}</span><span>${emFundCurrent >= emFundTarget ? '✅ COMPLETE' : `${Math.round((emFundCurrent/emFundTarget)*100)}% done`}</span></div>
            ${totalDebt > 0 ? `<div style="margin-top:6px; font-weight:600; color:#334155;">Debt Status:</div>
            <div style="display:flex; justify-content:space-between; margin-left:10px; font-size:11px;"><span>Outstanding: ${formatCurrency(totalDebt)}</span><span>${debtPayoffMonth > 0 ? `Cleared at Month ${debtPayoffMonth}` : 'In progress'}</span></div>` : ''}
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

        // DEBT PAYOFF MILESTONE
        if(debtPayoffMonth > 0 && i === debtPayoffMonth && totalDebt === 0) {
            document.getElementById('gif-txt').innerHTML = `🎉 DEBT FREEDOM! 🎉<br><br>You've paid off all your loans!<br><br><div style="font-size:28px; font-weight:900; color:#10b981;">Monthly Cash Flow Increased</div><br>Your ₹${monthlyDebtEMI}/mo EMI is now freed up. This entire amount can go to investments. Compounding just accelerated!`;
            document.getElementById('gif-overlay').style.display = 'flex';
            await delay(5000);
            document.getElementById('gif-overlay').style.display = 'none';

            let e = document.createElement('div'); e.className = 'log-entry log-milestone';
            e.innerHTML = `<div class="log-header" style="color:#10b981;">Month ${i} • DEBT FREEDOM!</div><div class="log-body">All loans cleared! You now have an extra ₹${monthlyDebtEMI}/mo to invest. Wealth is at ${formatCurrency(corpus)}. The compounding machine just got supercharged.</div>`;
            logBox.appendChild(e); logBox.scrollTop = logBox.scrollHeight;
            await delay(1000);

            // Increase investable surplus for remaining months
            surplus += monthlyDebtEMI;
            monthlyDebtEMI = 0;
            continue;
        }

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
    if (engineMemory.totalAssets === undefined) { alert("Please tap 'Compute My Wealth Blueprint' first to generate your report."); return; }
    const m = engineMemory;
    const name = m.name || 'Friend';
    const income = m.income || 0;
    const exp = m.totalExp || 0;
    const surplus = m.sumSurplus || m.surplus || 0;
    const sip = m.sip || 0;
    const netWorth = m.netWorth || 0;
    const liab = m.totalLiabilities || 0;
    const assets = m.totalAssets || 0;
    const cash = m.astCash || 0;
    const emMonths = m.emFundMonths || 0;
    const cagr = m.blendedCAGR || 12;
    const hasMed = m.hasMedIns;
    const hasTerm = m.hasTermIns;
    const dArr = m.dArr || [];
    const stepUp = m.stepUpPercent || 0;
    const today = new Date().toLocaleDateString('en-IN', { day:'numeric', month:'long', year:'numeric' });

    // ── COVER ──
    document.getElementById('pdf-bp-title').innerText = `${name}'s Wealth Blueprint`;
    document.getElementById('pdf-date-line').innerText = `Private & Confidential · Generated ${today}`;
    document.getElementById('pdf-footer-date').innerText = today;

    // ── HEALTH SCORE ──
    const savingsRate = income > 0 ? surplus / income : 0;
    const sipRate = income > 0 ? sip / income : 0;
    const debtRatio = income > 0 ? liab / (income * 12) : 0;
    let cfPts = savingsRate>=0.30?25:savingsRate>=0.20?20:savingsRate>=0.10?13:savingsRate>=0.05?7:savingsRate>=0?3:0;
    let debtPts = liab===0?25:debtRatio<=0.5?22:debtRatio<=1?17:debtRatio<=2?10:debtRatio<=4?5:0;
    let invPts = sipRate>=0.25?25:sipRate>=0.15?20:sipRate>=0.10?14:sipRate>=0.05?8:sip>0?4:0;
    let safetyPts = (emMonths>=6?10:emMonths>=3?5:0)+(hasMed?8:0)+(hasTerm?7:0);
    const score = cfPts + debtPts + invPts + safetyPts;
    let grade, gradeColor, gradeBg;
    if      (score>=80){ grade='Excellent';  gradeColor='#065f46'; gradeBg='#d1fae5'; }
    else if (score>=60){ grade='Good';       gradeColor='#1e40af'; gradeBg='#dbeafe'; }
    else if (score>=40){ grade='Moderate';   gradeColor='#92400e'; gradeBg='#fef3c7'; }
    else               { grade='Needs Work'; gradeColor='#991b1b'; gradeBg='#fee2e2'; }
    document.getElementById('pdf-health-score').innerText = score;
    document.getElementById('pdf-health-score').style.color = gradeColor;
    const pillEl = document.getElementById('pdf-health-grade-pill');
    pillEl.innerText = grade;
    pillEl.style.background = gradeBg;
    pillEl.style.color = gradeColor;

    // ── SNAPSHOT STATS ──
    document.getElementById('pdf-nw').innerText = formatCurrency(netWorth);
    document.getElementById('pdf-sip').innerText = sip > 0 ? formatCurrency(sip)+'/mo' : '₹0 — Not investing';
    document.getElementById('pdf-debt').innerText = liab > 0 ? formatCurrency(liab) : 'Debt-Free ✓';
    document.getElementById('pdf-sr').innerText = Math.round(savingsRate*100)+'%';

    // ── SECTION A: HEALTH TABLE ──
    const cfGrade = cfPts>=20?'🟢 Excellent':cfPts>=13?'🟡 Good':cfPts>=7?'🟠 Moderate':'🔴 Critical';
    const dGrade  = debtPts>=22?'🟢 Healthy':debtPts>=17?'🟡 Manageable':debtPts>=10?'🟠 High':'🔴 Critical';
    const iGrade  = invPts>=20?'🟢 Excellent':invPts>=14?'🟡 Good':invPts>=8?'🟠 Moderate':'🔴 Low';
    const sGrade  = safetyPts>=20?'🟢 Protected':safetyPts>=13?'🟡 Adequate':safetyPts>=7?'🟠 Partial':'🔴 Exposed';
    const rowStyle = 'border-bottom:1px solid #f1f5f9;';
    const tdP = 'padding:9px 10px;font-size:13px;';
    document.getElementById('pdf-health-table').innerHTML = `
      <tr style="${rowStyle}"><td style="${tdP}font-weight:700;">💸 Cash Flow</td><td style="${tdP}">${cfGrade}</td><td style="${tdP}font-weight:700;color:#059669;">${cfPts}/25</td><td style="${tdP}">Savings rate: ${Math.round(savingsRate*100)}% &nbsp;|&nbsp; Surplus: ${formatCurrency(surplus)}/mo</td></tr>
      <tr style="${rowStyle}"><td style="${tdP}font-weight:700;">⚖️ Debt Burden</td><td style="${tdP}">${dGrade}</td><td style="${tdP}font-weight:700;color:#059669;">${debtPts}/25</td><td style="${tdP}">Total debt: ${formatCurrency(liab)} &nbsp;|&nbsp; ${Math.round(debtRatio*12)} months of income</td></tr>
      <tr style="${rowStyle}"><td style="${tdP}font-weight:700;">📈 Investing</td><td style="${tdP}">${iGrade}</td><td style="${tdP}font-weight:700;color:#059669;">${invPts}/25</td><td style="${tdP}">SIP: ${formatCurrency(sip)}/mo (${Math.round(sipRate*100)}% of income) &nbsp;|&nbsp; CAGR: ${cagr.toFixed(1)}%</td></tr>
      <tr><td style="${tdP}font-weight:700;">🛡️ Safety Net</td><td style="${tdP}">${sGrade}</td><td style="${tdP}font-weight:700;color:#059669;">${safetyPts}/25</td><td style="${tdP}">Emergency fund: ${Math.round(emMonths)} months &nbsp;|&nbsp; Health: ${hasMed?'✓':'✗'} &nbsp;|&nbsp; Term Life: ${hasTerm?'✓':'✗'}</td></tr>
    `;
    const verdictMap = {
      'Excellent': `Excellent financial health, ${name}! You're doing better than 90% of people. Stay consistent and keep increasing your SIP every year.`,
      'Good': `Good foundation, ${name}. A few targeted fixes in the weaker areas below will put you on the fast track to financial freedom.`,
      'Moderate': `You have a base to build on, ${name}, but clear gaps need urgent attention. Focus on the Action Plan in Section D — small fixes here compound massively.`,
      'Needs Work': `Your finances need restructuring, ${name}. The good news: even fixing 2-3 things from the Action Plan below can dramatically improve your score within 6 months.`
    };
    document.getElementById('pdf-health-verdict').innerText = verdictMap[grade] || '';
    document.getElementById('pdf-health-verdict').style.borderLeftColor = gradeColor;
    document.getElementById('pdf-health-verdict').style.background = gradeBg;
    document.getElementById('pdf-health-verdict').style.color = gradeColor;

    // ── SECTION B: WHAT'S HELPING / HURTING ──
    const goods = [], bads = [];
    if (savingsRate >= 0.20) goods.push(`✅ Strong savings rate (${Math.round(savingsRate*100)}%) — you're building wealth every month`);
    if (liab === 0) goods.push(`✅ Completely debt-free — your full surplus is yours to invest`);
    if (sip >= income*0.15) goods.push(`✅ Investing ${Math.round(sipRate*100)}% of income — compounding is working in your favour`);
    if (hasMed && hasTerm) goods.push(`✅ Both health & term insurance in place — your family is protected`);
    if (emMonths >= 6) goods.push(`✅ ${Math.round(emMonths)}-month emergency fund — financially resilient`);
    if (savingsRate < 0.10) bads.push(`❌ Low savings rate (${Math.round(savingsRate*100)}%) — most of income is being consumed. Target: 20%+`);
    if (liab > income*6) bads.push(`❌ Debt is ${Math.round(debtRatio*12)} months of income — paying this off is your #1 priority`);
    if (sip < income*0.10 && sip >= 0) bads.push(`❌ SIP is only ${Math.round(sipRate*100)}% of income — wealth building is slow. Increase by ₹2,000 every 3 months`);
    if (!hasMed) bads.push(`❌ No health insurance — one hospital bill could wipe out years of savings`);
    if (!hasTerm) bads.push(`❌ No term life insurance — your family has no financial safety net if something happens`);
    if (emMonths < 3) bads.push(`❌ Emergency fund covers only ${Math.round(emMonths)} month(s) — dangerously low. Target: 6 months (${formatCurrency(exp*6)})`);
    // PPF check
    let hasPPF = false;
    document.querySelectorAll('.a-type').forEach(el => { if(el.value==='ppf') hasPPF=true; });
    if (!hasPPF && income >= 30000) bads.push(`❌ No PPF account — missing 7.1% tax-free (EEE) returns & ₹46,800/yr tax saving (80C)`);
    const liStyle = 'font-size:13px;padding:5px 0;color:#166534;';
    const bStyle  = 'font-size:13px;padding:5px 0;color:#991b1b;';
    document.getElementById('pdf-killers-good').innerHTML = goods.length
        ? `<div style="background:#f0fdf4;border-radius:8px;padding:12px 14px;">${goods.map(g=>`<div style="${liStyle}">${g}</div>`).join('')}</div>`
        : '';
    document.getElementById('pdf-killers-bad').innerHTML = bads.length
        ? `<div style="background:#fef2f2;border-radius:8px;padding:12px 14px;margin-top:8px;">${bads.map(b=>`<div style="${bStyle}">${b}</div>`).join('')}</div>`
        : '<div style="font-size:13px;color:#059669;">No major red flags detected — great work!</div>';

    // ── SECTION C: GOAL FEASIBILITY ──
    if (document.getElementById('pdf-goal-text')) {
        document.getElementById('pdf-goal-text').innerHTML = m.goalAnalysisHTML || '<p style="color:#94a3b8;">No goals entered.</p>';
    }

    // ── SECTION D: ACTION PLAN ──
    const rxItems = [];
    if (surplus < 0) rxItems.push({ urgent:true, txt:`Cut expenses by at least ${formatCurrency(Math.abs(surplus))}/month. You are spending more than you earn — this is the single most urgent fix.` });
    const toxicD = dArr.filter(d=>(d.rt||d.rate||0)>10).sort((a,b)=>(b.rt||b.rate||0)-(a.rt||a.rate||0));
    if (toxicD.length > 0) rxItems.push({ urgent:true, txt:`Pay off ${toxicD[0].n||toxicD[0].name||'high-interest loan'} first (${toxicD[0].rt||toxicD[0].rate||'?'}% rate). Divert 100% of surplus until cleared. Frees up ${formatCurrency(toxicD[0].e||toxicD[0].emi||0)}/mo.` });
    if (!hasMed) rxItems.push({ urgent:true, txt:`Buy a ₹10L family floater health insurance policy today. Costs ₹500-800/month on PolicyBazaar. No excuse to delay this.` });
    if (!hasTerm) rxItems.push({ urgent:true, txt:`Get a ₹1 Crore term life insurance plan. For a 30-year-old it costs ~₹700/month. Compare on PolicyBazaar or Ditto Insurance.` });
    if (emMonths < 6) rxItems.push({ urgent:emMonths<3, txt:`Build emergency fund to 6 months of expenses (${formatCurrency(exp*6)}). You need ${formatCurrency(Math.max(0,exp*6-cash))} more. Park in a liquid mutual fund.` });
    if (!hasPPF && income >= 30000) rxItems.push({ urgent:false, txt:`Open a PPF account at any post office or bank. Invest ₹12,500/month for 7.1% tax-free returns + ₹46,800/yr tax saving under 80C.` });
    if (sipRate < 0.20 && surplus > 5000) rxItems.push({ urgent:false, txt:`Increase your SIP by ${formatCurrency(Math.max(0,Math.round(income*0.20)-sip))}/month to hit 20% of income. Set up auto step-up of ${stepUp||10}% yearly.` });
    if (score >= 60) rxItems.push({ urgent:false, txt:`Review this report every 6 months. When income rises, increase SIP by the same %. Small annual upgrades compound to massive wealth.` });
    document.getElementById('pdf-rx-list').innerHTML = rxItems.map((rx,i)=>`
      <div style="display:flex;gap:12px;align-items:flex-start;padding:9px 12px;margin-bottom:6px;border-radius:8px;background:${rx.urgent?'#fef2f2':'#f0fdf4'};border-left:3px solid ${rx.urgent?'#ef4444':'#059669'};">
        <div style="width:22px;height:22px;border-radius:50%;background:${rx.urgent?'#ef4444':'#059669'};color:white;font-size:11px;font-weight:800;display:flex;align-items:center;justify-content:center;flex-shrink:0;">${i+1}</div>
        <div style="font-size:13px;color:${rx.urgent?'#7f1d1d':'#166534'};line-height:1.5;">${rx.txt}</div>
      </div>`).join('');

    // ── SECTION E: ALLOCATION ──
    let allocEquity=0, allocBonds=0, allocUS=0, allocEmergency=0;
    if (!m.p1) { allocEmergency = surplus; }
    else if (m.p4) { allocEquity=surplus*0.60; allocBonds=surplus*0.20; allocUS=surplus*0.20; }
    else if (m.p3) { allocEquity=surplus*0.80; allocBonds=surplus*0.20; }
    else { allocEquity=surplus; }
    let aBody = '';
    const tr = (c,color) => `background:${color||'transparent'}`;
    if (!m.p1) {
        aBody += `<tr style="border-bottom:1px solid #f1f5f9;"><td style="padding:9px 10px;">Liquid Buffer (Savings A/c)</td><td style="padding:9px 10px;">0–4%</td><td style="padding:9px 10px;color:#64748b;font-weight:700;">First ₹10,000 here</td></tr>`;
        aBody += `<tr style="border-bottom:1px solid #f1f5f9;background:#fef2f2;"><td style="padding:9px 10px;color:#dc2626;font-weight:700;">Emergency Fund / Debt Clearance</td><td style="padding:9px 10px;">0–7%</td><td style="padding:9px 10px;color:#dc2626;font-weight:700;">100% → ${formatCurrency(allocEmergency)}/mo</td></tr>`;
        aBody += `<tr style="color:#94a3b8;"><td style="padding:9px 10px;">Mutual Funds / Equity</td><td style="padding:9px 10px;">—</td><td style="padding:9px 10px;">🔒 Locked until foundation complete</td></tr>`;
    } else {
        aBody += `<tr style="border-bottom:1px solid #f1f5f9;background:#f0fdf4;"><td style="padding:9px 10px;font-weight:700;">Nifty 50 + Midcap Index Funds</td><td style="padding:9px 10px;">12–15% CAGR</td><td style="padding:9px 10px;font-weight:700;color:#059669;">${formatCurrency(allocEquity)}/mo</td></tr>`;
        if (m.p3) aBody += `<tr style="border-bottom:1px solid #f1f5f9;"><td style="padding:9px 10px;font-weight:700;">Corporate Bonds (A+ rated)</td><td style="padding:9px 10px;">9–11%</td><td style="padding:9px 10px;font-weight:700;">${formatCurrency(allocBonds)}/mo</td></tr>`;
        else aBody += `<tr style="border-bottom:1px solid #f1f5f9;color:#94a3b8;"><td style="padding:9px 10px;">Corporate Bonds</td><td style="padding:9px 10px;">—</td><td style="padding:9px 10px;">🔒 Unlocks at ₹5L portfolio</td></tr>`;
        if (m.p4) aBody += `<tr><td style="padding:9px 10px;font-weight:700;">US Equities (Nasdaq / S&P500)</td><td style="padding:9px 10px;">13–15% CAGR</td><td style="padding:9px 10px;font-weight:700;">${formatCurrency(allocUS)}/mo</td></tr>`;
        else aBody += `<tr style="color:#94a3b8;"><td style="padding:9px 10px;">US Equities</td><td style="padding:9px 10px;">—</td><td style="padding:9px 10px;">🔒 Unlocks at ₹20L portfolio</td></tr>`;
    }
    document.getElementById('pdf-alloc-body').innerHTML = aBody;

    // ── SECTION F: DEBT X-RAY ──
    let amBody='', baseTotalInt=0, accTotalInt=0, maxBaseYrs=0, maxAccYrs=0;
    if (dArr.length === 0) {
        document.getElementById('pdf-amort-table').style.display = 'none';
        document.getElementById('pdf-amort-text').innerText = '🎉 Congratulations! You are completely debt-free. Your entire surplus can compound for you.';
        document.getElementById('pdf-ego-section').style.display = 'none';
    } else {
        document.getElementById('pdf-amort-table').style.display = 'table';
        const totalEMI = dArr.reduce((s,d)=>s+(d.e||d.emi||0),0);
        document.getElementById('pdf-amort-text').innerText = `⚠️ You have ${dArr.length} active loan(s) with total EMI of ${formatCurrency(totalEMI)}/month (${Math.round(totalEMI/income*100)}% of income). Paying just 1 extra EMI per year can save you years of debt.`;
        dArr.forEach(d => {
            const p = d.p || d.bal || 0;
            const e = d.e || d.emi || 0;
            const rt = d.rt || d.rate || 0;
            let bM=0, wM=0;
            if (p>0 && e>0 && rt>0) {
                const r = (rt/100)/12;
                const v1 = 1-(p*r)/e;
                bM = v1>0 ? -Math.log(v1)/Math.log(1+r) : 999;
                const intBase = (bM*e)-p;
                if(v1>0){ baseTotalInt+=intBase; if(bM>maxBaseYrs) maxBaseYrs=bM; }
                const wE=e*1.0833, v2=1-(p*r)/wE;
                wM = v2>0 ? -Math.log(v2)/Math.log(1+r) : 999;
                const intAcc = (wM*wE)-p;
                if(v2>0){ accTotalInt+=intAcc; if(wM>maxAccYrs) maxAccYrs=wM; }
            }
            const emiPct = income>0?Math.round((e/income)*100):0;
            amBody += `<tr style="border-bottom:1px solid #f1f5f9;">
                <td style="padding:9px 10px;font-weight:600;">${d.n||d.name||'Loan'}</td>
                <td style="padding:9px 10px;">${formatCurrency(p)}</td>
                <td style="padding:9px 10px;">${formatCurrency(e)}/mo<span style="font-size:11px;color:#94a3b8;"> (${emiPct}% of income)</span></td>
                <td style="padding:9px 10px;">${rt}% p.a.</td>
                <td style="padding:9px 10px;">${bM>0?(bM/12).toFixed(1)+' yrs':'—'}</td>
                <td style="padding:9px 10px;color:#059669;font-weight:700;">${wM>0?(wM/12).toFixed(1)+' yrs':'—'}</td>
            </tr>`;
        });
        const intSaved = Math.max(0, baseTotalInt-accTotalInt);
        const yrsSaved = Math.max(0, (maxBaseYrs-maxAccYrs)/12);
        if (intSaved > 0) {
            document.getElementById('pdf-ego-text').innerHTML = `By paying just 1 extra EMI per year on each loan, you will clear your debt ${yrsSaved.toFixed(1)} years earlier and avoid handing over ${formatCurrency(intSaved)} in interest to the banks!`;
            document.getElementById('pdf-ego-interest').innerText = formatCurrency(intSaved);
            document.getElementById('pdf-ego-years').innerText = `${yrsSaved.toFixed(1)} Years`;
            document.getElementById('pdf-ego-section').style.display = 'block';
        } else { document.getElementById('pdf-ego-section').style.display = 'none'; }
    }
    document.getElementById('pdf-amort-body').innerHTML = amBody;

    // ── SECTION G: 10-YEAR PROJECTION ──
    const fiTarget = exp * 12 * 25;
    let corpus = assets, monthlySIP = sip, projBody = '';
    const mr = (cagr/100)/12;
    for (let yr=1; yr<=10; yr++) {
        for (let mo=0; mo<12; mo++) corpus = corpus*(1+mr) + monthlySIP;
        if (stepUp > 0 && yr < 10) monthlySIP *= (1 + stepUp/100);
        const fiPct = fiTarget>0 ? Math.min(100,Math.round(corpus/fiTarget*100)) : 0;
        const rowBg = yr%2===0?'background:#f8fafc;':'';
        projBody += `<tr style="${rowBg}border-bottom:1px solid #f1f5f9;">
            <td style="padding:8px 10px;font-weight:600;">Year ${yr} (${new Date().getFullYear()+yr})</td>
            <td style="padding:8px 10px;font-weight:700;color:#059669;">${formatCurrency(Math.round(corpus))}</td>
            <td style="padding:8px 10px;">${formatCurrency(Math.round(monthlySIP))}/mo</td>
            <td style="padding:8px 10px;"><span style="background:${fiPct>=100?'#d1fae5':fiPct>=50?'#dbeafe':'#f1f5f9'};color:${fiPct>=100?'#065f46':fiPct>=50?'#1e40af':'#475569'};padding:2px 8px;border-radius:12px;font-size:11px;font-weight:700;">${fiPct}%${fiPct>=100?' 🎉 FINANCIALLY FREE':''}</span></td>
        </tr>`;
    }
    document.getElementById('pdf-projection-body').innerHTML = projBody;

    // ── SECTION H: LIFESTYLE INTELLIGENCE ──
    (function buildLifestyleSection() {
        const el = document.getElementById('pdf-lifestyle');
        if (!el) return;

        // ── CREDIT CARD ELIGIBILITY ──────────────────────────────────
        // Rule: bank typically approves limit = 2–3× monthly income for salaried
        const estCCLimit = Math.round(income * 2.5);

        // Tier the right card based on income
        let ccRec, ccWhy, ccWarn;
        if (income >= 200000) {
            ccRec = 'HDFC Infinia / Axis Magnus / Amex Platinum';
            ccWhy = `Super-premium cards — unlimited lounge access, 5× rewards, concierge service. Your income (${formatCurrency(income)}/mo) easily qualifies. Estimated limit: ${formatCurrency(estCCLimit)}+.`;
            ccWarn = 'Use for all monthly expenses and pay full balance every month to earn maximum rewards.';
        } else if (income >= 100000) {
            ccRec = 'HDFC Regalia / Axis Bank Select / SBI SimplyCLICK';
            ccWhy = `Mid-premium cards — airport lounge access, 4× rewards on dining & travel, milestone benefits. Estimated limit: ${formatCurrency(estCCLimit)}.`;
            ccWarn = 'Never revolve the balance. At 36–42% p.a. interest, credit card debt is the most toxic debt in India.';
        } else if (income >= 50000) {
            ccRec = 'SBI SimplySAVE / ICICI Amazon Pay / Flipkart Axis';
            ccWhy = `Entry-to-mid cards — good cashback on daily spends (groceries, fuel, online). Estimated limit: ${formatCurrency(estCCLimit)}.`;
            ccWarn = 'Strictly use only for planned purchases you can pay in full each month. Avoid EMI conversions.';
        } else if (income >= 25000) {
            ccRec = 'IDFC FIRST WOW (lifetime free) / AU Bank LIT';
            ccWhy = `Zero-fee starter cards — cashback on everyday spends. Estimated limit: ${formatCurrency(estCCLimit)}.`;
            ccWarn = 'With a tight budget, a credit card is a risk unless you are very disciplined. Consider a secured FD-backed card first.';
        } else {
            ccRec = 'Secured card (FD-backed) — e.g. SBI Unnati or Kotak 811';
            ccWhy = `Your income is below ₹25,000/month. A secured card (backed by a fixed deposit) is the safest way to build credit history without risk.`;
            ccWarn = 'Focus on income growth and emergency fund first before taking on any credit products.';
        }

        // ── CAR AFFORDABILITY ─────────────────────────────────────────
        // Rule: Car EMI should not exceed 15% of income. Loan = 80% of car price.
        // Max EMI = income * 0.15. At 9% for 5 yrs: max loan = EMI / 0.02076 (approx factor)
        const maxCarEMI = Math.round(income * 0.15);
        const loanFactor = 0.02076; // approx monthly factor for 9% 5yr loan
        const maxCarLoan = Math.round(maxCarEMI / loanFactor);
        const maxCarPrice = Math.round(maxCarLoan / 0.8); // 20% down payment
        const onRoadFactor = 1.15; // approx on-road vs ex-showroom

        let carRec, carModel, carMaintain, carWarn;
        if (maxCarPrice >= 2500000) {
            carRec = 'Premium segment (₹25L–50L ex-showroom)';
            carModel = 'Hyundai Creta N-Line, Tata Harrier, MG Hector Plus, Honda City Hybrid';
            carMaintain = `Monthly cost estimate: EMI ~${formatCurrency(maxCarEMI)} + fuel ~₹8,000 + insurance ~₹3,500 + maintenance ~₹2,000 = ~${formatCurrency(maxCarEMI+13500)}/month total.`;
        } else if (maxCarPrice >= 1200000) {
            carRec = 'Mid segment (₹12L–25L ex-showroom)';
            carModel = 'Maruti Suzuki Grand Vitara, Hyundai Venue, Tata Nexon EV, Honda Amaze';
            carMaintain = `Monthly cost estimate: EMI ~${formatCurrency(maxCarEMI)} + fuel ~₹6,000 + insurance ~₹2,500 + maintenance ~₹1,500 = ~${formatCurrency(maxCarEMI+10000)}/month total.`;
        } else if (maxCarPrice >= 600000) {
            carRec = 'Entry segment (₹6L–12L ex-showroom)';
            carModel = 'Maruti Suzuki Swift / Dzire, Tata Tiago, Hyundai i20, Renault Triber';
            carMaintain = `Monthly cost estimate: EMI ~${formatCurrency(maxCarEMI)} + fuel ~₹4,500 + insurance ~₹1,800 + maintenance ~₹1,000 = ~${formatCurrency(maxCarEMI+7300)}/month total.`;
        } else if (maxCarPrice >= 300000) {
            carRec = 'Budget segment (₹3L–6L ex-showroom)';
            carModel = 'Maruti Suzuki Alto K10 / S-Presso, Tata Punch, Renault Kwid';
            carMaintain = `Monthly cost estimate: EMI ~${formatCurrency(maxCarEMI)} + fuel ~₹3,500 + insurance ~₹1,200 + maintenance ~₹800 = ~${formatCurrency(maxCarEMI+5500)}/month total.`;
        } else {
            carRec = 'Not recommended right now';
            carModel = 'Consider a two-wheeler or public transport instead';
            carMaintain = `A car EMI + running costs would exceed 25%+ of your income at this stage. It will significantly slow wealth building.`;
        }

        const totalCarCost = maxCarEMI + (maxCarPrice >= 1200000 ? 10000 : maxCarPrice >= 600000 ? 7300 : 5500);
        const carIncPct = Math.round(totalCarCost / income * 100);
        carWarn = liab > income * 3
            ? `⚠️ You already have significant debt (${formatCurrency(liab)}). Adding a car loan now is not advisable. Clear existing loans first.`
            : carIncPct > 30
            ? `⚠️ Total car cost would be ${carIncPct}% of income — above the healthy 20% limit. Consider a lower segment or wait 12 months.`
            : `✅ A car in this segment is within your budget at ${carIncPct}% of income — but only if your emergency fund is intact and SIP is running.`;

        // ── RENT / HOME AFFORDABILITY ──────────────────────────────────
        const maxRent = Math.round(income * 0.30);
        const maxHomeLoan = Math.round((income * 0.40) / loanFactor); // 40% EMI on 20yr loan
        const maxHomePrice = Math.round(maxHomeLoan / 0.80);
        let homeRec, homeWarn;
        if (maxHomePrice >= 8000000) {
            homeRec = `You can afford a home loan up to ~${formatCurrency(maxHomeLoan)} (price ~${formatCurrency(maxHomePrice)} with 20% down). This covers most Tier-1 city apartments.`;
        } else if (maxHomePrice >= 3000000) {
            homeRec = `You can afford a home loan up to ~${formatCurrency(maxHomeLoan)} (price ~${formatCurrency(maxHomePrice)}). Good for Tier-2 cities or outskirts of metros.`;
        } else {
            homeRec = `Home loan affordability is limited (~${formatCurrency(maxHomeLoan)}). Build income and savings for 2–3 more years before taking a home loan.`;
        }
        homeWarn = `Max comfortable rent: ${formatCurrency(maxRent)}/month (30% of income rule). Going above this strains all other financial goals.`;

        // ── VACATION / LIFESTYLE SPEND ──────────────────────────────────
        const annualVacBudget = Math.round(surplus * 12 * 0.10);
        let vacRec;
        if (annualVacBudget >= 200000) vacRec = `International holiday (Southeast Asia, Europe budget trip) — ₹${(annualVacBudget/1000).toFixed(0)}K/year is realistic without touching investments.`;
        else if (annualVacBudget >= 80000) vacRec = `Domestic trip (Goa, Manali, Kerala, Rajasthan) or budget international (Thailand, Bali) — ₹${(annualVacBudget/1000).toFixed(0)}K/year.`;
        else if (annualVacBudget >= 30000) vacRec = `Weekend trips and short domestic getaways — ₹${(annualVacBudget/1000).toFixed(0)}K/year. Skip international travel until surplus improves.`;
        else vacRec = `Vacations should wait until your surplus improves. Even ₹10,000/month more surplus opens up real options.`;

        // ── RENDER ──────────────────────────────────────────────────────
        const S = (label, color) => `<div style="display:inline-block;padding:2px 9px;border-radius:12px;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:0.5px;background:${color==='g'?'#d1fae5':color==='y'?'#fef3c7':'#fee2e2'};color:${color==='g'?'#065f46':color==='y'?'#92400e':'#991b1b'};">${label}</div>`;
        const block = (icon, title, statusColor, main, sub, warn) => `
          <div style="border:1px solid #e2e8f0;border-radius:10px;padding:14px 16px;margin-bottom:12px;">
            <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;">
              <span style="font-size:20px;">${icon}</span>
              <span style="font-size:13px;font-weight:800;color:#1e293b;">${title}</span>
              ${S(statusColor==='g'?'Good fit':statusColor==='y'?'Caution':'Not yet', statusColor)}
            </div>
            <div style="font-size:13px;font-weight:700;color:#0f172a;margin-bottom:4px;">${main}</div>
            <div style="font-size:12.5px;color:#475569;margin-bottom:6px;line-height:1.6;">${sub}</div>
            <div style="font-size:12px;color:${warn.startsWith('✅')?'#166534':warn.startsWith('⚠️')?'#92400e':'#374151'};background:${warn.startsWith('✅')?'#f0fdf4':warn.startsWith('⚠️')?'#fffbeb':'#f8fafc'};border-radius:6px;padding:7px 10px;line-height:1.5;">${warn}</div>
          </div>`;

        const ccStatus = income >= 50000 ? 'g' : income >= 25000 ? 'y' : 'r';
        const carStatus = liab > income*3 ? 'r' : carIncPct <= 25 ? 'g' : 'y';
        const homeStatus = maxHomePrice >= 3000000 ? 'g' : maxHomePrice >= 1500000 ? 'y' : 'r';
        const vacStatus = annualVacBudget >= 80000 ? 'g' : annualVacBudget >= 30000 ? 'y' : 'r';

        el.innerHTML =
          block('💳', 'Credit Card', ccStatus,
            ccRec,
            ccWhy,
            ccWarn) +
          block('🚗', 'Car You Can Afford', carStatus,
            `${carRec} — e.g. ${carModel}`,
            carMaintain,
            carWarn) +
          block('🏠', 'Rent & Home Loan', homeStatus,
            homeRec,
            homeWarn,
            `✅ Tip: Never buy a home just because you can afford the EMI. Make sure you have 20% down payment saved in addition to your emergency fund and SIPs running.`) +
          block('✈️', 'Vacation Budget', vacStatus,
            vacRec,
            `Based on 10% of your annual surplus (${formatCurrency(surplus * 12)}).`,
            `✅ Always book travel from your surplus — never skip SIP or dip into emergency fund for a holiday.`);
    })();

    // Also keep old status fields populated for backward compat
    const cfStatEl = document.getElementById('pdf-cf-stat');
    if (cfStatEl) { cfStatEl.innerText = m.cfStat||''; cfStatEl.style.color = (m.cfStat||'').includes('Negative')?'#dc2626':'#059669'; }
    const safeEl = document.getElementById('pdf-safe-stat');
    if (safeEl) { safeEl.innerText = m.safeStat||''; safeEl.style.color = (m.safeStat||'').includes('At-Risk')?'#dc2626':'#059669'; }
    const liaEl = document.getElementById('pdf-lia-stat');
    if (liaEl) { liaEl.innerText = m.liaStat||''; liaEl.style.color = (m.liaStat||'').includes('CRIT')?'#dc2626':'#059669'; }
    const nextEl = document.getElementById('pdf-next-stat');
    if (nextEl) nextEl.innerText = m.nextMilestone||'';

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
    rows.push(['Emergency fund I need (₹)', fmt((m.income || 0) * 6), '', '']);
    rows.push(['Months of salary covered', '6 months of salary', '', '']);
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

// ══════════════════════════════════════════════════════════════════════════════
// CHILD PLANNING ENGINE
// City-tier adjusted costs, SSY / PPF / ELSS / Index SIP recommendations
// ══════════════════════════════════════════════════════════════════════════════

// Education cost tables (today's cost in ₹)
const CHILD_EDU_COSTS = {
    tier1: { eng: 2500000, med: 8000000, general: 800000, mba: 2500000 },
    tier2: { eng: 1200000, med: 5000000, general: 400000, mba: 800000 },
    tier3: { eng: 600000,  med: 3000000, general: 200000, mba: 400000 }
};

const CHILD_MARRIAGE_COSTS = { tier1: 2500000, tier2: 1500000, tier3: 800000 };

// Scheme constants
const SSY_RATE      = 8.2  / 100;  // SSY p.a. (EEE, girl ≤10, deposit for 15 yrs, matures at 21)
const PPF_RATE      = 7.1  / 100;  // PPF p.a. (EEE, lock-in 15 yrs)
const ELSS_RATE     = 12.0 / 100;  // ELSS equity CAGR (80C + 3 yr lock)
const INDEX_RATE    = 12.0 / 100;  // Index fund CAGR
const DEBT_FD_RATE  = 6.5  / 100;  // FD / Liquid fund (short-term)
const EDU_INFLATION = 8.0  / 100;  // Education inflation p.a.
const MAX_SSY_MONTH = 12500;       // ₹1.5L/year = ₹12,500/month
const MAX_PPF_MONTH = 12500;       // ₹1.5L/year = ₹12,500/month

/** Future value of a lump-sum */
function fvLump(pv, rate, years) {
    return pv * Math.pow(1 + rate, years);
}

/** Future value of monthly SIP — proper monthly compounding */
function fvMonthlySIP(monthlyAmt, annualRate, months) {
    if (months <= 0 || monthlyAmt <= 0) return 0;
    const r = annualRate / 12;
    if (r === 0) return monthlyAmt * months;
    return monthlyAmt * ((Math.pow(1 + r, months) - 1) / r) * (1 + r);
}

/** Required monthly SIP to reach a future corpus (monthly compounding) */
function reqMonthlySIP(target, annualRate, months) {
    if (months <= 0 || target <= 0) return 0;
    const r = annualRate / 12;
    if (r === 0) return target / months;
    return target / (((Math.pow(1 + r, months) - 1) / r) * (1 + r));
}

/** Future value of an annual SIP (end-of-year) — kept for legacy */
function fvAnnualSIP(annualAmt, rate, years) {
    if (rate === 0) return annualAmt * years;
    return annualAmt * ((Math.pow(1 + rate, years) - 1) / rate) * (1 + rate);
}

/**
 * Horizon-based allocation: returns fraction of budget for each bucket.
 * Short horizon → more debt/liquid; long horizon → more equity.
 */
function getHorizonAllocation(years) {
    if (years < 3)  return { equity: 0.00, ppf: 0.00, debt: 1.00 };
    if (years < 5)  return { equity: 0.20, ppf: 0.45, debt: 0.35 };
    if (years < 8)  return { equity: 0.40, ppf: 0.45, debt: 0.15 };
    if (years < 12) return { equity: 0.55, ppf: 0.40, debt: 0.05 };
    return             { equity: 0.65, ppf: 0.35, debt: 0.00 };
}

/** Fmt a monthly amount cleanly */
function fmtM(n) { return '₹' + Math.round(n).toLocaleString('en-IN'); }

/** Add a child row dynamically */
function addChildRow() {
    const c = document.getElementById('child-container');
    if (!c) return;
    const id = 'child_' + Date.now();
    const div = document.createElement('div');
    div.className = 'dy-row dy-child';
    div.id = id;
    div.innerHTML = `
        <div class="dy-row-fields" style="flex-wrap:wrap; gap:10px;">
            <div class="form-group" style="flex:1; min-width:130px;">
                <label>Child's Name</label>
                <input type="text" class="child-name" placeholder="e.g. Aarav" value="">
            </div>
            <div class="form-group" style="flex:1; min-width:110px;">
                <label>Gender</label>
                <select class="child-gender">
                    <option value="boy">👦 Boy</option>
                    <option value="girl">👧 Girl</option>
                </select>
            </div>
            <div class="form-group" style="flex:1; min-width:100px;">
                <label>Current Age</label>
                <input type="number" class="child-age" placeholder="e.g. 3" value="3" min="0" max="17">
            </div>
            <div class="form-group" style="flex:1; min-width:150px;">
                <label>Education Goal</label>
                <select class="child-edu">
                    <option value="eng">🛠️ Engineering (UG)</option>
                    <option value="med">🩺 Medicine (MBBS)</option>
                    <option value="general">📚 General Graduate</option>
                    <option value="mba">💼 MBA / Management</option>
                </select>
            </div>
            <div class="form-group" style="flex:1; min-width:150px; display:flex; flex-direction:column; justify-content:flex-end;">
                <label style="display:flex; align-items:center; gap:8px; cursor:pointer; padding: 10px 0 6px;">
                    <input type="checkbox" class="child-marriage" checked style="width:16px;height:16px;accent-color:#a855f7;">
                    Include Marriage Planning
                </label>
            </div>
            <div style="display:flex; align-items:flex-end; padding-bottom:2px;">
                <button class="del-row-btn" onclick="document.getElementById('${id}').remove()" title="Remove this child">
                    <i data-lucide="trash-2"></i>
                </button>
            </div>
        </div>`;
    c.appendChild(div);
    lucide.createIcons();
}

/** Main child planning computation — improved with monthly compounding + horizon allocation */
function computeChildPlan() {
    const tier    = (document.getElementById('child-city-tier')?.value) || 'tier2';
    const budget  = parseFloat(document.getElementById('child-budget')?.value) || 10000;
    const rows    = document.querySelectorAll('.dy-child');
    const results = document.getElementById('child-results');

    if (!results) return;

    if (rows.length === 0) {
        results.style.display = 'block';
        results.innerHTML = `<div class="app-card" style="text-align:center; padding:24px; color:rgba(255,255,255,0.5);">
            👶 Please add at least one child above, then tap <strong>Plan My Child's Future</strong>.
        </div>`;
        return;
    }

    const eduCosts     = CHILD_EDU_COSTS[tier];
    const marriageCost = CHILD_MARRIAGE_COSTS[tier];

    let cardsHTML = '';
    let grandTotalRequired = 0, grandTotalBudget = budget * rows.length;

    rows.forEach(row => {
        const name        = row.querySelector('.child-name')?.value?.trim() || 'Your Child';
        const gender      = row.querySelector('.child-gender')?.value || 'boy';
        const ageNow      = parseFloat(row.querySelector('.child-age')?.value) || 0;
        const eduType     = row.querySelector('.child-edu')?.value || 'eng';
        const inclMarr    = row.querySelector('.child-marriage')?.checked ?? true;
        const isGirl      = gender === 'girl';
        const genderEmoji = isGirl ? '👧' : '👦';

        // ── Timelines ──
        const eduStartAge  = eduType === 'mba' ? 22 : 18;
        const yearsToEdu   = Math.max(1, eduStartAge - ageNow);
        const monthsToEdu  = yearsToEdu * 12;
        const marriageAge  = isGirl ? 28 : 30;
        const yearsToMarr  = Math.max(1, marriageAge - ageNow);
        const monthsToMarr = yearsToMarr * 12;

        // ── Inflated target costs ──
        const todayCost   = eduCosts[eduType];
        const inflatedEdu = fvLump(todayCost, EDU_INFLATION, yearsToEdu);
        const inflatedMarr = inclMarr ? fvLump(marriageCost, EDU_INFLATION, yearsToMarr) : 0;
        const totalTarget  = inflatedEdu + inflatedMarr;

        // ── SSY eligibility ──
        // Girl ≤ 10 yrs: deposit allowed for 15 years, account matures at 21
        const ssyEligible   = isGirl && ageNow <= 10;
        const ssyDepositMon = ssyEligible ? Math.min(15 * 12, (21 - ageNow) * 12) : 0;
        const ssyGrowthMon  = ssyEligible ? Math.max(0, (21 - ageNow) * 12 - ssyDepositMon) : 0;

        // ── Scheme allocation ──
        // Budget split: 70% for education, 30% for marriage (if included)
        const eduBudget  = inclMarr ? budget * 0.70 : budget;
        const marrBudget = inclMarr ? budget * 0.30 : 0;

        const alloc = getHorizonAllocation(yearsToEdu);
        let schemes = [];
        let ssyMonthly = 0, ppfMonthly = 0, elssMonthly = 0, debtMonthly = 0, marrElssMonthly = 0;
        let ssyCorpus = 0, ppfCorpus = 0, elssCorpus = 0, debtCorpus = 0, marrElssCorpus = 0;

        let eduLeft = eduBudget;

        // 1️⃣ SSY — priority for eligible girls (best EEE rate, fully guaranteed)
        if (ssyEligible && eduLeft > 0) {
            ssyMonthly = Math.min(MAX_SSY_MONTH, eduLeft);
            // FV of monthly deposits for deposit period
            const depositCorpus = fvMonthlySIP(ssyMonthly, SSY_RATE, ssyDepositMon);
            // Then grows without new deposits until maturity (compounded annually simplified)
            ssyCorpus = ssyGrowthMon > 0
                ? depositCorpus * Math.pow(1 + SSY_RATE, ssyGrowthMon / 12)
                : depositCorpus;
            eduLeft -= ssyMonthly;
            schemes.push({
                name: 'Sukanya Samriddhi Yojana (SSY)', rate: '8.2%', tax: 'EEE — Zero Tax',
                monthly: ssyMonthly, corpus: ssyCorpus, color: '#ec4899', icon: '🌸',
                tag: '🏅 Best for girl child',
                note: `Deposit ${fmtM(ssyMonthly)}/mo for ${Math.round(ssyDepositMon/12)} yrs · Matures at age 21 · Backed by Govt of India`
            });
        }

        // 2️⃣ PPF — stable EEE, good for medium-long horizon
        if (eduLeft > 0 && alloc.ppf > 0) {
            ppfMonthly = Math.min(MAX_PPF_MONTH, Math.round(eduBudget * alloc.ppf));
            ppfMonthly = Math.min(ppfMonthly, eduLeft);
            ppfCorpus  = fvMonthlySIP(ppfMonthly, PPF_RATE, monthsToEdu);
            eduLeft   -= ppfMonthly;
            schemes.push({
                name: 'PPF (Public Provident Fund)', rate: '7.1%', tax: 'EEE — Zero Tax',
                monthly: ppfMonthly, corpus: ppfCorpus, color: '#3b82f6', icon: '🏛️',
                tag: '✅ Tax-free safe returns',
                note: `${fmtM(ppfMonthly)}/mo · 80C benefit up to ₹1.5L/yr · Can extend in 5-yr blocks after 15 yrs`
            });
        }

        // 3️⃣ ELSS / Index — equity growth for education (if horizon > 5 yrs)
        if (eduLeft > 0 && alloc.equity > 0 && yearsToEdu >= 5) {
            elssMonthly = Math.round(eduLeft * (alloc.equity / (alloc.equity + alloc.debt + 0.001)));
            elssMonthly = Math.min(elssMonthly, eduLeft);
            elssCorpus  = fvMonthlySIP(elssMonthly, ELSS_RATE, monthsToEdu);
            eduLeft    -= elssMonthly;
            schemes.push({
                name: 'ELSS / Index Fund SIP', rate: '12% (est.)', tax: '10% LTCG on gains > ₹1L',
                monthly: elssMonthly, corpus: elssCorpus, color: '#10b981', icon: '📈',
                tag: '🚀 High growth engine',
                note: `${fmtM(elssMonthly)}/mo · ELSS = 80C + equity upside · 3-yr lock-in only`
            });
        }

        // 4️⃣ Debt / Liquid FD — remaining or short-horizon bucket
        if (eduLeft > 0) {
            debtMonthly = eduLeft;
            debtCorpus  = fvMonthlySIP(debtMonthly, DEBT_FD_RATE, monthsToEdu);
            eduLeft      = 0;
            if (yearsToEdu < 5) {
                schemes.push({
                    name: 'Fixed Deposit / Liquid Fund', rate: '6.5%', tax: 'Taxable at slab',
                    monthly: debtMonthly, corpus: debtCorpus, color: '#f59e0b', icon: '💰',
                    tag: '🛡️ Capital safety',
                    note: `${fmtM(debtMonthly)}/mo · Short horizon → capital protection matters more than growth`
                });
            } else {
                schemes.push({
                    name: 'Fixed Deposit (Residual)', rate: '6.5%', tax: 'Taxable at slab',
                    monthly: debtMonthly, corpus: debtCorpus, color: '#f59e0b', icon: '💰',
                    tag: '🛡️ Residual safety buffer',
                    note: `${fmtM(debtMonthly)}/mo · Remaining funds in stable FD as safety margin`
                });
            }
        }

        // 5️⃣ Marriage fund — separate equity SIP (longer horizon, all equity)
        if (inclMarr && marrBudget > 0) {
            marrElssMonthly = marrBudget;
            marrElssCorpus  = fvMonthlySIP(marrElssMonthly, INDEX_RATE, monthsToMarr);
            schemes.push({
                name: 'Marriage Fund — Index SIP', rate: '12% (est.)', tax: '10% LTCG on gains > ₹1L',
                monthly: marrElssMonthly, corpus: marrElssCorpus, color: '#a855f7', icon: '💍',
                tag: '💜 Marriage corpus',
                note: `${fmtM(marrElssMonthly)}/mo · ${yearsToMarr} yr horizon · Inflation-adjusted target: ${formatCurrency(inflatedMarr)}`
            });
        }

        // ── Totals ──
        const eduProjected  = ssyCorpus + ppfCorpus + elssCorpus + debtCorpus;
        const marrProjected = marrElssCorpus;
        const totalProjected = eduProjected + marrProjected;
        const isEduOnTrack   = eduProjected  >= inflatedEdu;
        const isMarrOnTrack  = !inclMarr || marrProjected >= inflatedMarr;
        const isOnTrack      = isEduOnTrack && isMarrOnTrack;

        // Required min monthly SIP for education (blended rate based on horizon)
        const blendedRate  = alloc.equity * ELSS_RATE + alloc.ppf * PPF_RATE + alloc.debt * DEBT_FD_RATE;
        const reqEduMonSIP = reqMonthlySIP(inflatedEdu, blendedRate, monthsToEdu);
        const reqMarrMonSIP = inclMarr ? reqMonthlySIP(inflatedMarr, INDEX_RATE, monthsToMarr) : 0;
        const reqTotalSIP  = reqEduMonSIP + reqMarrMonSIP;
        grandTotalRequired += reqTotalSIP;

        // Coverage pct
        const eduPct  = Math.min(100, Math.round((eduProjected / inflatedEdu) * 100));
        const marrPct = inclMarr && inflatedMarr > 0 ? Math.min(100, Math.round((marrProjected / inflatedMarr) * 100)) : 100;

        // Tax saving from 80C instruments
        const tax80C = Math.min(150000, (ssyMonthly + ppfMonthly + elssMonthly) * 12);
        const taxSaved = Math.round(tax80C * 0.30); // assume 30% slab

        // Scheme card HTML
        const schemeCards = schemes.map(s => `
            <div class="child-scheme-card" style="border-left:3px solid ${s.color};">
                <div style="display:flex; align-items:center; gap:8px; margin-bottom:4px; flex-wrap:wrap;">
                    <span style="font-size:18px;">${s.icon}</span>
                    <div style="flex:1;">
                        <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
                            <span style="font-weight:600; font-size:13px; color:#fff;">${s.name}</span>
                            <span style="font-size:10px; color:${s.color}; background:${s.color}18; padding:2px 8px; border-radius:10px;">${s.tag}</span>
                        </div>
                        <div style="font-size:11px; color:rgba(255,255,255,0.4); margin-top:2px;">${s.rate} · ${s.tax}</div>
                    </div>
                </div>
                <div style="font-size:12px; color:rgba(255,255,255,0.65); margin-bottom:8px; line-height:1.5;">${s.note}</div>
                <div style="display:flex; gap:16px; flex-wrap:wrap;">
                    <div><div style="font-size:10px; color:rgba(255,255,255,0.4);">Monthly SIP</div><div style="color:${s.color}; font-weight:800; font-size:16px;">${fmtM(s.monthly)}</div></div>
                    <div><div style="font-size:10px; color:rgba(255,255,255,0.4);">Projected Corpus</div><div style="color:#fff; font-weight:700; font-size:14px;">${formatCurrency(s.corpus)}</div></div>
                </div>
            </div>`).join('');

        // Gap callouts
        const eduGapAmt  = Math.max(0, inflatedEdu - eduProjected);
        const marrGapAmt = inclMarr ? Math.max(0, inflatedMarr - marrProjected) : 0;
        const gapHtml = (!isEduOnTrack || !isMarrOnTrack) ? `
            <div style="margin-top:8px; display:flex; flex-direction:column; gap:6px;">
                ${!isEduOnTrack ? `<div style="padding:8px 12px; background:rgba(239,68,68,0.1); border:1px solid rgba(239,68,68,0.2); border-radius:8px; font-size:12px; color:#ef4444;">
                    📚 Education gap: <strong>${formatCurrency(eduGapAmt)}</strong> — increase education SIP by <strong>${fmtM(reqEduMonSIP - eduBudget)}/mo</strong> to fully cover it.
                </div>` : ''}
                ${inclMarr && !isMarrOnTrack ? `<div style="padding:8px 12px; background:rgba(168,85,247,0.1); border:1px solid rgba(168,85,247,0.2); border-radius:8px; font-size:12px; color:#a855f7;">
                    💍 Marriage gap: <strong>${formatCurrency(marrGapAmt)}</strong> — increase marriage SIP by <strong>${fmtM(reqMarrMonSIP - marrBudget)}/mo</strong>.
                </div>` : ''}
            </div>` : `<div style="margin-top:8px; padding:8px 12px; background:rgba(16,185,129,0.1); border:1px solid rgba(16,185,129,0.2); border-radius:8px; font-size:12px; color:#10b981;">
                ✅ Your current budget fully covers ${name}'s ${inclMarr ? 'education + marriage' : 'education'} — you're on track!
            </div>`;

        cardsHTML += `
        <div class="child-result-card">

            <!-- Header -->
            <div class="child-result-header">
                <div style="font-size:36px; line-height:1;">${genderEmoji}</div>
                <div style="flex:1;">
                    <div style="font-size:19px; font-weight:800; color:#fff;">${name}</div>
                    <div style="font-size:12px; color:rgba(255,255,255,0.45); margin-top:2px;">
                        ${isGirl ? 'Girl' : 'Boy'} · Age ${ageNow} · ${eduType === 'eng' ? 'Engineering (UG)' : eduType === 'med' ? 'Medicine (MBBS)' : eduType === 'mba' ? 'MBA' : 'General Graduate'} · Education in <strong style="color:#fff;">${yearsToEdu} yrs</strong>
                    </div>
                </div>
                <div class="child-track-badge" style="background:${isOnTrack ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)'}; color:${isOnTrack ? '#10b981' : '#ef4444'}; border:1px solid ${isOnTrack ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'};">
                    ${isOnTrack ? '✅ On Track' : '⚠️ Gap Exists'}
                </div>
            </div>

            <!-- Targets vs Projected -->
            <div class="child-cost-row">
                <div class="child-cost-item">
                    <div class="child-cost-label">Education Cost (Today)</div>
                    <div class="child-cost-val">${formatCurrency(todayCost)}</div>
                </div>
                <div class="child-cost-item">
                    <div class="child-cost-label">Target with 8% Inflation</div>
                    <div class="child-cost-val" style="color:#f59e0b;">${formatCurrency(inflatedEdu)}</div>
                </div>
                <div class="child-cost-item">
                    <div class="child-cost-label">Education Corpus Built</div>
                    <div class="child-cost-val" style="color:${isEduOnTrack ? '#10b981' : '#ef4444'};">${formatCurrency(eduProjected)}</div>
                </div>
                ${inclMarr ? `
                <div class="child-cost-item">
                    <div class="child-cost-label">Marriage Corpus Built</div>
                    <div class="child-cost-val" style="color:${isMarrOnTrack ? '#10b981' : '#a855f7'};">${formatCurrency(marrProjected)}</div>
                </div>
                <div class="child-cost-item">
                    <div class="child-cost-label">Marriage Target</div>
                    <div class="child-cost-val" style="color:#a855f7;">${formatCurrency(inflatedMarr)}</div>
                </div>` : ''}
            </div>

            <!-- Progress Bars -->
            <div style="margin:12px 0; display:flex; flex-direction:column; gap:8px;">
                <div>
                    <div style="display:flex; justify-content:space-between; font-size:11px; color:rgba(255,255,255,0.45); margin-bottom:4px;">
                        <span>📚 Education Coverage</span><span style="color:${isEduOnTrack ? '#10b981' : '#f59e0b'};">${eduPct}%</span>
                    </div>
                    <div style="height:7px; background:rgba(255,255,255,0.07); border-radius:4px; overflow:hidden;">
                        <div style="height:100%; width:${eduPct}%; background:${eduPct >= 100 ? '#10b981' : eduPct >= 70 ? '#f59e0b' : '#ef4444'}; border-radius:4px;"></div>
                    </div>
                </div>
                ${inclMarr ? `<div>
                    <div style="display:flex; justify-content:space-between; font-size:11px; color:rgba(255,255,255,0.45); margin-bottom:4px;">
                        <span>💍 Marriage Coverage</span><span style="color:${isMarrOnTrack ? '#10b981' : '#a855f7'};">${marrPct}%</span>
                    </div>
                    <div style="height:7px; background:rgba(255,255,255,0.07); border-radius:4px; overflow:hidden;">
                        <div style="height:100%; width:${marrPct}%; background:${marrPct >= 100 ? '#10b981' : '#a855f7'}; border-radius:4px;"></div>
                    </div>
                </div>` : ''}
            </div>

            ${ssyEligible ? `<div class="child-ssy-badge">🌸 <strong>SSY Eligible!</strong> ${name} qualifies for Sukanya Samriddhi Yojana — the highest government-guaranteed rate at 8.2% p.a., fully tax-free (EEE). Open at any Post Office or SBI branch with ${name}'s birth certificate.</div>` : ''}

            <!-- Scheme Recommendations -->
            <div style="font-size:11px; font-weight:700; color:rgba(255,255,255,0.4); text-transform:uppercase; letter-spacing:0.6px; margin:14px 0 8px;">📊 Your Recommended Monthly Plan</div>
            <div class="child-schemes-grid">${schemeCards}</div>

            <!-- SIP Summary + Gap -->
            <div class="child-sip-callout">
                <div style="display:flex; flex-wrap:wrap; gap:20px; justify-content:center; margin-bottom:12px;">
                    <div>
                        <div style="font-size:11px; color:rgba(255,255,255,0.4);">Min. Monthly for Education</div>
                        <div style="font-size:20px; font-weight:800; color:#a855f7;">${fmtM(reqEduMonSIP)}</div>
                    </div>
                    ${inclMarr ? `<div>
                        <div style="font-size:11px; color:rgba(255,255,255,0.4);">Min. Monthly for Marriage</div>
                        <div style="font-size:20px; font-weight:800; color:#7c3aed;">${fmtM(reqMarrMonSIP)}</div>
                    </div>` : ''}
                    <div>
                        <div style="font-size:11px; color:rgba(255,255,255,0.4);">Total Min. Monthly Needed</div>
                        <div style="font-size:20px; font-weight:800; color:#fff;">${fmtM(reqTotalSIP)}</div>
                    </div>
                    <div>
                        <div style="font-size:11px; color:rgba(255,255,255,0.4);">Your Budget</div>
                        <div style="font-size:20px; font-weight:800; color:${budget >= reqTotalSIP ? '#10b981' : '#ef4444'};">${fmtM(budget)}</div>
                    </div>
                </div>
                <div style="font-size:11px; color:rgba(255,255,255,0.35); margin-bottom:10px;">Blended return: ~${(blendedRate*100).toFixed(1)}% · ${yearsToEdu} yr horizon · 8% edu inflation</div>
                ${gapHtml}
            </div>

            <!-- Tax Saving Bonus -->
            ${tax80C > 0 ? `<div style="margin-top:10px; padding:10px 14px; background:rgba(16,185,129,0.07); border:1px solid rgba(16,185,129,0.2); border-radius:10px; font-size:12px; color:rgba(255,255,255,0.6); display:flex; gap:10px; align-items:center;">
                <span style="font-size:20px;">💡</span>
                <span>Annual <strong style="color:#10b981;">80C deduction: ${formatCurrency(tax80C)}</strong> from SSY + PPF + ELSS — saves you up to <strong style="color:#10b981;">₹${taxSaved.toLocaleString('en-IN')}/yr</strong> in tax (at 30% slab).</span>
            </div>` : ''}

        </div>`;
    });

    results.style.display = 'block';
    results.innerHTML = `
        <div style="font-size:13px; font-weight:700; color:rgba(255,255,255,0.4); text-transform:uppercase; letter-spacing:0.5px; margin-bottom:12px;">📊 Child Planning Results</div>
        ${cardsHTML}
        <div style="margin-top:16px; padding:14px 16px; background:rgba(168,85,247,0.07); border:1px solid rgba(168,85,247,0.2); border-radius:10px; font-size:12px; color:rgba(255,255,255,0.45); line-height:1.7;">
            💡 <strong>Assumptions:</strong> Returns are estimates — ELSS/Index at 12% CAGR, PPF at 7.1%, SSY at 8.2%, FD at 6.5%. Education inflation at 8% p.a. Marriage cost inflation at 8% p.a. SSY and PPF rates are revised quarterly by the government. Review your plan every 2 years. LTCG tax of 10% applies on equity gains above ₹1L per year.
        </div>`;

    results.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ── Auto-add one child row if container is empty when tab opens ──
document.addEventListener('DOMContentLoaded', () => {
    const childNav = document.getElementById('nav-child');
    if (childNav) {
        childNav.addEventListener('click', () => {
            const c = document.getElementById('child-container');
            if (c && c.children.length === 0) addChildRow();
        });
    }
});

// ══════════════════════════════════════════════════════════════════════════════
// LIFE JOURNEY SIMULATOR  —  Canvas-based, 60fps, parallax world
// ══════════════════════════════════════════════════════════════════════════════

// ── Scene palettes ────────────────────────────────────────────
const J2_SCENES = {
  'city-night':    { skyT:'#020617', skyB:'#1a1035', gndT:'#1f2937', gndB:'#0f172a', fogColor:'rgba(99,102,241,0.08)' },
  'city-dawn':     { skyT:'#1e1b4b', skyB:'#4338ca', gndT:'#374151', gndB:'#1f2937', fogColor:'rgba(99,102,241,0.06)' },
  'suburb-morning':{ skyT:'#0c4a6e', skyB:'#0284c7', gndT:'#166534', gndB:'#14532d', fogColor:'rgba(16,185,129,0.05)' },
  'suburb-day':    { skyT:'#1d4ed8', skyB:'#60a5fa', gndT:'#16a34a', gndB:'#15803d', fogColor:'rgba(59,130,246,0.05)' },
  'park':          { skyT:'#0369a1', skyB:'#38bdf8', gndT:'#15803d', gndB:'#166534', fogColor:'rgba(56,189,248,0.05)' },
  'park-golden':   { skyT:'#78350f', skyB:'#f59e0b', gndT:'#15803d', gndB:'#166534', fogColor:'rgba(245,158,11,0.10)' },
  'nature':        { skyT:'#1e3a8a', skyB:'#3b82f6', gndT:'#16a34a', gndB:'#15803d', fogColor:'rgba(96,165,250,0.04)' },
  'nature-golden': { skyT:'#9a3412', skyB:'#f97316', gndT:'#15803d', gndB:'#14532d', fogColor:'rgba(251,146,60,0.08)' },
  'beach':         { skyT:'#0369a1', skyB:'#7dd3fc', gndT:'#fef08a', gndB:'#ca8a04', fogColor:'rgba(125,211,252,0.08)' }
};

// ── Dynamic stage builder — reads real engineMemory ───────────
function buildJ2Stages() {
    const m   = (typeof engineMemory !== 'undefined' && engineMemory.totalAssets !== undefined) ? engineMemory : null;
    const age0   = parseInt(document.getElementById('u-age')?.value) || 28;
    const year0  = new Date().getFullYear();
    const corpus0 = m ? (m.fiCorpusBase || m.totalAssets || 0) : 0;
    const sip0    = m ? Math.max(0, m.sip || m.sumSurplus || 0) : 5000;
    const cagr    = ((m?.blendedCAGR) || 12) / 100;
    const stepUp  = ((m?.stepUpPercent) || 0) / 100;
    const mr      = cagr / 12;
    const exp     = (m?.totalExp)  || 50000;
    const income  = (m?.income)    || 100000;
    const fireTarget = exp * 12 * 25;

    function wealthAt(n) {
        if (n === 0) return corpus0;
        let c = corpus0, s = sip0;
        for (let i = 1; i <= n; i++) {
            if (i > 1 && (i - 1) % 12 === 0 && stepUp > 0) s *= (1 + stepUp);
            c = c * (1 + mr) + s;
        }
        return Math.max(0, c);
    }
    function sipAt(n) {
        let s = sip0;
        const years = Math.floor(n / 12);
        for (let i = 0; i < years; i++) s *= (1 + stepUp);
        return s;
    }
    function monthTo(target) {
        if (corpus0 >= target) return 0;
        if (sip0 <= 0 && mr <= 0) return 720;
        let c = corpus0, s = sip0;
        for (let i = 1; i <= 720; i++) {
            if (i > 1 && (i - 1) % 12 === 0 && stepUp > 0) s *= (1 + stepUp);
            c = c * (1 + mr) + s;
            if (c >= target) return i;
        }
        return 720;
    }
    function fiPct(w) { return fireTarget > 0 ? Math.min(100, Math.round(w / fireTarget * 100)) : 0; }

    // Key milestone months
    const M0 = 0;
    const M1 = monthTo(Math.max(exp * 6, corpus0 + 50000));
    const M2 = monthTo(Math.max(corpus0 * 3, 1000000));
    const M3 = monthTo(Math.max(corpus0 * 6, 5000000));
    const M4 = monthTo(Math.max(corpus0 * 12, 10000000));
    const M5 = monthTo(fireTarget * 0.25);
    const M6 = monthTo(fireTarget * 0.50);
    const M7 = monthTo(fireTarget * 0.75);
    const M8 = monthTo(fireTarget);

    function mk(months, extra) {
        const w = wealthAt(months);
        const s = months === 0 ? sip0 : sipAt(months);
        return { ...extra, wealth: Math.round(w), invest: Math.round(s), fiPct: fiPct(w),
                 age: age0 + Math.floor(months / 12), year: year0 + Math.floor(months / 12), months };
    }

    return [
      mk(M0, {
        id:0, emoji: corpus0 < 50000 ? '😤' : '🌱',
        title: corpus0 < 50000 ? 'The Rat Race' : 'Journey Begins',
        desc:  corpus0 < 50000 ? 'Salary gone by the 10th. Every month feels the same.'
                               : `You already have ${j2Fmt(corpus0)} working for you.`,
        tag: corpus0 < 50000 ? 'Rat Race' : 'Building',
        color:'#ef4444', scene:'city-night', mood: corpus0 < 50000 ? 'stressed' : 'neutral',
        shirt:'#374151', phoneColor:'#ef4444',
        events:[`💰 Net worth: ${j2Fmt(corpus0)}`, `📈 SIP: ${j2Fmt(sip0)}/mo`,
                `🎯 FI target: ${j2Fmt(fireTarget)}`, `🏦 Income: ${j2Fmt(income)}/mo`]
      }),
      mk(M1, {
        id:1, emoji:'🛡️', title:'Foundation Secured',
        desc:'6-month emergency fund done. Term insurance active. Real start.',
        tag:'Foundation', color:'#10b981', scene:'city-dawn', mood:'confident',
        shirt:'#065f46', phoneColor:'#34d399',
        events:[`🛡️ Emergency fund: ${j2Fmt(exp*6)}`, `📈 SIP: ${j2Fmt(sipAt(M1))}/mo`,
                `💰 Portfolio: ${j2Fmt(wealthAt(M1))}`, `🎯 FI: ${fiPct(wealthAt(M1))}% done`]
      }),
      mk(M2, {
        id:2, emoji:'📈', title:`${j2Fmt(wealthAt(M2))} Saved!`,
        desc:'Double digits. Compounding starting to feel very real.',
        tag:'Momentum', color:'#06b6d4', scene:'suburb-morning', mood:'confident',
        shirt:'#1d4ed8', phoneColor:'#38bdf8',
        events:[`💰 Portfolio: ${j2Fmt(wealthAt(M2))}`, `📈 SIP: ${j2Fmt(sipAt(M2))}/mo`,
                `🎯 FI: ${fiPct(wealthAt(M2))}% done`, `⏰ ${Math.floor(M2/12)} yrs of investing`]
      }),
      mk(M3, {
        id:3, emoji:'💍', title:'Life & Wealth Both Growing',
        desc:'Big milestones. Compound snowball is really rolling now.',
        tag:'New Chapter', color:'#a855f7', scene:'suburb-day', mood:'happy',
        shirt:'#6d28d9', phoneColor:'#a855f7', hasPartner:true,
        events:[`💰 Portfolio: ${j2Fmt(wealthAt(M3))}`, `📈 SIP: ${j2Fmt(sipAt(M3))}/mo`,
                `🎯 FI: ${fiPct(wealthAt(M3))}% done`, `😄 Life is genuinely good`]
      }),
      mk(M4, {
        id:4, emoji:'🎉', title: wealthAt(M4) >= 10000000 ? 'First ₹1 CRORE!' : `${j2Fmt(wealthAt(M4))} Milestone!`,
        desc:'8 digits. Compounding took over. You did this.',
        tag:'Milestone!', color:'#f59e0b', scene:'park-golden', mood:'ecstatic',
        shirt:'#92400e', phoneColor:'#fde68a', hasPartner:true, celebrate:true,
        hasBaby: M4 > 48,
        events:[`🏆 NET WORTH: ${j2Fmt(wealthAt(M4))}`, `🚀 SIP: ${j2Fmt(sipAt(M4))}/mo`,
                `🎯 FI: ${fiPct(wealthAt(M4))}% complete`, `📱 Portfolio check = pure joy`]
      }),
      mk(M5, {
        id:5, emoji:'🚀', title:'25% Financially Free',
        desc:'One quarter of your freedom fund locked in. Momentum is everything.',
        tag:'25% FI', color:'#3b82f6', scene:'park', mood:'happy',
        shirt:'#1d4ed8', phoneColor:'#93c5fd', hasPartner:true,
        events:[`💰 Corpus: ${j2Fmt(wealthAt(M5))}`, `🎯 Target: ${j2Fmt(fireTarget)}`,
                `📊 25% there — keep going!`, `📈 SIP: ${j2Fmt(sipAt(M5))}/mo`]
      }),
      mk(M6, {
        id:6, emoji:'🏠', title:'50% Financially Free',
        desc:'Halfway. The second half compounds faster. Feel the acceleration.',
        tag:'50% FI', color:'#10b981', scene:'nature', mood:'happy',
        shirt:'#064e3b', phoneColor:'#6ee7b7', hasPartner:true,
        events:[`💰 Corpus: ${j2Fmt(wealthAt(M6))}`, `⚡ Returns ≈ your salary now`,
                `🎯 Halfway to freedom!`, `📈 SIP: ${j2Fmt(sipAt(M6))}/mo`]
      }),
      mk(M7, {
        id:7, emoji:'🎓', title:'75% Financially Free',
        desc:'The finish line is in sight. Three-quarters done.',
        tag:'75% FI', color:'#fb923c', scene:'nature-golden', mood:'happy',
        shirt:'#c2410c', phoneColor:'#fed7aa', hasPartner:true,
        events:[`💰 Corpus: ${j2Fmt(wealthAt(M7))}`, `🔥 Returns > your expenses`,
                `🎯 Only 25% left!`, `📈 SIP: ${j2Fmt(sipAt(M7))}/mo`]
      }),
      mk(M8, {
        id:8, emoji:'🌅', title:'FINANCIALLY FREE!',
        desc:`25× expenses reached. Work is OPTIONAL. You own your time.`,
        tag:'FREE! 🎉', color:'#06b6d4', scene:'beach', mood:'free',
        shirt:'#0891b2', phoneColor:'#67e8f9',
        hasPartner:true, sunglasses:true, celebrate:true,
        events:[`☀️ CORPUS: ${j2Fmt(fireTarget)} ✅`, `😎 Work is OPTIONAL forever`,
                `☕ No alarm clock needed`, `🌍 Age ${age0+Math.floor(M8/12)} — YOU DID IT!`]
      }),
    ];
}

function j2Fmt(n) {
    if (n >= 10000000) return '₹' + (n/10000000).toFixed(1) + ' Cr';
    if (n >= 100000)   return '₹' + (n/100000).toFixed(1) + ' L';
    if (n >= 1000)     return '₹' + (n/1000).toFixed(0) + 'K';
    if (n > 0)         return '₹' + Math.round(n).toLocaleString('en-IN');
    return '₹0';
}

// ── Chapter names ──────────────────────────────────────────────
const J2_CHAPTERS = [
    'The Rat Race', 'The Foundation', 'The Momentum',
    'Life Gets Bigger', 'The Milestone', 'Quarter Free',
    'Halfway There', 'Almost Free', 'Financial Freedom'
];

// ── Personal narration builder ─────────────────────────────────
function buildNarration(stage, m) {
    const rawName  = (m?.name || '').trim();
    const n        = rawName ? rawName.split(' ')[0] : 'You';
    const yr       = stage.year, age = stage.age;
    const corpus   = j2Fmt(stage.wealth);
    const sip      = j2Fmt(stage.invest);
    const exp      = m?.totalExp || 50000;
    const expFmt   = j2Fmt(exp);
    const income   = j2Fmt(m?.income || 0);
    const cagr     = m?.blendedCAGR || 12;
    const ft       = j2Fmt(exp * 12 * 25);
    const fiPct    = stage.fiPct || 0;
    const passive  = j2Fmt(Math.round(stage.wealth * cagr / 100 / 12));

    switch (stage.id) {
        case 0:
            return stage.wealth < 100000
                ? `It's ${yr}. ${n}, you're ${age} years old.\n\nEvery month plays out the same way. The salary comes in. EMIs go out. Groceries. Rent. That random expense you didn't plan for. By the 20th, you're checking your balance and hoping the number says something different.\n\nIt doesn't.\n\nBut today you do something different. You open a calculator. You type in your monthly expenses — ${expFmt}. You multiply by 300.\n\n*${ft}.*\n\nThat's your escape number. The point where your money makes more than you spend — every month, forever. You stare at it for a long time.\n\n*"Could I actually get there?"*\n\nYes. Starting right now.`
                : `It's ${yr}. ${n}, you're ${age} years old.\n\nYou've already done something most people never do — you started. ${corpus} invested. ${sip} going in every month without fail.\n\nYour freedom number is ${ft}. That's 25 times your annual expenses — the point where work becomes optional, not mandatory.\n\nEvery rupee you invest doesn't just sit there. It earns. Then earns on those earnings. Then earns on *that*. The machine is already moving.\n\nThis is the story of how you get there.`;

        case 1:
            return `${n}. Age ${age}.\n\nThe emergency fund is done.\n\n${j2Fmt(exp * 6)} — six months of your life, pre-funded and protected. The term insurance is signed. The health cover is active.\n\nFor the first time in years, you're not one bad event away from financial disaster. No single job loss, medical bill, or broken car can destroy you.\n\nSIP: ${sip}/month. At ${cagr}% compounding, what looks modest today becomes something extraordinary over time.\n\nThe foundation is set. The real game begins here.`;

        case 2:
            return `${n}. Age ${age}.\n\n${corpus}.\n\nYou remember when that number felt impossible. When saving felt like pouring water into a bucket that always had a hole in it. Then one day, without ceremony, the portfolio crossed a number that made you stop and look twice.\n\nYour SIP has grown to ${sip}/month. The annual step-up is working quietly in the background. You barely notice the transfers going out anymore.\n\nThat's exactly the point. You've built the habit. Month after month, automatically, without decision fatigue.\n\n*That's* when you know it's real.`;

        case 3:
            return `${n}. Age ${age}.\n\nLife changed.\n\nMaybe it's a partner. Maybe it's new clarity about what you want. Either way, you're playing a bigger game now.\n\nPortfolio: ${corpus}. Monthly investment: ${sip}. The snowball is rolling.\n\nThe conversations are different now. Plans stretch further. You talk about 10-year goals the way you used to talk about weekend plans. You find yourself looking at compound interest calculators for fun.\n\nYou're ${fiPct}% of the way to financial freedom. And for the first time, that number feels reachable — not just theoretical.`;

        case 4:
            return `${n}. Age ${age}.\n\nYou remember exactly where you were when it happened.\n\nA Tuesday morning. Maybe you were still in bed. You opened the app out of habit. The number read ${corpus}. You refreshed it. Still there. You put the phone down. Picked it up. *Still there.*\n\nEight digits. Your portfolio crossed one crore.\n\nYou called someone — a parent, a friend. They said congratulations. You smiled, hung up, and sat very still for a few minutes. Just you and the number.\n\nThis is the proof. The thing you once thought was for other, luckier people. It's yours. You built this.\n\nYou're ${fiPct}% financially free. The mountain looks completely different from halfway up.`;

        case 5:
            return `${n}. Age ${age}.\n\nOne quarter of your financial freedom fund is locked in.\n\n${corpus} is working for you right now — growing while you sleep, compounding while you're stuck in traffic, multiplying while you're on that work call you didn't want to take.\n\nYour money generates roughly ${passive}/month on its own. Not enough to live on — yet. But it's the engine breathing.\n\nHere's what most people don't know: the second 25% comes faster than the first. Compounding is not linear. It accelerates. The curve is bending in your favour.\n\nKeep going.`;

        case 6:
            return `${n}. Age ${age}.\n\nHalfway.\n\n${corpus} working. Your passive income is approaching what used to feel like an aspirational salary.\n\nThere's a moment — it happens somewhere around here — when the math shifts beneath your feet. You look at your portfolio's monthly return. You look at your monthly expenses — ${expFmt}. The gap between them is narrowing fast.\n\nYou still work. But it feels different now. Less like survival. More like choice. There's a quiet confidence you carry now that's hard to explain to people who aren't on this path.\n\nThe second half goes faster. You're in it.`;

        case 7:
            return `${n}. Age ${age}.\n\nThree-quarters done.\n\n${corpus} invested and growing. Your portfolio now generates more passive income each month than your expenses — ${expFmt}. Some months, it exceeds them.\n\nThe question you used to ask yourself late at night — *"Can I actually do this? Is this really possible for someone like me?"* — that question has quietly gone silent.\n\nReplaced by something warmer. More certain. You already know the answer.\n\nBecause you're already living the proof.\n\nOne more chapter.`;

        case 8:
            return `${n}. Age ${age}.\n\nThe number reads ${corpus}.\n\nYour monthly expenses are ${expFmt}. Your portfolio, at a safe 4% withdrawal, generates more than that. Every month. For the rest of your life.\n\nYou don't need to work anymore.\n\nThis morning, the alarm didn't go off. You woke up anyway — early, clear-headed, with nowhere to be and no one to report to. You made coffee slowly. You sat by the window and watched the light change colour.\n\nFor the first time since you were a child, the entire day was yours to decide.\n\nThe rat race is over.\n\nNot because you escaped it. *Because you outgrew it.*`;

        default:
            return `${n}. Age ${age}. Net worth: ${corpus}.`;
    }
}

// ── Runtime state ─────────────────────────────────────────────
let J2_STAGES = [];
let j2Stage = 0, j2Playing = false, j2Timer = null, j2RAF = null;
let j2Frame = 0, j2Particles = [];
let j2WealthDisp = 0, j2WealthTarget = 0; // smooth wealth counter
let j2ChapterAlpha = 0, j2ChapterLabel = ''; // chapter title overlay

// ══ SETUP ═════════════════════════════════════════════════════
function j2Setup() {
    J2_STAGES = buildJ2Stages();
    const canvas = document.getElementById('j2-canvas');
    if (!canvas) return;
    if (j2RAF) { cancelAnimationFrame(j2RAF); j2RAF = null; }
    const wrap = canvas.parentElement;
    canvas.width  = wrap.clientWidth || 360;
    canvas.height = 320;

    const dotsEl = document.getElementById('j2-dots');
    if (dotsEl) dotsEl.innerHTML = J2_STAGES.map((s,i) =>
        `<span class="j2-dot" id="j2d-${i}" onclick="j2GoTo(${i})" title="${s.title}">${s.emoji}</span>`
    ).join('');

    j2WealthDisp = J2_STAGES[0].wealth;
    j2GoTo(0);
    j2RAF = requestAnimationFrame(j2Animate);
}

// ══ ANIMATION LOOP ════════════════════════════════════════════
function j2Animate() {
    j2Frame++;
    const canvas = document.getElementById('j2-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width, h = canvas.height;
    const stage = J2_STAGES[j2Stage] || J2_STAGES[0];
    const scene = J2_SCENES[stage.scene];

    // ── Sky gradient ──
    const skyG = ctx.createLinearGradient(0, 0, 0, h * 0.68);
    skyG.addColorStop(0, scene.skyT);
    skyG.addColorStop(1, scene.skyB);
    ctx.fillStyle = skyG;
    ctx.fillRect(0, 0, w, h * 0.68);

    // ── Scene backgrounds ──
    j2DrawBg(ctx, w, h, stage);

    // ── Ground ──
    const gnd = h * 0.68;
    const gG = ctx.createLinearGradient(0, gnd, 0, h);
    gG.addColorStop(0, scene.gndT);
    gG.addColorStop(1, scene.gndB);
    ctx.fillStyle = gG;
    ctx.fillRect(0, gnd, w, h - gnd);

    // Ground detail strip
    ctx.fillStyle = 'rgba(0,0,0,0.12)';
    ctx.fillRect(0, gnd, w, 3);

    // ── Animated path dashes ──
    ctx.save();
    ctx.strokeStyle = stage.scene === 'beach' ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.22)';
    ctx.lineWidth = 2;
    ctx.setLineDash([20, 20]);
    ctx.lineDashOffset = -(j2Frame * 1.6 % 40);
    ctx.beginPath();
    ctx.moveTo(0, gnd + (h - gnd) * 0.55);
    ctx.lineTo(w, gnd + (h - gnd) * 0.55);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();

    // ── Characters ──
    const charX = w * 0.28;
    const t = j2Frame * (stage.mood === 'free' ? 0.055 : stage.mood === 'ecstatic' ? 0.115 : 0.085);

    if (stage.hasPartner) {
        j2DrawPerson(ctx, charX + 62, gnd, t + Math.PI, {
            shirtColor:'#be185d', mood:stage.mood, scale:0.87, female:true
        });
    }
    j2DrawPerson(ctx, charX, gnd, t, {
        shirtColor:stage.shirt, mood:stage.mood,
        phoneColor:stage.phoneColor, hasBaby:stage.hasBaby,
        sunglasses:stage.sunglasses, scale:1
    });

    // ── Name tag above character ──
    const userName = ((typeof engineMemory!=='undefined' && engineMemory?.name)||'').split(' ')[0].toUpperCase();
    if (userName) {
        ctx.save();
        ctx.font = 'bold 9px "Inter",sans-serif';
        const ntw = ctx.measureText(userName).width;
        const ntx = charX - ntw/2 - 7, nty = gnd - 112;
        ctx.fillStyle = 'rgba(0,0,0,0.55)';
        j2RndRect(ctx, ntx, nty, ntw+14, 16, 5);
        ctx.fillStyle = 'rgba(255,255,255,0.88)';
        ctx.fillText(userName, ntx+7, nty+11);
        // Arrow down
        ctx.fillStyle = 'rgba(0,0,0,0.45)';
        ctx.beginPath(); ctx.moveTo(charX-4,nty+16); ctx.lineTo(charX+4,nty+16); ctx.lineTo(charX,nty+22); ctx.fill();
        ctx.restore();
    }

    // ── Particles ──
    if (stage.celebrate) j2SpawnParticles(w, h * 0.55, stage.color);
    j2DrawParticles(ctx, h);

    // ── HUD overlay ──
    j2DrawHUD(ctx, w, h, stage);

    // ── Cinematic overlay (vignette + letterbox) — drawn over everything ──
    j2DrawCinematicOverlay(ctx, w, h);

    // ── Chapter title cinematic overlay ──
    if (j2ChapterAlpha > 0) {
        j2ChapterAlpha = Math.max(0, j2ChapterAlpha - 0.028);
        // fade in 0→1 when alpha in [3,2], hold at 1 in [2,1], fade out 1→0 in [1,0]
        const fade = j2ChapterAlpha > 2 ? (3 - j2ChapterAlpha)
                   : j2ChapterAlpha > 1 ? 1
                   : j2ChapterAlpha;
        if (fade > 0.01) {
            ctx.save();
            ctx.globalAlpha = fade * 0.82;
            ctx.fillStyle = '#020617';
            ctx.fillRect(0, 0, w, h);
            ctx.globalAlpha = fade;
            ctx.textAlign = 'center';
            const parts = j2ChapterLabel.split(':');
            const chNum  = (parts[0] || '').trim();
            const chName = (parts[1] || j2ChapterLabel).trim();
            // Chapter number
            ctx.fillStyle = 'rgba(165,180,252,0.75)';
            ctx.font = '500 11px "Inter",sans-serif';
            ctx.fillText(chNum.toUpperCase(), w/2, h*0.43);
            // Divider line
            ctx.strokeStyle = 'rgba(165,180,252,0.3)';
            ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(w/2-40,h*0.43+6); ctx.lineTo(w/2+40,h*0.43+6); ctx.stroke();
            // Chapter title
            ctx.fillStyle = 'white';
            ctx.font = 'bold 22px "Inter",sans-serif';
            ctx.fillText(chName, w/2, h*0.43+34);
            ctx.textAlign = 'left';
            ctx.restore();
        }
    }

    j2RAF = requestAnimationFrame(j2Animate);
}

// ══ BACKGROUNDS ══════════════════════════════════════════════
function j2DrawBg(ctx, w, h, stage) {
    const sc  = stage.scene;
    const gnd = h * 0.68;
    const f   = j2Frame;

    // ─── CITY NIGHT ──────────────────────────────────────────
    if (sc === 'city-night' || sc === 'city-dawn') {
        // Stars (night only)
        if (sc === 'city-night') {
            const stars = [[0.05,0.04],[0.13,0.11],[0.22,0.06],[0.35,0.02],[0.47,0.14],[0.58,0.07],
                           [0.66,0.03],[0.74,0.17],[0.83,0.09],[0.91,0.05],[0.97,0.14],[0.29,0.19],[0.52,0.22]];
            stars.forEach(([rx,ry]) => {
                const a = 0.3 + Math.sin(f*0.025 + rx*13)*0.35;
                ctx.globalAlpha = a;
                ctx.fillStyle = 'white';
                ctx.beginPath(); ctx.arc(rx*w, ry*gnd, 1.3, 0, Math.PI*2); ctx.fill();
            });
            ctx.globalAlpha = 1;
            // Moon
            ctx.save();
            ctx.shadowColor = '#fde68a'; ctx.shadowBlur = 24;
            ctx.fillStyle = '#fef9c3';
            ctx.beginPath(); ctx.arc(w*0.82, h*0.10, 18, 0, Math.PI*2); ctx.fill();
            ctx.fillStyle = J2_SCENES['city-night'].skyT;
            ctx.beginPath(); ctx.arc(w*0.85, h*0.08, 15, 0, Math.PI*2); ctx.fill();
            ctx.restore();
        }
        // Dawn gradient accent
        if (sc === 'city-dawn') {
            const dawnG = ctx.createLinearGradient(0, gnd*0.55, 0, gnd);
            dawnG.addColorStop(0, 'rgba(251,146,60,0)');
            dawnG.addColorStop(1, 'rgba(251,146,60,0.18)');
            ctx.fillStyle = dawnG;
            ctx.fillRect(0, gnd*0.55, w, gnd*0.45);
        }
        // Buildings (far layer — darker, shorter)
        const farBldgs = [[0.0,0.30,0.055],[0.09,0.22,0.05],[0.18,0.35,0.06],[0.30,0.20,0.045],
                          [0.42,0.32,0.055],[0.53,0.18,0.05],[0.63,0.28,0.06],[0.72,0.22,0.05],[0.82,0.30,0.06],[0.92,0.24,0.05]];
        farBldgs.forEach(([rx,rh,rw]) => {
            const bh = gnd*rh, bw = w*rw, bx = rx*w;
            ctx.fillStyle = sc==='city-night' ? '#050d1a' : '#0f172a';
            ctx.fillRect(bx, gnd-bh, bw, bh);
        });
        // Buildings (near layer — prominent)
        const bldgs = [[0.02,0.55,0.08],[0.12,0.62,0.07],[0.22,0.48,0.09],[0.34,0.68,0.065],
                       [0.44,0.52,0.085],[0.56,0.45,0.08],[0.67,0.60,0.075],[0.77,0.42,0.095],[0.87,0.57,0.08],[0.95,0.64,0.065]];
        bldgs.forEach(([rx,rh,rw]) => {
            const bh = gnd*rh, bw = w*rw, bx = rx*w;
            const bColor = sc==='city-night' ? '#0f172a' : '#1e293b';
            ctx.fillStyle = bColor;
            ctx.fillRect(bx, gnd-bh, bw, bh);
            // Roof details
            ctx.fillStyle = sc==='city-night' ? '#1e293b' : '#334155';
            ctx.fillRect(bx+bw*0.1, gnd-bh-4, bw*0.8, 4);
            // Antenna
            ctx.strokeStyle = sc==='city-night' ? '#374151' : '#475569';
            ctx.lineWidth = 1.5;
            ctx.beginPath(); ctx.moveTo(bx+bw*0.55, gnd-bh-4); ctx.lineTo(bx+bw*0.55, gnd-bh-14); ctx.stroke();
            // Windows
            const cols = Math.floor(bw/11);
            const rows = Math.floor(bh/16);
            for (let r=0; r<rows; r++) {
                for (let c=0; c<cols; c++) {
                    const lit = Math.sin(bx*4.1+r*6.3+c*2.7) > (sc==='city-night'?0.0:0.55);
                    if (!lit) continue;
                    const flicker = sc==='city-night' ? 0.55+Math.sin(f*0.015+bx+r*3+c)*0.2 : 0.5;
                    ctx.fillStyle = `rgba(255,220,80,${flicker})`;
                    ctx.fillRect(bx+c*11+2, gnd-bh+r*16+4, 7, 9);
                }
            }
        });
        // Neon signs (night only)
        if (sc === 'city-night') {
            const signs = [[0.16,'₹ GROW',w*0.115,gnd*0.42,'#10b981'],[0.50,'INVEST',w*0.50,gnd*0.38,'#a855f7'],[0.78,'FREE?',w*0.775,gnd*0.45,'#06b6d4']];
            signs.forEach(([_rx, txt, sx, sy, clr]) => {
                const glow = 0.6 + Math.sin(f*0.04 + sx)*0.4;
                ctx.save(); ctx.globalAlpha = glow;
                ctx.shadowColor = clr; ctx.shadowBlur = 12;
                ctx.fillStyle = clr;
                ctx.font = 'bold 10px "JetBrains Mono"';
                ctx.fillText(txt, sx, sy);
                ctx.restore();
            });
        }
        // Moving car lights
        const carProg = (f * 0.8 % (w + 80)) - 40;
        if (sc === 'city-night') {
            // Headlights (moving right)
            ctx.save(); ctx.shadowColor='#fef9c3'; ctx.shadowBlur=8;
            ctx.fillStyle='#fef9c3';
            ctx.beginPath(); ctx.ellipse(carProg+14, gnd+6, 6, 3, 0, 0, Math.PI*2); ctx.fill();
            ctx.beginPath(); ctx.ellipse(carProg, gnd+6, 6, 3, 0, 0, Math.PI*2); ctx.fill();
            ctx.restore();
            // Tail lights (moving left)
            const car2 = w - ((f * 0.6 % (w + 60)) - 30);
            ctx.save(); ctx.shadowColor='#ef4444'; ctx.shadowBlur=8;
            ctx.fillStyle='#ef4444';
            ctx.beginPath(); ctx.ellipse(car2, gnd+18, 5, 2.5, 0, 0, Math.PI*2); ctx.fill();
            ctx.beginPath(); ctx.ellipse(car2+12, gnd+18, 5, 2.5, 0, 0, Math.PI*2); ctx.fill();
            ctx.restore();
        }
        // Street lights
        [[0.2, w*0.20],[0.5, w*0.50],[0.8, w*0.80]].forEach(([_, sx]) => {
            ctx.strokeStyle='#94a3b8'; ctx.lineWidth=2;
            ctx.beginPath(); ctx.moveTo(sx, gnd); ctx.lineTo(sx, gnd-55); ctx.lineTo(sx+14,gnd-55); ctx.stroke();
            ctx.save(); ctx.shadowColor=sc==='city-night'?'#fbbf24':'rgba(251,191,36,0.3)'; ctx.shadowBlur=sc==='city-night'?18:6;
            ctx.fillStyle=sc==='city-night'?'#fef3c7':'#fef9c3';
            ctx.beginPath(); ctx.ellipse(sx+14, gnd-55, 6, 4, 0, 0, Math.PI*2); ctx.fill();
            ctx.restore();
        });

    // ─── SUBURB / PARK ───────────────────────────────────────
    } else if (sc.startsWith('suburb') || sc === 'park' || sc === 'park-golden') {
        // Sun
        const sunX = sc==='park-golden' ? w*0.80 : w*0.72;
        const sunY = sc==='park-golden' ? h*0.11 : h*0.09;
        const pulse = 1 + Math.sin(f*0.018)*0.035;
        const sunClr = sc==='park-golden' ? '#f59e0b' : '#fde68a';
        ctx.save(); ctx.shadowColor=sunClr; ctx.shadowBlur=45;
        ctx.fillStyle=sunClr;
        ctx.beginPath(); ctx.arc(sunX, sunY, 24*pulse, 0, Math.PI*2); ctx.fill();
        ctx.restore();
        // Sun halo
        ctx.save(); ctx.globalAlpha=0.12;
        ctx.fillStyle=sunClr;
        ctx.beginPath(); ctx.arc(sunX, sunY, 40*pulse, 0, Math.PI*2); ctx.fill();
        ctx.restore();
        // Clouds
        [[0.08,0.10,60,17],[0.32,0.07,80,15],[0.58,0.13,55,14],[0.80,0.06,65,16]].forEach(([rx,ry,cw,ch],i) => {
            const ox = Math.sin(f*0.004+i*2)*10;
            ctx.fillStyle = sc==='park-golden' ? 'rgba(255,200,100,0.75)' : 'rgba(255,255,255,0.85)';
            j2Cloud(ctx, rx*w+ox, ry*h, cw, ch);
        });
        // Birds (animated)
        for (let b=0; b<4; b++) {
            const bx = ((f*0.5 + b*w*0.25) % (w+40)) - 20;
            const by = h*0.08 + Math.sin(f*0.03+b*1.5)*h*0.04;
            const wing = Math.sin(f*0.15+b)*0.5;
            ctx.strokeStyle='rgba(30,30,30,0.45)'; ctx.lineWidth=1.5;
            ctx.beginPath();
            ctx.moveTo(bx-7, by); ctx.quadraticCurveTo(bx-3.5, by-4+wing*3, bx, by);
            ctx.quadraticCurveTo(bx+3.5, by-4+wing*3, bx+7, by); ctx.stroke();
        }
        // Houses
        const houses = sc==='park'||sc==='park-golden'
            ? [[0.05,0.30,0.09],[0.80,0.28,0.10]]
            : [[0.03,0.34,0.10],[0.50,0.30,0.09],[0.80,0.35,0.10]];
        houses.forEach(([rx,rh,rw]) => {
            const bh=gnd*rh, bw=w*rw, bx=rx*w;
            ctx.fillStyle='#475569'; ctx.fillRect(bx, gnd-bh, bw, bh);
            // Roof
            const roofClr = sc==='park-golden' ? '#b45309' : '#dc2626';
            ctx.fillStyle=roofClr;
            ctx.beginPath(); ctx.moveTo(bx-5,gnd-bh); ctx.lineTo(bx+bw/2,gnd-bh-bh*0.42); ctx.lineTo(bx+bw+5,gnd-bh); ctx.fill();
            ctx.fillStyle='#92400e'; ctx.fillRect(bx+bw*0.38, gnd-bh*0.40, bw*0.24, bh*0.40); // door
            // Windows (warm glow)
            ctx.fillStyle='rgba(253,224,71,0.7)';
            ctx.fillRect(bx+bw*0.10, gnd-bh*0.68, bw*0.22, bh*0.22);
            ctx.fillRect(bx+bw*0.68, gnd-bh*0.68, bw*0.22, bh*0.22);
            // Smoke from chimney
            ctx.strokeStyle='rgba(200,200,200,0.35)'; ctx.lineWidth=3; ctx.lineCap='round';
            const sx = bx+bw*0.75, sy = gnd-bh;
            ctx.beginPath();
            ctx.moveTo(sx, sy);
            ctx.quadraticCurveTo(sx+Math.sin(f*0.02)*5-2, sy-12, sx+Math.sin(f*0.02)*8, sy-22);
            ctx.stroke();
        });
        // Trees (with subtle sway)
        const treePos = sc==='park'||sc==='park-golden'
            ? [[0.20,0.30,13],[0.24,0.27,11],[0.46,0.28,14],[0.52,0.24,10],[0.65,0.30,13],[0.72,0.26,11],[0.92,0.28,13]]
            : [[0.20,0.28,13],[0.26,0.25,10],[0.47,0.30,14],[0.70,0.28,12],[0.93,0.26,13]];
        treePos.forEach(([rx,rh,r],i) => {
            const sway = Math.sin(f*0.012+i*0.8)*2;
            j2Tree(ctx, rx*w+sway, gnd, gnd*rh, r);
        });
        // Park: fountain
        if (sc==='park' || sc==='park-golden') {
            const fx2=w*0.55, fy=gnd-2;
            ctx.fillStyle='#0369a1'; j2RndRect(ctx, fx2-16, fy-6, 32, 8, 4);
            for (let d=0; d<5; d++) {
                const ang = (d/5)*Math.PI + Math.sin(f*0.04)*0.15;
                const dropH = 16 + Math.sin(f*0.06+d)*4;
                ctx.save(); ctx.globalAlpha=0.55;
                ctx.strokeStyle='#7dd3fc'; ctx.lineWidth=1.5;
                ctx.beginPath();
                ctx.moveTo(fx2+Math.cos(ang)*4, fy-6);
                ctx.quadraticCurveTo(fx2+Math.cos(ang)*12, fy-6-dropH, fx2+Math.cos(ang)*20, fy-2);
                ctx.stroke(); ctx.restore();
            }
        }

    // ─── NATURE ──────────────────────────────────────────────
    } else if (sc.startsWith('nature')) {
        const sunClr = sc==='nature-golden' ? '#fb923c' : '#fde68a';
        const sunX2 = w*0.68, sunY2 = h*0.10;
        ctx.save(); ctx.shadowColor=sunClr; ctx.shadowBlur=55;
        ctx.fillStyle=sunClr;
        ctx.beginPath(); ctx.arc(sunX2, sunY2, 30+Math.sin(f*0.015)*1.5, 0, Math.PI*2); ctx.fill();
        ctx.restore();
        // Clouds
        [[0.06,0.05,65,15],[0.40,0.08,85,17],[0.75,0.04,60,13]].forEach(([rx,ry,cw,ch],i) => {
            const ox = Math.sin(f*0.003+i*3)*12;
            ctx.fillStyle = sc==='nature-golden' ? 'rgba(255,160,60,0.70)' : 'rgba(255,255,255,0.78)';
            j2Cloud(ctx, rx*w+ox, ry*h, cw, ch);
        });
        // Mountains (far — lighter)
        ctx.fillStyle = sc==='nature-golden' ? 'rgba(120,50,10,0.5)' : 'rgba(30,58,138,0.45)';
        [[0.00,0.48],[0.15,0.36],[0.30,0.44],[0.45,0.34],[0.58,0.43],[0.70,0.38],[0.83,0.46],[0.95,0.37],[1.00,0.50]].forEach(([rx,ry],i,arr) => {
            if (i < arr.length-1) {
                const [nx,ny] = arr[i+1];
                ctx.beginPath();
                ctx.moveTo(rx*w, gnd); ctx.lineTo((rx+nx)/2*w, gnd*ry); ctx.lineTo(nx*w, gnd); ctx.fill();
            }
        });
        // Mountains (near — solid)
        ctx.fillStyle = sc==='nature-golden' ? '#431407' : '#1e3a5f';
        [[0.00,0.60],[0.20,0.42],[0.40,0.54],[0.58,0.38],[0.75,0.50],[0.90,0.44],[1.00,0.58]].forEach(([rx,ry],i,arr) => {
            if (i < arr.length-1) {
                const [nx,ny] = arr[i+1];
                ctx.beginPath();
                ctx.moveTo(rx*w, gnd); ctx.lineTo((rx+nx)/2*w, gnd*ry); ctx.lineTo(nx*w, gnd); ctx.fill();
            }
        });
        // Snow caps
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        [[0.20,0.42],[0.58,0.38],[0.90,0.44]].forEach(([rx,ry]) => {
            ctx.beginPath(); ctx.arc(rx*w + (0-rx)*w*0.05, gnd*ry, 10, 0, Math.PI*2); ctx.fill();
        });
        // Tree line
        for (let i=0; i<20; i++) {
            const tx = (i/19)*w;
            const th = gnd*0.20 + Math.sin(i*1.8)*gnd*0.06;
            j2Tree(ctx, tx, gnd, th, 8+i%4*2);
        }
        // River (animated)
        ctx.save(); ctx.globalAlpha=0.55;
        ctx.strokeStyle = sc==='nature-golden' ? '#fb923c' : '#60a5fa';
        ctx.lineWidth=3;
        ctx.beginPath();
        for (let x2=0; x2<=w; x2+=4) {
            const ry = gnd+8 + Math.sin((x2/w)*Math.PI*3 + f*0.03)*5;
            x2===0 ? ctx.moveTo(x2, ry) : ctx.lineTo(x2, ry);
        }
        ctx.stroke(); ctx.restore();

    // ─── BEACH ───────────────────────────────────────────────
    } else if (sc === 'beach') {
        // Big sun + rays
        const sunPulse = 1+Math.sin(f*0.016)*0.03;
        ctx.save(); ctx.shadowColor='#f97316'; ctx.shadowBlur=60;
        ctx.fillStyle='#fde68a';
        ctx.beginPath(); ctx.arc(w*0.5, h*0.09, 34*sunPulse, 0, Math.PI*2); ctx.fill();
        ctx.restore();
        for (let r=0; r<10; r++) {
            const a = (r/10)*Math.PI*2 + f*0.004;
            ctx.save(); ctx.globalAlpha=0.18+Math.sin(f*0.02+r)*0.08;
            ctx.strokeStyle='#fde68a'; ctx.lineWidth=2.5;
            ctx.beginPath();
            ctx.moveTo(w*0.5+Math.cos(a)*40, h*0.09+Math.sin(a)*40);
            ctx.lineTo(w*0.5+Math.cos(a)*65, h*0.09+Math.sin(a)*65);
            ctx.stroke(); ctx.restore();
        }
        // Clouds
        [[0.12,0.16,70,16],[0.68,0.12,60,14]].forEach(([rx,ry,cw,ch],i) => {
            const ox = Math.sin(f*0.003+i*4)*14;
            ctx.fillStyle='rgba(255,255,255,0.82)';
            j2Cloud(ctx, rx*w+ox, ry*h, cw, ch);
        });
        // Horizon glow
        const hG = ctx.createLinearGradient(0, gnd*0.7, 0, gnd);
        hG.addColorStop(0, 'rgba(251,191,36,0)'); hG.addColorStop(1, 'rgba(251,191,36,0.12)');
        ctx.fillStyle=hG; ctx.fillRect(0, gnd*0.7, w, gnd*0.3);
        // Ocean bands
        for (let band=0; band<4; band++) {
            const by = gnd*(0.70 + band*0.075);
            const bG2 = ctx.createLinearGradient(0, by, 0, by+gnd*0.075);
            const alpha = 0.6-band*0.08;
            bG2.addColorStop(0, `rgba(2,132,199,${alpha})`);
            bG2.addColorStop(1, `rgba(3,105,161,${alpha*0.7})`);
            ctx.fillStyle=bG2; ctx.fillRect(0, by, w, gnd*0.075+2);
        }
        // Animated wave lines
        for (let wave=0; wave<4; wave++) {
            ctx.strokeStyle=`rgba(125,211,252,${0.45-wave*0.09})`;
            ctx.lineWidth=1.8;
            ctx.beginPath();
            for (let x=0; x<=w; x+=3) {
                const wy = gnd*(0.72+wave*0.07) + Math.sin((x/w)*Math.PI*5 + f*0.09 - wave*1.4)*4;
                x===0 ? ctx.moveTo(x,wy) : ctx.lineTo(x,wy);
            }
            ctx.stroke();
        }
        // Distant boat
        const bx3 = w*(0.55 + Math.sin(f*0.008)*0.04);
        const by3 = gnd*0.82;
        ctx.fillStyle='rgba(30,30,60,0.6)';
        ctx.beginPath(); ctx.ellipse(bx3, by3, 18, 5, 0, 0, Math.PI*2); ctx.fill();
        ctx.strokeStyle='rgba(30,30,60,0.5)'; ctx.lineWidth=1.5;
        ctx.beginPath(); ctx.moveTo(bx3, by3-5); ctx.lineTo(bx3, by3-18); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(bx3, by3-18); ctx.lineTo(bx3+16, by3-8); ctx.closePath(); ctx.stroke();
        // Hammock
        const hx=w*0.5, hy=gnd-38;
        ctx.strokeStyle='#a16207'; ctx.lineWidth=2.5;
        ctx.beginPath(); ctx.moveTo(hx-58, hy-14); ctx.quadraticCurveTo(hx, hy+12, hx+58, hy-14); ctx.stroke();
        ctx.strokeStyle='rgba(161,98,7,0.4)'; ctx.lineWidth=1;
        for (let r2=0; r2<5; r2++) {
            const rx2 = hx-58+r2*(116/4), ry2 = hy-14 + (r2===0||r2===4?0: (r2===2?26:12));
            ctx.beginPath(); ctx.moveTo(rx2, ry2); ctx.lineTo(hx-58+r2*(116/4), hy-38); ctx.stroke();
        }
        // Palm trees
        [0.1, 0.90].forEach((rx, side) => j2Palm(ctx, rx*w, gnd, gnd*0.38, side===1));
        // Sand texture (light dots)
        ctx.save(); ctx.globalAlpha=0.10;
        ctx.fillStyle='#fef9c3';
        for (let d=0; d<30; d++) {
            const dx = (d * 137.5 % 1) * w, dy = gnd + (d * 71.3 % 1) * (h-gnd)*0.7;
            ctx.beginPath(); ctx.arc(dx, dy, 1.5, 0, Math.PI*2); ctx.fill();
        }
        ctx.restore();
    }

    // ── THE GREAT EXCHANGE — cinematic props per stage ──────────
    j2DrawSceneProps(ctx, w, h, stage, f);
}

// ══ CINEMATIC PROP SYSTEM ═════════════════════════════════════
// Stone cubes, golden forge, liquid gold, god rays, holograms

function j2DrawSceneProps(ctx, w, h, stage, f) {
    const gnd = h * 0.68;
    const id  = stage.id;

    // ── Light path on ground (unlocks at stage 2) ──
    if (id >= 2) {
        const pi = Math.min(1.6, (id - 1) * 0.28);
        const pg = ctx.createLinearGradient(0, gnd+1, w, gnd+1);
        pg.addColorStop(0, 'rgba(0,0,0,0)');
        pg.addColorStop(0.25, `rgba(251,191,36,${0.07*pi})`);
        pg.addColorStop(0.5,  `rgba(251,191,36,${0.19*pi})`);
        pg.addColorStop(0.75, `rgba(251,191,36,${0.07*pi})`);
        pg.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = pg; ctx.fillRect(0, gnd, w, 9);
        // Shimmer bead
        const sx = ((f * 2.4) % (w + 60)) - 30;
        const sg = ctx.createRadialGradient(sx, gnd+4, 0, sx, gnd+4, 28);
        sg.addColorStop(0, `rgba(253,230,138,${0.28*pi})`);
        sg.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = sg; ctx.fillRect(sx-28, gnd, 56, 9);
    }

    // ── Stone cubes — liabilities (stages 0-2) ──
    if (id <= 2) {
        const cubes = [
            { lbl:'DEBT',     ox:-60, oy:-30, sz:28 },
            { lbl:'HIGH RENT',ox: 54, oy:-20, sz:23 },
            { lbl:'EMI',      ox:-22, oy:-58, sz:20 },
        ];
        const show = id === 0 ? 3 : id === 1 ? 2 : 1;
        cubes.slice(0, show).forEach(({ lbl, ox, oy, sz }, i) => {
            const bob = Math.sin(f * 0.024 + i * 2.2) * 7;
            const a   = (id === 2 && i === 0) ? 0.45 : 1.0; // last one fading
            j2DrawStoneCube(ctx, w*0.28+ox, gnd+oy+bob, sz, lbl, a);
        });
    }

    // ── Golden Forge — appears at stage 1 (Foundation) ──
    if (id === 1 || id === 2) {
        j2DrawForge(ctx, w*0.74, gnd-10, f, 0.82);
        j2DrawLiquidGold(ctx, w*0.74, gnd-20, w*0.40, gnd-6, f, 0.55);
    }

    // ── MILESTONE — Park Golden (stage 4): The Great Exchange moment ──
    if (id === 4) {
        // Massive forge center-stage
        j2DrawForge(ctx, w*0.68, gnd-6, f, 1.7);
        // God rays from forge
        j2DrawGodRays(ctx, w*0.68, gnd*0.72, 22, w*0.95, '#f59e0b', f);
        // Gold streaming in both directions
        j2DrawLiquidGold(ctx, w*0.68, gnd-20, w*0.14, gnd-6, f, 0.9);
        j2DrawLiquidGold(ctx, w*0.68, gnd-20, w*0.92, gnd-8, f, 0.7);
        // ₹1 CRORE text
        ctx.save();
        ctx.globalAlpha = 0.7 + Math.sin(f * 0.06) * 0.25;
        ctx.shadowColor = '#fde68a'; ctx.shadowBlur = 22;
        ctx.fillStyle = '#fef9c3';
        ctx.font = 'bold 16px "JetBrains Mono",monospace';
        ctx.textAlign = 'center';
        ctx.fillText('★  ₹1 CRORE  MILESTONE  ★', w/2, gnd * 0.26);
        ctx.textAlign = 'left'; ctx.restore();
    }

    // ── Goal holograms — materialize from stage 2 to 7 ──
    const holoPct = [0, 0, 0.18, 0.40, 0.58, 0.75, 0.88, 0.95, 1.0];
    if (id >= 2 && id <= 7) {
        const pct = holoPct[id] || 0;
        const sub = id <= 3 ? 'materializing...' : id === 4 ? '55% formed' : id <= 6 ? `${Math.round(pct*100)}% formed` : 'almost there';
        j2DrawHologram(ctx, w*0.75, gnd-52, '🏠', 'Dream Home', sub, pct, f);
    }

    // ── God rays for late nature scenes ──
    if (stage.scene === 'nature') {
        j2DrawGodRays(ctx, w*0.68, h*0.10, 12, w*0.70, '#60a5fa', f);
    }
    if (stage.scene === 'nature-golden') {
        j2DrawGodRays(ctx, w*0.68, h*0.11, 16, w*0.82, '#fb923c', f);
    }

    // ── FREEDOM — Beach (stage 8): everything solid ──
    if (id === 8) {
        // Massive sun god rays
        j2DrawGodRays(ctx, w*0.5, h*0.09, 26, w*1.15, '#fde68a', f);
        // Goals fully materialized (solid, green border)
        j2DrawHologram(ctx, w*0.60, gnd-60, '🏠', 'Dream Home', 'YOURS ✓', 1.0, f);
        j2DrawHologram(ctx, w*0.80, gnd-50, '🌿', 'Peace & Time', 'ACHIEVED ✓', 1.0, f);
        // FINANCIALLY FREE inscription
        const fa = 0.72 + Math.sin(f * 0.04) * 0.24;
        ctx.save();
        ctx.globalAlpha = fa;
        ctx.shadowColor = '#fde68a'; ctx.shadowBlur = 30;
        ctx.fillStyle = '#fef9c3';
        ctx.font = 'bold 19px "JetBrains Mono",monospace';
        ctx.textAlign = 'center';
        ctx.fillText('FINANCIALLY  FREE', w/2, gnd * 0.27);
        ctx.shadowBlur = 0;
        ctx.globalAlpha = fa * 0.65;
        ctx.fillStyle = 'rgba(253,230,138,0.8)';
        ctx.font = '600 10px "Inter",sans-serif';
        ctx.fillText('WORK  IS  NOW  OPTIONAL', w/2, gnd * 0.27 + 20);
        ctx.textAlign = 'left'; ctx.restore();
        // Extra gold on ground
        const pi2 = 1.6;
        const pg2 = ctx.createLinearGradient(0, gnd+1, w, gnd+1);
        pg2.addColorStop(0, 'rgba(0,0,0,0)');
        pg2.addColorStop(0.5, `rgba(251,191,36,${0.22*pi2})`);
        pg2.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = pg2; ctx.fillRect(0, gnd, w, 12);
    }
}

// ── Stone Cube (liability — heavy, grey, dusty) ────────────────
function j2DrawStoneCube(ctx, cx, cy, size, label, alpha) {
    const s = size;
    ctx.save(); ctx.globalAlpha = alpha;
    // Drop shadow
    ctx.fillStyle = 'rgba(0,0,0,0.38)';
    ctx.beginPath(); ctx.ellipse(cx+s*0.08, cy+s*0.65, s*0.52, s*0.12, 0, 0, Math.PI*2); ctx.fill();
    // Top face
    ctx.fillStyle = '#374151';
    ctx.beginPath();
    ctx.moveTo(cx,        cy-s*0.52);
    ctx.lineTo(cx+s*0.62, cy-s*0.17);
    ctx.lineTo(cx,        cy+s*0.17);
    ctx.lineTo(cx-s*0.62, cy-s*0.17);
    ctx.closePath(); ctx.fill();
    // Cracks on top
    ctx.strokeStyle = 'rgba(0,0,0,0.45)'; ctx.lineWidth = 1.2; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(cx-s*0.26, cy-s*0.38); ctx.lineTo(cx+s*0.07, cy-s*0.09); ctx.lineTo(cx+s*0.28, cy-s*0.04); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx+s*0.08, cy-s*0.44); ctx.lineTo(cx-s*0.04, cy-s*0.21); ctx.stroke();
    // Left face (darkest — in shadow)
    const lg = ctx.createLinearGradient(cx-s*0.62, cy, cx, cy);
    lg.addColorStop(0, '#0d1117'); lg.addColorStop(1, '#1f2937');
    ctx.fillStyle = lg;
    ctx.beginPath();
    ctx.moveTo(cx-s*0.62, cy-s*0.17); ctx.lineTo(cx, cy+s*0.17);
    ctx.lineTo(cx, cy+s*0.68);       ctx.lineTo(cx-s*0.62, cy+s*0.34);
    ctx.closePath(); ctx.fill();
    // Right face (mid shadow)
    const rg = ctx.createLinearGradient(cx, cy, cx+s*0.62, cy);
    rg.addColorStop(0, '#1f2937'); rg.addColorStop(1, '#2d3748');
    ctx.fillStyle = rg;
    ctx.beginPath();
    ctx.moveTo(cx+s*0.62, cy-s*0.17); ctx.lineTo(cx, cy+s*0.17);
    ctx.lineTo(cx, cy+s*0.68);        ctx.lineTo(cx+s*0.62, cy+s*0.34);
    ctx.closePath(); ctx.fill();
    // Label on face
    ctx.globalAlpha = alpha * 0.72;
    ctx.fillStyle = '#6b7280';
    ctx.font = `bold ${Math.max(6, Math.round(s*0.17))}px "JetBrains Mono",monospace`;
    ctx.textAlign = 'center'; ctx.fillText(label, cx+s*0.02, cy+s*0.48); ctx.textAlign = 'left';
    // Occasional dust particle
    if (Math.random() < 0.07 && j2Particles.length < 120) {
        j2Particles.push({ x:cx+(Math.random()-0.5)*s, y:cy+s*0.1, vx:(Math.random()-0.5)*0.7, vy:-0.6-Math.random()*0.9, color:'#6b7280', size:1.4+Math.random()*1.6, life:1, decay:0.04, rot:0, rotV:0, shape:'circle' });
    }
    ctx.restore();
}

// ── Golden Forge (transformation point) ───────────────────────
function j2DrawForge(ctx, fx, fy, f, intensity) {
    ctx.save();
    // Ground halo glow
    const hr = (60 + Math.sin(f*0.05)*7) * intensity;
    const hg = ctx.createRadialGradient(fx, fy, 4, fx, fy, hr);
    hg.addColorStop(0, `rgba(255,185,35,${0.65*intensity})`);
    hg.addColorStop(0.35, `rgba(255,100,20,${0.28*intensity})`);
    hg.addColorStop(0.7, `rgba(251,60,0,${0.10*intensity})`);
    hg.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = hg; ctx.beginPath(); ctx.arc(fx, fy, hr, 0, Math.PI*2); ctx.fill();
    // Body shadow
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.beginPath(); ctx.ellipse(fx+s2(intensity)*0.08, fy+18*intensity, 30*intensity, 8, 0, 0, Math.PI*2); ctx.fill();
    // Forge body (dark stone)
    ctx.fillStyle = '#0d1117';
    ctx.beginPath();
    ctx.moveTo(fx-24*intensity, fy+3);
    ctx.lineTo(fx-20*intensity, fy+20);
    ctx.lineTo(fx+20*intensity, fy+20);
    ctx.lineTo(fx+24*intensity, fy+3);
    ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.ellipse(fx, fy+3, 24*intensity, 10*intensity, 0, 0, Math.PI*2); ctx.fill();
    // Molten core
    const cg = ctx.createRadialGradient(fx, fy-1, 0, fx, fy-1, 20*intensity);
    cg.addColorStop(0, '#fef9c3'); cg.addColorStop(0.3, '#fde68a');
    cg.addColorStop(0.65, '#f97316'); cg.addColorStop(1, 'rgba(220,38,38,0.15)');
    ctx.fillStyle = cg;
    ctx.beginPath(); ctx.ellipse(fx, fy-1, 20*intensity, 9*intensity, 0, 0, Math.PI*2); ctx.fill();
    // Fire tendrils
    for (let i=0; i<16; i++) {
        const fa = ((i/16)-0.5)*Math.PI*1.15 - Math.PI/2;
        const fr = (10+Math.sin(f*0.09+i*0.85)*5)*intensity;
        const fpx = fx + Math.cos(fa)*fr*0.85;
        const fpy = fy - 9 + Math.sin(f*0.1+i*1.1)*fr*0.55 - fr*0.32;
        const fc  = i%3===0?'#fef9c3':i%3===1?'#fb923c':'#ef4444';
        ctx.fillStyle = fc;
        ctx.globalAlpha = (0.4+Math.sin(f*0.09+i)*0.35)*intensity;
        ctx.beginPath(); ctx.arc(fpx, fpy, (2.2+Math.sin(f*0.07+i)*1.4)*intensity, 0, Math.PI*2); ctx.fill();
    }
    ctx.globalAlpha = 1; ctx.restore();
}
function s2(x){return x;} // identity, avoids unused-var lint

// ── Liquid gold stream ─────────────────────────────────────────
function j2DrawLiquidGold(ctx, x1, y1, x2, y2, f, alpha) {
    ctx.save(); ctx.globalAlpha = alpha;
    ctx.shadowColor = '#f97316'; ctx.shadowBlur = 14;
    const mid = { x:(x1+x2)/2, y:Math.min(y1,y2)-28+Math.sin(f*0.04)*10 };
    const grad = ctx.createLinearGradient(x1, y1, x2, y2);
    grad.addColorStop(0, '#fde68a'); grad.addColorStop(0.45,'#f97316'); grad.addColorStop(1,'rgba(251,146,60,0.1)');
    ctx.strokeStyle = grad; ctx.lineWidth = 3.5; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.quadraticCurveTo(mid.x, mid.y, x2, y2); ctx.stroke();
    // Droplets along the arc
    for (let t=0.05; t<1; t+=0.16) {
        const bx = (1-t)*(1-t)*x1 + 2*(1-t)*t*mid.x + t*t*x2;
        const by = (1-t)*(1-t)*y1 + 2*(1-t)*t*mid.y + t*t*y2;
        const phase = (t + f*0.025) % 1;
        ctx.globalAlpha = alpha*(0.35+phase*0.55);
        ctx.fillStyle = '#fde68a'; ctx.shadowBlur = 5;
        ctx.beginPath(); ctx.arc(bx, by, 2.5+phase*1.5, 0, Math.PI*2); ctx.fill();
    }
    ctx.restore();
}

// ── God rays (light shafts from source) ───────────────────────
function j2DrawGodRays(ctx, srcX, srcY, count, len, hexColor, f) {
    ctx.save(); ctx.globalCompositeOperation = 'screen';
    let r=255,g=255,b=255;
    if (hexColor && hexColor.length===7) {
        r=parseInt(hexColor.slice(1,3),16);
        g=parseInt(hexColor.slice(3,5),16);
        b=parseInt(hexColor.slice(5,7),16);
    }
    for (let i=0; i<count; i++) {
        const base  = (i/count)*Math.PI*2;
        const angle = base + f*0.0018;
        const rLen  = len*(0.60+Math.sin(f*0.017+i*1.5)*0.38);
        const a     = (0.038+Math.sin(f*0.013+i*1.7)*0.022)*Math.max(0,Math.sin(base*1.4+1.1));
        const sp    = 0.030+Math.abs(Math.sin(i*0.8))*0.018;
        const grd   = ctx.createLinearGradient(srcX, srcY, srcX+Math.cos(angle)*rLen, srcY+Math.sin(angle)*rLen);
        grd.addColorStop(0,   `rgba(${r},${g},${b},${a*3.5})`);
        grd.addColorStop(0.28,`rgba(${r},${g},${b},${a})`);
        grd.addColorStop(1,   'rgba(0,0,0,0)');
        ctx.fillStyle = grd;
        ctx.beginPath();
        ctx.moveTo(srcX, srcY);
        ctx.lineTo(srcX+Math.cos(angle-sp)*rLen, srcY+Math.sin(angle-sp)*rLen);
        ctx.lineTo(srcX+Math.cos(angle+sp)*rLen, srcY+Math.sin(angle+sp)*rLen);
        ctx.closePath(); ctx.fill();
    }
    ctx.globalCompositeOperation = 'source-over'; ctx.restore();
}

// ── Goal hologram panel ────────────────────────────────────────
function j2DrawHologram(ctx, cx, cy, icon, label, subLabel, pct, f) {
    const p=Math.max(0,Math.min(1,pct)), pw=74, ph=58;
    ctx.save();
    // Panel fill
    ctx.globalAlpha = 0.06+p*0.20; ctx.fillStyle = p>=1?'#10b981':'#06b6d4';
    j2RndRect(ctx, cx-pw/2, cy-ph/2, pw, ph, 8);
    // Border
    ctx.globalAlpha = 0.25+p*0.58+Math.sin(f*0.065)*0.10;
    ctx.strokeStyle = p>=1?'#34d399':`rgba(6,182,212,${0.5+Math.sin(f*0.07)*0.28})`;
    ctx.lineWidth = p>=1?2:1.5;
    ctx.beginPath();
    const bx=cx-pw/2, by=cy-ph/2, rr=8;
    ctx.moveTo(bx+rr,by); ctx.arcTo(bx+pw,by,bx+pw,by+ph,rr);
    ctx.arcTo(bx+pw,by+ph,bx,by+ph,rr); ctx.arcTo(bx,by+ph,bx,by,rr);
    ctx.arcTo(bx,by,bx+pw,by,rr); ctx.closePath(); ctx.stroke();
    // Scanlines
    ctx.globalAlpha=0.045; ctx.fillStyle=p>=1?'#34d399':'#67e8f9';
    for (let sl=0;sl<ph;sl+=3) ctx.fillRect(cx-pw/2, cy-ph/2+sl, pw, 1.2);
    // Corner brackets
    ctx.globalAlpha=0.5+p*0.38; ctx.strokeStyle=p>=1?'#34d399':'#67e8f9'; ctx.lineWidth=1.8;
    const bl=9;
    [[bx,by,1,1],[bx+pw,by,-1,1],[bx,by+ph,1,-1],[bx+pw,by+ph,-1,-1]].forEach(([ox,oy,dx,dy])=>{
        ctx.beginPath(); ctx.moveTo(ox+dx*bl,oy); ctx.lineTo(ox,oy); ctx.lineTo(ox,oy+dy*bl); ctx.stroke();
    });
    // Icon
    ctx.globalAlpha=0.52+p*0.42; ctx.font=`${14+p*5}px sans-serif`; ctx.textAlign='center';
    ctx.fillText(p>=1?'✅':icon, cx, cy-7);
    // Main label
    ctx.fillStyle=p>=1?'#34d399':'#67e8f9'; ctx.font=`bold ${8+Math.round(p*2)}px "Inter",sans-serif`;
    ctx.globalAlpha=0.62+p*0.32; ctx.fillText(label, cx, cy+9);
    // Sub label
    if (subLabel) {
        ctx.fillStyle='rgba(255,255,255,0.65)'; ctx.font='7px "Inter",sans-serif';
        ctx.globalAlpha=0.38+p*0.42; ctx.fillText(subLabel, cx, cy+21);
    }
    ctx.textAlign='left'; ctx.restore();
}

// ── Cinematic overlay — vignette + letterbox + lens fringe ─────
function j2DrawCinematicOverlay(ctx, w, h) {
    // Vignette (drawn first, under letterbox)
    const vig = ctx.createRadialGradient(w/2, h/2, w*0.14, w/2, h/2, w*0.74);
    vig.addColorStop(0, 'rgba(0,0,0,0)');
    vig.addColorStop(0.5, 'rgba(0,0,0,0.06)');
    vig.addColorStop(1, 'rgba(0,0,0,0.72)');
    ctx.fillStyle = vig; ctx.fillRect(0, 0, w, h);
    // Letterbox bars — 2.35:1 cinematic widescreen
    const barH = Math.round(h * 0.092);
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, w, barH);
    ctx.fillRect(0, h-barH, w, barH);
    // Subtle anamorphic lens fringe on bar edges
    ctx.fillStyle = 'rgba(99,102,241,0.07)';
    ctx.fillRect(0, barH, w, 1.5);
    ctx.fillRect(0, h-barH-1.5, w, 1.5);
}

// ── Helper drawers ─────────────────────────────────────────────
function j2Cloud(ctx, cx, cy, cw, ch) {
    ctx.beginPath();
    ctx.ellipse(cx, cy, cw/2, ch/2, 0, 0, Math.PI*2);
    ctx.ellipse(cx-cw*0.3, cy+ch*0.1, cw*0.32, ch*0.45, 0, 0, Math.PI*2);
    ctx.ellipse(cx+cw*0.3, cy+ch*0.1, cw*0.3, ch*0.42, 0, 0, Math.PI*2);
    ctx.ellipse(cx-cw*0.55, cy+ch*0.2, cw*0.22, ch*0.38, 0, 0, Math.PI*2);
    ctx.ellipse(cx+cw*0.55, cy+ch*0.2, cw*0.22, ch*0.35, 0, 0, Math.PI*2);
    ctx.fill();
}

function j2Tree(ctx, x, gnd, h, r) {
    const sway = Math.sin(j2Frame*0.012 + x*0.01)*1.5;
    ctx.save(); ctx.translate(x, gnd);
    // Trunk
    ctx.fillStyle='#7c4a1e';
    j2RndRect(ctx, -r*0.22, -h*0.38, r*0.44, h*0.38, 2);
    // Foliage layers
    ctx.translate(sway, 0);
    ctx.fillStyle='#166534';
    ctx.beginPath(); ctx.ellipse(0, -h*0.38-r*0.85, r*1.1, r*1.3, 0, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle='#15803d';
    ctx.beginPath(); ctx.ellipse(0, -h*0.38-r*1.7, r*0.85, r*1.05, 0, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle='#16a34a';
    ctx.beginPath(); ctx.ellipse(0, -h*0.38-r*2.4, r*0.6, r*0.75, 0, 0, Math.PI*2); ctx.fill();
    ctx.restore();
}

function j2Palm(ctx, x, gnd, h, flip) {
    ctx.save(); ctx.translate(x, gnd);
    // Trunk (curved)
    ctx.strokeStyle='#a16207'; ctx.lineWidth=9; ctx.lineCap='round';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(flip?-24:24, -h*0.5, flip?-12:12, -h);
    ctx.stroke();
    // Trunk rings
    ctx.strokeStyle='rgba(180,130,50,0.4)'; ctx.lineWidth=1;
    for (let i=1; i<7; i++) {
        const ty = -h*(i/7), tx = (flip?-1:1)*h*(i/7)*0.15;
        ctx.beginPath(); ctx.moveTo(tx-7, ty); ctx.lineTo(tx+7, ty); ctx.stroke();
    }
    const topX = flip?-12:12, topY = -h;
    // Leaves
    const leafAngles = flip?[0.5,0.1,-0.3,-0.7,-1.1,-1.5]:[-0.5,-0.1,0.3,0.7,1.1,1.5];
    leafAngles.forEach((a,i) => {
        const la = a - Math.PI/2 + Math.sin(j2Frame*0.01+i)*0.03;
        const len = 58+i*2;
        ctx.save(); ctx.globalAlpha=0.9;
        ctx.strokeStyle = i%2===0 ? '#166534' : '#15803d';
        ctx.lineWidth=4; ctx.lineCap='round';
        ctx.beginPath();
        ctx.moveTo(topX, topY);
        ctx.quadraticCurveTo(topX+Math.cos(la)*30, topY+Math.sin(la)*30,
                             topX+Math.cos(la)*len, topY+Math.sin(la)*len);
        ctx.stroke(); ctx.restore();
    });
    // Coconuts
    ctx.fillStyle='#92400e';
    ctx.beginPath(); ctx.arc(topX+5, topY+6, 5.5, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(topX-5, topY+9, 5, 0, Math.PI*2); ctx.fill();
    ctx.restore();
}

// ── Character ──────────────────────────────────────────────────
function j2DrawPerson(ctx, cx, gndY, t, opts) {
    const { shirtColor='#4f46e5', mood='neutral', phoneColor='#10b981',
            hasBaby=false, sunglasses=false, scale:s=1, female=false } = opts;

    const stressed  = mood==='stressed';
    const happy     = mood==='happy'||mood==='ecstatic'||mood==='free';
    const free      = mood==='free';
    const ecstatic  = mood==='ecstatic';

    const amp  = ecstatic?0.44:stressed?0.20:0.33;
    const bob  = Math.abs(Math.sin(t))*3.5*s;
    const legA = Math.sin(t)*amp;
    const armA = -legA*0.75;

    ctx.save();
    ctx.translate(cx, gndY-bob);

    // Shadow
    ctx.fillStyle='rgba(0,0,0,0.20)';
    ctx.beginPath(); ctx.ellipse(0, 0, 18*s, 4.5*s, 0, 0, Math.PI*2); ctx.fill();

    // Legs
    j2Limb(ctx, -9*s, -20*s, legA, 30*s, 11*s, '#1e1b4b');
    j2Limb(ctx, 9*s, -20*s, -legA, 30*s, 11*s, '#1e1b4b');
    // Shoes
    ctx.fillStyle='#111827';
    const lsx=-9*s+Math.sin(legA)*30*s, lsy=-20*s+Math.cos(legA)*30*s;
    const rsx=9*s+Math.sin(-legA)*30*s, rsy=-20*s+Math.cos(-legA)*30*s;
    ctx.beginPath(); ctx.ellipse(lsx, lsy, 10*s, 4.5*s, legA, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(rsx, rsy, 10*s, 4.5*s, -legA, 0, Math.PI*2); ctx.fill();

    // Body
    ctx.fillStyle=shirtColor;
    j2RndRect(ctx, -15*s, -62*s, 30*s, 34*s, 6*s);
    // Collar / lapel detail
    ctx.fillStyle='rgba(255,255,255,0.8)';
    ctx.beginPath(); ctx.moveTo(-7*s,-62*s); ctx.lineTo(0,-52*s); ctx.lineTo(7*s,-62*s); ctx.fill();
    // Pocket detail
    ctx.strokeStyle='rgba(255,255,255,0.25)'; ctx.lineWidth=1*s;
    j2RndRect(ctx, -12*s, -55*s, 10*s, 8*s, 2*s);

    // Arms
    const phoneHand = !hasBaby && !free;
    j2Limb(ctx, -15*s, -58*s, armA, 24*s, 9*s, '#fde8d8');
    j2Limb(ctx, 15*s, -58*s, -armA, 24*s, 9*s, '#fde8d8');

    // Phone
    if (phoneHand) {
        const phx=15*s+Math.sin(-armA)*24*s, phy=-58*s+Math.cos(-armA)*24*s;
        ctx.fillStyle='#1a1a2e'; j2RndRect(ctx, phx+3*s, phy-6*s, 10*s, 15*s, 2*s);
        ctx.fillStyle=phoneColor; j2RndRect(ctx, phx+4.5*s, phy-4.5*s, 7*s, 10*s, 1.5*s);
        // Screen content (tiny chart bars when not stressed)
        if (!stressed) {
            ctx.fillStyle='rgba(255,255,255,0.7)';
            [0,2,4].forEach((bx,bi) => {
                const bh = (bi+1)*2*s;
                ctx.fillRect(phx+5.5*s+bx*s, phy+5.5*s-bh*s, 1.5*s, bh*s);
            });
        }
        if (stressed) {
            ctx.fillStyle='#ef4444';
            ctx.beginPath(); ctx.arc(phx+13*s, phy-6*s, 3*s, 0, Math.PI*2); ctx.fill();
        }
    }

    // Baby
    if (hasBaby) {
        const bax=-15*s+Math.sin(armA)*14*s, bay=-58*s+Math.cos(armA)*14*s-4*s;
        ctx.fillStyle='#fde8d8'; ctx.beginPath(); ctx.arc(bax, bay-7*s, 8*s, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle='#fcd34d'; ctx.fillRect(bax-7*s, bay-16*s, 14*s, 6*s);
        ctx.fillStyle='rgba(0,0,0,0.55)';
        ctx.beginPath(); ctx.arc(bax-2*s, bay-8*s, 1.2*s, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(bax+2*s, bay-8*s, 1.2*s, 0, Math.PI*2); ctx.fill();
        // tiny smile
        ctx.strokeStyle='#b07050'; ctx.lineWidth=1.2*s;
        ctx.beginPath(); ctx.arc(bax, bay-5*s, 3*s, 0.2, Math.PI-0.2); ctx.stroke();
    }

    // Coffee cup (free stage)
    if (free) {
        const cx2=15*s+Math.sin(-armA)*18*s, cy2=-58*s+Math.cos(-armA)*18*s;
        ctx.fillStyle='#7c4a1e'; j2RndRect(ctx, cx2, cy2-6*s, 10*s, 12*s, 2.5*s);
        ctx.fillStyle='rgba(255,255,255,0.9)'; j2RndRect(ctx, cx2+1*s, cy2-5*s, 8*s, 4*s, 1*s);
        ctx.strokeStyle='rgba(255,255,255,0.45)'; ctx.lineWidth=1.5;
        [0, 3].forEach(ox => {
            ctx.beginPath();
            ctx.moveTo(cx2+4*s+ox, cy2-8*s);
            ctx.quadraticCurveTo(cx2+2*s+ox, cy2-12*s, cx2+4*s+ox, cy2-16*s); ctx.stroke();
        });
    }

    // Head
    j2DrawHead(ctx, 0, -78*s, s, { stressed, happy, female, sunglasses, ecstatic, free });
    ctx.restore();
}

function j2DrawHead(ctx, x, y, s, opts) {
    const { stressed, happy, female, sunglasses, ecstatic, free } = opts;

    // Hair back
    ctx.fillStyle=female?'#7c2d12':'#1a1a3e';
    ctx.beginPath(); ctx.ellipse(x, y, 17*s, 20*s, 0, 0, Math.PI*2); ctx.fill();
    if (female) {
        ctx.fillStyle='#7c2d12';
        ctx.beginPath(); ctx.moveTo(x+15*s,y); ctx.quadraticCurveTo(x+24*s,y+16*s,x+10*s,y+27*s); ctx.fill();
        ctx.beginPath(); ctx.moveTo(x-15*s,y); ctx.quadraticCurveTo(x-24*s,y+16*s,x-10*s,y+27*s); ctx.fill();
    }
    // Face
    ctx.fillStyle='#fde8d8';
    ctx.beginPath(); ctx.ellipse(x, y, 15*s, 17*s, 0, 0, Math.PI*2); ctx.fill();
    // Cheeks
    if (happy||free||ecstatic) {
        ctx.fillStyle='rgba(236,72,153,0.22)';
        ctx.beginPath(); ctx.ellipse(x-10*s,y+5*s,5.5*s,3.5*s,0,0,Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(x+10*s,y+5*s,5.5*s,3.5*s,0,0,Math.PI*2); ctx.fill();
    }
    // Hair front
    ctx.fillStyle=female?'#7c2d12':'#1a1a3e';
    ctx.beginPath();
    ctx.moveTo(x-15*s,y-5*s);
    ctx.quadraticCurveTo(x-11*s,y-22*s,x,y-20*s);
    ctx.quadraticCurveTo(x+11*s,y-22*s,x+15*s,y-5*s);
    ctx.quadraticCurveTo(x+8*s,y-14*s,x,y-12*s);
    ctx.quadraticCurveTo(x-8*s,y-14*s,x-15*s,y-5*s);
    ctx.fill();
    // Eyebrows
    ctx.strokeStyle='#1a1a3e'; ctx.lineWidth=2*s; ctx.lineCap='round';
    if (stressed) {
        ctx.beginPath(); ctx.moveTo(x-12*s,y-11*s); ctx.lineTo(x-3*s,y-8*s); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(x+3*s,y-8*s); ctx.lineTo(x+12*s,y-11*s); ctx.stroke();
    } else {
        ctx.beginPath(); ctx.moveTo(x-12*s,y-11*s); ctx.quadraticCurveTo(x-6*s,y-15*s,x-1*s,y-12*s); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(x+1*s,y-12*s); ctx.quadraticCurveTo(x+6*s,y-15*s,x+12*s,y-11*s); ctx.stroke();
    }
    // Sunglasses / eyes
    if (sunglasses) {
        ctx.fillStyle='rgba(0,0,0,0.78)';
        j2RndRect(ctx, x-14*s,y-7*s, 12*s, 9*s, 3.5*s);
        j2RndRect(ctx, x+2*s, y-7*s, 12*s, 9*s, 3.5*s);
        ctx.strokeStyle='#fbbf24'; ctx.lineWidth=2*s;
        ctx.beginPath(); ctx.moveTo(x-2*s,y-4*s); ctx.lineTo(x+2*s,y-4*s); ctx.stroke();
        ctx.strokeStyle='#475569'; ctx.lineWidth=1.5*s;
        ctx.beginPath(); ctx.moveTo(x-14*s,y-3*s); ctx.lineTo(x-17*s,y-2*s); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(x+14*s,y-3*s); ctx.lineTo(x+17*s,y-2*s); ctx.stroke();
    } else {
        ctx.fillStyle='white';
        ctx.beginPath(); ctx.ellipse(x-6.5*s,y,5*s,6*s,0,0,Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(x+6.5*s,y,5*s,6*s,0,0,Math.PI*2); ctx.fill();
        ctx.fillStyle=female?'#7c3aed':'#3730a3';
        ctx.beginPath(); ctx.ellipse(x-6.5*s,y+0.5*s,3.2*s,4.2*s,0,0,Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(x+6.5*s,y+0.5*s,3.2*s,4.2*s,0,0,Math.PI*2); ctx.fill();
        ctx.fillStyle='#0f0e1a';
        ctx.beginPath(); ctx.arc(x-6.5*s,y+0.5*s,2*s,0,Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(x+6.5*s,y+0.5*s,2*s,0,Math.PI*2); ctx.fill();
        ctx.fillStyle='white';
        ctx.beginPath(); ctx.arc(x-5*s,y-1.4*s,1.5*s,0,Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(x+8*s,y-1.4*s,1.5*s,0,Math.PI*2); ctx.fill();
        if (ecstatic) {
            ctx.fillStyle='#fbbf24';
            for (let p=0; p<5; p++) {
                const pa=(p/5)*Math.PI*2, pr=3*s;
                const px=x-6.5*s+Math.cos(pa)*pr, py=y+Math.sin(pa)*pr;
                ctx.beginPath(); ctx.arc(px,py,1.3*s,0,Math.PI*2); ctx.fill();
                const px2=x+6.5*s+Math.cos(pa)*pr;
                ctx.beginPath(); ctx.arc(px2,py,1.3*s,0,Math.PI*2); ctx.fill();
            }
        }
    }
    // Nose
    ctx.strokeStyle='rgba(160,100,60,0.5)'; ctx.lineWidth=1.2*s;
    ctx.beginPath(); ctx.moveTo(x-1.5*s,y-2*s); ctx.lineTo(x-2.5*s,y+3*s); ctx.lineTo(x+2.5*s,y+3*s); ctx.stroke();
    // Mouth
    ctx.strokeStyle='#b07050'; ctx.lineWidth=2*s; ctx.lineCap='round';
    ctx.beginPath();
    if (stressed)          { ctx.moveTo(x-5*s,y+12*s); ctx.quadraticCurveTo(x,y+9*s, x+5*s,y+12*s); }
    else if (ecstatic||free){ ctx.moveTo(x-8*s,y+9*s); ctx.quadraticCurveTo(x,y+17*s,x+8*s,y+9*s); }
    else if (happy)        { ctx.moveTo(x-6*s,y+9*s); ctx.quadraticCurveTo(x,y+14*s,x+6*s,y+9*s); }
    else                   { ctx.moveTo(x-4*s,y+10*s); ctx.quadraticCurveTo(x,y+13*s,x+4*s,y+10*s); }
    ctx.stroke();
    // Teeth (happy/ecstatic)
    if (happy||ecstatic||free) {
        ctx.fillStyle='white'; ctx.save(); ctx.beginPath();
        if (ecstatic||free) { ctx.moveTo(x-8*s,y+9*s); ctx.quadraticCurveTo(x,y+17*s,x+8*s,y+9*s); }
        else { ctx.moveTo(x-6*s,y+9*s); ctx.quadraticCurveTo(x,y+14*s,x+6*s,y+9*s); }
        ctx.closePath(); ctx.clip(); ctx.fillRect(x-8*s, y+9*s, 16*s, 6*s); ctx.restore();
    }
}

function j2Limb(ctx, x, y, angle, length, width, color) {
    ctx.save(); ctx.translate(x,y); ctx.rotate(angle);
    ctx.fillStyle=color;
    j2RndRect(ctx, -width/2, 0, width, length, width/2);
    ctx.restore();
}

function j2RndRect(ctx, x, y, w, h, r) {
    r = Math.min(r, w/2, h/2);
    ctx.beginPath();
    ctx.moveTo(x+r,y);
    ctx.arcTo(x+w,y,x+w,y+h,r);
    ctx.arcTo(x+w,y+h,x,y+h,r);
    ctx.arcTo(x,y+h,x,y,r);
    ctx.arcTo(x,y,x+w,y,r);
    ctx.closePath(); ctx.fill();
}

// ── Particles ──────────────────────────────────────────────────
function j2SpawnParticles(w, maxY, color) {
    if (j2Particles.length < 80 && Math.random() < 0.4) {
        const colors = [color,'#fde68a','#f9a8d4','#a5f3fc','#bbf7d0','#c4b5fd','#fff'];
        j2Particles.push({
            x: Math.random()*w, y: maxY,
            vx: (Math.random()-0.5)*4, vy: -(2.5+Math.random()*4.5),
            color: colors[Math.floor(Math.random()*colors.length)],
            size: 3+Math.random()*6, life:1, decay:0.011+Math.random()*0.009,
            rot: Math.random()*Math.PI, rotV:(Math.random()-0.5)*0.18,
            shape: Math.random() < 0.5 ? 'rect' : 'circle'
        });
    }
}
function j2DrawParticles(ctx, h) {
    j2Particles = j2Particles.filter(p => p.life > 0);
    j2Particles.forEach(p => {
        p.x+=p.vx; p.y+=p.vy; p.vy+=0.13; p.rot+=p.rotV; p.life-=p.decay;
        ctx.save(); ctx.globalAlpha=p.life; ctx.translate(p.x,p.y); ctx.rotate(p.rot);
        ctx.fillStyle=p.color;
        if (p.shape==='circle') { ctx.beginPath(); ctx.arc(0,0,p.size/2,0,Math.PI*2); ctx.fill(); }
        else ctx.fillRect(-p.size/2,-p.size/2,p.size,p.size);
        ctx.restore();
    });
}

// ── HUD — real data, FI progress bar ──────────────────────────
function j2DrawHUD(ctx, w, h, stage) {
    // Smooth wealth counter
    j2WealthTarget = stage.wealth;
    j2WealthDisp += (j2WealthTarget - j2WealthDisp) * 0.06;
    const dispW = Math.round(j2WealthDisp);

    // Letterbox bar height — keeps HUD inside the visible content area
    const lbH = Math.round(h * 0.092); // ~29px at 320px canvas height

    // ── NET WORTH pill (top-left) ──
    const wLabel = j2Fmt(dispW);
    const nwTop = lbH + 5;
    ctx.fillStyle='rgba(0,0,0,0.62)';
    j2RndRect(ctx, 10, nwTop, 150, 44, 10);
    ctx.fillStyle='rgba(255,255,255,0.45)';
    ctx.font=`bold 9px "JetBrains Mono",monospace`;
    ctx.fillText('NET WORTH', 20, nwTop + 14);
    ctx.fillStyle='#34d399';
    ctx.font=`bold 16px "JetBrains Mono",monospace`;
    ctx.fillText(wLabel, 20, nwTop + 34);

    // ── Age + Year pill (top-right) ──
    const ageTxt = `Age ${stage.age} · ${stage.year}`;
    const aTw = ctx.measureText(ageTxt).width;
    ctx.fillStyle='rgba(0,0,0,0.62)';
    j2RndRect(ctx, w-aTw-28, nwTop, aTw+18, 30, 8);
    ctx.fillStyle='rgba(255,255,255,0.85)';
    ctx.font=`bold 12px "Inter",sans-serif`;
    ctx.fillText(ageTxt, w-aTw-19, nwTop + 20);

    // ── SIP badge (top-right, below age) ──
    if (stage.invest > 0) {
        const sipTxt = `SIP ${j2Fmt(stage.invest)}/mo`;
        const sTw = ctx.measureText(sipTxt).width;
        const sipTop = nwTop + 38;
        ctx.fillStyle='rgba(79,70,229,0.75)';
        j2RndRect(ctx, w-sTw-28, sipTop, sTw+18, 26, 7);
        ctx.fillStyle='rgba(255,255,255,0.9)';
        ctx.font=`bold 11px "Inter",sans-serif`;
        ctx.fillText(sipTxt, w-sTw-19, sipTop + 17);
    }

    // ── FI Progress bar (bottom of canvas, above letterbox) ──
    const barX=10, barY=h-lbH-26, barW=w-20, barH=14;
    const pct = stage.fiPct || 0;
    // Track
    ctx.fillStyle='rgba(0,0,0,0.50)';
    j2RndRect(ctx, barX, barY, barW, barH, 7);
    // Fill gradient
    if (pct > 0) {
        const barFill = Math.max(barH, barW * pct / 100);
        const grad = ctx.createLinearGradient(barX, 0, barX+barFill, 0);
        grad.addColorStop(0, '#6366f1');
        grad.addColorStop(0.5, '#10b981');
        grad.addColorStop(1, '#06b6d4');
        ctx.fillStyle = grad;
        ctx.save(); ctx.beginPath();
        ctx.roundRect ? ctx.roundRect(barX,barY,Math.min(barFill,barW),barH,7) : j2RndRect(ctx,barX,barY,Math.min(barFill,barW),barH,7);
        ctx.fill(); ctx.restore();
        // Glow pulse on the fill edge
        if (pct < 100) {
            const edgeX = barX + barW*pct/100;
            ctx.save();
            ctx.shadowColor='#34d399'; ctx.shadowBlur=8;
            ctx.fillStyle='rgba(52,211,153,0.7)';
            ctx.beginPath(); ctx.arc(edgeX, barY+barH/2, 5, 0, Math.PI*2); ctx.fill();
            ctx.restore();
        }
    }
    // Label inside bar
    ctx.fillStyle='rgba(255,255,255,0.92)';
    ctx.font=`bold 9px "JetBrains Mono",monospace`;
    ctx.fillText(`FI ${pct}%  •  Target ${j2Fmt(stage.wealth > 0 ? (stage.wealth/(pct||1)*100) : 0)}`, barX+10, barY+10);

    // ── Mood speech bubble ──
    const moods = ['😤 Stressed!','💪 Building...','📈 Momentum!','😍 Life is good','🎉 MILESTONE!','🚀 25% FREE!','🏠 Halfway!','🔥 75% THERE!','🌅 I AM FREE!'];
    const moodTxt = moods[j2Stage] || '';
    const mw2 = ctx.measureText(moodTxt).width + 22;
    const charX2 = w * 0.28;
    const bx2 = Math.max(4, Math.min(w-mw2-4, charX2-mw2/2));
    const bY2 = h - lbH - 46;
    ctx.fillStyle='rgba(0,0,0,0.68)';
    j2RndRect(ctx, bx2, bY2, mw2, 22, 6);
    ctx.fillStyle='rgba(0,0,0,0.68)';
    ctx.beginPath(); ctx.moveTo(charX2-5,bY2+22); ctx.lineTo(charX2+5,bY2+22); ctx.lineTo(charX2,bY2+28); ctx.fill();
    ctx.fillStyle='white';
    ctx.font='bold 11px "Inter",sans-serif';
    ctx.fillText(moodTxt, bx2+11, bY2+15);
}

function j2FmtWealth(n) { return j2Fmt(n); }

// ── Stage management ───────────────────────────────────────────
function j2GoTo(idx) {
    if (!J2_STAGES.length) return;
    j2Stage = Math.max(0, Math.min(J2_STAGES.length-1, idx));
    j2Particles = [];
    const stage = J2_STAGES[j2Stage];
    const m = (typeof engineMemory !== 'undefined') ? engineMemory : {};

    document.querySelectorAll('.j2-dot').forEach((d,i) => {
        d.classList.toggle('active', i===j2Stage);
        d.classList.toggle('done', i<j2Stage);
    });

    // ── Stage badge on canvas ──
    const stageOv = document.getElementById('j2-stage-label');
    if (stageOv) stageOv.textContent = stage.emoji + '  ' + stage.tag;

    // ── Age tag ──
    const ageEl = document.getElementById('j2-age');
    if (ageEl) ageEl.textContent = `Age ${stage.age} · ${stage.year}`;

    // ── Story title ──
    const titleEl = document.getElementById('j2-title');
    if (titleEl) titleEl.textContent = stage.title;

    // ── Chapter tag ──
    const chTag = document.getElementById('sim-ch-tag');
    const chName = J2_CHAPTERS[j2Stage] || stage.tag;
    if (chTag) chTag.textContent = `Chapter ${j2Stage+1} · ${chName}`;

    // ── Narrative text — the heart of the experience ──
    const eventsEl = document.getElementById('j2-events');
    if (eventsEl) {
        const raw = buildNarration(stage, m);
        eventsEl.innerHTML = raw
            .replace(/\*([^*]+)\*/g, '<em>$1</em>')
            .split('\n\n')
            .filter(p => p.trim())
            .map((p, i) => `<p class="sim-para" style="animation-delay:${i*0.09}s">${p}</p>`)
            .join('');
    }

    // ── Metrics row ──
    const nwEl  = document.getElementById('j2-nw');
    const sipEl = document.getElementById('j2-sip-disp');
    const pctEl = document.getElementById('j2-fi-pct');
    const fillEl= document.getElementById('j2-fi-fill');
    if (nwEl)   nwEl.textContent  = j2Fmt(stage.wealth);
    if (sipEl)  sipEl.textContent = stage.invest > 0 ? j2Fmt(stage.invest)+'/mo' : '—';
    if (pctEl)  pctEl.textContent = (stage.fiPct || 0) + '%';
    if (fillEl) fillEl.style.width= (stage.fiPct || 0) + '%';

    // ── Card accent colour ──
    const card = document.getElementById('j2-card');
    if (card) {
        card.style.borderBottomColor = stage.color+'55';
        card.style.borderLeftColor   = stage.color+'55';
    }

    // ── Trigger cinematic chapter overlay on canvas ──
    j2ChapterAlpha = 3.0;
    j2ChapterLabel = `Chapter ${j2Stage+1}: ${chName}`;

    const pb = document.getElementById('j2-playbtn');
    if (pb) pb.textContent = (j2Stage===J2_STAGES.length-1&&!j2Playing) ? '↩ Restart' : (j2Playing?'⏸ Pause':'▶  Play My Story');
}

function j2Toggle() {
    if (!J2_STAGES.length) return;
    if (j2Stage===J2_STAGES.length-1&&!j2Playing) j2Stage=-1;
    if (j2Playing) {
        j2Playing=false; clearInterval(j2Timer);
        const pb=document.getElementById('j2-playbtn');
        if(pb) pb.textContent='▶  Play My Story';
    } else {
        j2Playing=true;
        const pb=document.getElementById('j2-playbtn');
        if(pb) pb.textContent='⏸ Pause';
        j2GoTo(j2Stage+1 < J2_STAGES.length ? j2Stage+1 : j2Stage);
        j2Timer=setInterval(()=>{
            if(j2Stage<J2_STAGES.length-1) j2GoTo(j2Stage+1);
            else { j2Playing=false; clearInterval(j2Timer); const pb=document.getElementById('j2-playbtn'); if(pb) pb.textContent='↩ Restart'; }
        }, 3200);
    }
}
function j2Next() { j2GoTo(j2Stage+1); }
function j2Prev() { j2GoTo(j2Stage-1); }

// ── Init on tab open ──────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    ['nav-simulator'].forEach(id => {
        const el=document.getElementById(id);
        if(el) el.addEventListener('click', ()=>setTimeout(j2Setup,60));
    });
    window.addEventListener('resize', ()=>{
        if(document.getElementById('pg-sim')?.classList.contains('on')) j2Setup();
    });
});

// ════════════════════════════════════════════════════════════════
//  WEALTH HEALTH REPORT CARD ENGINE
// ════════════════════════════════════════════════════════════════

function buildWealthReport() {
    const m = engineMemory;
    if (!m || !m.income) {
        // No data yet — show placeholder state
        setReportPlaceholder();
        return;
    }

    const income   = m.income       || 0;
    const exp      = m.totalExp     || 0;
    const surplus  = m.surplus      || m.sumSurplus || 0;
    const sip      = m.sip          || 0;
    const netWorth = m.netWorth     || 0;
    const liab     = m.totalLiabilities || 0;
    const assets   = m.totalAssets  || 0;
    const cash     = m.astCash      || 0;
    const emMonths = m.emFundMonths || 0;
    const cagr     = m.blendedCAGR  || 0;
    const hasMed   = m.hasMedIns;
    const hasTerm  = m.hasTermIns;
    const dArr     = m.dArr         || [];
    const name     = (m.name || 'Friend').split(' ')[0];
    const riskLvl  = m.riskLevel    || 2;

    // ── 1. SCORE CALCULATION (out of 100) ──────────────────────
    let score = 0;
    const scoreBreakdown = {};

    // (a) Cash Flow health — 25 pts
    const savingsRate = income > 0 ? surplus / income : 0;
    let cfPts = 0;
    if      (savingsRate >= 0.30) cfPts = 25;
    else if (savingsRate >= 0.20) cfPts = 20;
    else if (savingsRate >= 0.10) cfPts = 13;
    else if (savingsRate >= 0.05) cfPts = 7;
    else if (savingsRate >= 0)    cfPts = 3;
    else                          cfPts = 0; // negative surplus
    scoreBreakdown.cashflow = cfPts;

    // (b) Debt burden — 25 pts
    const debtRatio = income > 0 ? liab / (income * 12) : 0; // years of income
    let debtPts = 0;
    if      (liab === 0)          debtPts = 25;
    else if (debtRatio <= 0.5)    debtPts = 22;
    else if (debtRatio <= 1)      debtPts = 17;
    else if (debtRatio <= 2)      debtPts = 10;
    else if (debtRatio <= 4)      debtPts = 5;
    else                          debtPts = 0;
    scoreBreakdown.debt = debtPts;

    // (c) Investing — 25 pts
    const sipRate = income > 0 ? sip / income : 0;
    let invPts = 0;
    if      (sipRate >= 0.25) invPts = 25;
    else if (sipRate >= 0.15) invPts = 20;
    else if (sipRate >= 0.10) invPts = 14;
    else if (sipRate >= 0.05) invPts = 8;
    else if (sipRate >  0)    invPts = 4;
    else                      invPts = 0;
    scoreBreakdown.invest = invPts;

    // (d) Safety net — 25 pts
    let safetyPts = 0;
    if (emMonths >= 6) safetyPts += 10; else if (emMonths >= 3) safetyPts += 5;
    if (hasMed)        safetyPts += 8;
    if (hasTerm)       safetyPts += 7;
    scoreBreakdown.safety = safetyPts;

    score = cfPts + debtPts + invPts + safetyPts;

    // ── 2. GRADE ───────────────────────────────────────────────
    let grade, gradeClass, heroSub;
    if      (score >= 80) { grade='Excellent';  gradeClass='grade-great';    heroSub=`${name}, your wealth is in great shape. You're building a strong financial future. Keep it up!`; }
    else if (score >= 60) { grade='Good';       gradeClass='grade-good';     heroSub=`${name}, you're doing well overall. A few targeted fixes will put you on the fast track.`; }
    else if (score >= 40) { grade='Moderate';   gradeClass='grade-moderate'; heroSub=`${name}, you have a foundation — but there are clear gaps that need attention soon.`; }
    else                  { grade='Needs Work'; gradeClass='grade-critical'; heroSub=`${name}, your finances need urgent attention. The good news — a few smart moves can turn this around quickly.`; }

    // ── 3. ANIMATE SCORE RING ─────────────────────────────────
    const ringArc = document.getElementById('rpt-ring-arc');
    const scoreEl = document.getElementById('rpt-score-num');
    const badgeEl = document.getElementById('rpt-grade-badge');
    const heroName = document.getElementById('rpt-hero-name');
    const heroSub2 = document.getElementById('rpt-hero-sub');
    if (ringArc) {
        const circumference = 314;
        const offset = circumference - (score / 100) * circumference;
        ringArc.style.strokeDashoffset = offset;
        const scoreColor = score>=80?'#a5b4fc':score>=60?'#34d399':score>=40?'#fbbf24':'#f87171';
        ringArc.style.stroke = scoreColor;
    }
    if (scoreEl) { scoreEl.textContent = score; }
    if (badgeEl) { badgeEl.textContent = grade; badgeEl.className = 'rpt-grade-badge ' + gradeClass; }
    if (heroName) heroName.textContent = `${name}'s Wealth Health Report`;
    if (heroSub2) heroSub2.textContent = heroSub;

    // ── 4. VITAL SIGNS ────────────────────────────────────────
    function setVital(valId, gradeId, cardId, val, gradeClass, gradeLabel) {
        const v=document.getElementById(valId), g=document.getElementById(gradeId), c=document.getElementById(cardId);
        if(v) v.textContent = val;
        if(g) { g.textContent = gradeLabel; g.className = 'rpt-vital-grade ' + gradeClass; }
        if(c) c.className = 'rpt-vital-card ' + gradeClass;
    }

    // Cash Flow vital
    const srPct = Math.round(savingsRate * 100);
    const cfGr  = cfPts>=20?'grade-great':cfPts>=13?'grade-good':cfPts>=7?'grade-moderate':'grade-critical';
    const cfLbl = cfPts>=20?'Excellent':cfPts>=13?'Good':cfPts>=7?'Moderate':'Critical';
    setVital('rvit-cf-val','rvit-cf-grade','rvit-cashflow', `${srPct}% saved`, cfGr, cfLbl);

    // Debt vital
    const debtGr  = debtPts>=22?'grade-great':debtPts>=17?'grade-good':debtPts>=10?'grade-moderate':'grade-critical';
    const debtLbl = debtPts>=22?'Healthy':debtPts>=17?'Manageable':debtPts>=10?'High':'Critical';
    const debtDisp = liab===0 ? 'Debt-free' : formatCurrency(liab);
    setVital('rvit-debt-val','rvit-debt-grade','rvit-debt', debtDisp, debtGr, debtLbl);

    // Investing vital
    const invGr  = invPts>=20?'grade-great':invPts>=14?'grade-good':invPts>=8?'grade-moderate':'grade-critical';
    const invLbl = invPts>=20?'Excellent':invPts>=14?'Good':invPts>=8?'Moderate':'Low';
    const invDisp = sip>0 ? `${formatCurrency(sip)}/mo` : '₹0/mo';
    setVital('rvit-invest-val','rvit-invest-grade','rvit-invest', invDisp, invGr, invLbl);

    // Safety vital
    const safeGr  = safetyPts>=20?'grade-great':safetyPts>=13?'grade-good':safetyPts>=7?'grade-moderate':'grade-critical';
    const safeLbl = safetyPts>=20?'Protected':safetyPts>=13?'Adequate':safetyPts>=7?'Partial':'Exposed';
    const safeDisp = `${Math.round(emMonths)}mo cover`;
    setVital('rvit-safety-val','rvit-safety-grade','rvit-safety', safeDisp, safeGr, safeLbl);

    // ── 5. DOCTOR'S DIAGNOSIS CARDS ───────────────────────────
    const diagContainer = document.getElementById('rpt-diagnoses');
    if (diagContainer) {
        const diags = [];

        // Cash flow diagnosis
        if (savingsRate >= 0.20) {
            diags.push({ icon:'💚', grade:'grade-good', title:'Cash Flow is Strong',
                text:`You're saving <strong>${srPct}%</strong> of your income (₹${formatCurrency(surplus)}/mo). This is above the healthy 20% benchmark. Your financial engine is well-fuelled.` });
        } else if (savingsRate >= 0.10) {
            diags.push({ icon:'🟡', grade:'grade-moderate', title:'Cash Flow is Moderate',
                text:`You're saving <strong>${srPct}%</strong> of income. Aim for 20%+ to accelerate wealth building. Review your top 3 expense categories for cuts.` });
        } else if (savingsRate > 0) {
            diags.push({ icon:'🔴', grade:'grade-critical', title:'Cash Flow is Tight',
                text:`You're only saving <strong>${srPct}%</strong> of income. This limits your ability to invest or handle emergencies. This is the #1 thing to fix first.` });
        } else {
            diags.push({ icon:'🚨', grade:'grade-critical', title:'Spending Exceeds Income',
                text:`Your expenses exceed income by <strong>${formatCurrency(Math.abs(surplus))}/mo</strong>. You're drawing down savings every month. Urgent action needed.` });
        }

        // Debt diagnosis
        if (liab === 0) {
            diags.push({ icon:'🏆', grade:'grade-great', title:'Debt-Free — Excellent',
                text:`You have zero debt. This is a massive advantage — your full surplus can go towards building wealth. Stay away from high-interest credit card debt.` });
        } else {
            // find worst loan by interest rate
            const sortedLoans = [...dArr].sort((a,b)=>(b.rate||0)-(a.rate||0));
            const worstLoan = sortedLoans[0];
            const emiPct = income > 0 ? Math.round((sortedLoans.reduce((s,d)=>s+(d.emi||0),0)/income)*100) : 0;
            if (emiPct > 50) {
                diags.push({ icon:'🚨', grade:'grade-critical', title:`Debt is Crushing — ${emiPct}% of Income Goes to EMIs`,
                    text:`Your EMIs consume <strong>${emiPct}%</strong> of your income. This leaves very little room for investing or emergencies. Your worst loan: <strong>${worstLoan?.name||'High-interest loan'}</strong>. Prioritise paying this off first.` });
            } else if (emiPct > 30) {
                diags.push({ icon:'⚠️', grade:'grade-moderate', title:`Debt is Heavy — ${emiPct}% of Income in EMIs`,
                    text:`<strong>${emiPct}%</strong> of income goes to EMIs — above the safe 30% limit. Pay off <strong>${worstLoan?.name||'your highest-rate loan'}</strong> first to free up cash flow for investing.` });
            } else {
                diags.push({ icon:'✅', grade:'grade-good', title:`Debt is Manageable — ${emiPct}% of Income`,
                    text:`Your EMIs are <strong>${emiPct}%</strong> of income — within the healthy range. Keep making timely payments. Avoid taking new loans unless essential.` });
            }
        }

        // Investing diagnosis
        if (sipRate >= 0.20) {
            diags.push({ icon:'🚀', grade:'grade-great', title:'Investing Aggressively — Great',
                text:`You're investing <strong>${Math.round(sipRate*100)}%</strong> of your income. At ${(cagr||12).toFixed(1)}% CAGR, this puts you firmly on the path to financial independence.` });
        } else if (sipRate >= 0.10) {
            diags.push({ icon:'📈', grade:'grade-good', title:'Investing Steadily',
                text:`You invest <strong>${formatCurrency(sip)}/month</strong>. Good start — but increasing SIP by just ₹2,000–5,000/mo could add <strong>₹20–40L</strong> to your corpus in 15 years.` });
        } else if (sip > 0) {
            diags.push({ icon:'📉', grade:'grade-moderate', title:'Investing Too Little',
                text:`Your SIP of <strong>${formatCurrency(sip)}/mo</strong> is only ${Math.round(sipRate*100)}% of income. You need at least 15–20% to build real wealth. Increase by ₹1,000 every 3 months.` });
        } else {
            diags.push({ icon:'❌', grade:'grade-critical', title:'Not Investing Yet',
                text:`You have no active SIP or investment. Every month without investing is compounding working against you. Even ₹500/month is a better start than ₹0.` });
        }

        // PPF/Tax — smart gap detection
        let hasPPF = false;
        if (window.engineMemory) {
            // Check if PPF is in assets
            const allAssets = document.querySelectorAll('.dy-asset');
            allAssets.forEach(row => {
                const t = row.querySelector('.a-type')?.value || '';
                if (t === 'ppf') hasPPF = true;
            });
        }
        if (!hasPPF && income >= 30000) {
            const taxSave = Math.min(46800, Math.round(income * 12 * 0.30 * 0.10));
            diags.push({ icon:'🏛️', grade:'grade-moderate', title:'PPF Not Used — Missing Tax-Free Returns',
                text:`You don't have a PPF account. PPF gives <strong>7.1% tax-free (EEE)</strong> returns with full 80C benefit. Investing <strong>₹12,500/mo</strong> saves up to <strong>₹46,800/year in tax</strong>. Open one this month.` });
        }

        // Insurance diagnosis
        if (!hasMed && !hasTerm) {
            diags.push({ icon:'🚨', grade:'grade-critical', title:'No Insurance — Your Family is Exposed',
                text:`You have neither health insurance nor term life insurance. A single medical emergency or accident could wipe out years of savings. Get a <strong>₹10L health policy (₹500/mo)</strong> and a <strong>₹1Cr term plan (₹700/mo)</strong> immediately.` });
        } else if (!hasMed) {
            diags.push({ icon:'⚠️', grade:'grade-moderate', title:'No Health Insurance',
                text:`You have term insurance but no health cover. Medical bills are the #1 reason families go broke in India. A ₹10L floater health policy costs around ₹500–800/month.` });
        } else if (!hasTerm) {
            diags.push({ icon:'⚠️', grade:'grade-moderate', title:'No Term Life Insurance',
                text:`You have health cover but no term life insurance. If you have dependents, a ₹1Cr term plan costs just ₹600–900/month. Your family deserves this safety net.` });
        } else {
            diags.push({ icon:'🛡️', grade:'grade-good', title:'Insurance Coverage is Good',
                text:`You have both health and term insurance. This is essential protection. Review your coverage once a year as income and family size grow.` });
        }

        // Emergency Fund
        if (emMonths >= 6) {
            diags.push({ icon:'✅', grade:'grade-good', title:`Emergency Fund: ${Math.round(emMonths)} Months Covered`,
                text:`Your emergency buffer is solid. Keep it in a liquid fund or savings account — not in equity or locked instruments.` });
        } else if (emMonths >= 3) {
            diags.push({ icon:'🟡', grade:'grade-moderate', title:`Emergency Fund: Only ${Math.round(emMonths)} Months`,
                text:`You have ${Math.round(emMonths)} months of expenses saved. Build this to <strong>6 months</strong> (${formatCurrency(exp*6)}) before aggressively investing.` });
        } else {
            diags.push({ icon:'🔴', grade:'grade-critical', title:'Emergency Fund is Dangerously Low',
                text:`You have less than ${Math.round(emMonths)} months of expenses in liquid savings. One job loss or medical event could force you to sell investments at a loss. Build this first.` });
        }

        diagContainer.innerHTML = diags.map((d,i) => `
            <div class="rpt-diag-card ${d.grade}" style="animation-delay:${i*0.07}s">
                <div class="rpt-diag-icon">${d.icon}</div>
                <div class="rpt-diag-body">
                    <div class="rpt-diag-title">${d.title}</div>
                    <div class="rpt-diag-text">${d.text}</div>
                </div>
            </div>`).join('');
    }

    // ── 6. LOAN X-RAY ─────────────────────────────────────────
    const loanContainer = document.getElementById('rpt-loan-xray');
    const loanLabel     = document.getElementById('rpt-loan-section-label');
    if (loanContainer && dArr.length > 0) {
        if (loanLabel) loanLabel.style.display = 'block';
        const totalEMI = dArr.reduce((s,d)=>s+(d.emi||0),0);
        const sortedLoans = [...dArr].sort((a,b)=>(b.emi||0)-(a.emi||0));
        loanContainer.innerHTML = sortedLoans.map(loan => {
            const emiPct = income>0 ? Math.round((loan.emi||0)/income*100) : 0;
            const fillPct = totalEMI>0 ? Math.round((loan.emi||0)/totalEMI*100) : 0;
            const rate = loan.rate ? ` · ${loan.rate}% p.a.` : '';
            const balFmt = loan.bal ? ` · Balance: ${formatCurrency(loan.bal)}` : '';
            return `
            <div class="rpt-loan-row">
                <div class="rpt-loan-top">
                    <span class="rpt-loan-name">${loan.name || 'Loan'}</span>
                    <span class="rpt-loan-pct">${emiPct}% of income</span>
                </div>
                <div class="rpt-loan-bar"><div class="rpt-loan-fill" style="width:${fillPct}%"></div></div>
                <div class="rpt-loan-meta">EMI: ${formatCurrency(loan.emi||0)}/mo${rate}${balFmt}</div>
            </div>`;
        }).join('');
    } else if (loanContainer) {
        loanContainer.innerHTML = '';
        if (loanLabel) loanLabel.style.display = 'none';
    }

    // ── 7. PRESCRIPTIONS ──────────────────────────────────────
    const rxContainer = document.getElementById('rpt-prescriptions');
    if (rxContainer) {
        const rxItems = [];

        // Always prioritise by impact
        if (surplus < 0) {
            rxItems.push({ urgency:'rx-urgent', title:'Cut Expenses Immediately',
                text:`Your expenses exceed income by <strong style="color:#f87171">${formatCurrency(Math.abs(surplus))}/month</strong>. List every expense and cut the bottom 3. Even ₹3,000/month saved = ₹36,000/year.` });
        }

        // Debt payoff order
        if (dArr.length > 0) {
            const toxicDebts = dArr.filter(d=>(d.rate||0)>10).sort((a,b)=>(b.rate||0)-(a.rate||0));
            if (toxicDebts.length > 0) {
                const worst = toxicDebts[0];
                rxItems.push({ urgency:'rx-urgent', title:`Pay Off ${worst.name||'High-Interest Loan'} First`,
                    text:`At ${worst.rate||'high'}% interest, this loan is your biggest wealth destroyer. Divert 100% of surplus here until cleared. Paying it off frees up <strong style="color:#a5b4fc">${formatCurrency(worst.emi||0)}/mo</strong> for investing.` });
            }
        }

        // SIP boost
        if (surplus > 5000 && sipRate < 0.20) {
            const gap = Math.max(0, Math.round(income*0.20) - sip);
            rxItems.push({ urgency:'', title:'Increase Your SIP',
                text:`You have room to invest <strong style="color:#a5b4fc">${formatCurrency(gap)}/month more</strong>. Set up a step-up SIP that increases by 10% each year — this alone could add ₹50L+ to your retirement corpus.` });
        }

        // PPF suggestion
        if (!hasPPF && income >= 30000) {
            rxItems.push({ urgency:'', title:'Open a PPF Account This Month',
                text:`PPF gives <strong style="color:#a5b4fc">7.1% tax-free (EEE)</strong>. Invest ₹12,500/month (₹1.5L/yr) and save up to ₹46,800 in tax. It takes 15 minutes at any post office or nationalised bank.` });
        }

        // Emergency fund
        if (emMonths < 6) {
            const needed = Math.max(0, exp*6 - cash);
            rxItems.push({ urgency: emMonths<3?'rx-urgent':'', title:`Build Your Emergency Fund to 6 Months`,
                text:`You need <strong style="color:#a5b4fc">${formatCurrency(needed)} more</strong> to reach a 6-month buffer. Park it in a liquid mutual fund (Parag Parikh or HDFC Liquid) — better returns than savings account, withdrawable in 1 day.` });
        }

        // Insurance
        if (!hasMed) {
            rxItems.push({ urgency:'rx-urgent', title:'Buy Health Insurance Today',
                text:`A <strong style="color:#f87171">₹10L family floater</strong> plan costs ₹500–800/month. One hospitalisation without insurance can wipe out 2–3 years of savings. Compare on PolicyBazaar.` });
        }
        if (!hasTerm) {
            rxItems.push({ urgency:'rx-urgent', title:'Get a Term Life Insurance Policy',
                text:`A <strong style="color:#f87171">₹1 Crore term plan</strong> for a 30-year-old costs ~₹700/month. If you have a spouse, children, or elderly parents depending on you — this is non-negotiable.` });
        }

        // Good habit reinforcement
        if (score >= 60) {
            rxItems.push({ urgency:'rx-good', title:'Keep Your SIP Running on Auto-Pilot',
                text:`Never pause your SIPs. Market crashes are when SIPs work best (you buy more units at lower prices). Set it up as an auto-debit so you never miss a month.` });
        }
        if (score >= 75) {
            rxItems.push({ urgency:'rx-good', title:`Review Your Plan Every 6 Months`,
                text:`You're on the right track, ${name}. Revisit this report every 6 months — when income increases, increase SIP by the same %. Small upgrades compound dramatically over time.` });
        }

        rxContainer.innerHTML = rxItems.map((rx,i)=>`
            <div class="rpt-rx-card ${rx.urgency}" style="animation-delay:${i*0.08}s">
                <div class="rpt-rx-num">${i+1}</div>
                <div class="rpt-rx-body">
                    <div class="rpt-rx-title">${rx.title}</div>
                    <div class="rpt-rx-text">${rx.text}</div>
                </div>
            </div>`).join('');
    }
}

function setReportPlaceholder() {
    const scoreEl = document.getElementById('rpt-score-num');
    const badgeEl = document.getElementById('rpt-grade-badge');
    const heroSub = document.getElementById('rpt-hero-sub');
    const diag    = document.getElementById('rpt-diagnoses');
    const rx      = document.getElementById('rpt-prescriptions');
    if (scoreEl) scoreEl.textContent = '—';
    if (badgeEl) { badgeEl.textContent = 'Not calculated'; badgeEl.className='rpt-grade-badge grade-moderate'; }
    if (heroSub) heroSub.textContent = 'Go to "My Numbers", fill in your details, and tap Compute My Wealth Blueprint to see your full health report.';
    if (diag) diag.innerHTML = `<div class="rpt-diag-card grade-moderate"><div class="rpt-diag-icon">📋</div><div class="rpt-diag-body"><div class="rpt-diag-title">No data yet</div><div class="rpt-diag-text">Fill in your income, expenses, assets and loans in "My Numbers", then tap <strong>Compute My Wealth Blueprint</strong>.</div></div></div>`;
    if (rx)   rx.innerHTML = '';
}

// ════════════════════════════════════════════════════════════════
//  UPGRADED AI CHAT — clearAIChat + typing indicator
// ════════════════════════════════════════════════════════════════

function clearAIChat() {
    const hist = document.getElementById('ai-inline-history');
    if (!hist) return;
    hist.innerHTML = `<div class="chat-msg ai">Chat cleared. Namaste again! 🙏 Ask me anything about your money — loans, PPF, SIP, tax, or retirement.<br><em style="opacity:0.5;font-size:11px;">Not a SEBI advisor — for education only.</em></div>`;
}

// Override sendInlineChat with richer personalised AI prompt (uses original chat-msg CSS)
const _origSendInlineUpgraded = window.sendInlineChat;
window.sendInlineChat = async function() {
    const input  = document.getElementById('ai-inline-input');
    const hist   = document.getElementById('ai-inline-history');
    const sendBtn= document.getElementById('ai-chat-send-btn');
    if (!input || !hist) { if (_origSendInlineUpgraded) _origSendInlineUpgraded(); return; }

    const text = input.value.trim();
    if (!text) return;

    // Add user message using original working CSS class
    const userDiv = document.createElement('div');
    userDiv.className = 'chat-msg user';
    userDiv.textContent = text;
    hist.appendChild(userDiv);
    input.value = '';
    hist.scrollTop = hist.scrollHeight;
    if (sendBtn) sendBtn.disabled = true;

    // Typing indicator using original CSS class
    const typingDiv = document.createElement('div');
    typingDiv.className = 'chat-msg ai';
    typingDiv.id = 'ai-typing-indicator';
    typingDiv.innerHTML = '<span class="ai-typing-dot"></span><span class="ai-typing-dot"></span><span class="ai-typing-dot"></span>';
    hist.appendChild(typingDiv);
    hist.scrollTop = hist.scrollHeight;

    const m = (typeof engineMemory !== 'undefined') ? engineMemory : {};
    const apiKey = (document.getElementById('gemini-api-key') || document.getElementById('gemini-api-key-2') || {value:''}).value.trim();

    if (!apiKey) {
        typingDiv.remove();
        const r = document.createElement('div');
        r.className = 'chat-msg ai';
        r.textContent = 'Please paste your free Gemini API key above to activate me. Takes 30 seconds at aistudio.google.com 🙏';
        hist.appendChild(r);
        hist.scrollTop = hist.scrollHeight;
        if (sendBtn) sendBtn.disabled = false;
        return;
    }

    const dArr = m.dArr || [];
    const name = (m.name || 'Friend').split(' ')[0];
    let sysPrompt = `You are Aarth Sutra — a warm, knowledgeable Indian personal finance guide. Speak like a trusted friend with CA/CFP expertise. Use simple language and Hinglish where helpful.

End every response with: "(Note: Not a SEBI-registered advisor. For education only.)"

Only help with: savings, SIP, mutual funds, FD, stocks, gold, NPS, PPF, EPF, loans/EMI, insurance, Indian taxes (80C/80D/HRA), retirement/FIRE. Decline all other topics politely.

${name}'s profile:
- Income: ₹${m.income||0}/mo | Expenses: ₹${m.totalExp||0}/mo | Surplus: ₹${m.surplus||m.sumSurplus||0}/mo
- SIP: ₹${m.sip||0}/mo | Net worth: ₹${m.netWorth||0}
- Assets: ₹${m.totalAssets||0} (liquid ₹${m.astCash||0}, equity ₹${m.astEq||0}) | Debt: ₹${m.totalLiabilities||0}
- Emergency fund: ${Math.round(m.emFundMonths||0)} months | CAGR: ${(m.blendedCAGR||0).toFixed(1)}%
- Health insurance: ${m.hasMedIns?'Yes':'No'} | Term insurance: ${m.hasTermIns?'Yes':'No'}`;

    if (dArr.length > 0) {
        sysPrompt += `\nLoans: ` + dArr.map(d=>`${d.name||'Loan'} EMI ₹${d.emi||0} @${d.rate||'?'}%`).join(', ');
    }
    if (m.extractedGoals?.length > 0) {
        sysPrompt += `\nGoals: ` + m.extractedGoals.map(g=>`${g.name} ₹${g.target} in ${Math.round((g.monthDue||0)/12)}yr`).join(', ');
    }
    sysPrompt += `\n\nBe concise (3-5 sentences), warm, honest. Use ₹ for amounts.`;

    if (!window._aarthChatHistory) window._aarthChatHistory = [];
    window._aarthChatHistory.push({ role:'user', parts:[{text}] });

    try {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                system_instruction: { parts: { text: sysPrompt } },
                contents: window._aarthChatHistory,
                generationConfig: { temperature: 0.3, maxOutputTokens: 400 }
            })
        });
        const data = await res.json();
        let aiText = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || 'Sorry, could not get a response. Please try again.';
        window._aarthChatHistory.push({ role:'model', parts:[{text:aiText}] });

        if (aiText.startsWith('{') && aiText.endsWith('}')) {
            try {
                const cmd = JSON.parse(aiText);
                if (cmd.action==='generatePDF')   { setTimeout(generateWealthBlueprintPDF,300); aiText='Generating your PDF report now... 📄'; }
                if (cmd.action==='generateExcel') { setTimeout(generateExcelReport,300); aiText='Downloading your Excel report... 📊'; }
            } catch(e) {}
        }

        typingDiv.remove();
        const r = document.createElement('div');
        r.className = 'chat-msg ai';
        r.innerHTML = aiText
            .replace(/\*\*([^*]+)\*\*/g,'<strong>$1</strong>')
            .replace(/\*([^*]+)\*/g,'<em>$1</em>')
            .replace(/\n/g,'<br>');
        hist.appendChild(r);

    } catch(err) {
        typingDiv.remove();
        const r = document.createElement('div');
        r.className = 'chat-msg ai';
        r.textContent = 'Something went wrong. Check your API key and try again.';
        hist.appendChild(r);
    }

    hist.scrollTop = hist.scrollHeight;
    if (sendBtn) sendBtn.disabled = false;
};

