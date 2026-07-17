import { COLORS, Card, SectionTitle, castFullName } from "../shared.jsx";

// ============================================================
export function daysBetween(dateStr) {
  const last = new Date(dateStr); const now = new Date(2026, 5, 30);
  return Math.floor((now - last) / (1000 * 60 * 60 * 24));
}
export function StdManagement({ casts }) {
  const CYCLE = 90;
  const rows = casts.filter((c) => c.status !== "off").map((c) => {
    const days = daysBetween(c.stdLast); const remain = CYCLE - days;
    const level = remain < 0 ? "expired" : remain <= 14 ? "soon" : "ok";
    return { ...c, days, remain, level };
  }).sort((a, b) => a.remain - b.remain);
  const levelStyle = { expired: { label: "期限切れ", color: COLORS.red }, soon: { label: "要検査", color: "#B58A1F" }, ok: { label: "問題なし", color: COLORS.green } };
  const alertCount = rows.filter((r) => r.level !== "ok").length;
  return (
    <div>
      <SectionTitle sub={`検査サイクル${CYCLE}日。期限が近いキャストを自動でアラート`}>STD検査管理</SectionTitle>
      {alertCount > 0 && <Card style={{ marginBottom: 16, borderColor: COLORS.red, background: "rgba(192,73,43,0.06)" }}><div style={{ color: COLORS.red, fontSize: 14, fontWeight: 700 }}>⚠ {alertCount}名のキャストが検査期限切れ・期限間近です</div></Card>}
      <Card style={{ padding: 0, overflow: "hidden" }}>
        <div className="table-scroll">
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 560 }}>
            <thead><tr style={{ background: "#EDF3FA" }}>{["源氏名", "前回検査日", "経過日数", "次回まで", "状態"].map((h) => <th key={h} style={{ textAlign: "left", padding: "12px 16px", fontSize: 12, color: COLORS.textSub, fontWeight: 600, borderBottom: `1px solid ${COLORS.border}` }}>{h}</th>)}</tr></thead>
            <tbody>
              {rows.map((c) => {
                const ls = levelStyle[c.level];
                return (
                  <tr key={c.id} style={{ borderBottom: `1px solid ${COLORS.border}` }}>
                    <td style={{ padding: "12px 16px", color: COLORS.textMain, fontSize: 14 }}>{castFullName(c)}</td>
                    <td style={{ padding: "12px 16px", color: COLORS.textMain, fontSize: 13, fontFamily: "'JetBrains Mono', monospace" }}>{c.stdLast}</td>
                    <td style={{ padding: "12px 16px", color: COLORS.textMain, fontSize: 13 }}>{c.days}日</td>
                    <td style={{ padding: "12px 16px", color: c.remain < 0 ? COLORS.red : COLORS.textMain, fontSize: 13 }}>{c.remain < 0 ? `${-c.remain}日超過` : `あと${c.remain}日`}</td>
                    <td style={{ padding: "12px 16px" }}><span style={{ fontSize: 11, fontWeight: 700, color: ls.color, background: `${ls.color}1F`, padding: "3px 10px", borderRadius: 999 }}>{ls.label}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
