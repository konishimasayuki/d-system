import { COLORS, Card, SectionTitle, StatCard, Yen, castFullName } from "../shared.jsx";

// ============================================================
export function Payout({ casts }) {
  const activeCasts = casts.filter((c) => c.todaySales > 0);
  const totalSales = activeCasts.reduce((a, c) => a + c.todaySales, 0);
  const totalPayout = activeCasts.reduce((a, c) => a + Math.round(c.todaySales * c.itakuRate), 0);
  return (
    <div>
      <SectionTitle sub="キャストごとの委託費率で自動計算(設定で個別変更可)">委託費(給与)</SectionTitle>
      <div className="grid-3" style={{ marginBottom: 20 }}>
        <StatCard label="総売上" value={<Yen value={totalSales} />} />
        <StatCard label="委託費合計" value={<Yen value={totalPayout} />} color={COLORS.accent} />
        <StatCard label="店落ち合計" value={<Yen value={totalSales - totalPayout} />} color={COLORS.blue} />
      </div>
      <Card style={{ padding: 0, overflow: "hidden" }}>
        <div className="table-scroll">
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 560 }}>
            <thead><tr style={{ background: "#EDF3FA" }}>{["キャスト", "本数", "売上", "委託率", "委託費", "店落ち"].map((h) => <th key={h} style={{ textAlign: "left", padding: "12px 16px", fontSize: 12, color: COLORS.textSub, fontWeight: 600, borderBottom: `1px solid ${COLORS.border}` }}>{h}</th>)}</tr></thead>
            <tbody>
              {activeCasts.map((c) => {
                const it = Math.round(c.todaySales * c.itakuRate);
                return (
                  <tr key={c.id} style={{ borderBottom: `1px solid ${COLORS.border}` }}>
                    <td style={{ padding: "12px 16px", color: COLORS.textMain, fontSize: 14 }}>{castFullName(c)}</td>
                    <td style={{ padding: "12px 16px", color: COLORS.textMain, fontSize: 13 }}>{c.todayCount}本</td>
                    <td style={{ padding: "12px 16px", color: COLORS.textMain, fontSize: 13 }}><Yen value={c.todaySales} /></td>
                    <td style={{ padding: "12px 16px", color: COLORS.textSub, fontSize: 13 }}>{Math.round(c.itakuRate * 100)}%</td>
                    <td style={{ padding: "12px 16px", color: COLORS.accent, fontSize: 13 }}><Yen value={it} /></td>
                    <td style={{ padding: "12px 16px", color: COLORS.blue, fontSize: 13 }}><Yen value={c.todaySales - it} /></td>
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
