import { useState, useMemo, useRef, useEffect } from "react";
import SenzaiMaker from "./SenzaiMaker.jsx";
import { loadGoogleMaps, HOTEL_COORDS, geocodeAddress } from "./mapsLoader.js";

// ============================================================
// デザイントークン
// ============================================================
const COLORS = {
  bg: "#F5F8FC", panel: "#FFFFFF", border: "#E1E7EF",
  textMain: "#1F2733", textSub: "#7A8798",
  accent: "#2F6DB5", accentDark: "#1F4E88", accentBg: "rgba(47,109,181,0.10)",
  green: "#3E9C74", blue: "#3E7CA6", purple: "#7B77C4", red: "#C0492B",
};

const CAST_STATUS = {
  before_shift: { label: "出勤前", color: "#7B77C4", bg: "rgba(123,119,196,0.12)" },
  waiting: { label: "待機中", color: "#3E9C74", bg: "rgba(62,156,116,0.12)" },
  working: { label: "接客中", color: "#2F6DB5", bg: "rgba(47,109,181,0.12)" },
  off: { label: "本日休み", color: "#98A2B0", bg: "rgba(152,162,176,0.12)" },
};

const DRIVER_STATUS = {
  dispatch: { label: "送迎中", color: "#2F6DB5" },
  arrived: { label: "到着済", color: "#E08A1E" },
  returning: { label: "戻り中", color: "#5C93C4" },
  waiting: { label: "待機中", color: "#3E9C74" },
};

const CUSTOMER_COLORS = {
  normal: { label: "通常", color: "#7A8798", bg: "transparent" },
  vip: { label: "VIP", color: "#1F4E88", bg: "rgba(47,109,181,0.10)" },
  caution: { label: "要注意", color: "#B58A1F", bg: "rgba(200,160,40,0.12)" },
  ng: { label: "出禁", color: "#C0492B", bg: "rgba(192,73,43,0.12)" },
};

const ROLES = ["オーナー", "統括部長", "店長", "主任", "内勤スタッフ", "ドライバー"];

// 役割別ビュー(阿修羅「全員参加」思想)
const VIEW_ROLES = {
  owner: { label: "経営者", tabs: ["dashboard", "timetable", "shift", "castlist", "reservation", "dispatch", "customer", "media", "report", "accounting", "payout", "std", "settings"] },
  operator: { label: "オペレーター", tabs: ["dashboard", "timetable", "shift", "castlist", "reservation", "dispatch", "customer", "media"] },
  driver: { label: "ドライバー", tabs: ["driverpage"] },
  cast: { label: "キャスト", tabs: ["mypage"] },
  accountant: { label: "経理", tabs: ["report", "accounting", "payout"] },
};

// ============================================================
// マスタ・モックデータ
// ============================================================
const AREAS = ["中央区", "東区", "博多区", "南区"];

// ホテルマスタ(ID=4桁。住所は仮。座標はデモ近似で、住所変更/追加時にGeocodingで更新)
const INITIAL_HOTELS = [
  { id: "0001", name: "博多グランドホテル", area: "博多区", address: "福岡市博多区博多駅前2-1-1", lat: 33.5900, lng: 130.4200 },
  { id: "0002", name: "博多ステーションイン", area: "博多区", address: "福岡市博多区博多駅東1-2-3", lat: 33.5895, lng: 130.4205 },
  { id: "0003", name: "中洲リバーサイドホテル", area: "博多区", address: "福岡市博多区中洲3-4-5", lat: 33.5930, lng: 130.4060 },
  { id: "0004", name: "天神プラザホテル", area: "中央区", address: "福岡市中央区天神2-1-1", lat: 33.5914, lng: 130.3990 },
  { id: "0005", name: "西鉄シティホテル", area: "中央区", address: "福岡市中央区天神1-5-5", lat: 33.5896, lng: 130.3986 },
  { id: "0006", name: "中央グランドイン", area: "中央区", address: "福岡市中央区大名1-2-3", lat: 33.5850, lng: 130.4017 },
  { id: "0007", name: "薬院ステーションホテル", area: "中央区", address: "福岡市中央区薬院1-1-1", lat: 33.5820, lng: 130.4030 },
  { id: "0008", name: "博多ベイサイドホテル", area: "東区", address: "福岡市東区箱崎1-1-1", lat: 33.6050, lng: 130.4100 },
  { id: "0009", name: "東区パークホテル", area: "東区", address: "福岡市東区香椎2-2-2", lat: 33.6200, lng: 130.4300 },
  { id: "0010", name: "南区シティホテル", area: "南区", address: "福岡市南区大橋1-1-1", lat: 33.5600, lng: 130.4250 },
  { id: "0011", name: "大橋ステーションイン", area: "南区", address: "福岡市南区大橋2-3-4", lat: 33.5620, lng: 130.4260 },
  { id: "0012", name: "ホテル ルミエール中洲", area: "博多区", address: "福岡市博多区中洲5-1-1", lat: 33.5945, lng: 130.4050 },
  { id: "0013", name: "ホテル ノワール天神", area: "中央区", address: "福岡市中央区渡辺通4-1-1", lat: 33.5860, lng: 130.4010 },
  { id: "0014", name: "ホテル ミラージュ博多", area: "博多区", address: "福岡市博多区祇園町3-2-1", lat: 33.5920, lng: 130.4130 },
  { id: "0015", name: "ホテル アヴァンティ南", area: "南区", address: "福岡市南区高宮1-2-3", lat: 33.5680, lng: 130.4180 },
];

// 営業所(出発・戻りポイント)デフォルト
const DEFAULT_OFFICE = { address: "福岡市博多区美野島2-18-10", lat: 33.5805, lng: 130.4225 };

// 予約フォーム等の選択肢用(初期マスタから導出)
const HOTELS_BY_AREA = INITIAL_HOTELS.reduce((acc, h) => { (acc[h.area] = acc[h.area] || []).push(h.name); return acc; }, {});
const ALL_HOTELS = INITIAL_HOTELS.map((h) => h.name);

const INITIAL_COURSES = [
  { id: "co1", name: "60分コース", price: 18000 },
  { id: "co2", name: "90分コース", price: 21000 },
  { id: "co3", name: "120分コース", price: 28000 },
];
const INITIAL_OPTIONS = [
  { id: "op1", name: "指名", price: 2000 },
  { id: "op2", name: "本指名", price: 3000 },
  { id: "op3", name: "延長30分", price: 9000 },
];

const CAST_NAMES = [
  "みお", "ゆら", "りん", "あず", "せな", "こはる", "ひな", "さら", "まゆ", "のあ",
  "つむぎ", "いろは", "ここね", "あかり", "ゆいな", "みゆ", "かのん", "えま", "りお", "あんじゅ",
  "さつき", "ちひろ", "のどか", "はるひ", "みずき", "れいな", "こと", "ふうか", "あおい", "すず",
];
// 源氏名の姓
const CAST_SEI = [
  "白石", "藤原", "桜井", "星野", "綾瀬", "早乙女", "天音", "水無月", "有栖", "神楽",
  "月島", "小鳥遊", "envy", "花園", "橘",
].filter((s) => /[一-龠]/.test(s)); // 漢字のみ採用
const OPTION_POOL = ["指名", "本指名", "延長30分", "コスプレ", "ロングコース"];
const FAMILY_NAMES = ["佐藤", "鈴木", "高橋", "田中", "伊藤", "渡辺", "山本", "中村", "小林", "加藤"];

function generateCasts() {
  const statusPattern = ["waiting", "working", "before_shift", "working", "waiting", "off", "before_shift", "waiting"];
  const idTypes = ["運転免許証", "マイナンバーカード", "パスポート", "健康保険証"];
  return CAST_NAMES.map((name, i) => {
    const status = statusPattern[i % statusPattern.length];
    const hotel = status === "working" ? ALL_HOTELS[i % ALL_HOTELS.length] : null;
    const shiftHour = 17 + (i % 5);
    const shiftLenHour = 6 + (i % 3);
    const todayCount = status === "off" || status === "before_shift" ? 0 : 1 + (i % 3);
    const todaySales = todayCount * (18000 + (i % 4) * 3000);
    const stdDaysAgo = [20, 55, 88, 30, 10, 70][i % 6];
    const stdLast = new Date(2026, 5, 30); stdLast.setDate(stdLast.getDate() - stdDaysAgo);
    const age = 21 + (i % 9);
    const birthYear = 2026 - age;
    const birthday = `${birthYear}-${String((i % 12) + 1).padStart(2, "0")}-${String((i * 7 % 27) + 1).padStart(2, "0")}`;
    const joinDate = `202${4 + (i % 2)}-${String((i % 12) + 1).padStart(2, "0")}-${String((i % 27) + 1).padStart(2, "0")}`;
    const okCount = 2 + (i % 3);
    const okOptions = OPTION_POOL.filter((_, oi) => (i + oi) % 5 < okCount).slice(0, okCount);
    return {
      id: `c${i + 1}`, name, sei: CAST_SEI[i % CAST_SEI.length],
      honmyo: `${FAMILY_NAMES[i % FAMILY_NAMES.length]} ${["彩", "舞", "結", "楓", "咲"][i % 5]}子`,
      age, birthday, status,
      phone: `090-${String(1000 + i).slice(-4)}-${String(2000 + i * 3).slice(-4)}`,
      address: `福岡市${["中央区", "博多区", "東区", "南区"][i % 4]}${["大名", "今泉", "薬院", "春吉"][i % 4]}${(i % 5) + 1}-${(i % 20) + 1}-${(i % 15) + 1}`,
      idType: idTypes[i % idTypes.length],
      idNo: `${String(1000 + i * 13).slice(-4)}-${String(5000 + i * 7).slice(-4)}-${String(9000 - i * 3).slice(-4)}`,
      joinDate,
      shiftStart: status === "off" ? "-" : `${shiftHour}:00`,
      shiftEnd: status === "off" ? "-" : `${shiftHour + shiftLenHour}:00`,
      hotel, todayCount, todaySales,
      itakuRate: 0.5 + (i % 3) * 0.05, idVerified: i % 7 !== 0,
      stdLast: stdLast.toISOString().slice(0, 10),
      okOptions, comment: "",
    };
  });
}
const INITIAL_CASTS = generateCasts();

const INITIAL_DRIVERS = [
  { id: "d1", name: "佃", car: "1号車", status: "dispatch", pos: { x: 32, y: 38 }, latlng: { lat: 33.5914, lng: 130.3990 }, dest: "天神プラザホテル", note: "田中様を天神プラザホテルへ送迎中", wage: 1300, hours: 7 },
  { id: "d2", name: "森", car: "2号車", status: "arrived", pos: { x: 68, y: 55 }, latlng: { lat: 33.6050, lng: 130.4100 }, dest: "博多ベイサイドホテル", note: "佐藤様を博多ベイサイドホテルへ送迎(到着済)", wage: 1300, hours: 6 },
  { id: "d3", name: "野口", car: "3号車", status: "waiting", pos: { x: 45, y: 20 }, latlng: { lat: 33.5896, lng: 130.4050 }, dest: null, note: "中央区エリアで待機中", wage: 1250, hours: 8 },
  { id: "d4", name: "堤", car: "4号車", status: "returning", pos: { x: 20, y: 70 }, latlng: { lat: 33.5700, lng: 130.4200 }, dest: "営業所", note: "南区より営業所へ戻り中", wage: 1250, hours: 5 },
];

const INITIAL_RESERVATIONS = [
  { id: "r1", start: 19.5, dur: 1.5, customer: "田中様", castId: "c1", area: "中央区", hotel: "天神プラザホテル", course: "90分コース", price: 21000, status: "接客中", sendDriver: "1号車", pickDriver: "1号車" },
  { id: "r2", start: 20, dur: 1, customer: "佐藤様", castId: "c2", area: "東区", hotel: "博多ベイサイドホテル", course: "60分コース", price: 18000, status: "移動中", sendDriver: "2号車", pickDriver: "未定" },
  { id: "r3", start: 21, dur: 1.5, customer: "鈴木様", castId: "c4", area: "中央区", hotel: "中央グランドイン", course: "90分コース", price: 21000, status: "受付済", sendDriver: "3号車", pickDriver: "未定" },
  { id: "r4", start: 22.5, dur: 2, customer: "新規 山本様", castId: null, area: "中央区", hotel: "-", course: "120分コース", price: 28000, status: "問合せ中", sendDriver: "未定", pickDriver: "未定" },
];

const INITIAL_CUSTOMERS = [
  { id: "u1", name: "田中様", phones: ["090-XXXX-1111", "092-XXX-1111"], address: "福岡市中央区天神X-X", email: "tanaka@example.com", visits: 14, lastVisit: "2026-06-28", colorLevel: "vip", note: "常連。指名多め",
    history: [
      { date: "2026-06-28", cast: "みお", course: "90分コース", option: "本指名", hotel: "天神プラザホテル", price: 23000 },
      { date: "2026-06-14", cast: "みお", course: "90分コース", option: "本指名", hotel: "中央グランドイン", price: 23000 },
      { date: "2026-05-30", cast: "ゆら", course: "60分コース", option: "指名", hotel: "天神プラザホテル", price: 18000 },
      { date: "2026-05-18", cast: "みお", course: "120分コース", option: "本指名", hotel: "西鉄シティホテル", price: 30000 },
      { date: "2026-05-02", cast: "みお", course: "90分コース", option: "本指名", hotel: "天神プラザホテル", price: 23000 },
    ] },
  { id: "u2", name: "佐藤様", phones: ["080-XXXX-2222"], address: "福岡市東区XX", email: "", visits: 3, lastVisit: "2026-06-20", colorLevel: "normal", note: "",
    history: [
      { date: "2026-06-20", cast: "りん", course: "60分コース", option: "指名", hotel: "博多ベイサイドホテル", price: 18000 },
      { date: "2026-06-05", cast: "りん", course: "60分コース", option: "指名", hotel: "博多ベイサイドホテル", price: 18000 },
      { date: "2026-05-22", cast: "あず", course: "90分コース", option: "なし", hotel: "東区パークホテル", price: 21000 },
    ] },
  { id: "u3", name: "鈴木様", phones: ["070-XXXX-3333"], address: "福岡市中央区XX", email: "suzuki@example.com", visits: 7, lastVisit: "2026-06-30", colorLevel: "normal", note: "現金払い。指名はあず様が多め",
    history: [
      { date: "2026-06-30", cast: "あず", course: "90分コース", option: "指名", hotel: "中央グランドイン", price: 21000 },
      { date: "2026-06-16", cast: "せな", course: "60分コース", option: "なし", hotel: "天神プラザホテル", price: 18000 },
      { date: "2026-06-01", cast: "あず", course: "90分コース", option: "指名", hotel: "中央グランドイン", price: 21000 },
      { date: "2026-05-15", cast: "こはる", course: "60分コース", option: "なし", hotel: "西鉄シティホテル", price: 18000 },
      { date: "2026-04-29", cast: "あず", course: "120分コース", option: "指名", hotel: "中央グランドイン", price: 28000 },
    ] },
  { id: "u4", name: "問題客A", phones: ["090-XXXX-9999"], address: "-", email: "", visits: 2, lastVisit: "2026-05-11", colorLevel: "ng", note: "キャストへの言動により出禁",
    history: [
      { date: "2026-05-11", cast: "ひな", course: "60分コース", option: "なし", hotel: "博多エクセルホテル", price: 18000 },
      { date: "2026-04-20", cast: "さら", course: "60分コース", option: "なし", hotel: "博多エクセルホテル", price: 18000 },
    ] },
];

const INITIAL_STAFF = [
  { id: "s1", name: "近藤", role: "オーナー" },
  { id: "s2", name: "白石", role: "店長" },
  { id: "s3", name: "大西", role: "内勤スタッフ" },
];

const INITIAL_EXPENSES = [
  { id: "e1", date: "2026-06-30", account: "広告宣伝費", amount: 45000, memo: "求人媒体掲載" },
  { id: "e2", date: "2026-06-30", account: "車両費", amount: 12000, memo: "ガソリン代" },
  { id: "e3", date: "2026-06-30", account: "消耗品費", amount: 8000, memo: "備品購入" },
];
const ACCOUNT_ITEMS = ["広告宣伝費", "車両費", "消耗品費", "通信費", "地代家賃", "水道光熱費", "雑費"];
// 仕訳辞書(阿修羅「仕訳辞書」参考)
const JOURNAL_DICT = [
  { key: "求人広告", debit: "広告宣伝費", credit: "現金", memo: "求人媒体掲載" },
  { key: "ガソリン", debit: "車両費", credit: "現金", memo: "ガソリン代" },
  { key: "備品", debit: "消耗品費", credit: "現金", memo: "備品購入" },
  { key: "家賃", debit: "地代家賃", credit: "普通預金", memo: "事務所家賃" },
];

const SALES_HISTORY = [
  { date: "6/25", sales: 186000 }, { date: "6/26", sales: 214000 }, { date: "6/27", sales: 198000 },
  { date: "6/28", sales: 251000 }, { date: "6/29", sales: 176000 }, { date: "6/30", sales: 223000 },
];
const REPORT_DATA = {
  日: { calls: 38, customers: 23, sales: 468000, itaku: 257000, ochi: 211000 },
  月: { calls: 1120, customers: 684, sales: 13860000, itaku: 7623000, ochi: 6237000 },
  年: { calls: 13400, customers: 8210, sales: 166300000, itaku: 91465000, ochi: 74835000 },
};

// ============================================================
// レスポンシブCSS
// ============================================================
const GLOBAL_CSS = `
  * { box-sizing: border-box; }
  .grid-4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; }
  .grid-5 { display: grid; grid-template-columns: repeat(5, 1fr); gap: 12px; }
  .grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; }
  .grid-2 { display: grid; grid-template-columns: 1.3fr 1fr; gap: 16px; }
  .board-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; align-items: start; }
  .table-scroll { width: 100%; overflow-x: auto; }
  .sidebar { width: 224px; background: #FFFFFF; border-right: 1px solid #E1E7EF; padding: 18px 14px; flex-shrink: 0; position: relative; z-index: 30; overflow-y: auto; }
  .topbar { display: none; }
  .overlay { display: none; }
  @media (max-width: 900px) {
    .grid-4 { grid-template-columns: repeat(2, 1fr); }
    .grid-5 { grid-template-columns: repeat(2, 1fr); }
    .grid-3 { grid-template-columns: 1fr; }
    .grid-2 { grid-template-columns: 1fr; }
    .board-3 { grid-template-columns: 1fr; }
    .topbar { display: flex; align-items: center; gap: 10px; padding: 12px 14px; background: #FFFFFF; border-bottom: 1px solid #E1E7EF; position: sticky; top: 0; z-index: 20; }
    .sidebar { position: fixed; top: 0; left: 0; height: 100%; width: 250px; transform: translateX(-100%); transition: transform 0.22s ease; box-shadow: 2px 0 16px rgba(0,0,0,0.08); }
    .sidebar.open { transform: translateX(0); }
    .overlay.open { display: block; position: fixed; inset: 0; background: rgba(15,23,35,0.35); z-index: 25; }
    .main-content { padding: 16px 12px !important; }
  }
`;

// ============================================================
// AIテキスト生成ヘルパー(営業向け健全コピー限定)
// ============================================================
async function generateCopy(kind, castName, keywords) {
  const sys = kind === "diary"
    ? "あなたは接客業の店舗スタッフです。出勤したキャストの日記(写メ日記)風の短い投稿文を日本語で作成します。健全で親しみやすい日常的な内容にし、性的・露骨な表現は一切含めないでください。150字以内、絵文字を少し使って明るく。前置きや説明は書かず本文のみ返してください。"
    : "あなたは接客業の店舗スタッフです。在籍キャストを紹介する店長コメント(プロフィール文)を日本語で作成します。人柄・雰囲気・接客の丁寧さなど健全な魅力に絞り、性的・露骨な表現は一切含めないでください。120字以内。前置きや説明は書かず本文のみ返してください。";
  const user = kind === "diary"
    ? `キャスト名「${castName}」。キーワード:${keywords || "出勤・感謝・元気"}。写メ日記風の投稿文を作成してください。`
    : `キャスト名「${castName}」。キーワード:${keywords || "明るい・気配り・癒し系"}。店長コメントを作成してください。`;
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model: "claude-sonnet-4-6", max_tokens: 1000, system: sys, messages: [{ role: "user", content: user }] }),
  });
  const data = await res.json();
  return data.content.map((i) => (i.type === "text" ? i.text : "")).join("").trim();
}

// ============================================================
// 共通UI
// ============================================================
function StatusChip({ status }) {
  const s = CAST_STATUS[status];
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 10px", borderRadius: 999, fontSize: 12, fontWeight: 600, color: s.color, background: s.bg, border: `1px solid ${s.color}33`, whiteSpace: "nowrap" }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: s.color, display: "inline-block" }} />{s.label}
    </span>
  );
}
function Card({ children, style, className }) {
  return <div className={className} style={{ background: COLORS.panel, border: `1px solid ${COLORS.border}`, borderRadius: 14, padding: 20, boxShadow: "0 1px 3px rgba(43,38,32,0.04)", ...style }}>{children}</div>;
}
function SectionTitle({ children, sub }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <h2 style={{ fontFamily: "'Zen Old Mincho', serif", fontSize: 22, color: COLORS.textMain, margin: 0, letterSpacing: 0.5 }}>{children}</h2>
      {sub && <p style={{ color: COLORS.textSub, fontSize: 13, margin: "4px 0 0" }}>{sub}</p>}
    </div>
  );
}
function Yen({ value }) { return <span style={{ fontFamily: "'JetBrains Mono', monospace" }}>¥{value.toLocaleString()}</span>; }
function AreaHotel({ area, hotel }) { if (area === "-" || !area) return <span>-</span>; return <span>{area}{hotel ? ` ・ ${hotel}` : ""}</span>; }
function castFullName(c) { return c ? `${c.sei} ${c.name}` : "未割当"; }
function findCast(casts, nameStr) { return casts.find((c) => c.name === nameStr || castFullName(c) === nameStr); }
function hotelArea(hotel) { for (const [a, list] of Object.entries(HOTELS_BY_AREA)) if (list.includes(hotel)) return a; return "中央区"; }
function StatCard({ label, value, color, unit }) {
  return (
    <Card>
      <div style={{ color: COLORS.textSub, fontSize: 12 }}>{label}</div>
      <div style={{ fontSize: 22, color: color || COLORS.textMain, marginTop: 6, fontFamily: "'JetBrains Mono', monospace" }}>{value}{unit && <span style={{ fontSize: 13, color: COLORS.textSub }}> {unit}</span>}</div>
    </Card>
  );
}
function PrimaryButton({ children, onClick, style, disabled }) {
  return <button onClick={onClick} disabled={disabled} style={{ padding: "10px 18px", borderRadius: 8, border: "none", cursor: disabled ? "default" : "pointer", background: disabled ? "#C7D0DB" : COLORS.accent, color: "#FFFFFF", fontWeight: 700, fontSize: 14, ...style }}>{children}</button>;
}
function TextField({ label, value, onChange, placeholder, type }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <label style={{ display: "block", fontSize: 12, color: COLORS.textSub, marginBottom: 4 }}>{label}</label>
      <input type={type || "text"} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: `1px solid ${COLORS.border}`, background: "#FFFFFF", color: COLORS.textMain, fontSize: 14, boxSizing: "border-box" }} />
    </div>
  );
}
function SelectField({ label, value, onChange, options }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <label style={{ display: "block", fontSize: 12, color: COLORS.textSub, marginBottom: 4 }}>{label}</label>
      <select value={value} onChange={(e) => onChange(e.target.value)} style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: `1px solid ${COLORS.border}`, background: "#FFFFFF", color: COLORS.textMain, fontSize: 14 }}>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}
function Modal({ title, onClose, children, wide }) {
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(15,23,35,0.45)", zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: "#FFFFFF", borderRadius: 16, width: "100%", maxWidth: wide ? 560 : 460, maxHeight: "88vh", overflowY: "auto", boxShadow: "0 12px 40px rgba(0,0,0,0.3)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px", borderBottom: `1px solid ${COLORS.border}`, position: "sticky", top: 0, background: "#FFF" }}>
          <div style={{ fontFamily: "'Zen Old Mincho', serif", fontSize: 18, color: COLORS.textMain }}>{title}</div>
          <button onClick={onClose} style={{ border: "none", background: "transparent", fontSize: 22, color: COLORS.textSub, cursor: "pointer", lineHeight: 1 }}>×</button>
        </div>
        <div style={{ padding: 20 }}>{children}</div>
      </div>
    </div>
  );
}

// ============================================================
// CTI着信ポップアップ
// ============================================================
function CtiPopup({ customer, onClose, onReserve }) {
  const cl = CUSTOMER_COLORS[customer.colorLevel];
  const last = customer.history[0];
  return (
    <div style={{ position: "fixed", right: 20, bottom: 20, width: 320, background: "#FFFFFF", borderRadius: 14, border: `2px solid ${cl.color}`, boxShadow: "0 10px 30px rgba(0,0,0,0.25)", zIndex: 60, overflow: "hidden" }}>
      <div style={{ background: cl.color, color: "#FFF", padding: "10px 14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 13, fontWeight: 700 }}>📞 着信中 — CTI</span>
        <button onClick={onClose} style={{ border: "none", background: "transparent", color: "#FFF", fontSize: 18, cursor: "pointer" }}>×</button>
      </div>
      <div style={{ padding: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: COLORS.textMain }}>{customer.name}</div>
          <span style={{ fontSize: 11, fontWeight: 700, color: cl.color, background: `${cl.color}1F`, padding: "2px 8px", borderRadius: 999 }}>{cl.label}</span>
        </div>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 14, color: COLORS.textMain, marginTop: 4 }}>{customer.phones[0]}</div>
        <div style={{ fontSize: 12, color: COLORS.textSub, marginTop: 8 }}>来店 {customer.visits}回 ・ 最終 {customer.lastVisit}</div>
        {last && <div style={{ fontSize: 12, color: COLORS.textMain, marginTop: 4 }}>前回: {last.cast} / {last.course} / {last.hotel}</div>}
        {customer.note && <div style={{ fontSize: 12, color: cl.color, marginTop: 8, fontWeight: 600 }}>⚠ {customer.note}</div>}
        <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
          <PrimaryButton onClick={() => onReserve(customer)} style={{ flex: 1, padding: "8px 0", fontSize: 13 }}>履歴引用で予約</PrimaryButton>
          <button onClick={onClose} style={{ flex: 1, padding: "8px 0", borderRadius: 8, border: `1px solid ${COLORS.border}`, background: "#FFF", color: COLORS.textSub, fontSize: 13, cursor: "pointer" }}>閉じる</button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// ダッシュボード
// ============================================================
function CastMiniCard({ c }) {
  const s = CAST_STATUS[c.status];
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 10, border: `1px solid ${COLORS.border}`, background: "#FFFFFF", marginBottom: 8 }}>
      <div style={{ width: 32, height: 32, borderRadius: "50%", background: s.bg, border: `1.5px solid ${s.color}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: s.color, fontWeight: 700, flexShrink: 0 }}>{c.sei[0]}</div>
      <div style={{ minWidth: 0 }}>
        <div style={{ color: COLORS.textMain, fontSize: 13, fontWeight: 600 }}>{castFullName(c)}</div>
        <div style={{ color: COLORS.textSub, fontSize: 11, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.shiftStart === "-" ? "本日休み" : `${c.shiftStart}〜${c.shiftEnd}${c.hotel ? " / " + c.hotel : ""}`}</div>
      </div>
    </div>
  );
}
function StatusColumn({ title, color, casts }) {
  return (
    <Card>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <span style={{ width: 8, height: 8, borderRadius: "50%", background: color }} />
        <div style={{ color: COLORS.textMain, fontSize: 14, fontWeight: 700 }}>{title}</div>
        <div style={{ color: COLORS.textSub, fontSize: 12, marginLeft: "auto" }}>{casts.length}名</div>
      </div>
      <div style={{ maxHeight: 420, overflowY: "auto" }}>
        {casts.length === 0 ? <div style={{ color: COLORS.textSub, fontSize: 12, padding: "12px 0" }}>該当なし</div> : casts.map((c) => <CastMiniCard key={c.id} c={c} />)}
      </div>
    </Card>
  );
}
function Dashboard({ casts, reservations }) {
  const totalSalesToday = casts.reduce((a, c) => a + c.todaySales, 0);
  const workingCasts = casts.filter((c) => c.status === "working");
  const waitingCasts = casts.filter((c) => c.status === "waiting");
  const beforeShiftCasts = casts.filter((c) => c.status === "before_shift");
  const activeReservations = reservations.filter((r) => r.status !== "問合せ中").length;
  const maxSales = Math.max(...SALES_HISTORY.map((d) => d.sales));
  // 連絡忘れ防止: 接客中で終了が近い予約
  const endingSoon = reservations.filter((r) => r.status === "接客中").map((r) => ({ ...r, endAt: r.start + r.dur }));

  return (
    <div>
      <SectionTitle sub="本日の稼働状況をリアルタイムで確認">本日の稼働状況ボード</SectionTitle>
      {endingSoon.length > 0 && (
        <Card style={{ marginBottom: 16, borderColor: COLORS.accent, background: COLORS.accentBg }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.accentDark, marginBottom: 6 }}>🔔 迎え連絡アラート(連絡忘れ防止)</div>
          {endingSoon.map((r) => (
            <div key={r.id} style={{ fontSize: 12, color: COLORS.textMain }}>{Math.floor(r.endAt)}:{r.endAt % 1 ? "30" : "00"} 終了予定 — {r.customer} / {r.hotel}(迎えドライバー手配を確認)</div>
          ))}
        </Card>
      )}
      <div className="grid-4" style={{ marginBottom: 24 }}>
        <StatCard label="本日の売上" value={<Yen value={totalSalesToday} />} color={COLORS.accent} />
        <StatCard label="接客中" value={workingCasts.length} unit="名" />
        <StatCard label="待機中" value={waitingCasts.length} unit="名" />
        <StatCard label="進行中の予約" value={activeReservations} unit="件" />
      </div>
      <div className="board-3" style={{ marginBottom: 20 }}>
        <StatusColumn title="待機中" color={CAST_STATUS.waiting.color} casts={waitingCasts} />
        <StatusColumn title="接客中" color={CAST_STATUS.working.color} casts={workingCasts} />
        <StatusColumn title="出勤前" color={CAST_STATUS.before_shift.color} casts={beforeShiftCasts} />
      </div>
      <Card>
        <div style={{ color: COLORS.textSub, fontSize: 12, marginBottom: 14 }}>直近7日間の売上推移</div>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 160 }}>
          {SALES_HISTORY.map((d) => (
            <div key={d.date} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
              <div style={{ color: COLORS.textSub, fontSize: 10, fontFamily: "'JetBrains Mono', monospace" }}>{Math.round(d.sales / 1000)}k</div>
              <div style={{ width: "70%", background: `linear-gradient(180deg, ${COLORS.accent}, ${COLORS.accentDark})`, borderRadius: "4px 4px 0 0", height: `${(d.sales / maxSales) * 100}px` }} />
              <div style={{ color: COLORS.textSub, fontSize: 11 }}>{d.date}</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

// ============================================================
// タイムテーブル
// ============================================================
function Timetable({ reservations, casts }) {
  const hours = [18, 19, 20, 21, 22, 23, 24, 25];
  const castName = (id) => castFullName(casts.find((c) => c.id === id));
  const rows = reservations.filter((r) => r.castId);
  const colW = 90;
  const statusColor = (s) => (s === "接客中" ? COLORS.accent : s === "移動中" ? COLORS.blue : COLORS.green);
  return (
    <div>
      <SectionTitle sub="利用履歴から自動生成される時間割(接客中・移動中を色分け)">タイムテーブル</SectionTitle>
      <Card style={{ padding: 0, overflow: "hidden" }}>
        <div className="table-scroll">
          <div style={{ minWidth: 120 + hours.length * colW }}>
            <div style={{ display: "flex", background: "#EDF3FA", borderBottom: `1px solid ${COLORS.border}` }}>
              <div style={{ width: 120, padding: "10px 12px", fontSize: 12, color: COLORS.textSub, fontWeight: 600, flexShrink: 0 }}>キャスト</div>
              {hours.map((h) => <div key={h} style={{ width: colW, padding: "10px 0", textAlign: "center", fontSize: 12, color: COLORS.textSub, fontWeight: 600, fontFamily: "'JetBrains Mono', monospace", flexShrink: 0, borderLeft: `1px solid ${COLORS.border}` }}>{h}:00</div>)}
            </div>
            {rows.map((r) => {
              const left = (r.start - hours[0]) * colW;
              const width = r.dur * colW;
              return (
                <div key={r.id} style={{ display: "flex", borderBottom: `1px solid ${COLORS.border}`, position: "relative", height: 48 }}>
                  <div style={{ width: 120, padding: "0 12px", fontSize: 13, color: COLORS.textMain, flexShrink: 0, display: "flex", alignItems: "center" }}>{castName(r.castId)}</div>
                  <div style={{ position: "relative", flex: 1 }}>
                    {hours.map((h, i) => <div key={h} style={{ position: "absolute", left: i * colW, top: 0, bottom: 0, width: 1, background: COLORS.border }} />)}
                    <div style={{ position: "absolute", top: 8, left, width: width - 6, height: 32, background: `${statusColor(r.status)}22`, border: `1.5px solid ${statusColor(r.status)}`, borderRadius: 8, display: "flex", alignItems: "center", padding: "0 8px", fontSize: 11, color: statusColor(r.status), fontWeight: 600, overflow: "hidden", whiteSpace: "nowrap" }}>{r.customer} / {r.course}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </Card>
    </div>
  );
}

// ============================================================
// 出勤管理
// ============================================================
function ShiftManagement({ casts, setCasts }) {
  const updateStatus = (id, status) => setCasts((prev) => prev.map((c) => (c.id === id ? { ...c, status } : c)));
  return (
    <div>
      <SectionTitle sub={`キャストの出退勤・現在の状態を切り替え(全${casts.length}名)`}>出勤・稼働状況管理</SectionTitle>
      <Card style={{ padding: 0, overflow: "hidden" }}>
        <div className="table-scroll">
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 680 }}>
            <thead><tr style={{ background: "#EDF3FA" }}>{["源氏名", "本日シフト", "現在地(接客中)", "本数/売上", "状態", "状態を変更"].map((h) => <th key={h} style={{ textAlign: "left", padding: "12px 16px", fontSize: 12, color: COLORS.textSub, fontWeight: 600, borderBottom: `1px solid ${COLORS.border}` }}>{h}</th>)}</tr></thead>
            <tbody>
              {casts.map((c) => (
                <tr key={c.id} style={{ borderBottom: `1px solid ${COLORS.border}` }}>
                  <td style={{ padding: "12px 16px", color: COLORS.textMain, fontSize: 14 }}>{castFullName(c)}<span style={{ color: COLORS.textSub, fontSize: 12 }}> ({c.age})</span></td>
                  <td style={{ padding: "12px 16px", color: COLORS.textMain, fontSize: 13, fontFamily: "'JetBrains Mono', monospace" }}>{c.shiftStart === "-" ? "-" : `${c.shiftStart} - ${c.shiftEnd}`}</td>
                  <td style={{ padding: "12px 16px", color: COLORS.textMain, fontSize: 13 }}>{c.hotel || "-"}</td>
                  <td style={{ padding: "12px 16px", color: COLORS.textMain, fontSize: 13 }}>{c.todayCount}本 / <Yen value={c.todaySales} /></td>
                  <td style={{ padding: "12px 16px" }}><StatusChip status={c.status} /></td>
                  <td style={{ padding: "12px 16px" }}>
                    <select value={c.status} onChange={(e) => updateStatus(c.id, e.target.value)} style={{ background: "#FFFFFF", color: COLORS.textMain, border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: "6px 10px", fontSize: 12 }}>
                      {Object.entries(CAST_STATUS).map(([key, v]) => <option key={key} value={key}>{v.label}</option>)}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

// ============================================================
// 新規予約モーダル(顧客履歴引用 + バッティング防止)
// ============================================================
function NewReservationModal({ prefillCustomer, casts, drivers, reservations, courses, onClose, onCreate }) {
  const last = prefillCustomer?.history?.[0];
  const prefillCast = last ? findCast(casts, last.cast) : null;
  const [customer, setCustomer] = useState(prefillCustomer?.name || "");
  const [castName, setCastName] = useState(prefillCast ? castFullName(prefillCast) : (casts[0] ? castFullName(casts[0]) : ""));
  const [course, setCourse] = useState(last?.course || courses[0]?.name || "");
  const [hotel, setHotel] = useState(last?.hotel || ALL_HOTELS[0]);
  const [start, setStart] = useState("21");
  const [sendDriver, setSendDriver] = useState(drivers[0]?.car || "未定");

  const selectedCast = findCast(casts, castName);
  const startNum = Number(start);
  const conflict = reservations.find((r) => {
    if (r.castId !== selectedCast?.id) return false;
    return Math.abs(r.start - startNum) < 1.5;
  });
  const driverConflict = reservations.find((r) => r.sendDriver === sendDriver && sendDriver !== "未定" && Math.abs(r.start - startNum) < 1);

  const create = () => {
    const price = courses.find((c) => c.name === course)?.price || 0;
    onCreate({
      id: `r${reservations.length + 1}`, start: startNum, dur: course.includes("120") ? 2 : course.includes("90") ? 1.5 : 1,
      customer, castId: selectedCast?.id || null, area: hotelArea(hotel), hotel, course, price, status: "受付済", sendDriver, pickDriver: "未定",
    });
    onClose();
  };

  return (
    <Modal title="新規予約 受付" onClose={onClose} wide>
      {prefillCustomer && last && (
        <div style={{ background: COLORS.accentBg, borderRadius: 10, padding: 12, marginBottom: 14, fontSize: 12, color: COLORS.accentDark }}>
          📋 {prefillCustomer.name}の前回利用を引用: {last.cast} / {last.course} / {last.option} / {last.hotel}
        </div>
      )}
      <TextField label="顧客名" value={customer} onChange={setCustomer} placeholder="例: 田中様" />
      <SelectField label="指名キャスト" value={castName} onChange={setCastName} options={casts.map((c) => castFullName(c))} />
      <SelectField label="コース" value={course} onChange={setCourse} options={courses.map((c) => c.name)} />
      <SelectField label="ホテル" value={hotel} onChange={setHotel} options={ALL_HOTELS} />
      <div style={{ display: "flex", gap: 10 }}>
        <div style={{ flex: 1 }}><SelectField label="開始時刻" value={start} onChange={setStart} options={["18", "19", "20", "21", "22", "23", "24"]} /></div>
        <div style={{ flex: 1 }}><SelectField label="送りドライバー" value={sendDriver} onChange={setSendDriver} options={[...drivers.map((d) => d.car), "未定"]} /></div>
      </div>
      {conflict && <div style={{ color: COLORS.red, fontSize: 13, fontWeight: 700, marginBottom: 8 }}>⚠ バッティング警告: {castName}は{conflict.start}:00に既に予約があります</div>}
      {driverConflict && <div style={{ color: "#B58A1F", fontSize: 12, marginBottom: 8 }}>⚠ {sendDriver}は同時間帯に別の送迎があります</div>}
      <PrimaryButton onClick={create} disabled={!!conflict} style={{ width: "100%", marginTop: 6 }}>{conflict ? "重複のため受付不可" : "この内容で予約受付"}</PrimaryButton>
    </Modal>
  );
}

// ============================================================
// お仕事メール
// ============================================================
function WorkMailModal({ reservation, castName, onClose }) {
  const body = `【予約連絡】
キャスト: ${castName}
お客様: ${reservation.customer}
時間: ${reservation.start}:00〜(${reservation.course})
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

// ============================================================
// 予約管理
// ============================================================
function ReservationManagement({ reservations, setReservations, casts, drivers, courses }) {
  const [mailFor, setMailFor] = useState(null);
  const [newOpen, setNewOpen] = useState(false);
  const castName = (id) => castFullName(casts.find((c) => c.id === id));
  const statusColor = (s) => s === "接客中" ? COLORS.accent : s === "移動中" ? COLORS.blue : s === "受付済" ? COLORS.green : "#B5541F";
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 10 }}>
        <SectionTitle sub="受付内容と進行状況を確認。お仕事メールをワンクリック送信">予約管理</SectionTitle>
        <PrimaryButton onClick={() => setNewOpen(true)}>＋ 新規予約</PrimaryButton>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {reservations.map((r) => (
          <Card key={r.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
            <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 20, color: COLORS.textMain, minWidth: 56 }}>{r.start}:00</div>
              <div>
                <div style={{ color: COLORS.textMain, fontSize: 15 }}>{r.customer}<span style={{ color: COLORS.textSub, fontSize: 12 }}> ・ {r.course}</span></div>
                <div style={{ color: COLORS.textSub, fontSize: 12, marginTop: 2 }}><AreaHotel area={r.area} hotel={r.hotel} /> / 担当: {castName(r.castId)} / 送:{r.sendDriver} 迎:{r.pickDriver}</div>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", color: COLORS.textMain, fontSize: 14 }}><Yen value={r.price} /></div>
              <span style={{ padding: "4px 12px", borderRadius: 999, fontSize: 12, fontWeight: 600, color: statusColor(r.status), background: `${statusColor(r.status)}1F`, border: `1px solid ${statusColor(r.status)}44` }}>{r.status}</span>
              <button onClick={() => setMailFor(r)} style={{ padding: "6px 12px", borderRadius: 8, border: `1px solid ${COLORS.accent}`, background: "transparent", color: COLORS.accent, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>✉ メール</button>
            </div>
          </Card>
        ))}
      </div>
      {mailFor && <WorkMailModal reservation={mailFor} castName={castName(mailFor.castId)} onClose={() => setMailFor(null)} />}
      {newOpen && <NewReservationModal casts={casts} drivers={drivers} reservations={reservations} courses={courses} onClose={() => setNewOpen(false)} onCreate={(r) => setReservations((prev) => [...prev, r])} />}
    </div>
  );
}

// ============================================================
// 配車管理(マップ)
// ============================================================
function driverPinSvg(car, label, color) {
  const num = String(car || "").replace(/[^0-9]/g, "") || "?";
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='96' height='66' viewBox='0 0 96 66'>
    <rect x='6' y='2' rx='8' ry='8' width='84' height='22' fill='${color}'/>
    <text x='48' y='17' font-size='13' font-family='sans-serif' font-weight='700' fill='#ffffff' text-anchor='middle'>${label}</text>
    <circle cx='48' cy='42' r='14' fill='${color}' stroke='#ffffff' stroke-width='2.5'/>
    <text x='48' y='47' font-size='14' font-family='sans-serif' font-weight='700' fill='#ffffff' text-anchor='middle'>${num}</text>
    <path d='M48 58 l-7 -8 h14 z' fill='${color}'/>
  </svg>`;
  return "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(svg);
}

function DriverMap({ drivers, hotels, office }) {
  const ref = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);
  const routesRef = useRef([]);
  const officeMarkerRef = useRef(null);
  const [err, setErr] = useState("");

  const coordForDest = (dest) => {
    if (!dest) return null;
    if (dest === "営業所") return office ? { lat: office.lat, lng: office.lng } : null;
    const h = (hotels || []).find((x) => x.name === dest);
    return h && h.lat != null ? { lat: h.lat, lng: h.lng } : (HOTEL_COORDS[dest] || null);
  };

  const renderAll = (maps) => {
    // マーカー再描画
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];
    routesRef.current.forEach((r) => r.setMap(null));
    routesRef.current = [];

    // 営業所マーカー
    if (office && office.lat != null) {
      if (officeMarkerRef.current) officeMarkerRef.current.setMap(null);
      officeMarkerRef.current = new maps.Marker({
        position: { lat: office.lat, lng: office.lng }, map: mapRef.current, title: "営業所(出発・戻り)",
        label: { text: "営", color: "#fff", fontSize: "12px", fontWeight: "700" },
        icon: { path: maps.SymbolPath.CIRCLE, scale: 12, fillColor: "#20262E", fillOpacity: 1, strokeColor: "#fff", strokeWeight: 2 },
      });
    }

    drivers.forEach((d) => {
      if (!d.latlng) return;
      const st = DRIVER_STATUS[d.status] || { label: "-", color: "#7A8798" };
      // ピン(状態ラベル付き)
      const m = new maps.Marker({
        position: d.latlng, map: mapRef.current, title: `${d.car} ${d.name}(${st.label})`,
        icon: { url: driverPinSvg(d.car, st.label, st.color), anchor: new maps.Point(48, 58), scaledSize: new maps.Size(96, 66) },
        zIndex: 10,
      });
      markersRef.current.push(m);

      // ルート(待機中以外で目的地があるとき)
      const destPos = coordForDest(d.dest);
      if (d.status !== "waiting" && destPos) {
        const renderer = new maps.DirectionsRenderer({
          map: mapRef.current, suppressMarkers: true, preserveViewport: true,
          polylineOptions: { strokeColor: st.color, strokeWeight: 5, strokeOpacity: 0.85 },
        });
        const service = new maps.DirectionsService();
        service.route({ origin: d.latlng, destination: destPos, travelMode: maps.TravelMode.DRIVING }, (res, status) => {
          if (status === "OK") renderer.setDirections(res);
        });
        routesRef.current.push(renderer);
      }
    });
  };

  useEffect(() => {
    let cancelled = false;
    loadGoogleMaps().then((maps) => {
      if (cancelled || !ref.current) return;
      mapRef.current = new maps.Map(ref.current, {
        center: { lat: 33.5902, lng: 130.4017 }, zoom: 12,
        mapTypeControl: false, streetViewControl: false, fullscreenControl: false,
      });
      renderAll(maps);
    }).catch((e) => {
      setErr(e.message === "no-key"
        ? "地図APIキーが未設定です（VITE_GOOGLE_MAPS_API_KEY）。"
        : "地図の読み込みに失敗しました。ネットワークまたはキー制限をご確認ください。");
    });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (window.google && window.google.maps && mapRef.current) renderAll(window.google.maps);
  }, [drivers, hotels, office]);

  if (err) {
    return <div style={{ width: "100%", aspectRatio: "4 / 3", borderRadius: 10, border: `1px solid ${COLORS.border}`, background: "#F2F5F9", display: "flex", alignItems: "center", justifyContent: "center", padding: 16, textAlign: "center", color: COLORS.red, fontSize: 13 }}>{err}</div>;
  }
  return <div ref={ref} style={{ width: "100%", aspectRatio: "4 / 3", borderRadius: 10, border: `1px solid ${COLORS.border}`, overflow: "hidden" }} />;
}

function DispatchMap({ drivers, reservations, casts, hotels, office }) {
  const castName = (id) => casts.find((c) => c.id === id) ? castFullName(casts.find((x) => x.id === id)) : "-";
  return (
    <div>
      <SectionTitle sub="ドライバーの現在位置・状態・向かう先を確認">配車管理</SectionTitle>
      <div className="grid-2">
        <Card style={{ padding: 12 }}>
          <DriverMap drivers={drivers} hotels={hotels} office={office} />
          <div style={{ display: "flex", gap: 14, marginTop: 12, flexWrap: "wrap" }}>
            {Object.entries(DRIVER_STATUS).map(([key, v]) => <div key={key} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: COLORS.textSub }}><span style={{ width: 8, height: 8, borderRadius: "50%", background: v.color }} />{v.label}</div>)}
          </div>
        </Card>
        <Card>
          <div style={{ color: COLORS.textSub, fontSize: 12, marginBottom: 12 }}>ドライバー一覧</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {drivers.map((d) => (
              <div key={d.id} style={{ padding: "10px 0", borderBottom: `1px solid ${COLORS.border}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ color: COLORS.textMain, fontSize: 14, fontWeight: 600 }}>{d.car} ・ {d.name}</div>
                  <span style={{ fontSize: 11, fontWeight: 700, color: DRIVER_STATUS[d.status].color, background: `${DRIVER_STATUS[d.status].color}1F`, padding: "2px 8px", borderRadius: 999 }}>{DRIVER_STATUS[d.status].label}</span>
                </div>
                <div style={{ color: COLORS.textSub, fontSize: 12, marginTop: 4 }}>{d.note}</div>
              </div>
            ))}
          </div>
          <div style={{ color: COLORS.textSub, fontSize: 12, margin: "18px 0 12px" }}>送迎対応中の予約</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {reservations.filter((r) => r.status === "接客中" || r.status === "移動中").map((r) => <div key={r.id} style={{ fontSize: 12, color: COLORS.textMain }}>{r.start}:00 {r.customer} → {castName(r.castId)} / <AreaHotel area={r.area} hotel={r.hotel} /></div>)}
          </div>
        </Card>
      </div>
    </div>
  );
}

// ============================================================
// ドライバーページ(予約状態の絞り込み)
// ============================================================
function DriverPage({ reservations, casts, drivers }) {
  const [filter, setFilter] = useState("すべて");
  const castName = (id) => casts.find((c) => c.id === id) ? castFullName(casts.find((x) => x.id === id)) : "-";
  const filters = ["すべて", "受付済", "移動中", "接客中"];
  const rows = reservations.filter((r) => filter === "すべて" ? r.status !== "問合せ中" : r.status === filter);
  return (
    <div>
      <SectionTitle sub="外出中のドライバー専用。担当予約を状態で絞り込み">ドライバーページ</SectionTitle>
      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        {filters.map((f) => <button key={f} onClick={() => setFilter(f)} style={{ padding: "8px 16px", borderRadius: 999, border: `1px solid ${filter === f ? COLORS.accent : COLORS.border}`, background: filter === f ? COLORS.accent : "#FFF", color: filter === f ? "#FFF" : COLORS.textMain, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>{f}</button>)}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {rows.map((r) => (
          <Card key={r.id}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
              <div>
                <div style={{ fontSize: 15, color: COLORS.textMain, fontWeight: 600 }}>{r.start}:00 {castName(r.castId)} 担当</div>
                <div style={{ fontSize: 12, color: COLORS.textSub, marginTop: 2 }}>{r.customer} / <AreaHotel area={r.area} hotel={r.hotel} /></div>
                <div style={{ fontSize: 12, color: COLORS.textSub, marginTop: 2 }}>送:{r.sendDriver} 迎:{r.pickDriver}</div>
              </div>
              <span style={{ padding: "4px 12px", borderRadius: 999, fontSize: 12, fontWeight: 600, color: COLORS.accent, background: COLORS.accentBg }}>{r.status}</span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// 顧客管理
// ============================================================
function CustomerDetail({ customer, onQuote }) {
  return (
    <div style={{ marginTop: 10, paddingTop: 10, borderTop: `1px dashed ${COLORS.border}` }}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 20px", marginBottom: 10 }}>
        <div style={{ fontSize: 12, color: COLORS.textSub }}>電話: <span style={{ color: COLORS.textMain, fontFamily: "'JetBrains Mono', monospace" }}>{customer.phones.join(" / ")}</span></div>
        {customer.email && <div style={{ fontSize: 12, color: COLORS.textSub }}>Mail: <span style={{ color: COLORS.textMain }}>{customer.email}</span></div>}
        <div style={{ fontSize: 12, color: COLORS.textSub }}>住所: <span style={{ color: COLORS.textMain }}>{customer.address}</span></div>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <div style={{ color: COLORS.textSub, fontSize: 12 }}>直近{customer.history.length}回の利用履歴</div>
        <button onClick={() => onQuote(customer)} style={{ padding: "5px 12px", borderRadius: 8, border: `1px solid ${COLORS.accent}`, background: "transparent", color: COLORS.accent, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>履歴を引用して予約</button>
      </div>
      <div className="table-scroll">
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 560 }}>
          <thead><tr>{["利用日", "指名", "コース", "オプション", "ホテル", "料金"].map((h) => <th key={h} style={{ textAlign: "left", padding: "6px 10px", fontSize: 11, color: COLORS.textSub, fontWeight: 600, borderBottom: `1px solid ${COLORS.border}` }}>{h}</th>)}</tr></thead>
          <tbody>
            {customer.history.map((h, i) => (
              <tr key={i} style={{ borderBottom: `1px solid ${COLORS.border}` }}>
                <td style={{ padding: "6px 10px", fontSize: 12, color: COLORS.textMain, fontFamily: "'JetBrains Mono', monospace" }}>{h.date}</td>
                <td style={{ padding: "6px 10px", fontSize: 12, color: COLORS.textMain }}>{h.cast}</td>
                <td style={{ padding: "6px 10px", fontSize: 12, color: COLORS.textMain }}>{h.course}</td>
                <td style={{ padding: "6px 10px", fontSize: 12, color: COLORS.textMain }}>{h.option}</td>
                <td style={{ padding: "6px 10px", fontSize: 12, color: COLORS.textMain }}>{h.hotel}</td>
                <td style={{ padding: "6px 10px", fontSize: 12, color: COLORS.textMain }}><Yen value={h.price} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
function CustomerManagement({ customers, setCustomers, onQuote }) {
  const [query, setQuery] = useState("");
  const [openId, setOpenId] = useState(null);
  const filtered = useMemo(() => customers.filter((c) => c.name.includes(query) || c.phones.some((p) => p.includes(query))), [customers, query]);
  const cycleColor = (id) => {
    const order = ["normal", "vip", "caution", "ng"];
    setCustomers((prev) => prev.map((c) => c.id === id ? { ...c, colorLevel: order[(order.indexOf(c.colorLevel) + 1) % order.length] } : c));
  };
  return (
    <div>
      <SectionTitle sub="名前タップで利用履歴。色ラベルで要注意客を瞬時に判別">顧客管理・NGリスト</SectionTitle>
      <input placeholder="名前・電話番号で検索" value={query} onChange={(e) => setQuery(e.target.value)} style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: `1px solid ${COLORS.border}`, background: "#FFFFFF", color: COLORS.textMain, fontSize: 14, marginBottom: 16, boxSizing: "border-box" }} />
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {filtered.map((c) => {
          const cl = CUSTOMER_COLORS[c.colorLevel];
          return (
            <Card key={c.id} style={{ borderColor: c.colorLevel === "normal" ? COLORS.border : cl.color, background: cl.bg === "transparent" ? COLORS.panel : cl.bg }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
                <div style={{ cursor: "pointer", flex: 1, minWidth: 200 }} onClick={() => setOpenId(openId === c.id ? null : c.id)}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ color: COLORS.accent, fontSize: 15, fontWeight: 600, textDecoration: "underline" }}>{c.name}</span>
                    <span style={{ fontSize: 11, color: cl.color, background: `${cl.color}1F`, padding: "2px 8px", borderRadius: 999, fontWeight: 700 }}>{cl.label}</span>
                  </div>
                  <div style={{ color: COLORS.textSub, fontSize: 12, marginTop: 2 }}>{c.phones[0]} ・ 来店{c.visits}回 ・ 最終来店 {c.lastVisit}</div>
                  {c.note && <div style={{ color: COLORS.textMain, fontSize: 12, marginTop: 4 }}>{c.note}</div>}
                </div>
                <button onClick={() => cycleColor(c.id)} style={{ padding: "8px 14px", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer", border: `1px solid ${cl.color}`, background: "transparent", color: cl.color, flexShrink: 0 }}>色区分を変更</button>
              </div>
              {openId === c.id && <CustomerDetail customer={c} onQuote={onQuote} />}
            </Card>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================
// 媒体・HP更新(AI自動生成: 店長コメント・写メ日記)
// ============================================================
function MediaTab({ casts, setCasts }) {
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

// ============================================================
// 集計
// ============================================================
function Report() {
  const [period, setPeriod] = useState("日");
  const d = REPORT_DATA[period];
  return (
    <div>
      <SectionTitle sub="客数・入電数・売上・委託費・店落ちを自動集計">データ集計</SectionTitle>
      <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
        {["日", "月", "年"].map((p) => <button key={p} onClick={() => setPeriod(p)} style={{ padding: "8px 20px", borderRadius: 8, border: `1px solid ${period === p ? COLORS.accent : COLORS.border}`, background: period === p ? COLORS.accent : "#FFF", color: period === p ? "#FFF" : COLORS.textMain, fontWeight: 600, fontSize: 14, cursor: "pointer" }}>{p}別</button>)}
      </div>
      <div className="grid-5">
        <StatCard label="入電数" value={d.calls} unit="件" color={COLORS.blue} />
        <StatCard label="客数" value={d.customers} unit="人" color={COLORS.purple} />
        <StatCard label="売上金" value={<Yen value={d.sales} />} color={COLORS.accent} />
        <StatCard label="委託費" value={<Yen value={d.itaku} />} color={COLORS.green} />
        <StatCard label="店落ち" value={<Yen value={d.ochi} />} color={COLORS.textMain} />
      </div>
      <Card style={{ marginTop: 16 }}>
        <div style={{ color: COLORS.textSub, fontSize: 12, marginBottom: 6 }}>成約率(客数 ÷ 入電数)</div>
        <div style={{ fontSize: 26, color: COLORS.accent, fontFamily: "'JetBrains Mono', monospace" }}>{Math.round((d.customers / d.calls) * 100)}%</div>
      </Card>
    </div>
  );
}

// ============================================================
// 会計(仕訳帳・財務諸表・仕訳辞書・総額/純額・時給・清算方法)
// ============================================================
function AccountingTab({ casts, drivers }) {
  const [subtab, setSubtab] = useState("shiwake");
  const [method, setMethod] = useState("総額"); // 総額 / 純額
  const [settle, setSettle] = useState("事務所渡し"); // 清算方法
  const [expenses, setExpenses] = useState(INITIAL_EXPENSES);
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

// ============================================================
// 委託費(給与)
// ============================================================
function Payout({ casts }) {
  const activeCasts = casts.filter((c) => c.todaySales > 0);
  const totalSales = activeCasts.reduce((a, c) => a + c.todaySales, 0);
  const totalPayout = activeCasts.reduce((a, c) => a + Math.round(c.todaySales * c.itakuRate), 0);
  return (
    <div>
      <SectionTitle sub="キャストごとの委託費率で自動計算(設定で個別変更可)">委託費(給与)</SectionTitle>
      <div className="grid-3" style={{ marginBottom: 20 }}>
        <StatCard label="総売上" value={<Yen value={totalSales} />} />
        <StatCard label="委託費合計" value={<Yen value={totalPayout} />} color={COLORS.accent} />
        <StatCard label="店落ち合計" value={<Yen value={totalSales - totalPayout} />} color={COLORS.blue} />
      </div>
      <Card style={{ padding: 0, overflow: "hidden" }}>
        <div className="table-scroll">
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 560 }}>
            <thead><tr style={{ background: "#EDF3FA" }}>{["キャスト", "本数", "売上", "委託率", "委託費", "店落ち"].map((h) => <th key={h} style={{ textAlign: "left", padding: "12px 16px", fontSize: 12, color: COLORS.textSub, fontWeight: 600, borderBottom: `1px solid ${COLORS.border}` }}>{h}</th>)}</tr></thead>
            <tbody>
              {activeCasts.map((c) => {
                const it = Math.round(c.todaySales * c.itakuRate);
                return (
                  <tr key={c.id} style={{ borderBottom: `1px solid ${COLORS.border}` }}>
                    <td style={{ padding: "12px 16px", color: COLORS.textMain, fontSize: 14 }}>{castFullName(c)}</td>
                    <td style={{ padding: "12px 16px", color: COLORS.textMain, fontSize: 13 }}>{c.todayCount}本</td>
                    <td style={{ padding: "12px 16px", color: COLORS.textMain, fontSize: 13 }}><Yen value={c.todaySales} /></td>
                    <td style={{ padding: "12px 16px", color: COLORS.textSub, fontSize: 13 }}>{Math.round(c.itakuRate * 100)}%</td>
                    <td style={{ padding: "12px 16px", color: COLORS.accent, fontSize: 13 }}><Yen value={it} /></td>
                    <td style={{ padding: "12px 16px", color: COLORS.blue, fontSize: 13 }}><Yen value={c.todaySales - it} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

// ============================================================
// STD検査管理
// ============================================================
function daysBetween(dateStr) {
  const last = new Date(dateStr); const now = new Date(2026, 5, 30);
  return Math.floor((now - last) / (1000 * 60 * 60 * 24));
}
function StdManagement({ casts }) {
  const CYCLE = 90;
  const rows = casts.filter((c) => c.status !== "off").map((c) => {
    const days = daysBetween(c.stdLast); const remain = CYCLE - days;
    const level = remain < 0 ? "expired" : remain <= 14 ? "soon" : "ok";
    return { ...c, days, remain, level };
  }).sort((a, b) => a.remain - b.remain);
  const levelStyle = { expired: { label: "期限切れ", color: COLORS.red }, soon: { label: "要検査", color: "#B58A1F" }, ok: { label: "問題なし", color: COLORS.green } };
  const alertCount = rows.filter((r) => r.level !== "ok").length;
  return (
    <div>
      <SectionTitle sub={`検査サイクル${CYCLE}日。期限が近いキャストを自動でアラート`}>STD検査管理</SectionTitle>
      {alertCount > 0 && <Card style={{ marginBottom: 16, borderColor: COLORS.red, background: "rgba(192,73,43,0.06)" }}><div style={{ color: COLORS.red, fontSize: 14, fontWeight: 700 }}>⚠ {alertCount}名のキャストが検査期限切れ・期限間近です</div></Card>}
      <Card style={{ padding: 0, overflow: "hidden" }}>
        <div className="table-scroll">
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 560 }}>
            <thead><tr style={{ background: "#EDF3FA" }}>{["源氏名", "前回検査日", "経過日数", "次回まで", "状態"].map((h) => <th key={h} style={{ textAlign: "left", padding: "12px 16px", fontSize: 12, color: COLORS.textSub, fontWeight: 600, borderBottom: `1px solid ${COLORS.border}` }}>{h}</th>)}</tr></thead>
            <tbody>
              {rows.map((c) => {
                const ls = levelStyle[c.level];
                return (
                  <tr key={c.id} style={{ borderBottom: `1px solid ${COLORS.border}` }}>
                    <td style={{ padding: "12px 16px", color: COLORS.textMain, fontSize: 14 }}>{castFullName(c)}</td>
                    <td style={{ padding: "12px 16px", color: COLORS.textMain, fontSize: 13, fontFamily: "'JetBrains Mono', monospace" }}>{c.stdLast}</td>
                    <td style={{ padding: "12px 16px", color: COLORS.textMain, fontSize: 13 }}>{c.days}日</td>
                    <td style={{ padding: "12px 16px", color: c.remain < 0 ? COLORS.red : COLORS.textMain, fontSize: 13 }}>{c.remain < 0 ? `${-c.remain}日超過` : `あと${c.remain}日`}</td>
                    <td style={{ padding: "12px 16px" }}><span style={{ fontSize: 11, fontWeight: 700, color: ls.color, background: `${ls.color}1F`, padding: "3px 10px", borderRadius: 999 }}>{ls.label}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

// ============================================================
// キャストマイページ
// ============================================================
function CastMyPage({ casts, reservations }) {
  const me = casts.find((c) => c.name === "みお") || casts[0];
  const myRes = reservations.filter((r) => r.castId === me.id);
  const itaku = Math.round(me.todaySales * me.itakuRate);
  const [diary, setDiary] = useState("");
  const [loading, setLoading] = useState(false);
  const genDiary = async () => { setLoading(true); try { setDiary(await generateCopy("diary", me.name, "")); } catch (e) {} setLoading(false); };
  return (
    <div>
      <SectionTitle sub={`ログイン中: ${castFullName(me)}`}>キャストマイページ</SectionTitle>
      <div className="grid-3" style={{ marginBottom: 16 }}>
        <StatCard label="本日の本数" value={me.todayCount} unit="本" />
        <StatCard label="本日の売上" value={<Yen value={me.todaySales} />} color={COLORS.accent} />
        <StatCard label="本日の委託費" value={<Yen value={itaku} />} color={COLORS.green} />
      </div>
      <div className="grid-2">
        <Card>
          <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.textMain, marginBottom: 12 }}>本日のスケジュール・予約</div>
          <div style={{ fontSize: 13, color: COLORS.textMain, marginBottom: 10 }}>シフト: {me.shiftStart}〜{me.shiftEnd}</div>
          {myRes.length === 0 ? <div style={{ fontSize: 12, color: COLORS.textSub }}>本日の予約はありません</div> : myRes.map((r) => (
            <div key={r.id} style={{ padding: "8px 0", borderBottom: `1px solid ${COLORS.border}`, fontSize: 13, color: COLORS.textMain }}>{r.start}:00 {r.customer} / {r.course} / {r.hotel}</div>
          ))}
          <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.textMain, margin: "18px 0 10px" }}>委託費明細</div>
          <div style={{ fontSize: 13, color: COLORS.textSub }}>本日 <Yen value={itaku} />(委託率{Math.round(me.itakuRate * 100)}%)/ 清算: 事務所渡し</div>
        </Card>
        <Card>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.textMain }}>写メ日記を投稿</div>
            <button onClick={genDiary} disabled={loading} style={{ padding: "6px 14px", borderRadius: 8, border: "none", background: loading ? "#C7D0DB" : COLORS.accent, color: "#FFF", fontSize: 12, fontWeight: 700, cursor: loading ? "default" : "pointer" }}>{loading ? "生成中…" : "✨ AI自動生成"}</button>
          </div>
          <textarea value={diary} onChange={(e) => setDiary(e.target.value)} placeholder="日記を書く、またはAI自動生成" rows={6} style={{ width: "100%", padding: 12, borderRadius: 10, border: `1px solid ${COLORS.border}`, fontSize: 13, fontFamily: "'Noto Sans JP', sans-serif", resize: "vertical", boxSizing: "border-box" }} />
          <PrimaryButton onClick={() => {}} style={{ marginTop: 10, width: "100%" }}>投稿する(デモ)</PrimaryButton>
        </Card>
      </div>
    </div>
  );
}

// ============================================================
// 設定
// ============================================================
function CastRegisterForm({ setCasts }) {
  const [sei, setSei] = useState(""); const [name, setName] = useState(""); const [age, setAge] = useState(""); const [honmyo, setHonmyo] = useState("");
  const [rate, setRate] = useState("55"); const [msg, setMsg] = useState("");
  const submit = () => {
    if (!name.trim()) { setMsg("源氏名(名)を入力してください"); return; }
    setCasts((prev) => [...prev, { id: `c${prev.length + 1}`, sei: sei.trim() || "新人", name: name.trim(), honmyo, age: Number(age) || 20, birthday: "-", status: "before_shift", phone: "090-0000-0000", address: "-", idType: "運転免許証", idNo: "-", joinDate: "2026-07-01", shiftStart: "18:00", shiftEnd: "24:00", hotel: null, todayCount: 0, todaySales: 0, itakuRate: (Number(rate) || 55) / 100, idVerified: false, stdLast: "2026-06-01", okOptions: ["指名"], comment: "" }]);
    setMsg(`${sei} ${name} を登録しました`); setSei(""); setName(""); setAge(""); setHonmyo("");
  };
  return (
    <Card>
      <div style={{ fontSize: 15, fontWeight: 700, color: COLORS.textMain, marginBottom: 14 }}>キャスト登録</div>
      <div style={{ display: "flex", gap: 10 }}>
        <div style={{ flex: 1 }}><TextField label="源氏名(姓)" value={sei} onChange={setSei} placeholder="例: 白石" /></div>
        <div style={{ flex: 1 }}><TextField label="源氏名(名)" value={name} onChange={setName} placeholder="例: みさき" /></div>
      </div>
      <TextField label="本名(名簿用)" value={honmyo} onChange={setHonmyo} placeholder="例: 山田 花子" />
      <div style={{ display: "flex", gap: 10 }}>
        <div style={{ flex: 1 }}><TextField label="年齢" value={age} onChange={setAge} placeholder="24" type="number" /></div>
        <div style={{ flex: 1 }}><TextField label="委託率(%)" value={rate} onChange={setRate} type="number" /></div>
      </div>
      <PrimaryButton onClick={submit}>登録する</PrimaryButton>
      {msg && <div style={{ marginTop: 10, fontSize: 12, color: COLORS.green }}>{msg}</div>}
      <div style={{ fontSize: 11, color: COLORS.textSub, marginTop: 8 }}>生年月日・住所・免許証などの詳細はキャスト一覧の「詳細」から編集できます。</div>
    </Card>
  );
}
function DriverRegisterForm({ setDrivers }) {
  const [name, setName] = useState(""); const [car, setCar] = useState(""); const [wage, setWage] = useState("1300"); const [msg, setMsg] = useState("");
  const submit = () => {
    if (!name.trim() || !car.trim()) { setMsg("名前と車両番号を入力してください"); return; }
    setDrivers((prev) => [...prev, { id: `d${prev.length + 1}`, name: name.trim(), car: car.trim(), status: "waiting", pos: { x: 50, y: 50 }, note: "待機中", wage: Number(wage) || 1300, hours: 0 }]);
    setMsg(`${name}(${car}) を登録しました`); setName(""); setCar("");
  };
  return (
    <Card>
      <div style={{ fontSize: 15, fontWeight: 700, color: COLORS.textMain, marginBottom: 14 }}>ドライバー登録</div>
      <TextField label="ドライバー名" value={name} onChange={setName} placeholder="例: 山田" />
      <div style={{ display: "flex", gap: 10 }}>
        <div style={{ flex: 1 }}><TextField label="車両番号" value={car} onChange={setCar} placeholder="例: 5号車" /></div>
        <div style={{ flex: 1 }}><TextField label="時給(円)" value={wage} onChange={setWage} type="number" /></div>
      </div>
      <PrimaryButton onClick={submit}>登録する</PrimaryButton>
      {msg && <div style={{ marginTop: 10, fontSize: 12, color: COLORS.green }}>{msg}</div>}
    </Card>
  );
}
function StaffRegisterForm() {
  const [staff, setStaff] = useState(INITIAL_STAFF);
  const [name, setName] = useState(""); const [role, setRole] = useState(ROLES[0]);
  const add = () => { if (!name.trim()) return; setStaff((prev) => [...prev, { id: `s${prev.length + 1}`, name: name.trim(), role }]); setName(""); };
  return (
    <Card>
      <div style={{ fontSize: 15, fontWeight: 700, color: COLORS.textMain, marginBottom: 14 }}>スタッフ登録(役職別)</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 14 }}>
        {staff.map((s) => <div key={s.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: COLORS.textMain, padding: "6px 10px", background: "#EDF3FA", borderRadius: 8 }}><span>{s.name}</span><span style={{ color: COLORS.textSub }}>{s.role}</span></div>)}
      </div>
      <TextField label="氏名" value={name} onChange={setName} placeholder="例: 田中" />
      <SelectField label="役職" value={role} onChange={setRole} options={ROLES} />
      <PrimaryButton onClick={add}>スタッフを追加</PrimaryButton>
    </Card>
  );
}
function MasterForm() {
  const [courses, setCourses] = useState(INITIAL_COURSES);
  const [options, setOptions] = useState(INITIAL_OPTIONS);
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
function SecurityToggle({ label, desc, on, set }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: `1px solid ${COLORS.border}` }}>
      <div><div style={{ fontSize: 14, color: COLORS.textMain }}>{label}</div><div style={{ fontSize: 12, color: COLORS.textSub }}>{desc}</div></div>
      <button onClick={() => set(!on)} style={{ width: 46, height: 26, borderRadius: 999, border: "none", background: on ? COLORS.accent : "#C7D0DB", position: "relative", cursor: "pointer", flexShrink: 0 }}>
        <span style={{ position: "absolute", top: 3, left: on ? 23 : 3, width: 20, height: 20, borderRadius: "50%", background: "#FFF", transition: "left 0.15s" }} />
      </button>
    </div>
  );
}
function SecurityForm() {
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
function csvEscape(v) { const s = String(v ?? ""); return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; }
function parseCSV(text) {
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
function nextHotelId(hotels) { let max = 0; hotels.forEach((h) => { const n = parseInt(h.id, 10); if (!isNaN(n) && n > max) max = n; }); return String(max + 1).padStart(4, "0"); }

function HotelForm({ hotels, setHotels, office, setOffice }) {
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
        <div style={{ fontSize: 12, color: COLORS.textSub, marginBottom: 12 }}>CSV列：id,name,area,address ／ 差分はホテルIDで判定(同一IDは上書き・新規IDは追加・CSVに無い既存は保持)</div>

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

const SETTINGS_SUBTABS = [
  { key: "cast", label: "キャスト登録" }, { key: "driver", label: "ドライバー登録" }, { key: "hotel", label: "ホテル・営業所" }, { key: "staff", label: "スタッフ登録" }, { key: "master", label: "項目登録" }, { key: "security", label: "セキュリティ" },
];
function SettingsTab({ setCasts, setDrivers, hotels, setHotels, office, setOffice }) {
  const [sub, setSub] = useState("cast");
  return (
    <div>
      <SectionTitle sub="キャスト・ドライバー・ホテル・スタッフ・項目・セキュリティの管理">設定</SectionTitle>
      <div style={{ display: "flex", gap: 8, marginBottom: 18, flexWrap: "wrap" }}>
        {SETTINGS_SUBTABS.map((t) => <button key={t.key} onClick={() => setSub(t.key)} style={{ padding: "8px 16px", borderRadius: 8, border: `1px solid ${sub === t.key ? COLORS.accent : COLORS.border}`, background: sub === t.key ? COLORS.accent : "#FFF", color: sub === t.key ? "#FFF" : COLORS.textMain, fontWeight: 600, fontSize: 13, cursor: "pointer" }}>{t.label}</button>)}
      </div>
      {sub === "cast" && <CastRegisterForm setCasts={setCasts} />}
      {sub === "driver" && <DriverRegisterForm setDrivers={setDrivers} />}
      {sub === "hotel" && <HotelForm hotels={hotels} setHotels={setHotels} office={office} setOffice={setOffice} />}
      {sub === "staff" && <StaffRegisterForm />}
      {sub === "master" && <MasterForm />}
      {sub === "security" && <SecurityForm />}
    </div>
  );
}

// ============================================================
// キャスト一覧(個人情報・対応可能オプション・詳細/編集)
// ============================================================
function CastDetailModal({ cast, onClose, onSave }) {
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

function CastList({ casts, setCasts }) {
  const [query, setQuery] = useState("");
  const [detailId, setDetailId] = useState(null);
  const rows = casts.filter((c) => castFullName(c).includes(query) || c.honmyo.includes(query));
  const detailCast = casts.find((c) => c.id === detailId);
  return (
    <div>
      <SectionTitle sub={`在籍キャストの名簿。詳細ボタンで個人情報の確認・編集(全${casts.length}名)`}>キャスト一覧</SectionTitle>
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
    </div>
  );
}

// ============================================================
// メインアプリ
// ============================================================
const TAB_GROUPS = [
  { group: "業務", tabs: [
    { key: "dashboard", label: "ダッシュボード" }, { key: "timetable", label: "タイムテーブル" },
    { key: "shift", label: "出勤管理" }, { key: "castlist", label: "キャスト一覧" },
    { key: "reservation", label: "予約管理" }, { key: "dispatch", label: "配車管理" },
  ] },
  { group: "顧客・媒体", tabs: [
    { key: "customer", label: "顧客・NGリスト" }, { key: "media", label: "媒体・HP更新" },
  ] },
  { group: "経営", tabs: [
    { key: "report", label: "集計" }, { key: "accounting", label: "会計" }, { key: "payout", label: "委託費" },
  ] },
  { group: "現場", tabs: [
    { key: "driverpage", label: "ドライバーページ" }, { key: "mypage", label: "キャストマイページ" },
  ] },
  { group: "管理", tabs: [
    { key: "std", label: "STD検査" }, { key: "settings", label: "設定" },
  ] },
];
const ALL_TABS = TAB_GROUPS.flatMap((g) => g.tabs);

function HamburgerIcon({ onClick }) {
  return (
    <button onClick={onClick} aria-label="メニューを開く" style={{ width: 36, height: 36, borderRadius: 8, border: `1px solid ${COLORS.border}`, background: "#FFFFFF", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", gap: 4, cursor: "pointer", flexShrink: 0 }}>
      <span style={{ width: 16, height: 2, background: COLORS.textMain, borderRadius: 1 }} />
      <span style={{ width: 16, height: 2, background: COLORS.textMain, borderRadius: 1 }} />
      <span style={{ width: 16, height: 2, background: COLORS.textMain, borderRadius: 1 }} />
    </button>
  );
}

export default function KanriApp() {
  const [role, setRole] = useState("owner");
  const [tab, setTab] = useState("dashboard");
  const [casts, setCasts] = useState(INITIAL_CASTS);
  const [customers, setCustomers] = useState(INITIAL_CUSTOMERS);
  const [drivers, setDrivers] = useState(INITIAL_DRIVERS);
  const [hotels, setHotels] = useState(INITIAL_HOTELS);
  const [office, setOffice] = useState(DEFAULT_OFFICE);
  const [reservations, setReservations] = useState(INITIAL_RESERVATIONS);
  const [menuOpen, setMenuOpen] = useState(false);
  const [ctiCustomer, setCtiCustomer] = useState(null);
  const [quoteCustomer, setQuoteCustomer] = useState(null);

  const allowed = VIEW_ROLES[role].tabs;
  const visibleGroups = TAB_GROUPS.map((g) => ({ ...g, tabs: g.tabs.filter((t) => allowed.includes(t.key)) })).filter((g) => g.tabs.length > 0);
  const currentLabel = ALL_TABS.find((t) => t.key === tab)?.label ?? "";

  const changeRole = (r) => {
    setRole(r);
    const firstTab = VIEW_ROLES[r].tabs[0];
    setTab(firstTab); setMenuOpen(false);
  };
  const simulateCall = () => setCtiCustomer(customers[Math.floor(Math.random() * customers.length)]);
  const startQuote = (cust) => { setCtiCustomer(null); setQuoteCustomer(cust); };

  return (
    <div style={{ minHeight: "100vh", background: COLORS.bg, color: COLORS.textMain, fontFamily: "'Noto Sans JP', sans-serif" }}>
      <style>{GLOBAL_CSS}</style>

      <div className="topbar">
        <HamburgerIcon onClick={() => setMenuOpen(true)} />
        <div style={{ fontFamily: "'Zen Old Mincho', serif", fontSize: 16, color: COLORS.accent }}>{currentLabel}</div>
        <button onClick={simulateCall} style={{ marginLeft: "auto", padding: "6px 12px", borderRadius: 8, border: `1px solid ${COLORS.accent}`, background: "#FFF", color: COLORS.accent, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>📞 着信</button>
      </div>

      <div style={{ display: "flex" }}>
        <div className={`overlay ${menuOpen ? "open" : ""}`} onClick={() => setMenuOpen(false)} />
        <div className={`sidebar ${menuOpen ? "open" : ""}`}>
          <div style={{ fontFamily: "'Zen Old Mincho', serif", fontSize: 18, color: COLORS.accent, marginBottom: 2 }}>業務管理システム</div>
          <div style={{ fontSize: 11, color: COLORS.textSub, marginBottom: 14 }}>DEMO ・ サンプルデータ表示中</div>

          <div style={{ marginBottom: 14 }}>
            <label style={{ display: "block", fontSize: 11, color: COLORS.textSub, fontWeight: 700, marginBottom: 5, letterSpacing: 1 }}>ログイン権限(切替)</label>
            <select value={role} onChange={(e) => changeRole(e.target.value)} style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: `1px solid ${COLORS.border}`, background: "#FFF", color: COLORS.textMain, fontSize: 13 }}>
              {Object.entries(VIEW_ROLES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </div>

          {allowed.includes("customer") || allowed.includes("dashboard") ? (
            <button onClick={simulateCall} style={{ width: "100%", padding: "10px 0", borderRadius: 8, border: "none", background: COLORS.accent, color: "#FFF", fontSize: 13, fontWeight: 700, cursor: "pointer", marginBottom: 16 }}>📞 着信テスト(CTI)</button>
          ) : null}

          {visibleGroups.map((g) => (
            <div key={g.group} style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 11, color: COLORS.textSub, fontWeight: 700, padding: "0 6px 6px", letterSpacing: 1 }}>{g.group}</div>
              {g.tabs.map((t) => (
                <div key={t.key} onClick={() => { setTab(t.key); setMenuOpen(false); }} style={{ padding: "9px 14px", borderRadius: 8, marginBottom: 3, cursor: "pointer", fontSize: 14, fontWeight: tab === t.key ? 700 : 400, color: tab === t.key ? "#FFFFFF" : COLORS.textMain, background: tab === t.key ? COLORS.accent : "transparent", transition: "background 0.15s" }}>{t.label}</div>
              ))}
            </div>
          ))}
        </div>

        <div className="main-content" style={{ flex: 1, padding: "28px 32px", minWidth: 0 }}>
          {tab === "dashboard" && <Dashboard casts={casts} reservations={reservations} />}
          {tab === "timetable" && <Timetable reservations={reservations} casts={casts} />}
          {tab === "shift" && <ShiftManagement casts={casts} setCasts={setCasts} />}
          {tab === "castlist" && <CastList casts={casts} setCasts={setCasts} />}
          {tab === "reservation" && <ReservationManagement reservations={reservations} setReservations={setReservations} casts={casts} drivers={drivers} courses={INITIAL_COURSES} />}
          {tab === "dispatch" && <DispatchMap drivers={drivers} reservations={reservations} casts={casts} hotels={hotels} office={office} />}
          {tab === "customer" && <CustomerManagement customers={customers} setCustomers={setCustomers} onQuote={startQuote} />}
          {tab === "media" && <MediaTab casts={casts} setCasts={setCasts} />}
          {tab === "report" && <Report />}
          {tab === "accounting" && <AccountingTab casts={casts} drivers={drivers} />}
          {tab === "payout" && <Payout casts={casts} />}
          {tab === "driverpage" && <DriverPage reservations={reservations} casts={casts} drivers={drivers} />}
          {tab === "mypage" && <CastMyPage casts={casts} reservations={reservations} />}
          {tab === "std" && <StdManagement casts={casts} />}
          {tab === "settings" && <SettingsTab setCasts={setCasts} setDrivers={setDrivers} hotels={hotels} setHotels={setHotels} office={office} setOffice={setOffice} />}
        </div>
      </div>

      {ctiCustomer && <CtiPopup customer={ctiCustomer} onClose={() => setCtiCustomer(null)} onReserve={startQuote} />}
      {quoteCustomer && <NewReservationModal prefillCustomer={quoteCustomer} casts={casts} drivers={drivers} reservations={reservations} courses={INITIAL_COURSES} onClose={() => setQuoteCustomer(null)} onCreate={(r) => { setReservations((prev) => [...prev, r]); setTab("reservation"); }} />}
    </div>
  );
}
