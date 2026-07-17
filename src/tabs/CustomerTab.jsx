import { useMemo, useState } from "react";
import { COLORS, CUSTOMER_COLORS, Card, SectionTitle, Yen } from "../shared.jsx";

// ============================================================
export function CustomerDetail({ customer, onQuote }) {
  return (
    <div style={{ marginTop: 10, paddingTop: 10, borderTop: `1px dashed ${COLORS.border}` }}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 20px", marginBottom: 10 }}>
        <div style={{ fontSize: 12, color: COLORS.textSub }}>電話: <span style={{ color: COLORS.textMain, fontFamily: "'JetBrains Mono', monospace" }}>{customer.phones.join(" / ")}</span></div>
        {customer.email && <div style={{ fontSize: 12, color: COLORS.textSub }}>Mail: <span style={{ color: COLORS.textMain }}>{customer.email}</span></div>}
        <div style={{ fontSize: 12, color: COLORS.textSub }}>住所: <span style={{ color: COLORS.textMain }}>{customer.address}</span></div>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <div style={{ color: COLORS.textSub, fontSize: 12 }}>直近{customer.history.length}回の利用履歴</div>
        <button onClick={() => onQuote(customer)} style={{ padding: "5px 12px", borderRadius: 8, border: `1px solid ${COLORS.accent}`, background: "transparent", color: COLORS.accent, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>履歴を引用して予約</button>
      </div>
      <div className="table-scroll">
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 560 }}>
          <thead><tr>{["利用日", "指名", "コース", "オプション", "ホテル", "料金"].map((h) => <th key={h} style={{ textAlign: "left", padding: "6px 10px", fontSize: 11, color: COLORS.textSub, fontWeight: 600, borderBottom: `1px solid ${COLORS.border}` }}>{h}</th>)}</tr></thead>
          <tbody>
            {customer.history.map((h, i) => (
              <tr key={i} style={{ borderBottom: `1px solid ${COLORS.border}` }}>
                <td style={{ padding: "6px 10px", fontSize: 12, color: COLORS.textMain, fontFamily: "'JetBrains Mono', monospace" }}>{h.date}</td>
                <td style={{ padding: "6px 10px", fontSize: 12, color: COLORS.textMain }}>{h.cast}</td>
                <td style={{ padding: "6px 10px", fontSize: 12, color: COLORS.textMain }}>{h.course}</td>
                <td style={{ padding: "6px 10px", fontSize: 12, color: COLORS.textMain }}>{h.option}</td>
                <td style={{ padding: "6px 10px", fontSize: 12, color: COLORS.textMain }}>{h.hotel}</td>
                <td style={{ padding: "6px 10px", fontSize: 12, color: COLORS.textMain }}><Yen value={h.price} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
export function CustomerManagement({ customers, setCustomers, onQuote }) {
  const [query, setQuery] = useState("");
  const [openId, setOpenId] = useState(null);
  const filtered = useMemo(() => customers.filter((c) => c.name.includes(query) || c.phones.some((p) => p.includes(query))), [customers, query]);
  const cycleColor = (id) => {
    const order = ["normal", "vip", "caution", "ng"];
    setCustomers((prev) => prev.map((c) => c.id === id ? { ...c, colorLevel: order[(order.indexOf(c.colorLevel) + 1) % order.length] } : c));
  };
  return (
    <div>
      <SectionTitle sub="名前タップで利用履歴。色ラベルで要注意客を瞬時に判別">顧客管理・NGリスト</SectionTitle>
      <input placeholder="名前・電話番号で検索" value={query} onChange={(e) => setQuery(e.target.value)} style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: `1px solid ${COLORS.border}`, background: "#FFFFFF", color: COLORS.textMain, fontSize: 14, marginBottom: 16, boxSizing: "border-box" }} />
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {filtered.map((c) => {
          const cl = CUSTOMER_COLORS[c.colorLevel];
          return (
            <Card key={c.id} style={{ borderColor: c.colorLevel === "normal" ? COLORS.border : cl.color, background: cl.bg === "transparent" ? COLORS.panel : cl.bg }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
                <div style={{ cursor: "pointer", flex: 1, minWidth: 200 }} onClick={() => setOpenId(openId === c.id ? null : c.id)}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ color: COLORS.accent, fontSize: 15, fontWeight: 600, textDecoration: "underline" }}>{c.name}</span>
                    <span style={{ fontSize: 11, color: cl.color, background: `${cl.color}1F`, padding: "2px 8px", borderRadius: 999, fontWeight: 700 }}>{cl.label}</span>
                  </div>
                  <div style={{ color: COLORS.textSub, fontSize: 12, marginTop: 2 }}>{c.phones[0]} ・ 来店{c.visits}回 ・ 最終来店 {c.lastVisit}</div>
                  {c.note && <div style={{ color: COLORS.textMain, fontSize: 12, marginTop: 4 }}>{c.note}</div>}
                </div>
                <button onClick={() => cycleColor(c.id)} style={{ padding: "8px 14px", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer", border: `1px solid ${cl.color}`, background: "transparent", color: cl.color, flexShrink: 0 }}>色区分を変更</button>
              </div>
              {openId === c.id && <CustomerDetail customer={c} onQuote={onQuote} />}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
