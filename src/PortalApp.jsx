import { useState, useRef, useEffect } from "react";

// ============================================================
// キャストポータル / ドライバーポータル
//  - URL末尾で出し分け(/cast, /driver)。判定不可時は選択画面
//  - ログイン必須(デモ: ID z / パスワード z)
//  - PCでもスマホ端末枠で表示
// ============================================================

// ---- テーマ ----
const THEMES = {
  cast: {
    name: "キャストポータル",
    accent: "#E0623A", accentDark: "#B84E2E", accentSoft: "#FBEDE7",
    grad: "linear-gradient(135deg, #E86F45, #C64E2A)",
  },
  driver: {
    name: "ドライバーポータル",
    accent: "#2F6DB5", accentDark: "#1F4E88", accentSoft: "#E7F0FA",
    grad: "linear-gradient(135deg, #3B7EC8, #1F4E88)",
  },
};
const INK = "#20262E", SUB = "#8A96A5", LINE = "#ECEFF3", BG = "#F4F6F9";

// ---- URL判定 ----
function resolveApp() {
  try {
    const seg = window.location.pathname.split("/").filter(Boolean).pop();
    if (seg === "cast" || seg === "driver") return seg;
    const h = window.location.hash.replace(/[#/]/g, "");
    if (h === "cast" || h === "driver") return h;
  } catch (e) {}
  return null;
}

// ============================================================
// ロゴ
// ============================================================
function CastLogo({ size = 44 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <defs>
        <linearGradient id="cg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#E86F45" /><stop offset="1" stopColor="#C64E2A" />
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="44" height="44" rx="13" fill="url(#cg)" />
      <circle cx="24" cy="19" r="6.4" fill="#fff" />
      <path d="M12.5 35c1.6-6.2 6.1-9.4 11.5-9.4S33.9 28.8 35.5 35c.3 1.1-.5 2-1.6 2H14.1c-1.1 0-1.9-.9-1.6-2Z" fill="#fff" />
      <path d="M35 11.5l1.1 2.6 2.6 1.1-2.6 1.1L35 19l-1.1-2.7-2.6-1.1 2.6-1.1L35 11.5Z" fill="#FFDCCB" />
    </svg>
  );
}
function DriverLogo({ size = 44 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <defs>
        <linearGradient id="dg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#3B7EC8" /><stop offset="1" stopColor="#1F4E88" />
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="44" height="44" rx="13" fill="url(#dg)" />
      <circle cx="24" cy="24" r="12.5" fill="none" stroke="#fff" strokeWidth="3" />
      <circle cx="24" cy="24" r="3.4" fill="#fff" />
      <path d="M24 13.5v7M17 30l4.2-3.6M31 30l-4.2-3.6" stroke="#fff" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}
const Logo = ({ app, size }) => (app === "cast" ? <CastLogo size={size} /> : <DriverLogo size={size} />);

// ============================================================
// アイコン
// ============================================================
function Icon({ name, size = 22, color = "currentColor" }) {
  const s = { width: size, height: size, fill: "none", stroke: color, strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round" };
  switch (name) {
    case "home": return <svg viewBox="0 0 24 24" {...s}><path d="M3 10.5 12 3l9 7.5" /><path d="M5 9.5V21h14V9.5" /></svg>;
    case "calendar": return <svg viewBox="0 0 24 24" {...s}><rect x="3" y="4.5" width="18" height="16" rx="2" /><path d="M3 9h18M8 2.5v4M16 2.5v4" /></svg>;
    case "chart": return <svg viewBox="0 0 24 24" {...s}><path d="M4 20V10M10 20V4M16 20v-7M22 20H2" /></svg>;
    case "doc": return <svg viewBox="0 0 24 24" {...s}><path d="M6 2h9l5 5v15H6z" /><path d="M15 2v5h5M9 13h7M9 17h7" /></svg>;
    case "car": return <svg viewBox="0 0 24 24" {...s}><path d="M3 13l2-5.5A2 2 0 0 1 6.9 6h10.2a2 2 0 0 1 1.9 1.5L21 13v6h-3v-2H6v2H3z" /><circle cx="7.5" cy="16.5" r="1.3" /><circle cx="16.5" cy="16.5" r="1.3" /></svg>;
    case "user": return <svg viewBox="0 0 24 24" {...s}><circle cx="12" cy="8" r="4" /><path d="M4 21c1.5-4.5 4.5-6.5 8-6.5s6.5 2 8 6.5" /></svg>;
    case "pin": return <svg viewBox="0 0 24 24" {...s}><path d="M12 22s7-6.5 7-12A7 7 0 0 0 5 10c0 5.5 7 12 7 12Z" /><circle cx="12" cy="10" r="2.5" /></svg>;
    case "bell": return <svg viewBox="0 0 24 24" {...s}><path d="M6 9a6 6 0 0 1 12 0c0 6 2 7 2 7H4s2-1 2-7Z" /><path d="M10 20a2 2 0 0 0 4 0" /></svg>;
    default: return null;
  }
}

// ============================================================
// モックデータ
// ============================================================
const CAST_ME = { sei: "白石", name: "みお", age: 24, itakuRate: 0.6, shift: "18:00〜26:00" };
const CAST_TODAY = [
  { id: "r1", time: "19:30", customer: "田中様", course: "90分", hotel: "天神プラザホテル", price: 21000, status: "受付済" },
  { id: "r2", time: "21:30", customer: "鈴木様", course: "60分", hotel: "中央グランドイン", price: 18000, status: "受付済" },
];
const CAST_WEEK = [
  { d: "7/17(木)", t: "18:00〜26:00" }, { d: "7/18(金)", t: "19:00〜27:00" },
  { d: "7/19(土)", t: "17:00〜25:00" }, { d: "7/20(日)", t: "休み" },
];
const CAST_PAYSLIP = [
  { date: "7/16", count: 3, sales: 63000, itaku: 37800 },
  { date: "7/15", count: 2, sales: 42000, itaku: 25200 },
  { date: "7/14", count: 3, sales: 60000, itaku: 36000 },
];

const DRIVER_ME = { name: "佃", car: "1号車", wage: 1300, shift: "17:00〜25:00" };
const DRIVER_JOBS = [
  { id: "j1", time: "19:30", kind: "送り", cast: "白石 みお", customer: "田中様", place: "天神プラザホテル", status: "待機" },
  { id: "j2", time: "20:30", kind: "迎え", cast: "白石 みお", customer: "田中様", place: "天神プラザホテル", status: "待機" },
  { id: "j3", time: "21:30", kind: "送り", cast: "藤原 ゆら", customer: "鈴木様", place: "中央グランドイン", status: "待機" },
];
const DRIVER_WEEK = [
  { d: "7/17(木)", t: "17:00〜25:00" }, { d: "7/18(金)", t: "17:00〜26:00" },
  { d: "7/19(土)", t: "16:00〜25:00" }, { d: "7/20(日)", t: "休み" },
];

// ============================================================
// 共通UI
// ============================================================
function Toast({ msg }) {
  if (!msg) return null;
  return (
    <div style={{ position: "absolute", left: 16, right: 16, bottom: 78, background: "rgba(32,38,46,0.94)", color: "#fff", padding: "12px 16px", borderRadius: 12, fontSize: 13, textAlign: "center", zIndex: 40, boxShadow: "0 8px 24px rgba(0,0,0,0.25)" }}>{msg}</div>
  );
}
function Eyebrow({ children }) {
  return <div style={{ fontSize: 11, letterSpacing: 1.5, color: SUB, fontWeight: 700, textTransform: "uppercase", margin: "18px 0 8px" }}>{children}</div>;
}
function Card({ children, style }) {
  return <div style={{ background: "#fff", border: `1px solid ${LINE}`, borderRadius: 16, padding: 16, ...style }}>{children}</div>;
}
function Btn({ children, onClick, theme, variant = "solid", disabled, style }) {
  const base = { padding: "11px 14px", borderRadius: 11, fontSize: 14, fontWeight: 700, cursor: disabled ? "default" : "pointer", border: "none", transition: "opacity .15s" };
  const v = variant === "solid"
    ? { background: disabled ? "#C7D0DB" : theme.accent, color: "#fff" }
    : variant === "soft"
    ? { background: theme.accentSoft, color: theme.accentDark }
    : { background: "#fff", color: INK, border: `1px solid ${LINE}` };
  return <button onClick={onClick} disabled={disabled} style={{ ...base, ...v, ...style }}>{children}</button>;
}

// ============================================================
// スマホ枠
// ============================================================
function MobileShell({ theme, app, children, nav, active, onNav, onLogout, toast }) {
  return (
    <div className="pa-page">
      <div className="pa-phone">
        {/* ヘッダー */}
        <div style={{ background: theme.grad, color: "#fff", padding: "14px 16px 16px", display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ background: "rgba(255,255,255,0.18)", borderRadius: 12, padding: 4, display: "flex" }}><Logo app={app} size={34} /></div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 800, letterSpacing: 0.3 }}>{theme.name}</div>
            <div style={{ fontSize: 11, opacity: 0.85 }}>{app === "cast" ? `${CAST_ME.sei} ${CAST_ME.name} さん` : `${DRIVER_ME.name}(${DRIVER_ME.car})`}</div>
          </div>
          <button onClick={onLogout} style={{ background: "rgba(255,255,255,0.16)", border: "none", color: "#fff", fontSize: 12, fontWeight: 700, padding: "7px 12px", borderRadius: 9, cursor: "pointer" }}>ログアウト</button>
        </div>
        {/* コンテンツ */}
        <div style={{ flex: 1, overflowY: "auto", background: BG, padding: "4px 16px 20px", position: "relative" }}>
          {children}
        </div>
        <Toast msg={toast} />
        {/* ボトムナビ */}
        <div style={{ display: "flex", borderTop: `1px solid ${LINE}`, background: "#fff" }}>
          {nav.map((n) => (
            <button key={n.key} onClick={() => onNav(n.key)} style={{ flex: 1, background: "none", border: "none", padding: "9px 0 12px", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 3, color: active === n.key ? theme.accent : "#9AA6B4" }}>
              <Icon name={n.icon} size={22} color={active === n.key ? theme.accent : "#9AA6B4"} />
              <span style={{ fontSize: 10.5, fontWeight: active === n.key ? 700 : 500 }}>{n.label}</span>
            </button>
          ))}
        </div>
      </div>
      <style>{`
        .pa-page{ min-height:100vh; background:#E3E7EC; display:flex; align-items:center; justify-content:center; padding:20px; font-family:'Hiragino Sans','Noto Sans JP',sans-serif; }
        .pa-phone{ width:390px; height:min(92vh,820px); background:#fff; border-radius:38px; overflow:hidden; display:flex; flex-direction:column; box-shadow:0 20px 60px rgba(20,30,45,0.28); border:1px solid #D7DCE3; }
        @media (max-width:480px){ .pa-page{ padding:0; } .pa-phone{ width:100%; height:100vh; border-radius:0; border:none; } }
      `}</style>
    </div>
  );
}

// ============================================================
// ログイン
// ============================================================
function Login({ theme, app, onLogin }) {
  const [id, setId] = useState("");
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");
  const submit = () => {
    if (id.trim() === "z" && pw.trim() === "z") { setErr(""); onLogin(); }
    else setErr("IDまたはパスワードが違います。");
  };
  const field = { width: "100%", padding: "13px 14px", borderRadius: 12, border: `1px solid ${LINE}`, fontSize: 15, boxSizing: "border-box", background: "#fff", color: INK };
  return (
    <div className="pa-page">
      <div className="pa-phone" style={{ justifyContent: "center", alignItems: "center", padding: 28 }}>
        <div style={{ width: "100%", maxWidth: 320 }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 26 }}>
            <Logo app={app} size={72} />
            <div style={{ fontSize: 20, fontWeight: 800, color: INK, marginTop: 14 }}>{theme.name}</div>
            <div style={{ fontSize: 12, color: SUB, marginTop: 4 }}>ログインしてください</div>
          </div>
          <div style={{ marginBottom: 12 }}>
            <input value={id} onChange={(e) => setId(e.target.value)} placeholder="ID" style={field} />
          </div>
          <div style={{ marginBottom: 8 }}>
            <input value={pw} onChange={(e) => setPw(e.target.value)} onKeyDown={(e) => e.key === "Enter" && submit()} type="password" placeholder="パスワード" style={field} />
          </div>
          {err && <div style={{ color: "#C0492B", fontSize: 12.5, marginBottom: 8 }}>{err}</div>}
          <Btn theme={theme} onClick={submit} style={{ width: "100%", padding: "13px", fontSize: 15, marginTop: 6 }}>ログイン</Btn>
          <div style={{ marginTop: 18, padding: 12, background: theme.accentSoft, borderRadius: 10, fontSize: 12, color: theme.accentDark, textAlign: "center" }}>
            デモ用ログイン　ID「z」／ パスワード「z」
          </div>
        </div>
      </div>
      <style>{`
        .pa-page{ min-height:100vh; background:#E3E7EC; display:flex; align-items:center; justify-content:center; padding:20px; font-family:'Hiragino Sans','Noto Sans JP',sans-serif; }
        .pa-phone{ width:390px; height:min(92vh,820px); background:#fff; border-radius:38px; overflow:hidden; display:flex; flex-direction:column; box-shadow:0 20px 60px rgba(20,30,45,0.28); border:1px solid #D7DCE3; }
        @media (max-width:480px){ .pa-page{ padding:0; } .pa-phone{ width:100%; height:100vh; border-radius:0; border:none; } }
      `}</style>
    </div>
  );
}

// ============================================================
// キャストポータル
// ============================================================
function CastApp({ theme, onLogout }) {
  const [tab, setTab] = useState("home");
  const [jobs, setJobs] = useState(CAST_TODAY);
  const [toast, setToast] = useState("");
  const [callAck, setCallAck] = useState(false);
  const nextRef = useRef(new Date(Date.now() + 8 * 60000)); // 8分後を次の予約に
  const [now, setNow] = useState(Date.now());
  const [shiftReq, setShiftReq] = useState([]);
  const [reqDate, setReqDate] = useState(""); const [reqTime, setReqTime] = useState("");

  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t); }, []);
  const showToast = (m) => { setToast(m); setTimeout(() => setToast(""), 2200); };

  const msLeft = nextRef.current - now;
  const minLeft = Math.floor(msLeft / 60000);
  const secLeft = Math.max(0, Math.floor((msLeft % 60000) / 1000));
  const showCall = msLeft > 0 && minLeft < 10 && !callAck;

  const setStatus = (id, status, msg) => { setJobs((p) => p.map((j) => j.id === id ? { ...j, status } : j)); showToast(msg); };
  const totalCount = CAST_PAYSLIP[0].count;
  const totalSales = CAST_TODAY.reduce((a, r) => a + r.price, 0);

  const nav = [
    { key: "home", label: "ホーム", icon: "home" },
    { key: "shift", label: "シフト", icon: "calendar" },
    { key: "sales", label: "売上", icon: "chart" },
    { key: "pay", label: "明細", icon: "doc" },
  ];

  return (
    <MobileShell theme={theme} app="cast" nav={nav} active={tab} onNav={setTab} onLogout={onLogout} toast={toast}>
      {tab === "home" && (
        <div>
          {showCall && (
            <div style={{ marginTop: 12, background: theme.grad, color: "#fff", borderRadius: 16, padding: 16, boxShadow: "0 8px 20px rgba(200,78,42,0.3)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 700 }}><Icon name="bell" size={18} color="#fff" /> まもなく予約(コール)</div>
              <div style={{ fontSize: 30, fontWeight: 800, margin: "6px 0", fontVariantNumeric: "tabular-nums" }}>{minLeft}:{String(secLeft).padStart(2, "0")}</div>
              <div style={{ fontSize: 12, opacity: 0.9 }}>次の予約まで。準備をお願いします。</div>
              <button onClick={() => setCallAck(true)} style={{ marginTop: 10, width: "100%", background: "rgba(255,255,255,0.2)", border: "none", color: "#fff", padding: "9px", borderRadius: 10, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>確認しました</button>
            </div>
          )}

          <Eyebrow>本日のシフト</Eyebrow>
          <Card style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 15, fontWeight: 700, color: INK }}>{CAST_ME.shift}</span>
            <span style={{ fontSize: 12, color: SUB }}>中央区エリア</span>
          </Card>

          <Eyebrow>本日の予約</Eyebrow>
          {jobs.map((r) => (
            <Card key={r.id} style={{ marginBottom: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: INK }}>{r.time} <span style={{ fontSize: 13, fontWeight: 600, color: SUB }}>／ {r.course}</span></div>
                  <div style={{ fontSize: 12.5, color: SUB, marginTop: 3 }}>{r.customer} ・ {r.hotel}</div>
                </div>
                <span style={{ fontSize: 11, fontWeight: 700, color: theme.accentDark, background: theme.accentSoft, padding: "4px 10px", borderRadius: 999 }}>{r.status}</span>
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                <Btn theme={theme} variant="soft" style={{ flex: 1 }} onClick={() => setStatus(r.id, "接客中", "到着を記録しました")}>到着</Btn>
                <Btn theme={theme} variant="soft" style={{ flex: 1 }} onClick={() => setStatus(r.id, "終了", "終了を記録しました")}>終了</Btn>
                <Btn theme={theme} variant="line" style={{ flex: 1 }} onClick={() => showToast("延長を申請しました")}>延長申請</Btn>
              </div>
            </Card>
          ))}
        </div>
      )}

      {tab === "shift" && (
        <div>
          <Eyebrow>今週のシフト</Eyebrow>
          {CAST_WEEK.map((s) => (
            <Card key={s.d} style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ fontSize: 14, color: INK, fontWeight: 600 }}>{s.d}</span>
              <span style={{ fontSize: 14, color: s.t === "休み" ? SUB : theme.accentDark, fontWeight: 700 }}>{s.t}</span>
            </Card>
          ))}
          <Eyebrow>シフト申請</Eyebrow>
          <Card>
            <div style={{ display: "flex", gap: 8 }}>
              <input value={reqDate} onChange={(e) => setReqDate(e.target.value)} placeholder="7/22(火)" style={{ flex: 1, padding: "10px 12px", borderRadius: 10, border: `1px solid ${LINE}`, fontSize: 14 }} />
              <input value={reqTime} onChange={(e) => setReqTime(e.target.value)} placeholder="19:00〜27:00" style={{ flex: 1, padding: "10px 12px", borderRadius: 10, border: `1px solid ${LINE}`, fontSize: 14 }} />
            </div>
            <Btn theme={theme} style={{ width: "100%", marginTop: 10 }} onClick={() => { if (!reqDate) return; setShiftReq((p) => [...p, { d: reqDate, t: reqTime || "-" }]); setReqDate(""); setReqTime(""); showToast("シフトを申請しました"); }}>この内容で申請</Btn>
            {shiftReq.length > 0 && <div style={{ marginTop: 12, fontSize: 12, color: SUB }}>申請済み：{shiftReq.map((s) => `${s.d} ${s.t}`).join("、")}</div>}
          </Card>
        </div>
      )}

      {tab === "sales" && (
        <div>
          <Eyebrow>今日の売上</Eyebrow>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <Card style={{ textAlign: "center" }}>
              <div style={{ fontSize: 12, color: SUB }}>本数</div>
              <div style={{ fontSize: 26, fontWeight: 800, color: INK }}>{jobs.length}<span style={{ fontSize: 13, color: SUB }}> 本</span></div>
            </Card>
            <Card style={{ textAlign: "center" }}>
              <div style={{ fontSize: 12, color: SUB }}>売上</div>
              <div style={{ fontSize: 26, fontWeight: 800, color: theme.accent }}>¥{totalSales.toLocaleString()}</div>
            </Card>
          </div>
          <Eyebrow>直近の実績</Eyebrow>
          {CAST_PAYSLIP.map((d) => (
            <Card key={d.date} style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ fontSize: 13, color: INK }}>{d.date}</span>
              <span style={{ fontSize: 13, color: SUB }}>{d.count}本 ・ ¥{d.sales.toLocaleString()}</span>
            </Card>
          ))}
        </div>
      )}

      {tab === "pay" && (
        <div>
          <Eyebrow>給与明細(委託費)</Eyebrow>
          <Card style={{ background: theme.grad, color: "#fff", border: "none", marginBottom: 12 }}>
            <div style={{ fontSize: 12, opacity: 0.9 }}>本日の見込み委託費(率{Math.round(CAST_ME.itakuRate * 100)}%)</div>
            <div style={{ fontSize: 30, fontWeight: 800, marginTop: 4 }}>¥{Math.round(totalSales * CAST_ME.itakuRate).toLocaleString()}</div>
          </Card>
          {CAST_PAYSLIP.map((d) => (
            <Card key={d.date} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: INK }}>{d.date}</div>
                <div style={{ fontSize: 11.5, color: SUB }}>{d.count}本 ・ 売上 ¥{d.sales.toLocaleString()}</div>
              </div>
              <div style={{ fontSize: 16, fontWeight: 800, color: theme.accent }}>¥{d.itaku.toLocaleString()}</div>
            </Card>
          ))}
          <div style={{ fontSize: 11, color: SUB, textAlign: "center", marginTop: 8 }}>清算方法：事務所渡し</div>
        </div>
      )}
    </MobileShell>
  );
}

// ============================================================
// ドライバーポータル
// ============================================================
function DriverApp({ theme, onLogout }) {
  const [tab, setTab] = useState("jobs");
  const [jobs, setJobs] = useState(DRIVER_JOBS);
  const [filter, setFilter] = useState("すべて");
  const [toast, setToast] = useState("");
  const [shiftReq, setShiftReq] = useState([]);
  const [reqDate, setReqDate] = useState(""); const [reqTime, setReqTime] = useState("");
  const showToast = (m) => { setToast(m); setTimeout(() => setToast(""), 2200); };

  const advance = (id) => setJobs((p) => p.map((j) => {
    if (j.id !== id) return j;
    const next = j.status === "待機" ? "出発" : j.status === "出発" ? "到着" : "完了";
    showToast(`${next}を記録しました`);
    return { ...j, status: next };
  }));
  const openMap = (place) => { try { window.open(`https://www.google.com/maps/search/${encodeURIComponent(place)}`, "_blank"); } catch (e) {} };

  const filters = ["すべて", "待機", "出発", "到着"];
  const shown = jobs.filter((j) => filter === "すべて" ? true : j.status === filter);
  const statusColor = (s) => s === "待機" ? "#8A96A5" : s === "出発" ? theme.accent : s === "到着" ? "#3E9C74" : "#B0B8C2";

  const nav = [
    { key: "jobs", label: "配車", icon: "car" },
    { key: "shift", label: "シフト", icon: "calendar" },
    { key: "me", label: "マイページ", icon: "user" },
  ];

  return (
    <MobileShell theme={theme} app="driver" nav={nav} active={tab} onNav={setTab} onLogout={onLogout} toast={toast}>
      {tab === "jobs" && (
        <div>
          <div style={{ display: "flex", gap: 7, marginTop: 12, marginBottom: 4, overflowX: "auto" }}>
            {filters.map((f) => (
              <button key={f} onClick={() => setFilter(f)} style={{ padding: "7px 14px", borderRadius: 999, fontSize: 12.5, fontWeight: 700, whiteSpace: "nowrap", cursor: "pointer", border: `1px solid ${filter === f ? theme.accent : LINE}`, background: filter === f ? theme.accent : "#fff", color: filter === f ? "#fff" : INK }}>{f}</button>
            ))}
          </div>
          {shown.map((j) => (
            <Card key={j.id} style={{ marginTop: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 18, fontWeight: 800, color: INK }}>{j.time}</span>
                    <span style={{ fontSize: 11, fontWeight: 800, color: "#fff", background: j.kind === "送り" ? theme.accent : "#3E9C74", padding: "2px 9px", borderRadius: 999 }}>{j.kind}</span>
                  </div>
                  <div style={{ fontSize: 13, color: INK, marginTop: 5, fontWeight: 600 }}>{j.cast}</div>
                  <div style={{ fontSize: 12, color: SUB, marginTop: 2 }}>{j.customer} ・ {j.place}</div>
                </div>
                <span style={{ fontSize: 11, fontWeight: 700, color: statusColor(j.status), background: `${statusColor(j.status)}18`, padding: "4px 10px", borderRadius: 999 }}>{j.status}</span>
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                <Btn theme={theme} variant="line" style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }} onClick={() => openMap(j.place)}><Icon name="pin" size={16} color={INK} /> ルート</Btn>
                {j.status === "待機" && <Btn theme={theme} style={{ flex: 1 }} onClick={() => advance(j.id)}>出発</Btn>}
                {j.status === "出発" && <Btn theme={theme} style={{ flex: 1 }} onClick={() => advance(j.id)}>到着</Btn>}
                {(j.status === "到着" || j.status === "完了") && <Btn theme={theme} variant="soft" style={{ flex: 1 }} disabled>{j.status === "完了" ? "完了" : "到着済"}</Btn>}
              </div>
            </Card>
          ))}
          {shown.length === 0 && <div style={{ textAlign: "center", color: SUB, fontSize: 13, marginTop: 40 }}>該当する配車はありません。</div>}
        </div>
      )}

      {tab === "shift" && (
        <div>
          <Eyebrow>今週のシフト</Eyebrow>
          {DRIVER_WEEK.map((s) => (
            <Card key={s.d} style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ fontSize: 14, color: INK, fontWeight: 600 }}>{s.d}</span>
              <span style={{ fontSize: 14, color: s.t === "休み" ? SUB : theme.accentDark, fontWeight: 700 }}>{s.t}</span>
            </Card>
          ))}
          <Eyebrow>シフト申請</Eyebrow>
          <Card>
            <div style={{ display: "flex", gap: 8 }}>
              <input value={reqDate} onChange={(e) => setReqDate(e.target.value)} placeholder="7/22(火)" style={{ flex: 1, padding: "10px 12px", borderRadius: 10, border: `1px solid ${LINE}`, fontSize: 14 }} />
              <input value={reqTime} onChange={(e) => setReqTime(e.target.value)} placeholder="17:00〜25:00" style={{ flex: 1, padding: "10px 12px", borderRadius: 10, border: `1px solid ${LINE}`, fontSize: 14 }} />
            </div>
            <Btn theme={theme} style={{ width: "100%", marginTop: 10 }} onClick={() => { if (!reqDate) return; setShiftReq((p) => [...p, { d: reqDate, t: reqTime || "-" }]); setReqDate(""); setReqTime(""); showToast("シフトを申請しました"); }}>この内容で申請</Btn>
            {shiftReq.length > 0 && <div style={{ marginTop: 12, fontSize: 12, color: SUB }}>申請済み：{shiftReq.map((s) => `${s.d} ${s.t}`).join("、")}</div>}
          </Card>
        </div>
      )}

      {tab === "me" && (
        <div>
          <Eyebrow>プロフィール</Eyebrow>
          <Card style={{ marginBottom: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}><span style={{ color: SUB, fontSize: 13 }}>氏名</span><span style={{ color: INK, fontSize: 14, fontWeight: 700 }}>{DRIVER_ME.name}</span></div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}><span style={{ color: SUB, fontSize: 13 }}>担当車両</span><span style={{ color: INK, fontSize: 14, fontWeight: 700 }}>{DRIVER_ME.car}</span></div>
            <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: SUB, fontSize: 13 }}>時給</span><span style={{ color: INK, fontSize: 14, fontWeight: 700 }}>¥{DRIVER_ME.wage.toLocaleString()}</span></div>
          </Card>
          <Eyebrow>本日の勤務</Eyebrow>
          <Card style={{ background: theme.grad, color: "#fff", border: "none" }}>
            <div style={{ fontSize: 12, opacity: 0.9 }}>本日のシフト</div>
            <div style={{ fontSize: 22, fontWeight: 800, marginTop: 2 }}>{DRIVER_ME.shift}</div>
          </Card>
        </div>
      )}
    </MobileShell>
  );
}

// ============================================================
// アプリ選択(URL判定できない時 = プレビュー用)
// ============================================================
function Picker({ onPick }) {
  const opt = (app, theme) => (
    <button onClick={() => onPick(app)} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, background: "#fff", border: `1px solid ${LINE}`, borderRadius: 20, padding: "26px 20px", cursor: "pointer", boxShadow: "0 6px 18px rgba(20,30,45,0.08)" }}>
      <Logo app={app} size={64} />
      <span style={{ fontSize: 15, fontWeight: 800, color: INK }}>{theme.name}</span>
      <span style={{ fontSize: 12, color: theme.accentDark, background: theme.accentSoft, padding: "5px 14px", borderRadius: 999, fontWeight: 700 }}>開く</span>
    </button>
  );
  return (
    <div style={{ minHeight: "100vh", background: "#E3E7EC", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 22, padding: 24, fontFamily: "'Hiragino Sans','Noto Sans JP',sans-serif" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 18, fontWeight: 800, color: INK }}>ポータルを選択</div>
        <div style={{ fontSize: 12, color: SUB, marginTop: 4 }}>本番はURL末尾(/cast ・ /driver)で自動的に開きます</div>
      </div>
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap", justifyContent: "center" }}>
        {opt("cast", THEMES.cast)}
        {opt("driver", THEMES.driver)}
      </div>
    </div>
  );
}

// ============================================================
// ルート
// ============================================================
export default function PortalApp() {
  const [app, setApp] = useState(resolveApp());
  const [authed, setAuthed] = useState(false);

  if (!app) return <Picker onPick={(a) => { try { window.location.hash = a; } catch (e) {} setApp(a); }} />;
  const theme = THEMES[app];
  if (!authed) return <Login theme={theme} app={app} onLogin={() => setAuthed(true)} />;
  return app === "cast"
    ? <CastApp theme={theme} onLogout={() => setAuthed(false)} />
    : <DriverApp theme={theme} onLogout={() => setAuthed(false)} />;
}
