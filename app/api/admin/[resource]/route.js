import { isAdmin } from "@/lib/auth";
import { handle } from "@/lib/admin";
import { limit, sameOrigin, json } from "@/lib/security";
async function run(req, { params }, method) {
  const { resource } = await params;
  const cron = resource === "purge" && req.headers.get("authorization") === `Bearer ${process.env.CRON_SECRET}` && process.env.CRON_SECRET;
  if (!cron) { if (method !== "GET" && !sameOrigin(req)) return json({ error: "origin" }, 403); if (!(await isAdmin())) return json({ error: "auth" }, 401); }
  if (!limit(req, "adm", 120)) return json({ error: "rate" }, 429);
  try { return json(await handle(resource, cron ? "POST" : method, req)); } catch (e) { return json({ error: String(e.message) }, 400); }
}
export const GET = (r, c) => run(r, c, "GET");
export const POST = (r, c) => run(r, c, "POST");
export const PUT = (r, c) => run(r, c, "PUT");
export const PATCH = (r, c) => run(r, c, "PATCH");
export const DELETE = (r, c) => run(r, c, "DELETE");
