import { createBooking } from "@/lib/booking";
import { db, Booking } from "@/lib/db";
import { limit, sameOrigin, json } from "@/lib/security";
export async function GET(req) { // créneaux déjà pris (aucune donnée personnelle)
  if (!limit(req, "bkget", 40)) return json({ taken: [] }, 429);
  try { await db(); const rows = await Booking.find({ status: { $in: ["pending", "confirmed"] }, slot: /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/ }).select("slot").lean(); return json({ taken: rows.map(r => r.slot) }); } catch { return json({ taken: [] }); }
}
export async function POST(req) {
  if (!sameOrigin(req)) return json({ ok: false }, 403);
  if (!limit(req, "bk", 5, 600000)) return json({ ok: false, error: "rate" }, 429);
  try { const r = await createBooking(await req.json()); return json(r, r.ok ? 200 : r.error === "slot_taken" ? 409 : 400); } catch { return json({ ok: false }, 500); }
}
