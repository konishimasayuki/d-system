import { useState, useRef, useEffect } from "react";
import { loadGoogleMaps, HOTEL_COORDS, OFFICE_LATLNG } from "./mapsLoader.js";
import { isoDate, buildDispatchJobs, advanceJobStatus, castFullName, fmtHour, JOB_STATUS, coordForHotelName, staffThreadId, castThreadId, fetchThread, sendMessage, unreadCount, markThreadRead, fetchUketsukeSheet } from "./shared.jsx";
import { useDriverSchedule, getCell, weekDays, saveScheduleCell, HALF_HOURS } from "./tabs/StaffScheduleTab.jsx";
import { SHEETS, W, Th, computeShimeiCounts } from "./tabs/UketsukeTab.jsx";

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
    name: "スタッフポータル",
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
    case "chat": return <svg viewBox="0 0 24 24" {...s}><path d="M4 4h16v12H8l-4 4z" /></svg>;
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
        {/* ヘッダー(固定) */}
        <div style={{ background: theme.grad, color: "#fff", padding: "14px 16px 16px", display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
          <div style={{ background: "rgba(255,255,255,0.18)", borderRadius: 12, padding: 4, display: "flex" }}><Logo app={app} size={34} /></div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 800, letterSpacing: 0.3 }}>{theme.name}</div>
            <div style={{ fontSize: 11, opacity: 0.85 }}>{subtitle}</div>
          </div>
          <button onClick={onLogout} style={{ background: "rgba(255,255,255,0.16)", border: "none", color: "#fff", fontSize: 12, fontWeight: 700, padding: "7px 12px", borderRadius: 9, cursor: "pointer" }}>ログアウト</button>
        </div>
        {/* コンテンツ(ここだけスクロール) */}
        <div style={{ flex: 1, minHeight: 0, overflowY: "auto", overscrollBehavior: "contain", WebkitOverflowScrolling: "touch", background: BG, padding: "4px 16px 20px", position: "relative" }}>
          {children}
        </div>
        <Toast msg={toast} />
        {/* ボトムナビ(固定) */}
        <div style={{ display: "flex", borderTop: `1px solid ${LINE}`, background: "#fff", flexShrink: 0 }}>
          {nav.map((n) => (
            <button key={n.key} onClick={() => onNav(n.key)} style={{ flex: 1, background: "none", border: "none", padding: "9px 0 12px", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 3, color: active === n.key ? theme.accent : "#9AA6B4", position: "relative" }}>
              <div style={{ position: "relative" }}>
                <Icon name={n.icon} size={22} color={active === n.key ? theme.accent : "#9AA6B4"} />
                {n.badge > 0 && <span style={{ position: "absolute", top: -4, right: -8, fontSize: 9.5, fontWeight: 700, color: "#FFF", background: "#C0492B", borderRadius: 999, padding: "1px 5px", minWidth: 14, textAlign: "center", lineHeight: 1.3 }}>{n.badge}</span>}
              </div>
              <span style={{ fontSize: 10.5, fontWeight: active === n.key ? 700 : 500 }}>{n.label}</span>
            </button>
          ))}
        </div>
      </div>
      <style>{`
        html, body{ margin:0; padding:0; height:100%; overflow:hidden; overscroll-behavior:none; }
        ::placeholder{ color:#B7C0CC; opacity:1; }
        .pa-page{ height:100dvh; min-height:100dvh; max-height:100dvh; overflow:hidden; overscroll-behavior:none; background:#E3E7EC; display:flex; align-items:center; justify-content:center; padding:20px; font-family:'Hiragino Sans','Noto Sans JP',sans-serif; }
        .pa-phone{ width:390px; height:min(92dvh,820px); background:#fff; border-radius:38px; overflow:hidden; overscroll-behavior:contain; display:flex; flex-direction:column; box-shadow:0 20px 60px rgba(20,30,45,0.28); border:1px solid #D7DCE3; }
        @media (max-width:480px){ .pa-page{ padding:0; } .pa-phone{ width:100%; height:100%; border-radius:0; border:none; padding-top:env(safe-area-inset-top); padding-bottom:env(safe-area-inset-bottom); box-sizing:border-box; } }
      `}</style>
    </div>
  );
}

// ============================================================
// ログイン
// ============================================================
function Login({ theme, app, drivers, casts, onLogin }) {
  const [id, setId] = useState("");
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");
  const submit = () => {
    if (id.trim() === "z" && pw.trim() === "z") { setErr(""); onLogin(null); return; }
    if (app === "driver") {
      const match = (drivers || []).find((d) => d.loginId === id.trim() && d.password === pw.trim());
      if (match) { setErr(""); onLogin(match.id); return; }
    }
    if (app === "cast") {
      const match = (casts || []).find((c) => c.loginId === id.trim() && c.password === pw.trim());
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
            デモ用ログイン　ID「z」／ パスワード「z」(または設定で登録した本人のログインID/パスワード)
          </div>
        </div>
      </div>
      <style>{`
        html, body{ margin:0; padding:0; height:100%; overflow:hidden; overscroll-behavior:none; }
        ::placeholder{ color:#B7C0CC; opacity:1; }
        .pa-page{ height:100dvh; min-height:100dvh; max-height:100dvh; overflow:hidden; overscroll-behavior:none; background:#E3E7EC; display:flex; align-items:center; justify-content:center; padding:20px; font-family:'Hiragino Sans','Noto Sans JP',sans-serif; }
        .pa-phone{ width:390px; height:min(92dvh,820px); background:#fff; border-radius:38px; overflow:hidden; overscroll-behavior:contain; display:flex; flex-direction:column; box-shadow:0 20px 60px rgba(20,30,45,0.28); border:1px solid #D7DCE3; }
        @media (max-width:480px){ .pa-page{ padding:0; } .pa-phone{ width:100%; height:100%; border-radius:0; border:none; padding-top:env(safe-area-inset-top); padding-bottom:env(safe-area-inset-bottom); box-sizing:border-box; } }
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
        html, body{ margin:0; padding:0; height:100%; overflow:hidden; overscroll-behavior:none; }
        ::placeholder{ color:#B7C0CC; opacity:1; }
        .pa-page{ height:100dvh; min-height:100dvh; max-height:100dvh; overflow:hidden; overscroll-behavior:none; background:#E3E7EC; display:flex; align-items:center; justify-content:center; padding:20px; font-family:'Hiragino Sans','Noto Sans JP',sans-serif; }
        .pa-phone{ width:390px; height:min(92dvh,820px); background:#fff; border-radius:38px; overflow:hidden; overscroll-behavior:contain; display:flex; flex-direction:column; box-shadow:0 20px 60px rgba(20,30,45,0.28); border:1px solid #D7DCE3; }
        @media (max-width:480px){ .pa-page{ padding:0; } .pa-phone{ width:100%; height:100%; border-radius:0; border:none; padding-top:env(safe-area-inset-top); padding-bottom:env(safe-area-inset-bottom); box-sizing:border-box; } }
      `}</style>
    </div>
  );
}

// ============================================================
// キャストポータル
// ============================================================
// ============================================================
// 本部とのメッセージ(共通チャットUI・キャスト/ドライバー両方で使用)
// ============================================================
function fmtMsgTime(ts) {
  const d = new Date(ts);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  if (sameDay) return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

function ChatPanel({ theme, threadId, onUnreadChange }) {
  const [messages, setMessages] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [input, setInput] = useState("");
  const bottomRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const msgs = await fetchThread(threadId);
      if (cancelled) return;
      setMessages(msgs);
      setLoaded(true);
      if (unreadCount(msgs, "user") > 0) {
        const next = await markThreadRead(threadId, msgs, "user");
        if (!cancelled) { setMessages(next); onUnreadChange && onUnreadChange(0); }
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [threadId]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ block: "end" }); }, [messages]);

  const send = async () => {
    if (!input.trim()) return;
    const next = await sendMessage(threadId, messages, "user", input.trim());
    setMessages(next);
    setInput("");
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <Eyebrow>本部とのメッセージ</Eyebrow>
      <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 10, paddingBottom: 8 }}>
        {!loaded ? (
          <div style={{ textAlign: "center", color: SUB, fontSize: 12.5, marginTop: 20 }}>読み込み中…</div>
        ) : messages.length === 0 ? (
          <div style={{ textAlign: "center", color: SUB, fontSize: 12.5, marginTop: 20 }}>まだメッセージはありません</div>
        ) : messages.map((m) => (
          <div key={m.id} style={{ display: "flex", justifyContent: m.from === "user" ? "flex-end" : "flex-start" }}>
            <div style={{ maxWidth: "78%" }}>
              <div style={{ padding: "8px 12px", borderRadius: 14, background: m.from === "user" ? theme.accent : "#EDF0F4", color: m.from === "user" ? "#FFF" : INK, fontSize: 13.5, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{m.text}</div>
              <div style={{ fontSize: 10, color: SUB, marginTop: 3, textAlign: m.from === "user" ? "right" : "left" }}>{m.from === "office" ? "本部 ・ " : ""}{fmtMsgTime(m.ts)}</div>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <div style={{ display: "flex", gap: 8, paddingTop: 8, borderTop: `1px solid ${LINE}` }}>
        <textarea value={input} onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
          rows={1} placeholder="メッセージを入力"
          style={{ flex: 1, padding: "9px 12px", borderRadius: 10, border: `1px solid ${LINE}`, fontSize: 13.5, resize: "none", fontFamily: "inherit" }} />
        <button onClick={send} style={{ padding: "0 18px", borderRadius: 10, border: "none", background: theme.accent, color: "#FFF", fontWeight: 700, fontSize: 13.5, cursor: "pointer" }}>送信</button>
      </div>
    </div>
  );
}

// ============================================================
// 受付表(閲覧専用・当日のみ・スタッフポータル用)
//  編集は一切できない。人妻専科／博多ココを切り替えて見られる
// ============================================================
// 閲覧専用の値表示セル(入力欄なし・スプレッドと同じ見た目)
function ViewCell({ value, width, align = "center", color, bold, fontSize = 11.5, bg, mono }) {
  return (
    <div style={{
      width, minWidth: width, maxWidth: width, boxSizing: "border-box",
      padding: "3px 4px", borderRight: `1px solid ${LINE}`,
      background: bg || "transparent", color: color || INK,
      fontWeight: bold ? 700 : 400, fontSize, textAlign: align,
      fontFamily: mono ? "'JetBrains Mono', monospace" : "inherit",
      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
      display: "flex", alignItems: "center", justifyContent: align === "left" ? "flex-start" : "center",
      height: "100%",
    }}>{value}</div>
  );
}

function UketsukeViewer({ theme, myName }) {
  const [sheetKey, setSheetKey] = useState("hitozuma");
  const [sheet, setSheet] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const todayStr = isoDate(new Date());
  const ROW_H = 26;

  useEffect(() => {
    let cancelled = false;
    setLoaded(false);
    fetchUketsukeSheet(sheetKey, todayStr).then((s) => { if (!cancelled) { setSheet(s); setLoaded(true); } });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sheetKey]);

  const rowsAll = sheet?.rows || [];
  const shimeiCounts = computeShimeiCounts(rowsAll);
  // 表示は入力がある行のみ(未入力の空行は隠す。ただし番号は元の行番号を維持)
  const visibleIdx = rowsAll.map((r, i) => i).filter((i) => rowsAll[i].cast || rowsAll[i].name || rowsAll[i].hotel);

  return (
    <div>
      <Eyebrow>本日の受付表(閲覧専用)</Eyebrow>
      <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
        {SHEETS.map((s) => (
          <button key={s.key} onClick={() => setSheetKey(s.key)}
            style={{ flex: 1, padding: "8px 0", borderRadius: 8, border: `1.5px solid ${sheetKey === s.key ? theme.accent : LINE}`, background: sheetKey === s.key ? theme.accent : "#FFF", color: sheetKey === s.key ? "#FFF" : SUB, fontWeight: 700, fontSize: 12.5, cursor: "pointer" }}>
            {s.label}
          </button>
        ))}
      </div>

      {!loaded ? (
        <div style={{ textAlign: "center", color: SUB, fontSize: 12.5, padding: 24 }}>読み込み中…</div>
      ) : visibleIdx.length === 0 ? (
        <div style={{ textAlign: "center", color: SUB, fontSize: 12.5, padding: 24 }}>本日の受付データはありません</div>
      ) : (
        <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch", border: `1px solid ${LINE}`, borderRadius: 10 }}>
          <div style={{ minWidth: W.bikoL + W.taiki + W.no + W.time + W.cast + W.shimeiN + W.kaiin + W.name + W.kotsu + W.course + W.op * 2 + W.taishutsu + W.otoshi + W.joshi + W.biko + W.okuri + W.mukae + W.ryoshu + W.baitai + W.bikoR }}>
            {/* 見出し行 */}
            <div style={{ display: "flex", position: "sticky", top: 0, zIndex: 2 }}>
              <Th width={W.bikoL} />
              <Th width={W.taiki}>待機場</Th>
              <Th width={W.no}>番号</Th>
              <Th width={W.time}>時間</Th>
              <Th width={W.cast}>キャスト</Th>
              <Th width={W.shimeiN} />
              <Th width={W.kaiin}>指名</Th>
              <Th width={W.name}>連絡先</Th>
              <Th width={W.kotsu}>交通費</Th>
              <Th width={W.course}>コース</Th>
              <Th width={W.op * 2}>OP</Th>
              <Th width={W.taishutsu}>退出</Th>
              <Th width={W.otoshi}>落とし</Th>
              <Th width={W.joshi}>女子給</Th>
              <Th width={W.biko}>備考</Th>
              <Th width={W.okuri}>送り</Th>
              <Th width={W.mukae}>迎え</Th>
              <Th width={W.ryoshu}>領収書</Th>
              <Th width={W.baitai}>媒体</Th>
              <Th width={W.bikoR}>備考(NG等)</Th>
            </div>

            {/* 明細(2行1セット・入力があった行のみ表示) */}
            {visibleIdx.map((i) => {
              const r = rowsAll[i];
              const n = shimeiCounts[i];
              const isFirst = n === 1;
              const shimeiBg = n === 0 ? "#FFFFFF" : (isFirst ? "#FFFFFF" : "#A9D18E");
              const shimeiColor = n === 0 ? INK : (isFirst ? "#FF0000" : "#000000");
              return (
                <div key={i} style={{ display: "flex", borderBottom: `2px solid ${LINE}` }}>
                  {/* 備考(左)・上下2段 */}
                  <div style={{ width: W.bikoL, minWidth: W.bikoL, borderRight: `1px solid ${LINE}`, display: "flex", flexDirection: "column" }}>
                    <div style={{ height: ROW_H, borderBottom: `1px solid ${LINE}` }}><ViewCell value={r.bikoL} width={W.bikoL} align="left" fontSize={11} /></div>
                    <div style={{ height: ROW_H }}><ViewCell value={r.bikoL2} width={W.bikoL} align="left" fontSize={11} /></div>
                  </div>
                  {/* 待機場 */}
                  <div style={{ width: W.taiki, minWidth: W.taiki }}>
                    <ViewCell value={r.taiki} width={W.taiki} align="left" fontSize={10.5} bold />
                  </div>
                  {/* 番号 */}
                  <div style={{ width: W.no, minWidth: W.no, borderRight: `1px solid ${LINE}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: INK }}>
                    {i + 1}
                  </div>
                  {/* 時間(上下2段) */}
                  <div style={{ width: W.time, minWidth: W.time, display: "flex", flexDirection: "column" }}>
                    <div style={{ height: ROW_H, borderBottom: `1px solid ${LINE}` }}><ViewCell value={r.time} width={W.time} bold mono fontSize={12} /></div>
                    <div style={{ height: ROW_H }}><ViewCell value={r.depart} width={W.time} fontSize={10} /></div>
                  </div>
                  {/* キャスト */}
                  <div style={{ width: W.cast, minWidth: W.cast }}>
                    <ViewCell value={r.cast} width={W.cast} align="left" bold fontSize={10.5} />
                  </div>
                  {/* 指名数 */}
                  <div style={{ width: W.shimeiN, minWidth: W.shimeiN, borderRight: `1px solid ${LINE}`, display: "flex", flexDirection: "column" }}>
                    <div style={{ height: ROW_H, borderBottom: `1px solid ${LINE}`, background: shimeiBg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <span style={{ fontWeight: 700, fontSize: 13, color: shimeiColor }}>{n > 0 ? n : ""}</span>
                    </div>
                    <div style={{ height: ROW_H, background: "#FFFFFF" }} />
                  </div>
                  {/* 会員/指名種別(上下2段) */}
                  <div style={{ width: W.kaiin, minWidth: W.kaiin, display: "flex", flexDirection: "column" }}>
                    <div style={{ height: ROW_H, borderBottom: `1px solid ${LINE}` }}><ViewCell value={r.kaiin} width={W.kaiin} bold fontSize={10} /></div>
                    <div style={{ height: ROW_H }}><ViewCell value={r.shimeiType} width={W.kaiin} bold fontSize={10} /></div>
                  </div>
                  {/* 氏名+電話番号 / ホテル名(上下2段) */}
                  <div style={{ width: W.name, minWidth: W.name, display: "flex", flexDirection: "column" }}>
                    <div style={{ height: ROW_H, borderBottom: `1px solid ${LINE}`, display: "flex" }}>
                      <ViewCell value={r.name} width={100} bold fontSize={12} />
                      <ViewCell value={r.tel} width={W.name - 100} mono fontSize={11.5} />
                    </div>
                    <div style={{ height: ROW_H }}><ViewCell value={r.hotel} width={W.name} bold fontSize={11.5} /></div>
                  </div>
                  {/* 交通費 */}
                  <div style={{ width: W.kotsu, minWidth: W.kotsu }}><ViewCell value={r.kotsu} width={W.kotsu} mono /></div>
                  {/* コース */}
                  <div style={{ width: W.course, minWidth: W.course }}><ViewCell value={r.course} width={W.course} bold fontSize={12} /></div>
                  {/* OP(上下2段×2列) */}
                  <div style={{ width: W.op * 2, minWidth: W.op * 2, display: "flex", flexDirection: "column" }}>
                    <div style={{ height: ROW_H, borderBottom: `1px solid ${LINE}`, display: "flex" }}>
                      <ViewCell value={r.op1} width={W.op} fontSize={10.5} />
                      <ViewCell value={r.op2} width={W.op} fontSize={10.5} />
                    </div>
                    <div style={{ height: ROW_H, display: "flex" }}>
                      <ViewCell value={r.op3} width={W.op} fontSize={10.5} />
                      <ViewCell value={r.op4} width={W.op} fontSize={10.5} />
                    </div>
                  </div>
                  {/* 退出(緑) */}
                  <div style={{ width: W.taishutsu, minWidth: W.taishutsu }}><ViewCell value={r.taishutsu} width={W.taishutsu} bg="#FFFFFF" color={INK} bold mono fontSize={12} /></div>
                  {/* 落とし */}
                  <div style={{ width: W.otoshi, minWidth: W.otoshi }}><ViewCell value={r.otoshi} width={W.otoshi} mono bold fontSize={12} /></div>
                  {/* 女子給 */}
                  <div style={{ width: W.joshi, minWidth: W.joshi }}><ViewCell value={r.joshi} width={W.joshi} mono bold fontSize={12} /></div>
                  {/* 備考(上下2段) */}
                  <div style={{ width: W.biko, minWidth: W.biko, display: "flex", flexDirection: "column" }}>
                    <div style={{ height: ROW_H, borderBottom: `1px solid ${LINE}` }}><ViewCell value={r.biko || (isFirst ? "-500" : "")} width={W.biko} color="#C00000" bold mono fontSize={11} /></div>
                    <div style={{ height: ROW_H }}><ViewCell value={r.biko2} width={W.biko} color="#C00000" bold mono fontSize={11} /></div>
                  </div>
                  {/* 送り(自分が担当の場合は太字で強調) */}
                  <div style={{ width: W.okuri, minWidth: W.okuri }}><ViewCell value={r.okuri} width={W.okuri} fontSize={10.5} bold={!!myName && r.okuri === myName} color={!!myName && r.okuri === myName ? theme.accentDark : undefined} /></div>
                  {/* 迎え(自分が担当の場合は太字で強調) */}
                  <div style={{ width: W.mukae, minWidth: W.mukae }}><ViewCell value={r.mukae} width={W.mukae} fontSize={10.5} bold={!!myName && r.mukae === myName} color={!!myName && r.mukae === myName ? theme.accentDark : undefined} /></div>
                  {/* 領収書 */}
                  <div style={{ width: W.ryoshu, minWidth: W.ryoshu }}><ViewCell value={r.ryoshu} width={W.ryoshu} fontSize={10.5} /></div>
                  {/* 媒体 */}
                  <div style={{ width: W.baitai, minWidth: W.baitai }}><ViewCell value={r.baitai} width={W.baitai} fontSize={10.5} /></div>
                  {/* 備考(NG等・上下2段) */}
                  <div style={{ width: W.bikoR, minWidth: W.bikoR, display: "flex", flexDirection: "column" }}>
                    <div style={{ height: ROW_H, borderBottom: `1px solid ${LINE}` }}><ViewCell value={r.bikoR} width={W.bikoR} align="left" color="#C00000" fontSize={10.5} /></div>
                    <div style={{ height: ROW_H }}><ViewCell value={r.bikoR2} width={W.bikoR} align="left" color="#C00000" fontSize={10.5} /></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
      <div style={{ fontSize: 10.5, color: SUB, textAlign: "center", marginTop: 8 }}>※この画面では編集できません(内容は事務所にお問い合わせください)</div>
    </div>
  );
}

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

  const [msgUnread, setMsgUnread] = useState(0);
  const myThreadId = castThreadId(castId);
  useEffect(() => {
    let cancelled = false;
    const refresh = () => fetchThread(myThreadId).then((msgs) => { if (!cancelled) setMsgUnread(unreadCount(msgs, "user")); });
    refresh();
    const onVisible = () => { if (document.visibilityState === "visible") refresh(); };
    document.addEventListener("visibilitychange", onVisible);
    return () => { cancelled = true; document.removeEventListener("visibilitychange", onVisible); };
  }, [myThreadId]);

  const nav = [
    { key: "home", label: "ホーム", icon: "home" },
    { key: "shift", label: "シフト", icon: "calendar" },
    { key: "sales", label: "売上", icon: "chart" },
    { key: "pay", label: "明細", icon: "doc" },
    { key: "chat", label: "メッセージ", icon: "chat", badge: msgUnread },
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

      {tab === "chat" && (
        <div style={{ height: "calc(100% - 4px)", display: "flex", flexDirection: "column" }}>
          <ChatPanel theme={theme} threadId={myThreadId} onUnreadChange={setMsgUnread} />
        </div>
      )}
    </MobileShell>
  );
}

// ============================================================
// ドライバーポータル
// ============================================================
// 全員のスケジュール表からセルをタップした時の簡易編集モーダル
function ScheduleEditModal({ theme, driverName, dateStr, cell, saving, onSave, onClose }) {
  const isOff = cell.type === "off";
  const d = new Date(dateStr);
  const w = ["日", "月", "火", "水", "木", "金", "土"][d.getDay()];
  const [note, setNote] = useState(cell.note || "");
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(15,23,35,0.45)", zIndex: 80, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: "#FFF", borderRadius: 16, width: "100%", maxWidth: 340, padding: 20, boxShadow: "0 12px 40px rgba(0,0,0,0.25)" }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: INK, marginBottom: 2 }}>{driverName}</div>
        <div style={{ fontSize: 12.5, color: SUB, marginBottom: 16 }}>{d.getMonth() + 1}/{d.getDate()}({w})</div>
        <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
          <button onClick={() => onSave("type", "work")} style={{ flex: 1, padding: "10px 0", borderRadius: 8, border: `1.5px solid ${!isOff ? theme.accent : LINE}`, background: !isOff ? theme.accent : "#FFF", color: !isOff ? "#FFF" : SUB, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>出勤</button>
          <button onClick={() => onSave("type", "off")} style={{ flex: 1, padding: "10px 0", borderRadius: 8, border: `1.5px solid ${isOff ? "#98A2B0" : LINE}`, background: isOff ? "#98A2B0" : "#FFF", color: isOff ? "#FFF" : SUB, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>休み</button>
        </div>
        {!isOff && (
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 14 }}>
            <select value={cell.start} onChange={(e) => onSave("start", e.target.value)} style={{ flex: 1, padding: "8px 6px", borderRadius: 8, border: `1px solid ${LINE}`, fontSize: 13 }}>
              {HALF_HOURS.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
            <span style={{ fontSize: 13, color: SUB }}>〜</span>
            <select value={cell.end} onChange={(e) => onSave("end", e.target.value)} style={{ flex: 1, padding: "8px 6px", borderRadius: 8, border: `1px solid ${LINE}`, fontSize: 13 }}>
              <option value="">未定</option>
              {HALF_HOURS.filter((t) => t > cell.start).map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        )}
        <textarea value={note} onChange={(e) => setNote(e.target.value)} onBlur={() => onSave("note", note)} rows={3}
          placeholder="メモ(例：現場直行、他店舗ヘルプなど)"
          style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: `1px solid ${LINE}`, fontSize: 12.5, boxSizing: "border-box", resize: "vertical", fontFamily: "inherit", marginBottom: 10 }} />
        <div style={{ fontSize: 11, color: theme.accent, textAlign: "center", marginBottom: 10, minHeight: 14 }}>{saving ? "保存中…" : ""}</div>
        <button onClick={onClose} style={{ width: "100%", padding: "10px 0", borderRadius: 8, border: `1px solid ${LINE}`, background: "transparent", color: SUB, fontWeight: 700, fontSize: 14, cursor: "pointer" }}>閉じる</button>
      </div>
    </div>
  );
}

// 全員のスケジュール表の日付ヘッダー行(昼セクションの上=固定表示、夜セクションの上=見出しとして再掲)
function ScheduleDateHeader({ theme, weekOffset, label, sticky }) {
  return (
    <div style={{ display: "flex", borderBottom: `1px solid ${LINE}`, ...(sticky ? { position: "sticky", top: 0, zIndex: 3 } : {}) }}>
      <div style={{ width: 96, flexShrink: 0, padding: "8px 10px", fontSize: 10.5, fontWeight: 700, color: SUB, background: "#F4F6F9", position: "sticky", left: 0, zIndex: 4, boxSizing: "border-box" }}>{label}</div>
      {weekDays(weekOffset).map((d) => {
        const isToday = isoDate(d) === isoDate(new Date());
        const w = ["日", "月", "火", "水", "木", "金", "土"][d.getDay()];
        return (
          <div key={isoDate(d)} style={{ width: 62, flexShrink: 0, padding: "6px 2px", textAlign: "center", background: isToday ? theme.accent : "#F4F6F9", color: isToday ? "#FFF" : SUB, fontWeight: 700, borderLeft: `1px solid ${LINE}`, boxSizing: "border-box", lineHeight: 1.3 }}>
            <div style={{ fontSize: 10.5 }}>{d.getMonth() + 1}/{d.getDate()}</div>
            <div style={{ fontSize: 9, opacity: 0.85 }}>({w})</div>
          </div>
        );
      })}
    </div>
  );
}

function DriverApp({ theme, onLogout, casts, drivers, hotels, office, reservations, driverId, updateReservations }) {
  const [tab, setTab] = useState("jobs");
  const [filter, setFilter] = useState("すべて");
  const [toast, setToast] = useState("");
  const [routeJob, setRouteJob] = useState(null);
  const [weekOffset, setWeekOffset] = useState(0);
  const { schedule, setSchedule, loaded: scheduleLoaded } = useDriverSchedule();
  const [editCell, setEditCell] = useState(null); // { driverId, dateStr }
  const [scheduleSaving, setScheduleSaving] = useState(false);
  const showToast = (m) => { setToast(m); setTimeout(() => setToast(""), 2200); };

  const me = drivers.find((d) => d.id === driverId);
  const myCar = me?.car;
  const todayStr = isoDate(new Date());
  const allJobs = buildDispatchJobs(reservations, todayStr).filter((j) => j.driverCar === myCar);
  const nextJob = allJobs.find((j) => j.jobStatus !== "arrived");
  const restJobs = allJobs.filter((j) => j.id !== nextJob?.id);

  // 本日、少しでもシフト(出勤)に入っているか(受付表の閲覧可否に使用)
  const isWorkingToday = getCell(schedule, driverId, todayStr).type === "work";

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

  const [msgUnread, setMsgUnread] = useState(0);
  const myThreadId = staffThreadId(driverId);
  useEffect(() => {
    let cancelled = false;
    const refresh = () => fetchThread(myThreadId).then((msgs) => { if (!cancelled) setMsgUnread(unreadCount(msgs, "user")); });
    refresh();
    const onVisible = () => { if (document.visibilityState === "visible") refresh(); };
    document.addEventListener("visibilitychange", onVisible);
    return () => { cancelled = true; document.removeEventListener("visibilitychange", onVisible); };
  }, [myThreadId]);

  const nav = [
    { key: "jobs", label: "配車", icon: "car" },
    { key: "uketsuke", label: "受付表", icon: "doc" },
    { key: "shift", label: "スケジュール", icon: "calendar" },
    { key: "chat", label: "メッセージ", icon: "chat", badge: msgUnread },
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
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 12, marginBottom: 4 }}>
            <button onClick={() => setWeekOffset((w) => w - 1)} style={{ padding: "6px 12px", borderRadius: 8, border: `1px solid ${LINE}`, background: "#FFF", color: INK, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>‹</button>
            <div style={{ fontSize: 12.5, fontWeight: 700, color: INK }}>{weekOffset === 0 ? "今週" : weekOffset > 0 ? `${weekOffset}週間後` : `${-weekOffset}週間前`}</div>
            <button onClick={() => setWeekOffset((w) => w + 1)} style={{ padding: "6px 12px", borderRadius: 8, border: `1px solid ${LINE}`, background: "#FFF", color: INK, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>›</button>
          </div>

          {/* 全員のスケジュール */}
          <Eyebrow>全員のスケジュール</Eyebrow>
          {!scheduleLoaded ? (
            <div style={{ textAlign: "center", color: SUB, fontSize: 13, padding: 20 }}>読み込み中…</div>
          ) : (
            <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch", borderRadius: 12, border: `1px solid ${LINE}` }}>
              <div style={{ minWidth: 96 + 62 * 7 }}>
                {/* 日付ヘッダ(縦スクロールしても上部に固定・「ドライバー」列見出し付き) */}
                <ScheduleDateHeader theme={theme} weekOffset={weekOffset} label="ドライバー" sticky />
                {/* 昼スタッフ */}
                <div style={{ padding: "5px 10px", fontSize: 10.5, fontWeight: 700, color: "#B5720A", background: "#FFF6E9" }}>☀ 昼</div>
                {drivers.filter((d) => (d.shift || "day") === "day").map((d) => (
                  <div key={d.id} style={{ display: "flex", borderTop: `1px solid ${LINE}`, background: d.id === driverId ? theme.accentSoft : "#FFF" }}>
                    <div style={{ width: 96, flexShrink: 0, padding: "7px 10px", fontSize: 11.5, fontWeight: d.id === driverId ? 800 : 600, color: INK, position: "sticky", left: 0, background: d.id === driverId ? theme.accentSoft : "#FFF", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" , boxSizing: "border-box" }}>{d.name}</div>
                    {weekDays(weekOffset).map((day) => {
                      const dateStr = isoDate(day);
                      const cell = getCell(schedule, d.id, dateStr);
                      const isOff = cell.type === "off";
                      const hasNote = !!(cell.note && cell.note.trim());
                      return (
                        <button key={dateStr} onClick={() => setEditCell({ driverId: d.id, dateStr, driverName: d.name })}
                          style={{ width: 62, flexShrink: 0, padding: "4px 2px", textAlign: "center", borderLeft: `1px solid ${LINE}`, fontWeight: 700, color: isOff ? SUB : theme.accentDark, background: "none", border: "none", borderLeftWidth: 1, borderLeftStyle: "solid", borderLeftColor: LINE, cursor: "pointer", position: "relative", boxSizing: "border-box", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", lineHeight: 1.3 }}>
                          {isOff ? (
                            <span style={{ fontSize: 9.5 }}>休</span>
                          ) : (
                            <>
                              <span style={{ fontSize: 9.5 }}>{cell.start}</span>
                              <span style={{ fontSize: 8.5, opacity: 0.75 }}>〜{cell.end || "未定"}</span>
                            </>
                          )}
                          {hasNote && <span style={{ position: "absolute", top: 1, right: 3, fontSize: 7 }}>📝</span>}
                        </button>
                      );
                    })}
                  </div>
                ))}
                {/* 夜スタッフ(見出しの直前に日付を再掲) */}
                <ScheduleDateHeader theme={theme} weekOffset={weekOffset} label="ドライバー" />
                <div style={{ padding: "5px 10px", fontSize: 10.5, fontWeight: 700, color: "#3B54A8", background: "#EAF0FC", borderTop: `2px solid ${INK}` }}>🌙 夜</div>
                {drivers.filter((d) => (d.shift || "day") === "night").map((d) => (
                  <div key={d.id} style={{ display: "flex", borderTop: `1px solid ${LINE}`, background: d.id === driverId ? theme.accentSoft : "#FFF" }}>
                    <div style={{ width: 96, flexShrink: 0, padding: "7px 10px", fontSize: 11.5, fontWeight: d.id === driverId ? 800 : 600, color: INK, position: "sticky", left: 0, background: d.id === driverId ? theme.accentSoft : "#FFF", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" , boxSizing: "border-box" }}>{d.name}</div>
                    {weekDays(weekOffset).map((day) => {
                      const dateStr = isoDate(day);
                      const cell = getCell(schedule, d.id, dateStr);
                      const isOff = cell.type === "off";
                      const hasNote = !!(cell.note && cell.note.trim());
                      return (
                        <button key={dateStr} onClick={() => setEditCell({ driverId: d.id, dateStr, driverName: d.name })}
                          style={{ width: 62, flexShrink: 0, padding: "4px 2px", textAlign: "center", borderLeft: `1px solid ${LINE}`, fontWeight: 700, color: isOff ? SUB : theme.accentDark, background: "none", border: "none", borderLeftWidth: 1, borderLeftStyle: "solid", borderLeftColor: LINE, cursor: "pointer", position: "relative", boxSizing: "border-box", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", lineHeight: 1.3 }}>
                          {isOff ? (
                            <span style={{ fontSize: 9.5 }}>休</span>
                          ) : (
                            <>
                              <span style={{ fontSize: 9.5 }}>{cell.start}</span>
                              <span style={{ fontSize: 8.5, opacity: 0.75 }}>〜{cell.end || "未定"}</span>
                            </>
                          )}
                          {hasNote && <span style={{ position: "absolute", top: 1, right: 3, fontSize: 7 }}>📝</span>}
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          )}
          <div style={{ fontSize: 10.5, color: SUB, textAlign: "center", marginTop: 8 }}>※セルをタップすると誰でも編集できます(横にスクロールできます)</div>
        </div>
      )}

      {editCell && (
        <ScheduleEditModal
          theme={theme}
          driverName={editCell.driverName}
          dateStr={editCell.dateStr}
          cell={getCell(schedule, editCell.driverId, editCell.dateStr)}
          saving={scheduleSaving}
          onSave={(field, val) => {
            setScheduleSaving(true);
            saveScheduleCell(schedule, setSchedule, editCell.driverId, editCell.dateStr, field, val, () => setScheduleSaving(false));
          }}
          onClose={() => setEditCell(null)}
        />
      )}

      {tab === "uketsuke" && (
        !scheduleLoaded ? (
          <div style={{ textAlign: "center", color: SUB, fontSize: 13, padding: "60px 20px" }}>読み込み中…</div>
        ) : isWorkingToday ? (
          <UketsukeViewer theme={theme} myName={me?.name} />
        ) : (
          <div style={{ textAlign: "center", color: SUB, fontSize: 13, padding: "60px 20px" }}>
            本日出勤の方のみ閲覧できます。<br />シフトに入っている日にご確認ください。
          </div>
        )
      )}

      {tab === "chat" && (
        <div style={{ height: "calc(100% - 4px)", display: "flex", flexDirection: "column" }}>
          <ChatPanel theme={theme} threadId={myThreadId} onUnreadChange={setMsgUnread} />
        </div>
      )}

      {tab === "me" && me && (
        <div>
          <Eyebrow>プロフィール</Eyebrow>
          <Card style={{ marginBottom: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}><span style={{ color: SUB, fontSize: 13 }}>氏名</span><span style={{ color: INK, fontSize: 14, fontWeight: 700 }}>{me.name}</span></div>
            <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: SUB, fontSize: 13 }}>担当車両</span><span style={{ color: INK, fontSize: 14, fontWeight: 700 }}>{me.car}</span></div>
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
// ログイン状態をlocalStorageに保存し、ログアウトするまで保持する
function loadLoginState(app) {
  try {
    const raw = localStorage.getItem(`portal_login_${app}`);
    if (!raw) return { authed: false, driverId: null, castId: null };
    const parsed = JSON.parse(raw);
    return { authed: !!parsed.authed, driverId: parsed.driverId || null, castId: parsed.castId || null };
  } catch (e) { return { authed: false, driverId: null, castId: null }; }
}
function saveLoginState(app, state) {
  try { localStorage.setItem(`portal_login_${app}`, JSON.stringify(state)); } catch (e) {}
}
function clearLoginState(app) {
  try { localStorage.removeItem(`portal_login_${app}`); } catch (e) {}
}

// ルート
// ============================================================
export default function PortalApp() {
  const [app, setApp] = useState(resolveApp());
  const initialLogin = app ? loadLoginState(app) : { authed: false, driverId: null, castId: null };
  const [authed, setAuthed] = useState(initialLogin.authed);
  const [driverId, setDriverId] = useState(initialLogin.driverId);
  const [castId, setCastId] = useState(initialLogin.castId);
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
    return <Login theme={theme} app={app} drivers={data.drivers} casts={data.casts} onLogin={(id) => {
      setAuthed(true);
      if (app === "driver" && id) setDriverId(id);
      if (app === "cast" && id) setCastId(id);
      saveLoginState(app, { authed: true, driverId: app === "driver" ? id : null, castId: app === "cast" ? id : null });
    }} />;
  }

  if (app === "driver" && !driverId) {
    return (
      <IdentityPicker theme={theme} title="あなたを選択してください"
        options={data.drivers.map((d) => ({ value: d.id, label: `${d.car}・${d.name}` }))}
        onPick={(id) => { setDriverId(id); saveLoginState(app, { authed: true, driverId: id, castId: null }); }}
      />
    );
  }
  if (app === "cast" && !castId) {
    return (
      <IdentityPicker theme={theme} title="あなたの源氏名を選択してください"
        options={data.casts.map((c) => ({ value: c.id, label: castFullName(c) }))}
        onPick={(id) => { setCastId(id); saveLoginState(app, { authed: true, driverId: null, castId: id }); }}
      />
    );
  }

  const logout = () => { setAuthed(false); setDriverId(null); setCastId(null); clearLoginState(app); };

  return app === "cast"
    ? <CastApp theme={theme} onLogout={logout} casts={data.casts} drivers={data.drivers} reservations={data.reservations} castId={castId} updateReservations={updateReservations} />
    : <DriverApp theme={theme} onLogout={logout} casts={data.casts} drivers={data.drivers} hotels={data.hotels} office={data.office} reservations={data.reservations} driverId={driverId} updateReservations={updateReservations} />;
}
