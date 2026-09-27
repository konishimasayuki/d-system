// api/push.js
// Web Push(バックグラウンドでも届く通知)用のエンドポイント。
// POST { action: "subscribe", threadId, subscription }  → 端末の購読情報を保存
// POST { action: "unsubscribe", threadId, endpoint }     → 購読解除
// POST { action: "send", threadId, title, body, url }    → そのスレッドの端末に通知を送る
// 必要な環境変数: UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN / VAPID_PRIVATE_KEY
import webpush from "web-push";

const REST_URL = process.env.UPSTASH_REDIS_REST_URL;
const REST_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;
const VAPID_PUBLIC = "BB9R8rnyYiCNjcY2YmPBjR8kp07ws69-RTU_f7YbT9pfzJC36h7peIFSfBkBtj5SCJzKwXBV3oPDaL1dMHV3ljM";
const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY;
const THREAD_RE = /^(staff|cast)_[A-Za-z0-9_]+$/;

async function kvGet(key) {
  const r = await fetch(`${REST_URL}/get/${encodeURIComponent(key)}`, { headers: { Authorization: `Bearer ${REST_TOKEN}` } });
  if (!r.ok) throw new Error("kv-get-failed");
  const d = await r.json();
  return d.result ? JSON.parse(d.result) : null;
}
async function kvSet(key, value) {
  const r = await fetch(`${REST_URL}/set/${encodeURIComponent(key)}`, {
    method: "POST", headers: { Authorization: `Bearer ${REST_TOKEN}`, "Content-Type": "text/plain" }, body: JSON.stringify(value),
  });
  if (!r.ok) throw new Error("kv-set-failed");
}

export default async function handler(req, res) {
  if (req.method !== "POST") { res.status(405).json({ error: "method not allowed" }); return; }
  const body = typeof req.body === "string" ? JSON.parse(req.body) : (req.body || {});
  const { action, threadId } = body;
  if (!threadId || !THREAD_RE.test(threadId)) { res.status(400).json({ error: "threadIdが不正です" }); return; }
  const key = `kanri:push:${threadId}`;
  try {
    const list = (await kvGet(key)) || [];
    if (action === "subscribe") {
      const sub = body.subscription;
      if (!sub || !sub.endpoint) { res.status(400).json({ error: "subscriptionが必要です" }); return; }
      const next = [...list.filter((s) => s.endpoint !== sub.endpoint), sub].slice(-5); // 1人あたり最大5端末
      await kvSet(key, next);
      res.status(200).json({ ok: true });
    } else if (action === "unsubscribe") {
      await kvSet(key, list.filter((s) => s.endpoint !== body.endpoint));
      res.status(200).json({ ok: true });
    } else if (action === "send") {
      if (!VAPID_PRIVATE) { res.status(500).json({ error: "VAPID_PRIVATE_KEYが未設定です" }); return; }
      if (list.length === 0) { res.status(200).json({ ok: true, sent: 0 }); return; }
      webpush.setVapidDetails("mailto:admin@d-system.app", VAPID_PUBLIC, VAPID_PRIVATE);
      const payload = JSON.stringify({ title: body.title || "新着メッセージ", body: body.body || "", url: body.url || "/" });
      const alive = [];
      let sent = 0;
      for (const s of list) {
        try { await webpush.sendNotification(s, payload); alive.push(s); sent++; }
        catch (e) { if (e.statusCode !== 404 && e.statusCode !== 410) alive.push(s); } // 無効になった端末だけ削除
      }
      if (alive.length !== list.length) await kvSet(key, alive);
      res.status(200).json({ ok: true, sent });
    } else {
      res.status(400).json({ error: "actionが不正です" });
    }
  } catch (e) {
    res.status(500).json({ error: String(e.message || e) });
  }
}
