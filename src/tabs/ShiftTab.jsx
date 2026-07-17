import { CAST_STATUS, COLORS, Card, SectionTitle, StatusChip, Yen, castFullName } from "../shared.jsx";

// ============================================================
export function ShiftManagement({ casts, setCasts }) {
  const updateStatus = (id, status) => setCasts((prev) => prev.map((c) => (c.id === id ? { ...c, status } : c)));
  return (
    <div>
      <SectionTitle sub={`キャストの出退勤・現在の状態を切り替え(全${casts.length}名)`}>出勤・稼働状況管理</SectionTitle>
      <Card style={{ padding: 0, overflow: "hidden" }}>
        <div className="table-scroll">
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 680 }}>
            <thead><tr style={{ background: "#EDF3FA" }}>{["源氏名", "本日シフト", "現在地(接客中)", "本数/売上", "状態", "状態を変更"].map((h) => <th key={h} style={{ textAlign: "left", padding: "12px 16px", fontSize: 12, color: COLORS.textSub, fontWeight: 600, borderBottom: `1px solid ${COLORS.border}` }}>{h}</th>)}</tr></thead>
            <tbody>
              {casts.map((c) => (
                <tr key={c.id} style={{ borderBottom: `1px solid ${COLORS.border}` }}>
                  <td style={{ padding: "12px 16px", color: COLORS.textMain, fontSize: 14 }}>{castFullName(c)}<span style={{ color: COLORS.textSub, fontSize: 12 }}> ({c.age})</span></td>
                  <td style={{ padding: "12px 16px", color: COLORS.textMain, fontSize: 13, fontFamily: "'JetBrains Mono', monospace" }}>{c.shiftStart === "-" ? "-" : `${c.shiftStart} - ${c.shiftEnd}`}</td>
                  <td style={{ padding: "12px 16px", color: COLORS.textMain, fontSize: 13 }}>{c.hotel || "-"}</td>
                  <td style={{ padding: "12px 16px", color: COLORS.textMain, fontSize: 13 }}>{c.todayCount}本 / <Yen value={c.todaySales} /></td>
                  <td style={{ padding: "12px 16px" }}><StatusChip status={c.status} /></td>
                  <td style={{ padding: "12px 16px" }}>
                    <select value={c.status} onChange={(e) => updateStatus(c.id, e.target.value)} style={{ background: "#FFFFFF", color: COLORS.textMain, border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: "6px 10px", fontSize: 12 }}>
                      {Object.entries(CAST_STATUS).map(([key, v]) => <option key={key} value={key}>{v.label}</option>)}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
