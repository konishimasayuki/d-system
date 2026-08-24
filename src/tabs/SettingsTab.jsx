import { useState } from "react";
import { AREAS, COLORS, Card, DRIVER_STATUS, DRIVER_SHIFT, SHOP_OPTIONS, CAST_CLASS_OPTIONS, INITIAL_VIEW_ROLES, TAB_DEFS, PrimaryButton, SectionTitle, SelectField, TextField, Yen, applyDay0State, generateAllReservations, generateCasts, generateDrivers, seedDemoDispatch, isoDate, DAY_DATES, parseCSV, csvEscape, readCSVFile, INITIAL_COURSES, INITIAL_OPTIONS, INITIAL_TRANSPORT_FEES, INITIAL_STAFF } from "../shared.jsx";
import { geocodeAddress } from "../mapsLoader.js";

// ============================================================
// ドライバー編集モーダル
function DriverEditModal({ driver, onClose, onSave }) {
  const [f, setF] = useState({ ...driver, shift: driver.shift || "day" });
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));
  const save = () => {
    onSave({ ...driver, name: f.name.trim() || driver.name, car: f.car.trim(), area: f.area.trim(), wage: f.wage === "" ? "" : Number(f.wage) || 0, loginId: f.loginId.trim(), password: f.password.trim(), shift: f.shift });
    onClose();
  };
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(15,23,35,0.45)", zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: "#FFF", borderRadius: 16, width: "100%", maxWidth: 420, padding: 24, boxShadow: "0 12px 40px rgba(0,0,0,0.25)" }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: COLORS.textMain, marginBottom: 16 }}>ドライバー編集</div>
        <TextField label="ドライバー名" value={f.name} onChange={(v) => set("name", v)} />
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 12, color: COLORS.textSub, marginBottom: 6, fontWeight: 600 }}>昼夜区分</div>
          <div style={{ display: "flex", gap: 8 }}>
            {Object.entries(DRIVER_SHIFT).map(([key, label]) => (
              <button key={key} onClick={() => set("shift", key)} style={{ flex: 1, padding: "9px 0", borderRadius: 8, border: `2px solid ${f.shift === key ? COLORS.accent : COLORS.border}`, background: f.shift === key ? COLORS.accentBg : "#FFF", color: f.shift === key ? COLORS.accentDark : COLORS.textSub, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
                {f.shift === key ? "✓ " : ""}{label}
              </button>
            ))}
          </div>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <div style={{ flex: 1 }}><TextField label="車両番号" value={f.car} onChange={(v) => set("car", v)} placeholder="例: 5号車" /></div>
          <div style={{ flex: 1 }}><TextField label="エリア" value={f.area || ""} onChange={(v) => set("area", v)} placeholder="例: 中央区" /></div>
        </div>
        <TextField label="時給(円)" value={f.wage === 0 ? "" : String(f.wage ?? "")} onChange={(v) => set("wage", v)} type="number" placeholder="未設定" />
        <div style={{ fontSize: 11, color: COLORS.textSub, margin: "10px 0 6px", fontWeight: 600 }}>ドライバーアプリ ログイン情報</div>
        <div style={{ display: "flex", gap: 10 }}>
          <div style={{ flex: 1 }}><TextField label="ログインID" value={f.loginId || ""} onChange={(v) => set("loginId", v)} /></div>
          <div style={{ flex: 1 }}><TextField label="パスワード" value={f.password || ""} onChange={(v) => set("password", v)} type="password" /></div>
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
          <button onClick={onClose} style={{ flex: 1, padding: "10px 0", borderRadius: 8, border: `1px solid ${COLORS.border}`, background: "transparent", color: COLORS.textSub, fontWeight: 700, fontSize: 14, cursor: "pointer" }}>キャンセル</button>
          <PrimaryButton onClick={save} style={{ flex: 1 }}>保存する</PrimaryButton>
        </div>
      </div>
    </div>
  );
}

export function DriverRegisterForm({ drivers, setDrivers }) {
  const [name, setName] = useState(""); const [car, setCar] = useState(""); const [wage, setWage] = useState("");
  const [loginId, setLoginId] = useState(""); const [password, setPassword] = useState(""); const [msg, setMsg] = useState("");
  const [driverShift, setDriverShift] = useState("day");
  const [editTarget, setEditTarget] = useState(null);
  const [csvMsg, setCsvMsg] = useState(""); const [csvBusy, setCsvBusy] = useState(false);
  const submit = () => {
    if (!name.trim()) { setMsg("ドライバー名を入力してください"); return; }
    if (!loginId.trim() || !password.trim()) { setMsg("ログインID・パスワードを入力してください(ドライバーアプリのログインに使用します)"); return; }
    setDrivers((prev) => [...prev, { id: `d${Date.now()}`, name: name.trim(), car: car.trim(), status: "waiting", area: "", pos: { x: 50, y: 50 }, note: "待機中", wage: wage === "" ? "" : (Number(wage) || 0), hours: 0, loginId: loginId.trim(), password: password.trim(), shift: driverShift }]);
    setMsg(`${name}を登録しました`); setName(""); setCar(""); setWage(""); setLoginId(""); setPassword(""); setDriverShift("day");
  };
  const removeDriver = (id) => { if (window.confirm("このドライバーを削除しますか？")) setDrivers((prev) => prev.filter((d) => d.id !== id)); };

  // CSV列: name,car,area,wage,loginId,password (差分はログインIDで判定：一意なため)
  const DRIVER_CSV_HEADER = "name,car,area,wage,loginId,password,shift";
  const exportDriverCSV = () => {
    const body = drivers.map((d) => [d.name, d.car || "", d.area || "", d.wage === "" || d.wage == null ? "" : d.wage, d.loginId || "", d.password || "", DRIVER_SHIFT[d.shift || "day"]].map(csvEscape).join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + DRIVER_CSV_HEADER + "\n" + body], { type: "text/csv;charset=utf-8;" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "drivers.csv"; a.click();
  };
  const importDriverCSV = async (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    setCsvBusy(true);
    const text = await readCSVFile(file);
    const rowsRaw = parseCSV(text);
    let start = 0;
    if (rowsRaw[0] && (rowsRaw[0][0] || "").trim().toLowerCase() === "name") start = 1;
    const shiftMap = { 昼: "day", 夜: "night", day: "day", night: "night" };
    const incoming = rowsRaw.slice(start).map((r) => ({
      name: (r[0] || "").trim(), car: (r[1] || "").trim(), area: (r[2] || "").trim(),
      wage: (r[3] || "").trim(), loginId: (r[4] || "").trim(), password: (r[5] || "").trim(),
      shift: shiftMap[(r[6] || "").trim()] || "day",
    })).filter((r) => r.name && r.loginId);
    if (incoming.length === 0) { setCsvMsg("取り込める行がありませんでした。1行目はヘッダー(name,car,area,wage,loginId,password,shift)にしてください。"); setCsvBusy(false); e.target.value = ""; return; }

    // 差分判定はログインID(loginId)で行う：同IDは上書き、CSVに無い既存IDは保持、新規IDは追加
    const byLogin = new Map(drivers.map((d) => [d.loginId, d]));
    let updated = 0, added = 0;
    incoming.forEach((inc) => {
      const ex = byLogin.get(inc.loginId);
      const wageVal = inc.wage === "" ? "" : (Number(inc.wage) || 0);
      if (ex) {
        byLogin.set(inc.loginId, { ...ex, name: inc.name, car: inc.car, area: inc.area, wage: wageVal, password: inc.password || ex.password, shift: inc.shift });
        updated++;
      } else {
        byLogin.set(inc.loginId, {
          id: `d${Date.now()}${added}`, name: inc.name, car: inc.car, status: "waiting", area: inc.area,
          pos: { x: 50, y: 50 }, note: inc.area ? `${inc.area}で待機中` : "待機中", wage: wageVal, hours: 0,
          loginId: inc.loginId, password: inc.password || "pass1234", shift: inc.shift,
        });
        added++;
      }
    });
    setDrivers(Array.from(byLogin.values()));
    setCsvBusy(false);
    setCsvMsg(`取り込み完了：更新${updated}件・新規追加${added}件(差分はログインIDで判定)。`);
    e.target.value = "";
  };

  return (
    <div>
      <Card style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, flexWrap: "wrap", gap: 8 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: COLORS.textMain }}>ドライバー一覧(全{drivers.length}名)</div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={exportDriverCSV} style={{ padding: "7px 14px", borderRadius: 8, border: `1px solid ${COLORS.accent}`, background: "transparent", color: COLORS.accent, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>CSVエクスポート</button>
            <label style={{ padding: "7px 14px", borderRadius: 8, border: "none", background: csvBusy ? "#C7D0DB" : COLORS.accent, color: "#FFF", fontSize: 12, fontWeight: 700, cursor: csvBusy ? "default" : "pointer" }}>
              {csvBusy ? "取込中…" : "CSVインポート"}
              <input type="file" accept=".csv,text/csv" onChange={importDriverCSV} disabled={csvBusy} style={{ display: "none" }} />
            </label>
          </div>
        </div>
        {csvMsg && <div style={{ marginBottom: 10, fontSize: 12, color: COLORS.accent, background: "#EDF3FA", padding: "8px 12px", borderRadius: 8 }}>{csvMsg}</div>}
        <div style={{ fontSize: 11, color: COLORS.textSub, marginBottom: 10 }}>CSV列：{DRIVER_CSV_HEADER}(shiftは「昼」「夜」) ／ 差分は<strong>ログインID</strong>で判定(同IDは上書き・新規IDは追加・CSVに無い既存は保持)</div>
        <div className="table-scroll" style={{ maxHeight: 320, overflowY: "auto", border: `1px solid ${COLORS.border}`, borderRadius: 10 }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 620 }}>
            <thead><tr style={{ background: "#EDF3FA" }}>{["車両", "氏名", "昼夜", "状態", "エリア", "時給", "ログインID", ""].map((h) => <th key={h} style={{ textAlign: "left", padding: "8px 10px", fontSize: 11, color: COLORS.textSub, fontWeight: 600, whiteSpace: "nowrap", position: "sticky", top: 0, background: "#EDF3FA" }}>{h}</th>)}</tr></thead>
            <tbody>
              {drivers.map((d) => (
                <tr key={d.id} style={{ borderTop: `1px solid ${COLORS.border}` }}>
                  <td style={{ padding: "8px 10px", fontSize: 13, fontWeight: 600, color: COLORS.textMain, whiteSpace: "nowrap" }}>{d.car || "-"}</td>
                  <td style={{ padding: "8px 10px", fontSize: 13, color: COLORS.textMain, whiteSpace: "nowrap" }}>{d.name}</td>
                  <td style={{ padding: "8px 10px", fontSize: 11 }}><span style={{ fontWeight: 700, color: (d.shift || "day") === "night" ? "#5C6BC0" : "#E08A1E" }}>{DRIVER_SHIFT[d.shift || "day"]}</span></td>
                  <td style={{ padding: "8px 10px", fontSize: 11 }}><span style={{ fontWeight: 700, color: DRIVER_STATUS[d.status]?.color }}>{DRIVER_STATUS[d.status]?.label}</span></td>
                  <td style={{ padding: "8px 10px", fontSize: 12, color: COLORS.textSub }}>{d.area || "-"}</td>
                  <td style={{ padding: "8px 10px", fontSize: 12, color: COLORS.textMain }}>{d.wage === "" || d.wage == null ? "-" : <Yen value={d.wage} />}</td>
                  <td style={{ padding: "8px 10px", fontSize: 12, color: COLORS.textSub, fontFamily: "'JetBrains Mono', monospace" }}>{d.loginId || "-"}</td>
                  <td style={{ padding: "8px 10px", whiteSpace: "nowrap" }}>
                    <button onClick={() => setEditTarget(d)} style={{ padding: "4px 10px", borderRadius: 6, border: `1px solid ${COLORS.accent}`, background: "transparent", color: COLORS.accent, fontSize: 11, fontWeight: 600, cursor: "pointer", marginRight: 6 }}>編集</button>
                    <button onClick={() => removeDriver(d.id)} style={{ padding: "4px 10px", borderRadius: 6, border: `1px solid ${COLORS.red}`, background: "transparent", color: COLORS.red, fontSize: 11, fontWeight: 600, cursor: "pointer" }}>削除</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card>
      <div style={{ fontSize: 15, fontWeight: 700, color: COLORS.textMain, marginBottom: 14 }}>ドライバー登録</div>
      <TextField label="ドライバー名" value={name} onChange={setName} placeholder="例: 山田" />
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 12, color: COLORS.textSub, marginBottom: 6, fontWeight: 600 }}>昼夜区分</div>
        <div style={{ display: "flex", gap: 8 }}>
          {Object.entries(DRIVER_SHIFT).map(([key, label]) => (
            <button key={key} onClick={() => setDriverShift(key)} style={{ flex: 1, padding: "9px 0", borderRadius: 8, border: `2px solid ${driverShift === key ? COLORS.accent : COLORS.border}`, background: driverShift === key ? COLORS.accentBg : "#FFF", color: driverShift === key ? COLORS.accentDark : COLORS.textSub, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
              {driverShift === key ? "✓ " : ""}{label}
            </button>
          ))}
        </div>
      </div>
      <div style={{ display: "flex", gap: 10 }}>
        <div style={{ flex: 1 }}><TextField label="車両番号(空欄可)" value={car} onChange={setCar} placeholder="例: 5号車" /></div>
        <div style={{ flex: 1 }}><TextField label="時給(円・空欄可)" value={wage} onChange={setWage} type="number" placeholder="未設定" /></div>
      </div>
      <div style={{ fontSize: 11, color: COLORS.textSub, margin: "10px 0 6px", fontWeight: 600 }}>ドライバーアプリ ログイン情報</div>
      <div style={{ display: "flex", gap: 10 }}>
        <div style={{ flex: 1 }}><TextField label="ログインID" value={loginId} onChange={setLoginId} placeholder="例: yamada" /></div>
        <div style={{ flex: 1 }}><TextField label="パスワード" value={password} onChange={setPassword} placeholder="半角英数字" type="password" /></div>
      </div>
      <PrimaryButton onClick={submit}>登録する</PrimaryButton>
      {msg && <div style={{ marginTop: 10, fontSize: 12, color: COLORS.green }}>{msg}</div>}
      <div style={{ fontSize: 11, color: COLORS.textSub, marginTop: 8 }}>※このID・パスワードは今後ドライバーアプリのログインに使用する想定です(現在アプリ側は仮ログインのままです)。</div>
      </Card>

      {editTarget && (
        <DriverEditModal driver={editTarget} onClose={() => setEditTarget(null)}
          onSave={(updated) => setDrivers((prev) => prev.map((d) => d.id === updated.id ? updated : d))} />
      )}
    </div>
  );
}
export function StaffRegisterForm({ staff, setStaff, isOwner, myStaffId }) {
  const [name, setName] = useState("");
  const [viewRole, setViewRoleField] = useState("operator");
  const [loginId, setLoginId] = useState(""); const [password, setPassword] = useState(""); const [msg, setMsg] = useState("");

  const add = () => {
    if (!isOwner) { setMsg("スタッフの追加は経営者のみ行えます。"); return; }
    if (!name.trim()) return;
    if (!loginId.trim() || !password.trim()) { setMsg("ログインID・パスワードを入力してください(管理システムのログインに使用します)"); return; }
    setStaff((prev) => [...prev, { id: `s${Date.now()}`, name: name.trim(), viewRole, loginId: loginId.trim(), password: password.trim() }]);
    setName(""); setLoginId(""); setPassword(""); setMsg(`${name}を登録しました`);
  };
  const remove = (id) => {
    if (!isOwner) { setMsg("スタッフの削除は経営者のみ行えます。"); return; }
    if (id === myStaffId) { setMsg("自分自身は削除できません。"); return; }
    if (!window.confirm("このスタッフを削除しますか？")) return;
    setStaff((prev) => prev.filter((s) => s.id !== id));
  };
  const updateViewRole = (id, vr) => {
    if (!isOwner) return;
    setStaff((prev) => prev.map((s) => s.id === id ? { ...s, viewRole: vr } : s));
  };

  const resetStaff = () => {
    if (!window.confirm("スタッフデータを初期値(近藤/白石/大西)に戻します。よろしいですか？")) return;
    setStaff(INITIAL_STAFF);
  };

  return (
    <Card>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: COLORS.textMain }}>スタッフ登録</div>
        {isOwner && <button onClick={resetStaff} style={{ padding: "6px 12px", borderRadius: 8, border: `1px solid ${COLORS.red}`, background: "transparent", color: COLORS.red, fontWeight: 700, fontSize: 11.5, cursor: "pointer", whiteSpace: "nowrap" }}>初期データにリセット</button>}
      </div>
      {!isOwner && <div style={{ fontSize: 12, color: COLORS.textSub, marginBottom: 10 }}>※スタッフの追加・削除・権限変更は経営者のみ行えます。</div>}
      <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 14 }}>
        {staff.map((s) => (
          <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: COLORS.textMain, padding: "6px 10px", background: "#EDF3FA", borderRadius: 8 }}>
            <span style={{ flex: 1 }}>{s.name}{s.id === myStaffId ? "(自分)" : ""}</span>
            {isOwner ? (
              <select value={s.viewRole || "operator"} onChange={(e) => updateViewRole(s.id, e.target.value)} style={{ padding: "4px 8px", borderRadius: 6, border: `1px solid ${COLORS.border}`, fontSize: 12 }}>
                {Object.entries(INITIAL_VIEW_ROLES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            ) : (
              <span style={{ fontSize: 11.5, color: COLORS.accent, fontWeight: 700 }}>{INITIAL_VIEW_ROLES[s.viewRole || "operator"]?.label}</span>
            )}
            {isOwner && s.id !== myStaffId && (
              <button onClick={() => remove(s.id)} style={{ border: "none", background: "none", color: COLORS.red, cursor: "pointer", fontSize: 15 }}>×</button>
            )}
          </div>
        ))}
      </div>
      {isOwner && (
        <>
          <TextField label="氏名" value={name} onChange={setName} placeholder="例: 田中" />
          <SelectField label="権限グループ" value={viewRole} onChange={setViewRoleField} options={Object.keys(INITIAL_VIEW_ROLES)} optionLabels={Object.fromEntries(Object.entries(INITIAL_VIEW_ROLES).map(([k, v]) => [k, v.label]))} />
          <div style={{ fontSize: 11, color: COLORS.textSub, margin: "10px 0 6px", fontWeight: 600 }}>管理システム ログイン情報</div>
          <div style={{ display: "flex", gap: 10 }}>
            <div style={{ flex: 1 }}><TextField label="ログインID" value={loginId} onChange={setLoginId} placeholder="例: tanaka" /></div>
            <div style={{ flex: 1 }}><TextField label="パスワード" value={password} onChange={setPassword} placeholder="半角英数字" type="password" /></div>
          </div>
          <PrimaryButton onClick={add}>スタッフを追加</PrimaryButton>
        </>
      )}
      {msg && <div style={{ marginTop: 10, fontSize: 12, color: msg.includes("のみ") || msg.includes("できません") ? COLORS.red : COLORS.green }}>{msg}</div>}
    </Card>
  );
}
export function MasterForm({ courses, setCourses, options, setOptions }) {
  const [shop, setShop] = useState("hitozuma");
  const [cls, setCls] = useState("standard");
  const [oName, setOName] = useState(""); const [oPrice, setOPrice] = useState("");

  const filtered = courses.filter((c) => c.shop === shop && c.castClass === cls);

  const resetPricing = () => {
    if (!window.confirm("コース料金・指名料を初期値に戻します(現在の入力内容は失われます)。よろしいですか？")) return;
    setCourses(INITIAL_COURSES);
    setOptions(INITIAL_OPTIONS);
  };

  const updateCourseField = (id, field, val) => {
    setCourses((prev) => prev.map((c) => c.id === id ? { ...c, [field]: field === "code" || field === "label" ? val : (Number(val) || 0) } : c));
  };
  const removeCourse = (id) => setCourses((prev) => prev.filter((c) => c.id !== id));
  const addCourse = () => {
    const prefix = cls === "diamond" ? "D" : "";
    setCourses((prev) => [...prev, {
      id: `co_${shop}_${cls}_new${Date.now()}`, shop, castClass: cls,
      code: `${prefix}0`, label: "新コース", price: 0, joshi: 0,
    }]);
  };

  const addOption = () => { if (!oName.trim()) return; setOptions((p) => [...p, { id: `op${Date.now()}`, name: oName.trim(), price: Number(oPrice) || 0 }]); setOName(""); setOPrice(""); };
  const removeOption = (id) => setOptions((prev) => prev.filter((o) => o.id !== id));
  const updateOptionPrice = (id, price) => setOptions((prev) => prev.map((o) => o.id === id ? { ...o, price: Number(price) || 0 } : o));

  return (
    <Card>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: COLORS.textMain }}>項目登録(コース料金・指名料)</div>
        <button onClick={resetPricing} style={{ padding: "6px 12px", borderRadius: 8, border: `1px solid ${COLORS.red}`, background: "transparent", color: COLORS.red, fontWeight: 700, fontSize: 11.5, cursor: "pointer", whiteSpace: "nowrap" }}>初期料金にリセット</button>
      </div>
      <div style={{ fontSize: 12, color: COLORS.textSub, marginBottom: 14 }}>店舗・クラスごとに料金表を管理できます。受付表でキャストを選ぶと、そのキャストの所属店舗・クラスに応じたコースが選べます。</div>

      {/* 店舗・クラス切り替え */}
      <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
        {SHOP_OPTIONS.map((s) => (
          <button key={s.key} onClick={() => setShop(s.key)} style={{ flex: 1, padding: "8px 0", borderRadius: 8, border: `1.5px solid ${shop === s.key ? COLORS.accent : COLORS.border}`, background: shop === s.key ? COLORS.accent : "#FFF", color: shop === s.key ? "#FFF" : COLORS.textSub, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>{s.label}</button>
        ))}
      </div>
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        {CAST_CLASS_OPTIONS.map((c) => (
          <button key={c.key} onClick={() => setCls(c.key)} style={{ flex: 1, padding: "8px 0", borderRadius: 8, border: `1.5px solid ${cls === c.key ? c.color : COLORS.border}`, background: cls === c.key ? c.color : "#FFF", color: cls === c.key ? "#FFF" : COLORS.textSub, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>{c.label}</button>
        ))}
      </div>

      {/* コース料金表(編集可能) */}
      <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.textMain, marginBottom: 8 }}>
        {SHOP_OPTIONS.find((s) => s.key === shop)?.label} ・ {CAST_CLASS_OPTIONS.find((c) => c.key === cls)?.label} のコース
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 12 }}>
        <div style={{ display: "flex", gap: 6, fontSize: 11, color: COLORS.textSub, padding: "0 4px" }}>
          <div style={{ width: 70 }}>記号</div><div style={{ width: 90 }}>表示名</div><div style={{ flex: 1 }}>落とし(円)</div><div style={{ flex: 1 }}>女子給(円)</div><div style={{ width: 30 }} />
        </div>
        {filtered.map((c) => (
          <div key={c.id} style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <input value={c.code} onChange={(e) => updateCourseField(c.id, "code", e.target.value)} style={{ width: 70, padding: "6px 8px", borderRadius: 6, border: `1px solid ${COLORS.border}`, fontSize: 12, fontFamily: "'JetBrains Mono', monospace" }} />
            <input value={c.label} onChange={(e) => updateCourseField(c.id, "label", e.target.value)} style={{ width: 90, padding: "6px 8px", borderRadius: 6, border: `1px solid ${COLORS.border}`, fontSize: 12 }} />
            <input value={c.price} onChange={(e) => updateCourseField(c.id, "price", e.target.value)} type="number" style={{ flex: 1, padding: "6px 8px", borderRadius: 6, border: `1px solid ${COLORS.border}`, fontSize: 12 }} />
            <input value={c.joshi} onChange={(e) => updateCourseField(c.id, "joshi", e.target.value)} type="number" style={{ flex: 1, padding: "6px 8px", borderRadius: 6, border: `1px solid ${COLORS.border}`, fontSize: 12 }} />
            <button onClick={() => removeCourse(c.id)} style={{ width: 30, border: "none", background: "none", color: COLORS.red, cursor: "pointer", fontSize: 15 }}>×</button>
          </div>
        ))}
        {filtered.length === 0 && <div style={{ fontSize: 12, color: COLORS.textSub, padding: "8px 4px" }}>コースがまだ登録されていません。</div>}
      </div>
      <button onClick={addCourse} style={{ padding: "8px 16px", borderRadius: 8, border: `1px dashed ${COLORS.accent}`, background: "transparent", color: COLORS.accent, fontWeight: 700, fontSize: 12.5, cursor: "pointer", marginBottom: 22 }}>＋ コースを追加</button>

      <div style={{ fontSize: 11, color: COLORS.textSub, marginBottom: 18, lineHeight: 1.7 }}>
        ※記号のルール：通常コースは分数のみ(60・90など)／インバウンド料金は「I」+分数(I50・I60など)／ダイヤモンドクラスは「D」+分数(D60・D90など)
      </div>

      {/* 指名料 */}
      <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.textMain, marginBottom: 8 }}>指名料(受付表の「F」欄で選択)</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 10 }}>
        {options.map((o) => (
          <div key={o.id} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: COLORS.textMain, padding: "6px 10px", background: "#EDF3FA", borderRadius: 8 }}>
            <span style={{ flex: 1 }}>{o.name}</span>
            <input value={o.price} onChange={(e) => updateOptionPrice(o.id, e.target.value)} type="number" style={{ width: 90, padding: "5px 8px", borderRadius: 6, border: `1px solid ${COLORS.border}`, fontSize: 12, textAlign: "right" }} />
            <button onClick={() => removeOption(o.id)} style={{ border: "none", background: "none", color: COLORS.red, cursor: "pointer", fontSize: 15 }}>×</button>
          </div>
        ))}
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <input value={oName} onChange={(e) => setOName(e.target.value)} placeholder="名称" style={{ flex: 2, padding: "8px 10px", borderRadius: 8, border: `1px solid ${COLORS.border}`, fontSize: 13 }} />
        <input value={oPrice} onChange={(e) => setOPrice(e.target.value)} placeholder="料金" type="number" style={{ flex: 1, padding: "8px 10px", borderRadius: 8, border: `1px solid ${COLORS.border}`, fontSize: 13 }} />
        <button onClick={addOption} style={{ padding: "0 14px", borderRadius: 8, border: "none", background: COLORS.accent, color: "#FFF", fontWeight: 700, cursor: "pointer" }}>＋</button>
      </div>
    </Card>
  );
}
// 交通費設定(区・地名・ホテル別。福岡市内453件)
export function TransportFeeForm({ transportFees, setTransportFees }) {
  const [query, setQuery] = useState("");
  const [areaFilter, setAreaFilter] = useState("すべて");

  const areas = ["すべて", ...Array.from(new Set(transportFees.map((t) => t.area)))];
  const filtered = transportFees.filter((t) =>
    (areaFilter === "すべて" || t.area === areaFilter) &&
    (query.trim() === "" || t.name.includes(query.trim()) || (t.reading || "").includes(query.trim()))
  );

  const updatePrice = (id, price) => setTransportFees((prev) => prev.map((t) => t.id === id ? { ...t, price: Number(price) || 0 } : t));
  const updateReading = (id, reading) => setTransportFees((prev) => prev.map((t) => t.id === id ? { ...t, reading } : t));
  const removeEntry = (id) => setTransportFees((prev) => prev.filter((t) => t.id !== id));
  const addEntry = () => {
    const area = areaFilter === "すべて" ? (areas[1] || "博多区") : areaFilter;
    setTransportFees((prev) => [...prev, { id: `tf_new${Date.now()}`, area, name: "新規地名", reading: "", price: 0 }]);
  };
  const resetTransport = () => {
    if (!window.confirm("交通費データを初期値(福岡市内453件)に戻します。よろしいですか？")) return;
    setTransportFees(INITIAL_TRANSPORT_FEES);
  };

  return (
    <Card>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: COLORS.textMain }}>交通費設定(区・地名・ホテル別)</div>
        <button onClick={resetTransport} style={{ padding: "6px 12px", borderRadius: 8, border: `1px solid ${COLORS.red}`, background: "transparent", color: COLORS.red, fontWeight: 700, fontSize: 11.5, cursor: "pointer", whiteSpace: "nowrap" }}>初期データにリセット</button>
      </div>
      <div style={{ fontSize: 12, color: COLORS.textSub, marginBottom: 14 }}>全{transportFees.length}件。読みを登録しておくと検索しやすくなります。受付表の交通費欄の参考にする金額を管理できます。</div>

      <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
        <select value={areaFilter} onChange={(e) => setAreaFilter(e.target.value)} style={{ padding: "8px 10px", borderRadius: 8, border: `1px solid ${COLORS.border}`, fontSize: 13 }}>
          {areas.map((a) => <option key={a} value={a}>{a}</option>)}
        </select>
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="地名・ホテル名・読みで検索" style={{ flex: 1, minWidth: 160, padding: "8px 10px", borderRadius: 8, border: `1px solid ${COLORS.border}`, fontSize: 13 }} />
        <button onClick={addEntry} style={{ padding: "8px 16px", borderRadius: 8, border: "none", background: COLORS.accent, color: "#FFF", fontWeight: 700, fontSize: 12.5, cursor: "pointer", whiteSpace: "nowrap" }}>＋ 追加</button>
      </div>

      <div style={{ maxHeight: 480, overflowY: "auto", border: `1px solid ${COLORS.border}`, borderRadius: 10 }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead><tr style={{ background: "#EDF3FA", position: "sticky", top: 0 }}>
            <th style={{ textAlign: "left", padding: "8px 12px", fontSize: 11.5, color: COLORS.textSub }}>区</th>
            <th style={{ textAlign: "left", padding: "8px 12px", fontSize: 11.5, color: COLORS.textSub }}>地名・ホテル名</th>
            <th style={{ textAlign: "left", padding: "8px 12px", fontSize: 11.5, color: COLORS.textSub }}>読み</th>
            <th style={{ textAlign: "right", padding: "8px 12px", fontSize: 11.5, color: COLORS.textSub }}>交通費(円)</th>
            <th style={{ width: 34 }} />
          </tr></thead>
          <tbody>
            {filtered.map((t) => (
              <tr key={t.id} style={{ borderTop: `1px solid ${COLORS.border}` }}>
                <td style={{ padding: "6px 12px", fontSize: 12.5, color: COLORS.textSub, whiteSpace: "nowrap" }}>{t.area}</td>
                <td style={{ padding: "6px 12px", fontSize: 13, color: COLORS.textMain }}>{t.name}</td>
                <td style={{ padding: "6px 12px" }}>
                  <input value={t.reading || ""} onChange={(e) => updateReading(t.id, e.target.value)} placeholder="よみ" style={{ width: 110, padding: "5px 8px", borderRadius: 6, border: `1px solid ${COLORS.border}`, fontSize: 12.5 }} />
                </td>
                <td style={{ padding: "6px 12px", textAlign: "right" }}>
                  <input value={t.price} onChange={(e) => updatePrice(t.id, e.target.value)} type="number" style={{ width: 90, padding: "5px 8px", borderRadius: 6, border: `1px solid ${COLORS.border}`, fontSize: 12.5, textAlign: "right" }} />
                </td>
                <td style={{ padding: "6px 8px", textAlign: "center" }}>
                  <button onClick={() => removeEntry(t.id)} style={{ border: "none", background: "none", color: COLORS.red, cursor: "pointer", fontSize: 15 }}>×</button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={4} style={{ padding: 20, textAlign: "center", color: COLORS.textSub, fontSize: 12.5 }}>該当する地名がありません。</td></tr>}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

export function SecurityToggle({ label, desc, on, set }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: `1px solid ${COLORS.border}` }}>
      <div><div style={{ fontSize: 14, color: COLORS.textMain }}>{label}</div><div style={{ fontSize: 12, color: COLORS.textSub }}>{desc}</div></div>
      <button onClick={() => set(!on)} style={{ width: 46, height: 26, borderRadius: 999, border: "none", background: on ? COLORS.accent : "#C7D0DB", position: "relative", cursor: "pointer", flexShrink: 0 }}>
        <span style={{ position: "absolute", top: 3, left: on ? 23 : 3, width: 20, height: 20, borderRadius: "50%", background: "#FFF", transition: "left 0.15s" }} />
      </button>
    </div>
  );
}
export function SecurityForm() {
  const [ipLimit, setIpLimit] = useState(true);
  const [loginReport, setLoginReport] = useState(true);
  const [opLimit, setOpLimit] = useState(false);
  return (
    <Card>
      <div style={{ fontSize: 15, fontWeight: 700, color: COLORS.textMain, marginBottom: 8 }}>セキュリティ設定</div>
      <SecurityToggle label="IPアドレス制限" desc="指定IP以外からのアクセスを遮断" on={ipLimit} set={setIpLimit} />
      <SecurityToggle label="ログインレポート通知" desc="ログイン履歴をメールで送付" on={loginReport} set={setLoginReport} />
      <SecurityToggle label="スタッフ操作制限" desc="役職ごとに操作範囲を制限" on={opLimit} set={setOpLimit} />
      <PrimaryButton style={{ marginTop: 16, width: "100%" }}>データバックアップを出力(デモ)</PrimaryButton>
    </Card>
  );
}

// 権限グループごとのタブ閲覧可否を管理(経営者のみ編集可能)
export function ViewRolePermissionForm({ viewRoles, setViewRoles, isOwner }) {
  if (!isOwner) {
    return (
      <Card>
        <div style={{ fontSize: 15, fontWeight: 700, color: COLORS.textMain, marginBottom: 8 }}>権限管理</div>
        <div style={{ fontSize: 13, color: COLORS.textSub }}>権限グループの変更は経営者のみ行えます。</div>
      </Card>
    );
  }
  const roleKeys = Object.keys(viewRoles);
  const toggle = (roleKey, tabKey) => {
    setViewRoles((prev) => {
      const cur = prev[roleKey];
      const has = cur.tabs.includes(tabKey);
      const nextTabs = has ? cur.tabs.filter((t) => t !== tabKey) : [...cur.tabs, tabKey];
      return { ...prev, [roleKey]: { ...cur, tabs: nextTabs } };
    });
  };
  const resetDefaults = () => {
    if (!window.confirm("権限設定を初期値に戻します。よろしいですか？")) return;
    setViewRoles(INITIAL_VIEW_ROLES);
  };
  return (
    <Card>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: COLORS.textMain }}>権限管理(経営者のみ変更可)</div>
        <button onClick={resetDefaults} style={{ padding: "6px 12px", borderRadius: 8, border: `1px solid ${COLORS.red}`, background: "transparent", color: COLORS.red, fontWeight: 700, fontSize: 11.5, cursor: "pointer", whiteSpace: "nowrap" }}>初期値にリセット</button>
      </div>
      <div style={{ fontSize: 12, color: COLORS.textSub, marginBottom: 14 }}>権限グループごとに、どのタブを閲覧できるか設定できます。経営者・オペレーター・キャスト・ドライバーの4種です。</div>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 560 }}>
          <thead>
            <tr style={{ background: "#EDF3FA" }}>
              <th style={{ textAlign: "left", padding: "8px 10px", fontSize: 11.5, color: COLORS.textSub }}>タブ</th>
              {roleKeys.map((rk) => <th key={rk} style={{ textAlign: "center", padding: "8px 10px", fontSize: 11.5, color: COLORS.textSub, whiteSpace: "nowrap" }}>{viewRoles[rk].label}</th>)}
            </tr>
          </thead>
          <tbody>
            {TAB_DEFS.map((t) => (
              <tr key={t.key} style={{ borderTop: `1px solid ${COLORS.border}` }}>
                <td style={{ padding: "7px 10px", fontSize: 13, color: COLORS.textMain, whiteSpace: "nowrap" }}>{t.label}{t.restricted ? <span style={{ fontSize: 10, color: COLORS.red, marginLeft: 4 }}>🔒</span> : null}</td>
                {roleKeys.map((rk) => (
                  <td key={rk} style={{ textAlign: "center", padding: "7px 10px" }}>
                    <input type="checkbox" checked={viewRoles[rk].tabs.includes(t.key)} onChange={() => toggle(rk, t.key)} style={{ width: 16, height: 16, cursor: "pointer" }} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{ fontSize: 11, color: COLORS.textSub, marginTop: 12 }}>🔒 のついたタブは、権限があってもパスワード(2911)を入力しないと開けません。</div>
    </Card>
  );
}
// ---- CSVユーティリティ ----
export function nextHotelId(hotels) { let max = 0; hotels.forEach((h) => { const n = parseInt(h.id, 10); if (!isNaN(n) && n > max) max = n; }); return String(max + 1).padStart(4, "0"); }

export function HotelForm({ hotels, setHotels, office, setOffice }) {
  const [name, setName] = useState(""); const [area, setArea] = useState(AREAS[0]); const [address, setAddress] = useState("");
  const [offAddr, setOffAddr] = useState(office.address);
  const [busy, setBusy] = useState(false); const [msg, setMsg] = useState("");
  const [geocoding, setGeocoding] = useState(false);

  const missingCount = hotels.filter((h) => h.lat == null && h.address).length;

  // 未取得ホテルの座標をまとめて取得(少しずつ・進捗表示・途中保存)
  const geocodeMissing = async () => {
    const targets = hotels.filter((h) => h.lat == null && h.address);
    if (targets.length === 0) { setMsg("未取得のホテルはありません。"); return; }
    setGeocoding(true);
    let done = 0, ok = 0, fail = 0;
    // 現在のホテル配列をコピーして、随時更新していく
    let working = hotels.map((h) => ({ ...h }));
    for (const t of targets) {
      try {
        const c = await geocodeAddress(t.address);
        const idx = working.findIndex((x) => x.id === t.id);
        if (idx >= 0) { working[idx] = { ...working[idx], lat: c.lat, lng: c.lng }; ok++; }
      } catch (e) { fail++; }
      done++;
      // 10件ごと、または最後に画面へ反映(こまめに保存され、途中で閉じても進捗が残る)
      if (done % 10 === 0 || done === targets.length) {
        setHotels(working.map((h) => ({ ...h })));
        setMsg(`座標取得中… ${done}/${targets.length}件(成功${ok}・失敗${fail})`);
        await new Promise((r) => setTimeout(r, 60)); // API負荷を抑えるため少し待つ
      }
    }
    setGeocoding(false);
    setMsg(`座標取得が完了しました。成功${ok}件・失敗${fail}件(失敗は住所をご確認ください)。実ホテルでデモ予約も作り直すには、設定右上の「リセット」を押してください。`);
  };

  const saveOffice = async () => {
    if (!offAddr.trim()) return;
    setBusy(true); setMsg("営業所の座標を取得中…");
    try { const c = await geocodeAddress(offAddr.trim()); setOffice({ address: offAddr.trim(), lat: c.lat, lng: c.lng }); setMsg("営業所を更新しました。"); }
    catch (e) { setMsg("座標の取得に失敗しました。住所をご確認ください。"); }
    setBusy(false);
  };

  const addHotel = async () => {
    if (!name.trim() || !address.trim()) { setMsg("ホテル名と住所を入力してください。"); return; }
    const id = nextHotelId(hotels);
    setBusy(true); setMsg("座標を取得中…");
    try {
      const c = await geocodeAddress(address.trim());
      setHotels((p) => [...p, { id, name: name.trim(), area, address: address.trim(), lat: c.lat, lng: c.lng }]);
      setMsg(`${name}(ID:${id})を追加しました。`);
    } catch (e) {
      setHotels((p) => [...p, { id, name: name.trim(), area, address: address.trim(), lat: null, lng: null }]);
      setMsg(`${name}(ID:${id})を追加しましたが、座標取得に失敗しました。住所をご確認ください。`);
    }
    setBusy(false); setName(""); setAddress("");
  };

  const del = (id) => setHotels((p) => p.filter((h) => h.id !== id));

  const exportCSV = () => {
    const header = "id,name,area,address";
    const body = hotels.map((h) => [h.id, h.name, h.area, h.address].map(csvEscape).join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + header + "\n" + body], { type: "text/csv;charset=utf-8;" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "hotels.csv"; a.click();
  };

  const importCSV = async (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    const text = await readCSVFile(file);
    const rows = parseCSV(text);
    let start = 0;
    if (rows[0] && (rows[0][0] || "").trim().toLowerCase() === "id") start = 1;
    const incoming = rows.slice(start).map((r) => ({ id: (r[0] || "").trim(), name: (r[1] || "").trim(), area: (r[2] || "").trim(), address: (r[3] || "").trim() })).filter((r) => r.id && r.name);
    if (incoming.length === 0) { setMsg("取り込める行がありませんでした。"); e.target.value = ""; return; }
    const map = new Map(hotels.map((h) => [h.id, h]));
    const toGeocode = [];
    incoming.forEach((inc) => {
      const ex = map.get(inc.id);
      if (ex) { const changed = ex.address !== inc.address; map.set(inc.id, { ...ex, ...inc, lat: changed ? null : ex.lat, lng: changed ? null : ex.lng }); if (changed) toGeocode.push(inc.id); }
      else { map.set(inc.id, { ...inc, lat: null, lng: null }); toGeocode.push(inc.id); }
    });
    const merged = Array.from(map.values()).sort((a, b) => a.id.localeCompare(b.id));
    setHotels(merged);
    setBusy(true); setMsg(`${incoming.length}件を取り込みました。座標を取得中…(${toGeocode.length}件)`);
    for (const id of toGeocode) {
      const h = merged.find((x) => x.id === id); if (!h || !h.address) continue;
      try { const c = await geocodeAddress(h.address); h.lat = c.lat; h.lng = c.lng; } catch (err) {}
    }
    setHotels([...merged]); setBusy(false);
    setMsg(`取り込み完了：${incoming.length}件(差分はホテルIDで判定)。`);
    e.target.value = "";
  };

  return (
    <div>
      <Card style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: COLORS.textMain, marginBottom: 4 }}>営業所(出発・戻りポイント)</div>
        <div style={{ fontSize: 12, color: COLORS.textSub, marginBottom: 12 }}>ドライバーの出発地・戻り先。配車マップの基準になります。</div>
        <TextField label="住所" value={offAddr} onChange={setOffAddr} placeholder="福岡市博多区美野島2-18-10" />
        <div style={{ fontSize: 12, color: COLORS.textSub, marginBottom: 10 }}>現在の座標：{office.lat != null ? `${office.lat.toFixed(5)}, ${office.lng.toFixed(5)}` : "未取得"}</div>
        <PrimaryButton onClick={saveOffice} disabled={busy}>住所から座標を更新</PrimaryButton>
      </Card>

      <Card>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4, flexWrap: "wrap", gap: 8 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: COLORS.textMain }}>ホテル登録(全{hotels.length}件)</div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={exportCSV} style={{ padding: "7px 12px", borderRadius: 8, border: `1px solid ${COLORS.accent}`, background: "transparent", color: COLORS.accent, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>CSVエクスポート</button>
            <label style={{ padding: "7px 12px", borderRadius: 8, border: "none", background: COLORS.accent, color: "#FFF", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
              CSVインポート
              <input type="file" accept=".csv,text/csv" onChange={importCSV} style={{ display: "none" }} />
            </label>
          </div>
        </div>
        <div style={{ fontSize: 12, color: COLORS.textSub, marginBottom: 12 }}>CSV列：id,name,area,address ／ 差分はホテルIDで判定(同一IDは上書き・新規IDは追加・CSVに無い既存は保持) ／ 変更は自動的に保存されます</div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap", padding: "10px 12px", borderRadius: 10, marginBottom: 12, background: missingCount > 0 ? "#FBF3E6" : "#EAF6EF", border: `1px solid ${missingCount > 0 ? "#E7C983" : "#BFE3CE"}` }}>
          <div style={{ fontSize: 12.5, color: COLORS.textMain, fontWeight: 600 }}>
            {missingCount > 0
              ? `座標が未取得のホテルが ${missingCount} 件あります。ルート表示にはホテルの座標が必要です。`
              : "すべてのホテルの座標が取得済みです。"}
          </div>
          <button onClick={geocodeMissing} disabled={geocoding || missingCount === 0}
            style={{ padding: "8px 14px", borderRadius: 8, border: "none", background: (geocoding || missingCount === 0) ? "#C7D0DB" : COLORS.accent, color: "#FFF", fontSize: 12.5, fontWeight: 700, cursor: (geocoding || missingCount === 0) ? "default" : "pointer", whiteSpace: "nowrap" }}>
            {geocoding ? "取得中…" : `未取得の座標をまとめて取得(${missingCount}件)`}
          </button>
        </div>

        <div className="table-scroll" style={{ maxHeight: 320, overflowY: "auto", border: `1px solid ${COLORS.border}`, borderRadius: 10, marginBottom: 16 }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 560 }}>
            <thead><tr style={{ background: "#EDF3FA" }}>{["ID", "ホテル名", "エリア", "住所", "座標", ""].map((h) => <th key={h} style={{ textAlign: "left", padding: "8px 10px", fontSize: 11, color: COLORS.textSub, fontWeight: 600, whiteSpace: "nowrap", position: "sticky", top: 0, background: "#EDF3FA" }}>{h}</th>)}</tr></thead>
            <tbody>
              {hotels.map((h) => (
                <tr key={h.id} style={{ borderTop: `1px solid ${COLORS.border}` }}>
                  <td style={{ padding: "8px 10px", fontSize: 12, fontFamily: "'JetBrains Mono', monospace", color: COLORS.textMain }}>{h.id}</td>
                  <td style={{ padding: "8px 10px", fontSize: 13, color: COLORS.textMain, fontWeight: 600, whiteSpace: "nowrap" }}>{h.name}</td>
                  <td style={{ padding: "8px 10px", fontSize: 12, color: COLORS.textSub }}>{h.area}</td>
                  <td style={{ padding: "8px 10px", fontSize: 12, color: COLORS.textSub }}>{h.address}</td>
                  <td style={{ padding: "8px 10px", fontSize: 11 }}><span style={{ color: h.lat != null ? COLORS.green : COLORS.red, fontWeight: 700 }}>{h.lat != null ? "取得済" : "未取得"}</span></td>
                  <td style={{ padding: "8px 10px" }}><button onClick={() => del(h.id)} style={{ padding: "4px 10px", borderRadius: 6, border: `1px solid ${COLORS.red}`, background: "transparent", color: COLORS.red, fontSize: 11, fontWeight: 600, cursor: "pointer" }}>削除</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.textMain, marginBottom: 8 }}>ホテルを追加</div>
        <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
          <div style={{ flex: 2 }}><TextField label="ホテル名" value={name} onChange={setName} placeholder="例: 博多〇〇ホテル" /></div>
          <div style={{ flex: 1 }}><SelectField label="エリア" value={area} onChange={setArea} options={AREAS} /></div>
        </div>
        <TextField label="住所" value={address} onChange={setAddress} placeholder="福岡市博多区〇〇1-2-3" />
        <PrimaryButton onClick={addHotel} disabled={busy}>住所から座標を取得して追加</PrimaryButton>
        {msg && <div style={{ marginTop: 10, fontSize: 12, color: busy ? COLORS.textSub : COLORS.accent }}>{msg}</div>}
      </Card>
    </div>
  );
}

export const SETTINGS_SUBTABS = [
  { key: "driver", label: "ドライバー登録" }, { key: "hotel", label: "ホテル・営業所" }, { key: "staff", label: "スタッフ登録" }, { key: "master", label: "料金設定" }, { key: "transport", label: "交通費設定" }, { key: "permissions", label: "権限管理" }, { key: "security", label: "セキュリティ" },
];
export function SettingsTab({ setCasts, drivers, setDrivers, hotels, setHotels, office, setOffice, staff, setStaff, courses, setCourses, options, setOptions, transportFees, setTransportFees, setReservations, syncMsg, viewRoles, setViewRoles, isOwner, myStaffId }) {
  const [sub, setSub] = useState("driver");
  const resetDemoData = () => {
    const coordHotels = hotels.filter((h) => h.lat != null);
    const usingReal = coordHotels.length > 15;
    const extra = usingReal
      ? `\n\n登録済みの座標付きホテル${coordHotels.length}件からデモ予約を作成します。`
      : "\n\n※現在、座標付きホテルが少ないため、デモは基本ホテルで作成されます。実ホテルも使いたい場合は、先にホテル一覧の「未取得の座標をまとめて取得」を実行してください。";
    if (!window.confirm(`キャスト・予約(本日〜10日後まで)・ドライバーを初期デモデータで上書きします。よろしいですか？(保存済みの内容は失われます)${extra}`)) return;
    const freshBase = generateCasts();
    const freshReservations = generateAllReservations(freshBase, hotels);
    const freshCasts = applyDay0State(freshBase, freshReservations);
    const freshDrivers = generateDrivers();
    const seeded = seedDemoDispatch(freshDrivers, freshReservations, isoDate(DAY_DATES[0]));
    setCasts(freshCasts);
    setReservations(seeded.reservations);
    setDrivers(seeded.drivers);
  };
  return (
    <div>
      <SectionTitle sub="ドライバー・ホテル・スタッフ・項目・セキュリティの管理。キャスト登録はキャスト一覧から行います">設定</SectionTitle>
      {syncMsg && <div style={{ marginBottom: 12, fontSize: 12, color: COLORS.red, background: "#FBEAE5", padding: "8px 12px", borderRadius: 8 }}>{syncMsg}</div>}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, flexWrap: "wrap", gap: 8 }}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {SETTINGS_SUBTABS.map((t) => <button key={t.key} onClick={() => setSub(t.key)} style={{ padding: "8px 16px", borderRadius: 8, border: `1px solid ${sub === t.key ? COLORS.accent : COLORS.border}`, background: sub === t.key ? COLORS.accent : "#FFF", color: sub === t.key ? "#FFF" : COLORS.textMain, fontWeight: 600, fontSize: 13, cursor: "pointer" }}>{t.label}</button>)}
        </div>
        <button onClick={resetDemoData} style={{ padding: "8px 14px", borderRadius: 8, border: `1px solid ${COLORS.red}`, background: "transparent", color: COLORS.red, fontWeight: 700, fontSize: 12.5, cursor: "pointer", whiteSpace: "nowrap" }}>キャスト・予約・ドライバーを初期デモデータにリセット</button>
      </div>
      {sub === "driver" && <DriverRegisterForm drivers={drivers} setDrivers={setDrivers} />}
      {sub === "hotel" && <HotelForm hotels={hotels} setHotels={setHotels} office={office} setOffice={setOffice} />}
      {sub === "staff" && <StaffRegisterForm staff={staff} setStaff={setStaff} isOwner={isOwner} myStaffId={myStaffId} />}
      {sub === "master" && <MasterForm courses={courses} setCourses={setCourses} options={options} setOptions={setOptions} />}
      {sub === "transport" && <TransportFeeForm transportFees={transportFees} setTransportFees={setTransportFees} />}
      {sub === "permissions" && <ViewRolePermissionForm viewRoles={viewRoles} setViewRoles={setViewRoles} isOwner={isOwner} />}
      {sub === "security" && <SecurityForm />}
    </div>
  );
}
