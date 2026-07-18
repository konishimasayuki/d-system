import { useEffect, useRef, useState } from "react";
import { CAST_STATUS, COLORS, Card, DAY_DATES, NUM_DAYS, SectionTitle, CastAvatar, useCastThumbs, castFullName, dayLabel, daySchedule, isoDate, parseTimeToHour } from "../shared.jsx";

// ============================================================
// ============================================================
// タイムテーブル(24時間営業・本日〜10日後まで日付切替対応)
//  状態タグ(接客中/待機中/退勤済み等)は現在時刻と予約バーから自動判定
//  満枠/空き有 でオペレーターが予約可否を判断できる
// ============================================================
export const TT_HOURS = Array.from({ length: 30 }, (_, i) => i); // 0:00〜翌5:00(29時)まで表示

export function Timetable({ reservations, casts, setCasts, onOpenReservation }) {
  const colW = 60;
  const nameColW = 150;
  const [now, setNow] = useState(new Date());
  const [dayIndex, setDayIndex] = useState(0);
  const scrollRef = useRef(null);
  useEffect(() => { const t = setInterval(() => setNow(new Date()), 30000); return () => clearInterval(t); }, []);

  const isToday = dayIndex === 0;
  const dateStr = isoDate(DAY_DATES[dayIndex]);
  const totalW = TT_HOURS.length * colW;

  let nowHour = now.getHours() + now.getMinutes() / 60;

  // 今の時間近辺が左端に来るよう自動スクロール(日付切替のたびに実行)
  useEffect(() => {
    if (!scrollRef.current) return;
    const targetHour = Math.max(TT_HOURS[0], nowHour - 1); // 1時間前から表示
    scrollRef.current.scrollLeft = Math.max(0, (targetHour - TT_HOURS[0]) * colW);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dayIndex]);

  // 本日：実際のcasts(編集可能な状態)／翌日以降：スケジュールから算出(閲覧のみ)
  const rowsForDay = isToday
    ? casts.filter((c) => c.status !== "off").map((c) => ({ castId: c.id, cast: c, shiftStart: parseTimeToHour(c.shiftStart), shiftEnd: parseTimeToHour(c.shiftEnd) }))
        .sort((a, b) => {
          // 退勤済み(現在時刻がシフト終了を過ぎている)を下に
          const aDone = a.shiftEnd != null && nowHour >= a.shiftEnd ? 1 : 0;
          const bDone = b.shiftEnd != null && nowHour >= b.shiftEnd ? 1 : 0;
          if (aDone !== bDone) return aDone - bDone;
          return 0;
        })
    : daySchedule(dayIndex).map((e) => ({ castId: casts[e.castIndex]?.id, cast: casts[e.castIndex], shiftStart: e.shiftStart, shiftEnd: e.shiftEnd })).filter((r) => r.cast);

  const dayReservations = reservations.filter((r) => r.date === dateStr);
  const thumbs = useCastThumbs(rowsForDay.map((r) => r.castId));

  // 今の時刻・シフト・予約バーから、そのキャストの「今の実状態」と「空き枠の有無」を判定
  // 満枠=これ以上予約を入れる余地がない / 空き有=まだ入れられる / なし=勤務時間外や休み
  const liveStatus = (castRows, shiftStart, shiftEnd) => {
    // 勤務時間外(未出勤 or 退勤済み)
    if (shiftStart == null || shiftEnd == null) return { key: "off", label: "本日休み", vacancy: null };
    if (nowHour < shiftStart) return { key: "before_shift", label: "出勤前", vacancy: null };
    if (nowHour >= shiftEnd) return { key: "off", label: "退勤済み", vacancy: null };

    // 勤務時間内。今この瞬間に進行中の予約があるか(キャンセル・終了は除く)
    const active = castRows.find((r) => r.status !== "キャンセル" && r.status !== "終了" && nowHour >= r.start && nowHour < r.start + r.dur);
    const statusKey = active ? (active.status === "移動中" ? "working" : "working") : "waiting";
    const label = active ? (active.status === "移動中" ? "移動中" : "接客中") : "待機中";

    // 空き枠判定：現在〜シフト終了までの残り時間に、既存の(未来の)予約が埋まっているか
    // 進行中＋これから始まる予約の合計時間が、残り勤務時間の8割以上なら「満枠」とみなす
    const remain = shiftEnd - Math.max(nowHour, shiftStart);
    const futureBusy = castRows
      .filter((r) => r.status !== "キャンセル" && r.status !== "終了" && r.start + r.dur > nowHour)
      .reduce((sum, r) => sum + Math.min(r.start + r.dur, shiftEnd) - Math.max(r.start, nowHour), 0);
    const vacancy = remain <= 0.5 ? "full" : (futureBusy >= remain * 0.8 ? "full" : "open");
    return { key: statusKey, label, vacancy };
  };

  const STATUS_TAG = (key) => CAST_STATUS[key] || CAST_STATUS.off;

  const showNowLine = isToday && nowHour >= TT_HOURS[0] && nowHour <= TT_HOURS[TT_HOURS.length - 1] + 1;
  const nowLeft = (nowHour - TT_HOURS[0]) * colW;

  const resColor = (status) => status === "接客中" ? { bg: "#2F6DB5", text: "#FFFFFF" }
    : status === "移動中" ? { bg: "#5C93C4", text: "#FFFFFF" }
    : status === "受付済" ? { bg: "#3E9C74", text: "#FFFFFF" }
    : status === "終了" ? { bg: "#B7C2D0", text: "#FFFFFF" }
    : status === "キャンセル" ? { bg: "#E3D6D2", text: "#8A6A5E" }
    : { bg: "#E08A1E", text: "#FFFFFF" }; // 問合せ中など

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
        <SectionTitle sub="24時間営業。白=待機中／グレー=勤務時間外／色付き=予約中(クリックで詳細)">タイムテーブル</SectionTitle>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 14 }}>
          <button onClick={() => setDayIndex((d) => Math.max(0, d - 1))} disabled={dayIndex === 0} style={{ width: 32, height: 32, borderRadius: 8, border: `1px solid ${COLORS.border}`, background: "#FFF", color: dayIndex === 0 ? COLORS.border : COLORS.textMain, cursor: dayIndex === 0 ? "default" : "pointer", fontSize: 16 }}>‹</button>
          <label style={{ position: "relative", display: "inline-flex", alignItems: "center", minWidth: 138, justifyContent: "center", fontSize: 14, fontWeight: 700, color: COLORS.textMain, background: "#EDF3FA", borderRadius: 8, padding: "6px 10px", cursor: "pointer" }}>
            <span>📅 {isToday ? "本日 " : ""}{dayLabel(DAY_DATES[dayIndex])}</span>
            <input
              type="date"
              value={isoDate(DAY_DATES[dayIndex])}
              min={isoDate(DAY_DATES[0])}
              max={isoDate(DAY_DATES[NUM_DAYS - 1])}
              onChange={(e) => {
                const picked = e.target.value;
                const idx = DAY_DATES.findIndex((d) => isoDate(d) === picked);
                if (idx >= 0) setDayIndex(idx);
              }}
              style={{ position: "absolute", inset: 0, opacity: 0, cursor: "pointer", width: "100%", height: "100%" }}
            />
          </label>
          <button onClick={() => setDayIndex((d) => Math.min(NUM_DAYS - 1, d + 1))} disabled={dayIndex === NUM_DAYS - 1} style={{ width: 32, height: 32, borderRadius: 8, border: `1px solid ${COLORS.border}`, background: "#FFF", color: dayIndex === NUM_DAYS - 1 ? COLORS.border : COLORS.textMain, cursor: dayIndex === NUM_DAYS - 1 ? "default" : "pointer", fontSize: 16 }}>›</button>
        </div>
      </div>
      {!isToday && <div style={{ fontSize: 12, color: COLORS.textSub, background: "#EDF3FA", borderRadius: 8, padding: "8px 12px", marginBottom: 12 }}>翌日以降は出勤予定の閲覧です。状態変更・メモは本日のみ操作できます。予約はクリックで内容確認・編集できます。</div>}

      <Card style={{ padding: 0, overflow: "hidden" }}>
        <div className="table-scroll" ref={scrollRef}>
          <div style={{ minWidth: nameColW + totalW, position: "relative" }}>
            {/* ヘッダー(時間軸) */}
            <div style={{ display: "flex", background: "#EDF3FA", borderBottom: `1px solid ${COLORS.border}`, position: "sticky", top: 0, zIndex: 4 }}>
              <div style={{ width: nameColW, padding: "10px 12px", fontSize: 12, color: COLORS.textSub, fontWeight: 600, flexShrink: 0, position: "sticky", left: 0, zIndex: 5, background: "#EDF3FA" }}>キャスト</div>
              {TT_HOURS.map((h) => <div key={h} style={{ width: colW, padding: "10px 0", textAlign: "center", fontSize: 11, color: COLORS.textSub, fontWeight: 600, fontFamily: "'JetBrains Mono', monospace", flexShrink: 0, borderLeft: `1px solid ${COLORS.border}` }}>{h % 24}:00</div>)}
            </div>

            {/* 行 */}
            {rowsForDay.map(({ castId, cast: c, shiftStart, shiftEnd }) => {
              const rows = dayReservations.filter((r) => r.castId === castId);
              return (
                <div key={castId} style={{ display: "flex", borderBottom: `1px solid ${COLORS.border}`, position: "relative", height: 64 }}>
                  {/* 名前列 */}
                  <div style={{ width: nameColW, padding: "6px 10px", flexShrink: 0, display: "flex", alignItems: "center", gap: 8, background: "#FAFBFD", position: "sticky", left: 0, zIndex: 3, borderRight: `1px solid ${COLORS.border}` }}>
                    <CastAvatar cast={c} photo={thumbs[c.id]} size={44} radius={8} />
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 12.5, fontWeight: 700, color: COLORS.textMain, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{castFullName(c)}</div>
                      {isToday ? (
                        (() => {
                          const ls = liveStatus(rows, shiftStart, shiftEnd);
                          const s = STATUS_TAG(ls.key);
                          return (
                            <div style={{ display: "flex", gap: 4, alignItems: "center", marginTop: 2, flexWrap: "wrap" }}>
                              <span style={{ fontSize: 10, fontWeight: 700, color: s.color, background: s.bg, padding: "1px 8px", borderRadius: 999, whiteSpace: "nowrap" }}>{ls.label}</span>
                              {ls.vacancy === "full" && <span style={{ fontSize: 10, fontWeight: 700, color: "#C0492B", background: "rgba(192,73,43,0.12)", padding: "1px 8px", borderRadius: 999, whiteSpace: "nowrap" }}>満枠</span>}
                              {ls.vacancy === "open" && <span style={{ fontSize: 10, fontWeight: 700, color: "#3E9C74", background: "rgba(62,156,116,0.12)", padding: "1px 8px", borderRadius: 999, whiteSpace: "nowrap" }}>空き有</span>}
                            </div>
                          );
                        })()
                      ) : (
                        <div style={{ fontSize: 10, color: COLORS.textSub, marginTop: 2 }}>{shiftStart}:00〜{shiftEnd % 24}:00 出勤予定</div>
                      )}
                    </div>
                  </div>
                  {/* グリッド本体 */}
                  <div style={{ position: "relative", width: totalW, flexShrink: 0 }}>
                    {TT_HOURS.map((h, i) => {
                      const outside = shiftStart == null || shiftEnd == null || h < shiftStart || h >= shiftEnd;
                      return <div key={h} style={{ position: "absolute", left: i * colW, top: 0, width: colW, height: "100%", borderLeft: `1px solid ${COLORS.border}`, background: outside ? "#EEF0F3" : "#FFFFFF" }} />;
                    })}
                    {rows.map((r) => {
                      const left = (r.start - TT_HOURS[0]) * colW;
                      const width = r.dur * colW - 4;
                      const col = resColor(r.status);
                      const endH = r.start + r.dur;
                      const fmt = (h) => `${Math.floor(h)}:${String(Math.round((h % 1) * 60)).padStart(2, "0")}`;
                      return (
                        <div key={r.id} onClick={() => onOpenReservation(r)}
                          style={{ position: "absolute", top: 5, left: left + 2, width: Math.max(width, colW - 6), height: 46, background: col.bg, color: col.text, borderRadius: 8, padding: "4px 8px", overflow: "hidden", cursor: "pointer", boxShadow: "0 1px 3px rgba(0,0,0,0.15)" }}>
                          <div style={{ fontSize: 11.5, fontWeight: 800, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{r.hotel === "-" ? r.customer : r.hotel}</div>
                          <div style={{ fontSize: 9.5, opacity: 0.9, whiteSpace: "nowrap" }}>{fmt(r.start)}-{fmt(endH)} {r.customer}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {/* 現在時刻ライン(本日のみ) */}
            {showNowLine && (
              <div style={{ position: "absolute", top: 0, bottom: 0, left: nameColW + nowLeft, width: 2, background: "#3E9C74", zIndex: 3, pointerEvents: "none" }}>
                <div style={{ position: "absolute", top: -6, left: -4, width: 10, height: 10, borderRadius: "50%", background: "#3E9C74" }} />
              </div>
            )}
          </div>
        </div>
      </Card>

      <div style={{ display: "flex", gap: 16, marginTop: 12, flexWrap: "wrap", fontSize: 12, color: COLORS.textSub }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}><span style={{ width: 14, height: 14, borderRadius: 3, background: "#FFFFFF", border: `1px solid ${COLORS.border}` }} />待機中(勤務時間内)</div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}><span style={{ width: 14, height: 14, borderRadius: 3, background: "#EEF0F3", border: `1px solid ${COLORS.border}` }} />勤務時間外</div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}><span style={{ width: 14, height: 14, borderRadius: 3, background: "#3E9C74" }} />受付済</div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}><span style={{ width: 14, height: 14, borderRadius: 3, background: "#5C93C4" }} />移動中</div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}><span style={{ width: 14, height: 14, borderRadius: 3, background: "#2F6DB5" }} />接客中</div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}><span style={{ width: 2, height: 14, background: "#3E9C74" }} />現在時刻</div>
      </div>

    </div>
  );
}
