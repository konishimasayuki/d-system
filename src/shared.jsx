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

export const ROLES = ["オーナー", "統括部長", "店長", "主任", "内勤スタッフ", "ドライバー"];

// 役割別ビュー(阿修羅「全員参加」思想)
export const VIEW_ROLES = {
  owner: { label: "経営者", tabs: ["dashboard", "timetable", "shift", "castlist", "reservation", "dispatch", "customer", "media", "report", "accounting", "payout", "std", "settings"] },
  operator: { label: "オペレーター", tabs: ["dashboard", "timetable", "shift", "castlist", "reservation", "dispatch", "customer", "media"] },
  driver: { label: "ドライバー", tabs: ["driverpage"] },
  cast: { label: "キャスト", tabs: ["mypage"] },
  accountant: { label: "経理", tabs: ["report", "accounting", "payout"] },
};

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

export const INITIAL_COURSES = [
  { id: "co1", name: "60分コース", price: 18000 },
  { id: "co2", name: "90分コース", price: 21000 },
  { id: "co3", name: "120分コース", price: 28000 },
];
export const INITIAL_OPTIONS = [
  { id: "op1", name: "指名", price: 2000 },
  { id: "op2", name: "本指名", price: 3000 },
  { id: "op3", name: "延長30分", price: 9000 },
  { id: "op4", name: "コスプレ", price: 3000 },
  { id: "op5", name: "ロングコース", price: 5000 },
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
      okOptions, comment: "",
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
        const course = dur >= 2 ? INITIAL_COURSES[2] : dur >= 1.5 ? INITIAL_COURSES[1] : INITIAL_COURSES[0];
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

const DRIVER_NAME_POOL = ["佃", "森", "野口", "堤", "本田", "川島", "浜田", "秋山", "宮下", "北村", "西田", "岡崎", "藤井", "村上", "松岡", "橋本", "三浦", "内田", "石田", "菅原"];
const DRIVER_LOGIN_POOL = ["tsukuda", "mori", "noguchi", "tsutsumi", "honda", "kawashima", "hamada", "akiyama", "miyashita", "kitamura", "nishida", "okazaki", "fujii", "murakami", "matsuoka", "hashimoto", "miura", "uchida", "ishida", "sugawara"];
// 福岡市内に大まかに散らした待機座標(営業所周辺〜各区)。DRIVER_AREASと対応
const DRIVER_SPOTS = [
  { lat: 33.5914, lng: 130.3990 }, { lat: 33.6050, lng: 130.4100 }, { lat: 33.5896, lng: 130.4050 }, { lat: 33.5700, lng: 130.4200 },
  { lat: 33.5805, lng: 130.4225 }, { lat: 33.5930, lng: 130.4060 }, { lat: 33.5850, lng: 130.4017 }, { lat: 33.6200, lng: 130.4300 },
  { lat: 33.5620, lng: 130.4260 }, { lat: 33.5945, lng: 130.4050 }, { lat: 33.5860, lng: 130.4010 }, { lat: 33.5920, lng: 130.4130 },
  { lat: 33.5680, lng: 130.4180 }, { lat: 33.5895, lng: 130.4205 }, { lat: 33.5900, lng: 130.4200 }, { lat: 33.5750, lng: 130.3950 },
  { lat: 33.6000, lng: 130.4250 }, { lat: 33.5830, lng: 130.4100 }, { lat: 33.5650, lng: 130.4050 }, { lat: 33.5980, lng: 130.3980 },
];
const DRIVER_AREAS = ["中央区", "東区", "博多区", "南区", "中央区", "博多区", "中央区", "東区", "南区", "博多区", "中央区", "博多区", "南区", "博多区", "博多区", "早良区", "東区", "中央区", "南区", "早良区"];
export function generateDrivers() {
  return DRIVER_NAME_POOL.map((name, i) => {
    const area = DRIVER_AREAS[i % DRIVER_AREAS.length];
    return {
      id: `d${i + 1}`, name, car: `${i + 1}号車`, status: "waiting", area,
      pos: { x: 20 + (i * 11) % 60, y: 20 + (i * 17) % 60 },
      latlng: DRIVER_SPOTS[i % DRIVER_SPOTS.length],
      dest: null, note: `${area}で待機中`,
      wage: 1250 + (i % 3) * 25, hours: 5 + (i % 4),
      loginId: DRIVER_LOGIN_POOL[i], password: "pass1234",
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

export const INITIAL_CUSTOMERS = [
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

export const INITIAL_STAFF = [
  { id: "s1", name: "近藤", role: "オーナー", loginId: "kondo", password: "pass1234" },
  { id: "s2", name: "白石", role: "店長", loginId: "shiraishi", password: "pass1234" },
  { id: "s3", name: "大西", role: "内勤スタッフ", loginId: "onishi", password: "pass1234" },
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
export function Yen({ value }) { return <span style={{ fontFamily: "'JetBrains Mono', monospace" }}>¥{value.toLocaleString()}</span>; }
export function AreaHotel({ area, hotel }) { if (area === "-" || !area) return <span>-</span>; return <span>{area}{hotel ? ` ・ ${hotel}` : ""}</span>; }
export function castFullName(c) { if (!c) return "未割当"; return c.name || ""; }

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
  const save = async (next) => {
    setPhotos(next);
    // フル画質を保存
    fetch(`/api/state?key=castphotos:${castId}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ value: next }) }).catch(() => {});
    // 1枚目から軽量サムネを作って別キーに保存＋キャッシュ更新(一覧を軽くする)
    if (next[0]) {
      try {
        const thumb = await dataUrlToThumb(next[0]);
        fetch(`/api/state?key=castphotos:${castId}:thumb`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ value: thumb }) }).catch(() => {});
        setCastThumbCache(castId, thumb);
      } catch (e) { setCastThumbCache(castId, next[0]); }
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
      const canvas = document.createElement("canvas");
      canvas.width = targetW; canvas.height = targetH;
      const ctx = canvas.getContext("2d");
      const srcRatio = img.width / img.height;
      const dstRatio = targetW / targetH;
      let sw = img.width, sh = img.height, sx = 0, sy = 0;
      if (srcRatio > dstRatio) { sw = img.height * dstRatio; sx = (img.width - sw) / 2; }
      else { sh = img.width / dstRatio; sy = (img.height - sh) / 2; }
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, targetW, targetH);
      resolve(canvas.toDataURL("image/jpeg", 0.72));
    };
    img.onerror = reject;
    img.src = dataUrl;
  });
}

// 画像ファイルを縦3:4(シティヘブン準拠)にリサイズしdataURL化(保存容量を抑える)
export function fileToSizedDataURL(file, targetW = 450, targetH = 600) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = targetW; canvas.height = targetH;
        const ctx = canvas.getContext("2d");
        // 中央クロップで3:4に収める
        const srcRatio = img.width / img.height;
        const dstRatio = targetW / targetH;
        let sw = img.width, sh = img.height, sx = 0, sy = 0;
        if (srcRatio > dstRatio) { sw = img.height * dstRatio; sx = (img.width - sw) / 2; }
        else { sh = img.width / dstRatio; sy = (img.height - sh) / 2; }
        ctx.drawImage(img, sx, sy, sw, sh, 0, 0, targetW, targetH);
        resolve(canvas.toDataURL("image/jpeg", 0.82));
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
export function SelectField({ label, value, onChange, options }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <label style={{ display: "block", fontSize: 12, color: COLORS.textSub, marginBottom: 4 }}>{label}</label>
      <select value={value} onChange={(e) => onChange(e.target.value)} style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: `1px solid ${COLORS.border}`, background: "#FFFFFF", color: COLORS.textMain, fontSize: 14 }}>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
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
