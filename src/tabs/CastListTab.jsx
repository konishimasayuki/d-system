import { useState } from "react";
import { COLORS, Card, Modal, PrimaryButton, SectionTitle, SelectField, TextField, CastAvatar, useCastPhotos, useCastThumbs, fileToPhotoSet, castFullName, kanaNormalize, truncateName, SHOP_OPTIONS, castShops, CAST_CLASS_OPTIONS, castClass, castClassInfo, isoDate, parseCSV, csvEscape, readCSVFile } from "../shared.jsx";

// キャストの写真管理(最大10枚・縦3:4)。詳細モーダル内で使用
function CastPhotoManager({ castId }) {
  const { photos, setPhotos, loaded } = useCastPhotos(castId);
  const [busy, setBusy] = useState(false);
  const [thumbList, setThumbList] = useState([]); // photosと同順のサムネ(1枚目保存用)
  const MAX = 10;

  // photos変更後、1枚目のサムネを添えて保存する
  const commit = (nextPhotos, nextThumbs) => {
    setThumbList(nextThumbs);
    setPhotos(nextPhotos, nextThumbs[0]);
  };

  const onPick = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setBusy(true);
    const room = MAX - photos.length;
    const use = files.slice(0, room);
    const nextPhotos = [...photos];
    const nextThumbs = [...thumbList];
    for (const file of use) {
      try { const set = await fileToPhotoSet(file); nextPhotos.push(set.full); nextThumbs.push(set.thumb); } catch (err) {}
    }
    commit(nextPhotos, nextThumbs);
    setBusy(false);
    e.target.value = "";
  };
  const remove = (i) => {
    const nextPhotos = photos.filter((_, idx) => idx !== i);
    const nextThumbs = thumbList.filter((_, idx) => idx !== i);
    commit(nextPhotos, nextThumbs);
  };
  const makeFirst = (i) => {
    if (i === 0) return;
    const nextPhotos = [...photos]; const [p] = nextPhotos.splice(i, 1); nextPhotos.unshift(p);
    const nextThumbs = [...thumbList]; const [t] = nextThumbs.splice(i, 1); nextThumbs.unshift(t);
    commit(nextPhotos, nextThumbs);
  };
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: COLORS.textMain }}>写真({photos.length}/{MAX})</span>
        {photos.length < MAX && (
          <label style={{ padding: "6px 12px", borderRadius: 8, border: "none", background: COLORS.accent, color: "#FFF", fontSize: 12, fontWeight: 700, cursor: busy ? "default" : "pointer" }}>
            {busy ? "追加中…" : "＋ 写真を追加"}
            <input type="file" accept="image/*" multiple onChange={onPick} disabled={busy} style={{ display: "none" }} />
          </label>
        )}
      </div>
      {!loaded ? (
        <div style={{ fontSize: 12, color: COLORS.textSub }}>読み込み中…</div>
      ) : photos.length === 0 ? (
        <div style={{ fontSize: 12, color: COLORS.textSub, padding: "10px 0" }}>写真が未登録です。1枚目が一覧・タイムテーブルのサムネイルになります。</div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(84px, 1fr))", gap: 8 }}>
          {photos.map((p, i) => (
            <div key={i} style={{ position: "relative" }}>
              <div style={{ width: "100%", aspectRatio: "3 / 4", borderRadius: 8, overflow: "hidden", border: i === 0 ? `2px solid ${COLORS.accent}` : `1px solid ${COLORS.border}` }}>
                <img src={p} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
              </div>
              {i === 0 && <span style={{ position: "absolute", top: 4, left: 4, fontSize: 9, fontWeight: 700, color: "#FFF", background: COLORS.accent, padding: "1px 6px", borderRadius: 999 }}>メイン</span>}
              <div style={{ display: "flex", gap: 4, marginTop: 4 }}>
                {i !== 0 && <button onClick={() => makeFirst(i)} style={{ flex: 1, fontSize: 9, padding: "2px 0", borderRadius: 5, border: `1px solid ${COLORS.border}`, background: "#FFF", color: COLORS.textSub, cursor: "pointer" }}>メインに</button>}
                <button onClick={() => remove(i)} style={{ flex: 1, fontSize: 9, padding: "2px 0", borderRadius: 5, border: `1px solid ${COLORS.red}`, background: "#FFF", color: COLORS.red, cursor: "pointer" }}>削除</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================
export function CastDetailModal({ cast, onClose, onSave }) {
  const [f, setF] = useState({ ...cast, okText: cast.okOptions.join("、"), shops: castShops(cast), castClass: castClass(cast) });
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));
  const toggleShop = (key) => setF((p) => ({ ...p, shops: p.shops.includes(key) ? p.shops.filter((s) => s !== key) : [...p.shops, key] }));
  const save = () => {
    onSave({ ...cast, name: f.name, honmyo: f.honmyo, age: Number(f.age) || cast.age, birthday: f.birthday, phone: f.phone, address: f.address, idType: f.idType, idNo: f.idNo, joinDate: f.joinDate, itakuRate: (Number(f.ratePct) || Math.round(cast.itakuRate * 100)) / 100, idVerified: f.idVerified, okOptions: f.okText.split(/[、,]/).map((s) => s.trim()).filter(Boolean), shops: f.shops, taikiba: f.taikiba, castClass: f.castClass, loginId: f.loginId.trim(), password: f.password.trim(), biko1: f.biko1 || "", biko2: f.biko2 || "" });
    onClose();
  };
  return (
    <Modal title={`${castFullName(cast)} の詳細・編集`} onClose={onClose} wide>
      <CastPhotoManager castId={cast.id} />
      <TextField label="キャスト名" value={f.name} onChange={(v) => set("name", v)} />
      <TextField label="本名" value={f.honmyo} onChange={(v) => set("honmyo", v)} />
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 12, color: COLORS.textSub, marginBottom: 6, fontWeight: 600 }}>所属店舗(複数選択可)</div>
        <div style={{ display: "flex", gap: 8 }}>
          {SHOP_OPTIONS.map((s) => (
            <button key={s.key} onClick={() => toggleShop(s.key)} style={{ flex: 1, padding: "9px 0", borderRadius: 8, border: `2px solid ${f.shops.includes(s.key) ? COLORS.accent : COLORS.border}`, background: f.shops.includes(s.key) ? COLORS.accentBg : "#FFF", color: f.shops.includes(s.key) ? COLORS.accentDark : COLORS.textSub, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
              {f.shops.includes(s.key) ? "✓ " : ""}{s.label}
            </button>
          ))}
        </div>
      </div>
      <TextField label="待機場" value={f.taikiba || ""} onChange={(v) => set("taikiba", v)} placeholder="例: 住吉" />
      <SelectField label="クラス" value={f.castClass} onChange={(v) => set("castClass", v)} options={CAST_CLASS_OPTIONS.map((o) => o.key)} optionLabels={Object.fromEntries(CAST_CLASS_OPTIONS.map((o) => [o.key, o.label]))} />
      <div style={{ fontSize: 11, color: COLORS.textSub, margin: "10px 0 6px", fontWeight: 600 }}>キャストアプリ ログイン情報</div>
      <div style={{ display: "flex", gap: 10 }}>
        <div style={{ flex: 1 }}><TextField label="ログインID" value={f.loginId || ""} onChange={(v) => set("loginId", v)} /></div>
        <div style={{ flex: 1 }}><TextField label="パスワード" value={f.password || ""} onChange={(v) => set("password", v)} type="password" /></div>
      </div>
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
      <div style={{ display: "flex", gap: 10 }}>
        <div style={{ flex: 1 }}><TextField label="備考1" value={f.biko1 || ""} onChange={(v) => set("biko1", v)} /></div>
        <div style={{ flex: 1 }}><TextField label="備考2" value={f.biko2 || ""} onChange={(v) => set("biko2", v)} /></div>
      </div>
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

export function CastRegisterModal({ onClose, onCreate, defaultShop }) {
  const [f, setF] = useState({
    name: "", honmyo: "", birthday: "", age: "20", phone: "", address: "",
    idType: "運転免許証", idNo: "", joinDate: isoDate(new Date()), ratePct: "55", okText: "指名", idVerified: false,
    shops: defaultShop ? [defaultShop] : [], taikiba: "", castClass: "standard", loginId: "", password: "", biko1: "", biko2: "",
  });
  const [msg, setMsg] = useState("");
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));
  const toggleShop = (key) => setF((p) => ({ ...p, shops: p.shops.includes(key) ? p.shops.filter((s) => s !== key) : [...p.shops, key] }));
  const submit = () => {
    if (!f.name.trim()) { setMsg("キャスト名を入力してください"); return; }
    if (!f.loginId.trim() || !f.password.trim()) { setMsg("ログインID・パスワードを入力してください(キャストアプリのログインに使用します)"); return; }
    onCreate({
      id: `c${Date.now()}`, name: f.name.trim(), honmyo: f.honmyo.trim(),
      age: Number(f.age) || 20, birthday: f.birthday || "-", status: "before_shift",
      phone: f.phone || "090-0000-0000", address: f.address || "-",
      idType: f.idType, idNo: f.idNo || "-", joinDate: f.joinDate,
      shiftStart: "-", shiftEnd: "-", hotel: null, todayCount: 0, todaySales: 0,
      itakuRate: (Number(f.ratePct) || 55) / 100, idVerified: f.idVerified,
      stdLast: isoDate(new Date()), okOptions: f.okText.split(/[、,]/).map((s) => s.trim()).filter(Boolean), comment: "",
      shops: f.shops.length ? f.shops : (defaultShop ? [defaultShop] : []), taikiba: f.taikiba, castClass: f.castClass,
      loginId: f.loginId.trim(), password: f.password.trim(), biko1: f.biko1 || "", biko2: f.biko2 || "",
    });
    onClose();
  };
  return (
    <Modal title="キャスト新規登録" onClose={onClose} wide>
      <TextField label="キャスト名" value={f.name} onChange={(v) => set("name", v)} placeholder="例: みさき" />
      <TextField label="本名" value={f.honmyo} onChange={(v) => set("honmyo", v)} placeholder="例: 山田 花子" />
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 12, color: COLORS.textSub, marginBottom: 6, fontWeight: 600 }}>所属店舗(複数選択可)</div>
        <div style={{ display: "flex", gap: 8 }}>
          {SHOP_OPTIONS.map((s) => (
            <button key={s.key} onClick={() => toggleShop(s.key)} style={{ flex: 1, padding: "9px 0", borderRadius: 8, border: `2px solid ${f.shops.includes(s.key) ? COLORS.accent : COLORS.border}`, background: f.shops.includes(s.key) ? COLORS.accentBg : "#FFF", color: f.shops.includes(s.key) ? COLORS.accentDark : COLORS.textSub, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
              {f.shops.includes(s.key) ? "✓ " : ""}{s.label}
            </button>
          ))}
        </div>
      </div>
      <TextField label="待機場" value={f.taikiba || ""} onChange={(v) => set("taikiba", v)} placeholder="例: 住吉" />
      <SelectField label="クラス" value={f.castClass} onChange={(v) => set("castClass", v)} options={CAST_CLASS_OPTIONS.map((o) => o.key)} optionLabels={Object.fromEntries(CAST_CLASS_OPTIONS.map((o) => [o.key, o.label]))} />
      <div style={{ fontSize: 11, color: COLORS.textSub, margin: "10px 0 6px", fontWeight: 600 }}>キャストアプリ ログイン情報</div>
      <div style={{ display: "flex", gap: 10 }}>
        <div style={{ flex: 1 }}><TextField label="ログインID" value={f.loginId} onChange={(v) => set("loginId", v)} placeholder="例: cast001" /></div>
        <div style={{ flex: 1 }}><TextField label="パスワード" value={f.password} onChange={(v) => set("password", v)} type="password" placeholder="半角英数字" /></div>
      </div>
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
      <div style={{ display: "flex", gap: 10 }}>
        <div style={{ flex: 1 }}><TextField label="備考1" value={f.biko1} onChange={(v) => set("biko1", v)} /></div>
        <div style={{ flex: 1 }}><TextField label="備考2" value={f.biko2} onChange={(v) => set("biko2", v)} /></div>
      </div>
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
  const [shopKey, setShopKey] = useState("hitozuma");
  const [query, setQuery] = useState("");
  const [detailId, setDetailId] = useState(null);
  const [registerOpen, setRegisterOpen] = useState(false);
  const [csvMsg, setCsvMsg] = useState("");
  const [csvBusy, setCsvBusy] = useState(false);
  const nq = kanaNormalize(query);
  const shopCasts = casts.filter((c) => castShops(c).includes(shopKey));
  const rows = shopCasts.filter((c) => kanaNormalize(castFullName(c)).includes(nq) || kanaNormalize(c.honmyo).includes(nq));
  const detailCast = casts.find((c) => c.id === detailId);
  const thumbs = useCastThumbs(rows.map((c) => c.id));

  // CSV列: name,honmyo,age,birthday,phone,address,idType,idNo,joinDate,ratePct,okOptions,shops,taikiba
  const CSV_HEADER = "name,honmyo,age,birthday,phone,address,idType,idNo,joinDate,ratePct,okOptions,shops,taikiba,loginId,password,biko1,biko2,castClass";
  const classLabelMap = Object.fromEntries(CAST_CLASS_OPTIONS.map((o) => [o.key, o.label]));
  const classKeyMap = Object.fromEntries(CAST_CLASS_OPTIONS.map((o) => [o.label, o.key]));
  const exportCSV = () => {
    const body = casts.map((c) => [
      c.name, c.honmyo, c.age, c.birthday, c.phone, c.address, c.idType, c.idNo, c.joinDate,
      Math.round((c.itakuRate || 0) * 100), (c.okOptions || []).join("・"), castShops(c).join("・"), c.taikiba || "",
      c.loginId || "", c.password || "", c.biko1 || "", c.biko2 || "", classLabelMap[castClass(c)] || "スタンダード",
    ].map(csvEscape).join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + CSV_HEADER + "\n" + body], { type: "text/csv;charset=utf-8;" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "casts.csv"; a.click();
  };

  const importCSV = async (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    setCsvBusy(true);
    const text = await readCSVFile(file);
    const rowsRaw = parseCSV(text);
    let start = 0;
    if (rowsRaw[0] && (rowsRaw[0][0] || "").trim().toLowerCase() === "name") start = 1;
    const shopKeyMap = { 人妻専科: "hitozuma", 博多ココ: "hakata", hitozuma: "hitozuma", hakata: "hakata" };
    const incoming = rowsRaw.slice(start).map((r) => ({
      name: (r[0] || "").trim(), honmyo: (r[1] || "").trim(), age: Number(r[2]) || 20, birthday: (r[3] || "").trim() || "-",
      phone: (r[4] || "").trim() || "090-0000-0000", address: (r[5] || "").trim() || "-",
      idType: (r[6] || "").trim() || "運転免許証", idNo: (r[7] || "").trim() || "-", joinDate: (r[8] || "").trim() || isoDate(new Date()),
      ratePct: Number(r[9]) || 55, okOptions: (r[10] || "").split("・").map((s) => s.trim()).filter(Boolean),
      shops: (r[11] || "").split("・").map((s) => shopKeyMap[s.trim()] || s.trim()).filter(Boolean),
      taikiba: (r[12] || "").trim(), loginId: (r[13] || "").trim(), password: (r[14] || "").trim(),
      biko1: (r[15] || "").trim(), biko2: (r[16] || "").trim(),
      castClass: classKeyMap[(r[17] || "").trim()] || (r[17] || "").trim() || "",
    })).filter((r) => r.name);
    if (incoming.length === 0) { setCsvMsg("取り込める行がありませんでした。1行目はヘッダー(name,...)にしてください。"); setCsvBusy(false); e.target.value = ""; return; }

    // 差分判定はキャスト名(name)で行う：同名は上書き、CSVに無い名前の既存キャストは保持、新規名は追加
    const byName = new Map(casts.map((c) => [c.name, c]));
    let updated = 0, added = 0;
    incoming.forEach((inc) => {
      const ex = byName.get(inc.name);
      if (ex) {
        byName.set(inc.name, {
          ...ex, honmyo: inc.honmyo || ex.honmyo, age: inc.age, birthday: inc.birthday, phone: inc.phone, address: inc.address,
          idType: inc.idType, idNo: inc.idNo, joinDate: inc.joinDate, itakuRate: inc.ratePct / 100,
          okOptions: inc.okOptions.length ? inc.okOptions : ex.okOptions, shops: inc.shops.length ? inc.shops : castShops(ex), taikiba: inc.taikiba || ex.taikiba,
          loginId: inc.loginId || ex.loginId, password: inc.password || ex.password,
          biko1: inc.biko1 || ex.biko1 || "", biko2: inc.biko2 || ex.biko2 || "",
          castClass: inc.castClass || castClass(ex),
        });
        updated++;
      } else {
        byName.set(inc.name, {
          id: `c${Date.now()}${added}`, name: inc.name, honmyo: inc.honmyo, age: inc.age, birthday: inc.birthday,
          status: "before_shift", phone: inc.phone, address: inc.address, idType: inc.idType, idNo: inc.idNo, joinDate: inc.joinDate,
          shiftStart: "-", shiftEnd: "-", hotel: null, todayCount: 0, todaySales: 0, itakuRate: inc.ratePct / 100, idVerified: false,
          stdLast: isoDate(new Date()), okOptions: inc.okOptions, comment: "", shops: inc.shops.length ? inc.shops : ["hakata"], taikiba: inc.taikiba,
          loginId: inc.loginId, password: inc.password, biko1: inc.biko1, biko2: inc.biko2, castClass: inc.castClass || "standard",
        });
        added++;
      }
    });
    setCasts(Array.from(byName.values()));
    setCsvBusy(false);
    setCsvMsg(`取り込み完了：更新${updated}件・新規追加${added}件(差分はキャスト名で判定)。`);
    e.target.value = "";
  };

  return (
    <div>
      <SectionTitle sub={`在籍キャストの名簿。詳細ボタンで個人情報の確認・編集(全${casts.length}名)`}>キャスト一覧</SectionTitle>

      {/* 所属店舗タブ */}
      <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
        {SHOP_OPTIONS.map((s) => (
          <button key={s.key} onClick={() => setShopKey(s.key)}
            style={{
              padding: "8px 20px", borderRadius: "8px 8px 0 0", border: `1px solid ${COLORS.border}`,
              borderBottom: shopKey === s.key ? "none" : `1px solid ${COLORS.border}`,
              background: shopKey === s.key ? "#FFF" : "#EDF3FA",
              color: shopKey === s.key ? COLORS.accent : COLORS.textSub,
              fontWeight: 700, fontSize: 13, cursor: "pointer", position: "relative", top: 1,
            }}>{s.label}（{casts.filter((c) => castShops(c).includes(s.key)).length}）</button>
        ))}
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
        <button onClick={exportCSV} style={{ padding: "8px 14px", borderRadius: 8, border: `1px solid ${COLORS.accent}`, background: "transparent", color: COLORS.accent, fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}>CSVエクスポート</button>
        <label style={{ padding: "8px 14px", borderRadius: 8, border: "none", background: csvBusy ? "#C7D0DB" : COLORS.accent, color: "#FFF", fontSize: 12.5, fontWeight: 700, cursor: csvBusy ? "default" : "pointer" }}>
          {csvBusy ? "取込中…" : "CSVインポート"}
          <input type="file" accept=".csv,text/csv" onChange={importCSV} disabled={csvBusy} style={{ display: "none" }} />
        </label>
        <PrimaryButton onClick={() => setRegisterOpen(true)}>＋ 新規登録</PrimaryButton>
      </div>
      {csvMsg && <div style={{ marginBottom: 10, fontSize: 12, color: COLORS.accent, background: "#EDF3FA", padding: "8px 12px", borderRadius: 8 }}>{csvMsg}</div>}
      <div style={{ fontSize: 11, color: COLORS.textSub, marginBottom: 10 }}>CSV列：name,honmyo,age,birthday,phone,address,idType,idNo,joinDate,ratePct,okOptions,shops,taikiba,loginId,password,biko1,biko2,castClass(スタンダード/シルバー/ゴールド/プラチナ/ダイヤモンド) ／ 差分は<strong>キャスト名</strong>で判定(同名は上書き・新規名は追加・CSVに無い既存は保持)</div>
      <input placeholder="キャスト名・本名で検索" value={query} onChange={(e) => setQuery(e.target.value)} style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: `1px solid ${COLORS.border}`, background: "#FFFFFF", color: COLORS.textMain, fontSize: 14, marginBottom: 16, boxSizing: "border-box" }} />
      <Card style={{ padding: 0, overflow: "hidden" }}>
        <div className="table-scroll">
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 640 }}>
            <thead><tr style={{ background: "#EDF3FA" }}>{["キャスト名", "クラス", "年齢", "電話番号", "身分証", "対応可能オプション", ""].map((h) => <th key={h} style={{ textAlign: "left", padding: "12px 14px", fontSize: 12, color: COLORS.textSub, fontWeight: 600, borderBottom: `1px solid ${COLORS.border}`, whiteSpace: "nowrap" }}>{h}</th>)}</tr></thead>
            <tbody>
              {rows.map((c) => {
                const cls = castClassInfo(c);
                return (
                <tr key={c.id} style={{ borderBottom: `1px solid ${COLORS.border}` }}>
                  <td style={{ padding: "12px 14px", color: COLORS.textMain, fontSize: 14, fontWeight: 600, whiteSpace: "nowrap" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <CastAvatar cast={c} photo={thumbs[c.id]} size={60} radius={8} />
                      <span title={castFullName(c)}>{truncateName(castFullName(c), 8)}</span>
                    </div>
                  </td>
                  <td style={{ padding: "12px 14px", fontSize: 11.5, whiteSpace: "nowrap" }}>
                    <span style={{ fontWeight: 700, color: cls.color, background: `${cls.color}1F`, padding: "3px 9px", borderRadius: 999 }}>{cls.label}</span>
                  </td>
                  <td style={{ padding: "12px 14px", color: COLORS.textMain, fontSize: 13 }}>{c.age}</td>
                  <td style={{ padding: "12px 14px", color: COLORS.textMain, fontSize: 13, fontFamily: "'JetBrains Mono', monospace", whiteSpace: "nowrap" }}>{c.phone}</td>
                  <td style={{ padding: "12px 14px", fontSize: 12 }}><span style={{ color: c.idVerified ? COLORS.green : COLORS.red, fontWeight: 700 }}>{c.idVerified ? "確認済" : "未確認"}</span></td>
                  <td style={{ padding: "12px 14px" }}>
                    <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>{c.okOptions.map((o) => <span key={o} style={{ fontSize: 11, color: COLORS.accent, background: COLORS.accentBg, padding: "2px 8px", borderRadius: 999, whiteSpace: "nowrap" }}>{o}</span>)}</div>
                  </td>
                  <td style={{ padding: "12px 14px" }}>
                    <button onClick={() => setDetailId(c.id)} style={{ padding: "6px 14px", borderRadius: 8, border: `1px solid ${COLORS.accent}`, background: "transparent", color: COLORS.accent, fontSize: 12, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" }}>詳細</button>
                  </td>
                </tr>
                );
              })}
              {rows.length === 0 && <tr><td colSpan={6} style={{ padding: 28, textAlign: "center", color: COLORS.textSub, fontSize: 13 }}>該当するキャストがいません。</td></tr>}
            </tbody>
          </table>
        </div>
      </Card>
      <div style={{ fontSize: 11, color: COLORS.textSub, marginTop: 10 }}>※本名・生年月日・住所・身分証は個人情報です。役職に応じた操作制限(設定→セキュリティ)の対象です。</div>
      {detailCast && <CastDetailModal cast={detailCast} onClose={() => setDetailId(null)} onSave={(u) => setCasts((prev) => prev.map((x) => x.id === u.id ? u : x))} />}
      {registerOpen && <CastRegisterModal defaultShop={shopKey} onClose={() => setRegisterOpen(false)} onCreate={(newCast) => setCasts((prev) => [...prev, newCast])} />}
    </div>
  );
}
