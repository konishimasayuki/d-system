import { useState } from "react";
import { AreaHotel, COLORS, Card, PrimaryButton, SectionTitle, Yen, castFullName, fmtHour } from "../shared.jsx";
import { NewReservationModal, WorkMailModal } from "../ReservationModal.jsx";

// ============================================================
export function ReservationManagement({ reservations, setReservations, casts, drivers, courses, options, hotels }) {
  const [mailFor, setMailFor] = useState(null);
  const [newOpen, setNewOpen] = useState(false);
  const castName = (id) => castFullName(casts.find((c) => c.id === id));
  const statusColor = (s) => s === "接客中" ? COLORS.accent : s === "移動中" ? COLORS.blue : s === "受付済" ? COLORS.green : "#B5541F";
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 10 }}>
        <SectionTitle sub="受付内容と進行状況を確認。お仕事メールをワンクリック送信">予約管理</SectionTitle>
        <PrimaryButton onClick={() => setNewOpen(true)}>＋ 新規予約</PrimaryButton>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {reservations.map((r) => (
          <Card key={r.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
            <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 20, color: COLORS.textMain, minWidth: 56 }}>{fmtHour(r.start)}</div>
              <div>
                <div style={{ color: COLORS.textMain, fontSize: 15 }}>{r.customer}<span style={{ color: COLORS.textSub, fontSize: 12 }}> ・ {r.course}</span></div>
                <div style={{ color: COLORS.textSub, fontSize: 12, marginTop: 2 }}><AreaHotel area={r.area} hotel={r.hotel} /> / 担当: {castName(r.castId)} / 送:{r.sendDriver} 迎:{r.pickDriver}</div>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", color: COLORS.textMain, fontSize: 14 }}><Yen value={r.price} /></div>
              <span style={{ padding: "4px 12px", borderRadius: 999, fontSize: 12, fontWeight: 600, color: statusColor(r.status), background: `${statusColor(r.status)}1F`, border: `1px solid ${statusColor(r.status)}44` }}>{r.status}</span>
              <button onClick={() => setMailFor(r)} style={{ padding: "6px 12px", borderRadius: 8, border: `1px solid ${COLORS.accent}`, background: "transparent", color: COLORS.accent, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>✉ メール</button>
            </div>
          </Card>
        ))}
      </div>
      {mailFor && <WorkMailModal reservation={mailFor} castName={castName(mailFor.castId)} onClose={() => setMailFor(null)} />}
      {newOpen && <NewReservationModal casts={casts} drivers={drivers} reservations={reservations} courses={courses} options={options} hotels={hotels} onClose={() => setNewOpen(false)} onCreate={(r) => setReservations((prev) => [...prev, r])} />}
    </div>
  );
}
