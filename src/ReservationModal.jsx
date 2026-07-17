import { useState } from "react";
import { COLORS, DAY_DATES, Modal, PrimaryButton, RESERVATION_TIME_OPTIONS, SelectField, TextField, Yen, castFullName, findCast, fmtHour, hotelArea, isoDate } from "./shared.jsx";

// ============================================================
export function TimeBadge({ label, value, color }) {
  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ fontSize: 10, color: COLORS.textSub, fontWeight: 600, marginBottom: 3 }}>{label}</div>
      <div style={{ background: color, color: "#FFF", borderRadius: 8, padding: "6px 10px", fontSize: 15, fontWeight: 800, fontFamily: "'JetBrains Mono', monospace" }}>{value}</div>
    </div>
  );
}

export function NewReservationModal({ prefillCustomer, editReservation, casts, drivers, reservations, courses, options, hotels: hotelsProp, onClose, onCreate, onCancelReservation }) {
  const hotels = hotelsProp || [];
  const r0 = editReservation;
  const last = prefillCustomer?.history?.[0];
  const prefillCast = last ? findCast(casts, last.cast) : null;
  const isEdit = !!r0;

  const shimeiOpt = options.find((o) => o.name === "指名");
  const honShimeiOpt = options.find((o) => o.name === "本指名");
  const extOpt = options.find((o) => o.name === "延長30分");
  const extraMaster = options.filter((o) => !["指名", "本指名", "延長30分"].includes(o.name));

  // 受付情報
  const [phone, setPhone] = useState(r0?.phone || prefillCustomer?.phones?.[0] || "");
  const [memberNo, setMemberNo] = useState("");
  const [visitType, setVisitType] = useState("一般");
  const [customer, setCustomer] = useState(r0?.customer || prefillCustomer?.name || "");
  const [kana, setKana] = useState("");
  const visitCount = prefillCustomer?.visits ?? 0;

  // 受付内容
  const initialCastName = r0 ? castFullName(casts.find((c) => c.id === r0.castId)) : (prefillCast ? castFullName(prefillCast) : (casts[0] ? castFullName(casts[0]) : ""));
  const [castName, setCastName] = useState(initialCastName);
  const [hotel, setHotel] = useState(r0?.hotel && r0.hotel !== "-" ? r0.hotel : (last?.hotel || hotels[0]?.name || ""));
  const [room, setRoom] = useState(r0?.room || "");
  const [course, setCourse] = useState(r0?.course || last?.course || courses[0]?.name || "");
  const r0ShimeiName = r0?.options?.find((o) => o.name === "指名" || o.name === "本指名")?.name;
  const [shimei, setShimei] = useState(r0ShimeiName || "フリー");
  const [extension, setExtension] = useState(!!r0?.options?.find((o) => o.name === "延長30分"));
  const [extraOptions, setExtraOptions] = useState(r0?.options?.filter((o) => o.name !== "指名" && o.name !== "本指名" && o.name !== "延長30分") || []);
  const [start, setStart] = useState(r0 ? r0.start : 21);
  const [sendDriver, setSendDriver] = useState(r0?.sendDriver || drivers[0]?.car || "未定");
  const [status, setStatus] = useState(r0?.status || "受付済");

  // 料金その他
  const [transportFee, setTransportFee] = useState("0");
  const [miscFee, setMiscFee] = useState("0");
  const [happyDiscount, setHappyDiscount] = useState("0");
  const [guestCount, setGuestCount] = useState("1");
  const [note, setNote] = useState(r0?.note || "");

  const toggleExtra = (opt) => setExtraOptions((prev) => prev.some((o) => o.name === opt.name) ? prev.filter((o) => o.name !== opt.name) : [...prev, opt]);

  const selectedCast = findCast(casts, castName);
  const startNum = Number(start);
  const baseDur = course.includes("120") ? 2 : course.includes("90") ? 1.5 : 1;
  const dur = baseDur + (extension ? 0.5 : 0);
  const endNum = startNum + dur;
  const fmtHM = (h) => `${Math.floor(h)}時${String(Math.round((h % 1) * 60)).padStart(2, "0")}分`;

  const conflict = reservations.find((r) => r.id !== r0?.id && r.castId === selectedCast?.id && Math.abs(r.start - startNum) < 1.5);
  const driverConflict = reservations.find((r) => r.id !== r0?.id && r.sendDriver === sendDriver && sendDriver !== "未定" && Math.abs(r.start - startNum) < 1);

  const basePrice = courses.find((c) => c.name === course)?.price || 0;
  const shimeiPrice = shimei === "指名" ? (shimeiOpt?.price || 0) : shimei === "本指名" ? (honShimeiOpt?.price || 0) : 0;
  const extPrice = extension ? (extOpt?.price || 0) : 0;
  const extraTotal = extraOptions.reduce((a, o) => a + o.price, 0);
  const otherTotal = (Number(transportFee) || 0) + (Number(miscFee) || 0);
  const discount = Number(happyDiscount) || 0;
  const total = basePrice + shimeiPrice + extPrice + extraTotal + otherTotal - discount;

  const optionsForSave = [
    ...(shimei !== "フリー" ? [{ name: shimei, price: shimeiPrice }] : []),
    ...(extension ? [{ name: "延長30分", price: extPrice }] : []),
    ...extraOptions,
  ];

  const buildPayload = () => ({
    id: r0 ? r0.id : `r${Date.now()}${Math.floor(Math.random() * 1000)}`, start: startNum, dur,
    customer, phone, castId: selectedCast?.id || null, area: hotels.find((h) => h.name === hotel)?.area || hotelArea(hotel), hotel, room,
    course, options: optionsForSave, price: total, status: isEdit ? status : "受付済", sendDriver, pickDriver: r0?.pickDriver || "未定",
    date: r0?.date || isoDate(DAY_DATES[0]),
    note: [note, otherTotal > 0 ? `交通費/その他:¥${otherTotal.toLocaleString()}` : "", discount > 0 ? `ハッピーチケット:-¥${discount.toLocaleString()}` : "", guestCount && guestCount !== "1" ? `宿泊人数:${guestCount}名` : ""].filter(Boolean).join(" / "),
  });

  const save = () => { onCreate(buildPayload()); onClose(); };
  const cancelReservation = () => { onCancelReservation({ ...r0, status: "キャンセル" }); onClose(); };

  const fieldSm = { padding: "8px 10px", borderRadius: 8, border: `1px solid ${COLORS.border}`, fontSize: 13, width: "100%", boxSizing: "border-box" };
  const labelSm = { fontSize: 11, color: COLORS.textSub, fontWeight: 600, marginBottom: 4, display: "block" };

  return (
    <Modal title={isEdit ? `受付詳細・編集（No.${r0.id.replace(/[^0-9]/g, "")}）` : "新規予約 受付"} onClose={onClose} maxwidth={760}>
      {prefillCustomer && last && !isEdit && (
        <div style={{ background: COLORS.accentBg, borderRadius: 10, padding: 12, marginBottom: 14, fontSize: 12, color: COLORS.accentDark }}>
          📋 {prefillCustomer.name}の前回利用を引用: {last.cast} / {last.course} / {last.option} / {last.hotel}
        </div>
      )}

      {/* 受付ヘッダー：電話番号・会員情報 */}
      <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
        <div style={{ flex: 2 }}>
          <label style={labelSm}>電話番号</label>
          <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="090-XXXX-XXXX" style={fieldSm} />
        </div>
        <div style={{ flex: 1 }}>
          <label style={labelSm}>会員番号</label>
          <input value={memberNo} onChange={(e) => setMemberNo(e.target.value)} placeholder="任意" style={fieldSm} />
        </div>
        <div style={{ flex: 1 }}>
          <label style={labelSm}>来店区分</label>
          <select value={visitType} onChange={(e) => setVisitType(e.target.value)} style={fieldSm}>
            <option value="一般">一般</option><option value="会員">会員</option>
          </select>
        </div>
        {isEdit ? (
          <div style={{ flex: 1 }}>
            <label style={labelSm}>状態</label>
            <select value={status} onChange={(e) => setStatus(e.target.value)} style={fieldSm}>
              {["問合せ中", "受付済", "移動中", "接客中", "終了", "キャンセル"].map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        ) : (
          <div style={{ flex: 1, textAlign: "center" }}>
            <label style={labelSm}>来店回数</label>
            <div style={{ padding: "8px 0", fontSize: 15, fontWeight: 700, color: COLORS.accentDark }}>{visitCount}回</div>
          </div>
        )}
      </div>
      <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
        <div style={{ flex: 2 }}>
          <label style={labelSm}>名前</label>
          <input value={customer} onChange={(e) => setCustomer(e.target.value)} placeholder="例: 田中様" style={fieldSm} />
        </div>
        <div style={{ flex: 2 }}>
          <label style={labelSm}>フリガナ</label>
          <input value={kana} onChange={(e) => setKana(e.target.value)} placeholder="タナカ" style={fieldSm} />
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: 18 }} className="rsv-grid">
        {/* 左：受付内容 */}
        <div>
          <SelectField label="女の子選択(指名キャスト)" value={castName} onChange={setCastName} options={casts.map((c) => castFullName(c))} />
          <div style={{ display: "flex", gap: 10 }}>
            <div style={{ flex: 2 }}><SelectField label="ホテル選択" value={hotel} onChange={setHotel} options={hotels.map((h) => h.name)} /></div>
            <div style={{ flex: 1 }}><TextField label="号室" value={room} onChange={setRoom} placeholder="802" /></div>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <div style={{ flex: 1 }}><SelectField label="基本(コース)" value={course} onChange={setCourse} options={courses.map((c) => c.name)} /></div>
            <div style={{ flex: 1 }}><SelectField label="指名区分" value={shimei} onChange={setShimei} options={["フリー", "指名", "本指名"]} /></div>
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={labelSm}>延長</label>
            <button onClick={() => setExtension((v) => !v)} style={{ padding: "8px 16px", borderRadius: 8, fontSize: 12.5, fontWeight: 700, cursor: "pointer", border: `1px solid ${extension ? COLORS.accent : COLORS.border}`, background: extension ? COLORS.accent : "#FFF", color: extension ? "#FFF" : COLORS.textMain }}>
              延長30分 {extOpt ? <Yen value={extOpt.price} /> : ""}
            </button>
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={labelSm}>オプション</label>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {extraMaster.map((o) => {
                const on = extraOptions.some((x) => x.name === o.name);
                return (
                  <button key={o.id} onClick={() => toggleExtra(o)} style={{ padding: "6px 12px", borderRadius: 999, fontSize: 12, fontWeight: 600, cursor: "pointer", border: `1px solid ${on ? COLORS.accent : COLORS.border}`, background: on ? COLORS.accent : "#FFF", color: on ? "#FFF" : COLORS.textMain }}>{o.name}（<Yen value={o.price} />）</button>
                );
              })}
              {extraMaster.length === 0 && <span style={{ fontSize: 12, color: COLORS.textSub }}>設定→項目登録でオプションを追加できます</span>}
            </div>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "flex-end", marginBottom: 12 }}>
            <div style={{ flex: 1 }}>
              <label style={labelSm}>開始時刻(10分単位)</label>
              <select value={start} onChange={(e) => setStart(Number(e.target.value))} style={fieldSm}>
                {RESERVATION_TIME_OPTIONS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <TimeBadge label="開始" value={fmtHM(startNum)} color="#E08A1E" />
            <TimeBadge label="終了予定" value={fmtHM(endNum)} color="#2F9E8F" />
          </div>
          <SelectField label="送りドライバー" value={sendDriver} onChange={setSendDriver} options={[...drivers.map((d) => d.car), "未定"]} />
          <label style={labelSm}>メモ・NG情報など</label>
          <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} placeholder="対応時の注意事項があれば入力" style={{ ...fieldSm, resize: "vertical", fontFamily: "inherit" }} />
        </div>

        {/* 右：料金 */}
        <div>
          <div style={{ background: "#EDF3FA", borderRadius: 12, padding: 14 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.textMain, marginBottom: 10 }}>料金</div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: COLORS.textMain, marginBottom: 6 }}><span>基本料金</span><Yen value={basePrice} /></div>
            {shimeiPrice > 0 && <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: COLORS.textSub, marginBottom: 6 }}><span>{shimei}</span><Yen value={shimeiPrice} /></div>}
            {extPrice > 0 && <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: COLORS.textSub, marginBottom: 6 }}><span>延長30分</span><Yen value={extPrice} /></div>}
            {extraOptions.map((o) => <div key={o.name} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: COLORS.textSub, marginBottom: 6 }}><span>{o.name}</span><Yen value={o.price} /></div>)}

            <div style={{ borderTop: `1px solid ${COLORS.border}`, margin: "8px 0" }} />
            <div style={{ marginBottom: 8 }}>
              <label style={labelSm}>交通費</label>
              <input value={transportFee} onChange={(e) => setTransportFee(e.target.value)} type="number" style={fieldSm} />
            </div>
            <div style={{ marginBottom: 8 }}>
              <label style={labelSm}>その他(苦情対応費等)</label>
              <input value={miscFee} onChange={(e) => setMiscFee(e.target.value)} type="number" style={fieldSm} />
            </div>
            <div style={{ marginBottom: 8 }}>
              <label style={labelSm}>ハッピーチケット(割引)</label>
              <input value={happyDiscount} onChange={(e) => setHappyDiscount(e.target.value)} type="number" style={fieldSm} />
            </div>
            <div style={{ marginBottom: 10 }}>
              <label style={labelSm}>宿泊人数</label>
              <input value={guestCount} onChange={(e) => setGuestCount(e.target.value)} type="number" min="1" style={fieldSm} />
            </div>
            <div style={{ borderTop: `1px solid ${COLORS.border}`, paddingTop: 10, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: COLORS.textMain }}>合計金額</span>
              <span style={{ fontSize: 20, fontWeight: 800, color: COLORS.accentDark }}><Yen value={total} /></span>
            </div>
          </div>
          {conflict && <div style={{ color: COLORS.red, fontSize: 12.5, fontWeight: 700, marginTop: 10 }}>⚠ バッティング警告: {castName}は{fmtHour(conflict.start)}に既に予約があります</div>}
          {driverConflict && <div style={{ color: "#B58A1F", fontSize: 12, marginTop: 6 }}>⚠ {sendDriver}は同時間帯に別の送迎があります</div>}
          {isEdit && <div style={{ fontSize: 11, color: COLORS.textSub, marginTop: 10 }}>※交通費・その他・割引・宿泊人数は編集時0からの再入力になります(前回の内訳はメモ欄に記録済み)。</div>}
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, marginTop: 18 }}>
        <button onClick={onClose} style={{ flex: 1, padding: "12px 0", borderRadius: 10, border: `1px solid ${COLORS.border}`, background: "#FFF", color: COLORS.textMain, fontWeight: 700, fontSize: 14, cursor: "pointer" }}>閉じる</button>
        {isEdit && <button onClick={cancelReservation} style={{ flex: 1, padding: "12px 0", borderRadius: 10, border: `1px solid ${COLORS.red}`, background: "transparent", color: COLORS.red, fontWeight: 700, fontSize: 14, cursor: "pointer" }}>この予約を取消</button>}
        <PrimaryButton onClick={save} disabled={!!conflict} style={{ flex: 2 }}>{conflict ? "重複のため受付不可" : isEdit ? "変更を保存" : "この内容で予約受付"}</PrimaryButton>
      </div>
      <style>{`@media (max-width: 640px){ .rsv-grid{ grid-template-columns: 1fr !important; } }`}</style>
    </Modal>
  );
}

// ============================================================
// お仕事メール
// ============================================================
export function WorkMailModal({ reservation, castName, onClose }) {
  const body = `【予約連絡】
キャスト: ${castName}
お客様: ${reservation.customer}
時間: ${fmtHour(reservation.start)}〜(${reservation.course})
場所: ${reservation.area} ${reservation.hotel}
送りドライバー: ${reservation.sendDriver}
迎えドライバー: ${reservation.pickDriver}
料金: ¥${reservation.price.toLocaleString()}`;
  return (
    <Modal title="お仕事メール(プレビュー)" onClose={onClose}>
      <div style={{ fontSize: 12, color: COLORS.textSub, marginBottom: 8 }}>宛先: キャスト / 送りドライバー / 迎えドライバー</div>
      <pre style={{ background: "#EDF3FA", borderRadius: 10, padding: 14, fontSize: 13, color: COLORS.textMain, whiteSpace: "pre-wrap", fontFamily: "'Noto Sans JP', sans-serif", margin: 0 }}>{body}</pre>
      <PrimaryButton onClick={onClose} style={{ marginTop: 14, width: "100%" }}>ワンクリック送信(デモ)</PrimaryButton>
    </Modal>
  );
}
