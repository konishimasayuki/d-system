import { useEffect, useState } from "react";
import { COLORS, Card, SectionTitle, dayLabel, isoDate } from "../shared.jsx";

// ============================================================
// ドライバースケジュールタブ
//  縦=ドライバー名 / 横=今週7日間
//  各セルで「休み」or「HH:00〜HH:00」(30分刻み)を選択
//  データは /api/state?key=driverschedule に保存
// ============================================================

// 00:00〜29:30まで30分刻みの選択肢
const HALF_HOURS = (() => {
  const opts = [];
  for (let h = 0; h <= 29; h++) {
    opts.push(`${h}:00`);
    if (h < 29) opts.push(`${h}:30`);
  }
  return opts;
})();

const WEEK_DAYS = Array.from({ length: 7 }, (_, i) => {
  const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() + i); return d;
});

// デフォルトの空スケジュール: { staffId: { dateStr: { type: "off"|"work", start: "10:00", end: "20:00" } } }
function emptySchedule() { return {}; }

function getCell(schedule, staffId, dateStr) {
  return schedule?.[staffId]?.[dateStr] || { type: "off", start: "10:00", end: "20:00" };
}

function setCell(schedule, staffId, dateStr, cell) {
  return {
    ...schedule,
    [staffId]: { ...(schedule[staffId] || {}), [dateStr]: cell },
  };
}

export function DriverScheduleTab({ drivers }) {
  const [schedule, setSchedule] = useState(emptySchedule());
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  // Upstashから読み込み
  useEffect(() => {
    fetch("/api/state?key=driverschedule").then((r) => r.json()).then((d) => {
      if (d && d.value && typeof d.value === "object") setSchedule(d.value);
      setLoaded(true);
    }).catch(() => setLoaded(true));
  }, []);

  // セル変更時に即保存
  const update = (staffId, dateStr, field, val) => {
    setSchedule((prev) => {
      const cur = getCell(prev, staffId, dateStr);
      const next = setCell(prev, staffId, dateStr, { ...cur, [field]: val });
      // 非同期で保存
      setSaving(true);
      fetch("/api/state?key=driverschedule", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ value: next }) })
        .then(() => { setSaving(false); setMsg("保存しました"); setTimeout(() => setMsg(""), 1200); })
        .catch(() => { setSaving(false); setMsg("保存に失敗しました"); });
      return next;
    });
  };

  const colW = 144;
  const nameColW = 112;

  // 日付のヘッダ色(今日=アクセント)
  const headBg = (d) => isoDate(d) === isoDate(new Date()) ? COLORS.accent : "#EDF3FA";
  const headColor = (d) => isoDate(d) === isoDate(new Date()) ? "#FFF" : COLORS.textSub;

  const SELECT_STYLE = {
    padding: "4px 6px", borderRadius: 7, border: `1px solid ${COLORS.border}`,
    fontSize: 12, background: "#FFF", color: COLORS.textMain, width: "100%", boxSizing: "border-box",
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 8 }}>
        <SectionTitle sub="ドライバーの1週間の出勤スケジュール。変更は即時保存されます">ドライバースケジュール</SectionTitle>
        <div style={{ fontSize: 12, color: saving ? COLORS.accent : COLORS.textSub, padding: "4px 0" }}>
          {saving ? "保存中…" : msg}
        </div>
      </div>

      {!loaded ? (
        <div style={{ textAlign: "center", color: COLORS.textSub, padding: 40 }}>読み込み中…</div>
      ) : (
        <Card style={{ padding: 0, overflow: "hidden" }}>
          <div className="table-scroll">
            <div style={{ minWidth: nameColW + colW * 7 }}>
              {/* ヘッダ行(日付) */}
              <div style={{ display: "flex", borderBottom: `2px solid ${COLORS.border}` }}>
                <div style={{ width: nameColW, flexShrink: 0, padding: "12px 14px", fontSize: 12, fontWeight: 600, color: COLORS.textSub, background: "#EDF3FA", position: "sticky", left: 0, zIndex: 3 }}>ドライバー</div>
                {WEEK_DAYS.map((d) => (
                  <div key={isoDate(d)} style={{ width: colW, flexShrink: 0, padding: "10px 6px", textAlign: "center", background: headBg(d), color: headColor(d), fontWeight: 700, fontSize: 13, borderLeft: `1px solid ${COLORS.border}` }}>
                    {dayLabel(d)}
                    {isoDate(d) === isoDate(new Date()) && <span style={{ display: "block", fontSize: 10, opacity: 0.85, marginTop: 2 }}>今日</span>}
                  </div>
                ))}
              </div>

              {/* ドライバー行 */}
              {drivers.map((s) => (
                <div key={s.id} style={{ display: "flex", borderBottom: `1px solid ${COLORS.border}` }}>
                  {/* 名前列(固定) */}
                  <div style={{ width: nameColW, flexShrink: 0, padding: "14px 14px", background: "#FAFBFD", position: "sticky", left: 0, zIndex: 2, borderRight: `1px solid ${COLORS.border}`, display: "flex", flexDirection: "column", justifyContent: "center" }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.textMain }}>{s.name}</div>
                    <div style={{ fontSize: 10, color: COLORS.textSub, marginTop: 2 }}>{s.role}</div>
                  </div>

                  {/* 日付ごとのセル */}
                  {WEEK_DAYS.map((d) => {
                    const dateStr = isoDate(d);
                    const cell = getCell(schedule, s.id, dateStr);
                    const isOff = cell.type === "off";
                    return (
                      <div key={dateStr} style={{ width: colW, flexShrink: 0, padding: "10px 8px", borderLeft: `1px solid ${COLORS.border}`, background: isOff ? "#F4F5F7" : "#FFFFFF", display: "flex", flexDirection: "column", gap: 6 }}>
                        {/* 出勤/休みの切り替え */}
                        <div style={{ display: "flex", gap: 4 }}>
                          <button
                            onClick={() => update(s.id, dateStr, "type", "work")}
                            style={{ flex: 1, padding: "5px 0", borderRadius: 7, border: `1.5px solid ${!isOff ? COLORS.accent : COLORS.border}`, background: !isOff ? COLORS.accent : "#FFF", color: !isOff ? "#FFF" : COLORS.textSub, fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
                            出勤
                          </button>
                          <button
                            onClick={() => update(s.id, dateStr, "type", "off")}
                            style={{ flex: 1, padding: "5px 0", borderRadius: 7, border: `1.5px solid ${isOff ? "#98A2B0" : COLORS.border}`, background: isOff ? "#98A2B0" : "#FFF", color: isOff ? "#FFF" : COLORS.textSub, fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
                            休み
                          </button>
                        </div>

                        {/* 時刻選択(出勤時のみ表示) */}
                        {!isOff && (
                          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                            <select value={cell.start} onChange={(e) => update(s.id, dateStr, "start", e.target.value)} style={SELECT_STYLE}>
                              {HALF_HOURS.map((t) => <option key={t} value={t}>{t}</option>)}
                            </select>
                            <span style={{ fontSize: 11, color: COLORS.textSub, flexShrink: 0 }}>〜</span>
                            <select value={cell.end} onChange={(e) => update(s.id, dateStr, "end", e.target.value)} style={SELECT_STYLE}>
                              {HALF_HOURS.filter((t) => t > cell.start).map((t) => <option key={t} value={t}>{t}</option>)}
                            </select>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* 凡例 */}
      <div style={{ display: "flex", gap: 20, marginTop: 12, flexWrap: "wrap", fontSize: 12, color: COLORS.textSub }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}><span style={{ width: 14, height: 14, borderRadius: 3, background: COLORS.accent }} />出勤</div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}><span style={{ width: 14, height: 14, borderRadius: 3, background: "#98A2B0" }} />休み</div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}><span style={{ width: 14, height: 14, borderRadius: 3, background: "#EDF3FA", border: `1px solid ${COLORS.border}` }} />今日</div>
        <div style={{ color: COLORS.textSub }}>※ 変更はリアルタイムで保存されます</div>
      </div>
    </div>
  );
}
