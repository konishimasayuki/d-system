// api/state.js
// 管理システムの各種データを保存・取得する汎用エンドポイント。
// GET  /api/state?key=hotels        → { value }
// POST /api/state?key=hotels  body:{ value } → 保存
//
// 許可されたキーのみ受け付ける。Upstash上は "kanri:<key>" として保存される。
const REST_URL = process.env.UPSTASH_REDIS_REST_URL;
const REST_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

const ALLOWED_KEYS = [
  "hotels", "office", "casts", "customers", "drivers",
  "staff", "courses", "options", "expenses",
];
const RESERVATION_KEY_RE = /^reservations:\d{4}-\d{2}-\d{2}$/;
function isAllowedKey(key) {
  return ALLOWED_KEYS.includes(key) || RESERVATION_KEY_RE.test(key);
}

async function kvGet(key) {
  const r = await fetch(`${REST_URL}/get/${encodeURIComponent(key)}`, {
    headers: { Authorization: `Bearer ${REST_TOKEN}` },
  });
  if (!r.ok) throw new Error("kv-get-failed");
  const data = await r.json();
  return data.result ? JSON.parse(data.result) : null;
}

async function kvSet(key, value) {
  const r = await fetch(`${REST_URL}/set/${encodeURIComponent(key)}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${REST_TOKEN}`, "Content-Type": "text/plain" },
    body: JSON.stringify(value),
  });
  if (!r.ok) throw new Error("kv-set-failed");
}

export default async function handler(req, res) {
  if (!REST_URL || !REST_TOKEN) {
    res.status(500).json({ error: "Upstash環境変数が未設定です（UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN）" });
    return;
  }
  const key = req.query?.key;
  if (!key || !isAllowedKey(key)) {
    res.status(400).json({ error: `keyが不正です。許可されたキー: ${ALLOWED_KEYS.join(", ")}, reservations:YYYY-MM-DD` });
    return;
  }
  const redisKey = `kanri:${key}`;
  try {
    if (req.method === "GET") {
      const value = await kvGet(redisKey);
      res.status(200).json({ value });
    } else if (req.method === "POST") {
      const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
      if (!("value" in (body || {}))) { res.status(400).json({ error: "value が必要です" }); return; }
      await kvSet(redisKey, body.value);
      res.status(200).json({ ok: true });
    } else {
      res.status(405).json({ error: "method not allowed" });
    }
  } catch (e) {
    res.status(500).json({ error: String(e.message || e) });
  }
}
