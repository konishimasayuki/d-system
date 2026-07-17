import { useState } from "react";
import { AREAS, COLORS, Card, PrimaryButton, ROLES, SectionTitle, SelectField, TextField, Yen, applyDay0State, generateAllReservations, generateCasts } from "../shared.jsx";
import { geocodeAddress } from "../mapsLoader.js";

// ============================================================
export function DriverRegisterForm({ setDrivers }) {
  const [name, setName] = useState(""); const [car, setCar] = useState(""); const [wage, setWage] = useState("1300");
  const [loginId, setLoginId] = useState(""); const [password, setPassword] = useState(""); const [msg, setMsg] = useState("");
  const submit = () => {
    if (!name.trim() || !car.trim()) { setMsg("名前と車両番号を入力してください"); return; }
    if (!loginId.trim() || !password.trim()) { setMsg("ログインID・パスワードを入力してください(ドライバーアプリのログインに使用します)"); return; }
    setDrivers((prev) => [...prev, { id: `d${prev.length + 1}`, name: name.trim(), car: car.trim(), status: "waiting", pos: { x: 50, y: 50 }, note: "待機中", wage: Number(wage) || 1300, hours: 0, loginId: loginId.trim(), password: password.trim() }]);
    setMsg(`${name}(${car}) を登録しました`); setName(""); setCar(""); setLoginId(""); setPassword("");
  };
  return (
    <Card>
      <div style={{ fontSize: 15, fontWeight: 700, color: COLORS.textMain, marginBottom: 14 }}>ドライバー登録</div>
      <TextField label="ドライバー名" value={name} onChange={setName} placeholder="例: 山田" />
      <div style={{ display: "flex", gap: 10 }}>
        <div style={{ flex: 1 }}><TextField label="車両番号" value={car} onChange={setCar} placeholder="例: 5号車" /></div>
        <div style={{ flex: 1 }}><TextField label="時給(円)" value={wage} onChange={setWage} type="number" /></div>
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
  );
}
export function StaffRegisterForm({ staff, setStaff }) {
  const [name, setName] = useState(""); const [role, setRole] = useState(ROLES[0]);
  const [loginId, setLoginId] = useState(""); const [password, setPassword] = useState(""); const [msg, setMsg] = useState("");
  const add = () => {
    if (!name.trim()) return;
    if (!loginId.trim() || !password.trim()) { setMsg("ログインID・パスワードを入力してください(管理システムのログインに使用します)"); return; }
    setStaff((prev) => [...prev, { id: `s${prev.length + 1}`, name: name.trim(), role, loginId: loginId.trim(), password: password.trim() }]);
    setName(""); setLoginId(""); setPassword(""); setMsg(`${name}を登録しました`);
  };
  return (
    <Card>
      <div style={{ fontSize: 15, fontWeight: 700, color: COLORS.textMain, marginBottom: 14 }}>スタッフ登録(役職別)</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 14 }}>
        {staff.map((s) => <div key={s.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: COLORS.textMain, padding: "6px 10px", background: "#EDF3FA", borderRadius: 8 }}><span>{s.name}</span><span style={{ color: COLORS.textSub }}>{s.role}</span></div>)}
      </div>
      <TextField label="氏名" value={name} onChange={setName} placeholder="例: 田中" />
      <SelectField label="役職" value={role} onChange={setRole} options={ROLES} />
      <div style={{ fontSize: 11, color: COLORS.textSub, margin: "10px 0 6px", fontWeight: 600 }}>管理システム ログイン情報</div>
      <div style={{ display: "flex", gap: 10 }}>
        <div style={{ flex: 1 }}><TextField label="ログインID" value={loginId} onChange={setLoginId} placeholder="例: tanaka" /></div>
        <div style={{ flex: 1 }}><TextField label="パスワード" value={password} onChange={setPassword} placeholder="半角英数字" type="password" /></div>
      </div>
      <PrimaryButton onClick={add}>スタッフを追加</PrimaryButton>
      {msg && <div style={{ marginTop: 10, fontSize: 12, color: COLORS.green }}>{msg}</div>}
      <div style={{ fontSize: 11, color: COLORS.textSub, marginTop: 8 }}>※このID・パスワードは今後スタッフごとのログインに使用する想定です(現在は仮の管理画面のままログイン不要です)。</div>
    </Card>
  );
}
export function MasterForm({ courses, setCourses, options, setOptions }) {
  const [cName, setCName] = useState(""); const [cPrice, setCPrice] = useState("");
  const [oName, setOName] = useState(""); const [oPrice, setOPrice] = useState("");
  const addCourse = () => { if (!cName.trim()) return; setCourses((p) => [...p, { id: `co${p.length + 1}`, name: cName.trim(), price: Number(cPrice) || 0 }]); setCName(""); setCPrice(""); };
  const addOption = () => { if (!oName.trim()) return; setOptions((p) => [...p, { id: `op${p.length + 1}`, name: oName.trim(), price: Number(oPrice) || 0 }]); setOName(""); setOPrice(""); };
  return (
    <Card>
      <div style={{ fontSize: 15, fontWeight: 700, color: COLORS.textMain, marginBottom: 6 }}>項目登録(コース・オプション)</div>
      <div style={{ fontSize: 12, color: COLORS.textSub, marginBottom: 14 }}>店舗の運営形態にあわせて自由に登録できます</div>
      <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.textMain, marginBottom: 8 }}>コース</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 10 }}>{courses.map((c) => <div key={c.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: COLORS.textMain, padding: "6px 10px", background: "#EDF3FA", borderRadius: 8 }}><span>{c.name}</span><Yen value={c.price} /></div>)}</div>
      <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
        <input value={cName} onChange={(e) => setCName(e.target.value)} placeholder="名称" style={{ flex: 2, padding: "8px 10px", borderRadius: 8, border: `1px solid ${COLORS.border}`, fontSize: 13 }} />
        <input value={cPrice} onChange={(e) => setCPrice(e.target.value)} placeholder="料金" type="number" style={{ flex: 1, padding: "8px 10px", borderRadius: 8, border: `1px solid ${COLORS.border}`, fontSize: 13 }} />
        <button onClick={addCourse} style={{ padding: "0 14px", borderRadius: 8, border: "none", background: COLORS.accent, color: "#FFF", fontWeight: 700, cursor: "pointer" }}>＋</button>
      </div>
      <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.textMain, marginBottom: 8 }}>オプション</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 10 }}>{options.map((o) => <div key={o.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: COLORS.textMain, padding: "6px 10px", background: "#EDF3FA", borderRadius: 8 }}><span>{o.name}</span><Yen value={o.price} /></div>)}</div>
      <div style={{ display: "flex", gap: 8 }}>
        <input value={oName} onChange={(e) => setOName(e.target.value)} placeholder="名称" style={{ flex: 2, padding: "8px 10px", borderRadius: 8, border: `1px solid ${COLORS.border}`, fontSize: 13 }} />
        <input value={oPrice} onChange={(e) => setOPrice(e.target.value)} placeholder="料金" type="number" style={{ flex: 1, padding: "8px 10px", borderRadius: 8, border: `1px solid ${COLORS.border}`, fontSize: 13 }} />
        <button onClick={addOption} style={{ padding: "0 14px", borderRadius: 8, border: "none", background: COLORS.accent, color: "#FFF", fontWeight: 700, cursor: "pointer" }}>＋</button>
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
// ---- CSVユーティリティ ----
export function csvEscape(v) { const s = String(v ?? ""); return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; }
export function parseCSV(text) {
  const rows = []; const lines = String(text).replace(/\r\n/g, "\n").split("\n").filter((l) => l.trim().length);
  for (const line of lines) {
    const cells = []; let cur = ""; let q = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (q) { if (ch === '"') { if (line[i + 1] === '"') { cur += '"'; i++; } else q = false; } else cur += ch; }
      else { if (ch === ",") { cells.push(cur); cur = ""; } else if (ch === '"') { q = true; } else cur += ch; }
    }
    cells.push(cur); rows.push(cells);
  }
  return rows;
}
export function nextHotelId(hotels) { let max = 0; hotels.forEach((h) => { const n = parseInt(h.id, 10); if (!isNaN(n) && n > max) max = n; }); return String(max + 1).padStart(4, "0"); }

export function HotelForm({ hotels, setHotels, office, setOffice }) {
  const [name, setName] = useState(""); const [area, setArea] = useState(AREAS[0]); const [address, setAddress] = useState("");
  const [offAddr, setOffAddr] = useState(office.address);
  const [busy, setBusy] = useState(false); const [msg, setMsg] = useState("");

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

  const importCSV = (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const rows = parseCSV(String(reader.result).replace(/^\uFEFF/, ""));
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
    reader.readAsText(file);
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
  { key: "driver", label: "ドライバー登録" }, { key: "hotel", label: "ホテル・営業所" }, { key: "staff", label: "スタッフ登録" }, { key: "master", label: "項目登録" }, { key: "security", label: "セキュリティ" },
];
export function SettingsTab({ setCasts, setDrivers, hotels, setHotels, office, setOffice, staff, setStaff, courses, setCourses, options, setOptions, setReservations, syncMsg }) {
  const [sub, setSub] = useState("driver");
  const resetDemoData = () => {
    if (!window.confirm("キャスト一覧と予約(本日〜10日後まで)を初期デモデータで上書きします。よろしいですか？(保存済みの内容は失われます)")) return;
    const freshBase = generateCasts();
    const freshReservations = generateAllReservations(freshBase);
    const freshCasts = applyDay0State(freshBase, freshReservations);
    setCasts(freshCasts);
    setReservations(freshReservations);
  };
  return (
    <div>
      <SectionTitle sub="ドライバー・ホテル・スタッフ・項目・セキュリティの管理。キャスト登録はキャスト一覧から行います">設定</SectionTitle>
      {syncMsg && <div style={{ marginBottom: 12, fontSize: 12, color: COLORS.red, background: "#FBEAE5", padding: "8px 12px", borderRadius: 8 }}>{syncMsg}</div>}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, flexWrap: "wrap", gap: 8 }}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {SETTINGS_SUBTABS.map((t) => <button key={t.key} onClick={() => setSub(t.key)} style={{ padding: "8px 16px", borderRadius: 8, border: `1px solid ${sub === t.key ? COLORS.accent : COLORS.border}`, background: sub === t.key ? COLORS.accent : "#FFF", color: sub === t.key ? "#FFF" : COLORS.textMain, fontWeight: 600, fontSize: 13, cursor: "pointer" }}>{t.label}</button>)}
        </div>
        <button onClick={resetDemoData} style={{ padding: "8px 14px", borderRadius: 8, border: `1px solid ${COLORS.red}`, background: "transparent", color: COLORS.red, fontWeight: 700, fontSize: 12.5, cursor: "pointer", whiteSpace: "nowrap" }}>キャスト・予約を初期デモデータにリセット</button>
      </div>
      {sub === "driver" && <DriverRegisterForm setDrivers={setDrivers} />}
      {sub === "hotel" && <HotelForm hotels={hotels} setHotels={setHotels} office={office} setOffice={setOffice} />}
      {sub === "staff" && <StaffRegisterForm staff={staff} setStaff={setStaff} />}
      {sub === "master" && <MasterForm courses={courses} setCourses={setCourses} options={options} setOptions={setOptions} />}
      {sub === "security" && <SecurityForm />}
    </div>
  );
}
