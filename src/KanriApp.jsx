import { useEffect, useMemo, useState } from "react";
import {
  COLORS, GLOBAL_CSS, CUSTOMER_COLORS, VIEW_ROLES, INITIAL_VIEW_ROLES, TAB_DEFS, RESTRICTED_TAB_PASSWORD, DAY_DATES, DEFAULT_OFFICE,
  INITIAL_CASTS, INITIAL_RESERVATIONS, INITIAL_DRIVERS, INITIAL_CUSTOMERS,
  INITIAL_HOTELS, INITIAL_STAFF, INITIAL_COURSES, INITIAL_OPTIONS, INITIAL_TRANSPORT_FEES, INITIAL_EXPENSES,
  usePersistedState, usePersistedReservations, PrimaryButton,
} from "./shared.jsx";
import { NewReservationModal } from "./ReservationModal.jsx";
import { Dashboard } from "./tabs/DashboardTab.jsx";
import { Timetable } from "./tabs/TimetableTab.jsx";
import { ShiftManagement } from "./tabs/ShiftTab.jsx";
import { CastList } from "./tabs/CastListTab.jsx";
import { ReservationManagement } from "./tabs/ReservationTab.jsx";
import { DispatchMap } from "./tabs/DispatchTab.jsx";
import { CustomerManagement } from "./tabs/CustomerTab.jsx";
import { MediaTab } from "./tabs/MediaTab.jsx";
import { Report } from "./tabs/ReportTab.jsx";
import { AccountingTab } from "./tabs/AccountingTab.jsx";
import { Payout } from "./tabs/PayoutTab.jsx";
import { StdManagement } from "./tabs/StdTab.jsx";
import { DriverPage, CastMyPage } from "./tabs/FieldPages.jsx";
import { SettingsTab } from "./tabs/SettingsTab.jsx";
import { DriverScheduleTab } from "./tabs/StaffScheduleTab.jsx";
import { UketsukeTab } from "./tabs/UketsukeTab.jsx";
import { MessageTab, fetchOfficeTotalUnread } from "./tabs/MessageTab.jsx";

// ============================================================
function CtiPopup({ customer, onClose, onReserve }) {
  const cl = CUSTOMER_COLORS[customer.colorLevel];
  const last = customer.history[0];
  return (
    <div style={{ position: "fixed", right: 20, bottom: 20, width: 320, background: "#FFFFFF", borderRadius: 14, border: `2px solid ${cl.color}`, boxShadow: "0 10px 30px rgba(0,0,0,0.25)", zIndex: 60, overflow: "hidden" }}>
      <div style={{ background: cl.color, color: "#FFF", padding: "10px 14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 13, fontWeight: 700 }}>📞 着信中 — CTI</span>
        <button onClick={onClose} style={{ border: "none", background: "transparent", color: "#FFF", fontSize: 18, cursor: "pointer" }}>×</button>
      </div>
      <div style={{ padding: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: COLORS.textMain }}>{customer.name}</div>
          <span style={{ fontSize: 11, fontWeight: 700, color: cl.color, background: `${cl.color}1F`, padding: "2px 8px", borderRadius: 999 }}>{cl.label}</span>
        </div>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 14, color: COLORS.textMain, marginTop: 4 }}>{customer.phones[0]}</div>
        <div style={{ fontSize: 12, color: COLORS.textSub, marginTop: 8 }}>来店 {customer.visits}回 ・ 最終 {customer.lastVisit}</div>
        {last && <div style={{ fontSize: 12, color: COLORS.textMain, marginTop: 4 }}>前回: {last.cast} / {last.course} / {last.hotel}</div>}
        {customer.note && <div style={{ fontSize: 12, color: cl.color, marginTop: 8, fontWeight: 600 }}>⚠ {customer.note}</div>}
        <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
          <PrimaryButton onClick={() => onReserve(customer)} style={{ flex: 1, padding: "8px 0", fontSize: 13 }}>履歴引用で予約</PrimaryButton>
          <button onClick={onClose} style={{ flex: 1, padding: "8px 0", borderRadius: 8, border: `1px solid ${COLORS.border}`, background: "#FFF", color: COLORS.textSub, fontSize: 13, cursor: "pointer" }}>閉じる</button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// ダッシュボード

// ============================================================
const TAB_GROUPS = [
  { group: "業務", tabs: [
    { key: "uketsuke", label: "受付表" }, { key: "castlist", label: "キャスト一覧" },
    { key: "driverschedule", label: "スタッフスケジュール" }, { key: "messages", label: "メッセージ" },
    { key: "dashboard", label: "ダッシュボード" }, { key: "timetable", label: "タイムテーブル" },
    { key: "shift", label: "出勤管理" },
    { key: "reservation", label: "予約管理" }, { key: "dispatch", label: "配車管理" },
  ] },
  { group: "顧客・媒体", tabs: [
    { key: "customer", label: "顧客名簿" }, { key: "media", label: "媒体・HP更新" },
  ] },
  { group: "経営", tabs: [
    { key: "report", label: "集計" }, { key: "accounting", label: "会計" }, { key: "payout", label: "委託費" },
  ] },
  { group: "現場", tabs: [
    { key: "driverpage", label: "ドライバーページ" }, { key: "mypage", label: "キャストマイページ" },
  ] },
  { group: "管理", tabs: [
    { key: "std", label: "STD検査" }, { key: "settings", label: "設定" },
  ] },
];
const ALL_TABS = TAB_GROUPS.flatMap((g) => g.tabs);

function HamburgerIcon({ onClick }) {
  return (
    <button onClick={onClick} aria-label="メニューを開く" style={{ width: 36, height: 36, borderRadius: 8, border: `1px solid ${COLORS.border}`, background: "#FFFFFF", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", gap: 4, cursor: "pointer", flexShrink: 0 }}>
      <span style={{ width: 16, height: 2, background: COLORS.textMain, borderRadius: 1 }} />
      <span style={{ width: 16, height: 2, background: COLORS.textMain, borderRadius: 1 }} />
      <span style={{ width: 16, height: 2, background: COLORS.textMain, borderRadius: 1 }} />
    </button>
  );
}



// 本部システムのログイン状態をlocalStorageに保存し、ログアウトするまで保持する
function loadKanriLogin() {
  try {
    const raw = localStorage.getItem("kanri_login");
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && parsed.staffId ? parsed : null;
  } catch (e) { return null; }
}
function saveKanriLogin(staffId) {
  try { localStorage.setItem("kanri_login", JSON.stringify({ staffId })); } catch (e) {}
}
function clearKanriLogin() {
  try { localStorage.removeItem("kanri_login"); } catch (e) {}
}

// ログイン画面
function KanriLoginScreen({ staff, onLogin }) {
  const [id, setId] = useState("");
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");
  const submit = () => {
    const match = staff.find((s) => s.loginId === id.trim() && s.password === pw.trim());
    if (!match) { setErr("IDまたはパスワードが違います。"); return; }
    setErr("");
    onLogin(match.id);
  };
  return (
    <div style={{ minHeight: "100vh", background: COLORS.bg, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Noto Sans JP', sans-serif" }}>
      <div style={{ width: "100%", maxWidth: 360, padding: 32, background: "#FFF", borderRadius: 16, boxShadow: "0 12px 40px rgba(20,30,45,0.12)" }}>
        <div style={{ fontFamily: "'Zen Old Mincho', serif", fontSize: 22, color: COLORS.accent, marginBottom: 4, textAlign: "center" }}>業務管理システム</div>
        <div style={{ fontSize: 12, color: COLORS.textSub, marginBottom: 24, textAlign: "center" }}>ログインしてください</div>
        <div style={{ marginBottom: 12 }}>
          <input value={id} onChange={(e) => setId(e.target.value)} placeholder="ログインID" style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: `1px solid ${COLORS.border}`, fontSize: 14, boxSizing: "border-box" }} />
        </div>
        <div style={{ marginBottom: 10 }}>
          <input value={pw} onChange={(e) => setPw(e.target.value)} onKeyDown={(e) => e.key === "Enter" && submit()} type="password" placeholder="パスワード" style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: `1px solid ${COLORS.border}`, fontSize: 14, boxSizing: "border-box" }} />
        </div>
        {err && <div style={{ color: "#C0492B", fontSize: 12.5, marginBottom: 10 }}>{err}</div>}
        <button onClick={submit} style={{ width: "100%", padding: "13px 0", borderRadius: 10, border: "none", background: COLORS.accent, color: "#FFF", fontWeight: 700, fontSize: 15, cursor: "pointer" }}>ログイン</button>
      </div>
    </div>
  );
}

// 閲覧制限タブのロック解除モーダル(共通パスワード)
function RestrictedTabModal({ onUnlock, onClose }) {
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");
  const submit = () => {
    if (pw.trim() === RESTRICTED_TAB_PASSWORD) { onUnlock(); return; }
    setErr("パスワードが違います。");
  };
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(15,23,35,0.45)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: "#FFF", borderRadius: 16, width: "100%", maxWidth: 320, padding: 24, boxShadow: "0 12px 40px rgba(0,0,0,0.25)" }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: COLORS.textMain, marginBottom: 4 }}>閲覧制限がかかっています</div>
        <div style={{ fontSize: 12, color: COLORS.textSub, marginBottom: 16 }}>パスワードを入力してください</div>
        <input value={pw} onChange={(e) => setPw(e.target.value)} onKeyDown={(e) => e.key === "Enter" && submit()} type="password" autoFocus
          style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: `1px solid ${COLORS.border}`, fontSize: 14, boxSizing: "border-box", marginBottom: 8 }} />
        {err && <div style={{ color: "#C0492B", fontSize: 12, marginBottom: 8 }}>{err}</div>}
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={onClose} style={{ flex: 1, padding: "10px 0", borderRadius: 8, border: `1px solid ${COLORS.border}`, background: "transparent", color: COLORS.textSub, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>キャンセル</button>
          <button onClick={submit} style={{ flex: 1, padding: "10px 0", borderRadius: 8, border: "none", background: COLORS.accent, color: "#FFF", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>解除</button>
        </div>
      </div>
    </div>
  );
}

export default function KanriApp() {
  const [staffId, setStaffId] = useState(() => loadKanriLogin()?.staffId || null);
  const [tab, setTab] = useState("uketsuke");
  const [casts, setCasts, castsSync] = usePersistedState("casts", INITIAL_CASTS);
  const [customers, setCustomers, customersSync] = usePersistedState("customers", INITIAL_CUSTOMERS);
  const [drivers, setDrivers, driversSync] = usePersistedState("drivers", INITIAL_DRIVERS);
  const [reservations, setReservations, reservationsSync] = usePersistedReservations(DAY_DATES, INITIAL_RESERVATIONS);
  const [hotels, setHotels, hotelsSync] = usePersistedState("hotels", INITIAL_HOTELS);
  const [office, setOffice, officeSync] = usePersistedState("office", DEFAULT_OFFICE);
  const [staff, setStaff, staffSync] = usePersistedState("staff", INITIAL_STAFF);
  const [viewRoles, setViewRoles, viewRolesSync] = usePersistedState("viewroles", INITIAL_VIEW_ROLES);
  const [courses, setCourses, coursesSync] = usePersistedState("courses", INITIAL_COURSES);
  const [options, setOptions, optionsSync] = usePersistedState("options", INITIAL_OPTIONS);
  const [transportFees, setTransportFees, transportFeesSync] = usePersistedState("transportfees", INITIAL_TRANSPORT_FEES);
  const [expenses, setExpenses, expensesSync] = usePersistedState("expenses", INITIAL_EXPENSES);
  const syncErrors = [castsSync, customersSync, driversSync, reservationsSync, hotelsSync, officeSync, staffSync, viewRolesSync, coursesSync, optionsSync, transportFeesSync, expensesSync].map((s) => s.err).filter(Boolean);
  const syncMsg = syncErrors[0] || "";
  const [menuOpen, setMenuOpen] = useState(false);
  const [ctiCustomer, setCtiCustomer] = useState(null);
  const [openReservation, setOpenReservation] = useState(null);
  const [quoteCustomer, setQuoteCustomer] = useState(null);
  const [officeUnread, setOfficeUnread] = useState(0);

  // メッセージ未読件数の取得(定期ポーリングはしない：初回・タブ切替・画面復帰時のみ)
  useEffect(() => {
    let cancelled = false;
    fetchOfficeTotalUnread(drivers, casts).then((n) => { if (!cancelled) setOfficeUnread(n); });
    const onVisible = () => { if (document.visibilityState === "visible") fetchOfficeTotalUnread(drivers, casts).then((n) => { if (!cancelled) setOfficeUnread(n); }); };
    document.addEventListener("visibilitychange", onVisible);
    return () => { cancelled = true; document.removeEventListener("visibilitychange", onVisible); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drivers.length, casts.length]);

  // メッセージタブ以外から「メッセージ」タブに切り替えた時にも再取得(既読処理直後の最新化のため)
  useEffect(() => {
    if (tab !== "messages") return;
    fetchOfficeTotalUnread(drivers, casts).then(setOfficeUnread);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  const me = staff.find((s) => s.id === staffId);
  const myViewRole = me?.viewRole || "operator";
  const allowed = (viewRoles[myViewRole] || viewRoles.operator).tabs;
  const visibleGroups = TAB_GROUPS.map((g) => ({ ...g, tabs: g.tabs.filter((t) => allowed.includes(t.key)) })).filter((g) => g.tabs.length > 0);
  const currentLabel = ALL_TABS.find((t) => t.key === tab)?.label ?? "";

  const [restrictedTarget, setRestrictedTarget] = useState(null); // ロック解除待ちのタブキー
  const [unlockedTabs, setUnlockedTabs] = useState(() => new Set()); // このセッションで解除済みのタブ

  const tabDef = (key) => TAB_DEFS.find((t) => t.key === key);
  const requestTab = (key) => {
    const def = tabDef(key);
    if (def?.restricted && !unlockedTabs.has(key)) { setRestrictedTarget(key); return; }
    setTab(key); setMenuOpen(false);
  };
  const unlockAndOpen = () => {
    if (!restrictedTarget) return;
    setUnlockedTabs((prev) => new Set([...prev, restrictedTarget]));
    setTab(restrictedTarget); setMenuOpen(false); setRestrictedTarget(null);
  };

  const logout = () => { setStaffId(null); clearKanriLogin(); setUnlockedTabs(new Set()); };
  const simulateCall = () => setCtiCustomer(customers[Math.floor(Math.random() * customers.length)]);
  const startQuote = (cust) => { setCtiCustomer(null); setQuoteCustomer(cust); };

  if (!staffId || !me) {
    return <KanriLoginScreen staff={staff} onLogin={(id) => {
      setStaffId(id); saveKanriLogin(id);
      const matched = staff.find((s) => s.id === id);
      const roleTabs = (viewRoles[matched?.viewRole] || viewRoles.operator).tabs;
      if (!roleTabs.includes("uketsuke")) setTab(roleTabs[0] || "uketsuke");
    }} />;
  }

  return (
    <div style={{ minHeight: "100vh", background: COLORS.bg, color: COLORS.textMain, fontFamily: "'Noto Sans JP', sans-serif" }}>
      <style>{GLOBAL_CSS}</style>

      <div className="topbar">
        <HamburgerIcon onClick={() => setMenuOpen(true)} />
        <div style={{ fontFamily: "'Zen Old Mincho', serif", fontSize: 16, color: COLORS.accent }}>{currentLabel}</div>
      </div>

      <div style={{ display: "flex" }}>
        <div className={`overlay ${menuOpen ? "open" : ""}`} onClick={() => setMenuOpen(false)} />
        <div className={`sidebar ${menuOpen ? "open" : ""}`}>
          <div style={{ fontFamily: "'Zen Old Mincho', serif", fontSize: 18, color: COLORS.accent, marginBottom: 2 }}>業務管理システム</div>
          <div style={{ fontSize: 11, color: COLORS.textSub, marginBottom: 14 }}>{me.name}({INITIAL_VIEW_ROLES[myViewRole]?.label || myViewRole})</div>

          <button onClick={logout} style={{ width: "100%", padding: "8px 0", borderRadius: 8, border: `1px solid ${COLORS.border}`, background: "transparent", color: COLORS.textSub, fontSize: 12.5, fontWeight: 700, cursor: "pointer", marginBottom: 14 }}>ログアウト</button>

          {visibleGroups.map((g) => (
            <div key={g.group} style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 11, color: COLORS.textSub, fontWeight: 700, padding: "0 6px 6px", letterSpacing: 1 }}>{g.group}</div>
              {g.tabs.map((t) => {
                const locked = tabDef(t.key)?.restricted && !unlockedTabs.has(t.key);
                return (
                  <div key={t.key} onClick={() => requestTab(t.key)} style={{ padding: "9px 14px", borderRadius: 8, marginBottom: 3, cursor: "pointer", fontSize: 14, fontWeight: tab === t.key ? 700 : 400, color: tab === t.key ? "#FFFFFF" : COLORS.textMain, background: tab === t.key ? COLORS.accent : "transparent", transition: "background 0.15s", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span>{locked ? "🔒 " : ""}{t.label}</span>
                    {t.key === "messages" && officeUnread > 0 && <span style={{ fontSize: 10, fontWeight: 700, color: "#FFF", background: COLORS.red, borderRadius: 999, padding: "1px 7px", minWidth: 16, textAlign: "center" }}>{officeUnread}</span>}
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        <div className="main-content" style={{ flex: 1, padding: "28px 32px", minWidth: 0 }}>
          {tab === "dashboard" && <Dashboard casts={casts} reservations={reservations} />}
          {tab === "timetable" && <Timetable reservations={reservations} casts={casts} setCasts={setCasts} drivers={drivers} courses={courses} options={options} onOpenReservation={setOpenReservation} />}
          {tab === "shift" && <ShiftManagement casts={casts} setCasts={setCasts} />}
          {tab === "castlist" && <CastList casts={casts} setCasts={setCasts} />}
          {tab === "reservation" && <ReservationManagement reservations={reservations} setReservations={setReservations} casts={casts} drivers={drivers} courses={courses} options={options} hotels={hotels} />}
          {tab === "dispatch" && <DispatchMap drivers={drivers} reservations={reservations} setReservations={setReservations} casts={casts} hotels={hotels} office={office} />}
          {tab === "messages" && <MessageTab drivers={drivers} casts={casts} />}
          {tab === "customer" && <CustomerManagement customers={customers} setCustomers={setCustomers} onQuote={startQuote} />}
          {tab === "media" && <MediaTab casts={casts} setCasts={setCasts} />}
          {tab === "report" && <Report />}
          {tab === "accounting" && <AccountingTab casts={casts} drivers={drivers} expenses={expenses} setExpenses={setExpenses} />}
          {tab === "payout" && <Payout casts={casts} />}
          {tab === "driverpage" && <DriverPage reservations={reservations} casts={casts} drivers={drivers} />}
          {tab === "mypage" && <CastMyPage casts={casts} reservations={reservations} />}
          {tab === "std" && <StdManagement casts={casts} />}
          {tab === "uketsuke" && <UketsukeTab casts={casts} courses={courses} options={options} drivers={drivers} transportFees={transportFees} />}
          {tab === "driverschedule" && <DriverScheduleTab drivers={drivers} />}
          {tab === "settings" && <SettingsTab setCasts={setCasts} drivers={drivers} setDrivers={setDrivers} hotels={hotels} setHotels={setHotels} office={office} setOffice={setOffice} staff={staff} setStaff={setStaff} courses={courses} setCourses={setCourses} options={options} setOptions={setOptions} transportFees={transportFees} setTransportFees={setTransportFees} setReservations={setReservations} syncMsg={syncMsg} viewRoles={viewRoles} setViewRoles={setViewRoles} isOwner={myViewRole === "owner"} myStaffId={staffId} />}
        </div>
      </div>

      {restrictedTarget && (
        <RestrictedTabModal onUnlock={unlockAndOpen} onClose={() => setRestrictedTarget(null)} />
      )}

      {ctiCustomer && <CtiPopup customer={ctiCustomer} onClose={() => setCtiCustomer(null)} onReserve={startQuote} />}
      {quoteCustomer && <NewReservationModal prefillCustomer={quoteCustomer} casts={casts} drivers={drivers} reservations={reservations} courses={courses} options={options} hotels={hotels} onClose={() => setQuoteCustomer(null)} onCreate={(r) => { setReservations((prev) => [...prev, r]); setTab("reservation"); }} />}
      {openReservation && <NewReservationModal editReservation={openReservation} casts={casts} drivers={drivers} reservations={reservations} courses={courses} options={options} hotels={hotels}
        onClose={() => setOpenReservation(null)}
        onCreate={(u) => setReservations((prev) => prev.map((x) => x.id === u.id ? u : x))}
        onCancelReservation={(u) => setReservations((prev) => prev.map((x) => x.id === u.id ? u : x))}
      />}
    </div>
  );
}
