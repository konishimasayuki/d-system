import { useState, useRef, useEffect, useCallback } from "react";

// ============================================================
// 宣材写真 自動生成（媒体・HP更新タブ内セクション）
//  入力: 人物写真 / 源氏名 / 年齢 / 3サイズ / キャッチ(【】強調) / サブテキスト
//  出力: 3パターン(A=ロゴ前面 / B=ロゴ背面 / C=ロゴ上部)
//  ロゴ文字色・プロフィール枠位置を選択し、選んだ1枚をPNGでダウンロード
// ============================================================

const C = {
  panel: "#FFFFFF", border: "#E1E7EF", textMain: "#1F2733",
  textSub: "#7A8798", accent: "#2F6DB5", navy: "#1F4E88",
};

const LOGO_COLORS = {
  coral: { label: "コーラル", hex: "#E0623A" },
  white: { label: "ホワイト", hex: "#FFFFFF" },
  gold: { label: "ゴールド", hex: "#C9A227" },
  black: { label: "ブラック", hex: "#1A1A1A" },
  navy: { label: "ネイビー", hex: "#22406E" },
};

const PATTERNS = [
  { key: "A", label: "A / ロゴ前面" },
  { key: "B", label: "B / ロゴ背面" },
  { key: "C", label: "C / ロゴ上部" },
];

const OUT_W = 1080;
const OUT_H = 1440;

function castFullName(c) { return c ? (c.name || "") : ""; }

function parseSegments(line) {
  const segs = [];
  const re = /【([^】]*)】/g;
  let last = 0, m;
  while ((m = re.exec(line)) !== null) {
    if (m.index > last) segs.push({ text: line.slice(last, m.index), emph: false });
    segs.push({ text: m[1], emph: true });
    last = m.index + m[0].length;
  }
  if (last < line.length) segs.push({ text: line.slice(last), emph: false });
  return segs.length ? segs : [{ text: line, emph: false }];
}

function coverRect(iw, ih, cw, ch) {
  const scale = Math.max(cw / iw, ch / ih);
  const w = iw * scale, h = ih * scale;
  return { x: (cw - w) / 2, y: (ch - h) / 2, w, h };
}

export default function SenzaiMaker({ casts = [] }) {
  const [photo, setPhoto] = useState(null);
  const [cutout, setCutout] = useState(null);
  const [genji, setGenji] = useState("CECIL");
  const [age, setAge] = useState("27");
  const [sizes, setSizes] = useState("85(D)・58・86");
  const [sub, setSub] = useState("");
  const [catchText, setCatchText] = useState("【規格外】のモデル系美女\nクビレ、笑顔どれを取っても満点");
  const [colorKey, setColorKey] = useState("coral");
  const [circlePos, setCirclePos] = useState("left");
  const [selected, setSelected] = useState("A");
  const [cutState, setCutState] = useState("idle"); // idle / running / done / error

  const refs = { A: useRef(null), B: useRef(null), C: useRef(null) };

  // キャスト選択で源氏名・年齢をプリフィル
  const onPickCast = (fullName) => {
    const c = casts.find((x) => castFullName(x) === fullName);
    if (!c) return;
    setGenji(c.name);
    if (c.age != null) setAge(String(c.age));
  };

  const onUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => { setPhoto(img); setCutout(null); setCutState("idle"); };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  };

  // 背景自動切り抜き（@imgly/background-removal を遅延読込）
  const runCutout = async () => {
    if (!photo) return;
    setCutState("running");
    try {
      const { removeBackground } = await import("@imgly/background-removal");
      const blob = await removeBackground(photo.src);
      const url = URL.createObjectURL(blob);
      const img = new Image();
      img.onload = () => { setCutout(img); setCutState("done"); };
      img.onerror = () => setCutState("error");
      img.src = url;
    } catch (err) {
      console.error(err);
      setCutState("error");
    }
  };

  const draw = useCallback((canvas, pattern) => {
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const W = canvas.width, H = canvas.height;
    const accent = LOGO_COLORS[colorKey].hex;
    ctx.clearRect(0, 0, W, H);

    if (photo) {
      const r = coverRect(photo.width, photo.height, W, H);
      ctx.drawImage(photo, r.x, r.y, r.w, r.h);
    } else {
      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, "#EEF2F7"); g.addColorStop(1, "#D8DFE9");
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = "#9AA6B4";
      ctx.font = `${W * 0.045}px sans-serif`;
      ctx.textAlign = "center";
      ctx.fillText("写真をアップロード", W / 2, H / 2);
    }

    const drawLogo = (cy, fontScale) => {
      const size = W * fontScale;
      ctx.save();
      ctx.font = `bold ${size}px Georgia, 'Times New Roman', serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      try { ctx.letterSpacing = `${size * 0.04}px`; } catch (e) {}
      ctx.fillStyle = accent;
      ctx.shadowColor = "rgba(0,0,0,0.18)";
      ctx.shadowBlur = size * 0.03;
      ctx.fillText(genji.toUpperCase(), W / 2, cy);
      ctx.restore();
      if (sub) {
        ctx.save();
        ctx.font = `italic ${W * 0.04}px Georgia, serif`;
        ctx.fillStyle = accent;
        ctx.textAlign = "right";
        ctx.shadowColor = "rgba(0,0,0,0.25)"; ctx.shadowBlur = 6;
        ctx.fillText(sub, W * 0.93, cy + size * 0.55);
        ctx.restore();
      }
    };

    const legibility = () => {
      const g = ctx.createLinearGradient(0, H * 0.5, 0, H);
      g.addColorStop(0, "rgba(0,0,0,0)");
      g.addColorStop(1, "rgba(0,0,0,0.35)");
      ctx.fillStyle = g; ctx.fillRect(0, H * 0.5, W, H * 0.5);
    };

    const drawCatch = () => {
      const lines = catchText.split("\n").filter((l) => l.length);
      let y = H * 0.66;
      lines.forEach((line, li) => {
        const size = li === 0 ? W * 0.085 : W * 0.062;
        ctx.font = `bold ${size}px 'Hiragino Sans','Noto Sans JP',sans-serif`;
        ctx.textBaseline = "middle";
        const segs = parseSegments(line);
        const widths = segs.map((s) => ctx.measureText(s.text).width);
        const total = widths.reduce((a, b) => a + b, 0);
        let x = (W - total) / 2;
        segs.forEach((s, i) => {
          ctx.save();
          ctx.textAlign = "left";
          ctx.shadowColor = "rgba(0,0,0,0.5)"; ctx.shadowBlur = size * 0.12; ctx.shadowOffsetY = 2;
          ctx.fillStyle = s.emph ? accent : "#FFFFFF";
          ctx.fillText(s.text, x, y);
          ctx.restore();
          x += widths[i];
        });
        y += size * 1.25;
      });
    };

    const drawCircle = () => {
      const r = W * 0.155;
      const cx = circlePos === "left" ? W * 0.03 + r : W * 0.97 - r;
      const cy = H - W * 0.04 - r;
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255,255,255,0.16)";
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = "rgba(255,255,255,0.7)";
      ctx.stroke();
      ctx.clip();
      ctx.textAlign = "center";
      ctx.shadowColor = "rgba(0,0,0,0.4)"; ctx.shadowBlur = 4;
      ctx.fillStyle = "#FFFFFF";
      ctx.font = `${r * 0.42}px Georgia, serif`;
      ctx.fillText(genji.toUpperCase(), cx, cy - r * 0.28);
      ctx.font = `${r * 0.24}px 'Hiragino Sans',sans-serif`;
      ctx.fillText(`Age.${age}`, cx, cy + r * 0.12);
      ctx.font = `${r * 0.2}px 'Hiragino Sans',sans-serif`;
      ctx.fillText(sizes, cx, cy + r * 0.5);
      ctx.restore();
    };

    if (pattern === "A") {
      drawLogo(H * 0.2, 0.22);
      legibility(); drawCatch(); drawCircle();
    } else if (pattern === "B") {
      drawLogo(H * 0.24, 0.22);
      if (cutout) {
        const r = coverRect(cutout.width, cutout.height, W, H);
        ctx.drawImage(cutout, r.x, r.y, r.w, r.h);
      }
      legibility(); drawCatch(); drawCircle();
    } else {
      drawLogo(H * 0.1, 0.19);
      legibility(); drawCatch(); drawCircle();
    }
  }, [photo, cutout, genji, age, sizes, sub, catchText, colorKey, circlePos]);

  useEffect(() => {
    PATTERNS.forEach((p) => draw(refs[p.key].current, p.key));
  }, [draw]);

  const download = () => {
    const c = document.createElement("canvas");
    c.width = OUT_W; c.height = OUT_H;
    draw(c, selected);
    const a = document.createElement("a");
    a.href = c.toDataURL("image/png");
    a.download = `${genji || "senzai"}_${selected}.png`;
    a.click();
  };

  const field = { width: "100%", padding: "9px 12px", borderRadius: 8, border: `1px solid ${C.border}`, fontSize: 14, boxSizing: "border-box", color: C.textMain, background: "#FFF" };
  const label = { display: "block", fontSize: 12, color: C.textSub, marginBottom: 4, fontWeight: 600 };
  const card = { background: C.panel, border: `1px solid ${C.border}`, borderRadius: 14, padding: 18, boxShadow: "0 1px 3px rgba(43,38,32,0.04)" };

  return (
    <div>
      <div style={{ fontSize: 16, fontWeight: 700, color: C.navy, margin: "4px 0 4px", fontFamily: "'Zen Old Mincho', serif" }}>宣材写真 自動生成</div>
      <div style={{ fontSize: 12, color: C.textSub, marginBottom: 14 }}>写真と情報から3パターンの宣材を同時作成し、選んだ1枚をダウンロードします。</div>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(260px, 340px) 1fr", gap: 16, alignItems: "start" }} className="senzai-grid">
        {/* 入力 */}
        <div style={card}>
          {casts.length > 0 && (
            <div style={{ marginBottom: 12 }}>
              <label style={label}>キャストから取り込み(任意)</label>
              <select onChange={(e) => onPickCast(e.target.value)} defaultValue="" style={field}>
                <option value="">選択して源氏名・年齢を反映</option>
                {casts.map((c) => <option key={c.id} value={castFullName(c)}>{castFullName(c)}</option>)}
              </select>
            </div>
          )}
          <div style={{ marginBottom: 14 }}>
            <label style={label}>人物写真(背景あり)</label>
            <input type="file" accept="image/*" onChange={onUpload} style={{ fontSize: 13 }} />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={label}>源氏名(ロゴ)</label>
            <input value={genji} onChange={(e) => setGenji(e.target.value)} style={field} />
          </div>
          <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
            <div style={{ flex: 1 }}>
              <label style={label}>年齢</label>
              <input value={age} onChange={(e) => setAge(e.target.value)} style={field} />
            </div>
            <div style={{ flex: 2 }}>
              <label style={label}>3サイズ</label>
              <input value={sizes} onChange={(e) => setSizes(e.target.value)} style={field} />
            </div>
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={label}>キャッチコピー(【 】で強調 / 改行で複数行)</label>
            <textarea value={catchText} onChange={(e) => setCatchText(e.target.value)} rows={3} style={{ ...field, resize: "vertical" }} />
          </div>
          <div style={{ marginBottom: 14 }}>
            <label style={label}>サブテキスト(任意)</label>
            <input value={sub} onChange={(e) => setSub(e.target.value)} placeholder="例: by hakataCoco" style={field} />
          </div>
          <div style={{ marginBottom: 14 }}>
            <label style={label}>ロゴ文字色</label>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {Object.entries(LOGO_COLORS).map(([k, v]) => (
                <button key={k} onClick={() => setColorKey(k)} title={v.label}
                  style={{ width: 34, height: 34, borderRadius: "50%", background: v.hex, cursor: "pointer",
                    border: colorKey === k ? `3px solid ${C.accent}` : "2px solid #D5DCE4", boxShadow: "0 1px 3px rgba(0,0,0,.15)" }} />
              ))}
            </div>
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={label}>プロフィール枠の位置</label>
            <div style={{ display: "flex", gap: 8 }}>
              {[["left", "左下"], ["right", "右下"]].map(([k, l]) => (
                <button key={k} onClick={() => setCirclePos(k)}
                  style={{ flex: 1, padding: "8px 0", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer",
                    border: `1px solid ${circlePos === k ? C.accent : C.border}`, background: circlePos === k ? C.accent : "#FFF", color: circlePos === k ? "#FFF" : C.textMain }}>{l}</button>
              ))}
            </div>
          </div>
          <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 14 }}>
            <label style={label}>パターンB(ロゴ背面)用 自動切り抜き</label>
            <button onClick={runCutout} disabled={!photo || cutState === "running"}
              style={{ width: "100%", padding: "10px 0", borderRadius: 8, border: "none", fontWeight: 700, fontSize: 13,
                cursor: photo ? "pointer" : "default", background: cutState === "running" ? "#C7D0DB" : C.navy, color: "#FFF" }}>
              {cutState === "running" ? "切り抜き中…" : "背景を自動で切り抜く"}
            </button>
            <div style={{ fontSize: 11, marginTop: 6, color: cutState === "error" ? "#C0492B" : C.textSub }}>
              {cutState === "idle" && "※パターンBの回り込み表現に使用。初回は読み込みに時間がかかります。"}
              {cutState === "done" && "✓ 切り抜き完了。パターンBに反映しました。"}
              {cutState === "error" && "自動切り抜きに失敗しました。A・Cはそのまま利用できます。"}
            </div>
          </div>
        </div>

        {/* プレビュー */}
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 14 }}>
            {PATTERNS.map((p) => (
              <div key={p.key} onClick={() => setSelected(p.key)}
                style={{ cursor: "pointer", border: selected === p.key ? `3px solid ${C.accent}` : `1px solid ${C.border}`,
                  borderRadius: 12, overflow: "hidden", background: "#000", position: "relative" }}>
                <canvas ref={refs[p.key]} width={OUT_W / 2} height={OUT_H / 2} style={{ width: "100%", display: "block" }} />
                <div style={{ position: "absolute", top: 8, left: 8, background: "rgba(0,0,0,0.55)", color: "#FFF", fontSize: 11, fontWeight: 700, padding: "3px 8px", borderRadius: 6 }}>{p.label}</div>
                {p.key === "B" && !cutout && (
                  <div style={{ position: "absolute", bottom: 8, left: 8, right: 8, background: "rgba(0,0,0,0.6)", color: "#FFD", fontSize: 10, padding: "4px 6px", borderRadius: 6, textAlign: "center" }}>切り抜き未実行</div>
                )}
              </div>
            ))}
          </div>
          <button onClick={download} disabled={!photo}
            style={{ padding: "12px 24px", borderRadius: 10, border: "none", fontWeight: 700, fontSize: 15,
              cursor: photo ? "pointer" : "default", background: photo ? C.accent : "#C7D0DB", color: "#FFF" }}>
            選択中「{selected}」をダウンロード
          </button>
          {!photo && <span style={{ marginLeft: 12, color: C.textSub, fontSize: 13 }}>まず写真をアップロードしてください</span>}
        </div>
      </div>

      <style>{`@media (max-width: 760px){ .senzai-grid{ grid-template-columns: 1fr !important; } }`}</style>
    </div>
  );
}
