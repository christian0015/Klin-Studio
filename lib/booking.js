// Validation serveur, honeypot, créneau (jour ouvré, horaire proposé, non déjà pris), enregistrement et emails
import { db, Booking } from "./db";
import { clean } from "./security";
import { bookingMails } from "./mail";
import { OPT, SLOTS } from "./options";
const pick = (k, v, def) => (OPT[k].some(o => o[0] === v) ? v : def);
export async function createBooking(d) {
  if (d.website) return { ok: true }; // honeypot : on fait semblant
  const email = clean(d.email, 150), phone = clean(d.phone, 30).replace(/[^\d+\s().-]/g, ""), digits = phone.replace(/\D/g, ""), slot = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(d.slot || "") ? d.slot : "";
  const okMail = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email), okPhone = digits.length >= 6;
  const b = { name: clean(d.name, 100), email: okMail ? email : "", phone: okPhone ? phone : "", whatsapp: okPhone && d.whatsapp === "yes", type: pick("type", d.type, "other"), sector: pick("sector", d.sector, "other"), budget: pick("budget", d.budget, "tbd"), deadline: pick("deadline", d.deadline, "flex"), slot, message: clean(d.message, 2000), lang: d.lang === "en" ? "en" : "fr" };
  if (b.name.length < 2 || (!okMail && !okPhone)) return { ok: false, error: "invalid" };
  await db();
  if (slot) {
    const dt = new Date(slot + ":00Z"), wd = dt.getUTCDay();
    if (isNaN(dt) || wd === 0 || wd === 6 || !SLOTS.includes(slot.slice(11)) || dt < new Date(Date.now() - 864e5)) return { ok: false, error: "invalid" };
    if (await Booking.exists({ slot, status: { $in: ["pending", "confirmed"] } })) return { ok: false, error: "slot_taken" };
  }
  await Booking.create(b);
  try { await bookingMails(b); } catch (e) { console.error("mail", e.message); }
  return { ok: true };
}
