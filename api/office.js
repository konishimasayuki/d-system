// api/office.js
// 営業所(出発・戻りポイント)の取得(GET)・保存(POST)。
const REST_URL = process.env.UPSTASH_REDIS_REST_URL;
const REST_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;
const KEY = "kanri:office";

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
  try {
    if (req.method === "GET") {
      const office = await kvGet(KEY);
      res.status(200).json({ office: office || null });
    } else if (req.method === "POST") {
      const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
      const office = body?.office;
      if (!office || typeof office !== "object") { res.status(400).json({ error: "office オブジェクトが必要です" }); return; }
      await kvSet(KEY, office);
      res.status(200).json({ ok: true });
    } else {
      res.status(405).json({ error: "method not allowed" });
    }
  } catch (e) {
    res.status(500).json({ error: String(e.message || e) });
  }
}
