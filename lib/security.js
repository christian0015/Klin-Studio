// Limite de débit (mémoire d'instance), assainissement, contrôle d'origine, JSON sans cache
const hits = new Map();
export function limit(req, key, max, win = 60000) {
  const ip = (req.headers.get("x-forwarded-for") || "local").split(",")[0].trim(), k = key + ip, now = Date.now();
  const a = (hits.get(k) || []).filter(t => now - t < win); a.push(now); hits.set(k, a); return a.length <= max;
}
export const clean = (s, n = 500) => String(s ?? "").replace(/[<>]/g, "").trim().slice(0, n);
export function sameOrigin(req) { const o = req.headers.get("origin"); return !o || new URL(o).host === req.headers.get("host"); }
export const json = (d, status = 200) => Response.json(d, { status, headers: { "Cache-Control": "no-store" } });
