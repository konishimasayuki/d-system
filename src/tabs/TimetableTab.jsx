import { useEffect, useRef, useState } from "react";
import { CAST_STATUS, COLORS, Card, DAY_DATES, Modal, NUM_DAYS, PrimaryButton, SectionTitle, CastAvatar, useCastThumbs, castFullName, dayLabel, daySchedule, isoDate, parseTimeToHour } from "../shared.jsx";

// ============================================================
export function CastMemoModal({ cast, onClose, onSave }) {
  const [text, setText] = useState(cast.comment || "");
  return (
    <Modal title={`${castFullName(cast)} のメモ`} onClose={onClose}>
      <textarea value={text} onChange={(e) => setText(e.target.value)} rows={4} placeholder="対応上の注意事項・特記事項など" style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: `1px solid ${COLORS.border}`, fontSize: 13, boxSizing: "border-box", resize: "vertical", fontFamily: "inherit", marginBottom: 12 }} />
      <PrimaryButton onClick={() => { onSave(text); onClose(); }} style={{ width: "100%" }}>保存する</PrimaryButton>
    </Modal>
  );
}

// ============================================================
// タイムテーブル(24時間営業・本日〜10日後まで日付切替対応)
//  白=待機中／グレー=勤務時間外／色付き=予約中(クリックで詳細)
//  本日のみ状態プルダウン・メモが編集可能。翌日以降は予定表示のみ
// ============================================================
export const TT_HOURS = Array.from({ length: 30 }, (_, i) => i); // 0:00〜翌5:00(29時)まで表示

export function Timetable({ reservations, casts, setCasts, onOpenReservation }) {
  const colW = 60;
  const nameColW = 150;
  const [now, setNow] = useState(new Date());
  const [memoCast, setMemoCast] = useState(null);
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
    : daySchedule(dayIndex).map((e) => ({ castId: casts[e.castIndex]?.id, cast: casts[e.castIndex], shiftStart: e.shiftStart, shiftEnd: e.shiftEnd })).filter((r) => r.cast);

  const dayReservations = reservations.filter((r) => r.date === dateStr);
  const thumbs = useCastThumbs(rowsForDay.map((r) => r.castId));

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
          <div style={{ minWidth: 108, textAlign: "center", fontSize: 14, fontWeight: 700, color: COLORS.textMain, background: "#EDF3FA", borderRadius: 8, padding: "6px 10px" }}>{isToday ? "本日 " : ""}{dayLabel(DAY_DATES[dayIndex])}</div>
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
                <div key={castId} style={{ display: "flex", borderBottom: `1px solid ${COLORS.border}`, position: "relative", height: 56 }}>
                  {/* 名前列 */}
                  <div style={{ width: nameColW, padding: "6px 10px", flexShrink: 0, display: "flex", alignItems: "center", gap: 8, background: "#FAFBFD", position: "sticky", left: 0, zIndex: 3, borderRight: `1px solid ${COLORS.border}` }}>
                    <CastAvatar cast={c} photo={thumbs[c.id]} size={30} radius={8} />
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 12.5, fontWeight: 700, color: COLORS.textMain, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{castFullName(c)}</div>
                      {isToday ? (
                        <div style={{ display: "flex", gap: 4, alignItems: "center", marginTop: 2 }}>
                          {(() => { const s = CAST_STATUS[c.status] || CAST_STATUS.off; return <span style={{ fontSize: 10, fontWeight: 700, color: s.color, background: s.bg, padding: "1px 8px", borderRadius: 999, whiteSpace: "nowrap" }}>{s.label}</span>; })()}
                          <button onClick={() => setMemoCast(c)} title="メモ" style={{ fontSize: 9, border: `1px solid ${c.comment ? COLORS.accent : COLORS.border}`, borderRadius: 6, padding: "1px 5px", color: c.comment ? COLORS.accent : COLORS.textSub, background: "#FFF", cursor: "pointer" }}>メモ</button>
                        </div>
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

      {memoCast && <CastMemoModal cast={memoCast} onClose={() => setMemoCast(null)} onSave={(text) => setCasts((prev) => prev.map((x) => x.id === memoCast.id ? { ...x, comment: text } : x))} />}
    </div>
  );
}
