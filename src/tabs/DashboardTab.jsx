import { CAST_STATUS, COLORS, Card, SALES_HISTORY, SectionTitle, StatCard, Yen, castFullName } from "../shared.jsx";

// ============================================================
export function CastMiniCard({ c }) {
  const s = CAST_STATUS[c.status];
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 10, border: `1px solid ${COLORS.border}`, background: "#FFFFFF", marginBottom: 8 }}>
      <div style={{ width: 32, height: 32, borderRadius: "50%", background: s.bg, border: `1.5px solid ${s.color}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: s.color, fontWeight: 700, flexShrink: 0 }}>{(c.name || "?")[0]}</div>
      <div style={{ minWidth: 0 }}>
        <div style={{ color: COLORS.textMain, fontSize: 13, fontWeight: 600 }}>{castFullName(c)}</div>
        <div style={{ color: COLORS.textSub, fontSize: 11, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.shiftStart === "-" ? "本日休み" : `${c.shiftStart}〜${c.shiftEnd}${c.hotel ? " / " + c.hotel : ""}`}</div>
      </div>
    </div>
  );
}
export function StatusColumn({ title, color, casts }) {
  return (
    <Card>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <span style={{ width: 8, height: 8, borderRadius: "50%", background: color }} />
        <div style={{ color: COLORS.textMain, fontSize: 14, fontWeight: 700 }}>{title}</div>
        <div style={{ color: COLORS.textSub, fontSize: 12, marginLeft: "auto" }}>{casts.length}名</div>
      </div>
      <div style={{ maxHeight: 420, overflowY: "auto" }}>
        {casts.length === 0 ? <div style={{ color: COLORS.textSub, fontSize: 12, padding: "12px 0" }}>該当なし</div> : casts.map((c) => <CastMiniCard key={c.id} c={c} />)}
      </div>
    </Card>
  );
}
export function Dashboard({ casts, reservations }) {
  const totalSalesToday = casts.reduce((a, c) => a + c.todaySales, 0);
  const workingCasts = casts.filter((c) => c.status === "working");
  const waitingCasts = casts.filter((c) => c.status === "waiting");
  const beforeShiftCasts = casts.filter((c) => c.status === "before_shift");
  const activeReservations = reservations.filter((r) => r.status !== "問合せ中").length;
  const maxSales = Math.max(...SALES_HISTORY.map((d) => d.sales));
  // 連絡忘れ防止: 接客中で終了が近い予約
  const endingSoon = reservations.filter((r) => r.status === "接客中").map((r) => ({ ...r, endAt: r.start + r.dur }));

  return (
    <div>
      <SectionTitle sub="本日の稼働状況をリアルタイムで確認">本日の稼働状況ボード</SectionTitle>
      {endingSoon.length > 0 && (
        <Card style={{ marginBottom: 16, borderColor: COLORS.accent, background: COLORS.accentBg }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.accentDark, marginBottom: 6 }}>🔔 迎え連絡アラート(連絡忘れ防止)</div>
          {endingSoon.map((r) => (
            <div key={r.id} style={{ fontSize: 12, color: COLORS.textMain }}>{Math.floor(r.endAt)}:{r.endAt % 1 ? "30" : "00"} 終了予定 — {r.customer} / {r.hotel}(迎えドライバー手配を確認)</div>
          ))}
        </Card>
      )}
      <div className="grid-4" style={{ marginBottom: 24 }}>
        <StatCard label="本日の売上" value={<Yen value={totalSalesToday} />} color={COLORS.accent} />
        <StatCard label="接客中" value={workingCasts.length} unit="名" />
        <StatCard label="待機中" value={waitingCasts.length} unit="名" />
        <StatCard label="進行中の予約" value={activeReservations} unit="件" />
      </div>
      <div className="board-3" style={{ marginBottom: 20 }}>
        <StatusColumn title="待機中" color={CAST_STATUS.waiting.color} casts={waitingCasts} />
        <StatusColumn title="接客中" color={CAST_STATUS.working.color} casts={workingCasts} />
        <StatusColumn title="出勤前" color={CAST_STATUS.before_shift.color} casts={beforeShiftCasts} />
      </div>
      <Card>
        <div style={{ color: COLORS.textSub, fontSize: 12, marginBottom: 14 }}>直近7日間の売上推移</div>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 160 }}>
          {SALES_HISTORY.map((d) => (
            <div key={d.date} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
              <div style={{ color: COLORS.textSub, fontSize: 10, fontFamily: "'JetBrains Mono', monospace" }}>{Math.round(d.sales / 1000)}k</div>
              <div style={{ width: "70%", background: `linear-gradient(180deg, ${COLORS.accent}, ${COLORS.accentDark})`, borderRadius: "4px 4px 0 0", height: `${(d.sales / maxSales) * 100}px` }} />
              <div style={{ color: COLORS.textSub, fontSize: 11 }}>{d.date}</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
