import { useState, useEffect, useRef } from "react";

// ─────────────────────────────────────────────────────────────
//  SUPABASE CONFIG
// ─────────────────────────────────────────────────────────────
const SB_URL = "https://nnnqzzghapkevgjfocpl.supabase.co";
const SB_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ubnF6emdoYXBrZXZnamZvY3BsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI4MzM5NjcsImV4cCI6MjA4ODQwOTk2N30.WhhqFJjNLNY_1KBt7CUEkceclEs_9mcfWZCRj0Dr_NE";

/* ── tiny supabase REST client ── */
const sb = {
  async q(table, opts = {}) {
    let url = `${SB_URL}/rest/v1/${table}?`;
    if (opts.select) url += `select=${opts.select}&`;
    if (opts.eq) Object.entries(opts.eq).forEach(([k, v]) => { url += `${k}=eq.${encodeURIComponent(v)}&`; });
    if (opts.order) url += `order=${opts.order}&`;
    if (opts.limit) url += `limit=${opts.limit}&`;
    const r = await fetch(url, { headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}`, Accept: "application/json" } });
    return r.json();
  },
  async insert(table, body) {
    const r = await fetch(`${SB_URL}/rest/v1/${table}`, {
      method: "POST", headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}`, "Content-Type": "application/json", Prefer: "return=representation" },
      body: JSON.stringify(body),
    });
    const d = await r.json(); return Array.isArray(d) ? d[0] : d;
  },
  async update(table, id, body) {
    const r = await fetch(`${SB_URL}/rest/v1/${table}?id=eq.${id}`, {
      method: "PATCH", headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}`, "Content-Type": "application/json", Prefer: "return=representation" },
      body: JSON.stringify(body),
    });
    const d = await r.json(); return Array.isArray(d) ? d[0] : d;
  },
  async del(table, id) {
    await fetch(`${SB_URL}/rest/v1/${table}?id=eq.${id}`, {
      method: "DELETE", headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` },
    });
  },
  async upsert(table, body, onConflict) {
    const r = await fetch(`${SB_URL}/rest/v1/${table}?on_conflict=${onConflict}`, {
      method: "POST", headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}`, "Content-Type": "application/json", Prefer: "return=representation,resolution=merge-duplicates" },
      body: JSON.stringify(body),
    });
    return r.json();
  },
};

const DEMO = SB_URL.includes("YOUR_PROJECT");
const LS = "cc_v3";
const lsGet = () => { try { return JSON.parse(localStorage.getItem(LS)) || {}; } catch { return {}; } };
const lsSet = d => { try { localStorage.setItem(LS, JSON.stringify(d)); } catch {} };
const uid = () => Math.random().toString(36).slice(2, 10);
const LOCAL_FAM = "cc_family";

/* ── DB layer ── */
const DB = {
  async getFamilies() {
    if (DEMO) return lsGet().families || [];
    return sb.q("families", { select: "*", order: "name" });
  },
  async createFamily(name) {
    if (DEMO) { const f = { id: uid(), name, created_at: new Date().toISOString() }; const d = lsGet(); d.families = [...(d.families || []), f]; lsSet(d); return f; }
    return sb.insert("families", { name });
  },
  async getChildren(fid) {
    if (DEMO) return (lsGet().children || []).filter(c => c.family_id === fid);
    return sb.q("children", { select: "*", eq: { family_id: fid }, order: "name" });
  },
  async upsertChild(c) {
    if (DEMO) { const d = lsGet(); const a = d.children || []; const i = a.findIndex(x => x.id === c.id); const n = { ...c, id: c.id || uid(), created_at: new Date().toISOString() }; if (i >= 0) a[i] = n; else a.push(n); d.children = a; lsSet(d); return n; }
    if (c.id) return sb.update("children", c.id, { name: c.name, age: c.age, gender: c.gender || null });
    return sb.insert("children", { family_id: c.family_id, name: c.name, age: c.age, gender: c.gender || null });
  },
  async deleteChild(id) {
    if (DEMO) { const d = lsGet(); d.children = (d.children || []).filter(c => c.id !== id); lsSet(d); return; }
    await sb.del("children", id);
  },
  async getPrograms() {
    if (DEMO) return (lsGet().programs || []).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    return sb.q("programs", { select: "*", order: "created_at.desc" });
  },
  async addProgram(p) {
    if (DEMO) { const d = lsGet(); const n = { ...p, id: uid(), created_at: new Date().toISOString() }; d.programs = [n, ...(d.programs || [])]; lsSet(d); return n; }
    return sb.insert("programs", p);
  },
  async updateProgram(id, patch) {
    if (DEMO) { const d = lsGet(); d.programs = (d.programs || []).map(p => p.id === id ? { ...p, ...patch } : p); lsSet(d); return (d.programs || []).find(p => p.id === id); }
    return sb.update("programs", id, patch);
  },
  async deleteProgram(id) {
    if (DEMO) { const d = lsGet(); d.programs = (d.programs || []).filter(p => p.id !== id); lsSet(d); return; }
    await sb.del("programs", id);
  },
  async getChildPrograms(fid) {
    if (DEMO) return (lsGet().child_programs || []).filter(c => c.family_id === fid);
    return sb.q("child_programs", { select: "*", eq: { family_id: fid } });
  },
  async assignChild(cid, pid, fid) {
    if (DEMO) { const d = lsGet(); const a = d.child_programs || []; if (!a.find(x => x.child_id === cid && x.program_id === pid)) a.push({ id: uid(), child_id: cid, program_id: pid, family_id: fid }); d.child_programs = a; lsSet(d); return; }
    await sb.upsert("child_programs", { child_id: cid, program_id: pid, family_id: fid }, "child_id,program_id");
  },
  async unassignChild(cid, pid) {
    if (DEMO) { const d = lsGet(); d.child_programs = (d.child_programs || []).filter(x => !(x.child_id === cid && x.program_id === pid)); lsSet(d); return; }
    await fetch(`${SB_URL}/rest/v1/child_programs?child_id=eq.${cid}&program_id=eq.${pid}`, { method: "DELETE", headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` } });
  },
  async getChat() {
    if (DEMO) return (lsGet().chat || []).sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    return sb.q("chat_messages", { select: "*", order: "created_at", limit: 300 });
  },
  async sendChat(m) {
    if (DEMO) { const d = lsGet(); const n = { ...m, id: uid(), created_at: new Date().toISOString() }; d.chat = [...(d.chat || []), n]; lsSet(d); return n; }
    return sb.insert("chat_messages", m);
  },
  async getBulletin() {
    if (DEMO) return (lsGet().bulletin || []).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    return sb.q("bulletin_items", { select: "*", order: "created_at.desc", limit: 100 });
  },
  async addBulletin(b) {
    if (DEMO) { const d = lsGet(); const n = { ...b, id: uid(), created_at: new Date().toISOString() }; d.bulletin = [n, ...(d.bulletin || [])]; lsSet(d); return n; }
    return sb.insert("bulletin_items", b);
  },
  async deleteBulletin(id) {
    if (DEMO) { const d = lsGet(); d.bulletin = (d.bulletin || []).filter(b => b.id !== id); lsSet(d); return; }
    await sb.del("bulletin_items", id);
  },
  async getAllChildPrograms() {
    if (DEMO) return lsGet().child_programs || [];
    return sb.q("child_programs", { select: "program_id" });
  },
};

/* ── AI camp search — calls /api/search proxy (no CORS issues) ── */
async function aiSearch(query) {
  const res = await fetch("/api/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query }),
  });
  if (!res.ok) throw new Error("Search failed");
  return res.json();
}

/* ── Design tokens ── */
const T = {
  pine: "#2D5016", pine2: "#3A6B1E", sky: "#3B8FA8", sky2: "#5AAEC8",
  coral: "#D4603A", coral2: "#E8805E", gold: "#C49A1A", bark: "#7A5230",
  sand: "#F2E8D5", cream: "#FAF6EE", fog: "#E5DDD0", dark: "#1C1C1C", muted: "#6A6A6A",
};
const FD = "'Playfair Display', serif";
const FB = "'DM Sans', sans-serif";
const CATS = { "Arts & Music": "#D4603A", "Sports": "#2D5016", "STEM": "#3B8FA8", "Outdoors": "#7A5230", "Academic": "#C49A1A", "Other": "#6A6A6A" };

(() => {
  if (document.getElementById("cc-fonts")) return;
  const l = document.createElement("link"); l.id = "cc-fonts"; l.rel = "stylesheet";
  l.href = "https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap";
  document.head.appendChild(l);
  const s = document.createElement("style"); s.id = "cc-style";
  s.textContent = `
    @keyframes ccFadeUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
    @keyframes ccSpin   { to { transform:rotate(360deg); } }
    @keyframes ccPop    { 0%,100% { transform:scale(1); } 50% { transform:scale(1.45); } }
    .cc-fu  { animation: ccFadeUp .32s ease both; }
    .cc-sp  { animation: ccSpin .75s linear infinite; }
    .cc-pop { animation: ccPop .28s ease; }
    .cc-card:hover { box-shadow: 0 8px 28px rgba(0,0,0,0.10) !important; transform: translateY(-1px); }
    input:focus, textarea:focus, select:focus { outline:none; border-color: ${T.pine} !important; box-shadow: 0 0 0 3px ${T.pine}18; }
    ::-webkit-scrollbar { width:5px; } ::-webkit-scrollbar-track { background:${T.fog}; } ::-webkit-scrollbar-thumb { background:${T.bark}; border-radius:3px; }
    * { box-sizing:border-box; margin:0; padding:0; } body { font-family:${FB}; background:${T.cream}; color:${T.dark}; } button { cursor:pointer; font-family:${FB}; } a { color:${T.sky}; }
  `;
  document.head.appendChild(s);
})();

const IC = {
  home:  "M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z M9 22V12h6v10",
  cal:   "M3 4h18v18H3z M16 2v4 M8 2v4 M3 10h18",
  chat:  "M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z",
  search:"M11 3a8 8 0 100 16 8 8 0 000-16z M21 21l-4.35-4.35",
  plus:  "M12 5v14 M5 12h14",
  heart: "M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z",
  bell:  "M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9 M13.73 21a2 2 0 01-3.46 0",
  car:   "M5 17H3a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v9a2 2 0 01-2 2h-2 M7.5 17.5a2.5 2.5 0 100 5 2.5 2.5 0 000-5z M17.5 17.5a2.5 2.5 0 100 5 2.5 2.5 0 000-5z",
  send:  "M22 2L11 13 M22 2l-7 20-4-9-9-4z",
  x:     "M18 6L6 18 M6 6l12 12",
  dl:    "M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4 M7 10l5 5 5-5 M12 15V3",
  star:  "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z",
  user:  "M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2 M12 3a4 4 0 100 8 4 4 0 000-8z",
  trash: "M3 6h18 M19 6l-1 14H6L5 6 M10 11v6 M14 11v6 M9 6V4h6v2",
  edit:  "M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7 M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z",
  child: "M12 2a4 4 0 100 8 4 4 0 000-8z M8 14s-4 1-4 5h16c0-4-4-5-4-5",
  check: "M20 6L9 17l-5-5",
  link:  "M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71 M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71",
};

function Ico({ n, size = 18, color = "currentColor", fill = "none", sw = 2 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, display: "block" }}>
      {IC[n]?.split(" M").map((d, i) => <path key={i} d={i === 0 ? d : "M" + d} />)}
    </svg>
  );
}

function Btn({ ch, onClick, v = "primary", sz = "md", sx = {}, disabled, title }) {
  const vs = { primary: { bg: T.pine, col: "white" }, coral: { bg: T.coral, col: "white" }, sky: { bg: T.sky, col: "white" }, secondary: { bg: T.fog, col: T.dark }, ghost: { bg: "transparent", col: T.muted, border: `1px solid ${T.fog}` } };
  const ss = { sm: { p: "5px 11px", fs: 12 }, md: { p: "9px 16px", fs: 14 }, lg: { p: "12px 24px", fs: 16 } };
  const s = ss[sz]; const vv = vs[v] || vs.primary;
  return (
    <button title={title} disabled={disabled} onClick={onClick}
      style={{ background: vv.bg, color: vv.col, border: vv.border || "none", borderRadius: 10, fontWeight: 600, padding: s.p, fontSize: s.fs, display: "inline-flex", alignItems: "center", gap: 6, transition: "opacity .15s,transform .1s", opacity: disabled ? .45 : 1, ...sx }}
      onMouseEnter={e => { if (!disabled) e.currentTarget.style.opacity = ".82"; }}
      onMouseLeave={e => { e.currentTarget.style.opacity = "1"; }}>
      {ch}
    </button>
  );
}
function Card({ ch, sx = {}, onClick, cls = "" }) {
  return <div onClick={onClick} className={`cc-card ${cls}`} style={{ background: "white", borderRadius: 16, padding: 20, boxShadow: "0 2px 10px rgba(0,0,0,0.055)", border: `1px solid ${T.fog}`, cursor: onClick ? "pointer" : "default", transition: "box-shadow .15s,transform .15s", ...sx }}>{ch}</div>;
}
function Bdg({ label, color }) {
  return <span style={{ padding: "3px 10px", borderRadius: 20, background: color + "22", color, fontSize: 12, fontWeight: 700, display: "inline-block" }}>{label}</span>;
}
function Spin() { return <span className="cc-sp" style={{ display: "inline-block", width: 16, height: 16, border: "2px solid rgba(255,255,255,0.35)", borderTop: "2px solid white", borderRadius: "50%" }} />; }
function Overlay({ ch, onClose, maxW = 640 }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.52)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 700, padding: 16 }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: T.cream, borderRadius: 22, width: "100%", maxWidth: maxW, maxHeight: "92vh", overflowY: "auto", padding: 32, position: "relative" }}>
        <button onClick={onClose} style={{ position: "absolute", top: 14, right: 14, background: T.fog, border: "none", borderRadius: 8, width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Ico n="x" size={14} />
        </button>
        {ch}
      </div>
    </div>
  );
}
function Field({ label, value, onChange, type = "text", placeholder, required, textarea, opts, rows = 3 }) {
  const base = { width: "100%", padding: "9px 12px", border: `1.5px solid ${T.fog}`, borderRadius: 9, fontSize: 14, background: "white", transition: "border-color .15s,box-shadow .15s" };
  return (
    <div>
      {label && <label style={{ fontSize: 12, fontWeight: 700, color: T.muted, display: "block", marginBottom: 5 }}>{label}{required && <span style={{ color: T.coral }}> *</span>}</label>}
      {opts
        ? <select value={value} onChange={e => onChange(e.target.value)} style={base}>{opts.map(o => <option key={o}>{o}</option>)}</select>
        : textarea
          ? <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={rows} style={{ ...base, resize: "vertical" }} />
          : <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} style={base} />
      }
    </div>
  );
}

const fmtD = d => { if (!d) return ""; try { return new Date(d + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }); } catch { return d; } };

function Welcome({ onLogin }) {
  const [step, setStep] = useState("choose");
  const [fams, setFams] = useState([]);
  const [busy, setBusy] = useState(false);
  const [name, setName] = useState("");
  const [err, setErr] = useState("");

  useEffect(() => {
    if (step === "returning") { setBusy(true); DB.getFamilies().then(f => { setFams(f); setBusy(false); }); }
  }, [step]);

  async function create() {
    if (!name.trim()) return;
    setBusy(true); setErr("");
    try {
      const all = await DB.getFamilies();
      if (all.find(f => f.name.toLowerCase() === name.trim().toLowerCase())) { setErr("Name already taken — claim it as a returning family."); setBusy(false); return; }
      const fam = await DB.createFamily(name.trim());
      await DB.addBulletin({ message: `🎉 ${fam.name} just joined Camp Collective!`, type: "new_family", author: fam.name, family_id: fam.id });
      localStorage.setItem(LOCAL_FAM, JSON.stringify(fam));
      onLogin(fam);
    } catch { setErr("Something went wrong. Please try again."); }
    setBusy(false);
  }

  function claim(f) { localStorage.setItem(LOCAL_FAM, JSON.stringify(f)); onLogin(f); }

  return (
    <div style={{ minHeight: "100vh", background: `linear-gradient(150deg,${T.pine} 0%,${T.pine2} 45%,${T.sky} 100%)`, display: "flex", alignItems: "center", justifyContent: "center", padding: 20, position: "relative", overflow: "hidden" }}>
      {[[220, "-60px", "-60px"], [160, "auto", "-40px", "-50px"], [100, "60%", "30%"]].map(([s, t, r, l], i) => (
        <div key={i} style={{ position: "absolute", width: s, height: s, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.08)", top: t, right: r, left: l, pointerEvents: "none" }} />
      ))}
      <div className="cc-fu" style={{ background: T.cream, borderRadius: 26, padding: "44px 40px", width: "100%", maxWidth: 440, textAlign: "center", boxShadow: "0 36px 90px rgba(0,0,0,0.28)", position: "relative" }}>
        <div style={{ fontSize: 52, marginBottom: 12, lineHeight: 1 }}>🏕️</div>
        <h1 style={{ fontFamily: FD, fontSize: 30, color: T.pine, marginBottom: 6, fontWeight: 900 }}>Camp Collective</h1>
        <p style={{ color: T.muted, marginBottom: 28, fontSize: 14, lineHeight: 1.65 }}>Your community hub for finding, sharing, and coordinating summer programs.</p>

        {step === "choose" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
            <button onClick={() => setStep("returning")} style={{ padding: 14, background: T.pine, color: "white", border: "none", borderRadius: 13, fontSize: 16, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 9, transition: "opacity .15s" }}
              onMouseEnter={e => e.currentTarget.style.opacity = ".85"} onMouseLeave={e => e.currentTarget.style.opacity = "1"}>
              <Ico n="user" size={18} color="white" /> We're a Returning Family
            </button>
            <button onClick={() => setStep("new")} style={{ padding: 14, background: T.coral, color: "white", border: "none", borderRadius: 13, fontSize: 16, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 9, transition: "opacity .15s" }}
              onMouseEnter={e => e.currentTarget.style.opacity = ".85"} onMouseLeave={e => e.currentTarget.style.opacity = "1"}>
              <Ico n="plus" size={18} color="white" /> Create Our Family Profile
            </button>
          </div>
        )}
        {step === "returning" && (
          <div>
            <h2 style={{ fontFamily: FD, fontSize: 20, color: T.pine, marginBottom: 14 }}>Select Your Family</h2>
            {busy && <p style={{ color: T.muted, padding: 16 }}>Loading…</p>}
            {!busy && fams.length === 0 && <p style={{ color: T.muted, marginBottom: 14 }}>No families yet — create yours!</p>}
            <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 280, overflowY: "auto", marginBottom: 16 }}>
              {fams.map(f => (
                <button key={f.id} onClick={() => claim(f)} style={{ padding: "12px 16px", borderRadius: 11, border: `1.5px solid ${T.fog}`, background: "white", textAlign: "left", cursor: "pointer", fontSize: 15, fontWeight: 500, transition: "all .15s" }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = T.pine; e.currentTarget.style.background = T.pine + "0c"; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = T.fog; e.currentTarget.style.background = "white"; }}>
                  {f.name}
                </button>
              ))}
            </div>
            <button onClick={() => { setStep("choose"); setErr(""); }} style={{ background: "none", border: "none", color: T.muted, fontSize: 13, cursor: "pointer" }}>← Back</button>
          </div>
        )}
        {step === "new" && (
          <div style={{ textAlign: "left" }}>
            <h2 style={{ fontFamily: FD, fontSize: 20, color: T.pine, marginBottom: 14, textAlign: "center" }}>Create Your Profile</h2>
            <Field label="Family Name" required value={name} onChange={setName} placeholder="e.g. The Johnson Family" />
            {err && <p style={{ color: T.coral, fontSize: 13, marginTop: 8 }}>{err}</p>}
            <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
              <Btn ch="← Back" onClick={() => { setStep("choose"); setErr(""); }} v="secondary" sx={{ flex: 1, justifyContent: "center" }} />
              <Btn ch={busy ? <><Spin /> Creating…</> : "Create & Enter →"} onClick={create} disabled={!name.trim() || busy} sx={{ flex: 2, justifyContent: "center" }} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const kidEmoji = k => {
  const g = k.gender || "";
  if (g === "Girl") return parseInt(k.age) >= 13 ? "👩" : "👧";
  if (g === "Boy") return parseInt(k.age) >= 13 ? "👨" : "👦";
  return parseInt(k.age) >= 13 ? "🧑" : "🧒";
};

function KidsTab({ family, kids, onRefresh }) {
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  async function save() {
    if (!editing?.name?.trim()) return;
    setSaving(true);
    await DB.upsertChild({ ...editing, family_id: family.id });
    await onRefresh(); setEditing(null); setSaving(false);
  }
  async function del(id) {
    if (!confirm("Remove this child?")) return;
    await DB.deleteChild(id); await onRefresh();
  }
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22 }}>
        <h2 style={{ fontFamily: FD, fontSize: 24, color: T.pine }}>Our Children</h2>
        <Btn ch={<><Ico n="plus" size={13} color="white" />Add Child</>} sz="sm" onClick={() => setEditing({ name: "", age: "", gender: "" })} />
      </div>
      {!kids.length && !editing && (
        <div style={{ textAlign: "center", padding: "56px 20px", color: T.muted }}>
          <div style={{ fontSize: 46, marginBottom: 12 }}>👦👧</div>
          <p style={{ fontSize: 15, lineHeight: 1.6 }}>Add your children here, then enroll them<br />in programs from each program's detail view.</p>
        </div>
      )}
      <div style={{ display: "grid", gap: 10 }}>
        {kids.map(k => (
          <Card key={k.id} ch={
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ width: 44, height: 44, borderRadius: 13, background: T.sky + "22", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>
                {kidEmoji(k)}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 16 }}>{k.name}</div>
                {k.age && <div style={{ fontSize: 13, color: T.muted }}>Age {k.age}{k.gender ? ` · ${k.gender}` : ""}</div>}
              </div>
              <div style={{ display: "flex", gap: 7 }}>
                <Btn ch={<><Ico n="edit" size={13} />Edit</>} sz="sm" v="secondary" onClick={() => setEditing({ id: k.id, name: k.name, age: k.age || "", gender: k.gender || "" })} />
                <Btn ch={<Ico n="trash" size={13} />} sz="sm" v="ghost" onClick={() => del(k.id)} />
              </div>
            </div>
          } />
        ))}
      </div>
      {editing && (
        <Overlay onClose={() => setEditing(null)} maxW={400} ch={
          <div>
            <h3 style={{ fontFamily: FD, fontSize: 21, marginBottom: 20 }}>{editing.id ? "Edit Child" : "Add Child"}</h3>
            <div style={{ display: "grid", gap: 14 }}>
              <Field label="Name" required value={editing.name} onChange={v => setEditing(e => ({ ...e, name: v }))} placeholder="e.g. Emma" />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <Field label="Age" type="number" value={editing.age} onChange={v => setEditing(e => ({ ...e, age: v }))} placeholder="e.g. 10" />
                <Field label="Gender" opts={["", "Boy", "Girl", "Non-binary"]} value={editing.gender || ""} onChange={v => setEditing(e => ({ ...e, gender: v }))} />
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
              <Btn ch="Cancel" v="secondary" onClick={() => setEditing(null)} sx={{ flex: 1, justifyContent: "center" }} />
              <Btn ch={saving ? <Spin /> : "Save"} onClick={save} disabled={!editing.name.trim() || saving} sx={{ flex: 2, justifyContent: "center" }} />
            </div>
          </div>
        } />
      )}
    </div>
  );
}

function ProgDetail({ prog: init, family, username, kids, childProgs, onClose, onSave, onAssign, onEdit }) {
  const [prog, setProg] = useState(init);
  const [ci, setCi] = useState({ d: "", p: "" });
  useEffect(() => setProg(init), [init]);
  async function addCP(type, person) {
    if (!person.trim()) return;
    const key = type === "d" ? "carpool_dropoff" : "carpool_pickup";
    const arr = prog[key] || [];
    if (arr.includes(person.trim())) return;
    const up = { ...prog, [key]: [...arr, person.trim()] };
    setProg(up); await onSave(up); setCi(c => ({ ...c, [type]: "" }));
  }
  async function rmCP(type, person) {
    const key = type === "d" ? "carpool_dropoff" : "carpool_pickup";
    const up = { ...prog, [key]: (prog[key] || []).filter(p => p !== person) };
    setProg(up); await onSave(up);
  }
  const cc = CATS[prog.category] || T.muted;
  return (
    <Overlay onClose={onClose} maxW={700} ch={
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <Bdg label={prog.category} color={cc} />
            {prog.age_min && <Bdg label={`Ages ${prog.age_min}–${prog.age_max || "+"}`} color={T.sky} />}
          </div>
          {prog.added_by_family_id === family.id && (
            <Btn ch={<><Ico n="edit" size={13} color="white" />Edit</>} sz="sm" v="sky" onClick={() => onEdit(prog)} />
          )}
        </div>
        <h2 style={{ fontFamily: FD, fontSize: 27, marginBottom: 5, lineHeight: 1.2 }}>{prog.name}</h2>
        <p style={{ color: T.muted, marginBottom: 16 }}>{prog.organization}{prog.location ? ` · ${prog.location}` : ""}</p>
        {prog.description && <p style={{ lineHeight: 1.78, marginBottom: 20, color: T.dark, fontSize: 15 }}>{prog.description}</p>}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 18 }}>
          {[["💰 Price", prog.price], ["📅 Dates", prog.start_date ? `${fmtD(prog.start_date)} – ${fmtD(prog.end_date)}` : null],
          ["⏰ Reg. Deadline", fmtD(prog.registration_deadline)], ["🚗 Drop-off", prog.dropoff_time],
          ["🏫 Pick-up", prog.pickup_time], ["📋 Requirements", prog.requirements]]
            .filter(([, v]) => v).map(([l, v]) => (
              <div key={l} style={{ padding: "10px 14px", background: "white", borderRadius: 10, border: `1px solid ${T.fog}` }}>
                <div style={{ fontSize: 11, color: T.muted, marginBottom: 2, fontWeight: 600 }}>{l}</div>
                <div style={{ fontSize: 14, fontWeight: 500 }}>{v}</div>
              </div>
            ))}
        </div>
        {prog.website && (
          <a href={prog.website} target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 6, color: T.sky, fontSize: 14, marginBottom: 20, fontWeight: 500 }}>
            <Ico n="link" size={14} color={T.sky} /> Visit Website
          </a>
        )}
        {kids.length > 0 && (
          <div style={{ borderTop: `1px solid ${T.fog}`, paddingTop: 20, marginBottom: 20 }}>
            <h3 style={{ fontFamily: FD, fontSize: 18, marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
              <Ico n="child" size={17} color={T.sky} /> Enroll Our Children
            </h3>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {kids.map(k => {
                const on = childProgs.some(cp => cp.child_id === k.id && cp.program_id === prog.id);
                return (
                  <button key={k.id} onClick={() => onAssign(k.id, prog.id, !on)}
                    style={{ padding: "7px 14px", borderRadius: 20, border: `2px solid ${on ? T.pine : T.fog}`, background: on ? T.pine + "11" : "white", color: on ? T.pine : T.muted, fontWeight: 600, fontSize: 13, cursor: "pointer", transition: "all .15s", display: "flex", alignItems: "center", gap: 5 }}>
                    {on && <Ico n="check" size={13} color={T.pine} />}{k.name}{k.age ? ` (${k.age})` : ""}
                  </button>
                );
              })}
            </div>
          </div>
        )}
        <div style={{ borderTop: `1px solid ${T.fog}`, paddingTop: 20 }}>
          <h3 style={{ fontFamily: FD, fontSize: 18, marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>
            <Ico n="car" size={17} color={T.bark} /> Carpool Coordination
          </h3>
          {[["d", "🚗 Drop-off Volunteers", "carpool_dropoff"], ["p", "🏠 Pick-up Volunteers", "carpool_pickup"]].map(([type, label, key]) => (
            <div key={type} style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.muted, marginBottom: 7 }}>{label}</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
                {(prog[key] || []).map(p => (
                  <span key={p} style={{ padding: "4px 10px", background: T.sand, borderRadius: 20, fontSize: 13, display: "flex", alignItems: "center", gap: 4 }}>
                    {p}<button onClick={() => rmCP(type, p)} style={{ background: "none", border: "none", cursor: "pointer", color: T.muted, fontSize: 15, lineHeight: 1 }}>×</button>
                  </span>
                ))}
                {!(prog[key] || []).length && <span style={{ fontSize: 13, color: T.muted, fontStyle: "italic" }}>No volunteers yet</span>}
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <input value={ci[type]} onChange={e => setCi(c => ({ ...c, [type]: e.target.value }))}
                  onKeyDown={e => { if (e.key === "Enter") addCP(type, ci[type]); }}
                  placeholder={`Tag a family for ${type === "d" ? "drop-off" : "pick-up"}…`}
                  style={{ flex: 1, padding: "8px 12px", border: `1.5px solid ${T.fog}`, borderRadius: 8, fontSize: 13 }} />
                <Btn ch="Tag" sz="sm" v="secondary" onClick={() => addCP(type, ci[type])} />
                <Btn ch="Tag Me" sz="sm" v={type === "d" ? "sky" : "coral"} onClick={() => addCP(type, username)} />
              </div>
            </div>
          ))}
        </div>
      </div>
    } />
  );
}

function AddProg({ family, username, onClose, onAdd, onAddMany }) {
  const [mode, setMode] = useState("search");
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState(false);
  const [results, setResults] = useState([]);
  const [searchErr, setSearchErr] = useState("");
  const [selected, setSelected] = useState(new Set());
  const blank = { name: "", organization: "", description: "", category: "Other", price: "", registration_deadline: "", start_date: "", end_date: "", dropoff_time: "", pickup_time: "", age_min: "", age_max: "", requirements: "", website: "", location: "" };
  const [form, setForm] = useState(blank);
  const fv = (k, v) => setForm(p => ({ ...p, [k]: v }));

  async function doSearch() {
    if (!query.trim()) return;
    setBusy(true); setResults([]); setSearchErr(""); setSelected(new Set());
    try { setResults(await aiSearch(query)); }
    catch { setSearchErr("Search failed — try manual entry."); }
    setBusy(false);
  }

  function toggleSelect(i) {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i); else next.add(i);
      return next;
    });
  }

  async function importSelected() {
    if (selected.size === 0) return;
    setBusy(true);
    const items = [...selected].map(i => results[i]).filter(Boolean);
    await onAddMany(items.map(r => ({ ...blank, ...r, age_min: r.age_min || "", age_max: r.age_max || "", added_by: username, added_by_family_id: family.id, likes: [], carpool_dropoff: [], carpool_pickup: [] })));
    setBusy(false);
  }

  async function submit() {
    if (!form.name.trim()) return;
    await onAdd({ ...form, added_by: username, added_by_family_id: family.id, likes: [], carpool_dropoff: [], carpool_pickup: [] });
  }

  const ModeBtn = ({ m, label }) => (
    <button onClick={() => setMode(m)} style={{ padding: "8px 18px", borderRadius: 10, border: `2px solid ${mode === m ? T.pine : T.fog}`, background: mode === m ? T.pine : "white", color: mode === m ? "white" : T.muted, fontWeight: 600, fontSize: 14, cursor: "pointer", transition: "all .15s" }}>
      {label}
    </button>
  );

  return (
    <Overlay onClose={onClose} maxW={700} ch={
      <div>
        <h2 style={{ fontFamily: FD, fontSize: 25, marginBottom: 5 }}>Add a Program</h2>
        <p style={{ color: T.muted, fontSize: 14, marginBottom: 22 }}>Search the web to auto-import details, or enter manually.</p>
        <div style={{ display: "flex", gap: 9, marginBottom: 26 }}>
          <ModeBtn m="search" label="🔍 Search Web" />
          <ModeBtn m="manual" label="✏️ Manual Entry" />
        </div>
        {mode === "search" && (
          <div>
            <div style={{ display: "flex", gap: 9, marginBottom: 16 }}>
              <input value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => e.key === "Enter" && doSearch()}
                placeholder="e.g. coding camp Vancouver 2025, soccer for ages 8-12…"
                style={{ flex: 1, padding: "10px 15px", border: `2px solid ${T.fog}`, borderRadius: 11, fontSize: 14 }} autoFocus />
              <Btn ch={busy ? <><Spin />Searching…</> : <><Ico n="search" size={14} color="white" />Search</>} onClick={doSearch} disabled={busy} />
            </div>
            {searchErr && <p style={{ color: T.coral, fontSize: 13, marginBottom: 12 }}>{searchErr}</p>}
            {results.length > 0 && (
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <button onClick={() => setSelected(selected.size === results.length ? new Set() : new Set(results.map((_, i) => i)))}
                  style={{ background: "none", border: "none", color: T.sky, fontSize: 13, fontWeight: 600, cursor: "pointer", padding: 0 }}>
                  {selected.size === results.length ? "Deselect All" : "Select All"}
                </button>
                {selected.size > 0 && (
                  <Btn ch={busy ? <><Spin />Importing…</> : <><Ico n="dl" size={13} color="white" />Import {selected.size} Selected</>}
                    v="sky" sz="sm" onClick={importSelected} disabled={busy} />
                )}
              </div>
            )}
            <div style={{ display: "grid", gap: 12 }}>
              {results.map((r, i) => {
                const sel = selected.has(i);
                return (
                  <div key={i} onClick={() => toggleSelect(i)} style={{ cursor: "pointer" }}>
                    <Card sx={{ border: `2px solid ${sel ? T.sky : T.fog}`, background: sel ? T.sky + "08" : "white", transition: "all .15s" }} ch={
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 14 }}>
                        <div style={{ width: 22, height: 22, borderRadius: 6, border: `2px solid ${sel ? T.sky : T.fog}`, background: sel ? T.sky : "white", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 2 }}>
                          {sel && <Ico n="check" size={12} color="white" />}
                        </div>
                        <div style={{ flex: 1 }}>
                          <Bdg label={r.category} color={CATS[r.category] || T.muted} />
                          <h4 style={{ fontFamily: FD, fontSize: 16, marginTop: 7, marginBottom: 2 }}>{r.name}</h4>
                          <p style={{ fontSize: 13, color: T.muted }}>{r.organization}{r.location ? ` · ${r.location}` : ""}</p>
                          <p style={{ fontSize: 13, marginTop: 6, lineHeight: 1.55, color: T.dark }}>{r.description?.slice(0, 110)}{r.description?.length > 110 ? "…" : ""}</p>
                          <div style={{ display: "flex", gap: 12, marginTop: 8, fontSize: 12, flexWrap: "wrap", color: T.muted }}>
                            {r.price && <span>💰 {r.price}</span>}
                            {r.start_date && <span>📅 {fmtD(r.start_date)}</span>}
                            {r.registration_deadline && <span>⏰ {fmtD(r.registration_deadline)}</span>}
                          </div>
                        </div>
                        <Btn ch={<><Ico n="dl" size={13} color="white" />Import</>} sz="sm" v="sky"
                          onClick={e => { e.stopPropagation(); setForm({ ...blank, ...r, age_min: r.age_min || "", age_max: r.age_max || "" }); setMode("manual"); }} />
                      </div>
                    } />
                  </div>
                );
              })}
              {!results.length && !busy && query && !searchErr && (
                <p style={{ color: T.muted, textAlign: "center", padding: "24px 0", fontSize: 14 }}>No results. Try different keywords or switch to Manual Entry.</p>
              )}
            </div>
          </div>
        )}
        {mode === "manual" && (
          <div style={{ display: "grid", gap: 13 }}>
            <Field label="Program Name" required value={form.name} onChange={v => fv("name", v)} />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <Field label="Organization" value={form.organization} onChange={v => fv("organization", v)} />
              <Field label="Location" value={form.location} onChange={v => fv("location", v)} />
            </div>
            <Field label="Description" textarea value={form.description} onChange={v => fv("description", v)} />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <Field label="Category" opts={Object.keys(CATS)} value={form.category} onChange={v => fv("category", v)} />
              <Field label="Price" value={form.price} onChange={v => fv("price", v)} placeholder="e.g. $450/week or Free" />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
              <Field label="Start Date" type="date" value={form.start_date} onChange={v => fv("start_date", v)} />
              <Field label="End Date" type="date" value={form.end_date} onChange={v => fv("end_date", v)} />
              <Field label="Reg. Deadline" type="date" value={form.registration_deadline} onChange={v => fv("registration_deadline", v)} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <Field label="Drop-off Time" value={form.dropoff_time} onChange={v => fv("dropoff_time", v)} placeholder="e.g. 8:30 AM" />
              <Field label="Pick-up Time" value={form.pickup_time} onChange={v => fv("pickup_time", v)} placeholder="e.g. 3:30 PM" />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <Field label="Min Age" type="number" value={form.age_min} onChange={v => fv("age_min", v)} />
              <Field label="Max Age" type="number" value={form.age_max} onChange={v => fv("age_max", v)} />
            </div>
            <Field label="Requirements / Prerequisites" value={form.requirements} onChange={v => fv("requirements", v)} />
            <Field label="Website URL" type="url" value={form.website} onChange={v => fv("website", v)} />
            <Btn ch={<><Ico n="plus" size={14} color="white" />Add Program</>} onClick={submit} disabled={!form.name.trim()} sx={{ justifyContent: "center", marginTop: 4 }} />
          </div>
        )}
      </div>
    } />
  );
}

function EditProg({ prog, onClose, onSave }) {
  const init = { name: prog.name || "", organization: prog.organization || "", description: prog.description || "", category: prog.category || "Other", price: prog.price || "", registration_deadline: prog.registration_deadline || "", start_date: prog.start_date || "", end_date: prog.end_date || "", dropoff_time: prog.dropoff_time || "", pickup_time: prog.pickup_time || "", age_min: prog.age_min || "", age_max: prog.age_max || "", requirements: prog.requirements || "", website: prog.website || "", location: prog.location || "" };
  const [form, setForm] = useState(init);
  const fv = (k, v) => setForm(p => ({ ...p, [k]: v }));
  async function submit() {
    if (!form.name.trim()) return;
    await onSave({ ...prog, ...form });
  }
  return (
    <Overlay onClose={onClose} maxW={700} ch={
      <div>
        <h2 style={{ fontFamily: FD, fontSize: 25, marginBottom: 20 }}>Edit Program</h2>
        <div style={{ display: "grid", gap: 13 }}>
          <Field label="Program Name" required value={form.name} onChange={v => fv("name", v)} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Field label="Organization" value={form.organization} onChange={v => fv("organization", v)} />
            <Field label="Location" value={form.location} onChange={v => fv("location", v)} />
          </div>
          <Field label="Description" textarea value={form.description} onChange={v => fv("description", v)} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Field label="Category" opts={Object.keys(CATS)} value={form.category} onChange={v => fv("category", v)} />
            <Field label="Price" value={form.price} onChange={v => fv("price", v)} placeholder="e.g. $450/week or Free" />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
            <Field label="Start Date" type="date" value={form.start_date} onChange={v => fv("start_date", v)} />
            <Field label="End Date" type="date" value={form.end_date} onChange={v => fv("end_date", v)} />
            <Field label="Reg. Deadline" type="date" value={form.registration_deadline} onChange={v => fv("registration_deadline", v)} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Field label="Drop-off Time" value={form.dropoff_time} onChange={v => fv("dropoff_time", v)} placeholder="e.g. 8:30 AM" />
            <Field label="Pick-up Time" value={form.pickup_time} onChange={v => fv("pickup_time", v)} placeholder="e.g. 3:30 PM" />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Field label="Min Age" type="number" value={form.age_min} onChange={v => fv("age_min", v)} />
            <Field label="Max Age" type="number" value={form.age_max} onChange={v => fv("age_max", v)} />
          </div>
          <Field label="Requirements / Prerequisites" value={form.requirements} onChange={v => fv("requirements", v)} />
          <Field label="Website URL" type="url" value={form.website} onChange={v => fv("website", v)} />
          <Btn ch={<><Ico n="check" size={14} color="white" />Save Changes</>} onClick={submit} disabled={!form.name.trim()} sx={{ justifyContent: "center", marginTop: 4 }} />
        </div>
      </div>
    } />
  );
}

function ProgsTab({ progs, family, username, kids, childProgs, onLike, onDelete, onOpen, onAdd, onEdit }) {
  const [filter, setFilter] = useState("All");
  const [sort, setSort] = useState("newest");
  const [q, setQ] = useState("");

  let list = progs
    .filter(p => !q || [p.name, p.description, p.organization].some(s => s?.toLowerCase().includes(q.toLowerCase())))
    .filter(p => filter === "All" || p.category === filter);
  if (sort === "likes") list = [...list].sort((a, b) => (b.likes?.length || 0) - (a.likes?.length || 0));
  else if (sort === "newest") list = [...list].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  else if (sort === "deadline") list = [...list].sort((a, b) => new Date(a.registration_deadline || "9999") - new Date(b.registration_deadline || "9999"));

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <h2 style={{ fontFamily: FD, fontSize: 26, color: T.pine }}>All Programs <span style={{ fontSize: 15, color: T.muted, fontFamily: FB }}>({list.length})</span></h2>
        <Btn ch={<><Ico n="plus" size={14} color="white" />Add Program</>} v="coral" onClick={onAdd} />
      </div>
      <div style={{ display: "flex", gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
        <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
          <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}><Ico n="search" size={15} color={T.muted} /></span>
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search programs…"
            style={{ width: "100%", padding: "9px 12px 9px 34px", border: `1.5px solid ${T.fog}`, borderRadius: 10, fontSize: 14 }} />
        </div>
        <select value={sort} onChange={e => setSort(e.target.value)} style={{ padding: "9px 14px", border: `1.5px solid ${T.fog}`, borderRadius: 10, fontSize: 14, background: "white" }}>
          <option value="newest">Newest</option>
          <option value="likes">Most Liked</option>
          <option value="deadline">Deadline</option>
        </select>
      </div>
      <div style={{ display: "flex", gap: 7, flexWrap: "wrap", marginBottom: 20 }}>
        {["All", ...Object.keys(CATS)].map(c => (
          <button key={c} onClick={() => setFilter(c)} style={{ padding: "5px 13px", borderRadius: 20, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600, background: filter === c ? (CATS[c] || T.pine) : T.fog, color: filter === c ? "white" : T.muted, transition: "all .15s" }}>
            {c}
          </button>
        ))}
      </div>
      {!list.length && (
        <div style={{ textAlign: "center", padding: "64px 20px", color: T.muted }}>
          <div style={{ fontSize: 50, marginBottom: 14 }}>🏕️</div>
          <p style={{ fontSize: 16 }}>No programs yet — be the first to add one!</p>
        </div>
      )}
      <div style={{ display: "grid", gap: 14 }}>
        {list.map(p => {
          const liked = (p.likes || []).includes(username);
          const myKids = childProgs.filter(cp => cp.program_id === p.id && kids.find(k => k.id === cp.child_id));
          const cc = CATS[p.category] || T.muted;
          const soonDl = p.registration_deadline && new Date(p.registration_deadline) < new Date(Date.now() + 7 * 864e5);
          return (
            <Card key={p.id} cls="cc-card" onClick={() => onOpen(p)} ch={
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", gap: 7, flexWrap: "wrap", marginBottom: 7 }}>
                      <Bdg label={p.category} color={cc} />
                      {soonDl && <Bdg label="⏰ Deadline Soon" color={T.coral} />}
                    </div>
                    <h3 style={{ fontFamily: FD, fontSize: 19, marginBottom: 2, lineHeight: 1.2 }}>{p.name}</h3>
                    <p style={{ fontSize: 13, color: T.muted }}>{p.organization}{p.location ? ` · ${p.location}` : ""}</p>
                  </div>
                  <button onClick={e => { e.stopPropagation(); onLike(p); }}
                    style={{ background: "none", border: "none", display: "flex", alignItems: "center", gap: 4, cursor: "pointer", flexShrink: 0, marginLeft: 8 }}>
                    <Ico n="heart" size={21} color={liked ? T.coral : "#ccc"} fill={liked ? T.coral : "none"} />
                    <span style={{ fontSize: 13, fontWeight: 700, color: T.muted }}>{(p.likes || []).length}</span>
                  </button>
                </div>
                {p.description && <p style={{ fontSize: 14, color: T.muted, marginBottom: 12, lineHeight: 1.55 }}>{p.description.slice(0, 140)}{p.description.length > 140 ? "…" : ""}</p>}
                <div style={{ display: "flex", gap: 14, flexWrap: "wrap", fontSize: 13 }}>
                  {p.price && <span style={{ color: T.pine, fontWeight: 600 }}>💰 {p.price}</span>}
                  {p.start_date && <span style={{ color: T.sky }}>📅 {fmtD(p.start_date)}{p.end_date ? ` – ${fmtD(p.end_date)}` : ""}</span>}
                  {p.dropoff_time && <span style={{ color: T.bark }}>🚗 {p.dropoff_time}</span>}
                  {p.pickup_time && <span style={{ color: T.bark }}>🏠 {p.pickup_time}</span>}
                </div>
                {myKids.length > 0 && (
                  <div style={{ marginTop: 10, padding: "6px 12px", background: T.sky + "15", borderRadius: 8, fontSize: 13, color: T.sky, fontWeight: 600 }}>
                    👦 Enrolled: {myKids.map(cp => kids.find(k => k.id === cp.child_id)?.name).filter(Boolean).join(", ")}
                  </div>
                )}
                {(p.carpool_dropoff?.length > 0 || p.carpool_pickup?.length > 0) && (
                  <div style={{ marginTop: 8, padding: "6px 12px", background: T.sand, borderRadius: 8, fontSize: 12, color: T.bark }}>
                    {p.carpool_dropoff?.length > 0 && <span>🚐 Drop: {p.carpool_dropoff.join(", ")} </span>}
                    {p.carpool_pickup?.length > 0 && <span>🏠 Pick: {p.carpool_pickup.join(", ")}</span>}
                  </div>
                )}
                <div style={{ marginTop: 10, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 12, color: T.muted }}>Added by {p.added_by} · {fmtD(p.created_at)}</span>
                  {p.added_by_family_id === family.id && (
                    <div style={{ display: "flex", gap: 2 }}>
                      <button onClick={e => { e.stopPropagation(); onEdit(p); }}
                        style={{ background: "none", border: "none", color: "#ddd", cursor: "pointer", padding: 4 }}
                        title="Edit program"
                        onMouseEnter={e => e.currentTarget.style.color = T.sky}
                        onMouseLeave={e => e.currentTarget.style.color = "#ddd"}>
                        <Ico n="edit" size={14} />
                      </button>
                      <button onClick={e => { e.stopPropagation(); if (confirm("Delete this program?")) onDelete(p.id); }}
                        style={{ background: "none", border: "none", color: "#ddd", cursor: "pointer", padding: 4 }}
                        onMouseEnter={e => e.currentTarget.style.color = T.coral}
                        onMouseLeave={e => e.currentTarget.style.color = "#ddd"}>
                        <Ico n="trash" size={14} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            } />
          );
        })}
      </div>
    </div>
  );
}

function CalTab({ progs, onOpen, allChildProgs }) {
  const [off, setOff] = useState(0);
  const now = new Date();
  const base = new Date(now.getFullYear(), now.getMonth() + off, 1);
  const y = base.getFullYear(), m = base.getMonth();
  const dim = new Date(y, m + 1, 0).getDate(), fd = base.getDay();
  const label = base.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const progsOn = d => {
    const date = new Date(y, m, d);
    return progs.filter(p => {
      if (!p.start_date) return false;
      const s = new Date(p.start_date + "T12:00:00"), e = p.end_date ? new Date(p.end_date + "T12:00:00") : s;
      return date >= s && date <= e;
    });
  };
  const enrolledCount = pid => (allChildProgs || []).filter(cp => cp.program_id === pid).length;
  const cells = [...Array(fd).fill(null), ...Array.from({ length: dim }, (_, i) => i + 1)];
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 22, flexWrap: "wrap", gap: 10 }}>
        <h2 style={{ fontFamily: FD, fontSize: 26, color: T.pine }}>{label}</h2>
        <div style={{ display: "flex", gap: 8 }}>
          <Btn ch="← Prev" v="secondary" sz="sm" onClick={() => setOff(o => o - 1)} />
          <Btn ch="Today" v="secondary" sz="sm" onClick={() => setOff(0)} />
          <Btn ch="Next →" v="secondary" sz="sm" onClick={() => setOff(o => o + 1)} />
        </div>
      </div>
      <div style={{ overflowX: "auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 3, marginBottom: 5, minWidth: 280 }}>
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(d => (
            <div key={d} style={{ textAlign: "center", fontSize: 12, fontWeight: 700, color: T.muted, padding: "5px 0" }}>{d}</div>
          ))}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 3, minWidth: 280 }}>
          {cells.map((day, i) => {
            const dp = day ? progsOn(day) : [];
            const isT = day && new Date(y, m, day).toDateString() === now.toDateString();
            return (
              <div key={i} style={{ minHeight: 74, background: day ? "white" : "transparent", border: day ? `1px solid ${isT ? T.pine : T.fog}` : "none", borderRadius: 9, padding: 5, boxShadow: isT ? `0 0 0 2px ${T.pine}` : "none", minWidth: 0 }}>
                {day && <>
                  <div style={{ fontSize: 12, fontWeight: isT ? 800 : 400, color: isT ? T.pine : T.dark, marginBottom: 2 }}>{day}</div>
                  {dp.slice(0, 3).map(p => {
                    const cnt = enrolledCount(p.id);
                    return (
                      <div key={p.id} onClick={() => onOpen(p)}
                        style={{ fontSize: 10, padding: "2px 4px", borderRadius: 3, marginBottom: 2, cursor: "pointer", background: (CATS[p.category] || T.muted) + "28", color: CATS[p.category] || T.muted, fontWeight: 700 }}>
                        <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</div>
                        {cnt > 0 && <div style={{ fontSize: 9, opacity: 0.85, whiteSpace: "nowrap" }}>👦 {cnt} kid{cnt !== 1 ? "s" : ""}</div>}
                      </div>
                    );
                  })}
                  {dp.length > 3 && <div style={{ fontSize: 10, color: T.muted }}>+{dp.length - 3}</div>}
                </>}
              </div>
            );
          })}
        </div>
      </div>
      <div style={{ marginTop: 14, display: "flex", flexWrap: "wrap", gap: 10 }}>
        {Object.entries(CATS).map(([cat, color]) => (
          <span key={cat} style={{ fontSize: 12, display: "flex", alignItems: "center", gap: 5 }}>
            <span style={{ width: 10, height: 10, borderRadius: 2, background: color, display: "inline-block" }} />{cat}
          </span>
        ))}
      </div>
    </div>
  );
}

function ChatTab({ msgs, username, onSend }) {
  const [text, setText] = useState("");
  const bot = useRef();
  useEffect(() => bot.current?.scrollIntoView({ behavior: "smooth" }), [msgs]);
  function send() { if (!text.trim()) return; onSend(text.trim()); setText(""); }
  const grouped = msgs.reduce((acc, m) => { const d = new Date(m.created_at).toDateString(); acc[d] = acc[d] || []; acc[d].push(m); return acc; }, {});
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 210px)", minHeight: 380 }}>
      <h2 style={{ fontFamily: FD, fontSize: 24, color: T.pine, marginBottom: 18 }}>Family Chat</h2>
      <div style={{ flex: 1, overflowY: "auto", paddingRight: 4 }}>
        {Object.entries(grouped).map(([date, ms]) => (
          <div key={date}>
            <div style={{ textAlign: "center", margin: "14px 0 8px", fontSize: 12, color: T.muted, fontWeight: 700 }}>{date}</div>
            {ms.map(m => {
              const mine = m.author === username;
              return (
                <div key={m.id} className="cc-fu" style={{ display: "flex", justifyContent: mine ? "flex-end" : "flex-start", marginBottom: 10 }}>
                  <div style={{ maxWidth: "72%" }}>
                    {!mine && <div style={{ fontSize: 12, color: T.muted, marginBottom: 3, paddingLeft: 4 }}>{m.author}</div>}
                    <div style={{ padding: "10px 15px", borderRadius: mine ? "16px 16px 4px 16px" : "4px 16px 16px 16px", background: mine ? T.pine : "white", color: mine ? "white" : T.dark, fontSize: 14, border: mine ? "none" : `1px solid ${T.fog}`, boxShadow: "0 2px 8px rgba(0,0,0,0.055)" }}>
                      {m.text}
                    </div>
                    <div style={{ fontSize: 11, color: T.muted, marginTop: 3, textAlign: mine ? "right" : "left", paddingLeft: 4 }}>
                      {new Date(m.created_at).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ))}
        {!msgs.length && <div style={{ textAlign: "center", padding: 60, color: T.muted }}><div style={{ fontSize: 40, marginBottom: 10 }}>💬</div><p>No messages yet — start the conversation!</p></div>}
        <div ref={bot} />
      </div>
      <div style={{ paddingTop: 12, display: "flex", gap: 8 }}>
        <input value={text} onChange={e => setText(e.target.value)} onKeyDown={e => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), send())}
          placeholder={`Message as ${username}…`}
          style={{ flex: 1, padding: "12px 16px", border: `1.5px solid ${T.fog}`, borderRadius: 13, fontSize: 14 }} />
        <button onClick={send} disabled={!text.trim()} style={{ background: T.pine, color: "white", border: "none", borderRadius: 13, padding: "0 18px", cursor: "pointer", display: "flex", alignItems: "center", opacity: !text.trim() ? ".45" : "1" }}>
          <Ico n="send" size={18} color="white" />
        </button>
      </div>
    </div>
  );
}

function BulletinTab({ items, family, username, onDelete }) {
  const EM = { new_program: "🏕️", like: "❤️", carpool: "🚗", new_family: "🎉" };
  return (
    <div>
      <h2 style={{ fontFamily: FD, fontSize: 26, color: T.pine, marginBottom: 20 }}>Bulletin Board</h2>
      {!items.length && <div style={{ textAlign: "center", padding: 60, color: T.muted }}><div style={{ fontSize: 42, marginBottom: 10 }}>📋</div><p>No activity yet!</p></div>}
      <div style={{ display: "grid", gap: 10 }}>
        {items.map(b => (
          <Card key={b.id} cls="cc-fu" ch={
            <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
              <div style={{ width: 42, height: 42, borderRadius: 12, background: T.pine + "12", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>
                {EM[b.type] || "📋"}
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 14, color: T.dark, lineHeight: 1.65 }}>{b.message}</p>
                <p style={{ fontSize: 12, color: T.muted, marginTop: 3 }}>
                  {new Date(b.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                </p>
              </div>
              {(b.family_id === family.id || b.author === username) && (
                <button onClick={() => onDelete(b.id)} style={{ background: "none", border: "none", color: "#ddd", cursor: "pointer", padding: 4, flexShrink: 0 }}
                  onMouseEnter={e => e.currentTarget.style.color = T.coral}
                  onMouseLeave={e => e.currentTarget.style.color = "#ddd"}>
                  <Ico n="trash" size={15} />
                </button>
              )}
            </div>
          } />
        ))}
      </div>
    </div>
  );
}

function RankedTab({ progs, onOpen }) {
  const sorted = [...progs].sort((a, b) => (b.likes?.length || 0) - (a.likes?.length || 0));
  const medals = ["🥇", "🥈", "🥉"];
  return (
    <div>
      <h2 style={{ fontFamily: FD, fontSize: 26, color: T.pine, marginBottom: 22 }}>🏆 Top Liked Programs</h2>
      {!sorted.length && <div style={{ textAlign: "center", padding: 60, color: T.muted }}>No programs yet!</div>}
      <div style={{ display: "grid", gap: 10 }}>
        {sorted.map((p, i) => (
          <Card key={p.id} cls="cc-card" onClick={() => onOpen(p)} ch={
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ width: 48, height: 48, borderRadius: 13, background: T.gold + "1a", display: "flex", alignItems: "center", justifyContent: "center", fontSize: i < 3 ? 26 : 15, fontWeight: 800, color: T.muted, flexShrink: 0 }}>
                {medals[i] || `#${i + 1}`}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: FD, fontSize: 17, marginBottom: 2 }}>{p.name}</div>
                <div style={{ fontSize: 13, color: T.muted }}>{p.organization}</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 5, color: T.coral, flexShrink: 0 }}>
                <Ico n="heart" size={18} color={T.coral} fill={T.coral} />
                <span style={{ fontWeight: 800, fontSize: 18 }}>{p.likes?.length || 0}</span>
              </div>
            </div>
          } />
        ))}
      </div>
    </div>
  );
}

export default function App() {
  const [fam, setFam] = useState(() => { try { return JSON.parse(localStorage.getItem(LOCAL_FAM)); } catch { return null; } });
  const [progs, setProgs] = useState([]);
  const [kids, setKids] = useState([]);
  const [cps, setCps] = useState([]);
  const [allCps, setAllCps] = useState([]);
  const [chat, setChat] = useState([]);
  const [bull, setBull] = useState([]);
  const [tab, setTab] = useState("programs");
  const [showAdd, setShowAdd] = useState(false);
  const [detail, setDetail] = useState(null);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);

  const username = fam?.name || "";

  async function loadAll() {
    if (!fam) return;
    setLoading(true);
    const [p, c, b, k, cp, acp] = await Promise.all([
      DB.getPrograms(), DB.getChat(), DB.getBulletin(),
      DB.getChildren(fam.id), DB.getChildPrograms(fam.id),
      DB.getAllChildPrograms(),
    ]);
    setProgs(p); setChat(c); setBull(b); setKids(k); setCps(cp); setAllCps(acp);
    setLoading(false);
  }
  useEffect(() => { loadAll(); }, [fam?.id]);

  async function addProg(p) {
    const np = await DB.addProgram(p);
    setProgs(prev => [np, ...prev]);
    const b = await DB.addBulletin({ message: `${username} added "${p.name}" 🏕️`, type: "new_program", author: username, family_id: fam.id });
    setBull(prev => [b, ...prev]);
    setShowAdd(false);
  }
  async function addManyProgs(ps) {
    for (const p of ps) {
      const np = await DB.addProgram(p);
      setProgs(prev => [np, ...prev]);
      const b = await DB.addBulletin({ message: `${username} added "${p.name}" 🏕️`, type: "new_program", author: username, family_id: fam.id });
      setBull(prev => [b, ...prev]);
    }
    setShowAdd(false);
  }
  async function likeProg(p) {
    const likes = p.likes || [];
    const nl = likes.includes(username) ? likes.filter(u => u !== username) : [...likes, username];
    await DB.updateProgram(p.id, { likes: nl });
    setProgs(prev => prev.map(x => x.id === p.id ? { ...x, likes: nl } : x));
    if (detail?.id === p.id) setDetail(d => ({ ...d, likes: nl }));
    if (!likes.includes(username)) {
      const b = await DB.addBulletin({ message: `${username} liked "${p.name}" ❤️`, type: "like", author: username, family_id: fam.id });
      setBull(prev => [b, ...prev]);
    }
  }
  async function delProg(id) {
    await DB.deleteProgram(id);
    setProgs(prev => prev.filter(p => p.id !== id));
  }
  async function saveProg(up) {
    const patch = { carpool_dropoff: up.carpool_dropoff, carpool_pickup: up.carpool_pickup };
    await DB.updateProgram(up.id, patch);
    setProgs(prev => prev.map(p => p.id === up.id ? { ...p, ...patch } : p));
  }
  async function editProgFn(up) {
    const patch = { name: up.name, organization: up.organization, description: up.description, category: up.category, price: up.price, registration_deadline: up.registration_deadline, start_date: up.start_date, end_date: up.end_date, dropoff_time: up.dropoff_time, pickup_time: up.pickup_time, age_min: up.age_min, age_max: up.age_max, requirements: up.requirements, website: up.website, location: up.location };
    await DB.updateProgram(up.id, patch);
    setProgs(prev => prev.map(p => p.id === up.id ? { ...p, ...patch } : p));
    if (detail?.id === up.id) setDetail(d => ({ ...d, ...patch }));
    setEditing(null);
  }
  async function sendChat(text) {
    const m = await DB.sendChat({ author: username, family_id: fam.id, text });
    setChat(prev => [...prev, m]);
  }
  async function delBull(id) {
    await DB.deleteBulletin(id);
    setBull(prev => prev.filter(b => b.id !== id));
  }
  async function assignKid(kid, pid, assign) {
    if (assign) {
      await DB.assignChild(kid, pid, fam.id);
      setCps(prev => [...prev.filter(x => !(x.child_id === kid && x.program_id === pid)), { child_id: kid, program_id: pid, family_id: fam.id }]);
    } else {
      await DB.unassignChild(kid, pid);
      setCps(prev => prev.filter(x => !(x.child_id === kid && x.program_id === pid)));
    }
  }

  if (!fam) return <Welcome onLogin={f => setFam(f)} />;

  const NAV = [
    { id: "programs", label: "Programs", icon: "home" },
    { id: "calendar", label: "Calendar", icon: "cal" },
    { id: "ranked", label: "Top Liked", icon: "star" },
    { id: "bulletin", label: "Bulletin", icon: "bell" },
    { id: "chat", label: "Chat", icon: "chat" },
    { id: "children", label: "Our Children", icon: "child" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: T.cream }}>
      <header style={{ background: T.pine, padding: "0 22px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 58, position: "sticky", top: 0, zIndex: 400, boxShadow: "0 2px 14px rgba(0,0,0,0.2)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 22 }}>🏕️</span>
          <span style={{ fontFamily: FD, fontSize: 19, color: "white", fontWeight: 700, letterSpacing: "-.01em" }}>Camp Collective</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 13, color: "rgba(255,255,255,0.68)", display: "flex", alignItems: "center", gap: 5 }}>
            <Ico n="user" size={13} color="rgba(255,255,255,0.68)" />{username}
          </span>
          <button onClick={() => { localStorage.removeItem(LOCAL_FAM); setFam(null); }}
            style={{ background: "rgba(255,255,255,0.13)", border: "none", color: "white", borderRadius: 8, padding: "5px 12px", fontSize: 12, cursor: "pointer", fontWeight: 600 }}
            onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.22)"}
            onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.13)"}>
            Switch Family
          </button>
        </div>
      </header>
      <nav style={{ background: "white", borderBottom: `1px solid ${T.fog}`, padding: "0 14px", display: "flex", position: "sticky", top: 58, zIndex: 300, overflowX: "auto", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
        {NAV.map(item => (
          <button key={item.id} onClick={() => setTab(item.id)}
            style={{ padding: "13px 15px", border: "none", borderBottom: tab === item.id ? `3px solid ${T.pine}` : "3px solid transparent", background: "none", cursor: "pointer", color: tab === item.id ? T.pine : T.muted, fontWeight: tab === item.id ? 700 : 400, fontSize: 13, display: "flex", alignItems: "center", gap: 5, whiteSpace: "nowrap" }}>
            <Ico n={item.icon} size={14} color={tab === item.id ? T.pine : T.muted} />{item.label}
          </button>
        ))}
      </nav>
      <main style={{ maxWidth: 920, margin: "0 auto", padding: "26px 18px 80px" }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: 90, color: T.muted }}>
            <div className="cc-sp" style={{ width: 40, height: 40, border: `3px solid ${T.fog}`, borderTop: `3px solid ${T.pine}`, borderRadius: "50%", margin: "0 auto 18px" }} />
            Loading your community…
          </div>
        ) : (
          <>
            {tab === "programs" && <ProgsTab progs={progs} family={fam} username={username} kids={kids} childProgs={cps} onLike={likeProg} onDelete={delProg} onOpen={setDetail} onAdd={() => setShowAdd(true)} onEdit={setEditing} />}
            {tab === "calendar" && <CalTab progs={progs} onOpen={setDetail} allChildProgs={allCps} />}
            {tab === "ranked" && <RankedTab progs={progs} onOpen={setDetail} />}
            {tab === "bulletin" && <BulletinTab items={bull} family={fam} username={username} onDelete={delBull} />}
            {tab === "chat" && <ChatTab msgs={chat} username={username} onSend={sendChat} />}
            {tab === "children" && <KidsTab family={fam} kids={kids} onRefresh={() => DB.getChildren(fam.id).then(setKids)} />}
          </>
        )}
      </main>
      {tab === "programs" && (
        <button onClick={() => setShowAdd(true)} style={{ position: "fixed", bottom: 26, right: 22, width: 54, height: 54, borderRadius: "50%", background: T.coral, border: "none", boxShadow: "0 6px 22px rgba(0,0,0,0.24)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 500 }}
          onMouseEnter={e => { e.currentTarget.style.transform = "scale(1.08)"; }}
          onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; }}>
          <Ico n="plus" size={24} color="white" />
        </button>
      )}
      {showAdd && <AddProg family={fam} username={username} onClose={() => setShowAdd(false)} onAdd={addProg} onAddMany={addManyProgs} />}
      {detail && <ProgDetail prog={detail} family={fam} username={username} kids={kids} childProgs={cps} onClose={() => setDetail(null)} onSave={saveProg} onAssign={assignKid} onEdit={p => { setDetail(null); setEditing(p); }} />}
      {editing && <EditProg prog={editing} onClose={() => setEditing(null)} onSave={editProgFn} />}
    </div>
  );
}
