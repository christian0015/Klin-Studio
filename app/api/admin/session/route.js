import { checkLogin, setSession, clearSession } from "@/lib/auth";
import { limit, sameOrigin, json } from "@/lib/security";
export async function POST(req) {
  if (!sameOrigin(req)) return json({ error: "origin" }, 403);
  if (!limit(req, "login", 5, 600000)) return json({ error: "rate" }, 429);
  const { username, password } = await req.json().catch(() => ({}));
  if (!checkLogin(username, password)) return json({ error: "credentials" }, 401);
  await setSession(); return json({ ok: true });
}
export async function DELETE() { await clearSession(); return json({ ok: true }); }
