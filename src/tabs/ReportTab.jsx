import { useState } from "react";
import { COLORS, Card, REPORT_DATA, SectionTitle, StatCard, Yen } from "../shared.jsx";

// ============================================================
export function Report() {
  const [period, setPeriod] = useState("日");
  const d = REPORT_DATA[period];
  return (
    <div>
      <SectionTitle sub="客数・入電数・売上・委託費・店落ちを自動集計">データ集計</SectionTitle>
      <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
        {["日", "月", "年"].map((p) => <button key={p} onClick={() => setPeriod(p)} style={{ padding: "8px 20px", borderRadius: 8, border: `1px solid ${period === p ? COLORS.accent : COLORS.border}`, background: period === p ? COLORS.accent : "#FFF", color: period === p ? "#FFF" : COLORS.textMain, fontWeight: 600, fontSize: 14, cursor: "pointer" }}>{p}別</button>)}
      </div>
      <div className="grid-5">
        <StatCard label="入電数" value={d.calls} unit="件" color={COLORS.blue} />
        <StatCard label="客数" value={d.customers} unit="人" color={COLORS.purple} />
        <StatCard label="売上金" value={<Yen value={d.sales} />} color={COLORS.accent} />
        <StatCard label="委託費" value={<Yen value={d.itaku} />} color={COLORS.green} />
        <StatCard label="店落ち" value={<Yen value={d.ochi} />} color={COLORS.textMain} />
      </div>
      <Card style={{ marginTop: 16 }}>
        <div style={{ color: COLORS.textSub, fontSize: 12, marginBottom: 6 }}>成約率(客数 ÷ 入電数)</div>
        <div style={{ fontSize: 26, color: COLORS.accent, fontFamily: "'JetBrains Mono', monospace" }}>{Math.round((d.customers / d.calls) * 100)}%</div>
      </Card>
    </div>
  );
}
