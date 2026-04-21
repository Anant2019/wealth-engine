import { useState, useEffect } from "react";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid,
} from "recharts";
import { Plus, X, CheckCircle } from "lucide-react";

// ─── tokens ───────────────────────────────────────────────────────────────
const C = {
  bg:      "#0b0f1e",
  card:    "rgba(255,255,255,0.05)",
  border:  "rgba(255,255,255,0.09)",
  em:      "#10b981",
  ind:     "#6366f1",
  am:      "#f59e0b",
  re:      "#ef4444",
  pu:      "#8b5cf6",
  tx:      "#f1f5f9",
  su:      "rgba(255,255,255,0.45)",
};

const TXN_KEY     = "we_txns_v3";
const PROFILE_KEY = "we_profile_v3";

const CATS = [
  { id:"food",      emoji:"🍔", label:"Food",      type:"expense", color:C.am  },
  { id:"petrol",    emoji:"⛽", label:"Petrol",    type:"expense", color:"#60a5fa" },
  { id:"groceries", emoji:"🛒", label:"Groceries", type:"expense", color:C.em  },
  { id:"bill",      emoji:"💳", label:"Bill",      type:"expense", color:C.re  },
  { id:"rent",      emoji:"🏠", label:"Rent",      type:"expense", color:C.pu  },
  { id:"sip",       emoji:"📈", label:"SIP",       type:"expense", color:C.ind },
  { id:"treat",     emoji:"🍫", label:"Treat",     type:"expense", color:"#f472b6" },
  { id:"income",    emoji:"💰", label:"Income",    type:"income",  color:C.em  },
];

const INR = n => "₹" + Math.round(n).toLocaleString("en-IN");

function growCorpus(sip, stepUp, rate, yrs) {
  let corpus = 0, cur = sip, mr = rate / 12 / 100;
  for (let y = 0; y < yrs; y++) {
    for (let m = 0; m < 12; m++) corpus = corpus * (1 + mr) + cur;
    cur *= (1 + stepUp / 100);
  }
  return corpus;
}

// ─── global CSS ───────────────────────────────────────────────────────────
const CSS = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { background: #0b0f1e; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
  ::-webkit-scrollbar { width: 3px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.12); border-radius: 3px; }
  input[type=range] { width: 100%; accent-color: #6366f1; }
  input:focus, button:focus { outline: none; }
  button { cursor: pointer; font-family: inherit; }

  @keyframes sR  { from { opacity:0; transform:translateX(40px)  } to { opacity:1; transform:none } }
  @keyframes sL  { from { opacity:0; transform:translateX(-40px) } to { opacity:1; transform:none } }
  @keyframes fUp { from { opacity:0; transform:translateY(10px)  } to { opacity:1; transform:none } }
  @keyframes shU { from { transform:translateY(100%) } to { transform:translateY(0) } }

  /* bottom toast — appears, holds, fades */
  @keyframes toast {
    0%   { opacity:0; transform:translateY(16px) }
    12%  { opacity:1; transform:translateY(0)    }
    80%  { opacity:1; transform:translateY(0)    }
    100% { opacity:0; transform:translateY(8px)  }
  }
`;

// ─── tiny shared components ───────────────────────────────────────────────
const Card = ({ children, style }) => (
  <div style={{
    background: C.card,
    border: `1px solid ${C.border}`,
    borderRadius: 16,
    padding: 16,
    ...style,
  }}>{children}</div>
);

const SecLabel = ({ children }) => (
  <div style={{ color:C.su, fontSize:11, textTransform:"uppercase", letterSpacing:1, marginBottom:10 }}>
    {children}
  </div>
);

const PBtn = ({ onClick, label, disabled, bg }) => (
  <button onClick={onClick} disabled={disabled} style={{
    width:"100%", padding:14, marginTop:8, border:"none", borderRadius:12,
    background: disabled ? "rgba(255,255,255,0.07)" : (bg || `linear-gradient(135deg,${C.ind},${C.pu})`),
    color: disabled ? "rgba(255,255,255,0.22)" : "#fff",
    fontSize:15, fontWeight:700,
  }}>{label}</button>
);

const TxtInput = ({ label, value, onChange, type="text", placeholder }) => (
  <div style={{ marginBottom:18 }}>
    <label style={{ display:"block", color:C.su, fontSize:12, marginBottom:6 }}>{label}</label>
    <input
      type={type} value={value} placeholder={placeholder}
      onChange={e => onChange(e.target.value)}
      style={{
        width:"100%", padding:"12px 16px", borderRadius:10,
        background:"rgba(255,255,255,0.07)", border:`1px solid ${C.border}`,
        color:C.tx, fontSize:16,
      }}
    />
  </div>
);

const SlideFld = ({ label, value, min, max, step, onChange, color, display }) => (
  <div style={{ marginBottom:18 }}>
    <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
      <span style={{ color:C.su, fontSize:13 }}>{label}</span>
      <span style={{ color, fontSize:15, fontWeight:700 }}>{display ?? INR(value)}</span>
    </div>
    <input type="range" value={value} min={min} max={max} step={step}
      onChange={e => onChange(Number(e.target.value))} />
  </div>
);

// ─── WIZARD ───────────────────────────────────────────────────────────────
function AutoStep({ children, onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2400);
    return () => clearTimeout(t);
  }, []);
  return <div style={{ animation:"sR .38s cubic-bezier(.22,1,.36,1) both" }}>{children}</div>;
}

export function Wizard({ onComplete }) {
  const [step, setStep]         = useState(0);
  const [dir,  setDir]          = useState(1);
  const [name, setName]         = useState("");
  const [age,  setAge]          = useState("27");
  const [income, setIncome]     = useState(75000);
  const [rent, setRent]         = useState(15000);
  const [food, setFood]         = useState(8000);
  const [emi,  setEmi]          = useState(10000);
  const [life, setLife]         = useState(5000);
  const [hlth, setHlth]         = useState(500);
  const [term, setTerm]         = useState(1000);
  const [sup,  setSup]          = useState(10);   // sipStepUp

  const go  = d => { setDir(d); setStep(s => s + d); };
  const anim = dir > 0
    ? "sR .38s cubic-bezier(.22,1,.36,1) both"
    : "sL .38s cubic-bezier(.22,1,.36,1) both";

  const surplus = income - (rent + food + emi + life + hlth + term);

  const finish = () => {
    const p = { name, age:parseInt(age), income, rent, food, emi,
                lifestyle:life, health:hlth, term, sipStepUp:sup };
    try { localStorage.setItem(PROFILE_KEY, JSON.stringify(p)); } catch {}
    onComplete(p);
  };

  const H = ({ icon, title, sub }) => (
    <div style={{ textAlign:"center", marginBottom:26 }}>
      <div style={{ fontSize:44, marginBottom:10 }}>{icon}</div>
      <h2 style={{ color:C.tx, fontSize:22, fontWeight:700, marginBottom:6 }}>{title}</h2>
      <p  style={{ color:C.su, fontSize:14 }}>{sub}</p>
    </div>
  );

  const Dots = () => (
    <div style={{ display:"flex", gap:6, justifyContent:"center", marginBottom:34 }}>
      {[0,1,2,3,4].map(i => (
        <div key={i} style={{
          width:i===step?24:8, height:8, borderRadius:4,
          transition:"width .3s",
          background: i<=step ? C.ind : "rgba(255,255,255,0.14)",
        }} />
      ))}
    </div>
  );

  const content = [
    // 0 — welcome
    <div key="s0" style={{ animation:anim }}>
      <div style={{ textAlign:"center", marginBottom:28 }}>
        <div style={{ fontSize:52, marginBottom:12 }}>🌱</div>
        <h1 style={{ color:C.tx, fontSize:28, fontWeight:800, marginBottom:8 }}>Aarth Sutra</h1>
        <p  style={{ color:C.su, lineHeight:1.65 }}>
          Your personal wealth engine — track every rupee, build every goal.
        </p>
      </div>
      <TxtInput label="Your first name" value={name} onChange={setName} placeholder="e.g. Anant" />
      <TxtInput label="Age" value={age} onChange={setAge} type="number" placeholder="27" />
      <PBtn disabled={!name.trim()} onClick={() => go(1)} label="Build my blueprint →" />
    </div>,

    // 1 — income
    <div key="s1" style={{ animation:anim }}>
      <H icon="💼" title="Monthly Income" sub="Net take-home after TDS" />
      <SlideFld label="Net salary" value={income} min={10000} max={300000} step={1000}
        onChange={setIncome} color={C.em} />
      <PBtn onClick={() => go(1)} label="Next →" />
    </div>,

    // 2 — expenses
    <div key="s2" style={{ animation:anim }}>
      <H icon="🏠" title="Fixed Expenses" sub="Monthly commitments" />
      <SlideFld label="Rent / home loan" value={rent} min={0} max={80000} step={500} onChange={setRent} color={C.pu} />
      <SlideFld label="Food & groceries"  value={food} min={0} max={30000} step={500} onChange={setFood} color={C.am} />
      <SlideFld label="Other EMIs"        value={emi}  min={0} max={80000} step={500} onChange={setEmi}  color={C.re} />
      <SlideFld label="Lifestyle & transport" value={life} min={0} max={50000} step={500} onChange={setLife} color="#60a5fa" />
      <PBtn onClick={() => go(1)} label="Next →" />
    </div>,

    // 3 — insurance (auto-advance)
    <AutoStep key="s3" onDone={() => go(1)}>
      <H icon="🛡️" title="Insurance" sub="Monthly premiums" />
      <SlideFld label="Health insurance" value={hlth} min={0} max={5000} step={100} onChange={setHlth} color={C.em}  />
      <SlideFld label="Term life"        value={term} min={0} max={5000} step={100} onChange={setTerm} color={C.ind} />
      <p style={{ color:C.su, fontSize:13, textAlign:"center", marginTop:8 }}>Moving on in a moment…</p>
    </AutoStep>,

    // 4 — SIP step-up + finish
    <div key="s4" style={{ animation:anim }}>
      <H icon="📈" title="SIP Step-up" sub="How much to raise your SIP each year" />
      <SlideFld label="Annual step-up" value={sup} min={0} max={30} step={1}
        onChange={setSup} color={C.ind} display={sup + "%"} />
      <p style={{ color:C.su, fontSize:13, textAlign:"center", lineHeight:1.55, marginBottom:20 }}>
        At {sup}% step-up your wealth compounds — not just grows.
      </p>
      <Card style={{ background:"rgba(16,185,129,0.09)", borderColor:"rgba(16,185,129,0.25)", marginBottom:20 }}>
        <div style={{ color:C.su, fontSize:12, marginBottom:4 }}>Available to invest / month</div>
        <div style={{ color:surplus>=0?C.em:C.re, fontSize:28, fontWeight:800 }}>{INR(surplus)}</div>
      </Card>
      <PBtn onClick={finish} label="🔒 Lock in my blueprint"
        bg={`linear-gradient(135deg,${C.em},#059669)`} />
    </div>,
  ][step];

  return (
    <div style={{ minHeight:"100vh", background:C.bg,
      display:"flex", alignItems:"center", justifyContent:"center" }}>
      <div style={{ width:"100%", maxWidth:420, padding:"24px 20px" }}>
        <Dots />
        {content}
        {step > 0 && step !== 3 && (
          <button onClick={() => go(-1)} style={{
            marginTop:14, background:"none", border:"none",
            color:C.su, fontSize:14, width:"100%", textAlign:"center",
          }}>← Back</button>
        )}
      </div>
    </div>
  );
}

// ─── LOGGER ───────────────────────────────────────────────────────────────
function Logger({ onAdd, onClose }) {
  const [cat,    setCat]    = useState(null);
  const [amount, setAmount] = useState("");
  const [note,   setNote]   = useState("");

  const tap = d => {
    if (d === "⌫") { setAmount(a => a.slice(0,-1)); return; }
    if (d === "" || amount.length >= 7) return;
    setAmount(a => a + d);
  };

  const submit = () => {
    if (!cat || !amount) return;
    const c = CATS.find(c => c.id === cat);
    onAdd({ id:Date.now(), catId:cat, emoji:c.emoji, label:c.label,
            type:c.type, color:c.color, amount:parseInt(amount),
            note, date:new Date().toISOString() });
    onClose();
  };

  return (
    <div style={{
      position:"fixed", inset:0, zIndex:9000,
      display:"flex", flexDirection:"column", justifyContent:"flex-end",
    }}>
      <div onClick={onClose}
        style={{ position:"absolute", inset:0, background:"rgba(0,0,0,0.72)" }} />

      <div style={{
        position:"relative", zIndex:1,
        background:"#0d1122",
        border:`1px solid ${C.border}`,
        borderRadius:"22px 22px 0 0",
        padding:"20px 16px 36px",
        animation:"shU .3s cubic-bezier(.22,1,.36,1) both",
      }}>
        {/* header */}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
          <span style={{ color:C.tx, fontWeight:700, fontSize:17 }}>Log transaction</span>
          <button onClick={onClose} style={{ background:"none", border:"none", color:C.su }}>
            <X size={20} />
          </button>
        </div>

        {/* categories */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:8, marginBottom:14 }}>
          {CATS.map(c => (
            <button key={c.id} onClick={() => setCat(c.id)} style={{
              padding:"9px 4px", borderRadius:12,
              background: cat===c.id ? `${c.color}22` : "rgba(255,255,255,0.05)",
              border: `1.5px solid ${cat===c.id ? c.color : "transparent"}`,
              display:"flex", flexDirection:"column", alignItems:"center", gap:3,
            }}>
              <span style={{ fontSize:22 }}>{c.emoji}</span>
              <span style={{ color:cat===c.id?c.color:C.su, fontSize:11, fontWeight:600 }}>{c.label}</span>
            </button>
          ))}
        </div>

        {/* amount display */}
        <div style={{
          background:"rgba(255,255,255,0.05)", borderRadius:12,
          padding:"11px 16px", marginBottom:10, textAlign:"center",
        }}>
          <span style={{ color:amount?C.tx:C.su, fontSize:30, fontWeight:700 }}>
            {amount ? "₹" + Number(amount).toLocaleString("en-IN") : "₹0"}
          </span>
        </div>

        {/* note */}
        <input value={note} onChange={e => setNote(e.target.value)}
          placeholder="Note (optional)"
          style={{
            width:"100%", padding:"10px 14px", marginBottom:10,
            background:"rgba(255,255,255,0.07)", border:`1px solid ${C.border}`,
            borderRadius:10, color:C.tx, fontSize:14,
          }} />

        {/* numpad */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:8, marginBottom:14 }}>
          {["7","8","9","4","5","6","1","2","3","","0","⌫"].map((d,i) => (
            <button key={i} onClick={() => tap(d)} style={{
              padding:"13px 0", borderRadius:12,
              background: d==="⌫" ? "rgba(239,68,68,0.14)" : "rgba(255,255,255,0.07)",
              border:`1px solid ${C.border}`,
              color: d==="⌫" ? C.re : C.tx,
              fontSize:18, fontWeight:600,
            }}>{d}</button>
          ))}
        </div>

        <button onClick={submit} disabled={!cat||!amount} style={{
          width:"100%", padding:15, border:"none", borderRadius:14,
          background:(!cat||!amount)?"rgba(255,255,255,0.07)":`linear-gradient(135deg,${C.em},${C.ind})`,
          color:(!cat||!amount)?"rgba(255,255,255,0.22)":"#fff",
          fontSize:16, fontWeight:700,
        }}>
          {cat && amount
            ? `Add ${CATS.find(c=>c.id===cat)?.emoji} ${INR(parseInt(amount))}`
            : "Select category & amount"}
        </button>
      </div>
    </div>
  );
}

// ─── OVERVIEW TAB ────────────────────────────────────────────────────────
function Overview({ profile, txns }) {
  const { income, rent, food, emi, lifestyle, health, term } = profile;
  const fixed   = rent + food + emi + lifestyle + health + term;
  const surplus = income - fixed;

  const spendMap = {};
  txns.filter(t => t.type==="expense")
      .forEach(t => { spendMap[t.label] = (spendMap[t.label]||0) + t.amount; });

  const loggedIn  = txns.filter(t=>t.type==="income") .reduce((s,t)=>s+t.amount,0);
  const loggedOut = txns.filter(t=>t.type==="expense").reduce((s,t)=>s+t.amount,0);

  const budgets = [
    { label:"Rent",      budget:rent,      color:C.pu },
    { label:"Food",      budget:food,      color:C.am },
    { label:"EMIs",      budget:emi,       color:C.re },
    { label:"Lifestyle", budget:lifestyle, color:"#60a5fa" },
  ];

  return (
    <div style={{ animation:"fUp .4s ease both" }}>
      {/* surplus */}
      <Card style={{ marginBottom:14 }}>
        <div style={{ display:"flex", justifyContent:"space-between" }}>
          <div>
            <div style={{ color:C.su, fontSize:11, marginBottom:3 }}>Budget surplus / mo</div>
            <div style={{ color:surplus>=0?C.em:C.re, fontSize:26, fontWeight:800 }}>{INR(surplus)}</div>
          </div>
          {(loggedIn>0||loggedOut>0) && (
            <div style={{ textAlign:"right" }}>
              <div style={{ color:C.su, fontSize:11, marginBottom:3 }}>Logged net</div>
              <div style={{ color:(loggedIn-loggedOut)>=0?C.em:C.re, fontSize:18, fontWeight:700 }}>
                {INR(loggedIn-loggedOut)}
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* budget bars */}
      <SecLabel>Monthly budget check</SecLabel>
      <Card style={{ marginBottom:14 }}>
        {budgets.map((b,i) => {
          const actual = spendMap[b.label] || 0;
          const pct    = b.budget>0 ? Math.min(100, actual/b.budget*100) : 0;
          return (
            <div key={b.label} style={{ marginBottom:i<budgets.length-1?16:0 }}>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:5 }}>
                <span style={{ color:C.tx, fontSize:13 }}>{b.label}</span>
                <span style={{ color:pct>85?C.re:C.su, fontSize:13 }}>
                  {actual>0?INR(actual):"—"} / {INR(b.budget)}
                </span>
              </div>
              <div style={{ height:6, background:"rgba(255,255,255,0.08)", borderRadius:3 }}>
                <div style={{ height:"100%", borderRadius:3,
                  width:`${pct}%`, background:pct>85?C.re:b.color,
                  transition:"width .6s ease" }} />
              </div>
            </div>
          );
        })}
      </Card>

      {/* recent txns */}
      <SecLabel>Recent transactions</SecLabel>
      {txns.length === 0 ? (
        <Card>
          <div style={{ textAlign:"center", padding:"18px 0" }}>
            <div style={{ fontSize:30, marginBottom:8 }}>💳</div>
            <div style={{ color:C.su, fontSize:14 }}>Nothing logged yet.</div>
            <div style={{ color:C.su, fontSize:13, marginTop:4 }}>Tap + to add your first entry.</div>
          </div>
        </Card>
      ) : (
        <Card>
          {txns.slice(0,10).map((t,i,arr) => (
            <div key={t.id} style={{
              display:"flex", alignItems:"center", gap:12,
              paddingBottom:i<arr.length-1?12:0,
              marginBottom:i<arr.length-1?12:0,
              borderBottom:i<arr.length-1?`1px solid ${C.border}`:"none",
            }}>
              <div style={{
                width:36, height:36, borderRadius:10,
                background:`${t.color}20`,
                display:"flex", alignItems:"center", justifyContent:"center",
                fontSize:18, flexShrink:0,
              }}>{t.emoji}</div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ color:C.tx, fontSize:14, fontWeight:600 }}>{t.label}</div>
                {t.note && (
                  <div style={{ color:C.su, fontSize:12,
                    overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                    {t.note}
                  </div>
                )}
              </div>
              <div style={{ color:t.type==="income"?C.em:C.re,
                fontWeight:700, fontSize:14, flexShrink:0 }}>
                {t.type==="income"?"+":"−"}{INR(t.amount)}
              </div>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}

// ─── BALANCE TAB ──────────────────────────────────────────────────────────
function Balance({ profile }) {
  const { income, emi } = profile;

  const assets = [
    { label:"Savings & FDs", value:income*3,   color:C.em  },
    { label:"Mutual Funds",  value:income*6,   color:C.ind },
    { label:"Direct Equity", value:income*2,   color:C.am  },
    { label:"EPF / NPS",     value:income*1,   color:C.pu  },
  ];
  const liabs = [
    { label:"Home Loan",    value:emi*48,      color:C.re  },
    { label:"Auto Loan",    value:emi*12,      color:C.am  },
    { label:"Credit Card",  value:income*0.3,  color:C.pu  },
  ];
  const tA = assets.reduce((s,a)=>s+a.value, 0);
  const tL = liabs.reduce((s,a)=>s+a.value,  0);
  const nw = tA - tL;

  const Row = ({ item, isLast, positive }) => (
    <div style={{
      display:"flex", justifyContent:"space-between", alignItems:"center",
      paddingBottom:isLast?0:12, marginBottom:isLast?0:12,
      borderBottom:isLast?"none":`1px solid ${C.border}`,
    }}>
      <div style={{ display:"flex", alignItems:"center", gap:10 }}>
        <div style={{ width:8, height:8, borderRadius:"50%", background:item.color }} />
        <span style={{ color:C.tx, fontSize:14 }}>{item.label}</span>
      </div>
      <span style={{ color:positive?C.em:C.re, fontWeight:700 }}>
        {positive?"+":"−"}{INR(item.value)}
      </span>
    </div>
  );

  return (
    <div style={{ animation:"fUp .4s ease both" }}>
      <Card style={{
        marginBottom:14,
        background:"linear-gradient(135deg,rgba(16,185,129,0.1),rgba(99,102,241,0.1))",
        borderColor:"rgba(16,185,129,0.22)",
      }}>
        <div style={{ textAlign:"center" }}>
          <div style={{ color:C.su, fontSize:12, marginBottom:4 }}>Estimated Net Worth</div>
          <div style={{ color:C.em, fontSize:34, fontWeight:800 }}>{INR(nw)}</div>
          <div style={{ color:C.su, fontSize:12, marginTop:4 }}>Assets − Liabilities</div>
        </div>
      </Card>

      <SecLabel>Assets</SecLabel>
      <Card style={{ marginBottom:14 }}>
        {assets.map((a,i) => <Row key={a.label} item={a} isLast={i===assets.length-1} positive />)}
        <div style={{ borderTop:`1px solid ${C.border}`, marginTop:12, paddingTop:12,
          display:"flex", justifyContent:"space-between" }}>
          <span style={{ color:C.su, fontSize:13 }}>Total Assets</span>
          <span style={{ color:C.em, fontWeight:800 }}>{INR(tA)}</span>
        </div>
      </Card>

      <SecLabel>Liabilities</SecLabel>
      <Card style={{ marginBottom:14 }}>
        {liabs.map((a,i) => <Row key={a.label} item={a} isLast={i===liabs.length-1} positive={false} />)}
        <div style={{ borderTop:`1px solid ${C.border}`, marginTop:12, paddingTop:12,
          display:"flex", justifyContent:"space-between" }}>
          <span style={{ color:C.su, fontSize:13 }}>Total Liabilities</span>
          <span style={{ color:C.re, fontWeight:800 }}>{INR(tL)}</span>
        </div>
      </Card>

      <Card style={{ background:"rgba(255,255,255,0.02)", borderColor:"rgba(255,255,255,0.04)" }}>
        <p style={{ color:"rgba(255,255,255,0.26)", fontSize:10, lineHeight:1.6 }}>
          Illustrative estimates. Tap + to log real holdings for accurate tracking.
        </p>
      </Card>
    </div>
  );
}

// ─── PLAN TAB ─────────────────────────────────────────────────────────────
function Plan({ profile }) {
  const { age, income, rent, food, emi, lifestyle, health, term, sipStepUp } = profile;
  const fixed   = rent + food + emi + lifestyle + health + term;
  const surplus = income - fixed;
  const invest  = Math.max(0, Math.round(surplus * 0.8));
  const fiTgt   = fixed * 12 * 25;

  const c10 = growCorpus(invest, sipStepUp, 12, 10);
  const c20 = growCorpus(invest, sipStepUp, 12, 20);
  const c30 = growCorpus(invest, sipStepUp, 12, 30);
  const yrs = c10>=fiTgt ? 10 : c20>=fiTgt ? 20 : c30>=fiTgt ? 30 : 35;

  const chartData = [5,10,15,20,25,30].map(y => ({
    yr: String(age + y),
    corpus: Math.round(growCorpus(invest, sipStepUp, 12, y) / 100000),
    fi:     Math.round(fiTgt / 100000),
  }));

  const milestones = [
    { label:"10-yr corpus", value:c10,   icon:"🌱" },
    { label:"20-yr corpus", value:c20,   icon:"🌳" },
    { label:"30-yr corpus", value:c30,   icon:"🏔️" },
    { label:"FI Target",    value:fiTgt, icon:"🎯" },
  ];

  return (
    <div style={{ animation:"fUp .4s ease both" }}>
      {/* FI hero */}
      <Card style={{
        marginBottom:14,
        background:"linear-gradient(135deg,rgba(99,102,241,0.14),rgba(139,92,246,0.1))",
        borderColor:"rgba(99,102,241,0.28)",
      }}>
        <div style={{ textAlign:"center" }}>
          <div style={{ fontSize:34, marginBottom:8 }}>🔥</div>
          <div style={{ color:C.tx, fontSize:17, fontWeight:700, marginBottom:4 }}>
            FI in ~{yrs} years (age {age+yrs})
          </div>
          <div style={{ color:C.su, fontSize:13 }}>
            investing {INR(invest)}/mo · {sipStepUp}% step-up / yr
          </div>
          <div style={{ marginTop:10, background:"rgba(99,102,241,0.18)",
            borderRadius:8, padding:"8px 16px" }}>
            <span style={{ color:C.ind, fontSize:14, fontWeight:700 }}>
              FI corpus needed: {INR(fiTgt)}
            </span>
          </div>
        </div>
      </Card>

      {/* chart */}
      <SecLabel>Corpus projection (₹ Lakhs)</SecLabel>
      <Card style={{ marginBottom:14, padding:"14px 6px 10px" }}>
        <ResponsiveContainer width="100%" height={185}>
          <AreaChart data={chartData} margin={{ top:4, right:8, left:0, bottom:0 }}>
            <defs>
              <linearGradient id="cg" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor={C.ind} stopOpacity={0.4} />
                <stop offset="95%" stopColor={C.ind} stopOpacity={0.02} />
              </linearGradient>
              <linearGradient id="fg" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor={C.em} stopOpacity={0.3} />
                <stop offset="95%" stopColor={C.em} stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="yr" tick={{ fill:"rgba(255,255,255,0.4)", fontSize:11 }}
              axisLine={false} tickLine={false} />
            <YAxis tick={{ fill:"rgba(255,255,255,0.4)", fontSize:10 }}
              axisLine={false} tickLine={false}
              tickFormatter={v => v>=100 ? `${(v/100).toFixed(0)}Cr` : `${v}L`} />
            <Tooltip
              contentStyle={{ background:"rgba(11,15,30,0.95)",
                border:`1px solid ${C.border}`, borderRadius:8, color:C.tx, fontSize:12 }}
              formatter={(v,n) => [v>=100?`₹${(v/100).toFixed(1)} Cr`:`₹${v}L`, n]} />
            <Area type="monotone" dataKey="corpus" stroke={C.ind}  fill="url(#cg)"
              strokeWidth={2} name="Corpus" dot={{ fill:C.ind, r:3 }} />
            <Area type="monotone" dataKey="fi"     stroke={C.em}   fill="url(#fg)"
              strokeWidth={2} strokeDasharray="5 3" name="FI Target" dot={false} />
          </AreaChart>
        </ResponsiveContainer>
        <div style={{ display:"flex", gap:16, justifyContent:"center", marginTop:6 }}>
          {[{c:C.ind,l:"Corpus"},{c:C.em,l:"FI target",d:true}].map(x => (
            <div key={x.l} style={{ display:"flex", alignItems:"center", gap:5 }}>
              <div style={{ width:14, height:0, borderTop:`2px ${x.d?"dashed":"solid"} ${x.c}` }} />
              <span style={{ color:C.su, fontSize:11 }}>{x.l}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* milestones */}
      <SecLabel>Milestones</SecLabel>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:14 }}>
        {milestones.map(m => (
          <Card key={m.label} style={{ padding:"13px 12px" }}>
            <div style={{ fontSize:22, marginBottom:5 }}>{m.icon}</div>
            <div style={{ color:C.su, fontSize:11, marginBottom:3 }}>{m.label}</div>
            <div style={{ color:C.tx, fontWeight:800, fontSize:15 }}>{INR(m.value)}</div>
          </Card>
        ))}
      </div>

      <Card style={{ background:"rgba(255,255,255,0.02)", borderColor:"rgba(255,255,255,0.04)" }}>
        <p style={{ color:"rgba(255,255,255,0.25)", fontSize:10, lineHeight:1.6 }}>
          Assumes {sipStepUp}% annual step-up, 12% p.a. equity. Not SEBI-registered
          investment advice. Consult a registered adviser.
        </p>
      </Card>
    </div>
  );
}

// ─── DASHBOARD ────────────────────────────────────────────────────────────
function Dashboard({ profile, celebrated }) {
  const [tab,        setTab]        = useState(0);
  const [loggerOpen, setLoggerOpen] = useState(false);
  const [txns,       setTxns]       = useState(() => {
    try { return JSON.parse(localStorage.getItem(TXN_KEY) || "[]"); } catch { return []; }
  });

  // ✅ FIX A: toast at BOTTOM — can never overlap the top tab bar
  // ✅ FIX B: 'celebrated' prop is useState(false) in App → resets on refresh
  const [showToast, setShowToast] = useState(celebrated);
  useEffect(() => {
    if (celebrated) {
      const t = setTimeout(() => setShowToast(false), 3400);
      return () => clearTimeout(t);
    }
  }, []);

  const addTxn = t => {
    const next = [t, ...txns];
    setTxns(next);
    try { localStorage.setItem(TXN_KEY, JSON.stringify(next)); } catch {}
  };

  const TABS = ["Overview", "Balance", "My Plan"];

  return (
    <div style={{ minHeight:"100vh", background:C.bg, color:C.tx }}>

      {/*
        ✅ CRITICAL FIX: header is position:FIXED — not sticky.
        Nothing in the DOM can ever overlap it.
        Content gets paddingTop:116px so it starts below the header.
      */}
      <div style={{
        position:"fixed",
        top:0, left:0, right:0,
        zIndex:8000,
        background:"rgba(11,15,30,0.98)",
        borderBottom:`1px solid ${C.border}`,
      }}>
        <div style={{ maxWidth:540, margin:"0 auto", padding:"12px 16px 0" }}>
          {/* name row */}
          <div style={{ display:"flex", justifyContent:"space-between",
            alignItems:"center", marginBottom:12 }}>
            <div>
              <div style={{ color:C.su, fontSize:10, letterSpacing:1,
                textTransform:"uppercase" }}>Aarth Sutra</div>
              <div style={{ color:C.tx, fontWeight:700, fontSize:17 }}>
                Hey, {profile.name} 👋
              </div>
            </div>
            <div style={{
              background:"rgba(99,102,241,0.14)",
              border:"1px solid rgba(99,102,241,0.3)",
              borderRadius:20, padding:"5px 12px",
              color:C.ind, fontSize:12, fontWeight:700,
            }}>
              SIP +{profile.sipStepUp}%/yr
            </div>
          </div>

          {/* tab bar — always visible, nothing can cover it */}
          <div style={{ display:"flex", gap:4 }}>
            {TABS.map((t, i) => (
              <button key={t} onClick={() => setTab(i)} style={{
                flex:1, padding:"9px 0",
                background:"none", border:"none",
                borderBottom:`2.5px solid ${tab===i ? C.ind : "transparent"}`,
                color:tab===i ? C.tx : C.su,
                fontWeight:tab===i ? 700 : 400,
                fontSize:13,
                transition:"color .18s, border-color .18s",
              }}>{t}</button>
            ))}
          </div>
        </div>
      </div>

      {/* scrollable content — paddingTop clears the fixed header */}
      <div style={{ maxWidth:540, margin:"0 auto", paddingTop:116, padding:"116px 16px 110px" }}>
        {tab === 0 && <Overview profile={profile} txns={txns} />}
        {tab === 1 && <Balance  profile={profile} />}
        {tab === 2 && <Plan     profile={profile} />}
      </div>

      {/* FAB — no animation, zIndex below header */}
      <button onClick={() => setLoggerOpen(true)} style={{
        position:"fixed", bottom:28, right:24,
        width:60, height:60, borderRadius:"50%",
        background:`linear-gradient(135deg,${C.em},${C.ind})`,
        border:"none",
        boxShadow:`0 8px 24px rgba(16,185,129,0.38)`,
        display:"flex", alignItems:"center", justifyContent:"center",
        zIndex:7999,
        transition:"transform .15s",
      }}>
        <Plus size={26} color="#fff" strokeWidth={2.5} />
      </button>

      {/* ✅ CELEBRATE TOAST — bottom left, zIndex BELOW header, never overlaps tabs */}
      {showToast && (
        <div style={{
          position:"fixed",
          bottom:100, left:20,
          zIndex:7998,
          background:`linear-gradient(135deg,${C.em},${C.ind})`,
          borderRadius:14,
          padding:"12px 18px",
          display:"flex", alignItems:"center", gap:10,
          boxShadow:"0 8px 28px rgba(16,185,129,0.32)",
          animation:"toast 3.4s ease both",
          pointerEvents:"none",
          maxWidth:"calc(100vw - 40px)",
        }}>
          <CheckCircle size={20} color="#fff" />
          <div>
            <div style={{ color:"#fff", fontWeight:700, fontSize:14 }}>Blueprint locked in!</div>
            <div style={{ color:"rgba(255,255,255,0.8)", fontSize:12 }}>
              Welcome to Aarth Sutra 🌱
            </div>
          </div>
        </div>
      )}

      {loggerOpen && <Logger onAdd={addTxn} onClose={() => setLoggerOpen(false)} />}
    </div>
  );
}

// ─── ROOT ─────────────────────────────────────────────────────────────────
export default function App() {
  const [profile, setProfile] = useState(() => {
    try { return JSON.parse(localStorage.getItem(PROFILE_KEY) || "null"); } catch { return null; }
  });

  /*
    ✅ KEY FIX — useState(false), NOT useRef(false)
    - Resets to false on every page refresh  → no celebrate on refresh
    - Stable across React StrictMode double-renders (useRef gets consumed on pass-1)
    - Set to true ONLY inside handleComplete → celebrate fires only on wizard completion
  */
  const [celebrated, setCelebrated] = useState(false);

  const handleComplete = p => {
    setCelebrated(true);   // wizard just finished — show toast once
    setProfile(p);
  };

  return (
    <>
      <style>{CSS}</style>
      {profile
        ? <Dashboard profile={profile} celebrated={celebrated} />
        : <Wizard    onComplete={handleComplete} />
      }
    </>
  );
}
