import { useState } from "react";
import { COLORS, Card, PrimaryButton, SectionTitle, SelectField, TextField, castFullName, findCast, generateCopy } from "../shared.jsx";
import SenzaiMaker from "../SenzaiMaker.jsx";

// ============================================================
export function MediaTab({ casts, setCasts }) {
  const [castKey, setCastKey] = useState(castFullName(casts[0]));
  const [keywords, setKeywords] = useState("");
  const [comment, setComment] = useState("");
  const [diary, setDiary] = useState("");
  const [loadingC, setLoadingC] = useState(false);
  const [loadingD, setLoadingD] = useState(false);
  const [err, setErr] = useState("");
  const cast = findCast(casts, castKey);

  const genComment = async () => {
    setLoadingC(true); setErr("");
    try { setComment(await generateCopy("comment", cast.name, keywords)); }
    catch (e) { setErr("生成に失敗しました。時間をおいて再度お試しください。"); }
    setLoadingC(false);
  };
  const genDiary = async () => {
    setLoadingD(true); setErr("");
    try { setDiary(await generateCopy("diary", cast.name, keywords)); }
    catch (e) { setErr("生成に失敗しました。時間をおいて再度お試しください。"); }
    setLoadingD(false);
  };

  return (
    <div>
      <SectionTitle sub="キャストプロフィール・写メ日記を作成し、HP/各媒体へ反映">媒体・HP更新</SectionTitle>
      <Card style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-end" }}>
          <div style={{ flex: 1, minWidth: 160 }}><SelectField label="対象キャスト" value={castKey} onChange={setCastKey} options={casts.map((c) => castFullName(c))} /></div>
          <div style={{ flex: 2, minWidth: 200 }}><TextField label="キーワード(任意)" value={keywords} onChange={setKeywords} placeholder="例: 明るい・気配り・笑顔" /></div>
        </div>
        <div style={{ fontSize: 11, color: COLORS.textSub, marginTop: -4 }}>対象: {castFullName(cast)}(本名 {cast?.honmyo})</div>
      </Card>
      {err && <Card style={{ marginBottom: 16, borderColor: COLORS.red }}><div style={{ color: COLORS.red, fontSize: 13 }}>{err}</div></Card>}
      <div className="grid-2">
        <Card>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: COLORS.textMain }}>店長コメント</div>
            <button onClick={genComment} disabled={loadingC} style={{ padding: "6px 14px", borderRadius: 8, border: "none", background: loadingC ? "#C7D0DB" : COLORS.accent, color: "#FFF", fontSize: 12, fontWeight: 700, cursor: loadingC ? "default" : "pointer" }}>{loadingC ? "生成中…" : "✨ AI自動生成"}</button>
          </div>
          <textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="AI自動生成ボタンで作成、または直接入力" rows={5} style={{ width: "100%", padding: 12, borderRadius: 10, border: `1px solid ${COLORS.border}`, fontSize: 13, fontFamily: "'Noto Sans JP', sans-serif", resize: "vertical", boxSizing: "border-box" }} />
          <PrimaryButton onClick={() => setCasts((prev) => prev.map((c) => c.id === cast?.id ? { ...c, comment } : c))} style={{ marginTop: 10, width: "100%" }}>プロフィールに反映</PrimaryButton>
        </Card>
        <Card>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: COLORS.textMain }}>写メ日記</div>
            <button onClick={genDiary} disabled={loadingD} style={{ padding: "6px 14px", borderRadius: 8, border: "none", background: loadingD ? "#C7D0DB" : COLORS.accent, color: "#FFF", fontSize: 12, fontWeight: 700, cursor: loadingD ? "default" : "pointer" }}>{loadingD ? "生成中…" : "✨ AI自動生成"}</button>
          </div>
          <textarea value={diary} onChange={(e) => setDiary(e.target.value)} placeholder="AI自動生成ボタンで作成、または直接入力" rows={5} style={{ width: "100%", padding: 12, borderRadius: 10, border: `1px solid ${COLORS.border}`, fontSize: 13, fontFamily: "'Noto Sans JP', sans-serif", resize: "vertical", boxSizing: "border-box" }} />
          <PrimaryButton onClick={() => {}} style={{ marginTop: 10, width: "100%" }}>HP・各媒体へ投稿(デモ)</PrimaryButton>
        </Card>
      </div>

      <div style={{ borderTop: `1px solid ${COLORS.border}`, margin: "24px 0 18px" }} />
      <SenzaiMaker casts={casts} />
    </div>
  );
}
