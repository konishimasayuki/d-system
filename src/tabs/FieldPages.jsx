import { useState } from "react";
import { AreaHotel, COLORS, Card, PrimaryButton, SectionTitle, StatCard, Yen, castFullName, fmtHour, generateCopy } from "../shared.jsx";

// ============================================================
export function DriverPage({ reservations, casts, drivers }) {
  const [filter, setFilter] = useState("すべて");
  const castName = (id) => casts.find((c) => c.id === id) ? castFullName(casts.find((x) => x.id === id)) : "-";
  const filters = ["すべて", "受付済", "移動中", "接客中"];
  const rows = reservations.filter((r) => filter === "すべて" ? r.status !== "問合せ中" : r.status === filter);
  return (
    <div>
      <SectionTitle sub="外出中のドライバー専用。担当予約を状態で絞り込み">ドライバーページ</SectionTitle>
      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        {filters.map((f) => <button key={f} onClick={() => setFilter(f)} style={{ padding: "8px 16px", borderRadius: 999, border: `1px solid ${filter === f ? COLORS.accent : COLORS.border}`, background: filter === f ? COLORS.accent : "#FFF", color: filter === f ? "#FFF" : COLORS.textMain, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>{f}</button>)}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {rows.map((r) => (
          <Card key={r.id}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
              <div>
                <div style={{ fontSize: 15, color: COLORS.textMain, fontWeight: 600 }}>{fmtHour(r.start)} {castName(r.castId)} 担当</div>
                <div style={{ fontSize: 12, color: COLORS.textSub, marginTop: 2 }}>{r.customer} / <AreaHotel area={r.area} hotel={r.hotel} /></div>
                <div style={{ fontSize: 12, color: COLORS.textSub, marginTop: 2 }}>送:{r.sendDriver} 迎:{r.pickDriver}</div>
              </div>
              <span style={{ padding: "4px 12px", borderRadius: 999, fontSize: 12, fontWeight: 600, color: COLORS.accent, background: COLORS.accentBg }}>{r.status}</span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// 顧客管理

// ============================================================
export function CastMyPage({ casts, reservations }) {
  const me = casts.find((c) => c.name === "みお") || casts[0];
  const myRes = reservations.filter((r) => r.castId === me.id);
  const itaku = Math.round(me.todaySales * me.itakuRate);
  const [diary, setDiary] = useState("");
  const [loading, setLoading] = useState(false);
  const genDiary = async () => { setLoading(true); try { setDiary(await generateCopy("diary", me.name, "")); } catch (e) {} setLoading(false); };
  return (
    <div>
      <SectionTitle sub={`ログイン中: ${castFullName(me)}`}>キャストマイページ</SectionTitle>
      <div className="grid-3" style={{ marginBottom: 16 }}>
        <StatCard label="本日の本数" value={me.todayCount} unit="本" />
        <StatCard label="本日の売上" value={<Yen value={me.todaySales} />} color={COLORS.accent} />
        <StatCard label="本日の委託費" value={<Yen value={itaku} />} color={COLORS.green} />
      </div>
      <div className="grid-2">
        <Card>
          <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.textMain, marginBottom: 12 }}>本日のスケジュール・予約</div>
          <div style={{ fontSize: 13, color: COLORS.textMain, marginBottom: 10 }}>シフト: {me.shiftStart}〜{me.shiftEnd}</div>
          {myRes.length === 0 ? <div style={{ fontSize: 12, color: COLORS.textSub }}>本日の予約はありません</div> : myRes.map((r) => (
            <div key={r.id} style={{ padding: "8px 0", borderBottom: `1px solid ${COLORS.border}`, fontSize: 13, color: COLORS.textMain }}>{fmtHour(r.start)} {r.customer} / {r.course} / {r.hotel}</div>
          ))}
          <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.textMain, margin: "18px 0 10px" }}>委託費明細</div>
          <div style={{ fontSize: 13, color: COLORS.textSub }}>本日 <Yen value={itaku} />(委託率{Math.round(me.itakuRate * 100)}%)/ 清算: 事務所渡し</div>
        </Card>
        <Card>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.textMain }}>写メ日記を投稿</div>
            <button onClick={genDiary} disabled={loading} style={{ padding: "6px 14px", borderRadius: 8, border: "none", background: loading ? "#C7D0DB" : COLORS.accent, color: "#FFF", fontSize: 12, fontWeight: 700, cursor: loading ? "default" : "pointer" }}>{loading ? "生成中…" : "✨ AI自動生成"}</button>
          </div>
          <textarea value={diary} onChange={(e) => setDiary(e.target.value)} placeholder="日記を書く、またはAI自動生成" rows={6} style={{ width: "100%", padding: 12, borderRadius: 10, border: `1px solid ${COLORS.border}`, fontSize: 13, fontFamily: "'Noto Sans JP', sans-serif", resize: "vertical", boxSizing: "border-box" }} />
          <PrimaryButton onClick={() => {}} style={{ marginTop: 10, width: "100%" }}>投稿する(デモ)</PrimaryButton>
        </Card>
      </div>
    </div>
  );
}
