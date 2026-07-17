import { useState, useRef, useEffect } from "react";
import { loadGoogleMaps, HOTEL_COORDS, OFFICE_LATLNG } from "./mapsLoader.js";
import { isoDate, buildDispatchJobs, advanceJobStatus, castFullName, fmtHour, JOB_STATUS, coordForHotelName } from "./shared.jsx";

// ============================================================
// サーバー(Upstash経由 /api/state)との簡易読み書き
// ============================================================
async function apiGet(key) {
  try { const r = await fetch(`/api/state?key=${key}`); const d = await r.json(); return d.value ?? null; } catch (e) { return null; }
}
async function apiSet(key, value) {
  try { await fetch(`/api/state?key=${key}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ value }) }); } catch (e) {}
}

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
// モックデータ(週間シフトの参考表示のみ。当日の予約・配車は実データを使用)
// ============================================================
const CAST_WEEK = [
  { d: "7/17(木)", t: "18:00〜26:00" }, { d: "7/18(金)", t: "19:00〜27:00" },
  { d: "7/19(土)", t: "17:00〜25:00" }, { d: "7/20(日)", t: "休み" },
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
function MobileShell({ theme, app, subtitle, children, nav, active, onNav, onLogout, toast }) {
  return (
    <div className="pa-page">
      <div className="pa-phone">
        {/* ヘッダー */}
        <div style={{ background: theme.grad, color: "#fff", padding: "14px 16px 16px", display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ background: "rgba(255,255,255,0.18)", borderRadius: 12, padding: 4, display: "flex" }}><Logo app={app} size={34} /></div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 800, letterSpacing: 0.3 }}>{theme.name}</div>
            <div style={{ fontSize: 11, opacity: 0.85 }}>{subtitle}</div>
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
function Login({ theme, app, drivers, onLogin }) {
  const [id, setId] = useState("");
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");
  const submit = () => {
    if (id.trim() === "z" && pw.trim() === "z") { setErr(""); onLogin(null); return; }
    if (app === "driver") {
      const match = (drivers || []).find((d) => d.loginId === id.trim() && d.password === pw.trim());
      if (match) { setErr(""); onLogin(match.id); return; }
    }
    setErr("IDまたはパスワードが違います。");
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
            デモ用ログイン　ID「z」／ パスワード「z」{app === "driver" ? "（または設定で登録した本人のログインID/パスワード）" : ""}
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
// 識別ピッカー(z/zログイン時、または該当ドライバーが判別できない時に本人を選ぶ)
// ============================================================
function IdentityPicker({ theme, title, options, onPick }) {
  const [sel, setSel] = useState(options[0]?.value || "");
  return (
    <div className="pa-page">
      <div className="pa-phone" style={{ justifyContent: "center", alignItems: "center", padding: 28 }}>
        <div style={{ width: "100%", maxWidth: 320 }}>
          <div style={{ fontSize: 17, fontWeight: 800, color: INK, marginBottom: 6, textAlign: "center" }}>{title}</div>
          <div style={{ fontSize: 12, color: SUB, marginBottom: 20, textAlign: "center" }}>本番では個人ごとのログインに置き換わります(現在は選択式の簡易確認です)</div>
          {options.length === 0 ? (
            <div style={{ fontSize: 13, color: SUB, textAlign: "center" }}>データを読み込み中です…</div>
          ) : (
            <>
              <select value={sel} onChange={(e) => setSel(e.target.value)} style={{ width: "100%", padding: "13px 14px", borderRadius: 12, border: `1px solid ${LINE}`, fontSize: 15, marginBottom: 14, background: "#fff", color: INK }}>
                {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              <Btn theme={theme} onClick={() => onPick(sel)} style={{ width: "100%", padding: "13px", fontSize: 15 }}>この内容で進む</Btn>
            </>
          )}
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
function CastApp({ theme, onLogout, casts, drivers, reservations, castId, updateReservations }) {
  const [tab, setTab] = useState("home");
  const [toast, setToast] = useState("");
  const showToast = (m) => { setToast(m); setTimeout(() => setToast(""), 2200); };

  const me = casts.find((c) => c.id === castId);
  const myReservations = reservations.filter((r) => r.castId === castId && r.status !== "キャンセル").sort((a, b) => a.start - b.start);
  const totalSales = myReservations.reduce((a, r) => a + r.price, 0);

  const driverInfo = (car) => drivers.find((d) => d.car === car);

  // 送り/迎えの「今の状況」を出す(開始前は送り、開始後は迎え)
  const legInfo = (r) => {
    const nowH = new Date().getHours() + new Date().getMinutes() / 60;
    const useKind = nowH < r.start ? "send" : "pick";
    const car = useKind === "send" ? r.sendDriver : r.pickDriver;
    const st = useKind === "send" ? (r.sendStatus || "unassigned") : (r.pickStatus || "unassigned");
    const d = driverInfo(car);
    return { kind: useKind, driver: d, status: JOB_STATUS[st] || JOB_STATUS.unassigned };
  };

  const markStatus = (r, status, msg) => { updateReservations((prev) => prev.map((x) => x.id === r.id ? { ...x, status } : x)); showToast(msg); };

  const nav = [
    { key: "home", label: "ホーム", icon: "home" },
    { key: "shift", label: "シフト", icon: "calendar" },
    { key: "sales", label: "売上", icon: "chart" },
    { key: "pay", label: "明細", icon: "doc" },
  ];

  return (
    <MobileShell theme={theme} app="cast" subtitle={me ? `${castFullName(me)} さん` : ""} nav={nav} active={tab} onNav={setTab} onLogout={onLogout} toast={toast}>
      {tab === "home" && (
        <div>
          <Eyebrow>本日のシフト</Eyebrow>
          <Card style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 15, fontWeight: 700, color: INK }}>{me && me.shiftStart !== "-" ? `${me.shiftStart}〜${me.shiftEnd}` : "本日は休み"}</span>
            <span style={{ fontSize: 12, color: SUB }}>{me?.hotel ? `${me.hotel} 対応中` : ""}</span>
          </Card>

          <Eyebrow>本日の予約</Eyebrow>
          {myReservations.length === 0 && <div style={{ fontSize: 13, color: SUB, marginTop: 8 }}>本日の予約はありません。</div>}
          {myReservations.map((r) => {
            const leg = legInfo(r);
            return (
              <Card key={r.id} style={{ marginBottom: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: INK }}>{fmtHour(r.start)} <span style={{ fontSize: 13, fontWeight: 600, color: SUB }}>／ {r.course}</span></div>
                    <div style={{ fontSize: 12.5, color: SUB, marginTop: 3 }}>{r.customer} ・ {r.hotel}{r.room ? ` ${r.room}` : ""}</div>
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 700, color: theme.accentDark, background: theme.accentSoft, padding: "4px 10px", borderRadius: 999 }}>{r.status}</span>
                </div>

                {/* お迎え状況 */}
                <div style={{ marginTop: 10, padding: "8px 10px", background: "#F4F6F9", borderRadius: 10, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 12, color: SUB }}>{leg.kind === "send" ? "お迎え(送り)" : "お迎え(帰り)"}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: INK }}>
                    {leg.driver ? `${leg.driver.car}・${leg.driver.name}` : "未定"}
                    <span style={{ marginLeft: 6, fontWeight: 700, color: leg.status.color }}>{leg.status.label}</span>
                  </span>
                </div>

                <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                  <Btn theme={theme} variant="soft" style={{ flex: 1 }} onClick={() => markStatus(r, "接客中", "到着を記録しました")}>到着</Btn>
                  <Btn theme={theme} variant="soft" style={{ flex: 1 }} onClick={() => markStatus(r, "終了", "終了を記録しました")}>終了</Btn>
                  <Btn theme={theme} variant="line" style={{ flex: 1 }} onClick={() => showToast("延長を申請しました(デモ)")}>延長申請</Btn>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {tab === "shift" && (
        <div>
          <Eyebrow>今週のシフト(参考表示)</Eyebrow>
          {CAST_WEEK.map((s) => (
            <Card key={s.d} style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ fontSize: 14, color: INK, fontWeight: 600 }}>{s.d}</span>
              <span style={{ fontSize: 14, color: s.t === "休み" ? SUB : theme.accentDark, fontWeight: 700 }}>{s.t}</span>
            </Card>
          ))}
        </div>
      )}

      {tab === "sales" && (
        <div>
          <Eyebrow>今日の売上</Eyebrow>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <Card style={{ textAlign: "center" }}>
              <div style={{ fontSize: 12, color: SUB }}>本数</div>
              <div style={{ fontSize: 26, fontWeight: 800, color: INK }}>{myReservations.length}<span style={{ fontSize: 13, color: SUB }}> 本</span></div>
            </Card>
            <Card style={{ textAlign: "center" }}>
              <div style={{ fontSize: 12, color: SUB }}>売上</div>
              <div style={{ fontSize: 26, fontWeight: 800, color: theme.accent }}>¥{totalSales.toLocaleString()}</div>
            </Card>
          </div>
        </div>
      )}

      {tab === "pay" && (
        <div>
          <Eyebrow>給与明細(委託費・本日分)</Eyebrow>
          <Card style={{ background: theme.grad, color: "#fff", border: "none", marginBottom: 12 }}>
            <div style={{ fontSize: 12, opacity: 0.9 }}>本日の見込み委託費(率{me ? Math.round(me.itakuRate * 100) : "-"}%)</div>
            <div style={{ fontSize: 30, fontWeight: 800, marginTop: 4 }}>¥{me ? Math.round(totalSales * me.itakuRate).toLocaleString() : "-"}</div>
          </Card>
          <div style={{ fontSize: 11, color: SUB, textAlign: "center", marginTop: 8 }}>清算方法：事務所渡し</div>
        </div>
      )}
    </MobileShell>
  );
}

// ============================================================
// ドライバーポータル
// ============================================================
function DriverApp({ theme, onLogout, casts, drivers, hotels, office, reservations, driverId, updateReservations }) {
  const [tab, setTab] = useState("jobs");
  const [filter, setFilter] = useState("すべて");
  const [toast, setToast] = useState("");
  const [routeJob, setRouteJob] = useState(null);
  const showToast = (m) => { setToast(m); setTimeout(() => setToast(""), 2200); };

  const me = drivers.find((d) => d.id === driverId);
  const myCar = me?.car;
  const todayStr = isoDate(new Date());
  const allJobs = buildDispatchJobs(reservations, todayStr).filter((j) => j.driverCar === myCar);
  const nextJob = allJobs.find((j) => j.jobStatus !== "arrived");
  const restJobs = allJobs.filter((j) => j.id !== nextJob?.id);

  const advance = (job) => {
    const next = job.jobStatus === "assigned" ? "enroute" : "arrived";
    updateReservations(advanceJobStatus(job.reservationId, job.kind, next));
    showToast(next === "enroute" ? "出発を記録しました" : "到着を記録しました");
  };
  const openRoute = (job) => setRouteJob(job);
  const castName = (id) => { const c = casts.find((x) => x.id === id); return c ? castFullName(c) : "-"; };

  const filters = ["すべて", "assigned", "enroute", "arrived"];
  const filterLabel = (f) => f === "すべて" ? "すべて" : JOB_STATUS[f].label;
  const shown = filter === "すべて" ? allJobs : allJobs.filter((j) => j.jobStatus === filter);

  const nav = [
    { key: "jobs", label: "配車", icon: "car" },
    { key: "shift", label: "シフト", icon: "calendar" },
    { key: "me", label: "マイページ", icon: "user" },
  ];

  const JobCard = ({ j, highlight }) => (
    <Card style={{ marginTop: 10, border: highlight ? `2px solid ${theme.accent}` : undefined }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 18, fontWeight: 800, color: INK }}>{fmtHour(j.time)}</span>
            <span style={{ fontSize: 11, fontWeight: 800, color: "#fff", background: j.kind === "send" ? theme.accent : "#3E9C74", padding: "2px 9px", borderRadius: 999 }}>{j.kind === "send" ? "送り" : "迎え"}</span>
          </div>
          <div style={{ fontSize: 13, color: INK, marginTop: 5, fontWeight: 600 }}>{castName(j.castId)}</div>
          <div style={{ fontSize: 12, color: SUB, marginTop: 2 }}>{j.customer} ・ {j.hotel}{j.room ? ` ${j.room}` : ""}</div>
        </div>
        <span style={{ fontSize: 11, fontWeight: 700, color: JOB_STATUS[j.jobStatus].color, background: `${JOB_STATUS[j.jobStatus].color}18`, padding: "4px 10px", borderRadius: 999 }}>{JOB_STATUS[j.jobStatus].label}</span>
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
        <Btn theme={theme} variant="line" style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }} onClick={() => openRoute(j)}><Icon name="pin" size={16} color={INK} /> ルート</Btn>
        {j.jobStatus === "assigned" && <Btn theme={theme} style={{ flex: 1 }} onClick={() => advance(j)}>出発</Btn>}
        {j.jobStatus === "enroute" && <Btn theme={theme} style={{ flex: 1 }} onClick={() => advance(j)}>到着</Btn>}
        {j.jobStatus === "arrived" && <Btn theme={theme} variant="soft" style={{ flex: 1 }} disabled>到着済</Btn>}
      </div>
    </Card>
  );

  return (
    <MobileShell theme={theme} app="driver" subtitle={me ? `${me.name}(${me.car})` : ""} nav={nav} active={tab} onNav={setTab} onLogout={onLogout} toast={toast}>
      {tab === "jobs" && (
        <div>
          {nextJob && (
            <div style={{ marginTop: 12 }}>
              <Eyebrow>次に向かう場所</Eyebrow>
              <JobCard j={nextJob} highlight />
            </div>
          )}
          <Eyebrow>本日の配車一覧</Eyebrow>
          <div style={{ display: "flex", gap: 7, marginBottom: 4, overflowX: "auto" }}>
            {filters.map((f) => (
              <button key={f} onClick={() => setFilter(f)} style={{ padding: "7px 14px", borderRadius: 999, fontSize: 12.5, fontWeight: 700, whiteSpace: "nowrap", cursor: "pointer", border: `1px solid ${filter === f ? theme.accent : LINE}`, background: filter === f ? theme.accent : "#fff", color: filter === f ? "#fff" : INK }}>{filterLabel(f)}</button>
            ))}
          </div>
          {shown.filter((j) => j.id !== nextJob?.id).map((j) => <JobCard key={j.id} j={j} />)}
          {shown.length === 0 && <div style={{ textAlign: "center", color: SUB, fontSize: 13, marginTop: 40 }}>該当する配車はありません。</div>}
        </div>
      )}

      {tab === "shift" && (
        <div>
          <Eyebrow>今週のシフト(参考表示)</Eyebrow>
          {DRIVER_WEEK.map((s) => (
            <Card key={s.d} style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ fontSize: 14, color: INK, fontWeight: 600 }}>{s.d}</span>
              <span style={{ fontSize: 14, color: s.t === "休み" ? SUB : theme.accentDark, fontWeight: 700 }}>{s.t}</span>
            </Card>
          ))}
        </div>
      )}

      {tab === "me" && me && (
        <div>
          <Eyebrow>プロフィール</Eyebrow>
          <Card style={{ marginBottom: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}><span style={{ color: SUB, fontSize: 13 }}>氏名</span><span style={{ color: INK, fontSize: 14, fontWeight: 700 }}>{me.name}</span></div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}><span style={{ color: SUB, fontSize: 13 }}>担当車両</span><span style={{ color: INK, fontSize: 14, fontWeight: 700 }}>{me.car}</span></div>
            <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: SUB, fontSize: 13 }}>時給</span><span style={{ color: INK, fontSize: 14, fontWeight: 700 }}>¥{me.wage.toLocaleString()}</span></div>
          </Card>
        </div>
      )}

      {routeJob && (
        <RouteMap
          dest={coordForHotelName(routeJob.hotel, hotels, office, HOTEL_COORDS) || OFFICE_LATLNG}
          destName={`${routeJob.hotel}（${routeJob.kind === "send" ? "送り" : "迎え"}）`}
          theme={theme}
          onClose={() => setRouteJob(null)}
        />
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
// ルート表示(現在地→目的地)オーバーレイ
// ============================================================
function RouteMap({ dest, destName, theme, onClose }) {
  const ref = useRef(null);
  const [note, setNote] = useState("現在地を取得しています…");

  useEffect(() => {
    let cancelled = false;
    loadGoogleMaps().then((maps) => {
      if (cancelled || !ref.current) return;
      const map = new maps.Map(ref.current, {
        center: dest, zoom: 13, mapTypeControl: false, streetViewControl: false, fullscreenControl: false,
      });
      const renderer = new maps.DirectionsRenderer({ map });
      const service = new maps.DirectionsService();
      const drawFrom = (origin, originNote) => {
        service.route({ origin, destination: dest, travelMode: maps.TravelMode.DRIVING }, (res, status) => {
          if (cancelled) return;
          if (status === "OK") {
            renderer.setDirections(res);
            const leg = res.routes[0]?.legs[0];
            setNote(`${originNote}　距離 ${leg?.distance?.text ?? "-"} ／ 所要 ${leg?.duration?.text ?? "-"}`);
          } else {
            new maps.Marker({ position: dest, map });
            setNote("ルートを取得できませんでした。目的地のみ表示しています。");
          }
        });
      };
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (p) => drawFrom({ lat: p.coords.latitude, lng: p.coords.longitude }, "現在地から"),
          () => drawFrom(OFFICE_LATLNG, "営業所から（位置情報が使えません）"),
          { enableHighAccuracy: true, timeout: 8000 }
        );
      } else {
        drawFrom(OFFICE_LATLNG, "営業所から（位置情報が使えません）");
      }
    }).catch((e) => {
      setNote(e.message === "no-key" ? "地図APIキーが未設定です。" : "地図の読み込みに失敗しました。");
    });
    return () => { cancelled = true; };
  }, []);

  return (
    <div style={{ position: "absolute", inset: 0, background: "#fff", zIndex: 50, display: "flex", flexDirection: "column" }}>
      <div style={{ background: theme.grad, color: "#fff", padding: "12px 14px", display: "flex", alignItems: "center", gap: 10 }}>
        <button onClick={onClose} style={{ background: "rgba(255,255,255,0.18)", border: "none", color: "#fff", fontSize: 13, fontWeight: 700, padding: "6px 12px", borderRadius: 9, cursor: "pointer" }}>← 戻る</button>
        <div style={{ fontSize: 14, fontWeight: 800 }}>{destName}</div>
      </div>
      <div ref={ref} style={{ flex: 1, minHeight: 0 }} />
      <div style={{ padding: "10px 14px", fontSize: 12, color: SUB, borderTop: `1px solid ${LINE}`, background: "#fff" }}>{note}</div>
    </div>
  );
}

// ============================================================
// ルート
// ============================================================
export default function PortalApp() {
  const [app, setApp] = useState(resolveApp());
  const [authed, setAuthed] = useState(false);
  const [driverId, setDriverId] = useState(null);
  const [castId, setCastId] = useState(null);
  const [data, setData] = useState({ casts: [], drivers: [], hotels: [], office: null, reservations: [], loaded: false });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const today = isoDate(new Date());
      const [casts, drivers, hotels, office, reservations] = await Promise.all([
        apiGet("casts"), apiGet("drivers"), apiGet("hotels"), apiGet("office"), apiGet(`reservations:${today}`),
      ]);
      if (cancelled) return;
      setData({
        casts: casts || [], drivers: drivers || [], hotels: hotels || [], office: office || null,
        reservations: reservations || [], loaded: true,
      });
    })();
    return () => { cancelled = true; };
  }, []);

  const updateReservations = (updater) => {
    setData((prev) => {
      const next = typeof updater === "function" ? updater(prev.reservations) : updater;
      apiSet(`reservations:${isoDate(new Date())}`, next);
      return { ...prev, reservations: next };
    });
  };

  if (!app) return <Picker onPick={(a) => { try { window.location.hash = a; } catch (e) {} setApp(a); }} />;
  const theme = THEMES[app];

  if (!authed) {
    return <Login theme={theme} app={app} drivers={data.drivers} onLogin={(id) => { setAuthed(true); if (app === "driver" && id) setDriverId(id); }} />;
  }

  if (app === "driver" && !driverId) {
    return (
      <IdentityPicker theme={theme} title="あなたを選択してください"
        options={data.drivers.map((d) => ({ value: d.id, label: `${d.car}・${d.name}` }))}
        onPick={setDriverId}
      />
    );
  }
  if (app === "cast" && !castId) {
    return (
      <IdentityPicker theme={theme} title="あなたの源氏名を選択してください"
        options={data.casts.map((c) => ({ value: c.id, label: castFullName(c) }))}
        onPick={setCastId}
      />
    );
  }

  const logout = () => { setAuthed(false); setDriverId(null); setCastId(null); };

  return app === "cast"
    ? <CastApp theme={theme} onLogout={logout} casts={data.casts} drivers={data.drivers} reservations={data.reservations} castId={castId} updateReservations={updateReservations} />
    : <DriverApp theme={theme} onLogout={logout} casts={data.casts} drivers={data.drivers} hotels={data.hotels} office={data.office} reservations={data.reservations} driverId={driverId} updateReservations={updateReservations} />;
}
