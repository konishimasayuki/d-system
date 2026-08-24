import { useEffect, useRef, useState } from "react";
import {
  COLORS, Card, SectionTitle, castFullName, castShops,
  staffThreadId, castThreadId, fetchThread, sendMessage, unreadCount, markThreadRead,
} from "../shared.jsx";

// ============================================================
// 本部側メッセージタブ
//  左: スレッド一覧(スタッフ／人妻専科／博多ココでグループ分け・新着順・未読バッジ)
//  右: チャット画面(本部として送信)
// ============================================================

const GROUPS = [
  { key: "staff", label: "スタッフ" },
  { key: "hitozuma", label: "人妻専科" },
  { key: "hakata", label: "博多ココ" },
];

function fmtTime(ts) {
  const d = new Date(ts);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  if (sameDay) return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

export function MessageTab({ drivers, casts }) {
  const [group, setGroup] = useState("staff");
  const [threads, setThreads] = useState({}); // threadId -> messages[]
  const [loaded, setLoaded] = useState(false);
  const [activeId, setActiveId] = useState(null); // { kind: "staff"|"cast", personId }
  const [input, setInput] = useState("");
  const bottomRef = useRef(null);

  // 対象者一覧(グループごと)
  const people = group === "staff"
    ? drivers.map((d) => ({ id: d.id, name: d.name, sub: d.car || "-", threadId: staffThreadId(d.id), kind: "staff" }))
    : casts.filter((c) => castShops(c).includes(group)).map((c) => ({ id: c.id, name: castFullName(c), sub: c.honmyo, threadId: castThreadId(c.id), kind: "cast" }));

  // 全スレッドを読み込み(グループ切替のたびに)
  useEffect(() => {
    let cancelled = false;
    setLoaded(false);
    (async () => {
      const entries = await Promise.all(people.map(async (p) => [p.threadId, await fetchThread(p.threadId)]));
      if (cancelled) return;
      const map = {};
      entries.forEach(([tid, msgs]) => { map[tid] = msgs; });
      setThreads(map);
      setLoaded(true);
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [group, drivers.length, casts.length]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ block: "end" }); }, [activeId, threads]);

  // 新着順(最終メッセージの時刻)にソート
  const sortedPeople = [...people].sort((a, b) => {
    const am = threads[a.threadId] || []; const bm = threads[b.threadId] || [];
    const at = am.length ? new Date(am[am.length - 1].ts).getTime() : 0;
    const bt = bm.length ? new Date(bm[bm.length - 1].ts).getTime() : 0;
    return bt - at;
  });

  const activePerson = people.find((p) => p.threadId === activeId);
  const activeMessages = activeId ? (threads[activeId] || []) : [];

  const openThread = async (p) => {
    setActiveId(p.threadId);
    const cur = threads[p.threadId] || [];
    if (unreadCount(cur, "office") > 0) {
      const next = await markThreadRead(p.threadId, cur, "office");
      setThreads((prev) => ({ ...prev, [p.threadId]: next }));
    }
  };

  const send = async () => {
    if (!input.trim() || !activeId) return;
    const cur = threads[activeId] || [];
    const next = await sendMessage(activeId, cur, "office", input.trim());
    setThreads((prev) => ({ ...prev, [activeId]: next }));
    setInput("");
  };

  const groupUnread = (g) => {
    const list = g === "staff" ? drivers.map((d) => staffThreadId(d.id)) : casts.filter((c) => castShops(c).includes(g)).map((c) => castThreadId(c.id));
    return list.reduce((a, tid) => a + unreadCount(threads[tid] || (g === group ? [] : []), "office"), 0);
  };

  return (
    <div>
      <SectionTitle sub="スタッフ・キャストと1対1でメッセージのやり取りができます(文章のみ)">メッセージ</SectionTitle>

      {/* グループ切り替え */}
      <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
        {GROUPS.map((g) => {
          const badge = group === g.key ? 0 : 0; // 現在表示中グループの未読は下のリストで見えるため、非表示グループのバッジのみ計算
          return (
            <button key={g.key} onClick={() => { setGroup(g.key); setActiveId(null); }}
              style={{
                padding: "8px 20px", borderRadius: "8px 8px 0 0", border: `1px solid ${COLORS.border}`,
                borderBottom: group === g.key ? "none" : `1px solid ${COLORS.border}`,
                background: group === g.key ? "#FFF" : "#EDF3FA",
                color: group === g.key ? COLORS.accent : COLORS.textSub,
                fontWeight: 700, fontSize: 13, cursor: "pointer", position: "relative", top: 1,
              }}>{g.label}</button>
          );
        })}
      </div>

      <Card style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ display: "flex", height: "70vh", minHeight: 420 }}>
          {/* スレッド一覧 */}
          <div style={{ width: 260, flexShrink: 0, borderRight: `1px solid ${COLORS.border}`, overflowY: "auto" }}>
            {!loaded ? (
              <div style={{ padding: 20, textAlign: "center", color: COLORS.textSub, fontSize: 12.5 }}>読み込み中…</div>
            ) : sortedPeople.length === 0 ? (
              <div style={{ padding: 20, textAlign: "center", color: COLORS.textSub, fontSize: 12.5 }}>該当する人がいません</div>
            ) : sortedPeople.map((p) => {
              const msgs = threads[p.threadId] || [];
              const last = msgs[msgs.length - 1];
              const unread = unreadCount(msgs, "office");
              const isActive = activeId === p.threadId;
              return (
                <button key={p.threadId} onClick={() => openThread(p)}
                  style={{ display: "block", width: "100%", textAlign: "left", padding: "10px 14px", border: "none", borderBottom: `1px solid ${COLORS.border}`, background: isActive ? "#EDF3FA" : "#FFF", cursor: "pointer" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 13.5, fontWeight: 700, color: COLORS.textMain }}>{p.name}</span>
                    {unread > 0 && <span style={{ fontSize: 10, fontWeight: 700, color: "#FFF", background: COLORS.red, borderRadius: 999, padding: "1px 7px", minWidth: 16, textAlign: "center" }}>{unread}</span>}
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: 3 }}>
                    <span style={{ fontSize: 11.5, color: COLORS.textSub, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 150 }}>{last ? (last.from === "office" ? "自分: " : "") + last.text : p.sub}</span>
                    {last && <span style={{ fontSize: 10, color: COLORS.textSub, flexShrink: 0 }}>{fmtTime(last.ts)}</span>}
                  </div>
                </button>
              );
            })}
          </div>

          {/* チャット画面 */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
            {!activePerson ? (
              <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: COLORS.textSub, fontSize: 13 }}>左の一覧から相手を選んでください</div>
            ) : (
              <>
                <div style={{ padding: "12px 16px", borderBottom: `1px solid ${COLORS.border}`, fontSize: 14, fontWeight: 700, color: COLORS.textMain }}>{activePerson.name}</div>
                <div style={{ flex: 1, overflowY: "auto", padding: "14px 16px", display: "flex", flexDirection: "column", gap: 10 }}>
                  {activeMessages.length === 0 && <div style={{ textAlign: "center", color: COLORS.textSub, fontSize: 12.5, marginTop: 20 }}>まだメッセージはありません</div>}
                  {activeMessages.map((m) => (
                    <div key={m.id} style={{ display: "flex", justifyContent: m.from === "office" ? "flex-end" : "flex-start" }}>
                      <div style={{ maxWidth: "70%" }}>
                        <div style={{ padding: "8px 12px", borderRadius: 14, background: m.from === "office" ? COLORS.accent : "#EDF0F4", color: m.from === "office" ? "#FFF" : COLORS.textMain, fontSize: 13.5, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{m.text}</div>
                        <div style={{ fontSize: 10, color: COLORS.textSub, marginTop: 3, textAlign: m.from === "office" ? "right" : "left" }}>{fmtTime(m.ts)}</div>
                      </div>
                    </div>
                  ))}
                  <div ref={bottomRef} />
                </div>
                <div style={{ display: "flex", gap: 8, padding: 12, borderTop: `1px solid ${COLORS.border}` }}>
                  <textarea value={input} onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
                    rows={1} placeholder="メッセージを入力(Enterで送信)"
                    style={{ flex: 1, padding: "10px 12px", borderRadius: 10, border: `1px solid ${COLORS.border}`, fontSize: 13.5, resize: "none", fontFamily: "inherit" }} />
                  <button onClick={send} style={{ padding: "0 20px", borderRadius: 10, border: "none", background: COLORS.accent, color: "#FFF", fontWeight: 700, fontSize: 13.5, cursor: "pointer" }}>送信</button>
                </div>
              </>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}

// タブバッジ用：本部側の全未読件数(スタッフ+人妻専科+博多ココ)を数える
export async function fetchOfficeTotalUnread(drivers, casts) {
  const ids = [
    ...drivers.map((d) => staffThreadId(d.id)),
    ...casts.map((c) => castThreadId(c.id)),
  ];
  const threads = await Promise.all(ids.map((id) => fetchThread(id)));
  return threads.reduce((a, msgs) => a + unreadCount(msgs, "office"), 0);
}
