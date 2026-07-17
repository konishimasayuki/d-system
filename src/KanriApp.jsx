import { useMemo, useState } from "react";
import {
  COLORS, GLOBAL_CSS, CUSTOMER_COLORS, VIEW_ROLES, DAY_DATES, DEFAULT_OFFICE,
  INITIAL_CASTS, INITIAL_RESERVATIONS, INITIAL_DRIVERS, INITIAL_CUSTOMERS,
  INITIAL_HOTELS, INITIAL_STAFF, INITIAL_COURSES, INITIAL_OPTIONS, INITIAL_EXPENSES,
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
    { key: "dashboard", label: "ダッシュボード" }, { key: "timetable", label: "タイムテーブル" },
    { key: "shift", label: "出勤管理" }, { key: "castlist", label: "キャスト一覧" },
    { key: "reservation", label: "予約管理" }, { key: "dispatch", label: "配車管理" },
  ] },
  { group: "顧客・媒体", tabs: [
    { key: "customer", label: "顧客・NGリスト" }, { key: "media", label: "媒体・HP更新" },
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



export default function KanriApp() {
  const [role, setRole] = useState("owner");
  const [tab, setTab] = useState("dashboard");
  const [casts, setCasts, castsSync] = usePersistedState("casts", INITIAL_CASTS);
  const [customers, setCustomers, customersSync] = usePersistedState("customers", INITIAL_CUSTOMERS);
  const [drivers, setDrivers, driversSync] = usePersistedState("drivers", INITIAL_DRIVERS);
  const [reservations, setReservations, reservationsSync] = usePersistedReservations(DAY_DATES, INITIAL_RESERVATIONS);
  const [hotels, setHotels, hotelsSync] = usePersistedState("hotels", INITIAL_HOTELS);
  const [office, setOffice, officeSync] = usePersistedState("office", DEFAULT_OFFICE);
  const [staff, setStaff, staffSync] = usePersistedState("staff", INITIAL_STAFF);
  const [courses, setCourses, coursesSync] = usePersistedState("courses", INITIAL_COURSES);
  const [options, setOptions, optionsSync] = usePersistedState("options", INITIAL_OPTIONS);
  const [expenses, setExpenses, expensesSync] = usePersistedState("expenses", INITIAL_EXPENSES);
  const syncErrors = [castsSync, customersSync, driversSync, reservationsSync, hotelsSync, officeSync, staffSync, coursesSync, optionsSync, expensesSync].map((s) => s.err).filter(Boolean);
  const syncMsg = syncErrors[0] || "";
  const [menuOpen, setMenuOpen] = useState(false);
  const [ctiCustomer, setCtiCustomer] = useState(null);
  const [openReservation, setOpenReservation] = useState(null);
  const [quoteCustomer, setQuoteCustomer] = useState(null);

  const allowed = VIEW_ROLES[role].tabs;
  const visibleGroups = TAB_GROUPS.map((g) => ({ ...g, tabs: g.tabs.filter((t) => allowed.includes(t.key)) })).filter((g) => g.tabs.length > 0);
  const currentLabel = ALL_TABS.find((t) => t.key === tab)?.label ?? "";

  const changeRole = (r) => {
    setRole(r);
    const firstTab = VIEW_ROLES[r].tabs[0];
    setTab(firstTab); setMenuOpen(false);
  };
  const simulateCall = () => setCtiCustomer(customers[Math.floor(Math.random() * customers.length)]);
  const startQuote = (cust) => { setCtiCustomer(null); setQuoteCustomer(cust); };

  return (
    <div style={{ minHeight: "100vh", background: COLORS.bg, color: COLORS.textMain, fontFamily: "'Noto Sans JP', sans-serif" }}>
      <style>{GLOBAL_CSS}</style>

      <div className="topbar">
        <HamburgerIcon onClick={() => setMenuOpen(true)} />
        <div style={{ fontFamily: "'Zen Old Mincho', serif", fontSize: 16, color: COLORS.accent }}>{currentLabel}</div>
        <button onClick={simulateCall} style={{ marginLeft: "auto", padding: "6px 12px", borderRadius: 8, border: `1px solid ${COLORS.accent}`, background: "#FFF", color: COLORS.accent, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>📞 着信</button>
      </div>

      <div style={{ display: "flex" }}>
        <div className={`overlay ${menuOpen ? "open" : ""}`} onClick={() => setMenuOpen(false)} />
        <div className={`sidebar ${menuOpen ? "open" : ""}`}>
          <div style={{ fontFamily: "'Zen Old Mincho', serif", fontSize: 18, color: COLORS.accent, marginBottom: 2 }}>業務管理システム</div>
          <div style={{ fontSize: 11, color: COLORS.textSub, marginBottom: 14 }}>DEMO ・ サンプルデータ表示中</div>

          <div style={{ marginBottom: 14 }}>
            <label style={{ display: "block", fontSize: 11, color: COLORS.textSub, fontWeight: 700, marginBottom: 5, letterSpacing: 1 }}>ログイン権限(切替)</label>
            <select value={role} onChange={(e) => changeRole(e.target.value)} style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: `1px solid ${COLORS.border}`, background: "#FFF", color: COLORS.textMain, fontSize: 13 }}>
              {Object.entries(VIEW_ROLES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </div>

          {allowed.includes("customer") || allowed.includes("dashboard") ? (
            <button onClick={simulateCall} style={{ width: "100%", padding: "10px 0", borderRadius: 8, border: "none", background: COLORS.accent, color: "#FFF", fontSize: 13, fontWeight: 700, cursor: "pointer", marginBottom: 16 }}>📞 着信テスト(CTI)</button>
          ) : null}

          {visibleGroups.map((g) => (
            <div key={g.group} style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 11, color: COLORS.textSub, fontWeight: 700, padding: "0 6px 6px", letterSpacing: 1 }}>{g.group}</div>
              {g.tabs.map((t) => (
                <div key={t.key} onClick={() => { setTab(t.key); setMenuOpen(false); }} style={{ padding: "9px 14px", borderRadius: 8, marginBottom: 3, cursor: "pointer", fontSize: 14, fontWeight: tab === t.key ? 700 : 400, color: tab === t.key ? "#FFFFFF" : COLORS.textMain, background: tab === t.key ? COLORS.accent : "transparent", transition: "background 0.15s" }}>{t.label}</div>
              ))}
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
          {tab === "customer" && <CustomerManagement customers={customers} setCustomers={setCustomers} onQuote={startQuote} />}
          {tab === "media" && <MediaTab casts={casts} setCasts={setCasts} />}
          {tab === "report" && <Report />}
          {tab === "accounting" && <AccountingTab casts={casts} drivers={drivers} expenses={expenses} setExpenses={setExpenses} />}
          {tab === "payout" && <Payout casts={casts} />}
          {tab === "driverpage" && <DriverPage reservations={reservations} casts={casts} drivers={drivers} />}
          {tab === "mypage" && <CastMyPage casts={casts} reservations={reservations} />}
          {tab === "std" && <StdManagement casts={casts} />}
          {tab === "settings" && <SettingsTab setCasts={setCasts} setDrivers={setDrivers} hotels={hotels} setHotels={setHotels} office={office} setOffice={setOffice} staff={staff} setStaff={setStaff} courses={courses} setCourses={setCourses} options={options} setOptions={setOptions} setReservations={setReservations} syncMsg={syncMsg} />}
        </div>
      </div>

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
