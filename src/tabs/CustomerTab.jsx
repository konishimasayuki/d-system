import { useMemo, useState } from "react";
import { COLORS, CUSTOMER_COLORS, Card, SectionTitle, Yen } from "../shared.jsx";

// ============================================================
// 顧客名簿(テーブル形式・スクショ参考)
//  ID / 顧客名 / 電話番号 / 出禁フラグ / 初回利用 / 最終利用 / 利用回数 / 売上
// ============================================================

// 顧客詳細・編集モーダル
function CustomerModal({ customer, onClose, onSave, onQuote }) {
  const [name, setName] = useState(customer?.name || "");
  const [phone, setPhone] = useState(customer?.phones?.[0] || "");
  const [note, setNote] = useState(customer?.note || "");
  const [colorLevel, setColorLevel] = useState(customer?.colorLevel || "normal");
  const isNew = !customer?.id;
  const save = () => {
    onSave({ ...(customer || {}), name: name.trim() || "新規顧客", phones: [phone.trim()].filter(Boolean), note, colorLevel, id: customer?.id || `u${Date.now()}`, numId: customer?.numId || Date.now(), visits: customer?.visits || 0, firstVisit: customer?.firstVisit || new Date().toISOString().slice(0, 10), lastVisit: customer?.lastVisit || new Date().toISOString().slice(0, 10), totalSales: customer?.totalSales || 0, history: customer?.history || [] });
    onClose();
  };
  const cl = CUSTOMER_COLORS[colorLevel];
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(15,23,35,0.45)", zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: "#FFF", borderRadius: 16, width: "100%", maxWidth: 460, padding: 24, boxShadow: "0 12px 40px rgba(0,0,0,0.25)", maxHeight: "90vh", overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div style={{ fontSize: 17, fontWeight: 700, color: COLORS.textMain }}>{isNew ? "顧客を新規追加" : "顧客情報の編集"}</div>
          <button onClick={onClose} style={{ border: "none", background: "none", fontSize: 20, cursor: "pointer", color: COLORS.textSub }}>×</button>
        </div>
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 12, color: COLORS.textSub, marginBottom: 4, fontWeight: 600 }}>顧客名</div>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="例: 田中" style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: `1px solid ${COLORS.border}`, fontSize: 14, boxSizing: "border-box" }} />
        </div>
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 12, color: COLORS.textSub, marginBottom: 4, fontWeight: 600 }}>電話番号</div>
          <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="090-XXXX-XXXX" style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: `1px solid ${COLORS.border}`, fontSize: 14, boxSizing: "border-box", fontFamily: "'JetBrains Mono', monospace" }} />
        </div>
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 12, color: COLORS.textSub, marginBottom: 4, fontWeight: 600 }}>顧客ランク / 出禁</div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {Object.entries(CUSTOMER_COLORS).map(([key, v]) => (
              <button key={key} onClick={() => setColorLevel(key)} style={{ padding: "6px 14px", borderRadius: 999, border: `2px solid ${colorLevel === key ? v.color : COLORS.border}`, background: colorLevel === key ? `${v.color}1F` : "#FFF", color: colorLevel === key ? v.color : COLORS.textSub, fontWeight: 700, fontSize: 12, cursor: "pointer" }}>{v.label}</button>
            ))}
          </div>
        </div>
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 12, color: COLORS.textSub, marginBottom: 4, fontWeight: 600 }}>メモ</div>
          <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} placeholder="対応上の注意など" style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: `1px solid ${COLORS.border}`, fontSize: 13, boxSizing: "border-box", resize: "vertical", fontFamily: "inherit" }} />
        </div>
        {!isNew && customer.history?.length > 0 && (
          <button onClick={() => { onQuote(customer); onClose(); }} style={{ width: "100%", marginBottom: 12, padding: "10px 0", borderRadius: 10, border: `1px solid ${COLORS.accent}`, background: "transparent", color: COLORS.accent, fontWeight: 700, fontSize: 14, cursor: "pointer" }}>履歴を引用して予約</button>
        )}
        <button onClick={save} style={{ width: "100%", padding: "12px 0", borderRadius: 10, border: "none", background: COLORS.accent, color: "#FFF", fontWeight: 700, fontSize: 15, cursor: "pointer" }}>保存する</button>
        {!isNew && customer.history?.length > 0 && (
          <div style={{ marginTop: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.textMain, marginBottom: 10 }}>利用履歴</div>
            <div className="table-scroll">
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 440 }}>
                <thead><tr style={{ background: "#EDF3FA" }}>{["利用日", "指名", "コース", "料金"].map((h) => <th key={h} style={{ textAlign: "left", padding: "7px 10px", fontSize: 11, color: COLORS.textSub, fontWeight: 600 }}>{h}</th>)}</tr></thead>
                <tbody>
                  {customer.history.map((h, i) => (
                    <tr key={i} style={{ borderTop: `1px solid ${COLORS.border}` }}>
                      <td style={{ padding: "7px 10px", fontSize: 12, fontFamily: "'JetBrains Mono', monospace" }}>{h.date}</td>
                      <td style={{ padding: "7px 10px", fontSize: 12 }}>{h.cast}</td>
                      <td style={{ padding: "7px 10px", fontSize: 12 }}>{h.course}</td>
                      <td style={{ padding: "7px 10px", fontSize: 12 }}><Yen value={h.price} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function CustomerManagement({ customers, setCustomers, onQuote }) {
  const [query, setQuery] = useState("");
  const [phoneQ, setPhoneQ] = useState("");
  const [sortKey, setSortKey] = useState("numId");
  const [sortDir, setSortDir] = useState(-1); // -1=降順 / 1=昇順
  const [editTarget, setEditTarget] = useState(null); // null=非表示 / "new" / customerObj
  const [page, setPage] = useState(1);
  const PER = 30;

  const filtered = useMemo(() => {
    let list = customers;
    if (query.trim()) list = list.filter((c) => c.name.includes(query) || c.phones.some((p) => p.includes(query)));
    if (phoneQ.trim()) list = list.filter((c) => c.phones.some((p) => p.replace(/-/g, "").includes(phoneQ.replace(/-/g, ""))));
    list = [...list].sort((a, b) => {
      let av = a[sortKey] ?? 0, bv = b[sortKey] ?? 0;
      if (typeof av === "string") return sortDir * av.localeCompare(bv, "ja");
      return sortDir * (bv - av);
    });
    return list;
  }, [customers, query, phoneQ, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER));
  const paged = filtered.slice((page - 1) * PER, page * PER);

  const sort = (key) => { if (sortKey === key) setSortDir((d) => -d); else { setSortKey(key); setSortDir(-1); } setPage(1); };
  const sortIcon = (key) => sortKey === key ? (sortDir === -1 ? " ▼" : " ▲") : " ⇅";

  const save = (c) => {
    setCustomers((prev) => prev.find((x) => x.id === c.id) ? prev.map((x) => x.id === c.id ? c : x) : [...prev, c]);
  };
  const remove = (id) => { if (window.confirm("この顧客を削除しますか？")) setCustomers((prev) => prev.filter((c) => c.id !== id)); };

  const COL_HEADER = (label, key) => (
    <th onClick={() => sort(key)} style={{ textAlign: "left", padding: "10px 12px", fontSize: 12, color: COLORS.textSub, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap", userSelect: "none", position: "sticky", top: 0, background: "#EDF3FA", zIndex: 1 }}>{label}<span style={{ fontSize: 10 }}>{sortIcon(key)}</span></th>
  );

  return (
    <div>
      <SectionTitle sub={`全${customers.length}件 ・ 名前クリックで編集・履歴表示`}>顧客名簿</SectionTitle>

      {/* 検索バー */}
      <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
        <input placeholder="名前で検索" value={query} onChange={(e) => { setQuery(e.target.value); setPage(1); }} style={{ flex: 2, minWidth: 140, padding: "9px 13px", borderRadius: 10, border: `1px solid ${COLORS.border}`, fontSize: 13, background: "#FFF" }} />
        <input placeholder="電話番号で検索" value={phoneQ} onChange={(e) => { setPhoneQ(e.target.value); setPage(1); }} style={{ flex: 2, minWidth: 140, padding: "9px 13px", borderRadius: 10, border: `1px solid ${COLORS.border}`, fontSize: 13, background: "#FFF", fontFamily: "'JetBrains Mono', monospace" }} />
        <button onClick={() => setEditTarget("new")} style={{ padding: "9px 18px", borderRadius: 10, border: "none", background: COLORS.accent, color: "#FFF", fontWeight: 700, fontSize: 13, cursor: "pointer", whiteSpace: "nowrap" }}>＋ 新規追加</button>
      </div>

      {/* テーブル */}
      <Card style={{ padding: 0, overflow: "hidden" }}>
        <div className="table-scroll" style={{ maxHeight: "62vh", overflowY: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 720 }}>
            <thead>
              <tr style={{ background: "#EDF3FA", borderBottom: `2px solid ${COLORS.border}` }}>
                {COL_HEADER("ID", "numId")}
                {COL_HEADER("顧客名", "name")}
                {COL_HEADER("電話番号", "phones")}
                <th style={{ padding: "10px 12px", fontSize: 12, color: COLORS.textSub, fontWeight: 600, whiteSpace: "nowrap", position: "sticky", top: 0, background: "#EDF3FA" }}>出禁</th>
                {COL_HEADER("初回利用", "firstVisit")}
                {COL_HEADER("最終利用", "lastVisit")}
                {COL_HEADER("利用回数", "visits")}
                {COL_HEADER("売上合計", "totalSales")}
                <th style={{ padding: "10px 12px", position: "sticky", top: 0, background: "#EDF3FA" }} />
              </tr>
            </thead>
            <tbody>
              {paged.map((c) => {
                const cl = CUSTOMER_COLORS[c.colorLevel];
                const isNg = c.colorLevel === "ng";
                const isVip = c.colorLevel === "vip";
                return (
                  <tr key={c.id} style={{ borderBottom: `1px solid ${COLORS.border}`, background: isNg ? "rgba(192,73,43,0.05)" : "#FFF" }}>
                    <td style={{ padding: "10px 12px", fontSize: 12, color: COLORS.textSub, fontFamily: "'JetBrains Mono', monospace", whiteSpace: "nowrap" }}>{c.numId ?? c.id}</td>
                    <td style={{ padding: "10px 12px", whiteSpace: "nowrap" }}>
                      <button onClick={() => setEditTarget(c)} style={{ background: "none", border: "none", padding: 0, color: COLORS.accent, fontSize: 14, fontWeight: 600, cursor: "pointer", textDecoration: "underline" }}>{c.name}</button>
                      {isVip && <span style={{ marginLeft: 6, fontSize: 10, fontWeight: 700, color: "#C47F00", background: "rgba(196,127,0,0.12)", padding: "1px 7px", borderRadius: 999 }}>VIP</span>}
                      {c.note && <div style={{ fontSize: 11, color: COLORS.textSub, marginTop: 2 }}>{c.note}</div>}
                    </td>
                    <td style={{ padding: "10px 12px", fontSize: 13, fontFamily: "'JetBrains Mono', monospace", whiteSpace: "nowrap" }}>{c.phones[0]}</td>
                    <td style={{ padding: "10px 12px", textAlign: "center" }}>
                      {isNg && <span style={{ fontSize: 11, fontWeight: 700, color: "#FFF", background: cl.color, padding: "2px 9px", borderRadius: 999 }}>出禁</span>}
                    </td>
                    <td style={{ padding: "10px 12px", fontSize: 12, color: COLORS.textSub, whiteSpace: "nowrap" }}>{c.firstVisit}</td>
                    <td style={{ padding: "10px 12px", fontSize: 12, color: COLORS.textSub, whiteSpace: "nowrap" }}>{c.lastVisit}</td>
                    <td style={{ padding: "10px 12px", fontSize: 13, fontWeight: 600, color: COLORS.textMain, textAlign: "right" }}>{c.visits}</td>
                    <td style={{ padding: "10px 12px", fontSize: 13, fontWeight: 600, color: COLORS.textMain, textAlign: "right" }}><Yen value={c.totalSales || 0} /></td>
                    <td style={{ padding: "10px 12px", whiteSpace: "nowrap" }}>
                      <button onClick={() => remove(c.id)} title="削除" style={{ border: "none", background: "none", cursor: "pointer", color: COLORS.red, fontSize: 16, padding: "0 4px" }}>🗑</button>
                    </td>
                  </tr>
                );
              })}
              {paged.length === 0 && <tr><td colSpan={9} style={{ padding: 32, textAlign: "center", color: COLORS.textSub, fontSize: 13 }}>該当する顧客が見つかりません。</td></tr>}
            </tbody>
          </table>
        </div>
      </Card>

      {/* ページネーション */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 12, flexWrap: "wrap", gap: 8 }}>
        <div style={{ fontSize: 12, color: COLORS.textSub }}>{filtered.length}件中 {(page - 1) * PER + 1}〜{Math.min(page * PER, filtered.length)}件を表示</div>
        <div style={{ display: "flex", gap: 6 }}>
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} style={{ padding: "6px 12px", borderRadius: 8, border: `1px solid ${COLORS.border}`, background: "#FFF", cursor: page === 1 ? "default" : "pointer", color: page === 1 ? COLORS.border : COLORS.textMain, fontWeight: 600 }}>‹</button>
          <span style={{ padding: "6px 12px", fontSize: 13, color: COLORS.textMain, fontWeight: 600 }}>{page} / {totalPages}</span>
          <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} style={{ padding: "6px 12px", borderRadius: 8, border: `1px solid ${COLORS.border}`, background: "#FFF", cursor: page === totalPages ? "default" : "pointer", color: page === totalPages ? COLORS.border : COLORS.textMain, fontWeight: 600 }}>›</button>
        </div>
      </div>

      {/* 編集モーダル */}
      {editTarget && (
        <CustomerModal
          customer={editTarget === "new" ? null : editTarget}
          onClose={() => setEditTarget(null)}
          onSave={save}
          onQuote={onQuote}
        />
      )}
    </div>
  );
}
