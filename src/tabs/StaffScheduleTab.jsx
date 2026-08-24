import { useEffect, useState } from "react";
import { COLORS, Card, SectionTitle, DRIVER_SHIFT, dayLabel, isoDate } from "../shared.jsx";

// ============================================================
// スタッフスケジュールタブ(旧ドライバースケジュール)
//  縦=ドライバー名 / 横=1週間分(週切替あり)
//  上段=昼スタッフ、下段=夜スタッフ(太線で区切り)
//  各セルで「休み」or「HH:00〜HH:00」(30分刻み)を選択
//  データは /api/state?key=driverschedule に保存(週ごとに保持)
// ============================================================

// 00:00〜29:30まで30分刻みの選択肢
export const HALF_HOURS = (() => {
  const opts = [];
  for (let h = 0; h <= 29; h++) {
    opts.push(`${h}:00`);
    if (h < 29) opts.push(`${h}:30`);
  }
  return opts;
})();

// weekOffset=0が今週。7日ぶんの日付配列を返す
export function weekDays(weekOffset = 0) {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() + weekOffset * 7 + i); return d;
  });
}

// デフォルトの空スケジュール: { staffId: { dateStr: { type: "off"|"work", start: "10:00", end: "20:00" } } }
export function emptySchedule() { return {}; }

export function getCell(schedule, staffId, dateStr) {
  return schedule?.[staffId]?.[dateStr] || { type: "off", start: "10:00", end: "20:00" };
}

function setCell(schedule, staffId, dateStr, cell) {
  return {
    ...schedule,
    [staffId]: { ...(schedule[staffId] || {}), [dateStr]: cell },
  };
}

// スケジュールをUpstashから読み込む共通フック(管理画面・ドライバーポータル両方で使用)
export function useDriverSchedule() {
  const [schedule, setSchedule] = useState(emptySchedule());
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    fetch("/api/state?key=driverschedule").then((r) => r.json()).then((d) => {
      if (d && d.value && typeof d.value === "object") setSchedule(d.value);
      setLoaded(true);
    }).catch(() => setLoaded(true));
  }, []);
  return { schedule, setSchedule, loaded };
}

export function DriverScheduleTab({ drivers }) {
  const { schedule, setSchedule, loaded } = useDriverSchedule();
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [weekOffset, setWeekOffset] = useState(0);

  const days = weekDays(weekOffset);

  // セル変更時に即保存
  const update = (staffId, dateStr, field, val) => {
    setSchedule((prev) => {
      const cur = getCell(prev, staffId, dateStr);
      const next = setCell(prev, staffId, dateStr, { ...cur, [field]: val });
      setSaving(true);
      fetch("/api/state?key=driverschedule", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ value: next }) })
        .then(() => { setSaving(false); setMsg("保存しました"); setTimeout(() => setMsg(""), 1200); })
        .catch(() => { setSaving(false); setMsg("保存に失敗しました"); });
      return next;
    });
  };

  const colW = 144;
  const nameColW = 112;

  const headBg = (d) => isoDate(d) === isoDate(new Date()) ? COLORS.accent : "#EDF3FA";
  const headColor = (d) => isoDate(d) === isoDate(new Date()) ? "#FFF" : COLORS.textSub;

  const SELECT_STYLE = {
    padding: "4px 6px", borderRadius: 7, border: `1px solid ${COLORS.border}`,
    fontSize: 12, background: "#FFF", color: COLORS.textMain, width: "100%", boxSizing: "border-box",
  };

  const dayDrivers = drivers.filter((d) => (d.shift || "day") === "day");
  const nightDrivers = drivers.filter((d) => (d.shift || "day") === "night");

  const renderRow = (s) => (
    <div key={s.id} style={{ display: "flex", borderBottom: `1px solid ${COLORS.border}` }}>
      <div style={{ width: nameColW, flexShrink: 0, padding: "14px 14px", background: "#FAFBFD", position: "sticky", left: 0, zIndex: 2, borderRight: `1px solid ${COLORS.border}`, display: "flex", flexDirection: "column", justifyContent: "center" }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.textMain }}>{s.name}</div>
        <div style={{ fontSize: 10, color: COLORS.textSub, marginTop: 2 }}>{s.car || "-"}</div>
      </div>
      {days.map((d) => {
        const dateStr = isoDate(d);
        const cell = getCell(schedule, s.id, dateStr);
        const isOff = cell.type === "off";
        return (
          <div key={dateStr} style={{ width: colW, flexShrink: 0, padding: "10px 8px", borderLeft: `1px solid ${COLORS.border}`, background: isOff ? "#F4F5F7" : "#FFFFFF", display: "flex", flexDirection: "column", gap: 6 }}>
            <div style={{ display: "flex", gap: 4 }}>
              <button onClick={() => update(s.id, dateStr, "type", "work")} style={{ flex: 1, padding: "5px 0", borderRadius: 7, border: `1.5px solid ${!isOff ? COLORS.accent : COLORS.border}`, background: !isOff ? COLORS.accent : "#FFF", color: !isOff ? "#FFF" : COLORS.textSub, fontSize: 11, fontWeight: 700, cursor: "pointer" }}>出勤</button>
              <button onClick={() => update(s.id, dateStr, "type", "off")} style={{ flex: 1, padding: "5px 0", borderRadius: 7, border: `1.5px solid ${isOff ? "#98A2B0" : COLORS.border}`, background: isOff ? "#98A2B0" : "#FFF", color: isOff ? "#FFF" : COLORS.textSub, fontSize: 11, fontWeight: 700, cursor: "pointer" }}>休み</button>
            </div>
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
  );

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 8 }}>
        <SectionTitle sub="ドライバーの出勤スケジュール。上段=昼／下段=夜。変更は即時保存されます">スタッフスケジュール</SectionTitle>
        <div style={{ fontSize: 12, color: saving ? COLORS.accent : COLORS.textSub, padding: "4px 0" }}>
          {saving ? "保存中…" : msg}
        </div>
      </div>

      {/* 週切り替え */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
        <button onClick={() => setWeekOffset((w) => w - 1)} style={{ padding: "7px 14px", borderRadius: 8, border: `1px solid ${COLORS.border}`, background: "#FFF", color: COLORS.textMain, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>‹ 前週</button>
        <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.textMain, padding: "6px 14px", background: "#EDF3FA", borderRadius: 8 }}>
          {weekOffset === 0 ? "今週" : weekOffset > 0 ? `${weekOffset}週間後` : `${-weekOffset}週間前`}　{dayLabel(days[0])}〜{dayLabel(days[6])}
        </div>
        <button onClick={() => setWeekOffset((w) => w + 1)} style={{ padding: "7px 14px", borderRadius: 8, border: `1px solid ${COLORS.border}`, background: "#FFF", color: COLORS.textMain, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>次週 ›</button>
        {weekOffset !== 0 && <button onClick={() => setWeekOffset(0)} style={{ padding: "7px 12px", borderRadius: 8, border: "none", background: "transparent", color: COLORS.accent, fontWeight: 700, fontSize: 12.5, cursor: "pointer" }}>今週に戻る</button>}
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
                {days.map((d) => (
                  <div key={isoDate(d)} style={{ width: colW, flexShrink: 0, padding: "10px 6px", textAlign: "center", background: headBg(d), color: headColor(d), fontWeight: 700, fontSize: 13, borderLeft: `1px solid ${COLORS.border}` }}>
                    {dayLabel(d)}
                    {isoDate(d) === isoDate(new Date()) && <span style={{ display: "block", fontSize: 10, opacity: 0.85, marginTop: 2 }}>今日</span>}
                  </div>
                ))}
              </div>

              {/* 昼スタッフ見出し */}
              <div style={{ display: "flex", background: "#FFF6E9", borderBottom: `1px solid ${COLORS.border}` }}>
                <div style={{ padding: "6px 14px", fontSize: 11.5, fontWeight: 700, color: "#B5720A", position: "sticky", left: 0, background: "#FFF6E9" }}>☀ 昼スタッフ({dayDrivers.length}名)</div>
              </div>
              {dayDrivers.map(renderRow)}

              {/* 昼夜の区切り(太線+間隔) */}
              <div style={{ height: 14, background: "#DDE3EA", borderTop: `3px solid ${COLORS.textMain}`, borderBottom: `3px solid ${COLORS.textMain}` }} />

              {/* 夜スタッフ見出し */}
              <div style={{ display: "flex", background: "#EAF0FC", borderBottom: `1px solid ${COLORS.border}` }}>
                <div style={{ padding: "6px 14px", fontSize: 11.5, fontWeight: 700, color: "#3B54A8", position: "sticky", left: 0, background: "#EAF0FC" }}>🌙 夜スタッフ({nightDrivers.length}名)</div>
              </div>
              {nightDrivers.map(renderRow)}
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
