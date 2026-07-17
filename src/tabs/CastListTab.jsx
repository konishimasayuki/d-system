import { useState } from "react";
import { COLORS, Card, Modal, PrimaryButton, SectionTitle, SelectField, TextField, castFullName, isoDate } from "../shared.jsx";

// ============================================================
export function CastDetailModal({ cast, onClose, onSave }) {
  const [f, setF] = useState({ ...cast, okText: cast.okOptions.join("、") });
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));
  const save = () => {
    onSave({ ...cast, sei: f.sei, name: f.name, honmyo: f.honmyo, age: Number(f.age) || cast.age, birthday: f.birthday, phone: f.phone, address: f.address, idType: f.idType, idNo: f.idNo, joinDate: f.joinDate, itakuRate: (Number(f.ratePct) || Math.round(cast.itakuRate * 100)) / 100, idVerified: f.idVerified, okOptions: f.okText.split(/[、,]/).map((s) => s.trim()).filter(Boolean) });
    onClose();
  };
  return (
    <Modal title={`${castFullName(cast)} の詳細・編集`} onClose={onClose} wide>
      <div style={{ display: "flex", gap: 10 }}>
        <div style={{ flex: 1 }}><TextField label="源氏名(姓)" value={f.sei} onChange={(v) => set("sei", v)} /></div>
        <div style={{ flex: 1 }}><TextField label="源氏名(名)" value={f.name} onChange={(v) => set("name", v)} /></div>
      </div>
      <TextField label="本名" value={f.honmyo} onChange={(v) => set("honmyo", v)} />
      <div style={{ display: "flex", gap: 10 }}>
        <div style={{ flex: 1 }}><TextField label="生年月日" value={f.birthday} onChange={(v) => set("birthday", v)} placeholder="2000-01-01" /></div>
        <div style={{ flex: 1 }}><TextField label="年齢" value={f.age} onChange={(v) => set("age", v)} type="number" /></div>
      </div>
      <TextField label="電話番号" value={f.phone} onChange={(v) => set("phone", v)} />
      <TextField label="住所" value={f.address} onChange={(v) => set("address", v)} />
      <div style={{ display: "flex", gap: 10 }}>
        <div style={{ flex: 1 }}><SelectField label="身分証の種類" value={f.idType} onChange={(v) => set("idType", v)} options={["運転免許証", "マイナンバーカード", "パスポート", "健康保険証"]} /></div>
        <div style={{ flex: 1 }}><TextField label="身分証番号" value={f.idNo} onChange={(v) => set("idNo", v)} /></div>
      </div>
      <div style={{ display: "flex", gap: 10 }}>
        <div style={{ flex: 1 }}><TextField label="入店日" value={f.joinDate} onChange={(v) => set("joinDate", v)} /></div>
        <div style={{ flex: 1 }}><TextField label="委託率(%)" value={f.ratePct ?? Math.round(cast.itakuRate * 100)} onChange={(v) => set("ratePct", v)} type="number" /></div>
      </div>
      <TextField label="対応可能オプション(、区切り)" value={f.okText} onChange={(v) => set("okText", v)} placeholder="指名、本指名、延長30分" />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", margin: "6px 0 14px" }}>
        <span style={{ fontSize: 13, color: COLORS.textMain }}>身分証の確認</span>
        <button onClick={() => set("idVerified", !f.idVerified)} style={{ width: 46, height: 26, borderRadius: 999, border: "none", background: f.idVerified ? COLORS.accent : "#C7D0DB", position: "relative", cursor: "pointer" }}>
          <span style={{ position: "absolute", top: 3, left: f.idVerified ? 23 : 3, width: 20, height: 20, borderRadius: "50%", background: "#FFF" }} />
        </button>
      </div>
      <PrimaryButton onClick={save} style={{ width: "100%" }}>保存する</PrimaryButton>
    </Modal>
  );
}

export function CastRegisterModal({ onClose, onCreate }) {
  const [f, setF] = useState({
    sei: "", name: "", honmyo: "", birthday: "", age: "20", phone: "", address: "",
    idType: "運転免許証", idNo: "", joinDate: isoDate(new Date()), ratePct: "55", okText: "指名", idVerified: false,
  });
  const [msg, setMsg] = useState("");
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));
  const submit = () => {
    if (!f.name.trim()) { setMsg("源氏名(名)を入力してください"); return; }
    onCreate({
      id: `c${Date.now()}`, sei: f.sei.trim(), name: f.name.trim(), honmyo: f.honmyo.trim(),
      age: Number(f.age) || 20, birthday: f.birthday || "-", status: "before_shift",
      phone: f.phone || "090-0000-0000", address: f.address || "-",
      idType: f.idType, idNo: f.idNo || "-", joinDate: f.joinDate,
      shiftStart: "-", shiftEnd: "-", hotel: null, todayCount: 0, todaySales: 0,
      itakuRate: (Number(f.ratePct) || 55) / 100, idVerified: f.idVerified,
      stdLast: isoDate(new Date()), okOptions: f.okText.split(/[、,]/).map((s) => s.trim()).filter(Boolean), comment: "",
    });
    onClose();
  };
  return (
    <Modal title="キャスト新規登録" onClose={onClose} wide>
      <div style={{ display: "flex", gap: 10 }}>
        <div style={{ flex: 1 }}><TextField label="源氏名(姓)" value={f.sei} onChange={(v) => set("sei", v)} placeholder="任意(姓なしも可)" /></div>
        <div style={{ flex: 1 }}><TextField label="源氏名(名)" value={f.name} onChange={(v) => set("name", v)} placeholder="例: みさき" /></div>
      </div>
      <TextField label="本名" value={f.honmyo} onChange={(v) => set("honmyo", v)} placeholder="例: 山田 花子" />
      <div style={{ display: "flex", gap: 10 }}>
        <div style={{ flex: 1 }}><TextField label="生年月日" value={f.birthday} onChange={(v) => set("birthday", v)} placeholder="2000-01-01" /></div>
        <div style={{ flex: 1 }}><TextField label="年齢" value={f.age} onChange={(v) => set("age", v)} type="number" /></div>
      </div>
      <TextField label="電話番号" value={f.phone} onChange={(v) => set("phone", v)} placeholder="090-0000-0000" />
      <TextField label="住所" value={f.address} onChange={(v) => set("address", v)} />
      <div style={{ display: "flex", gap: 10 }}>
        <div style={{ flex: 1 }}><SelectField label="身分証の種類" value={f.idType} onChange={(v) => set("idType", v)} options={["運転免許証", "マイナンバーカード", "パスポート", "健康保険証"]} /></div>
        <div style={{ flex: 1 }}><TextField label="身分証番号" value={f.idNo} onChange={(v) => set("idNo", v)} /></div>
      </div>
      <div style={{ display: "flex", gap: 10 }}>
        <div style={{ flex: 1 }}><TextField label="入店日" value={f.joinDate} onChange={(v) => set("joinDate", v)} /></div>
        <div style={{ flex: 1 }}><TextField label="委託率(%)" value={f.ratePct} onChange={(v) => set("ratePct", v)} type="number" /></div>
      </div>
      <TextField label="対応可能オプション(、区切り)" value={f.okText} onChange={(v) => set("okText", v)} placeholder="指名、本指名、延長30分" />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", margin: "6px 0 14px" }}>
        <span style={{ fontSize: 13, color: COLORS.textMain }}>身分証の確認</span>
        <button onClick={() => set("idVerified", !f.idVerified)} style={{ width: 46, height: 26, borderRadius: 999, border: "none", background: f.idVerified ? COLORS.accent : "#C7D0DB", position: "relative", cursor: "pointer" }}>
          <span style={{ position: "absolute", top: 3, left: f.idVerified ? 23 : 3, width: 20, height: 20, borderRadius: "50%", background: "#FFF" }} />
        </button>
      </div>
      {msg && <div style={{ color: COLORS.red, fontSize: 12.5, marginBottom: 8 }}>{msg}</div>}
      <PrimaryButton onClick={submit} style={{ width: "100%" }}>登録する</PrimaryButton>
      <div style={{ fontSize: 11, color: COLORS.textSub, marginTop: 8 }}>登録直後は「出勤前」状態になります。シフト・状態は出勤管理・タイムテーブルから設定してください。</div>
    </Modal>
  );
}

export function CastList({ casts, setCasts }) {
  const [query, setQuery] = useState("");
  const [detailId, setDetailId] = useState(null);
  const [registerOpen, setRegisterOpen] = useState(false);
  const rows = casts.filter((c) => castFullName(c).includes(query) || c.honmyo.includes(query));
  const detailCast = casts.find((c) => c.id === detailId);
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 10 }}>
        <SectionTitle sub={`在籍キャストの名簿。詳細ボタンで個人情報の確認・編集(全${casts.length}名)`}>キャスト一覧</SectionTitle>
        <PrimaryButton onClick={() => setRegisterOpen(true)}>＋ 新規登録</PrimaryButton>
      </div>
      <input placeholder="源氏名・本名で検索" value={query} onChange={(e) => setQuery(e.target.value)} style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: `1px solid ${COLORS.border}`, background: "#FFFFFF", color: COLORS.textMain, fontSize: 14, marginBottom: 16, boxSizing: "border-box" }} />
      <Card style={{ padding: 0, overflow: "hidden" }}>
        <div className="table-scroll">
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 820 }}>
            <thead><tr style={{ background: "#EDF3FA" }}>{["源氏名", "本名", "年齢", "電話番号", "委託率", "身分証", "対応可能オプション", ""].map((h) => <th key={h} style={{ textAlign: "left", padding: "12px 14px", fontSize: 12, color: COLORS.textSub, fontWeight: 600, borderBottom: `1px solid ${COLORS.border}`, whiteSpace: "nowrap" }}>{h}</th>)}</tr></thead>
            <tbody>
              {rows.map((c) => (
                <tr key={c.id} style={{ borderBottom: `1px solid ${COLORS.border}` }}>
                  <td style={{ padding: "12px 14px", color: COLORS.textMain, fontSize: 14, fontWeight: 600, whiteSpace: "nowrap" }}>{castFullName(c)}</td>
                  <td style={{ padding: "12px 14px", color: COLORS.textMain, fontSize: 13, whiteSpace: "nowrap" }}>{c.honmyo}</td>
                  <td style={{ padding: "12px 14px", color: COLORS.textMain, fontSize: 13 }}>{c.age}</td>
                  <td style={{ padding: "12px 14px", color: COLORS.textMain, fontSize: 13, fontFamily: "'JetBrains Mono', monospace", whiteSpace: "nowrap" }}>{c.phone}</td>
                  <td style={{ padding: "12px 14px", color: COLORS.textMain, fontSize: 13 }}>{Math.round(c.itakuRate * 100)}%</td>
                  <td style={{ padding: "12px 14px", fontSize: 12 }}><span style={{ color: c.idVerified ? COLORS.green : COLORS.red, fontWeight: 700 }}>{c.idVerified ? "確認済" : "未確認"}</span></td>
                  <td style={{ padding: "12px 14px" }}>
                    <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>{c.okOptions.map((o) => <span key={o} style={{ fontSize: 11, color: COLORS.accent, background: COLORS.accentBg, padding: "2px 8px", borderRadius: 999, whiteSpace: "nowrap" }}>{o}</span>)}</div>
                  </td>
                  <td style={{ padding: "12px 14px" }}>
                    <button onClick={() => setDetailId(c.id)} style={{ padding: "6px 14px", borderRadius: 8, border: `1px solid ${COLORS.accent}`, background: "transparent", color: COLORS.accent, fontSize: 12, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" }}>詳細</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      <div style={{ fontSize: 11, color: COLORS.textSub, marginTop: 10 }}>※本名・生年月日・住所・身分証は個人情報です。役職に応じた操作制限(設定→セキュリティ)の対象です。</div>
      {detailCast && <CastDetailModal cast={detailCast} onClose={() => setDetailId(null)} onSave={(u) => setCasts((prev) => prev.map((x) => x.id === u.id ? u : x))} />}
      {registerOpen && <CastRegisterModal onClose={() => setRegisterOpen(false)} onCreate={(newCast) => setCasts((prev) => [...prev, newCast])} />}
    </div>
  );
}
