import { useEffect, useMemo, useRef, useState } from "react";
import { COLORS, Card, SectionTitle, castFullName, kanaNormalize, castShops, isoDate } from "../shared.jsx";

// ============================================================
// 受付表タブ(スプレッドシート再現・1日1シート)
//  1件の予約 = 2行1セット
//   上段: 時間 / 会員 / 氏名 / TEL / 各種数値
//   下段: 出発・到着次第 / 本指・写指 / ホテル名+部屋番号
// ============================================================

const ROWS = 40; // 初期行数(1セット=予約1件)

// 列幅(スプレッドの見た目に合わせる)
export const W = {
  bikoL: 130,  // A 備考(左)
  taiki: 46,   // B 待機場
  no: 34,      // C 番号
  time: 62,    // D/E 時間
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
  otoshi: 62,  // R 落とし
  joshi: 62,   // S 女子給
  biko: 66,    // T 備考
  okuri: 46,   // U 送り
  mukae: 46,   // V 迎え
  ryoshu: 40,  // W 領収書
  baitai: 46,  // X 媒体
  bikoR: 220,  // Y 備考(NG等)
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
  header: { soumukou: "", zairyou: "寮滞在者：清川【松山0】住吉【】ルネス【】エレガンテ住吉【】ライベ【宇野休・鷹木0・賀川0・浅香0】グリーンヒル博多【安西2】駅前ロマネスク【】ダイナコート【】ライオンズP【】※寮費0=無料 1=1.000円 2=2.000円", ryokin: "", cardTotal: "", tesuryo: "" },
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

// 文字入力で候補が絞り込まれるオートコンプリートセル(ひらがな/カタカナ相互一致)
function AutoCompleteCell({ value, onChange, options, width, bg, color, bold, fontSize = 11.5, customStyle, onStyleChange }) {
  const [picker, setPicker] = useState(null);
  const [editing, setEditing] = useState(false);
  const [query, setQuery] = useState("");
  const finalBg = customStyle?.bg || bg || "transparent";
  const finalColor = customStyle?.color || color || COLORS.textMain;
  const lp = useLongPress((x, y) => setPicker({ x, y }));

  const nq = kanaNormalize(query);
  const filtered = query ? options.filter((o) => o && kanaNormalize(o).includes(nq)) : options.filter(Boolean);

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
          <div key={o} onMouseDown={() => pick(o)}
            style={{ padding: "7px 10px", fontSize: 12.5, color: COLORS.textMain, cursor: "pointer", background: o === value ? "#EDF3FA" : "#FFF", whiteSpace: "nowrap" }}>
            {o}
          </div>
        ))}
      </div>
    </div>
  );
}

// セレクト型セル
function SelCell({ value, onChange, options, width, bg, color, bold, fontSize = 11.5, customStyle, onStyleChange }) {
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

export function UketsukeTab({ casts, courses, drivers }) {
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
  const setHeader = (key, val) => save({ ...sheet, header: { ...sheet.header, [key]: val } });
  const addRows = () => save({ ...sheet, rows: [...sheet.rows, ...Array.from({ length: 10 }, () => emptyRow())] });
  const resetHeader = () => {
    if (!window.confirm("送迎交通費確認・寮滞在者・料金欄を初期値に戻します。明細行は消えません。よろしいですか？")) return;
    save({ ...sheet, header: emptySheet().header });
  };

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
  const courseNames = ["", "60", "90", "120", "D150", "150", "180"];
  const driverNames = ["", ...drivers.map((dr) => dr.name)];

  // 1セットの高さ
  const ROW_H = 26;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 8 }}>
        <SectionTitle>受付表</SectionTitle>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 12, color: COLORS.accent }}>{msg}</span>
          <button onClick={resetHeader} style={{ padding: "7px 12px", borderRadius: 8, border: `1px solid ${COLORS.red}`, background: "transparent", color: COLORS.red, fontWeight: 700, fontSize: 12, cursor: "pointer", whiteSpace: "nowrap" }}>上部欄をリセット</button>
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
          <div style={{ minWidth: 1700, height: 1 }} />
        </div>
        <div className="table-scroll" ref={bodyScrollRef} onScroll={syncFromBody} style={{ overflowX: "auto" }}>
          <div style={{ minWidth: 1700 }}>

            {/* ===== ヘッダー部(1〜3行目) ===== */}
            <div style={{ display: "flex", borderBottom: `1px solid ${COLORS.border}`, background: "#FFF" }}>
              {/* A: 黄色の大セル */}
              <div style={{ width: W.bikoL, minWidth: W.bikoL, background: "#FFFF00", borderRight: `1px solid ${COLORS.border}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Cell value={sheet.header.soumukou} onChange={(v) => setHeader("soumukou", v)} width={W.bikoL - 2} bg="#FFFF00" bold />
              </div>
              {/* 待機場ラベル */}
              <div style={{ width: W.taiki, minWidth: W.taiki, fontSize: 10, fontWeight: 700, color: COLORS.textSub, display: "flex", alignItems: "center", justifyContent: "center", borderRight: `1px solid ${COLORS.border}`, background: "#F4F6F9" }}>待機場</div>
              {/* 送迎交通費確認 */}
              <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
                <div style={{ display: "flex", borderBottom: `1px solid ${COLORS.border}`, minHeight: 26, alignItems: "center" }}>
                  <div style={{ width: 300, fontSize: 11, fontWeight: 700, color: "#1F4E9C", background: "#DEEAF6", padding: "4px 8px", borderRight: `1px solid ${COLORS.border}` }}>送迎交通費確認→</div>
                  <div style={{ width: 180, fontSize: 11, color: COLORS.textSub, textAlign: "center", borderRight: `1px solid ${COLORS.border}` }}>#N/A</div>
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
              <Th width={W.bikoL} />
              <Th width={W.taiki}>待機場</Th>
              <Th width={W.no}>番号</Th>
              <Th width={W.time}>時間</Th>
              <Th width={W.cast}>キャスト</Th>
              <Th width={W.shimeiN} />
              <Th width={W.kaiin}>指名</Th>
              <Th width={W.label} />
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

                {/* F キャスト(結合) */}
                <div style={{ width: W.cast, minWidth: W.cast, borderRight: `1px solid ${COLORS.border}`, display: "flex", alignItems: "center", background: "#FFF" }}>
                  <AutoCompleteCell value={r.cast} onChange={(v) => setCastForRow(i, v)} options={castNames} width={W.cast - 2} bold fontSize={10.5} customStyle={r.styles?.["cast"]} onStyleChange={(s) => setRowStyle(i, "cast", s)} />
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
                    <SelCell value={r.shimeiType} onChange={(v) => setRow(i, "shimeiType", v)} options={["F", "写指", "本指"]} width={W.kaiin - 2} bg="#FFFFFF" bold fontSize={10} customStyle={r.styles?.["shimeiType"]} onStyleChange={(s) => setRowStyle(i, "shimeiType", s)} />
                  </div>
                </div>

                {/* I ラベル(氏名/TEL) */}
                <div style={{ width: W.label, minWidth: W.label, borderRight: `1px solid ${COLORS.border}`, display: "flex", flexDirection: "column", fontSize: 8, color: COLORS.textSub, background: "#F4F6F9" }}>
                  <div style={{ height: ROW_H, borderBottom: `1px solid ${COLORS.border}`, display: "flex", alignItems: "center", justifyContent: "center" }}>氏名</div>
                  <div style={{ height: ROW_H, display: "flex", alignItems: "center", justifyContent: "center" }}>TEL</div>
                </div>

                {/* J 氏名+TEL / ホテル名 */}
                <div style={{ width: W.name, minWidth: W.name, borderRight: `1px solid ${COLORS.border}`, display: "flex", flexDirection: "column" }}>
                  <div style={{ height: ROW_H, borderBottom: `1px solid ${COLORS.border}`, display: "flex", alignItems: "center" }}>
                    <Cell value={r.name} onChange={(v) => setRow(i, "name", v)} width={100} align="center" bold fontSize={12} placeholder="やまもと"  customStyle={r.styles?.["name"]} onStyleChange={(s) => setRowStyle(i, "name", s)}/>
                    <Cell value={r.tel} onChange={(v) => setRow(i, "tel", v)} width={W.name - 102} align="center" mono fontSize={11.5} placeholder="09000000000"  customStyle={r.styles?.["tel"]} onStyleChange={(s) => setRowStyle(i, "tel", s)}/>
                  </div>
                  <div style={{ height: ROW_H, display: "flex", alignItems: "center" }}>
                    <Cell value={r.hotel} onChange={(v) => setRow(i, "hotel", v)} width={W.name - 2} bold fontSize={11.5} placeholder="ホテル名　部屋番号"  customStyle={r.styles?.["hotel"]} onStyleChange={(s) => setRowStyle(i, "hotel", s)}/>
                  </div>
                </div>

                {/* M 交通費(結合) */}
                <div style={{ width: W.kotsu, minWidth: W.kotsu, borderRight: `1px solid ${COLORS.border}`, display: "flex", alignItems: "center" }}>
                  <Cell value={r.kotsu} onChange={(v) => setRow(i, "kotsu", v)} width={W.kotsu - 2} mono placeholder="0"  customStyle={r.styles?.["kotsu"]} onStyleChange={(s) => setRowStyle(i, "kotsu", s)}/>
                </div>

                {/* N コース(結合) */}
                <div style={{ width: W.course, minWidth: W.course, borderRight: `1px solid ${COLORS.border}`, display: "flex", alignItems: "center" }}>
                  <SelCell value={r.course} onChange={(v) => setRow(i, "course", v)} options={courseNames} width={W.course - 2} bold fontSize={12}  customStyle={r.styles?.["course"]} onStyleChange={(s) => setRowStyle(i, "course", s)}/>
                </div>

                {/* O/P OP(上下2段×2列) */}
                <div style={{ width: W.op * 2, minWidth: W.op * 2, borderRight: `1px solid ${COLORS.border}`, display: "flex", flexDirection: "column" }}>
                  <div style={{ height: ROW_H, borderBottom: `1px solid ${COLORS.border}`, display: "flex" }}>
                    <Cell value={r.op1} onChange={(v) => setRow(i, "op1", v)} width={W.op} fontSize={10.5}  customStyle={r.styles?.["op1"]} onStyleChange={(s) => setRowStyle(i, "op1", s)}/>
                    <Cell value={r.op2} onChange={(v) => setRow(i, "op2", v)} width={W.op} fontSize={10.5}  customStyle={r.styles?.["op2"]} onStyleChange={(s) => setRowStyle(i, "op2", s)}/>
                  </div>
                  <div style={{ height: ROW_H, display: "flex" }}>
                    <Cell value={r.op3} onChange={(v) => setRow(i, "op3", v)} width={W.op} fontSize={10.5}  customStyle={r.styles?.["op3"]} onStyleChange={(s) => setRowStyle(i, "op3", s)}/>
                    <Cell value={r.op4} onChange={(v) => setRow(i, "op4", v)} width={W.op} fontSize={10.5}  customStyle={r.styles?.["op4"]} onStyleChange={(s) => setRowStyle(i, "op4", s)}/>
                  </div>
                </div>

                {/* Q 退出(緑・結合) */}
                <div style={{ width: W.taishutsu, minWidth: W.taishutsu, borderRight: `1px solid ${COLORS.border}`, background: "#00B050", display: "flex", alignItems: "center" }}>
                  <Cell value={r.taishutsu} onChange={(v) => setRow(i, "taishutsu", v)} width={W.taishutsu - 2} bg="#00B050" color="#FFF" bold mono fontSize={12} placeholder="9:54"  customStyle={r.styles?.["taishutsu"]} onStyleChange={(s) => setRowStyle(i, "taishutsu", s)}/>
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

                {/* Y 備考(NG等・赤文字)・上下2段 */}
                <div style={{ width: W.bikoR, minWidth: W.bikoR, display: "flex", flexDirection: "column" }}>
                  <div style={{ height: ROW_H, borderBottom: `1px solid ${COLORS.border}`, display: "flex", alignItems: "center" }}>
                    <Cell value={r.bikoR} onChange={(v) => setRow(i, "bikoR", v)} width={W.bikoR - 2} align="left" color="#C00000" fontSize={10.5} customStyle={r.styles?.["bikoR"]} onStyleChange={(s) => setRowStyle(i, "bikoR", s)} />
                  </div>
                  <div style={{ height: ROW_H, display: "flex", alignItems: "center" }}>
                    <Cell value={r.bikoR2} onChange={(v) => setRow(i, "bikoR2", v)} width={W.bikoR - 2} align="left" color="#C00000" fontSize={10.5} customStyle={r.styles?.["bikoR2"]} onStyleChange={(s) => setRowStyle(i, "bikoR2", s)} />
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
