// ============================================================
// Google Maps JS API 共通ローダー
//  環境変数 VITE_GOOGLE_MAPS_API_KEY からキーを読み込み、
//  スクリプトを一度だけ挿入する。
// ============================================================

let mapsPromise = null;

export function loadGoogleMaps() {
  if (typeof window === "undefined") return Promise.reject(new Error("no-window"));
  if (window.google && window.google.maps) return Promise.resolve(window.google.maps);
  if (mapsPromise) return mapsPromise;

  const key = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  mapsPromise = new Promise((resolve, reject) => {
    if (!key) { reject(new Error("no-key")); return; }
    const cbName = "__gmapsReady__";
    window[cbName] = () => resolve(window.google.maps);
    const s = document.createElement("script");
    s.src = `https://maps.googleapis.com/maps/api/js?key=${key}&callback=${cbName}&language=ja&region=JP`;
    s.async = true;
    s.defer = true;
    s.onerror = () => reject(new Error("load-failed"));
    document.head.appendChild(s);
  });
  return mapsPromise;
}

// 営業所（デモ用・福岡中心付近）
export const OFFICE_LATLNG = { lat: 33.5902, lng: 130.4017 };

// ホテル座標（デモ用の概算。実店舗では実住所→座標に差し替え）
export const HOTEL_COORDS = {
  "天神プラザホテル": { lat: 33.5914, lng: 130.3990 },
  "中央グランドイン": { lat: 33.5850, lng: 130.4017 },
  "西鉄シティホテル": { lat: 33.5896, lng: 130.3986 },
  "博多ベイサイドホテル": { lat: 33.6050, lng: 130.4100 },
  "東区パークホテル": { lat: 33.6200, lng: 130.4200 },
  "博多エクセルホテル": { lat: 33.5900, lng: 130.4200 },
  "博多ステーションイン": { lat: 33.5895, lng: 130.4205 },
  "南区シティホテル": { lat: 33.5600, lng: 130.4250 },
  "大橋ステーションイン": { lat: 33.5620, lng: 130.4260 },
};
