import { useEffect, useMemo, useRef, useState } from "react";
import { COLORS, Card, SectionTitle, castFullName, kanaNormalize, castShops, castClass, castRewardRank, isoDate } from "../shared.jsx";

// ============================================================
// 受付表タブ(スプレッドシート再現・1日1シート)
//  1件の予約 = 2行1セット
//   上段: 時間 / 会員 / 氏名 / TEL / 各種数値
//   下段: 出発・到着次第 / 本指・写指 / ホテル名+部屋番号
// ============================================================

const ROWS = 40; // 初期行数(1セット=予約1件)

// 列幅(スプレッドの見た目に合わせる)
export const W = {
  move: 22,    // 行入れ替えボタン
  bikoL: 130,  // A 備考(左)
  taiki: 46,   // B 待機場
  no: 24,      // C 番号(34×0.7≒24)
  time: 56,    // D/E 時間(62×0.9≒56)
  cast: 62,    // F キャスト
  shimeiN: 26, // G 指名数
  kaiin: 42,   // H 会員/本指
  label: 26,   // I 氏名/TELラベル
  name: 210,   // J 氏名 / ホテル名
  tel: 4,      // K (Jに統合表示)
  kotsu: 46,   // M 交通費
  course: 50,  // N コース
  op: 44,      // O/P OP
  taishutsu: 52, // Q 退出
  otoshi: 56,  // R 落とし(62×0.9≒56)
  joshi: 56,   // S 女子給(62×0.9≒56)
  biko: 66,    // T 備考
  okuri: 46,   // U 送り
  mukae: 46,   // V 迎え
  ryoshu: 40,  // W 領収書
  baitai: 46,  // X 媒体
  bikoR: 340,  // Y 備考(NG等)・長文が多いため広め
};

// 同じキャストが上から何本目かを計算(1本目=赤文字、2本目以降=緑背景の判定に使用)
export function computeShimeiCounts(rows) {
  const seen = {};
  return rows.map((r) => {
    if (!r.cast) return 0;
    seen[r.cast] = (seen[r.cast] || 0) + 1;
    return seen[r.cast];
  });
}

const emptyRow = () => ({
  bikoL: "", bikoL2: "", taiki: "", time: "", depart: "", cast: "", shimeiN: "",
  kaiin: "", shimeiType: "F", name: "", tel: "", hotel: "",
  kotsu: "", course: "", op1: "なし", op2: "なし", op3: "なし", op4: "なし",
  taishutsu: "", otoshi: "", joshi: "", biko: "", biko2: "", okuri: "", mukae: "",
  ryoshu: "", baitai: "", bikoR: "", bikoR2: "",
  styles: {}, // { [フィールド名]: { bg, color } } ユーザーが選んだセル色
});

const emptySheet = () => ({
  header: { soumukou: "", zairyou: "寮滞在者：清川【松山0】住吉【】ルネス【】エレガンテ住吉【】ライベ【宇野休・鷹木0・賀川0・浅香0】グリーンヒル博多【安西2】駅前ロマネスク【】ダイナコート【】ライオンズP【】※寮費0=無料 1=1.000円 2=2.000円", ryokin: "", cardTotal: "", tesuryo: "", transportArea: "" },
  rows: Array.from({ length: ROWS }, () => emptyRow()),
});

// ============================================================
// セル色ピッカー(右クリック / 長押しで開く)
// ============================================================
const BG_SWATCHES = ["", "#FFFF00", "#FFD966", "#F4B183", "#FF7C80", "#A9D18E", "#9DC3E6", "#B4A7D6", "#D9D9D9", "#FF0000", "#00B050"];
const TEXT_SWATCHES = ["", "#000000", "#C00000", "#1F4E9C", "#FFFFFF", "#7F6000"];

function useLongPress(onTrigger, ms = 480) {
  const timer = { current: null };
  const start = (e) => {
    const point = e.touches ? e.touches[0] : e;
    const x = point.clientX, y = point.clientY;
    timer.current = setTimeout(() => onTrigger(x, y), ms);
  };
  const clear = () => { if (timer.current) clearTimeout(timer.current); };
  return {
    onContextMenu: (e) => { e.preventDefault(); onTrigger(e.clientX, e.clientY); },
    onTouchStart: start, onTouchEnd: clear, onTouchMove: clear,
  };
}

function ColorPickerPopover({ x, y, currentBg, currentColor, onPick, onClose }) {
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 200 }}>
      <div onClick={(e) => e.stopPropagation()} style={{
        position: "fixed", left: Math.min(x, window.innerWidth - 230), top: Math.min(y, window.innerHeight - 200),
        background: "#FFF", borderRadius: 10, padding: 12, boxShadow: "0 8px 28px rgba(0,0,0,0.28)", border: "1px solid #D8DEE6", width: 214,
      }}>
        <div style={{ fontSize: 10.5, fontWeight: 700, color: "#7A8798", marginBottom: 6 }}>背景色</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 10 }}>
          {BG_SWATCHES.map((c) => (
            <button key={c || "none"} onClick={() => onPick({ bg: c })}
              title={c || "なし"}
              style={{
                width: 22, height: 22, borderRadius: 5, cursor: "pointer",
                background: c || "repeating-conic-gradient(#eee 0% 25%, #fff 0% 50%) 50% / 8px 8px",
                border: c === currentBg ? "2px solid #2F6DB5" : "1px solid #D8DEE6",
              }} />
          ))}
        </div>
        <div style={{ fontSize: 10.5, fontWeight: 700, color: "#7A8798", marginBottom: 6 }}>文字色</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 10 }}>
          {TEXT_SWATCHES.map((c) => (
            <button key={c || "none"} onClick={() => onPick({ color: c })}
              title={c || "既定"}
              style={{
                width: 22, height: 22, borderRadius: 5, cursor: "pointer",
                background: c || "repeating-conic-gradient(#eee 0% 25%, #fff 0% 50%) 50% / 8px 8px",
                border: c === currentColor ? "2px solid #2F6DB5" : "1px solid #D8DEE6",
                color: c || "#000", fontSize: 10, display: "flex", alignItems: "center", justifyContent: "center",
              }}>{c ? "A" : ""}</button>
          ))}
        </div>
        <button onClick={() => onPick({ bg: "", color: "" })} style={{ width: "100%", padding: "5px 0", borderRadius: 6, border: "1px solid #D8DEE6", background: "#F7F8FA", color: "#7A8798", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>色をクリア</button>
      </div>
    </div>
  );
}

// 汎用セル入力
function Cell({ value, onChange, width, align = "center", bg, color, bold, fontSize = 11.5, placeholder, mono, customStyle, onStyleChange }) {
  const [picker, setPicker] = useState(null);
  const finalBg = customStyle?.bg || bg || "transparent";
  const finalColor = customStyle?.color || color || COLORS.textMain;
  const lp = useLongPress((x, y) => setPicker({ x, y }));
  return (
    <>
      <input
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        {...lp}
        style={{
          width, minWidth: width, maxWidth: width, boxSizing: "border-box",
          padding: "3px 4px", border: "none", borderRight: `1px solid ${COLORS.border}`,
          background: finalBg, color: finalColor,
          fontWeight: bold ? 700 : 400, fontSize, textAlign: align,
          fontFamily: mono ? "'JetBrains Mono', monospace" : "inherit",
          outline: "none", height: "100%",
        }}
        onFocus={(e) => { if (!customStyle?.bg) e.target.style.background = "#FFF9DB"; }}
        onBlur={(e) => { e.target.style.background = finalBg; }}
      />
      {picker && onStyleChange && (
        <ColorPickerPopover x={picker.x} y={picker.y} currentBg={customStyle?.bg} currentColor={customStyle?.color}
          onPick={(patch) => { onStyleChange({ ...customStyle, ...patch }); setPicker(null); }}
          onClose={() => setPicker(null)} />
      )}
    </>
  );
}

// 長文が折り返して複数行表示できるセル(スマホでは狭い列幅でも2段以上に自動で伸びる)
function WrapCell({ value, onChange, width, color, fontSize = 10.5, customStyle, onStyleChange, minHeight = 26 }) {
  const [picker, setPicker] = useState(null);
  const finalBg = customStyle?.bg || "transparent";
  const finalColor = customStyle?.color || color || COLORS.textMain;
  const lp = useLongPress((x, y) => setPicker({ x, y }));
  return (
    <>
      <textarea
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        {...lp}
        rows={1}
        style={{
          width, minWidth: width, maxWidth: width, height: "100%", boxSizing: "border-box",
          padding: "3px 4px", border: "none", borderRight: `1px solid ${COLORS.border}`,
          background: finalBg, color: finalColor,
          fontWeight: 400, fontSize, textAlign: "left", lineHeight: 1.4,
          fontFamily: "inherit", outline: "none", resize: "none",
          whiteSpace: "pre-wrap", wordBreak: "break-word", overflow: "hidden",
          display: "block",
        }}
        onFocus={(e) => { if (!customStyle?.bg) e.target.style.background = "#FFF9DB"; }}
        onBlur={(e) => { e.target.style.background = finalBg; }}
      />
      {picker && onStyleChange && (
        <ColorPickerPopover x={picker.x} y={picker.y} currentBg={customStyle?.bg} currentColor={customStyle?.color}
          onPick={(patch) => { onStyleChange({ ...customStyle, ...patch }); setPicker(null); }}
          onClose={() => setPicker(null)} />
      )}
    </>
  );
}

// 文字入力で候補が絞り込まれるオートコンプリートセル(ひらがな/カタカナ相互一致)
function AutoCompleteCell({ value, onChange, options, width, bg, color, bold, fontSize = 11.5, customStyle, onStyleChange }) {
  const [picker, setPicker] = useState(null);
  const [editing, setEditing] = useState(false);
  const [query, setQuery] = useState("");
  const finalBg = customStyle?.bg || bg || "transparent";
  const finalColor = customStyle?.color || color || COLORS.textMain;
  const lp = useLongPress((x, y) => setPicker({ x, y }));

  // options は文字列配列、または { label, search } オブジェクト配列(読み等も検索対象にしたい場合)のどちらも受け付ける
  const normalized = options.map((o) => typeof o === "string" ? { label: o, search: o } : o);
  const nq = kanaNormalize(query);
  const filtered = query
    ? normalized.filter((o) => o.label && (kanaNormalize(o.label).includes(nq) || kanaNormalize(o.search || "").includes(nq)))
    : normalized.filter((o) => o.label);

  const startEdit = () => { setQuery(""); setEditing(true); };
  const pick = (name) => { onChange(name); setEditing(false); setQuery(""); };

  if (!editing) {
    return (
      <>
        <button
          onClick={startEdit}
          {...lp}
          style={{
            width, minWidth: width, maxWidth: width, boxSizing: "border-box",
            padding: "2px 3px", border: "none", borderRight: `1px solid ${COLORS.border}`,
            background: finalBg, color: value ? finalColor : "#B7C2D0",
            fontWeight: bold ? 700 : 400, fontSize, textAlign: "center",
            outline: "none", height: "100%", cursor: "pointer",
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>{value || "選択"}</button>
        {picker && onStyleChange && (
          <ColorPickerPopover x={picker.x} y={picker.y} currentBg={customStyle?.bg} currentColor={customStyle?.color}
            onPick={(patch) => { onStyleChange({ ...customStyle, ...patch }); setPicker(null); }}
            onClose={() => setPicker(null)} />
        )}
      </>
    );
  }

  return (
    <div style={{ position: "relative", width, minWidth: width, maxWidth: width, height: "100%" }}>
      <input
        autoFocus
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onBlur={() => setTimeout(() => setEditing(false), 150)}
        placeholder="入力して検索"
        style={{
          width: "100%", height: "100%", boxSizing: "border-box",
          padding: "2px 3px", border: `1.5px solid ${COLORS.accent}`,
          background: "#FFF9DB", color: COLORS.textMain, fontWeight: bold ? 700 : 400,
          fontSize, textAlign: "center", outline: "none", zIndex: 5, position: "relative",
        }}
      />
      <div style={{
        position: "absolute", top: "100%", left: 0, minWidth: 150, maxHeight: 220, overflowY: "auto",
        background: "#FFF", border: `1px solid ${COLORS.border}`, borderRadius: 8, boxShadow: "0 8px 20px rgba(0,0,0,0.15)",
        zIndex: 100,
      }}>
        {value && (
          <div onMouseDown={() => pick("")} style={{ padding: "7px 10px", fontSize: 12, color: COLORS.textSub, cursor: "pointer", borderBottom: `1px solid ${COLORS.border}` }}>(クリア)</div>
        )}
        {filtered.length === 0 && <div style={{ padding: "8px 10px", fontSize: 12, color: COLORS.textSub }}>該当なし</div>}
        {filtered.slice(0, 30).map((o) => (
          <div key={o.label} onMouseDown={() => pick(o.label)}
            style={{ padding: "7px 10px", fontSize: 12.5, color: COLORS.textMain, cursor: "pointer", background: o.label === value ? "#EDF3FA" : "#FFF", whiteSpace: "nowrap" }}>
            {o.label}{o.search && o.search !== o.label ? <span style={{ color: COLORS.textSub, fontSize: 10.5, marginLeft: 6 }}>({o.search})</span> : null}
          </div>
        ))}
      </div>
    </div>
  );
}

// セレクト型セル
function SelCell({ value, onChange, options, width, bg, color, bold, fontSize = 11.5, mono, customStyle, onStyleChange }) {
  const [picker, setPicker] = useState(null);
  const finalBg = customStyle?.bg || bg || "transparent";
  const finalColor = customStyle?.color || color || COLORS.textMain;
  const lp = useLongPress((x, y) => setPicker({ x, y }));
  return (
    <>
      <select
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        {...lp}
        style={{
          width, minWidth: width, maxWidth: width, boxSizing: "border-box",
          padding: "2px 2px", border: "none", borderRight: `1px solid ${COLORS.border}`,
          background: finalBg, color: finalColor,
          fontWeight: bold ? 700 : 400, fontSize, textAlign: "center",
          fontFamily: mono ? "'JetBrains Mono', monospace" : "inherit",
          outline: "none", height: "100%", appearance: "none", cursor: "pointer",
        }}>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
      {picker && onStyleChange && (
        <ColorPickerPopover x={picker.x} y={picker.y} currentBg={customStyle?.bg} currentColor={customStyle?.color}
          onPick={(patch) => { onStyleChange({ ...customStyle, ...patch }); setPicker(null); }}
          onClose={() => setPicker(null)} />
      )}
    </>
  );
}

// 見出しセル
export function Th({ children, width, bg = "#EDF3FA" }) {
  return (
    <div style={{
      width, minWidth: width, maxWidth: width, boxSizing: "border-box",
      padding: "5px 3px", fontSize: 10.5, fontWeight: 700, color: COLORS.textSub,
      background: bg, borderRight: `1px solid ${COLORS.border}`, borderBottom: `2px solid ${COLORS.border}`,
      textAlign: "center", whiteSpace: "nowrap", overflow: "hidden",
    }}>{children}</div>
  );
}

export const SHEETS = [
  { key: "hitozuma", label: "人妻専科" },
  { key: "hakata", label: "博多ココ" },
];

export function UketsukeTab({ casts, courses, options, drivers, transportFees }) {
  const [sheetKey, setSheetKey] = useState("hitozuma");
  const [dateStr, setDateStr] = useState(isoDate(new Date()));
  const [sheet, setSheet] = useState(emptySheet());
  const [loaded, setLoaded] = useState(false);
  const [msg, setMsg] = useState("");
  const topScrollRef = useRef(null);
  const bodyScrollRef = useRef(null);
  const syncingRef = useRef(false); // 相互onScrollの無限ループ防止
  const syncFromTop = (e) => {
    if (syncingRef.current) return;
    syncingRef.current = true;
    if (bodyScrollRef.current) bodyScrollRef.current.scrollLeft = e.target.scrollLeft;
    syncingRef.current = false;
  };
  const syncFromBody = (e) => {
    if (syncingRef.current) return;
    syncingRef.current = true;
    if (topScrollRef.current) topScrollRef.current.scrollLeft = e.target.scrollLeft;
    syncingRef.current = false;
  };

  // シート・日付が変わったら読み込み
  useEffect(() => {
    setLoaded(false);
    fetch(`/api/state?key=uketsuke:${sheetKey}:${dateStr}`).then((r) => r.json()).then((d) => {
      if (d && d.value && d.value.rows) setSheet(d.value);
      else setSheet(emptySheet());
      setLoaded(true);
    }).catch(() => { setSheet(emptySheet()); setLoaded(true); });
  }, [sheetKey, dateStr]);

  // 保存(デバウンス)
  const save = (next) => {
    setSheet(next);
    clearTimeout(window.__uketsukeTimer);
    window.__uketsukeTimer = setTimeout(() => {
      fetch(`/api/state?key=uketsuke:${sheetKey}:${dateStr}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ value: next }) })
        .then(() => { setMsg("保存しました"); setTimeout(() => setMsg(""), 1200); })
        .catch(() => setMsg("保存に失敗しました"));
    }, 600);
  };

  const setRow = (i, key, val) => {
    const rows = sheet.rows.map((r, idx) => idx === i ? { ...r, [key]: val } : r);
    save({ ...sheet, rows });
  };
  // キャストを選んだら、そのキャストの設定済み待機場・備考1/2も自動で入れる(既に入力済みの内容は上書きしない)
  const setCastForRow = (i, castName) => {
    const matched = casts.find((c) => castFullName(c) === castName);
    const rows = sheet.rows.map((r, idx) => idx === i ? {
      ...r, cast: castName,
      taiki: matched?.taikiba || r.taiki,
      bikoR: r.bikoR || matched?.biko1 || "",
      bikoR2: r.bikoR2 || matched?.biko2 || "",
    } : r);
    save({ ...sheet, rows });
  };
  const setRowStyle = (i, key, styleObj) => {
    const rows = sheet.rows.map((r, idx) => idx === i ? { ...r, styles: { ...(r.styles || {}), [key]: styleObj } } : r);
    save({ ...sheet, rows });
  };
  // 行の入れ替え(↑↓ボタン)
  const swapRow = (i, dir) => {
    const j = i + dir;
    if (j < 0 || j >= sheet.rows.length) return;
    const rows = [...sheet.rows];
    [rows[i], rows[j]] = [rows[j], rows[i]];
    save({ ...sheet, rows });
  };
  const setHeader = (key, val) => save({ ...sheet, header: { ...sheet.header, [key]: val } });

  // 落とし・女子給を自動計算：落とし = コース料金 + 交通費 + 指名料(Fの選択に応じ) + オプション(未実装分は0)
  //  ※手動で上書きした値は、コース・指名種別・交通費のいずれかを再度変更するまで保持される
  // 行のキャストが対応可能なオプション名一覧(所属店舗×クラスに応じたもの。OP欄のプルダウン用)
  const optionsForRowCast = (castName) => {
    const cast = casts.find((c) => castFullName(c) === castName);
    if (!cast) return [""];
    const allowed = cast.allowedOptions || [];
    const matched = options.filter((o) => o.type === "extra" && allowed.includes(o.id));
    return ["", ...matched.map((o) => o.name)];
  };
  const optionPriceByName = (name) => {
    const found = options.find((o) => o.type === "extra" && o.name === name);
    return found ? found.price : 0;
  };
  const recalcRow = (row, idx) => {
    const info = courseInfo(row.course, row.cast);
    if (!info) return row; // コース未選択なら自動計算しない(手入力のまま)
    const shimeiOpt = row.shimeiType === "写指" ? options.find((o) => o.name.includes("写指"))
      : row.shimeiType === "本指" ? options.find((o) => o.name.includes("本指"))
      : null;
    const shimeiPrice = shimeiOpt?.price || 0;
    const kotsu = Number(String(row.kotsu).replace(/[^0-9.-]/g, "")) || 0;
    const opTotal = [row.op1, row.op2, row.op3, row.op4].filter((n) => n && n !== "なし").reduce((sum, n) => sum + optionPriceByName(n), 0);
    const otoshi = info.price + kotsu + shimeiPrice + opTotal;
    // 女子給：博多ココ・スタンダードは報酬ランク別、それ以外は通常の女子給
    let baseJoshi = info.joshi;
    if (info.joshiByRank) {
      const cast = casts.find((c) => castFullName(c) === row.cast);
      const rank = cast ? castRewardRank(cast) : "base";
      baseJoshi = info.joshiByRank[rank] ?? info.joshiByRank.base ?? 0;
    }
    // 本日1本目(備考欄の自動-500表示)は、女子給からも雑費500円を控除する
    const bikoValue = row.biko || (idx != null && shimeiCounts[idx] === 1 ? "-500" : "");
    const bikoDeduction = Number(String(bikoValue).replace(/[^0-9.-]/g, "")) || 0; // マイナス値としてそのまま加算(控除)
    const joshi = baseJoshi + opTotal + bikoDeduction;
    return { ...row, otoshi: String(otoshi), joshi: String(joshi) };
  };
  const setOpForRow = (i, field, val) => {
    const rows = sheet.rows.map((r, idx) => idx === i ? recalcRow({ ...r, [field]: val }, idx) : r);
    save({ ...sheet, rows });
  };
  const setCourseForRow = (i, code) => {
    const rows = sheet.rows.map((r, idx) => idx === i ? recalcRow({ ...r, course: code }, idx) : r);
    save({ ...sheet, rows });
  };
  const setShimeiTypeForRow = (i, val) => {
    const rows = sheet.rows.map((r, idx) => idx === i ? recalcRow({ ...r, shimeiType: val }, idx) : r);
    save({ ...sheet, rows });
  };
  const setKotsuForRow = (i, val) => {
    const rows = sheet.rows.map((r, idx) => idx === i ? recalcRow({ ...r, kotsu: val }, idx) : r);
    save({ ...sheet, rows });
  };

  const addRows = () => save({ ...sheet, rows: [...sheet.rows, ...Array.from({ length: 10 }, () => emptyRow())] });

  // 集計(落とし・女子給の合計)
  const totals = useMemo(() => {
    const num = (v) => { const n = Number(String(v).replace(/[^0-9.-]/g, "")); return isNaN(n) ? 0 : n; };
    return sheet.rows.reduce((a, r) => ({
      otoshi: a.otoshi + num(r.otoshi),
      joshi: a.joshi + num(r.joshi),
      count: a.count + (r.name || r.cast ? 1 : 0),
    }), { otoshi: 0, joshi: 0, count: 0 });
  }, [sheet.rows]);

  // 料金からカード総額(1.15倍)・手数料(差額=15%分)を自動計算
  const ryokinNum = Number(String(sheet.header.ryokin).replace(/[^0-9.-]/g, "")) || 0;
  const cardTotal = Math.round(ryokinNum * 1.15);
  const tesuryo = cardTotal - ryokinNum;

  // 指名数：同じキャストが上から何本目かを自動カウント(1本目=赤文字、2本目以降=緑背景+黒文字)
  const shimeiCounts = useMemo(() => computeShimeiCounts(sheet.rows), [sheet.rows]);

  const d = new Date(dateStr);
  const youbi = ["日", "月", "火", "水", "木", "金", "土"][d.getDay()];
  const wareki = d.getFullYear() - 2018; // 令和

  const castNames = ["", ...casts.filter((c) => castShops(c).includes(sheetKey)).map((c) => castFullName(c))];
  // 交通費の選択肢(店舗ごとに金額が異なる。1000円以上は選択後に黄色背景・赤文字で強調)
  const kotsuOptions = sheetKey === "hitozuma" ? ["0", "1100", "2200", "3300", "4400", "5500"] : ["0", "1000", "2000", "3000", "4000", "5000"];
  // 送迎交通費確認：地区名(区+地名/ホテル名)の選択肢と、選んだ地区に対応する金額
  const transportAreaLabels = [{ label: "", search: "" }, ...(transportFees || []).map((t) => ({ label: `${t.area} ${t.name}`, search: t.reading || "" }))];
  const transportFeeValue = (() => {
    const label = sheet.header.transportArea;
    if (!label) return null;
    const match = (transportFees || []).find((t) => `${t.area} ${t.name}` === label);
    return match ? match.price : null;
  })();
  const driverNames = ["", ...drivers.map((dr) => dr.name)];

  // 指定したキャスト名の所属店舗・クラスに応じたコース記号の選択肢を返す(未選択時は全件)
  const FREE_COURSE = "自由入力"; // コース選択の一番下：無料やカスタマイズ対応用の自由記述
  const coursesForCastName = (castName) => {
    const cast = casts.find((c) => castFullName(c) === castName);
    if (!cast) return ["", ...courses.map((c) => c.code), FREE_COURSE];
    const cls = castClass(cast);
    const shops = castShops(cast);
    const matched = courses.filter((c) => c.castClass === cls && shops.includes(c.shop));
    return ["", ...matched.map((c) => c.code), FREE_COURSE];
  };
  // コース記号(code)は店舗・クラスをまたいで重複しうる(例:人妻専科と博多ココの両方に"60"がある)ため、
  // キャスト名から所属店舗・クラスを特定し、その範囲内で検索する(見つからなければ記号のみで検索するフォールバック)
  const courseInfo = (code, castName) => {
    const cast = castName ? casts.find((c) => castFullName(c) === castName) : null;
    if (cast) {
      const cls = castClass(cast);
      const shops = castShops(cast);
      const scoped = courses.find((c) => c.code === code && c.castClass === cls && shops.includes(c.shop));
      if (scoped) return scoped;
    }
    return courses.find((c) => c.code === code);
  };

  // 1セットの高さ
  const ROW_H = 26;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 8 }}>
        <SectionTitle>受付表</SectionTitle>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 12, color: COLORS.accent }}>{msg}</span>
          <input type="date" value={dateStr} onChange={(e) => setDateStr(e.target.value)}
            style={{ padding: "7px 10px", borderRadius: 8, border: `1px solid ${COLORS.border}`, fontSize: 13, fontWeight: 700, color: COLORS.textMain, background: "#FFF" }} />
        </div>
      </div>

      {/* シート(店舗)切り替え */}
      <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
        {SHEETS.map((s) => (
          <button key={s.key} onClick={() => setSheetKey(s.key)}
            style={{
              padding: "8px 20px", borderRadius: "8px 8px 0 0", border: `1px solid ${COLORS.border}`,
              borderBottom: sheetKey === s.key ? "none" : `1px solid ${COLORS.border}`,
              background: sheetKey === s.key ? "#FFF" : "#EDF3FA",
              color: sheetKey === s.key ? COLORS.accent : COLORS.textSub,
              fontWeight: 700, fontSize: 13, cursor: "pointer", position: "relative", top: 1,
            }}>{s.label}</button>
        ))}
      </div>

      {!loaded ? (
        <div style={{ textAlign: "center", color: COLORS.textSub, padding: 40 }}>読み込み中…</div>
      ) : (
      <Card style={{ padding: 0, overflow: "hidden" }}>
        {/* 上側スクロールバー(PC版で横スクロールしやすいように・下側と連動) */}
        <div className="top-scrollbar-pc" ref={topScrollRef} onScroll={syncFromTop} style={{ overflowX: "auto", overflowY: "hidden", height: 16 }}>
          <div style={{ minWidth: 1722, height: 1 }} />
        </div>
        <div className="table-scroll" ref={bodyScrollRef} onScroll={syncFromBody} style={{ overflowX: "auto" }}>
          <div style={{ minWidth: 1722 }}>

            {/* ===== ヘッダー部(1〜3行目) ===== */}
            <div style={{ display: "flex", borderBottom: `1px solid ${COLORS.border}`, background: "#FFF" }}>
              {/* A: 総務項目欄(待機場の左) */}
              <div style={{ width: W.bikoL, minWidth: W.bikoL, background: "#FFFFFF", borderRight: `1px solid ${COLORS.border}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Cell value={sheet.header.soumukou} onChange={(v) => setHeader("soumukou", v)} width={W.bikoL - 2} bg="#FFFFFF" bold />
              </div>
              {/* 待機場ラベル */}
              <div style={{ width: W.taiki, minWidth: W.taiki, fontSize: 10, fontWeight: 700, color: COLORS.textSub, display: "flex", alignItems: "center", justifyContent: "center", borderRight: `1px solid ${COLORS.border}`, background: "#F4F6F9" }}>待機場</div>
              {/* 送迎交通費確認 */}
              <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
                <div style={{ display: "flex", borderBottom: `1px solid ${COLORS.border}`, minHeight: 26, alignItems: "center" }}>
                  <div style={{ width: 300, fontSize: 11, fontWeight: 700, color: "#1F4E9C", background: "#DEEAF6", padding: "4px 8px", borderRight: `1px solid ${COLORS.border}` }}>送迎交通費確認→</div>
                  <div style={{ width: 180, borderRight: `1px solid ${COLORS.border}` }}>
                    <AutoCompleteCell
                      value={sheet.header.transportArea}
                      onChange={(v) => setHeader("transportArea", v)}
                      options={transportAreaLabels}
                      width={178} fontSize={11}
                    />
                  </div>
                  <div style={{ width: 90, fontSize: 11, fontWeight: 700, color: transportFeeValue != null ? "#1F4E9C" : COLORS.textSub, textAlign: "center", borderRight: `1px solid ${COLORS.border}` }}>
                    {transportFeeValue != null ? `¥${transportFeeValue.toLocaleString()}` : "#N/A"}
                  </div>
                  {/* 日付 */}
                  <div style={{ display: "flex", alignItems: "center", gap: 2, padding: "0 10px", borderRight: `1px solid ${COLORS.border}` }}>
                    <span style={{ fontSize: 15, fontWeight: 700, color: COLORS.textMain }}>令和{wareki}年</span>
                    <span style={{ fontSize: 15, fontWeight: 700, marginLeft: 10 }}>{d.getMonth() + 1}月</span>
                    <span style={{ fontSize: 15, fontWeight: 700 }}>{d.getDate()}日</span>
                    <span style={{ fontSize: 14, fontWeight: 700, marginLeft: 6, color: COLORS.textSub }}>({youbi})</span>
                  </div>
                  {/* 集計(料金を入力するとカード総額・手数料が自動計算) */}
                  <div style={{ display: "flex", alignItems: "center" }}>
                    <div style={{ fontSize: 11, fontWeight: 700, background: "#FFFF00", padding: "5px 10px", borderRight: `1px solid ${COLORS.border}` }}>料金</div>
                    <Cell value={sheet.header.ryokin} onChange={(v) => setHeader("ryokin", v)} width={90} bg="#FFFF00" bold color="#C00000" placeholder="¥0" mono />
                    <div style={{ fontSize: 11, fontWeight: 700, background: "#FFFF00", padding: "5px 10px", borderRight: `1px solid ${COLORS.border}` }}>カード総額</div>
                    <div style={{ width: 90, padding: "5px 6px", background: "#FFFF00", color: "#C00000", fontWeight: 700, fontSize: 12, fontFamily: "'JetBrains Mono', monospace", textAlign: "center", borderRight: `1px solid ${COLORS.border}` }}>¥{cardTotal.toLocaleString()}</div>
                    <div style={{ fontSize: 9.5, fontWeight: 700, background: "#FFFF00", padding: "5px 6px", borderRight: `1px solid ${COLORS.border}`, lineHeight: 1.1, textAlign: "center" }}>手数料<br />(15%)</div>
                    <div style={{ width: 80, padding: "5px 6px", background: "#FFFF00", color: COLORS.textMain, fontWeight: 700, fontSize: 12, fontFamily: "'JetBrains Mono', monospace", textAlign: "center" }}>¥{tesuryo.toLocaleString()}</div>
                  </div>
                </div>
                {/* 寮滞在者 */}
                <div style={{ display: "flex", minHeight: 34, alignItems: "center" }}>
                  <input value={sheet.header.zairyou} onChange={(e) => setHeader("zairyou", e.target.value)}
                    placeholder="寮滞在者：〇〇【】〇〇【】 ※寮費0=無料 1=1,000円 2=2,000円"
                    style={{ width: "100%", padding: "5px 8px", border: "none", outline: "none", fontSize: 11.5, fontWeight: 700, color: "#1F4E9C", background: "transparent" }} />
                </div>
              </div>
            </div>

            {/* ===== 見出し行(4行目) ===== */}
            <div style={{ display: "flex", position: "sticky", top: 0, zIndex: 2 }}>
              <Th width={W.move} />
              <Th width={W.bikoL} />
              <Th width={W.taiki}>待機場</Th>
              <Th width={W.no}>番</Th>
              <Th width={W.time}>時間</Th>
              <Th width={W.cast}>キャスト</Th>
              <Th width={W.shimeiN} />
              <Th width={W.kaiin}>指名</Th>
              <Th width={W.name}>連絡先</Th>
              <Th width={W.kotsu}>交通費</Th>
              <Th width={W.course}>コース</Th>
              <Th width={W.op * 2}>OP</Th>
              <Th width={W.taishutsu}>退出</Th>
              <Th width={W.otoshi}>落とし</Th>
              <Th width={W.joshi}>女子給</Th>
              <Th width={W.biko}>備考</Th>
              <Th width={W.okuri}>送り</Th>
              <Th width={W.mukae}>迎え</Th>
              <Th width={W.ryoshu}>領収書</Th>
              <Th width={W.baitai}>媒体</Th>
              <Th width={W.bikoR}>備考(NG等)</Th>
            </div>

            {/* ===== 明細(2行1セット) ===== */}
            {sheet.rows.map((r, i) => (
              <div key={i} style={{ display: "flex", borderBottom: `2px solid ${COLORS.border}` }}>
                {/* 行入れ替えボタン */}
                <div style={{ width: W.move, minWidth: W.move, borderRight: `1px solid ${COLORS.border}`, display: "flex", flexDirection: "column", background: "#F4F6F9" }}>
                  <button onClick={() => swapRow(i, -1)} disabled={i === 0} style={{ flex: 1, border: "none", background: "none", cursor: i === 0 ? "default" : "pointer", color: i === 0 ? "#CCC" : COLORS.textSub, fontSize: 10, padding: 0 }}>▲</button>
                  <button onClick={() => swapRow(i, 1)} disabled={i === sheet.rows.length - 1} style={{ flex: 1, border: "none", background: "none", cursor: i === sheet.rows.length - 1 ? "default" : "pointer", color: i === sheet.rows.length - 1 ? "#CCC" : COLORS.textSub, fontSize: 10, padding: 0, borderTop: `1px solid ${COLORS.border}` }}>▼</button>
                </div>
                {/* A 備考(左)・上下2段 */}
                <div style={{ width: W.bikoL, minWidth: W.bikoL, borderRight: `1px solid ${COLORS.border}`, display: "flex", flexDirection: "column" }}>
                  <div style={{ height: ROW_H, borderBottom: `1px solid ${COLORS.border}`, display: "flex", alignItems: "center" }}>
                    <Cell value={r.bikoL} onChange={(v) => setRow(i, "bikoL", v)} width={W.bikoL - 2} align="left" fontSize={11} customStyle={r.styles?.["bikoL"]} onStyleChange={(s) => setRowStyle(i, "bikoL", s)} />
                  </div>
                  <div style={{ height: ROW_H, display: "flex", alignItems: "center" }}>
                    <Cell value={r.bikoL2} onChange={(v) => setRow(i, "bikoL2", v)} width={W.bikoL - 2} align="left" fontSize={11} customStyle={r.styles?.["bikoL2"]} onStyleChange={(s) => setRowStyle(i, "bikoL2", s)} />
                  </div>
                </div>
                {/* B 待機場 */}
                <div style={{ width: W.taiki, minWidth: W.taiki, borderRight: `1px solid ${COLORS.border}`, background: "#FFFFFF", display: "flex", alignItems: "center" }}>
                  <Cell value={r.taiki} onChange={(v) => setRow(i, "taiki", v)} width={W.taiki - 2} bg="#FFFFFF" fontSize={10.5} bold customStyle={r.styles?.["taiki"]} onStyleChange={(s) => setRowStyle(i, "taiki", s)} />
                </div>
                {/* C 番号 */}
                <div style={{ width: W.no, minWidth: W.no, borderRight: `1px solid ${COLORS.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: COLORS.textMain }}>
                  {r.name || r.cast ? i + 1 : ""}
                </div>

                {/* D/E 時間(上下2段) */}
                <div style={{ width: W.time, minWidth: W.time, borderRight: `1px solid ${COLORS.border}`, display: "flex", flexDirection: "column" }}>
                  <div style={{ height: ROW_H, borderBottom: `1px solid ${COLORS.border}`, display: "flex", alignItems: "center" }}>
                    <Cell value={r.time} onChange={(v) => setRow(i, "time", v)} width={W.time - 2} bold placeholder="8:30" mono fontSize={12}  customStyle={r.styles?.["time"]} onStyleChange={(s) => setRowStyle(i, "time", s)}/>
                  </div>
                  <div style={{ height: ROW_H, display: "flex", alignItems: "center" }}>
                    <SelCell value={r.depart} onChange={(v) => setRow(i, "depart", v)} options={["", "出発", "到着", "指定", "到着次第", "以降", "ごろ", "入室後出発"]} width={W.time - 2} fontSize={10} customStyle={r.styles?.["depart"]} onStyleChange={(s) => setRowStyle(i, "depart", s)} />
                  </div>
                </div>

                {/* F キャスト(結合・ダイヤモンドクラスは赤字) */}
                <div style={{ width: W.cast, minWidth: W.cast, borderRight: `1px solid ${COLORS.border}`, display: "flex", alignItems: "center", background: "#FFF" }}>
                  {(() => {
                    const castObj = casts.find((c) => castFullName(c).trim() === String(r.cast || "").trim());
                    const isDiamond = castObj && castClass(castObj) === "diamond";
                    return <AutoCompleteCell value={r.cast} onChange={(v) => setCastForRow(i, v)} options={castNames} width={W.cast - 2} bold fontSize={10.5} color={isDiamond ? "#C00000" : undefined} customStyle={r.styles?.["cast"]} onStyleChange={(s) => setRowStyle(i, "cast", s)} />;
                  })()}
                </div>

                {/* G 指名数：同じキャストが本日何本目かを自動表示(1本目=赤文字/白背景、2本目以降=黒文字/緑背景) */}
                <div style={{ width: W.shimeiN, minWidth: W.shimeiN, borderRight: `1px solid ${COLORS.border}`, display: "flex", flexDirection: "column" }}>
                  {(() => {
                    const n = shimeiCounts[i];
                    const isFirst = n === 1;
                    const bg = n === 0 ? "#FFFFFF" : (isFirst ? "#FFFFFF" : "#A9D18E");
                    const color = n === 0 ? COLORS.textMain : (isFirst ? "#FF0000" : "#000000");
                    return (
                      <>
                        <div style={{ height: ROW_H, borderBottom: `1px solid ${COLORS.border}`, background: bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <span style={{ fontWeight: 700, fontSize: 13, color }}>{n > 0 ? n : ""}</span>
                        </div>
                        <div style={{ height: ROW_H, background: "#FFFFFF" }} />
                      </>
                    );
                  })()}
                </div>

                {/* H 会員 / 本指・写指 */}
                <div style={{ width: W.kaiin, minWidth: W.kaiin, borderRight: `1px solid ${COLORS.border}`, display: "flex", flexDirection: "column" }}>
                  <div style={{ height: ROW_H, borderBottom: `1px solid ${COLORS.border}`, background: "#FFFFFF", display: "flex", alignItems: "center" }}>
                    <SelCell value={r.kaiin} onChange={(v) => setRow(i, "kaiin", v)} options={["", "新規", "会員"]} width={W.kaiin - 2} bg="#FFFFFF" bold fontSize={10} customStyle={r.styles?.["kaiin"]} onStyleChange={(s) => setRowStyle(i, "kaiin", s)} />
                  </div>
                  <div style={{ height: ROW_H, background: "#FFFFFF", display: "flex", alignItems: "center" }}>
                    <SelCell value={r.shimeiType} onChange={(v) => setShimeiTypeForRow(i, v)} options={["F", "写指", "本指"]} width={W.kaiin - 2} bg="#FFFFFF" bold fontSize={10} customStyle={r.styles?.["shimeiType"]} onStyleChange={(s) => setRowStyle(i, "shimeiType", s)} />
                  </div>
                </div>

                {/* J 氏名+電話番号 / ホテル名 */}
                <div style={{ width: W.name, minWidth: W.name, borderRight: `1px solid ${COLORS.border}`, display: "flex", flexDirection: "column" }}>
                  <div style={{ height: ROW_H, borderBottom: `1px solid ${COLORS.border}`, display: "flex", alignItems: "center" }}>
                    <Cell value={r.name} onChange={(v) => setRow(i, "name", v)} width={100} align="center" bold fontSize={12} placeholder="やまもと" customStyle={r.styles?.["name"]} onStyleChange={(s) => setRowStyle(i, "name", s)} />
                    <Cell value={r.tel} onChange={(v) => setRow(i, "tel", v)} width={W.name - 102} align="center" mono fontSize={11.5} placeholder="09000000000" customStyle={r.styles?.["tel"]} onStyleChange={(s) => setRowStyle(i, "tel", s)} />
                  </div>
                  <div style={{ height: ROW_H, display: "flex", alignItems: "center" }}>
                    <Cell value={r.hotel} onChange={(v) => setRow(i, "hotel", v)} width={W.name - 2} bold fontSize={11.5} placeholder="ホテル名　部屋番号"  customStyle={r.styles?.["hotel"]} onStyleChange={(s) => setRowStyle(i, "hotel", s)}/>
                  </div>
                </div>

                {/* M 交通費(結合・店舗別プルダウン。1000円以上は黄色背景+赤文字) */}
                <div style={{ width: W.kotsu, minWidth: W.kotsu, borderRight: `1px solid ${COLORS.border}`, display: "flex", alignItems: "center" }}>
                  {(() => {
                    const kotsuNum = Number(String(r.kotsu).replace(/[^0-9.-]/g, "")) || 0;
                    const highlight = kotsuNum >= 1000;
                    return (
                      <SelCell value={r.kotsu || "0"} onChange={(v) => setKotsuForRow(i, v)} options={kotsuOptions} width={W.kotsu - 2} mono bold={highlight}
                        bg={highlight ? "#FFFF00" : undefined} color={highlight ? "#C00000" : undefined}
                        customStyle={r.styles?.["kotsu"]} onStyleChange={(s) => setRowStyle(i, "kotsu", s)} />
                    );
                  })()}
                </div>

                {/* N コース(結合・キャストの所属店舗/クラスに応じた選択肢。自由入力にも対応) */}
                <div style={{ width: W.course, minWidth: W.course, borderRight: `1px solid ${COLORS.border}`, display: "flex", alignItems: "center" }}>
                  {(() => {
                    const opts = coursesForCastName(r.cast);
                    const isFreeMode = r.course === FREE_COURSE || (r.course && !opts.includes(r.course));
                    if (isFreeMode) {
                      return (
                        <Cell value={r.course === FREE_COURSE ? "" : r.course} onChange={(v) => setRow(i, "course", v)} width={W.course - 2} bold fontSize={11} placeholder="自由記述" customStyle={r.styles?.["course"]} onStyleChange={(s) => setRowStyle(i, "course", s)} />
                      );
                    }
                    return (
                      <SelCell value={r.course} onChange={(v) => setCourseForRow(i, v)} options={opts} width={W.course - 2} bold fontSize={12} customStyle={r.styles?.["course"]} onStyleChange={(s) => setRowStyle(i, "course", s)} />
                    );
                  })()}
                </div>

                {/* O/P OP(上下2段×2列) */}
                <div style={{ width: W.op * 2, minWidth: W.op * 2, borderRight: `1px solid ${COLORS.border}`, display: "flex", flexDirection: "column" }}>
                  <div style={{ height: ROW_H, borderBottom: `1px solid ${COLORS.border}`, display: "flex" }}>
                    <SelCell value={r.op1 || "なし"} onChange={(v) => setOpForRow(i, "op1", v)} options={["なし", ...optionsForRowCast(r.cast).filter(Boolean)]} width={W.op} fontSize={10} customStyle={r.styles?.["op1"]} onStyleChange={(s) => setRowStyle(i, "op1", s)} />
                    <SelCell value={r.op2 || "なし"} onChange={(v) => setOpForRow(i, "op2", v)} options={["なし", ...optionsForRowCast(r.cast).filter(Boolean)]} width={W.op} fontSize={10} customStyle={r.styles?.["op2"]} onStyleChange={(s) => setRowStyle(i, "op2", s)} />
                  </div>
                  <div style={{ height: ROW_H, display: "flex" }}>
                    <SelCell value={r.op3 || "なし"} onChange={(v) => setOpForRow(i, "op3", v)} options={["なし", ...optionsForRowCast(r.cast).filter(Boolean)]} width={W.op} fontSize={10} customStyle={r.styles?.["op3"]} onStyleChange={(s) => setRowStyle(i, "op3", s)} />
                    <SelCell value={r.op4 || "なし"} onChange={(v) => setOpForRow(i, "op4", v)} options={["なし", ...optionsForRowCast(r.cast).filter(Boolean)]} width={W.op} fontSize={10} customStyle={r.styles?.["op4"]} onStyleChange={(s) => setRowStyle(i, "op4", s)} />
                  </div>
                </div>

                {/* Q 退出(結合) */}
                <div style={{ width: W.taishutsu, minWidth: W.taishutsu, borderRight: `1px solid ${COLORS.border}`, background: "#FFFFFF", display: "flex", alignItems: "center" }}>
                  <Cell value={r.taishutsu} onChange={(v) => setRow(i, "taishutsu", v)} width={W.taishutsu - 2} bg="#FFFFFF" color={COLORS.textMain} bold mono fontSize={12} placeholder="9:54" customStyle={r.styles?.["taishutsu"]} onStyleChange={(s) => setRowStyle(i, "taishutsu", s)} />
                </div>

                {/* R 落とし(結合) */}
                <div style={{ width: W.otoshi, minWidth: W.otoshi, borderRight: `1px solid ${COLORS.border}`, display: "flex", alignItems: "center" }}>
                  <Cell value={r.otoshi} onChange={(v) => setRow(i, "otoshi", v)} width={W.otoshi - 2} mono bold fontSize={12}  customStyle={r.styles?.["otoshi"]} onStyleChange={(s) => setRowStyle(i, "otoshi", s)}/>
                </div>

                {/* S 女子給(結合) */}
                <div style={{ width: W.joshi, minWidth: W.joshi, borderRight: `1px solid ${COLORS.border}`, display: "flex", alignItems: "center" }}>
                  <Cell value={r.joshi} onChange={(v) => setRow(i, "joshi", v)} width={W.joshi - 2} mono bold fontSize={12}  customStyle={r.styles?.["joshi"]} onStyleChange={(s) => setRowStyle(i, "joshi", s)}/>
                </div>

                {/* T 備考・上下2段(上段：1本目のキャストは自動で-500を赤文字表示) */}
                <div style={{ width: W.biko, minWidth: W.biko, borderRight: `1px solid ${COLORS.border}`, display: "flex", flexDirection: "column" }}>
                  <div style={{ height: ROW_H, borderBottom: `1px solid ${COLORS.border}`, display: "flex", alignItems: "center" }}>
                    <Cell value={r.biko || (shimeiCounts[i] === 1 ? "-500" : "")} onChange={(v) => setRow(i, "biko", v)} width={W.biko - 2} color="#C00000" bold mono fontSize={11} customStyle={r.styles?.["biko"]} onStyleChange={(s) => setRowStyle(i, "biko", s)} />
                  </div>
                  <div style={{ height: ROW_H, display: "flex", alignItems: "center" }}>
                    <Cell value={r.biko2} onChange={(v) => setRow(i, "biko2", v)} width={W.biko - 2} color="#C00000" bold mono fontSize={11} customStyle={r.styles?.["biko2"]} onStyleChange={(s) => setRowStyle(i, "biko2", s)} />
                  </div>
                </div>

                {/* U 送り(結合) */}
                <div style={{ width: W.okuri, minWidth: W.okuri, borderRight: `1px solid ${COLORS.border}`, display: "flex", alignItems: "center" }}>
                  <SelCell value={r.okuri} onChange={(v) => setRow(i, "okuri", v)} options={driverNames} width={W.okuri - 2} fontSize={10.5}  customStyle={r.styles?.["okuri"]} onStyleChange={(s) => setRowStyle(i, "okuri", s)}/>
                </div>

                {/* V 迎え(結合) */}
                <div style={{ width: W.mukae, minWidth: W.mukae, borderRight: `1px solid ${COLORS.border}`, display: "flex", alignItems: "center" }}>
                  <SelCell value={r.mukae} onChange={(v) => setRow(i, "mukae", v)} options={driverNames} width={W.mukae - 2} fontSize={10.5}  customStyle={r.styles?.["mukae"]} onStyleChange={(s) => setRowStyle(i, "mukae", s)}/>
                </div>

                {/* W 領収書 */}
                <div style={{ width: W.ryoshu, minWidth: W.ryoshu, borderRight: `1px solid ${COLORS.border}`, display: "flex", alignItems: "center" }}>
                  <Cell value={r.ryoshu} onChange={(v) => setRow(i, "ryoshu", v)} width={W.ryoshu - 2} fontSize={10.5}  customStyle={r.styles?.["ryoshu"]} onStyleChange={(s) => setRowStyle(i, "ryoshu", s)}/>
                </div>

                {/* X 媒体 */}
                <div style={{ width: W.baitai, minWidth: W.baitai, borderRight: `1px solid ${COLORS.border}`, display: "flex", alignItems: "center" }}>
                  <Cell value={r.baitai} onChange={(v) => setRow(i, "baitai", v)} width={W.baitai - 2} fontSize={10.5}  customStyle={r.styles?.["baitai"]} onStyleChange={(s) => setRowStyle(i, "baitai", s)}/>
                </div>

                {/* Y 備考(NG等・赤文字)・上下2段・長文は折り返して複数行表示 */}
                <div style={{ width: W.bikoR, minWidth: W.bikoR, display: "flex", flexDirection: "column" }}>
                  <div style={{ minHeight: ROW_H, borderBottom: `1px solid ${COLORS.border}`, display: "flex", alignItems: "center" }}>
                    <WrapCell value={r.bikoR} onChange={(v) => setRow(i, "bikoR", v)} width={W.bikoR - 2} color="#C00000" fontSize={10.5} minHeight={ROW_H} customStyle={r.styles?.["bikoR"]} onStyleChange={(s) => setRowStyle(i, "bikoR", s)} />
                  </div>
                  <div style={{ minHeight: ROW_H, display: "flex", alignItems: "center" }}>
                    <WrapCell value={r.bikoR2} onChange={(v) => setRow(i, "bikoR2", v)} width={W.bikoR - 2} color="#C00000" fontSize={10.5} minHeight={ROW_H} customStyle={r.styles?.["bikoR2"]} onStyleChange={(s) => setRowStyle(i, "bikoR2", s)} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>
      )}

      {/* フッター：行追加と集計 */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 12, flexWrap: "wrap", gap: 10 }}>
        <button onClick={addRows} style={{ padding: "8px 16px", borderRadius: 8, border: `1px solid ${COLORS.accent}`, background: "transparent", color: COLORS.accent, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>＋ 10行追加</button>
        <div style={{ display: "flex", gap: 18, fontSize: 13, color: COLORS.textMain, flexWrap: "wrap" }}>
          <span>本数: <strong>{totals.count}</strong></span>
          <span>落とし合計: <strong style={{ fontFamily: "'JetBrains Mono', monospace" }}>{totals.otoshi.toLocaleString()}</strong></span>
          <span>女子給合計: <strong style={{ fontFamily: "'JetBrains Mono', monospace" }}>{totals.joshi.toLocaleString()}</strong></span>
        </div>
      </div>
    </div>
  );
}
