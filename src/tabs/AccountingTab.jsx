import { useState } from "react";
import { COLORS, Card, JOURNAL_DICT, PrimaryButton, SectionTitle, SelectField, StatCard, TextField, Yen } from "../shared.jsx";

// ============================================================
export function AccountingTab({ casts, drivers, expenses, setExpenses }) {
  const [subtab, setSubtab] = useState("shiwake");
  const [method, setMethod] = useState("総額"); // 総額 / 純額
  const [settle, setSettle] = useState("事務所渡し"); // 清算方法
  const [dictKey, setDictKey] = useState(JOURNAL_DICT[0].key);
  const [amount, setAmount] = useState("");

  const sales = casts.reduce((a, c) => a + c.todaySales, 0);
  const itaku = casts.reduce((a, c) => a + Math.round(c.todaySales * c.itakuRate), 0);
  const driverWage = drivers.reduce((a, d) => a + d.wage * d.hours, 0);
  const totalExpense = expenses.reduce((a, e) => a + e.amount, 0) + driverWage;
  const netSales = method === "総額" ? sales : sales - itaku;
  const grossProfit = method === "総額" ? netSales - itaku : netSales;
  const operatingProfit = grossProfit - totalExpense;

  // 委託費の貸方科目(清算方法で変わる)
  const itakuCredit = settle === "キャスト請求" ? "未払金" : "現金";

  // 仕訳帳(日報締切で自動作成)
  const journal = [];
  if (method === "総額") {
    journal.push({ date: "6/30", debit: "現金", dr: sales, credit: "売上高", cr: sales, memo: "日報締切・総額売上" });
    journal.push({ date: "6/30", debit: "外注費(委託費)", dr: itaku, credit: itakuCredit, cr: itaku, memo: `キャスト報酬(${settle})` });
  } else {
    journal.push({ date: "6/30", debit: "現金", dr: netSales, credit: "売上高", cr: netSales, memo: "日報締切・純額売上(店落ち)" });
  }
  journal.push({ date: "6/30", debit: "給料手当", dr: driverWage, credit: "現金", cr: driverWage, memo: "ドライバー時給" });
  expenses.forEach((e) => journal.push({ date: e.date.slice(5), debit: e.account, dr: e.amount, credit: "現金", cr: e.amount, memo: e.memo }));

  const addFromDict = () => {
    const amt = Number(amount); if (!amt) return;
    const d = JOURNAL_DICT.find((x) => x.key === dictKey);
    setExpenses((prev) => [...prev, { id: `e${prev.length + 1}`, date: "2026-06-30", account: d.debit, amount: amt, memo: d.memo }]);
    setAmount("");
  };

  const subtabs = [{ key: "shiwake", label: "仕訳帳" }, { key: "pl", label: "損益計算書" }, { key: "bs", label: "貸借対照表" }, { key: "input", label: "経費入力" }];

  return (
    <div>
      <SectionTitle sub="日報締切で売上仕訳を自動作成。財務諸表まで自動化">会計</SectionTitle>
      <Card style={{ marginBottom: 16 }}>
        <div className="grid-3">
          <SelectField label="売上計上方法" value={method} onChange={setMethod} options={["総額", "純額"]} />
          <SelectField label="キャスト報酬清算" value={settle} onChange={setSettle} options={["事務所渡し", "ドライバー経由渡し", "キャスト請求"]} />
          <div style={{ display: "flex", alignItems: "flex-end", paddingBottom: 12 }}>
            <div style={{ fontSize: 12, color: COLORS.textSub }}>ドライバー時給計:<br /><span style={{ color: COLORS.textMain, fontFamily: "'JetBrains Mono', monospace" }}>¥{driverWage.toLocaleString()}</span></div>
          </div>
        </div>
      </Card>
      <div className="grid-4" style={{ marginBottom: 18 }}>
        <StatCard label={method === "総額" ? "売上高(総額)" : "売上高(純額)"} value={<Yen value={netSales} />} color={COLORS.accent} />
        <StatCard label="委託費" value={<Yen value={itaku} />} color={COLORS.green} />
        <StatCard label="経費計" value={<Yen value={totalExpense} />} color={COLORS.blue} />
        <StatCard label="営業利益" value={<Yen value={operatingProfit} />} color={operatingProfit >= 0 ? COLORS.textMain : COLORS.red} />
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        {subtabs.map((t) => <button key={t.key} onClick={() => setSubtab(t.key)} style={{ padding: "8px 16px", borderRadius: 8, border: `1px solid ${subtab === t.key ? COLORS.accent : COLORS.border}`, background: subtab === t.key ? COLORS.accent : "#FFF", color: subtab === t.key ? "#FFF" : COLORS.textMain, fontWeight: 600, fontSize: 13, cursor: "pointer" }}>{t.label}</button>)}
      </div>

      {subtab === "shiwake" && (
        <Card style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", borderBottom: `1px solid ${COLORS.border}` }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: COLORS.textMain }}>仕訳帳(日報締切で自動作成)</span>
            <button style={{ padding: "6px 12px", borderRadius: 8, border: `1px solid ${COLORS.green}`, background: "transparent", color: COLORS.green, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Excel書き出し(デモ)</button>
          </div>
          <div className="table-scroll">
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 640 }}>
              <thead><tr style={{ background: "#EDF3FA" }}>{["日付", "借方科目", "借方金額", "貸方科目", "貸方金額", "摘要"].map((h) => <th key={h} style={{ textAlign: "left", padding: "10px 14px", fontSize: 12, color: COLORS.textSub, fontWeight: 600 }}>{h}</th>)}</tr></thead>
              <tbody>
                {journal.map((j, i) => (
                  <tr key={i} style={{ borderBottom: `1px solid ${COLORS.border}` }}>
                    <td style={{ padding: "10px 14px", fontSize: 12, color: COLORS.textMain, fontFamily: "'JetBrains Mono', monospace" }}>{j.date}</td>
                    <td style={{ padding: "10px 14px", fontSize: 12, color: COLORS.textMain }}>{j.debit}</td>
                    <td style={{ padding: "10px 14px", fontSize: 12, color: COLORS.textMain }}><Yen value={j.dr} /></td>
                    <td style={{ padding: "10px 14px", fontSize: 12, color: COLORS.textMain }}>{j.credit}</td>
                    <td style={{ padding: "10px 14px", fontSize: 12, color: COLORS.textMain }}><Yen value={j.cr} /></td>
                    <td style={{ padding: "10px 14px", fontSize: 12, color: COLORS.textSub }}>{j.memo}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {subtab === "pl" && (
        <Card>
          <div style={{ fontSize: 15, fontWeight: 700, color: COLORS.textMain, marginBottom: 14 }}>損益計算書(P/L)</div>
          {[
            ["売上高", netSales, false],
            [method === "総額" ? "売上原価(委託費)" : "(委託費は売上相殺済)", method === "総額" ? itaku : 0, true],
            ["売上総利益", grossProfit, false, true],
            ["販売費及び一般管理費", totalExpense, true],
            ["営業利益", operatingProfit, false, true],
          ].map((row, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: `1px solid ${COLORS.border}`, fontWeight: row[3] ? 700 : 400 }}>
              <span style={{ fontSize: 13, color: COLORS.textMain }}>{row[0]}</span>
              <span style={{ fontSize: 13, color: row[3] ? COLORS.accent : COLORS.textMain, fontFamily: "'JetBrains Mono', monospace" }}>{row[2] ? "△ " : ""}<Yen value={row[1]} /></span>
            </div>
          ))}
        </Card>
      )}

      {subtab === "bs" && (
        <div className="grid-2">
          <Card>
            <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.textMain, marginBottom: 12 }}>資産の部</div>
            {[["現金", operatingProfit + totalExpense], ["普通預金", 1200000], ["備品", 350000]].map((r, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: `1px solid ${COLORS.border}` }}><span style={{ fontSize: 13, color: COLORS.textMain }}>{r[0]}</span><span style={{ fontSize: 13, color: COLORS.textMain, fontFamily: "'JetBrains Mono', monospace" }}><Yen value={r[1]} /></span></div>
            ))}
          </Card>
          <Card>
            <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.textMain, marginBottom: 12 }}>負債・純資産の部</div>
            {[["未払金", settle === "キャスト請求" ? itaku : 0], ["資本金", 1000000], ["利益剰余金", operatingProfit + 550000]].map((r, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: `1px solid ${COLORS.border}` }}><span style={{ fontSize: 13, color: COLORS.textMain }}>{r[0]}</span><span style={{ fontSize: 13, color: COLORS.textMain, fontFamily: "'JetBrains Mono', monospace" }}><Yen value={r[1]} /></span></div>
            ))}
          </Card>
          <div style={{ gridColumn: "1 / -1", fontSize: 11, color: COLORS.textSub }}>※デモ用の簡易貸借対照表です</div>
        </div>
      )}

      {subtab === "input" && (
        <div className="grid-2">
          <Card style={{ padding: 0, overflow: "hidden" }}>
            <div style={{ padding: "14px 16px", fontSize: 13, fontWeight: 700, color: COLORS.textMain, borderBottom: `1px solid ${COLORS.border}` }}>経費一覧</div>
            <div className="table-scroll">
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 380 }}>
                <thead><tr style={{ background: "#EDF3FA" }}>{["科目", "金額", "摘要"].map((h) => <th key={h} style={{ textAlign: "left", padding: "10px 14px", fontSize: 12, color: COLORS.textSub, fontWeight: 600 }}>{h}</th>)}</tr></thead>
                <tbody>{expenses.map((e) => <tr key={e.id} style={{ borderBottom: `1px solid ${COLORS.border}` }}><td style={{ padding: "10px 14px", fontSize: 12, color: COLORS.textMain }}>{e.account}</td><td style={{ padding: "10px 14px", fontSize: 12, color: COLORS.textMain }}><Yen value={e.amount} /></td><td style={{ padding: "10px 14px", fontSize: 12, color: COLORS.textSub }}>{e.memo}</td></tr>)}</tbody>
              </table>
            </div>
          </Card>
          <Card>
            <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.textMain, marginBottom: 6 }}>仕訳辞書から入力</div>
            <div style={{ fontSize: 12, color: COLORS.textSub, marginBottom: 12 }}>よく使う仕訳をテンプレから簡単登録</div>
            <SelectField label="仕訳テンプレート" value={dictKey} onChange={setDictKey} options={JOURNAL_DICT.map((d) => d.key)} />
            <div style={{ fontSize: 11, color: COLORS.textSub, marginTop: -6, marginBottom: 12 }}>借)
              {JOURNAL_DICT.find((d) => d.key === dictKey)?.debit} / 貸){JOURNAL_DICT.find((d) => d.key === dictKey)?.credit}</div>
            <TextField label="金額" value={amount} onChange={setAmount} placeholder="例: 5000" type="number" />
            <PrimaryButton onClick={addFromDict} style={{ width: "100%" }}>仕訳を登録</PrimaryButton>
          </Card>
        </div>
      )}
    </div>
  );
}
