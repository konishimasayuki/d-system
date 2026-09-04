import { useEffect, useState } from "react";

// ============================================================
// デザイントークン
// ============================================================
export const COLORS = {
  bg: "#F5F8FC", panel: "#FFFFFF", border: "#E1E7EF",
  textMain: "#1F2733", textSub: "#7A8798",
  accent: "#2F6DB5", accentDark: "#1F4E88", accentBg: "rgba(47,109,181,0.10)",
  green: "#3E9C74", blue: "#3E7CA6", purple: "#7B77C4", red: "#C0492B",
};

// 所属店舗(受付表のシートと対応)
export const SHOP_OPTIONS = [
  { key: "hitozuma", label: "人妻専科" },
  { key: "hakata", label: "博多ココ" },
];
// キャストのクラス(スタンダードが標準、上位クラスほど格上扱い)
export const CAST_CLASS_OPTIONS = [
  { key: "standard", label: "スタンダード", color: "#7A8798" },
  { key: "diamond", label: "ダイヤモンド", color: "#2F6DB5" },
];
// 旧データ(shopsフィールド未保存)との互換：未設定なら博多ココ扱いにする
export function castShops(c) {
  if (Array.isArray(c.shops) && c.shops.length > 0) return c.shops;
  return ["hakata"];
}
// 旧データ(loginId/password未保存)でも安全に扱えるようフォールバック
export function castLoginId(c) { return c.loginId || ""; }
export function castPassword(c) { return c.password || ""; }
// 旧データ(castClass未保存)との互換：未設定ならスタンダード扱いにする
export function castClass(c) { return c.castClass || "standard"; }
// 店舗別のクラス(2店舗所属の場合、店舗ごとに別クラスを持てる)。未設定ならcastClass(共通)にフォールバック
export function castClassForShop(c, shopKey) {
  if (c.castClassByShop && c.castClassByShop[shopKey]) return c.castClassByShop[shopKey];
  return castClass(c);
}
// キャストが選択済みの対応可能オプションID一覧(未設定なら空)
export function castAllowedOptionIds(c) { return c.allowedOptions || []; }
export function castClassInfo(c) { return CAST_CLASS_OPTIONS.find((o) => o.key === castClass(c)) || CAST_CLASS_OPTIONS[0]; }
// 旧データ(rewardRank未保存)との互換：未設定ならベース扱いにする(博多ココ・スタンダードのキャストのみ意味を持つ)
export function castRewardRank(c) { return c.rewardRank || "base"; }

export const CAST_STATUS = {
  before_shift: { label: "出勤前", color: "#7B77C4", bg: "rgba(123,119,196,0.12)" },
  waiting: { label: "待機中", color: "#3E9C74", bg: "rgba(62,156,116,0.12)" },
  working: { label: "接客中", color: "#2F6DB5", bg: "rgba(47,109,181,0.12)" },
  off: { label: "本日休み", color: "#98A2B0", bg: "rgba(152,162,176,0.12)" },
};

export const DRIVER_STATUS = {
  dispatch: { label: "送迎中", color: "#2F6DB5" },
  arrived: { label: "到着済", color: "#E08A1E" },
  returning: { label: "戻り中", color: "#5C93C4" },
  waiting: { label: "待機中", color: "#3E9C74" },
};

export const CUSTOMER_COLORS = {
  normal: { label: "通常", color: "#7A8798", bg: "transparent" },
  vip: { label: "VIP", color: "#1F4E88", bg: "rgba(47,109,181,0.10)" },
  caution: { label: "要注意", color: "#B58A1F", bg: "rgba(200,160,40,0.12)" },
  ng: { label: "出禁", color: "#C0492B", bg: "rgba(192,73,43,0.12)" },
};

// タブ一覧と、閲覧制限(パスワード解除が必要)の有無
export const TAB_DEFS = [
  { key: "dashboard", label: "ダッシュボード", restricted: true },
  { key: "timetable", label: "タイムテーブル", restricted: true },
  { key: "shift", label: "出勤管理", restricted: true },
  { key: "castlist", label: "キャスト一覧", restricted: false },
  { key: "reservation", label: "予約管理", restricted: true },
  { key: "uketsuke", label: "受付表", restricted: false },
  { key: "dispatch", label: "配車管理", restricted: true },
  { key: "messages", label: "メッセージ", restricted: false },
  { key: "customer", label: "顧客名簿", restricted: true },
  { key: "media", label: "媒体・HP更新", restricted: true },
  { key: "report", label: "集計", restricted: true },
  { key: "accounting", label: "会計", restricted: true },
  { key: "payout", label: "委託費", restricted: true },
  { key: "std", label: "STD検査", restricted: true },
  { key: "driverschedule", label: "スタッフスケジュール", restricted: false },
  { key: "settings", label: "設定", restricted: false },
];
export const RESTRICTED_TAB_PASSWORD = "2911"; // 閲覧制限タブの解除パスワード

// 役割別ビュー(初期値。経営者が設定画面から変更できる／実データはUpstashのviewrolesキーに保存)
export const INITIAL_VIEW_ROLES = {
  owner: { label: "経営者", tabs: ["dashboard", "timetable", "shift", "castlist", "reservation", "uketsuke", "dispatch", "messages", "customer", "media", "report", "accounting", "payout", "std", "driverschedule", "settings"] },
  operator: { label: "オペレーター", tabs: ["dashboard", "timetable", "shift", "castlist", "reservation", "uketsuke", "dispatch", "messages", "customer", "media", "driverschedule"] },
  cast: { label: "キャスト", tabs: ["mypage"] },
  driver: { label: "ドライバー", tabs: ["driverpage"] },
};
// 後方互換用のエイリアス(旧コードがVIEW_ROLESを直接参照している箇所向け)
export const VIEW_ROLES = INITIAL_VIEW_ROLES;
// スタッフ個人の閲覧可能タブを返す(経営者は常に全タブ。オペレーターは個人ごとのallowedTabsが未設定ならinitial operatorにフォールバック)
export function staffAllowedTabs(staffMember) {
  if (!staffMember) return INITIAL_VIEW_ROLES.operator.tabs;
  if (staffMember.viewRole === "owner") return INITIAL_VIEW_ROLES.owner.tabs;
  if (Array.isArray(staffMember.allowedTabs)) return staffMember.allowedTabs;
  return INITIAL_VIEW_ROLES.operator.tabs;
}

// ============================================================
// マスタ・モックデータ
// ============================================================
export const AREAS = ["中央区", "東区", "博多区", "南区"];

// ホテルマスタ(ID=4桁。住所は仮。座標はデモ近似で、住所変更/追加時にGeocodingで更新)
export const INITIAL_HOTELS = [
  { id: "D001", name: "博多グランドホテル", area: "博多区", address: "福岡市博多区博多駅前2-1-1", lat: 33.5900, lng: 130.4200 },
  { id: "D002", name: "博多ステーションイン", area: "博多区", address: "福岡市博多区博多駅東1-2-3", lat: 33.5895, lng: 130.4205 },
  { id: "D003", name: "中洲リバーサイドホテル", area: "博多区", address: "福岡市博多区中洲3-4-5", lat: 33.5930, lng: 130.4060 },
  { id: "D004", name: "天神プラザホテル", area: "中央区", address: "福岡市中央区天神2-1-1", lat: 33.5914, lng: 130.3990 },
  { id: "D005", name: "西鉄シティホテル", area: "中央区", address: "福岡市中央区天神1-5-5", lat: 33.5896, lng: 130.3986 },
  { id: "D006", name: "中央グランドイン", area: "中央区", address: "福岡市中央区大名1-2-3", lat: 33.5850, lng: 130.4017 },
  { id: "D007", name: "薬院ステーションホテル", area: "中央区", address: "福岡市中央区薬院1-1-1", lat: 33.5820, lng: 130.4030 },
  { id: "D008", name: "博多ベイサイドホテル", area: "東区", address: "福岡市東区箱崎1-1-1", lat: 33.6050, lng: 130.4100 },
  { id: "D009", name: "東区パークホテル", area: "東区", address: "福岡市東区香椎2-2-2", lat: 33.6200, lng: 130.4300 },
  { id: "D010", name: "南区シティホテル", area: "南区", address: "福岡市南区大橋1-1-1", lat: 33.5600, lng: 130.4250 },
  { id: "D011", name: "大橋ステーションイン", area: "南区", address: "福岡市南区大橋2-3-4", lat: 33.5620, lng: 130.4260 },
  { id: "D012", name: "ホテル ルミエール中洲", area: "博多区", address: "福岡市博多区中洲5-1-1", lat: 33.5945, lng: 130.4050 },
  { id: "D013", name: "ホテル ノワール天神", area: "中央区", address: "福岡市中央区渡辺通4-1-1", lat: 33.5860, lng: 130.4010 },
  { id: "D014", name: "ホテル ミラージュ博多", area: "博多区", address: "福岡市博多区祇園町3-2-1", lat: 33.5920, lng: 130.4130 },
  { id: "D015", name: "ホテル アヴァンティ南", area: "南区", address: "福岡市南区高宮1-2-3", lat: 33.5680, lng: 130.4180 },
];

// 営業所(出発・戻りポイント)デフォルト
export const DEFAULT_OFFICE = { address: "福岡市博多区美野島2-18-10", lat: 33.5805, lng: 130.4225 };

// 予約フォーム等の選択肢用(初期マスタから導出)
export const HOTELS_BY_AREA = INITIAL_HOTELS.reduce((acc, h) => { (acc[h.area] = acc[h.area] || []).push(h.name); return acc; }, {});
export const ALL_HOTELS = INITIAL_HOTELS.map((h) => h.name);

// コース料金表: { id, shop("hitozuma"/"hakata"), castClass("standard"/"diamond"), code(コース記号), label(表示名), price(落とし=お客様料金), joshi(女子給・通常) }
//  ※博多ココ・スタンダードのみ joshi の代わりに joshiByRank(報酬ランク別の女子給)を持つ
// コース記号のルール: 通常コースは分数のみ(60,90...)／インバウンドは"I"+分数(I50,I60...)／ダイヤモンドクラスは"D"+分数(D60,D90...)
function makeCourseRows(shop, castClass, prefix, entries) {
  return entries.map(([mins, price, joshi], i) => {
    const code = `${prefix}${mins}`;
    return { id: `co_${shop}_${castClass}_${code}`, shop, castClass, code, label: `${mins}分`, price, joshi };
  });
}
// 博多ココ・スタンダードの報酬ランク(女子給がランクごとに変わる。落としの金額は共通)
export const REWARD_RANK_OPTIONS = [
  { key: "base", label: "ベース" },
  { key: "c", label: "C" },
  { key: "b", label: "B" },
  { key: "a", label: "A" },
  { key: "s", label: "S" },
];
// 博多ココ・スタンダードのコース生成：落としは共通、女子給は5ランク分(初期値は全ランク同額)
function makeHakataStandardRows(entries) {
  return entries.map(([mins, price, joshi]) => {
    const code = `${mins}`;
    const joshiByRank = Object.fromEntries(REWARD_RANK_OPTIONS.map((r) => [r.key, joshi]));
    return { id: `co_hakata_standard_${code}`, shop: "hakata", castClass: "standard", code, label: `${mins}分`, price, joshiByRank };
  });
}
export const INITIAL_COURSES = [
  // 人妻専科・スタンダード(通常コース)
  ...makeCourseRows("hitozuma", "standard", "", [
    [60, 11000, 6000], [90, 16500, 9000], [120, 20900, 12000], [150, 26400, 15000],
    [180, 30800, 18000], [210, 36300, 21000], [240, 40700, 24000], [270, 46200, 27000],
    [300, 50600, 30000], [330, 56100, 33000],
  ]),
  // 人妻専科・スタンダード(インバウンド料金・"I"始まり)
  ...makeCourseRows("hitozuma", "standard", "I", [
    [50, 23000, 14000], [60, 27000, 16000], [75, 33000, 20000], [90, 40000, 24000], [120, 54000, 32000],
  ]),
  // 人妻専科・ダイヤモンド("D"始まり)
  ...makeCourseRows("hitozuma", "diamond", "D", [
    [60, 15400, 9000], [90, 23100, 13500], [120, 29700, 18000], [150, 36300, 22500],
    [180, 44000, 27000], [210, 50600, 31500], [240, 58300, 36000], [270, 64900, 40500],
    [300, 72600, 45000], [330, 79200, 49500],
  ]),
  // 博多ココ・スタンダード(仮の料金。設定タブから変更してください。女子給は報酬ランク別に設定可能)
  ...makeHakataStandardRows([
    [60, 18000, 10000], [90, 25000, 14000], [120, 32000, 18000], [150, 39000, 22000], [180, 46000, 26000],
  ]),
  // 博多ココ・ダイヤモンド(仮の料金。設定タブから変更してください)
  ...makeCourseRows("hakata", "diamond", "D", [
    [60, 24000, 14000], [90, 33000, 19000], [120, 42000, 24000], [150, 51000, 29000], [180, 60000, 34000],
  ]),
];
// 指名料(写真指名・本指名とも共通1,100円。受付表の「F」欄で選ぶ)
export const INITIAL_OPTIONS = [
  { id: "shimei", name: "写指(写真指名)", price: 1100 },
  { id: "honshimei", name: "本指(本指名)", price: 1100 },
];

// 交通費マスタ(福岡市内、区・地名別。出典: 交通費.xlsxより。ホテル名も含む。yomiは元データに読みが無い場合は空欄)
// 交通費マスタ(福岡市内、区・地名別。出典: 交通費.xlsxより。ホテル名も含む。readingは判明分のみ)
export const INITIAL_TRANSPORT_FEES = [
  { id: "tf1", area: "博多区", name: "相生町", reading: "", price: 2000 },
  { id: "tf2", area: "博多区", name: "青木", reading: "", price: 2000 },
  { id: "tf3", area: "博多区", name: "井相田", reading: "", price: 2000 },
  { id: "tf4", area: "博多区", name: "板付", reading: "", price: 2000 },
  { id: "tf5", area: "博多区", name: "浦田", reading: "", price: 3000 },
  { id: "tf6", area: "博多区", name: "榎田", reading: "", price: 1000 },
  { id: "tf7", area: "博多区", name: "大井", reading: "", price: 2000 },
  { id: "tf8", area: "博多区", name: "沖浜町", reading: "", price: 0 },
  { id: "tf9", area: "博多区", name: "堅粕", reading: "", price: 1000 },
  { id: "tf10", area: "博多区", name: "金の隈", reading: "", price: 2000 },
  { id: "tf11", area: "博多区", name: "上臼井", reading: "", price: 1000 },
  { id: "tf12", area: "博多区", name: "上川端", reading: "", price: 0 },
  { id: "tf13", area: "博多区", name: "上呉服町", reading: "", price: 0 },
  { id: "tf14", area: "博多区", name: "上月隈", reading: "", price: 2000 },
  { id: "tf15", area: "博多区", name: "上牟田", reading: "", price: 1000 },
  { id: "tf16", area: "博多区", name: "神屋町", reading: "", price: 0 },
  { id: "tf17", area: "博多区", name: "祇園町", reading: "", price: 0 },
  { id: "tf18", area: "博多区", name: "銀天町", reading: "", price: 2000 },
  { id: "tf19", area: "博多区", name: "空港前", reading: "", price: 2000 },
  { id: "tf20", area: "博多区", name: "御供所町", reading: "", price: 0 },
  { id: "tf21", area: "博多区", name: "寿町", reading: "", price: 2000 },
  { id: "tf22", area: "博多区", name: "古門戸町", reading: "", price: 0 },
  { id: "tf23", area: "博多区", name: "雀居", reading: "", price: 0 },
  { id: "tf24", area: "博多区", name: "三筑", reading: "", price: 2000 },
  { id: "tf25", area: "博多区", name: "山王", reading: "", price: 0 },
  { id: "tf26", area: "博多区", name: "東雲町", reading: "", price: 2000 },
  { id: "tf27", area: "博多区", name: "下臼井", reading: "", price: 1000 },
  { id: "tf28", area: "博多区", name: "下川端町", reading: "", price: 0 },
  { id: "tf29", area: "博多区", name: "下呉服町", reading: "", price: 0 },
  { id: "tf30", area: "博多区", name: "下月隈", reading: "", price: 2000 },
  { id: "tf31", area: "博多区", name: "昭南町", reading: "", price: 2000 },
  { id: "tf32", area: "博多区", name: "新和町", reading: "", price: 2000 },
  { id: "tf33", area: "博多区", name: "須崎町", reading: "", price: 0 },
  { id: "tf34", area: "博多区", name: "住吉", reading: "", price: 0 },
  { id: "tf35", area: "博多区", name: "石城町", reading: "", price: 0 },
  { id: "tf36", area: "博多区", name: "大博町", reading: "", price: 0 },
  { id: "tf37", area: "博多区", name: "竹丘町", reading: "", price: 2000 },
  { id: "tf38", area: "博多区", name: "竹下", reading: "", price: 0 },
  { id: "tf39", area: "博多区", name: "築港本町", reading: "", price: 0 },
  { id: "tf40", area: "博多区", name: "千代町", reading: "", price: 0 },
  { id: "tf41", area: "博多区", name: "月隈", reading: "", price: 2000 },
  { id: "tf42", area: "博多区", name: "綱場町", reading: "", price: 1000 },
  { id: "tf43", area: "博多区", name: "対馬小路", reading: "", price: 0 },
  { id: "tf44", area: "博多区", name: "店屋町", reading: "", price: 0 },
  { id: "tf45", area: "博多区", name: "東光", reading: "", price: 0 },
  { id: "tf46", area: "博多区", name: "東光寺町", reading: "", price: 0 },
  { id: "tf47", area: "博多区", name: "那珂", reading: "", price: 0 },
  { id: "tf48", area: "博多区", name: "中呉服町", reading: "", price: 0 },
  { id: "tf49", area: "博多区", name: "中洲", reading: "", price: 0 },
  { id: "tf50", area: "博多区", name: "中洲中島町", reading: "", price: 0 },
  { id: "tf51", area: "博多区", name: "奈良屋町", reading: "", price: 0 },
  { id: "tf52", area: "博多区", name: "西月隈", reading: "", price: 1000 },
  { id: "tf53", area: "博多区", name: "西春町", reading: "", price: 2000 },
  { id: "tf54", area: "博多区", name: "博多駅中央街", reading: "", price: 0 },
  { id: "tf55", area: "博多区", name: "博多駅東", reading: "", price: 0 },
  { id: "tf56", area: "博多区", name: "博多駅前", reading: "", price: 0 },
  { id: "tf57", area: "博多区", name: "博多駅南", reading: "", price: 0 },
  { id: "tf58", area: "博多区", name: "春町", reading: "", price: 2000 },
  { id: "tf59", area: "博多区", name: "半道橋", reading: "", price: 1000 },
  { id: "tf60", area: "博多区", name: "比恵町", reading: "", price: 0 },
  { id: "tf61", area: "博多区", name: "東公園", reading: "", price: 2000 },
  { id: "tf62", area: "博多区", name: "東月隈", reading: "", price: 2000 },
  { id: "tf63", area: "博多区", name: "東那珂", reading: "", price: 0 },
  { id: "tf64", area: "博多区", name: "東比恵", reading: "", price: 0 },
  { id: "tf65", area: "博多区", name: "東平尾", reading: "", price: 2000 },
  { id: "tf66", area: "博多区", name: "東平尾公園", reading: "", price: 2000 },
  { id: "tf67", area: "博多区", name: "光丘町", reading: "", price: 2000 },
  { id: "tf68", area: "博多区", name: "南八幡町", reading: "", price: 2000 },
  { id: "tf69", area: "博多区", name: "南本町", reading: "", price: 2000 },
  { id: "tf70", area: "博多区", name: "美野島", reading: "", price: 0 },
  { id: "tf71", area: "博多区", name: "麦野", reading: "", price: 1000 },
  { id: "tf72", area: "博多区", name: "元町", reading: "", price: 2000 },
  { id: "tf73", area: "博多区", name: "諸岡", reading: "", price: 1000 },
  { id: "tf74", area: "博多区", name: "豊", reading: "", price: 1000 },
  { id: "tf75", area: "博多区", name: "吉塚", reading: "", price: 0 },
  { id: "tf76", area: "博多区", name: "吉塚本町", reading: "", price: 0 },
  { id: "tf77", area: "博多区", name: "立花寺", reading: "", price: 2000 },
  { id: "tf78", area: "博多区", name: "冷泉町", reading: "", price: 0 },
  { id: "tf79", area: "博多区", name: "ララ司", reading: "", price: 2000 },
  { id: "tf80", area: "博多区", name: "ドルチェ", reading: "", price: 2000 },
  { id: "tf81", area: "博多区", name: "AZ金の隈", reading: "", price: 2000 },
  { id: "tf82", area: "中央区", name: "赤坂", reading: "あかさか", price: 0 },
  { id: "tf83", area: "中央区", name: "荒津", reading: "あらつ", price: 1000 },
  { id: "tf84", area: "中央区", name: "荒戸", reading: "あらと", price: 1000 },
  { id: "tf85", area: "中央区", name: "伊崎", reading: "いさき", price: 1000 },
  { id: "tf86", area: "中央区", name: "今泉", reading: "いまいずみ", price: 0 },
  { id: "tf87", area: "中央区", name: "今川", reading: "いまがわ", price: 2000 },
  { id: "tf88", area: "中央区", name: "大手門", reading: "おおてもん", price: 1000 },
  { id: "tf89", area: "中央区", name: "大濠", reading: "おおほり", price: 1000 },
  { id: "tf90", area: "中央区", name: "大濠公園", reading: "おおほりこうえん", price: 1000 },
  { id: "tf91", area: "中央区", name: "大宮", reading: "おおみや", price: 0 },
  { id: "tf92", area: "中央区", name: "小笹", reading: "おざさ", price: 1000 },
  { id: "tf93", area: "中央区", name: "清川", reading: "きよかわ", price: 0 },
  { id: "tf94", area: "中央区", name: "草香江", reading: "くさかえ", price: 1000 },
  { id: "tf95", area: "中央区", name: "黒門", reading: "くろもん", price: 1000 },
  { id: "tf96", area: "中央区", name: "警固", reading: "けご", price: 0 },
  { id: "tf97", area: "中央区", name: "御供ヶ谷", reading: "ごしょがだに", price: 1000 },
  { id: "tf98", area: "中央区", name: "桜坂", reading: "さくらざか", price: 1000 },
  { id: "tf99", area: "中央区", name: "笹丘", reading: "ささおか", price: 1000 },
  { id: "tf100", area: "中央区", name: "山荘通", reading: "さんそうどおり", price: 0 },
  { id: "tf101", area: "中央区", name: "地行", reading: "じぎょう", price: 2000 },
  { id: "tf102", area: "中央区", name: "地行浜", reading: "じぎょうはま", price: 2000 },
  { id: "tf103", area: "中央区", name: "浄水通", reading: "じょうすいどおり", price: 0 },
  { id: "tf104", area: "中央区", name: "城内", reading: "じょうない", price: 0 },
  { id: "tf105", area: "中央区", name: "白金", reading: "しろがね", price: 0 },
  { id: "tf106", area: "中央区", name: "大名", reading: "だいみょう", price: 0 },
  { id: "tf107", area: "中央区", name: "高砂", reading: "たかさご", price: 0 },
  { id: "tf108", area: "中央区", name: "谷", reading: "たに", price: 0 },
  { id: "tf109", area: "中央区", name: "輝国", reading: "てるくに", price: 1000 },
  { id: "tf110", area: "中央区", name: "天神", reading: "てんじん", price: 0 },
  { id: "tf111", area: "中央区", name: "唐人町", reading: "とうじんまち", price: 2000 },
  { id: "tf112", area: "中央区", name: "鳥飼", reading: "とりかえ", price: 2000 },
  { id: "tf113", area: "中央区", name: "長浜", reading: "ながはま", price: 1000 },
  { id: "tf114", area: "中央区", name: "那の川", reading: "", price: 0 },
  { id: "tf115", area: "中央区", name: "那の津", reading: "なのつ", price: 0 },
  { id: "tf116", area: "中央区", name: "西公園", reading: "にしこうえん", price: 1000 },
  { id: "tf117", area: "中央区", name: "西中洲", reading: "にしなかす", price: 0 },
  { id: "tf118", area: "中央区", name: "梅光園", reading: "ばいこうえん", price: 2000 },
  { id: "tf119", area: "中央区", name: "梅光園団地", reading: "ばいこうえんだんち", price: 2000 },
  { id: "tf120", area: "中央区", name: "春吉", reading: "はるよし", price: 0 },
  { id: "tf121", area: "中央区", name: "平尾", reading: "ひらお", price: 0 },
  { id: "tf122", area: "中央区", name: "平丘町", reading: "ひらおか", price: 0 },
  { id: "tf123", area: "中央区", name: "浄水町", reading: "じょうすいどおり", price: 1000 },
  { id: "tf124", area: "中央区", name: "福浜", reading: "ふくはま", price: 2000 },
  { id: "tf125", area: "中央区", name: "古門戸町", reading: "こもんど", price: 0 },
  { id: "tf126", area: "中央区", name: "平和", reading: "へいわ", price: 1000 },
  { id: "tf127", area: "中央区", name: "舞鶴", reading: "まいづる", price: 0 },
  { id: "tf128", area: "中央区", name: "港", reading: "みなと", price: 1000 },
  { id: "tf129", area: "中央区", name: "南公園", reading: "みなみこうえん", price: 1000 },
  { id: "tf130", area: "中央区", name: "薬院", reading: "やくいん", price: 0 },
  { id: "tf131", area: "中央区", name: "薬院伊福町", reading: "やくいんいが", price: 0 },
  { id: "tf132", area: "中央区", name: "六本松", reading: "ろっぽんまつ", price: 1000 },
  { id: "tf133", area: "中央区", name: "渡辺通", reading: "わたなべどおり", price: 0 },
  { id: "tf134", area: "南区", name: "井尻", reading: "いじり", price: 2000 },
  { id: "tf135", area: "南区", name: "市崎", reading: "いちさき", price: 1000 },
  { id: "tf136", area: "南区", name: "大池", reading: "おおいけ", price: 2000 },
  { id: "tf137", area: "南区", name: "大楠", reading: "おおぐす", price: 1000 },
  { id: "tf138", area: "南区", name: "大橋", reading: "おおはし", price: 2000 },
  { id: "tf139", area: "南区", name: "大橋団地", reading: "おおはしだんち", price: 2000 },
  { id: "tf140", area: "南区", name: "曰佐", reading: "おさ", price: 3000 },
  { id: "tf141", area: "南区", name: "折立", reading: "おりたて", price: 2000 },
  { id: "tf142", area: "南区", name: "柏原", reading: "かしはら", price: 3000 },
  { id: "tf143", area: "南区", name: "警弥郷", reading: "けやごう", price: 3000 },
  { id: "tf144", area: "南区", name: "五十川", reading: "ごじっかわ", price: 1000 },
  { id: "tf145", area: "南区", name: "皿山", reading: "さらやま", price: 1000 },
  { id: "tf146", area: "南区", name: "塩原", reading: "しおばる", price: 1000 },
  { id: "tf147", area: "南区", name: "清水", reading: "しみず", price: 1000 },
  { id: "tf148", area: "南区", name: "太平寺", reading: "たいへいじ", price: 3000 },
  { id: "tf149", area: "南区", name: "多賀", reading: "たが", price: 2000 },
  { id: "tf150", area: "南区", name: "高木", reading: "たかぎ", price: 2000 },
  { id: "tf151", area: "南区", name: "髙宮", reading: "たかみや", price: 1000 },
  { id: "tf152", area: "南区", name: "玉川町", reading: "たまがわ", price: 1000 },
  { id: "tf153", area: "南区", name: "筑紫丘", reading: "ちくしがおか", price: 1000 },
  { id: "tf154", area: "南区", name: "鶴田", reading: "つるた", price: 3000 },
  { id: "tf155", area: "南区", name: "寺塚", reading: "てらつか", price: 2000 },
  { id: "tf156", area: "南区", name: "中尾", reading: "なかお", price: 2000 },
  { id: "tf157", area: "南区", name: "長丘", reading: "ながおか", price: 2000 },
  { id: "tf158", area: "南区", name: "長住", reading: "ながずみ", price: 2000 },
  { id: "tf159", area: "南区", name: "那の川", reading: "なのかわ", price: 1000 },
  { id: "tf160", area: "南区", name: "西長住", reading: "にしながずみ", price: 2000 },
  { id: "tf161", area: "南区", name: "野多目", reading: "のため", price: 2000 },
  { id: "tf162", area: "南区", name: "野間", reading: "のま", price: 2000 },
  { id: "tf163", area: "南区", name: "花畑", reading: "はなはた", price: 2000 },
  { id: "tf164", area: "南区", name: "桧原", reading: "ひばる", price: 3000 },
  { id: "tf165", area: "南区", name: "平和", reading: "へいわ", price: 2000 },
  { id: "tf166", area: "南区", name: "的場", reading: "まとば", price: 2000 },
  { id: "tf167", area: "南区", name: "南大橋", reading: "みなみおおはし", price: 2000 },
  { id: "tf168", area: "南区", name: "三宅", reading: "みやけ", price: 2000 },
  { id: "tf169", area: "南区", name: "向新町", reading: "むかいしん", price: 2000 },
  { id: "tf170", area: "南区", name: "向野", reading: "むかいの", price: 2000 },
  { id: "tf171", area: "南区", name: "屋形原", reading: "やかたばる", price: 3000 },
  { id: "tf172", area: "南区", name: "弥永", reading: "やなが", price: 3000 },
  { id: "tf173", area: "南区", name: "弥永団地", reading: "やながだんち", price: 3000 },
  { id: "tf174", area: "南区", name: "柳河内", reading: "やなごうち", price: 2000 },
  { id: "tf175", area: "南区", name: "柳瀬", reading: "やなせ", price: 3000 },
  { id: "tf176", area: "南区", name: "横手", reading: "よこて", price: 2000 },
  { id: "tf177", area: "南区", name: "横手南町", reading: "よこてみなみ", price: 2000 },
  { id: "tf178", area: "南区", name: "老司", reading: "ろうじ", price: 3000 },
  { id: "tf179", area: "南区", name: "若久", reading: "わかひさ", price: 2000 },
  { id: "tf180", area: "南区", name: "若久団地", reading: "わかひさだんち", price: 2000 },
  { id: "tf181", area: "南区", name: "和田", reading: "わだ", price: 2000 },
  { id: "tf182", area: "城南区", name: "荒江", reading: "あらえ", price: 3000 },
  { id: "tf183", area: "城南区", name: "荒江団地", reading: "あらえだんち", price: 3000 },
  { id: "tf184", area: "城南区", name: "飯倉", reading: "いいくら", price: 3000 },
  { id: "tf185", area: "城南区", name: "梅林", reading: "うめばやし", price: 3000 },
  { id: "tf186", area: "城南区", name: "片江", reading: "かたえ", price: 3000 },
  { id: "tf187", area: "城南区", name: "金山団地", reading: "かなやまだんち", price: 3000 },
  { id: "tf188", area: "城南区", name: "城西団地", reading: "じょうせいだんち", price: 2000 },
  { id: "tf189", area: "城南区", name: "神松寺", reading: "しんしょうじ", price: 2000 },
  { id: "tf190", area: "城南区", name: "宝台団地", reading: "たからだいだんち", price: 3000 },
  { id: "tf191", area: "城南区", name: "田島", reading: "たじま", price: 3000 },
  { id: "tf192", area: "城南区", name: "茶山", reading: "ちゃやま", price: 3000 },
  { id: "tf193", area: "城南区", name: "堤", reading: "つつみ", price: 3000 },
  { id: "tf194", area: "城南区", name: "堤団地", reading: "つつみだんち", price: 3000 },
  { id: "tf195", area: "城南区", name: "友丘", reading: "ともおか", price: 2000 },
  { id: "tf196", area: "城南区", name: "鳥飼", reading: "とりかい", price: 2000 },
  { id: "tf197", area: "城南区", name: "長尾", reading: "ながおか", price: 2000 },
  { id: "tf198", area: "城南区", name: "七隈", reading: "ななくま", price: 3000 },
  { id: "tf199", area: "城南区", name: "西片江", reading: "にしかたえ", price: 3000 },
  { id: "tf200", area: "城南区", name: "野芥", reading: "のけ", price: 3000 },
  { id: "tf201", area: "城南区", name: "樋井川", reading: "ひいがわ", price: 3000 },
  { id: "tf202", area: "城南区", name: "東油山", reading: "ひがしひらお", price: 4000 },
  { id: "tf203", area: "城南区", name: "別府", reading: "べふ", price: 2000 },
  { id: "tf204", area: "城南区", name: "別府団地", reading: "べふだんち", price: 2000 },
  { id: "tf205", area: "城南区", name: "干隈", reading: "ひぐま", price: 3000 },
  { id: "tf206", area: "城南区", name: "松山", reading: "まつやま", price: 3000 },
  { id: "tf207", area: "城南区", name: "南片江", reading: "みなみかたえ", price: 3000 },
  { id: "tf208", area: "城南区", name: "友泉亭", reading: "ゆうせんてい", price: 2000 },
  { id: "tf209", area: "早良区", name: "曙", reading: "あけぼの", price: 3000 },
  { id: "tf210", area: "早良区", name: "荒江", reading: "あらえ", price: 3000 },
  { id: "tf211", area: "早良区", name: "有田", reading: "ありた", price: 3000 },
  { id: "tf212", area: "早良区", name: "有田団地", reading: "ありただんち", price: 3000 },
  { id: "tf213", area: "早良区", name: "飯倉", reading: "いいくら", price: 2000 },
  { id: "tf214", area: "早良区", name: "内野", reading: "うちの", price: 3000 },
  { id: "tf215", area: "早良区", name: "梅林", reading: "うめばやし", price: 3000 },
  { id: "tf216", area: "早良区", name: "小笠木", reading: "おかさぎ", price: 3000 },
  { id: "tf217", area: "早良区", name: "金城", reading: "かねしろ", price: 3000 },
  { id: "tf218", area: "早良区", name: "賀茂", reading: "かも", price: 3000 },
  { id: "tf219", area: "早良区", name: "小田部", reading: "こたべ", price: 3000 },
  { id: "tf220", area: "早良区", name: "早良", reading: "さわら", price: 4000 },
  { id: "tf221", area: "早良区", name: "四箇", reading: "しか", price: 3000 },
  { id: "tf222", area: "早良区", name: "四箇田団地", reading: "しかただんち", price: 3000 },
  { id: "tf223", area: "早良区", name: "重留", reading: "しげどめ", price: 3000 },
  { id: "tf224", area: "早良区", name: "城西", reading: "じょうせい", price: 2000 },
  { id: "tf225", area: "早良区", name: "昭代", reading: "しょうだい", price: 2000 },
  { id: "tf226", area: "早良区", name: "次郎丸", reading: "じろうまる", price: 3000 },
  { id: "tf227", area: "早良区", name: "祖原", reading: "そばら", price: 3000 },
  { id: "tf228", area: "早良区", name: "高取", reading: "たかとり", price: 3000 },
  { id: "tf229", area: "早良区", name: "田隈", reading: "たぐま", price: 3000 },
  { id: "tf230", area: "早良区", name: "田村", reading: "たむら", price: 3000 },
  { id: "tf231", area: "早良区", name: "西油山", reading: "にしあぶらやま", price: 3000 },
  { id: "tf232", area: "早良区", name: "西入部", reading: "にしいるべ", price: 4000 },
  { id: "tf233", area: "早良区", name: "西新", reading: "にしじん", price: 3000 },
  { id: "tf234", area: "早良区", name: "西", reading: "にし", price: 4000 },
  { id: "tf235", area: "早良区", name: "野芥", reading: "のけ", price: 3000 },
  { id: "tf236", area: "早良区", name: "原", reading: "はら", price: 3000 },
  { id: "tf237", area: "早良区", name: "原団地", reading: "はらだんち", price: 3000 },
  { id: "tf238", area: "早良区", name: "東入部", reading: "ひがしいるべ", price: 4000 },
  { id: "tf239", area: "早良区", name: "藤崎", reading: "ふじさき", price: 3000 },
  { id: "tf240", area: "早良区", name: "干隈", reading: "ひぐま", price: 3000 },
  { id: "tf241", area: "早良区", name: "星の原団地", reading: "星の原団地", price: 3000 },
  { id: "tf242", area: "早良区", name: "南庄", reading: "みなみしょう", price: 3000 },
  { id: "tf243", area: "早良区", name: "室住団地", reading: "むろずみだんち", price: 3000 },
  { id: "tf244", area: "早良区", name: "室見", reading: "むろみ", price: 3000 },
  { id: "tf245", area: "早良区", name: "百道", reading: "ももち", price: 3000 },
  { id: "tf246", area: "早良区", name: "百道浜", reading: "ももちはま", price: 3000 },
  { id: "tf247", area: "早良区", name: "弥生", reading: "やよい", price: 3000 },
  { id: "tf248", area: "早良区", name: "脇山", reading: "わきやま", price: 4000 },
  { id: "tf249", area: "早良区", name: "ヒルトンシーホーク", reading: "ヒルトン シーホーク", price: 3000 },
  { id: "tf250", area: "早良区", name: "ハイアットRスイート", reading: "ハイアットR スイート", price: 3000 },
  { id: "tf251", area: "早良区", name: "ツインズ百道", reading: "ツインズ百道", price: 3000 },
  { id: "tf252", area: "西区", name: "愛宕", reading: "あたご", price: 3000 },
  { id: "tf253", area: "西区", name: "愛宕浜", reading: "あたごはま", price: 3000 },
  { id: "tf254", area: "西区", name: "愛宕南", reading: "あたごみなみ", price: 3000 },
  { id: "tf255", area: "西区", name: "飯氏", reading: "いいじ", price: 3000 },
  { id: "tf256", area: "西区", name: "飯盛", reading: "いいもり", price: 4000 },
  { id: "tf257", area: "西区", name: "壱岐団地", reading: "いきだんち", price: 4000 },
  { id: "tf258", area: "西区", name: "生の松原", reading: "いきのまつばら", price: 4000 },
  { id: "tf259", area: "西区", name: "生松台", reading: "いきまつだい", price: 4000 },
  { id: "tf260", area: "西区", name: "石丸", reading: "いしまる", price: 3000 },
  { id: "tf261", area: "西区", name: "泉", reading: "いずみ", price: 4000 },
  { id: "tf262", area: "西区", name: "今宿", reading: "いまじゅく", price: 4000 },
  { id: "tf263", area: "西区", name: "今宿青木", reading: "いまじゅくあおき", price: 4000 },
  { id: "tf264", area: "西区", name: "今宿駅前", reading: "いまじゅくえきまえ", price: 4000 },
  { id: "tf265", area: "西区", name: "今宿上の原", reading: "いまじゅくかみのはる", price: 4000 },
  { id: "tf266", area: "西区", name: "今宿東", reading: "いまじゅくひがし", price: 4000 },
  { id: "tf267", area: "西区", name: "今宿町", reading: "いまじゅくまち", price: 4000 },
  { id: "tf268", area: "西区", name: "今津", reading: "いまづ", price: 4000 },
  { id: "tf269", area: "西区", name: "宇田川原", reading: "うだがわら", price: 4000 },
  { id: "tf270", area: "西区", name: "内浜", reading: "うちはま", price: 3000 },
  { id: "tf271", area: "西区", name: "小戸", reading: "おど", price: 3000 },
  { id: "tf272", area: "西区", name: "大町団地", reading: "おおまちだんち", price: 3000 },
  { id: "tf273", area: "西区", name: "金武", reading: "かなたけ", price: 3000 },
  { id: "tf274", area: "西区", name: "上山門", reading: "かみやまと", price: 3000 },
  { id: "tf275", area: "西区", name: "草場", reading: "くさば", price: 4000 },
  { id: "tf276", area: "西区", name: "桑原", reading: "くわはら", price: 4000 },
  { id: "tf277", area: "西区", name: "小田", reading: "こた", price: 4000 },
  { id: "tf278", area: "西区", name: "下山門", reading: "しもやまと", price: 3000 },
  { id: "tf279", area: "西区", name: "下山門団地", reading: "しもやまとだんち", price: 3000 },
  { id: "tf280", area: "西区", name: "十郎川団地", reading: "じゅうろうがわだんち", price: 3000 },
  { id: "tf281", area: "西区", name: "拾六町", reading: "じゅうろく", price: 4000 },
  { id: "tf282", area: "西区", name: "城の原団地", reading: "じょうのはる", price: 4000 },
  { id: "tf283", area: "西区", name: "周船寺", reading: "すせんじ", price: 4000 },
  { id: "tf284", area: "西区", name: "千里", reading: "せんり", price: 4000 },
  { id: "tf285", area: "西区", name: "田尻", reading: "たじり", price: 4000 },
  { id: "tf286", area: "西区", name: "太郎丸", reading: "たろうまる", price: 4000 },
  { id: "tf287", area: "西区", name: "田", reading: "た", price: 4000 },
  { id: "tf288", area: "西区", name: "戸切", reading: "とぎれ", price: 4000 },
  { id: "tf289", area: "西区", name: "徳永", reading: "とくなが", price: 4000 },
  { id: "tf290", area: "西区", name: "豊浜", reading: "とよはま", price: 3000 },
  { id: "tf291", area: "西区", name: "西入部", reading: "にしいるべ", price: 4000 },
  { id: "tf292", area: "西区", name: "西浦", reading: "にしうら", price: 4000 },
  { id: "tf293", area: "西区", name: "西の丘", reading: "にしのおか", price: 4000 },
  { id: "tf294", area: "西区", name: "野方", reading: "のかた", price: 4000 },
  { id: "tf295", area: "西区", name: "橋本", reading: "はしもと", price: 4000 },
  { id: "tf296", area: "西区", name: "羽根戸", reading: "はねど", price: 3000 },
  { id: "tf297", area: "西区", name: "福重", reading: "ふくしげ", price: 3000 },
  { id: "tf298", area: "西区", name: "福重団地", reading: "ふくしげだんち", price: 3000 },
  { id: "tf299", area: "西区", name: "富士見", reading: "ふじみ", price: 4000 },
  { id: "tf300", area: "西区", name: "宮浦", reading: "みやのうら", price: 4000 },
  { id: "tf301", area: "西区", name: "女原", reading: "みょうばる", price: 4000 },
  { id: "tf302", area: "西区", name: "室見が丘", reading: "むろみがおか", price: 4000 },
  { id: "tf303", area: "西区", name: "姪浜", reading: "めいのはま", price: 3000 },
  { id: "tf304", area: "西区", name: "姪の浜", reading: "めいのはまえきみなみ", price: 3000 },
  { id: "tf305", area: "西区", name: "姪浜駅南", reading: "", price: 3000 },
  { id: "tf306", area: "西区", name: "元岡", reading: "もとはま", price: 4000 },
  { id: "tf307", area: "西区", name: "元浜", reading: "よこはま", price: 4000 },
  { id: "tf308", area: "西区", name: "横浜", reading: "よしたけ", price: 4000 },
  { id: "tf309", area: "西区", name: "吉武", reading: "", price: 4000 },
  { id: "tf310", area: "西区", name: "ITO", reading: "ブルーミングディ", price: 5000 },
  { id: "tf311", area: "西区", name: "ブルーミングディ", reading: "", price: 5000 },
  { id: "tf312", area: "西区", name: "小戸ラブホ", reading: "", price: 3000 },
  { id: "tf313", area: "東区", name: "青葉", reading: "あおば", price: 3000 },
  { id: "tf314", area: "東区", name: "大岳", reading: "おおたけ", price: 5000 },
  { id: "tf315", area: "東区", name: "貝塚団地", reading: "かいづかだんち", price: 2000 },
  { id: "tf316", area: "東区", name: "香椎", reading: "かしい", price: 3000 },
  { id: "tf317", area: "東区", name: "香椎駅東", reading: "かしいえきひがし", price: 3000 },
  { id: "tf318", area: "東区", name: "香椎駅前", reading: "かしいえきまえ", price: 3000 },
  { id: "tf319", area: "東区", name: "香椎台", reading: "かしいだい", price: 3000 },
  { id: "tf320", area: "東区", name: "香椎団地", reading: "かしいだんち", price: 3000 },
  { id: "tf321", area: "東区", name: "香椎照葉", reading: "かしいてるは", price: 3000 },
  { id: "tf322", area: "東区", name: "香椎浜", reading: "かしいはま", price: 3000 },
  { id: "tf323", area: "東区", name: "香椎浜ふ頭", reading: "かしいはまふとう", price: 3000 },
  { id: "tf324", area: "東区", name: "香住ケ丘", reading: "かすみがおか", price: 3000 },
  { id: "tf325", area: "東区", name: "勝馬", reading: "かつま", price: 5000 },
  { id: "tf326", area: "東区", name: "蒲田", reading: "かまた", price: 3000 },
  { id: "tf327", area: "東区", name: "上和白", reading: "かみわじろ", price: 3000 },
  { id: "tf328", area: "東区", name: "雁の巣", reading: "がんのす", price: 4000 },
  { id: "tf329", area: "東区", name: "郷口町", reading: "ごうぐち", price: 2000 },
  { id: "tf330", area: "東区", name: "西戸崎", reading: "さいとさき", price: 5000 },
  { id: "tf331", area: "東区", name: "塩浜", reading: "しおはま", price: 3000 },
  { id: "tf332", area: "東区", name: "志賀島", reading: "しかのしま", price: 5000 },
  { id: "tf333", area: "東区", name: "下原", reading: "しもばる", price: 3000 },
  { id: "tf334", area: "東区", name: "社領", reading: "しゃりょう", price: 2000 },
  { id: "tf335", area: "東区", name: "城浜団地", reading: "しろはまだんち", price: 2000 },
  { id: "tf336", area: "東区", name: "高美台", reading: "たかみだい", price: 3000 },
  { id: "tf337", area: "東区", name: "多々良", reading: "たたら", price: 2000 },
  { id: "tf338", area: "東区", name: "多の津", reading: "たのつ", price: 2000 },
  { id: "tf339", area: "東区", name: "千早", reading: "ちはや", price: 2000 },
  { id: "tf340", area: "東区", name: "土井", reading: "どい", price: 3000 },
  { id: "tf341", area: "東区", name: "唐原", reading: "とうのはる", price: 3000 },
  { id: "tf342", area: "東区", name: "名子", reading: "なご", price: 4000 },
  { id: "tf343", area: "東区", name: "名島", reading: "なじま", price: 2000 },
  { id: "tf344", area: "東区", name: "奈多", reading: "なた", price: 4000 },
  { id: "tf345", area: "東区", name: "奈多団地", reading: "なただんち", price: 4000 },
  { id: "tf346", area: "東区", name: "箱崎", reading: "はこざき", price: 2000 },
  { id: "tf347", area: "東区", name: "箱崎ふ頭", reading: "はこざきふとう", price: 2000 },
  { id: "tf348", area: "東区", name: "筥松", reading: "はこまつ", price: 2000 },
  { id: "tf349", area: "東区", name: "筥松新町", reading: "はこまつしん", price: 2000 },
  { id: "tf350", area: "東区", name: "八田", reading: "はった", price: 3000 },
  { id: "tf351", area: "東区", name: "浜男", reading: "はまお", price: 3000 },
  { id: "tf352", area: "東区", name: "原田", reading: "はらだ", price: 2000 },
  { id: "tf353", area: "東区", name: "東浜", reading: "ひがしはま", price: 2000 },
  { id: "tf354", area: "東区", name: "弘", reading: "ひろ", price: 4000 },
  { id: "tf355", area: "東区", name: "二又瀬", reading: "ふたまたせ", price: 2000 },
  { id: "tf356", area: "東区", name: "二又瀬新町", reading: "ふたまたせしん", price: 2000 },
  { id: "tf357", area: "東区", name: "馬出", reading: "まいだし", price: 2000 },
  { id: "tf358", area: "東区", name: "舞松原", reading: "まいまつばら", price: 2000 },
  { id: "tf359", area: "東区", name: "松香台", reading: "まつかだい", price: 3000 },
  { id: "tf360", area: "東区", name: "松崎", reading: "まつざき", price: 2000 },
  { id: "tf361", area: "東区", name: "松島", reading: "まつしま", price: 2000 },
  { id: "tf362", area: "東区", name: "松田", reading: "まつだ", price: 2000 },
  { id: "tf363", area: "東区", name: "御島崎", reading: "みしまざき", price: 3000 },
  { id: "tf364", area: "東区", name: "水谷", reading: "みずたに", price: 3000 },
  { id: "tf365", area: "東区", name: "三苫", reading: "みとま", price: 4000 },
  { id: "tf366", area: "東区", name: "みどりが丘", reading: "みどりがおか", price: 3000 },
  { id: "tf367", area: "東区", name: "みなと香椎", reading: "みなとかしい", price: 3000 },
  { id: "tf368", area: "東区", name: "美和台", reading: "みわだい", price: 4000 },
  { id: "tf369", area: "東区", name: "美和台新町", reading: "みわだいしん", price: 4000 },
  { id: "tf370", area: "東区", name: "若宮", reading: "わかみや", price: 2000 },
  { id: "tf371", area: "東区", name: "和白", reading: "わじろ", price: 3000 },
  { id: "tf372", area: "東区", name: "和白丘", reading: "わじろがおか", price: 3000 },
  { id: "tf373", area: "東区", name: "和白東", reading: "わじろひがし", price: 3000 },
  { id: "tf374", area: "東区", name: "エスポ", reading: "エスポ", price: 3000 },
  { id: "tf375", area: "東区", name: "ヴェール", reading: "ヴェール", price: 3000 },
  { id: "tf376", area: "東区", name: "あいおい", reading: "", price: 2000 },
  { id: "tf377", area: "東区", name: "あおき", reading: "", price: 2000 },
  { id: "tf378", area: "東区", name: "いそうだ", reading: "", price: 2000 },
  { id: "tf379", area: "東区", name: "いたづけ", reading: "", price: 2000 },
  { id: "tf380", area: "東区", name: "うらた", reading: "", price: 3000 },
  { id: "tf381", area: "東区", name: "えのきだ", reading: "", price: 1000 },
  { id: "tf382", area: "東区", name: "おおい", reading: "", price: 2000 },
  { id: "tf383", area: "東区", name: "おきはま", reading: "", price: 0 },
  { id: "tf384", area: "東区", name: "かたかす", reading: "", price: 1000 },
  { id: "tf385", area: "東区", name: "かねのくま", reading: "", price: 2000 },
  { id: "tf386", area: "東区", name: "かみうすい", reading: "", price: 1000 },
  { id: "tf387", area: "東区", name: "かみかわばた", reading: "", price: 0 },
  { id: "tf388", area: "東区", name: "かみごふく", reading: "", price: 0 },
  { id: "tf389", area: "東区", name: "かみつきくま", reading: "", price: 2000 },
  { id: "tf390", area: "東区", name: "かみむた", reading: "", price: 1000 },
  { id: "tf391", area: "東区", name: "かみや", reading: "", price: 0 },
  { id: "tf392", area: "東区", name: "ぎおん", reading: "", price: 0 },
  { id: "tf393", area: "東区", name: "ぎんてん", reading: "", price: 2000 },
  { id: "tf394", area: "東区", name: "くうこうまえ", reading: "", price: 2000 },
  { id: "tf395", area: "東区", name: "こくしょ", reading: "", price: 0 },
  { id: "tf396", area: "東区", name: "ことぶき", reading: "", price: 2000 },
  { id: "tf397", area: "東区", name: "こもんど", reading: "", price: 0 },
  { id: "tf398", area: "東区", name: "じゃくい", reading: "", price: 0 },
  { id: "tf399", area: "東区", name: "さんちく", reading: "", price: 2000 },
  { id: "tf400", area: "東区", name: "さんのう", reading: "", price: 0 },
  { id: "tf401", area: "東区", name: "しののめ", reading: "", price: 2000 },
  { id: "tf402", area: "東区", name: "しもうすい", reading: "", price: 1000 },
  { id: "tf403", area: "東区", name: "しもかわばた", reading: "", price: 0 },
  { id: "tf404", area: "東区", name: "しもごふく", reading: "", price: 0 },
  { id: "tf405", area: "東区", name: "しもつきくま", reading: "", price: 2000 },
  { id: "tf406", area: "東区", name: "しょうなん", reading: "", price: 2000 },
  { id: "tf407", area: "東区", name: "しんわ", reading: "", price: 2000 },
  { id: "tf408", area: "東区", name: "すざき", reading: "", price: 0 },
  { id: "tf409", area: "東区", name: "すみよし", reading: "", price: 0 },
  { id: "tf410", area: "東区", name: "せきじょう", reading: "", price: 0 },
  { id: "tf411", area: "東区", name: "たいはく", reading: "", price: 0 },
  { id: "tf412", area: "東区", name: "たけおか", reading: "", price: 2000 },
  { id: "tf413", area: "東区", name: "たけした", reading: "", price: 0 },
  { id: "tf414", area: "東区", name: "ちっこうほん", reading: "", price: 0 },
  { id: "tf415", area: "東区", name: "ちよ", reading: "", price: 0 },
  { id: "tf416", area: "東区", name: "つきくま", reading: "", price: 2000 },
  { id: "tf417", area: "東区", name: "つなば", reading: "", price: 1000 },
  { id: "tf418", area: "東区", name: "つましょうじ", reading: "", price: 0 },
  { id: "tf419", area: "東区", name: "てんや", reading: "", price: 0 },
  { id: "tf420", area: "東区", name: "とうこう", reading: "", price: 0 },
  { id: "tf421", area: "東区", name: "とうこうじ", reading: "", price: 0 },
  { id: "tf422", area: "東区", name: "なか", reading: "", price: 0 },
  { id: "tf423", area: "東区", name: "なかごふく", reading: "", price: 0 },
  { id: "tf424", area: "東区", name: "なかす", reading: "", price: 0 },
  { id: "tf425", area: "東区", name: "なかすなかしま", reading: "", price: 0 },
  { id: "tf426", area: "東区", name: "ならや", reading: "", price: 0 },
  { id: "tf427", area: "東区", name: "にしつきくま", reading: "", price: 1000 },
  { id: "tf428", area: "東区", name: "にしはる", reading: "", price: 2000 },
  { id: "tf429", area: "東区", name: "ちゅうおうがい", reading: "", price: 0 },
  { id: "tf430", area: "東区", name: "はかたえきひがし", reading: "", price: 0 },
  { id: "tf431", area: "東区", name: "はかたえきまえ", reading: "", price: 0 },
  { id: "tf432", area: "東区", name: "はかえきみなみ", reading: "", price: 0 },
  { id: "tf433", area: "東区", name: "はるまち", reading: "", price: 2000 },
  { id: "tf434", area: "東区", name: "はんみちばし", reading: "", price: 1000 },
  { id: "tf435", area: "東区", name: "ひえ", reading: "", price: 0 },
  { id: "tf436", area: "東区", name: "ひがしこうえん", reading: "", price: 2000 },
  { id: "tf437", area: "東区", name: "ひがしつきくま", reading: "", price: 2000 },
  { id: "tf438", area: "東区", name: "ひがしなか", reading: "", price: 0 },
  { id: "tf439", area: "東区", name: "ひがしひえ", reading: "", price: 0 },
  { id: "tf440", area: "東区", name: "ひがしひらお", reading: "", price: 2000 },
  { id: "tf441", area: "東区", name: "ひがしひらおこうえん", reading: "", price: 2000 },
  { id: "tf442", area: "東区", name: "ひかりおか", reading: "", price: 2000 },
  { id: "tf443", area: "東区", name: "みなみやはた", reading: "", price: 2000 },
  { id: "tf444", area: "東区", name: "みなみほん", reading: "", price: 2000 },
  { id: "tf445", area: "東区", name: "みのしま", reading: "", price: 0 },
  { id: "tf446", area: "東区", name: "むぎの", reading: "", price: 1000 },
  { id: "tf447", area: "東区", name: "もと", reading: "", price: 2000 },
  { id: "tf448", area: "東区", name: "もろおか", reading: "", price: 1000 },
  { id: "tf449", area: "東区", name: "ゆたか", reading: "", price: 1000 },
  { id: "tf450", area: "東区", name: "よしづか", reading: "", price: 0 },
  { id: "tf451", area: "東区", name: "よしづかほん", reading: "", price: 0 },
  { id: "tf452", area: "東区", name: "りっかじ", reading: "", price: 2000 },
  { id: "tf453", area: "東区", name: "れいせん", reading: "", price: 0 },
];

export const CAST_NAMES = [
  "ワカバ～全てがハイクオリティ！～", "アイ～会わなきゃ絶対後悔の逸材～", "リリス～精を吸い取る小悪魔系～", "シン～一瞬で恋人感覚の超逸材～", "ウララ～最高で最強女子～",
  "キラリ～輝く一番星★奇跡の逸材～", "ラブブ～エロがりプーマ～", "キュン～最上級をお約束～", "カリン～この瞳に釘付け～", "コハネ～史上最高のアイドル～",
  "ランマル～博多のハッピービッチ～", "レン～みんな大好き素人彼女～", "ネル～完全無敵のハイレベル美女～", "カルア～120cmの爆乳迫る～", "レノン～究極の癒しルックス～",
  "アミ～完全未経験の巨乳美人～", "スズカ～貴方にIたい爆乳娘～", "マクラ～Iのあるエロ彼女～", "マリン～愛嬌全開♡マリン姫～", "ニア～沼確定の最終兵器～",
  "ユウリ～八重歯光る必殺スマイル～", "カグヤ～未経験純朴Ｆカップ～", "メイリイ～無邪気な美少女伝説～", "ニャン～甘えんぼ猫ちゃん～", "モニカ～くびれを持つドＭちゃん～",
  "ホノ～本能むき出し甘えん坊～", "ミソラ～愛燦燦と癒しの女王～", "ハルキ～愛嬌◎の姉系女子～", "ベティー～天真爛漫純白ヒロイン～", "トラ～とろける笑顔の虎乙女～",
  "ユナ～私のおっぱい揉んでネ～", "ツキナ～秘密を抱えた現役学生～", "キョウコ～癒し系の無自覚スケベ～", "ランカ～どれをとっても最高級～", "ジュン～業界未経験ハーフ系美女～",
  "クルミ～Ｇカップの衝撃と癒し～", "スイ～Hな看護師のエロエロ治療～", "トモ～清楚で美人、でもエッチ～", "ロマネ～貴方を酔わす美貌～", "センリ～エロ美しさ満開、至高～",
  "レイナ～圧倒的な輝きと艶～", "トモカ～誠心誠意、尽くします～", "ウナ～ルックス抜群黒髪ロリ系～", "レンカ～奇跡のフードル降臨♡～", "コノミ～一目で貴方のお気に入り～",
  "シズク～プレミアム級清楚女子～", "ランス～革命的♡恋人感覚～", "ヒジリ～超可憐なハイジニーナ～", "アユミ～清楚の塊が実は変態美女～", "リン～業界未経験ゆるふわガール～",
  "セシル～美しすぎて一目惚れ確定～", "ネイロ～ぶっちぎりの可愛さ～", "サアヤ～生乳カステラいかが？～", "サナ～小柄細身、でも姉系美人～", "ユメカ～天使級の素人美少女～",
  "アンナ～瞬間、恋に堕ちる美女～", "ニーナ～キレカワ未経験十代～", "アゲハ～セクシーな蝶が舞う～", "ユイ～細身美人は実はM！？～", "ミナ～清純で奥ゆかしい恋人～",
  "ユリ～清純派！白い肌の妖精～", "マコト～Jカップの爆乳を見よ～", "シュウ～必見激カワスタイル～", "フィス～業界未経験キレカワ女子～", "メグ～男が貪りたくなるカラダ～",
  "レイ～素人感溢れる細身美人～", "ヒマリ～敏感女子は未経験！？～", "チセ～小柄で色白Fカップ～", "ラム～癒したっぷり甘々空間～", "カナ～一生懸命ご奉仕します～",
  "シノ～清楚なのに淫乱ド痴女～", "マリィ～爆乳Jカップの奇跡～", "ケイト～最強の笑顔にイチコロ☆～", "ミカサ～極上モデル級ルックス～", "スズナ～責め好きの可愛い女の子～",
  "タスキ～シン・エロの神～", "マユカ～激カワスレンダー女子～", "クロエ～清楚純粋愛情の塊～", "ライチ～綺麗なボディとパイパン～", "モモカ～癒し系最強素人～",
  "フウカ～理想の綺麗なお姉さん～", "ヨツハ～小動物系キュート女子～", "リョウ～おっとりドМ女子～", "ラピス～最強瑠璃色スマイル☆～", "ジェシカ～真面目などえむっこ♡～",
  "ミア～ヤバカワ未経験ティーン～", "ルカ～コミュ力◎可愛いお姉さま～", "ヤエ～八重歯が可愛い純情素人娘～", "ミツキ～清純な超絶痴女～", "ミサ～超素人！純潔乙女☆～",
  "アキハ～無毛美白肌の敏感娘～", "ユラ～陽気なエロリスト～", "ニコナ～愛嬌抜群一目惚れ確実～", "サエ～モデル系美女、完全未経験～", "ルナ～品のある黒髪と巨乳～",
  "リオナ～情熱的官能ハーフ美女～", "マロン～スタイル抜群！美ボディ～", "アヤカ～潜在能力∞～", "チフユ～ミニマム痴女降臨～", "ミュン～彼女にしたいNo",
  "カホ～小柄Eカップの甘えん坊～", "クレア～100万年愛せるお姉様～", "テマリ～天真爛漫てんてまり～", "ハム～ぺろぺろフェラ太郎～", "ムメイ～若さと癒しのコンボ～",
  "ユズユ～甘酸っぱいGの果実～", "アヤ～まばゆい笑顔のS級美人～", "キナコ～可愛い笑顔にイチコロ～", "ミヤビ～お姉さんは色白細身～", "ウニ～愛が詰まった美味しい身体～",
  "ボタン～甘く蕩ける深い愛～", "アリス～バリカワ地雷系女子～", "チアキ～細身で大きな瞳美人～", "モエ～類まれな美貌☆激推し美女～", "サヤカ～極上の絶品スタイル美女～",
  "ケイ～敏感体質の素人女子～", "トキ～ぶっちぎりの可愛さ ～", "コトミ～巨乳かわいいエロ自慢～", "ハルカ～色白美肌輝く桃尻娘～", "タルト～包みこむような優しさ～",
  "コトハ～小柄細身のオトナ女子～", "セラ～等身大の未経験女の子～", "シイナ～濡れて惚れて乱れる夜～", "ヒナコ～パイパン未経験エロ娘～", "セレナ～溢れる色気に極スタイル～",
  "リア～美しくHに…男の理想郷～", "アルカ～トロける笑顔にガチ恋～", "ユニ～可愛さ炸裂素人ガール～", "ムギ～豊穣の麦、揺れるFカップ～", "アオバ～真っ白ビッグな胸～",
  "コノハ～変態素人娘の秘めゴト～", "マイカ～放課後ヒロイン～", "ウミ～ビッグウェーブ！白い妖精～", "セナ～この癒しに見惚れる～", "ミツリ～貴方だけの恋柱♡～",
  "ペタンコ～ド変態無毛レイヤ―～", "マリア～現代の聖母はドエロ！？～", "ニナ～佳麗な色白美女～", "サトミ～超プレミアムガール降臨～", "スズネ～Gカップ美人お姉さん～",
  "ミルキ～貴方の前でイキまくり～", "アイリ～カワイイとエロの二刀流～", "ハンナ～今ドキの女の子はエロい～", "ナミ～スタイル抜群期待のホープ～", "ヒトミ～Gカップおっとりちゃん～",
  "マキ～美乳+美尻=即指名～", "リムル～1ｍ越えの柔らか爆乳～", "ルピス～小柄キレカワ美女～", "サキ～未経験の純白スレンダー～", "ミカゲ～エロ戦車突撃ー！～",
  "キホ～清楚F乳姉系美人～", "アカネ～細身E乳キュートガール～", "キコ～超☆美麗スタイル～", "ハル～色白清楚なエロ娘♪～", "アリサ ～優等生タイプの秘密～",
  "ヨル～美しさとエロの饗宴～", "リコ～エッチで優しいお姫様～", "サヨ～最高級！広島人気姫♪～", "ホノカ～未経験女子の恥じらい～", "ティナ～モデル系美女の素顔～",
  "ミウ～ナチュラル美人は清純派～", "イヴ～明るくエッチに元気良く！～", "チナツ～ルックス抜群清楚系美女～", "ネモ～キュンキュン☆ロリータ姫～", "ソラ～人懐っこい未経験女子～",
  "ホタル～100越えIカップ美女～", "ツミレ～純粋天然Hカップ娘～", "エレナ～パーフェクトスタイル～", "ツカサ～清楚→エロい女に豹変！～", "ニチカ～Hでキュートな女の子～",
  "ヒトカ～デリ始めたってよ！～", "コナツ～極級のアイドル系美女～", "テンシ～ロリロリ乙女のEカップ～", "ミラン～巨乳美女☆風俗デビュー～", "カズハ～全てがプレミアム級～",
  "カノン～パイパン恋人に釘付け～", "ナツメ～清楚癒しの綺麗美人～", "カガミ～それいけ！加賀美さん～", "ニカ～超スレンダー！未経験姫～", "シエル～ナチュラル笑顔に酔う～",
  "リセ～小さく可愛い美少女♡～", "モコ～18歳未経験美少女♪～", "ミク～美と清楚の女神～", "セリカ～おつかれ生 生AF対応～", "リアナ～10代ギャルとの夜～",
  "ミフユ～スケベなМっ子～", "ココナ～爆乳Gカップで遊んで♡～", "ナナ～極上のルックスとスタイル～", "シオン～ティーンGカップの魅力～", "ツユ～G乳少女は潮吹きが凄い！～",
  "ヒメノ～いつも全力！色白姫様～", "ユノ～最高スタイルの綺麗系美女～", "リズ～未経験ロリ系最上級～", "ヒナタ～全身性感帯F乳ちゃん～", "アマネ～小悪魔的乙女の誘惑～",
  "シュリ～細身女子、初めての経験～", "マツリ～19歳！完全業界未経験～", "ミオ～清楚と美しさの極み！～", "アイル～白く美しい肌とスタイル～", "セイラ～Fカップとあどけなさ～",
  "ノエル～清楚なモデル系美女～", "ユリナ～美麗な素人お姉様～", "ヒカリ～眩しいほどの愛おしさ～", "ナオ～完璧ボディの潮吹く美女～", "ナギサ～モデル系美女は大洪水～",
  "メイ～SS級スレンダー美人～", "ユキ～一生触れるおっぱい～", "ツバキ～Hな天使が貴方に微笑む～", "スミレ～天使のような可愛い童顔～", "ララ～清純派アイドル☆デビュー～",
  "カレン～未経験だけどドＭです。～", "ジュリ～完全業界未経験ギャル～", "マイ～パイパンスレンダー美人～", "マオ～清純派素人系の巨乳女子～", "ユウキ～Ｓ級Ｓ女、至高のご褒美～",
  "マリエ～目を奪われる美しさ", "ネネ～宝石の様な瞳の女の子～", "レナ～モデル系未経験女子～", "ミオン～完全業界未経験の新星～", "ルキ～パイパンクールビューティ～",
  "ミスズ～弱点のない可愛らしさ～", "サクラ～完全未経験期待の星～", "ハナ～天真爛漫Ｆカップ美女～", "イチゴ～色白純粋な女の子～", "ココミ～超清楚系美女の煌めき～",
  "クミ～完全未経験色白美肌娘～", "カエデ～素人妊婦はスレンダー～", "ツムギ～太陽の笑顔の妹系～", "ユウナ～流麗なボディラインと美～", "マナ～未経験Eカップが脱ぐ！～",
  "ショウ～高身長最高峰美少女～", "マアサ～綺麗な女性は好きですか～", "アスカ～類稀な魅力ある美女～", "レム～超カワふんわり美人～", "ユミ～別格色白スレンダー！～",
  "ミユ～どんぐり眼のキレカワ美女～", "サラ～上品な雪肌美人～", "ミレイ～スタイル抜群美乳女子～", "シイ～輝く笑顔ずっと見ていたい～", "リイサ～Hカップエイティーン！～",
  "チカ～巨乳S美女に責められる～", "フブキ～涼やか美人の内緒の遊び～", "ミサキ～白雪肌に輝く本物美乳～", "ユキヤ～素人18歳、超細身女子～", "アズサ～純白清楚な天使の素顔～",
  "キラ～可愛さ金メダル☆～", "リオン～超キュートアイドル☆～", "リッカ～推し確定の天使降臨～", "サチ～ガチ恋注意報発令！～", "リク～癒しとエロの究極系～",
  "イブキ～ラグジュアリータイム♪～", "チノ～可憐な姿は雪の妖精～", "クレープ～夢を重ねた甘い時～", "タフィー～パイパン美少女ここに～", "コロン～笑顔の奥に潜むどえむ～",
  "セリナ～細身パイパン白衣の天使～", "ミツバ～ドＭで敏感な女の子～", "リサ～長身ギャルに責められる～", "ルイ～満足確定ドM潮吹き美女～", "ユキミ～淫らに乱れる雪月花～",
  "ラン～ドM潮吹き動画撮影～", "ココ～最高峰！国民的美少女級～", "イオリ～期待の星降臨☆～", "マナカ～Eカップの甘えんぼさん～", "レイカ～目を奪うほどの美しさ～",
  "エナ〜全て揃った奇跡の逸材〜",
];
export const OPTION_POOL = ["指名", "本指名", "延長30分", "コスプレ", "ロングコース"];
export const FAMILY_NAMES = ["佐藤", "鈴木", "高橋", "田中", "伊藤", "渡辺", "山本", "中村", "小林", "加藤"];

// ============================================================
// 24時間営業スケジュール生成(本日+今後10日分)
//  同時稼働(待機+接客)が常に約25人前後になるよう、
//  1時間あたり5人がシフトイン、1シフト5時間で回す設計
// ============================================================
export const NUM_DAYS = 10;
export function isoDate(dt) { return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`; }
export function dayLabel(dt) { const w = ["日", "月", "火", "水", "木", "金", "土"][dt.getDay()]; return `${dt.getMonth() + 1}/${dt.getDate()}(${w})`; }
export const DAY_DATES = Array.from({ length: NUM_DAYS }, (_, d) => { const dt = new Date(); dt.setHours(0, 0, 0, 0); dt.setDate(dt.getDate() + d); return dt; });

export const DAY_ROTATION_STEP = 131; // 日ごとに違う顔ぶれにするための回転幅
export const SHIFT_LEN = 5;           // 1シフト5時間
export const STARTERS_PER_HOUR = 5;   // 毎時5人が出勤 → 同時稼働 5*5=25人前後を維持

// dayIndex(0=本日〜9=10日後)の出勤スケジュールを返す(24*5=120人/日)
export function daySchedule(dayIndex) {
  const N = CAST_NAMES.length;
  const offset = (dayIndex * DAY_ROTATION_STEP) % N;
  const entries = [];
  for (let idxInDay = 0; idxInDay < 24 * STARTERS_PER_HOUR; idxInDay++) {
    const hour = Math.floor(idxInDay / STARTERS_PER_HOUR);
    const castIndex = (offset + idxInDay) % N;
    entries.push({ castIndex, shiftStart: hour, shiftEnd: hour + SHIFT_LEN });
  }
  return entries;
}

// キャストの基本情報(身分・個人情報)のみを生成。稼働状態は後段で本日分を上書き
export function generateCasts() {
  const idTypes = ["運転免許証", "マイナンバーカード", "パスポート", "健康保険証"];
  return CAST_NAMES.map((name, i) => {
    const stdDaysAgo = [20, 55, 88, 30, 10, 70][i % 6];
    const stdLast = new Date(2026, 5, 30); stdLast.setDate(stdLast.getDate() - stdDaysAgo);
    const age = 21 + (i % 9);
    const birthYear = 2026 - age;
    const birthday = `${birthYear}-${String((i % 12) + 1).padStart(2, "0")}-${String((i * 7 % 27) + 1).padStart(2, "0")}`;
    const joinDate = `202${4 + (i % 2)}-${String((i % 12) + 1).padStart(2, "0")}-${String((i % 27) + 1).padStart(2, "0")}`;
    const okCount = 2 + (i % 3);
    const okOptions = OPTION_POOL.filter((_, oi) => (i + oi) % 5 < okCount).slice(0, okCount);
    return {
      id: `c${i + 1}`, name,
      honmyo: `${FAMILY_NAMES[i % FAMILY_NAMES.length]} ${["彩", "舞", "結", "楓", "咲"][i % 5]}子`,
      age, birthday,
      status: "off", shiftStart: "-", shiftEnd: "-", hotel: null, todayCount: 0, todaySales: 0, // ← applyDay0Stateで本日分を上書き
      phone: `090-${String(1000 + i).slice(-4)}-${String(2000 + i * 3).slice(-4)}`,
      address: `福岡市${["中央区", "博多区", "東区", "南区"][i % 4]}${["大名", "今泉", "薬院", "春吉"][i % 4]}${(i % 5) + 1}-${(i % 20) + 1}-${(i % 15) + 1}`,
      idType: idTypes[i % idTypes.length],
      idNo: `${String(1000 + i * 13).slice(-4)}-${String(5000 + i * 7).slice(-4)}-${String(9000 - i * 3).slice(-4)}`,
      joinDate,
      itakuRate: 0.5 + (i % 3) * 0.05, idVerified: i % 7 !== 0,
      stdLast: stdLast.toISOString().slice(0, 10),
      okOptions, comment: "", shops: ["hakata"], taikiba: "", castClass: "standard", rewardRank: "base", // 所属店舗・待機場・クラス・報酬ランク(博多ココ・スタンダードのみ使用)
      loginId: `cast${String(i + 1).padStart(3, "0")}`, password: String(1000 + ((i * 37) % 9000)).padStart(4, "0"), // キャストアプリのログイン情報
      biko1: "", biko2: "", // 備考1・備考2(自由記述)
    };
  });
}
export const INITIAL_CASTS_BASE = generateCasts();

export const CUSTOMER_SURNAMES = ["田中", "佐藤", "鈴木", "高橋", "伊藤", "渡辺", "山本", "中村", "小林", "加藤", "吉田", "山田", "佐々木", "山口", "松本", "井上", "木村", "林", "清水", "斎藤"];

// 本日〜10日後まで、各日のスケジュールに沿って予約を自動生成(10分単位)
export function generateAllReservations(casts, hotelList) {
  // 座標を持つホテルだけを対象に予約を生成(ルートが必ず引けるようにするため)。
  // 引数が無ければデモの座標付き15ホテルを使う。
  const src = (hotelList && hotelList.length ? hotelList : INITIAL_HOTELS).filter((h) => h.lat != null && h.name && h.name !== "-");
  const pool = src.length ? src : INITIAL_HOTELS;
  const list = [];
  let idx = 1;
  const durPattern = [1, 1.5, 1];
  const statusCycle = ["受付済", "移動中", "接客中", "終了"];
  for (let d = 0; d < NUM_DAYS; d++) {
    const dateStr = isoDate(DAY_DATES[d]);
    const sched = daySchedule(d);
    sched.forEach((entry) => {
      const cast = casts[entry.castIndex];
      if (!cast) return;
      const span = entry.shiftEnd - entry.shiftStart;
      const count = Math.max(1, Math.round(span * 0.5)); // 1時間0.5本の目安
      const slot = span / count;
      for (let k = 0; k < count; k++) {
        let dur = durPattern[(entry.castIndex + k) % durPattern.length];
        if (dur > slot - 1 / 6) dur = 1;
        let start = entry.shiftStart + k * slot + 0.05;
        start = Math.round(start * 6) / 6; // 10分単位
        dur = Math.round(dur * 6) / 6;
        if (start + dur > entry.shiftEnd) dur = Math.max(1 / 6, Math.round((entry.shiftEnd - start) * 6) / 6);
        const hotelObj = pool[(entry.castIndex * 3 + k + d) % pool.length];
        const hotel = hotelObj.name;
        const course = dur >= 2 ? { name: "120分", price: 20900 } : dur >= 1.5 ? { name: "90分", price: 16500 } : { name: "60分", price: 11000 };
        const surname = CUSTOMER_SURNAMES[(entry.castIndex * 7 + k * 3 + d) % CUSTOMER_SURNAMES.length];
        const status = d === 0 ? statusCycle[(entry.castIndex + k) % statusCycle.length] : "受付済";
        const withShimei = (entry.castIndex + k) % 3 === 0;
        list.push({
          id: `r${idx}`, start, dur, customer: `${surname}様`,
          phone: `090-${String(3000 + entry.castIndex * 7 + k).slice(-4)}-${String(4000 + entry.castIndex * 3 + k + d).slice(-4)}`,
          castId: cast.id, area: hotelObj.area || hotelArea(hotel), hotel, room: `${300 + ((entry.castIndex * 5 + k * 11 + d * 3) % 600)}号室`,
          course: course.name, options: withShimei ? [{ name: "指名", price: 2000 }] : [],
          price: course.price + (withShimei ? 2000 : 0), status,
          sendDriver: "未定", pickDriver: "未定", sendStatus: "unassigned", pickStatus: "unassigned", note: "", date: dateStr,
        });
        idx++;
      }
    });
  }
  return list;
}

// 本日(day0)分のスケジュール・予約から、現在時刻に応じたキャストの状態を反映
export function applyDay0State(casts, allReservations) {
  const sched0 = daySchedule(0);
  const schedByIndex = new Map(sched0.map((e) => [e.castIndex, e]));
  const today0 = isoDate(DAY_DATES[0]);
  const now = new Date();
  const nowHour = now.getHours() + now.getMinutes() / 60;
  const byCast = new Map();
  allReservations.forEach((r) => {
    if (r.date !== today0) return;
    if (!byCast.has(r.castId)) byCast.set(r.castId, []);
    byCast.get(r.castId).push(r);
  });
  return casts.map((c, i) => {
    const entry = schedByIndex.get(i);
    if (!entry) return c; // 本日出勤なし(status='off'のまま)
    const list = byCast.get(c.id) || [];
    const todayCount = list.length;
    const todaySales = list.reduce((a, r) => a + r.price, 0);
    let status = "waiting", hotel = null;
    if (nowHour < entry.shiftStart) status = "before_shift";
    else if (nowHour >= entry.shiftEnd) status = "off";
    else {
      const active = list.find((r) => nowHour >= r.start && nowHour < r.start + r.dur);
      if (active) { status = "working"; hotel = active.hotel; }
    }
    return { ...c, status, shiftStart: `${entry.shiftStart}:00`, shiftEnd: `${entry.shiftEnd}:00`, hotel, todayCount, todaySales };
  });
}

export const ALL_RESERVATIONS_10D = generateAllReservations(INITIAL_CASTS_BASE);
export const INITIAL_CASTS = applyDay0State(INITIAL_CASTS_BASE, ALL_RESERVATIONS_10D);

const DRIVER_NAME_POOL = ["砂川", "山本", "福島", "森本", "原", "加藤", "島田", "本村", "中嶋", "原田(拓)", "山田", "小林", "田中(浩)", "田中", "崎山", "岩永", "奥園", "柳田", "橋本", "長", "堀川", "宮地", "福岡", "のり", "福田", "阪下", "山口雄", "榎本", "下原", "新枦", "前田", "中釜", "日山", "伊藤", "久保", "右山", "龍", "新研", "山本(博)", "江頭", "荒井", "富田", "川島", "竹内", "山口(貴)", "井上", "馬渡", "吉武", "高倉", "岩切", "中武", "古後", "草場", "山本和", "倉田", "高田", "儘田", "外山", "原田", "岡", "奥山", "梶原", "渡邊", "国友", "阿比留", "村本", "生林"];
const DRIVER_LOGIN_POOL = ["sunagawa", "manabu", "fukushima", "morimoto", "hara", "katou", "shimada", "motomura", "nakashima", "haradataku", "yamada", "kobayashi", "hiroshi", "tanaka", "sakiyama", "iwanaga", "okuzono", "yanakita", "hashimoto", "cyou", "horikawa", "miyaji", "fukuoka", "nori", "fukuda", "sakashita", "yamaguchi", "enomoto", "shimohara", "shinbashi", "maeda", "nakagama", "hiyama", "itou", "kubo", "migiyama", "ryu", "araken", "yamamotoh", "egashira", "arai", "tomita", "kawashima", "takeuchi", "yamataka", "inoue", "mawatari", "yoshitake", "takakura", "iwakiri", "nakatake", "kogou", "kusaba", "yamamoto", "kurata", "takata", "mamada", "sotoyama", "harada", "oka", "okuyama", "kajiwara", "watanabe", "kunitomo", "abiru", "muramoto", "syobayashi"];
const DRIVER_PASSWORD_POOL = ["0616", "1003", "0717", "0214", "0809", "0119", "0301", "0106", "0620", "0309", "0903", "0820", "0615", "0105", "1010", "0928", "0828", "1005", "0513", "1208", "0621", "1210", "0616", "0321", "0430", "0319", "0316", "1009", "1018", "1124", "1130", "0504", "0323", "0301", "0809", "0706", "0902", "0725", "0327", "0409", "0408", "0318", "0928", "0923", "1017", "1003", "0909", "0313", "1016", "0505", "0722", "0912", "0330", "0130", "0826", "1230", "0321", "1214", "1107", "0305", "0728", "1122", "0429", "0422", "0405", "1202", "1114"];
// 福岡市内に大まかに散らした待機座標(営業所周辺〜各区)。DRIVER_AREASと対応。人数分に足りない分は巡回で割当
const DRIVER_SPOTS = [
  { lat: 33.5914, lng: 130.3990 }, { lat: 33.6050, lng: 130.4100 }, { lat: 33.5896, lng: 130.4050 }, { lat: 33.5700, lng: 130.4200 },
  { lat: 33.5805, lng: 130.4225 }, { lat: 33.5930, lng: 130.4060 }, { lat: 33.5850, lng: 130.4017 }, { lat: 33.6200, lng: 130.4300 },
  { lat: 33.5620, lng: 130.4260 }, { lat: 33.5945, lng: 130.4050 }, { lat: 33.5860, lng: 130.4010 }, { lat: 33.5920, lng: 130.4130 },
  { lat: 33.5680, lng: 130.4180 }, { lat: 33.5895, lng: 130.4205 }, { lat: 33.5900, lng: 130.4200 }, { lat: 33.5750, lng: 130.3950 },
  { lat: 33.6000, lng: 130.4250 }, { lat: 33.5830, lng: 130.4100 }, { lat: 33.5650, lng: 130.4050 }, { lat: 33.5980, lng: 130.3980 },
];
const DRIVER_AREAS = ["中央区", "東区", "博多区", "南区", "中央区", "博多区", "中央区", "東区", "南区", "博多区", "中央区", "博多区", "南区", "博多区", "博多区", "早良区", "東区", "中央区", "南区", "早良区"];
// 待機場の選択肢(キャスト設定・受付表で共通)
export const TAIKI_OPTIONS = ["", "2階車", "駅南", "220", "1階", "自宅", "住吉", "車"];
// ドライバーの昼夜区分
export const DRIVER_SHIFT = { day: "昼", night: "夜" };

export function generateDrivers() {
  return DRIVER_NAME_POOL.map((name, i) => {
    const area = DRIVER_AREAS[i % DRIVER_AREAS.length];
    return {
      id: `d${i + 1}`, name, car: `${i + 1}号車`, status: "waiting", area,
      pos: { x: 20 + (i * 11) % 60, y: 20 + (i * 17) % 60 },
      latlng: DRIVER_SPOTS[i % DRIVER_SPOTS.length],
      dest: null, note: `${area}で待機中`,
      wage: 1250 + (i % 3) * 25, hours: 5 + (i % 4),
      loginId: DRIVER_LOGIN_POOL[i], password: DRIVER_PASSWORD_POOL[i],
      shift: "day", // 昼(day) / 夜(night)
    };
  });
}
const INITIAL_DRIVERS_RAW = generateDrivers();

// デモ表示用：本日の近い時間帯のジョブを実際にドライバーへ割り当てておく(だいたい 送り7台・迎え7台・待機6台)
// (でないと「送迎中」等のラベルだけあって、線を引く先が無い状態になってしまうため)
export function seedDemoDispatch(drivers, allReservations, dateStr) {
  const jobs = buildDispatchJobs(allReservations, dateStr).filter((j) => j.jobStatus === "unassigned");
  const now = new Date();
  const nowHour = now.getHours() + now.getMinutes() / 60;
  const nearJobs = jobs.filter((j) => j.time >= nowHour && j.time <= nowHour + 2).sort((a, b) => a.time - b.time);
  const sendJobs = nearJobs.filter((j) => j.kind === "send");
  const pickJobs = nearJobs.filter((j) => j.kind === "pick");

  const resPatch = new Map();
  const driverPatch = new Map();
  let di = 0;
  const assign = (job) => {
    const driver = drivers[di]; if (!driver) return;
    di++;
    const patch = resPatch.get(job.reservationId) || {};
    if (job.kind === "send") { patch.sendDriver = driver.car; patch.sendStatus = "enroute"; }
    else { patch.pickDriver = driver.car; patch.pickStatus = "enroute"; }
    resPatch.set(job.reservationId, patch);
    driverPatch.set(driver.id, "dispatch");
  };
  sendJobs.slice(0, 7).forEach(assign);
  pickJobs.slice(0, 7).forEach(assign);
  // 残りは待機中のまま(既定値)

  const reservations = allReservations.map((r) => resPatch.has(r.id) ? { ...r, ...resPatch.get(r.id) } : r);
  const seededDrivers = drivers.map((d) => driverPatch.has(d.id) ? { ...d, status: driverPatch.get(d.id), note: "" } : d);
  return { reservations, drivers: seededDrivers };
}

const _seeded = seedDemoDispatch(INITIAL_DRIVERS_RAW, ALL_RESERVATIONS_10D, isoDate(DAY_DATES[0]));
export const INITIAL_DRIVERS = _seeded.drivers;
export const INITIAL_RESERVATIONS = _seeded.reservations; // 本日〜10日後、日付(date)付きで全件保持

const _SURNAMES = ["田中", "佐藤", "鈴木", "高橋", "伊藤", "渡辺", "山本", "中村", "小林", "加藤", "吉田", "山田", "佐々木", "山口", "松本", "井上", "木村", "林", "清水", "斎藤", "松田", "中野", "橋本", "中島", "岡田", "前田", "後藤", "村上", "長谷川", "近藤"];
const _COURSES = ["60分コース", "90分コース", "120分コース"];
const _CASTS = ["みお", "りん", "あず", "せな", "こはる", "ひな", "さら", "ゆら", "まい", "るか"];
const _PRICES = { "60分コース": 18000, "90分コース": 21000, "120分コース": 28000 };
function _randDate(daysAgo, range = 30) {
  const d = new Date(); d.setDate(d.getDate() - Math.floor(daysAgo + Math.random() * range));
  return isoDate(d);
}
export const INITIAL_CUSTOMERS = Array.from({ length: 60 }, (_, i) => {
  const id = 1000 + i;
  const name = _SURNAMES[i % _SURNAMES.length];
  const visits = Math.floor(Math.random() * 20) + 1;
  const firstVisit = _randDate(visits * 14, 7);
  const lastVisit = _randDate(1, 30);
  const totalSales = visits * _PRICES[_COURSES[i % 3]];
  const colorLevel = i % 20 === 3 ? "ng" : i % 15 === 0 ? "vip" : i % 10 === 1 ? "caution" : "normal";
  const history = Array.from({ length: Math.min(visits, 5) }, (__, k) => ({
    date: _randDate(k * 14, 7), cast: _CASTS[(i + k) % _CASTS.length],
    course: _COURSES[k % 3], option: k % 2 === 0 ? "指名" : "なし",
    hotel: INITIAL_HOTELS[i % INITIAL_HOTELS.length]?.name || "-", price: _PRICES[_COURSES[k % 3]],
  }));
  return {
    id: `u${id}`, numId: id, name, phones: [`0${Math.floor(80 + Math.random() * 20)}${String(10000000 + id * 7).slice(-8).replace(/(.{4})/, "$1-")}`],
    address: `福岡市${["中央区", "博多区", "東区", "南区"][i % 4]}`, email: i % 3 === 0 ? `${name.toLowerCase()}${id}@example.com` : "",
    visits, firstVisit, lastVisit, totalSales, colorLevel, note: colorLevel === "ng" ? "出禁：キャストへの言動" : colorLevel === "vip" ? "VIP：常連" : "", history,
  };
}).concat([
  { id: "u4", numId: 4, name: "問題客", phones: ["090-9999-9999"], address: "福岡市博多区", email: "", visits: 2, firstVisit: "2026-05-01", lastVisit: "2026-05-11", totalSales: 36000, colorLevel: "ng", note: "出禁：キャストへの言動", history: [] },
]);

export const INITIAL_STAFF = [
  { id: "s1", name: "近藤", viewRole: "owner", loginId: "kondo", password: "pass1234" },
  { id: "s2", name: "白石", viewRole: "operator", loginId: "shiraishi", password: "pass1234" },
  { id: "s3", name: "大西", viewRole: "operator", loginId: "onishi", password: "pass1234" },
];

export const INITIAL_EXPENSES = [
  { id: "e1", date: "2026-06-30", account: "広告宣伝費", amount: 45000, memo: "求人媒体掲載" },
  { id: "e2", date: "2026-06-30", account: "車両費", amount: 12000, memo: "ガソリン代" },
  { id: "e3", date: "2026-06-30", account: "消耗品費", amount: 8000, memo: "備品購入" },
];
export const ACCOUNT_ITEMS = ["広告宣伝費", "車両費", "消耗品費", "通信費", "地代家賃", "水道光熱費", "雑費"];
// 仕訳辞書(阿修羅「仕訳辞書」参考)
export const JOURNAL_DICT = [
  { key: "求人広告", debit: "広告宣伝費", credit: "現金", memo: "求人媒体掲載" },
  { key: "ガソリン", debit: "車両費", credit: "現金", memo: "ガソリン代" },
  { key: "備品", debit: "消耗品費", credit: "現金", memo: "備品購入" },
  { key: "家賃", debit: "地代家賃", credit: "普通預金", memo: "事務所家賃" },
];

export const SALES_HISTORY = [
  { date: "6/25", sales: 186000 }, { date: "6/26", sales: 214000 }, { date: "6/27", sales: 198000 },
  { date: "6/28", sales: 251000 }, { date: "6/29", sales: 176000 }, { date: "6/30", sales: 223000 },
];
export const REPORT_DATA = {
  日: { calls: 38, customers: 23, sales: 468000, itaku: 257000, ochi: 211000 },
  月: { calls: 1120, customers: 684, sales: 13860000, itaku: 7623000, ochi: 6237000 },
  年: { calls: 13400, customers: 8210, sales: 166300000, itaku: 91465000, ochi: 74835000 },
};

// ============================================================
// レスポンシブCSS
// ============================================================
export const GLOBAL_CSS = `
  * { box-sizing: border-box; }
  .grid-4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; }
  .grid-5 { display: grid; grid-template-columns: repeat(5, 1fr); gap: 12px; }
  .grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; }
  .grid-2 { display: grid; grid-template-columns: 1.3fr 1fr; gap: 16px; }
  .board-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; align-items: start; }
  .table-scroll { width: 100%; overflow-x: auto; }
  .top-scrollbar-pc { display: block; }
  @media (max-width: 900px) { .top-scrollbar-pc { display: none; } }
  ::placeholder { color: #B7C0CC; opacity: 1; }
  ::-webkit-input-placeholder { color: #B7C0CC; }
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
export async function generateCopy(kind, castName, keywords) {
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
export function StatusChip({ status }) {
  const s = CAST_STATUS[status];
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 10px", borderRadius: 999, fontSize: 12, fontWeight: 600, color: s.color, background: s.bg, border: `1px solid ${s.color}33`, whiteSpace: "nowrap" }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: s.color, display: "inline-block" }} />{s.label}
    </span>
  );
}
export function Card({ children, style, className }) {
  return <div className={className} style={{ background: COLORS.panel, border: `1px solid ${COLORS.border}`, borderRadius: 14, padding: 20, boxShadow: "0 1px 3px rgba(43,38,32,0.04)", ...style }}>{children}</div>;
}
export function SectionTitle({ children, sub }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <h2 style={{ fontFamily: "'Zen Old Mincho', serif", fontSize: 22, color: COLORS.textMain, margin: 0, letterSpacing: 0.5 }}>{children}</h2>
      {sub && <p style={{ color: COLORS.textSub, fontSize: 13, margin: "4px 0 0" }}>{sub}</p>}
    </div>
  );
}
export function Yen({ value }) { const v = Number(value); return <span style={{ fontFamily: "'JetBrains Mono', monospace" }}>¥{isNaN(v) ? 0 : v.toLocaleString()}</span>; }
export function AreaHotel({ area, hotel }) { if (area === "-" || !area) return <span>-</span>; return <span>{area}{hotel ? ` ・ ${hotel}` : ""}</span>; }
export function castFullName(c) { if (!c) return "未割当"; return c.name || ""; }

// ひらがな⇔カタカナを区別せず検索するための正規化(全部カタカナに寄せて小文字化)
export function kanaNormalize(s) {
  return String(s || "")
    .replace(/[\u3041-\u3096]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) + 0x60)) // ひらがな→カタカナ
    .toLowerCase();
}
// 表示名を全角換算n文字で切り、超過分は…にする(全角=1・半角=0.5換算)
export function truncateName(name, maxZen = 8) {
  const s = String(name || "");
  let width = 0;
  let out = "";
  for (const ch of s) {
    const w = ch.charCodeAt(0) <= 0xff ? 0.5 : 1;
    if (width + w > maxZen) return out + "…";
    width += w;
    out += ch;
  }
  return out;
}

// CSV読み書き共通ヘルパー(ホテル・キャスト等のインポート/エクスポートで共用)
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

// CSVファイルを文字コード自動判定で読み込む(UTF-8優先、文字化けを検知したらShift-JISで再デコード)
//  ExcelでCSVを編集・保存するとShift-JIS(cp932)になることが多いため
export function readCSVFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const buf = reader.result;
      const utf8Text = new TextDecoder("utf-8").decode(buf).replace(/^\uFEFF/, "");
      // 文字化け(置換文字U+FFFD)が多く含まれる場合はShift-JISとして読み直す
      const brokenCount = (utf8Text.match(/\uFFFD/g) || []).length;
      if (brokenCount > 0) {
        try {
          const sjisText = new TextDecoder("shift_jis").decode(buf);
          resolve(sjisText);
          return;
        } catch (e) { /* shift_jisデコーダ非対応環境ではUTF-8のまま */ }
      }
      resolve(utf8Text);
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

// キャストのアバター。写真があれば1枚目を表示、無ければ頭文字(タイムテーブルと共通の見た目)
// shape: "circle"(頭文字丸) or "photo"(縦3:4のサムネイル枠)
export function CastAvatar({ cast, photo, size = 30, radius }) {
  const r = radius != null ? radius : "50%";
  const initial = cast?.name ? cast.name[0] : "?";
  if (photo) {
    return <img src={photo} alt={castFullName(cast)} style={{ width: size, height: size, borderRadius: r, objectFit: "cover", flexShrink: 0, display: "block", background: "#EDF0F4" }} />;
  }
  return (
    <div style={{ width: size, height: size, borderRadius: r, background: COLORS.accentBg, color: COLORS.accentDark, display: "flex", alignItems: "center", justifyContent: "center", fontSize: Math.round(size * 0.4), fontWeight: 700, flexShrink: 0 }}>{initial}</div>
  );
}

// ============================================================
// キャスト写真：フル画質は castphotos:<id>、一覧用の軽量サムネは castphotos:<id>:thumb に分離保存
//  サムネはモジュールレベルでキャッシュし、タブを切り替えても再取得しない(チラつき防止)
// ============================================================
const _thumbCache = new Map();   // castId -> dataURL(サムネ) / null(写真なし)
const _thumbInflight = new Map(); // castId -> Promise(取得中の重複防止)
const _thumbSubscribers = new Set(); // 再描画通知用

function _notifyThumbSubscribers() { _thumbSubscribers.forEach((fn) => { try { fn(); } catch (e) {} }); }

// 1件のサムネを取得(キャッシュ優先・取得中は共有)。サムネキーが空なら旧データとしてフル画質から生成
function _fetchThumb(castId) {
  if (_thumbCache.has(castId)) return Promise.resolve(_thumbCache.get(castId));
  if (_thumbInflight.has(castId)) return _thumbInflight.get(castId);
  const p = fetch(`/api/state?key=castphotos:${castId}:thumb`).then((r) => r.json()).then(async (d) => {
    if (d && typeof d.value === "string" && d.value) {
      _thumbCache.set(castId, d.value); _thumbInflight.delete(castId); _notifyThumbSubscribers();
      return d.value;
    }
    // サムネ未生成(旧データ or 空)。フル画質を1回だけ読んでサムネを生成・保存
    try {
      const full = await fetch(`/api/state?key=castphotos:${castId}`).then((r) => r.json());
      const first = Array.isArray(full.value) && full.value[0] ? full.value[0] : null;
      if (first) {
        const thumb = await dataUrlToThumb(first);
        fetch(`/api/state?key=castphotos:${castId}:thumb`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ value: thumb }) }).catch(() => {});
        _thumbCache.set(castId, thumb); _thumbInflight.delete(castId); _notifyThumbSubscribers();
        return thumb;
      }
    } catch (e) {}
    _thumbCache.set(castId, null); _thumbInflight.delete(castId); _notifyThumbSubscribers();
    return null;
  }).catch(() => { _thumbCache.set(castId, null); _thumbInflight.delete(castId); return null; });
  _thumbInflight.set(castId, p);
  return p;
}

// キャッシュを更新(写真の保存・削除時に呼ぶ)
export function setCastThumbCache(castId, thumbDataUrlOrNull) {
  _thumbCache.set(castId, thumbDataUrlOrNull || null);
  _notifyThumbSubscribers();
}

// 一覧・タイムテーブル用：表示中キャストのサムネだけを遅延取得し、一度読んだら保持する
export function useCastThumbs(castIds) {
  const [, force] = useState(0);
  useEffect(() => {
    const rerender = () => force((n) => n + 1);
    _thumbSubscribers.add(rerender);
    return () => { _thumbSubscribers.delete(rerender); };
  }, []);
  const key = (castIds || []).join(",");
  useEffect(() => {
    (castIds || []).forEach((id) => { if (id && !_thumbCache.has(id)) _fetchThumb(id); });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  // キャッシュから現在値を組み立てて返す
  const map = {};
  (castIds || []).forEach((id) => { const v = _thumbCache.get(id); if (v) map[id] = v; });
  return map;
}

// キャストの写真(最大10枚・フル画質)をUpstash(castphotos:<id>)に保存・読込するフック
export function useCastPhotos(castId) {
  const [photos, setPhotos] = useState([]);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    if (!castId) { setPhotos([]); setLoaded(true); return; }
    let cancelled = false;
    setLoaded(false);
    fetch(`/api/state?key=castphotos:${castId}`).then((r) => r.json()).then((d) => {
      if (cancelled) return;
      setPhotos(Array.isArray(d.value) ? d.value : []);
      setLoaded(true);
    }).catch(() => { if (!cancelled) { setPhotos([]); setLoaded(true); } });
    return () => { cancelled = true; };
  }, [castId]);
  const save = async (next, explicitThumb) => {
    setPhotos(next);
    // フル画質を保存
    fetch(`/api/state?key=castphotos:${castId}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ value: next }) }).catch(() => {});
    // サムネ：明示的に渡されたらそれを使う(再処理せず黒化を防ぐ)。無ければ1枚目から生成
    if (next[0]) {
      let thumb = explicitThumb;
      if (!thumb) { try { thumb = await dataUrlToThumb(next[0]); } catch (e) { thumb = next[0]; } }
      fetch(`/api/state?key=castphotos:${castId}:thumb`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ value: thumb }) }).catch(() => {});
      setCastThumbCache(castId, thumb);
    } else {
      fetch(`/api/state?key=castphotos:${castId}:thumb`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ value: "" }) }).catch(() => {});
      setCastThumbCache(castId, null);
    }
  };
  return { photos, setPhotos: save, loaded };
}

// dataURL(フル画質)から一覧用の小さいサムネ(縦3:4・約120x160)を生成
export function dataUrlToThumb(dataUrl, targetW = 120, targetH = 160) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = targetW; canvas.height = targetH;
        const ctx = canvas.getContext("2d");
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(0, 0, targetW, targetH);
        const srcRatio = img.width / img.height;
        const dstRatio = targetW / targetH;
        let sw = img.width, sh = img.height, sx = 0, sy = 0;
        if (srcRatio > dstRatio) { sw = img.height * dstRatio; sx = (img.width - sw) / 2; }
        else { sh = img.width / dstRatio; sy = (img.height - sh) / 2; }
        ctx.drawImage(img, sx, sy, sw, sh, 0, 0, targetW, targetH);
        const out = canvas.toDataURL("image/jpeg", 0.72);
        // 生成に失敗して真っ黒/空になった場合は元画像をそのまま使う
        if (!out || out.length < 200) resolve(dataUrl); else resolve(out);
      } catch (e) { resolve(dataUrl); }
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

// 画像ファイルを縦3:4(シティヘブン準拠)にリサイズ。フル画質とサムネの両方を1回の読み込みで生成
//  ・白背景を敷いてからJPEG化(透過画像の黒つぶれを防止)
//  ・元画像→目的サイズを1段階で描画(二重canvas処理による iOS の黒化を回避)
function _drawSized(img, targetW, targetH, quality) {
  const canvas = document.createElement("canvas");
  canvas.width = targetW; canvas.height = targetH;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(0, 0, targetW, targetH); // 透過部分を白で埋める
  const srcRatio = img.width / img.height;
  const dstRatio = targetW / targetH;
  let sw = img.width, sh = img.height, sx = 0, sy = 0;
  if (srcRatio > dstRatio) { sw = img.height * dstRatio; sx = (img.width - sw) / 2; }
  else { sh = img.width / dstRatio; sy = (img.height - sh) / 2; }
  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, targetW, targetH);
  return canvas.toDataURL("image/jpeg", quality);
}

// フル画質のdataURLを返す(後方互換)。内部で白背景処理済み
export function fileToSizedDataURL(file, targetW = 450, targetH = 600) {
  return fileToPhotoSet(file).then((set) => set.full);
}

// 1枚のファイルから { full(450x600), thumb(120x160) } を生成
export function fileToPhotoSet(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        try {
          const full = _drawSized(img, 450, 600, 0.82);
          const thumb = _drawSized(img, 120, 160, 0.72);
          resolve({ full, thumb });
        } catch (e) { reject(e); }
      };
      img.onerror = reject;
      img.src = reader.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
export function findCast(casts, nameStr) { return casts.find((c) => c.name === nameStr || castFullName(c) === nameStr); }
export function hotelArea(hotel) { for (const [a, list] of Object.entries(HOTELS_BY_AREA)) if (list.includes(hotel)) return a; return "中央区"; }

// ホテル名(または"営業所")から座標を引く(生きたhotelsリスト優先、無ければHOTEL_COORDSにフォールバック)
export function coordForHotelName(name, hotels, office, HOTEL_COORDS) {
  if (!name) return null;
  if (name === "営業所") return office && office.lat != null ? { lat: office.lat, lng: office.lng } : null;
  const h = (hotels || []).find((x) => x.name === name);
  if (h && h.lat != null) return { lat: h.lat, lng: h.lng };
  return (HOTEL_COORDS && HOTEL_COORDS[name]) || null;
}

// ============================================================
// 配車ジョブ(送り・迎え)
//  1予約 = 送りジョブ + 迎えジョブ の2本として扱う
// ============================================================
export const JOB_STATUS = {
  unassigned: { label: "未割当", color: "#C0492B" },
  assigned: { label: "割当済み", color: "#E08A1E" },
  enroute: { label: "向かってます", color: "#2F6DB5" },
  arrived: { label: "到着済み", color: "#3E9C74" },
};

// 本日の予約から「送り」「迎え」ジョブを組み立てる(場所が確定しているもののみ)
export function buildDispatchJobs(reservations, dateStr) {
  const jobs = [];
  reservations
    .filter((r) => r.date === dateStr && r.status !== "キャンセル" && r.hotel && r.hotel !== "-")
    .forEach((r) => {
      jobs.push({
        id: `${r.id}-send`, reservationId: r.id, kind: "send",
        time: r.start, hotel: r.hotel, room: r.room, castId: r.castId, customer: r.customer,
        driverCar: r.sendDriver || "未定", jobStatus: r.sendStatus || (r.sendDriver && r.sendDriver !== "未定" ? "assigned" : "unassigned"),
      });
      jobs.push({
        id: `${r.id}-pick`, reservationId: r.id, kind: "pick",
        time: r.start + r.dur, hotel: r.hotel, room: r.room, castId: r.castId, customer: r.customer,
        driverCar: r.pickDriver || "未定", jobStatus: r.pickStatus || (r.pickDriver && r.pickDriver !== "未定" ? "assigned" : "unassigned"),
      });
    });
  return jobs.sort((a, b) => a.time - b.time);
}

// 指定した車が担当する、本日の未完了ジョブ(到着済み以外)を時刻順で
export function driverQueue(jobs, car) {
  return jobs.filter((j) => j.driverCar === car && j.jobStatus !== "arrived").sort((a, b) => a.time - b.time);
}

// ドライバー一覧・割当ポップアップ用：今どこに向かっているか/待機中ならどこかの表示文言
export function driverLocationLabel(d, jobs) {
  const queue = driverQueue(jobs, d.car);
  const enroute = queue.find((j) => j.jobStatus === "enroute");
  if (enroute) return `→ ${enroute.hotel}へ向かい中`;
  if (d.status === "waiting") return `${d.area || "-"}で待機中`;
  if (queue[0]) return `次: ${fmtHour(queue[0].time)} ${queue[0].hotel}`;
  return d.note || "";
}

// 状態が"dispatch"の時、現在対応中のジョブが送り/迎えどちらかで「送り中」「迎え中」に出し分ける
export function driverStatusLabel(d, jobs) {
  if (d.status !== "dispatch") return DRIVER_STATUS[d.status]?.label || "-";
  const queue = driverQueue(jobs, d.car);
  const active = queue.find((j) => j.jobStatus === "enroute") || queue[0];
  if (!active) return "送迎中";
  return active.kind === "send" ? "送り中" : "迎え中";
}

// 状態ラベルに応じた表示色(送り中=青／迎え中=緑／待機中=グレー／到着済=橙／戻り中=水色)
export function driverStatusColor(label) {
  switch (label) {
    case "送り中": return "#2F6DB5";
    case "迎え中": return "#3E9C74";
    case "待機中": return "#7A8798";
    case "到着済": return "#E08A1E";
    case "戻り中": return "#5C93C4";
    case "送迎中": return "#2F6DB5";
    default: return "#7A8798";
  }
}

// 予約への割当変更(送り/迎え共通)。setReservationsにそのまま渡せる更新関数を返す
export function applyJobAssignment(reservationId, kind, driverCarOrNull) {
  return (prev) => prev.map((r) => {
    if (r.id !== reservationId) return r;
    if (kind === "send") return { ...r, sendDriver: driverCarOrNull || "未定", sendStatus: driverCarOrNull ? "assigned" : "unassigned" };
    return { ...r, pickDriver: driverCarOrNull || "未定", pickStatus: driverCarOrNull ? "assigned" : "unassigned" };
  });
}

// ジョブの状態を進める(割当済み→向かっています→到着済み)。到着時は本体のstatusも連動させる
export function advanceJobStatus(reservationId, kind, nextJobStatus) {
  return (prev) => prev.map((r) => {
    if (r.id !== reservationId) return r;
    const patch = kind === "send" ? { sendStatus: nextJobStatus } : { pickStatus: nextJobStatus };
    if (nextJobStatus === "arrived") {
      if (kind === "send" && (r.status === "受付済" || r.status === "移動中")) patch.status = "接客中";
      if (kind === "pick" && r.status !== "キャンセル") patch.status = "終了";
    } else if (nextJobStatus === "enroute" && kind === "send" && r.status === "受付済") {
      patch.status = "移動中";
    }
    return { ...r, ...patch };
  });
}
export function parseTimeToHour(t) {
  if (!t || t === "-") return null;
  const m = String(t).match(/(\d+):(\d+)/);
  if (!m) return null;
  return Number(m[1]) + Number(m[2]) / 60;
}
// 小数時間(例: 1.6666...)を "1:40" のような表示用文字列に変換
export function fmtHour(h) {
  if (h == null || isNaN(h)) return "-";
  const total = Math.round(h * 60);
  const hh = Math.floor(total / 60) % 24;
  const mm = total % 60;
  return `${hh}:${String(mm).padStart(2, "0")}`;
}
// 10分単位の時間選択肢(12:00〜翌4:50)を生成
export function buildTimeOptions(startHour, endHour) {
  const list = [];
  for (let h = startHour; h <= endHour; h++) {
    for (let m = 0; m < 60; m += 10) {
      if (h === endHour && m > 0) break;
      list.push({ value: h + m / 60, label: `${h % 24}:${String(m).padStart(2, "0")}` });
    }
  }
  return list;
}
export const RESERVATION_TIME_OPTIONS = buildTimeOptions(12, 28);
export function StatCard({ label, value, color, unit }) {
  return (
    <Card>
      <div style={{ color: COLORS.textSub, fontSize: 12 }}>{label}</div>
      <div style={{ fontSize: 22, color: color || COLORS.textMain, marginTop: 6, fontFamily: "'JetBrains Mono', monospace" }}>{value}{unit && <span style={{ fontSize: 13, color: COLORS.textSub }}> {unit}</span>}</div>
    </Card>
  );
}
export function PrimaryButton({ children, onClick, style, disabled }) {
  return <button onClick={onClick} disabled={disabled} style={{ padding: "10px 18px", borderRadius: 8, border: "none", cursor: disabled ? "default" : "pointer", background: disabled ? "#C7D0DB" : COLORS.accent, color: "#FFFFFF", fontWeight: 700, fontSize: 14, ...style }}>{children}</button>;
}
export function TextField({ label, value, onChange, placeholder, type }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <label style={{ display: "block", fontSize: 12, color: COLORS.textSub, marginBottom: 4 }}>{label}</label>
      <input type={type || "text"} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: `1px solid ${COLORS.border}`, background: "#FFFFFF", color: COLORS.textMain, fontSize: 14, boxSizing: "border-box" }} />
    </div>
  );
}
export function SelectField({ label, value, onChange, options, optionLabels }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <label style={{ display: "block", fontSize: 12, color: COLORS.textSub, marginBottom: 4 }}>{label}</label>
      <select value={value} onChange={(e) => onChange(e.target.value)} style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: `1px solid ${COLORS.border}`, background: "#FFFFFF", color: COLORS.textMain, fontSize: 14 }}>
        {options.map((o) => <option key={o} value={o}>{(optionLabels && optionLabels[o]) || o || "未設定"}</option>)}
      </select>
    </div>
  );
}
export function Modal({ title, onClose, children, wide, maxwidth }) {
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(15,23,35,0.45)", zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: "#FFFFFF", borderRadius: 16, width: "100%", maxWidth: maxwidth || (wide ? 560 : 460), maxHeight: "88vh", overflowY: "auto", boxShadow: "0 12px 40px rgba(0,0,0,0.3)" }}>
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
// サーバー保存フック(Upstash経由・/api/state)
// ============================================================
export function usePersistedState(key, initialValue) {
  const [value, setValue] = useState(initialValue);
  const [loaded, setLoaded] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/state?key=${key}`)
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return;
        if (d && d.value !== null && d.value !== undefined) setValue(d.value);
      })
      .catch(() => { if (!cancelled) setErr("読み込みに失敗しました(初期データで表示中)"); })
      .finally(() => { if (!cancelled) setLoaded(true); });
    return () => { cancelled = true; };
  }, [key]);

  useEffect(() => {
    if (!loaded) return;
    fetch(`/api/state?key=${key}`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ value }),
    }).then((r) => { if (!r.ok) throw new Error("save-failed"); setErr(""); })
      .catch(() => setErr("保存に失敗しました"));
  }, [value, loaded, key]);

  return [value, setValue, { loaded, err }];
}

// 予約データ専用：日付ごと(kanri:reservations:YYYY-MM-DD)に分けて保存・読込
// (1日分ずつなので1リクエストが軽く、10日分でも安全に保存できる)
export function usePersistedReservations(dayDates, initialAll) {
  const isoList = dayDates.map(isoDate);
  const [reservations, setReservations] = useState(initialAll);
  const [loaded, setLoaded] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    let cancelled = false;
    Promise.all(isoList.map((d) => fetch(`/api/state?key=reservations:${d}`).then((r) => r.json()).catch(() => null)))
      .then((results) => {
        if (cancelled) return;
        const merged = [];
        results.forEach((res, i) => {
          const d = isoList[i];
          if (res && Array.isArray(res.value) && res.value.length > 0) merged.push(...res.value);
          else merged.push(...initialAll.filter((r) => r.date === d));
        });
        setReservations(merged);
      })
      .catch(() => { if (!cancelled) setErr("読み込みに失敗しました(初期データで表示中)"); })
      .finally(() => { if (!cancelled) setLoaded(true); });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!loaded) return;
    const byDate = {};
    isoList.forEach((d) => { byDate[d] = []; });
    reservations.forEach((r) => { if (!byDate[r.date]) byDate[r.date] = []; byDate[r.date].push(r); });
    Promise.all(Object.entries(byDate).map(([d, list]) =>
      fetch(`/api/state?key=reservations:${d}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ value: list }) })
    )).then((results) => {
      if (results.every((r) => r.ok)) setErr(""); else setErr("一部の保存に失敗しました");
    }).catch(() => setErr("保存に失敗しました"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reservations, loaded]);

  return [reservations, setReservations, { loaded, err }];
}

// ============================================================
// メッセージ機能(本部⇔スタッフ／本部⇔キャスト の1対1チャット)
//  1メッセージ = { id, from: "office"|"user", text, ts, readByOffice, readByUser }
//  スレッドキー: "staff_<driverId>" / "cast_<castId>"
//  Upstashキー: messages:<threadId>
// ============================================================
export function staffThreadId(driverId) { return `staff_${driverId}`; }
export function castThreadId(castId) { return `cast_${castId}`; }

export async function fetchThread(threadId) {
  try {
    const r = await fetch(`/api/state?key=messages:${threadId}`);
    const d = await r.json();
    return Array.isArray(d.value) ? d.value : [];
  } catch (e) { return []; }
}

export async function saveThread(threadId, messages) {
  try {
    await fetch(`/api/state?key=messages:${threadId}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ value: messages }) });
  } catch (e) {}
}

// 新規メッセージを1件追加して保存する(from: "office" | "user")
export async function sendMessage(threadId, messages, from, text) {
  const msg = {
    id: `m${Date.now()}${Math.floor(Math.random() * 1000)}`,
    from, text, ts: new Date().toISOString(),
    readByOffice: from === "office", // 本部が送った時点で本部側は既読
    readByUser: from === "user",     // 本人が送った時点で本人側は既読
  };
  const next = [...messages, msg];
  await saveThread(threadId, next);
  return next;
}

// 未読件数(視点="office"なら相手からのreadByOffice=falseを数える。視点="user"ならreadByUser=falseを数える)
export function unreadCount(messages, viewpoint) {
  const key = viewpoint === "office" ? "readByOffice" : "readByUser";
  return (messages || []).filter((m) => !m[key]).length;
}

// 指定視点で全メッセージを既読にする
export async function markThreadRead(threadId, messages, viewpoint) {
  const key = viewpoint === "office" ? "readByOffice" : "readByUser";
  const next = messages.map((m) => ({ ...m, [key]: true }));
  await saveThread(threadId, next);
  return next;
}

// 受付表データを取得する共通ヘルパー(管理画面・ポータル閲覧で共用)
export async function fetchUketsukeSheet(sheetKey, dateStr) {
  try {
    const r = await fetch(`/api/state?key=uketsuke:${sheetKey}:${dateStr}`);
    const d = await r.json();
    return (d && d.value && d.value.rows) ? d.value : null;
  } catch (e) { return null; }
}
