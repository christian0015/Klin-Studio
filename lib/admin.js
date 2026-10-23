// Logique métier admin : projets, médias, demandes, textes, emails, sons, maintenance
import { revalidatePath } from "next/cache";
import { db, Project, Booking, Failed, Setting, Mail } from "./db";
import { T, flat, describe } from "./content";
import { MAX, validate, removeMedia, purge, sign, health } from "./media";
import { sendRaw, site } from "./mail";
import { renderMail } from "./mailtpl";
import { parseRecipients, prettyTitle } from "./options";
import { clean } from "./security";
import { sanitizeHtml } from "./sanitize";
const slugify = s => clean(s, 80).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const L = o => ({ fr: clean(o?.fr, 6000), en: clean(o?.en, 6000) });
function shape(d) {
  const media = (Array.isArray(d.media) ? d.media : []).slice(0, MAX).map(m => ({ publicId: clean(m.publicId, 200), url: clean(m.url, 500), type: m.type === "video" ? "video" : "image" }));
  return { slug: slugify(d.slug || d.title?.fr || d.title?.en), title: L(d.title), summary: L(d.summary), body: { fr: sanitizeHtml(d.body?.fr), en: sanitizeHtml(d.body?.en) }, role: L(d.role), context: L(d.context), challenge: L(d.challenge), solution: L(d.solution), result: L(d.result),
    url: clean(d.url, 300), origin: d.origin === "client" ? "client" : "personal", published: d.published !== false, featured: !!d.featured, order: +d.order || 0, media };
}
export async function handle(resource, method, req) {
  await db();
  if (resource === "projects") {
    if (method === "GET") return Project.find().sort({ order: 1 }).lean();
    const d = await req.json();
    if (method === "POST") { const s = shape(d); if ((d.media || []).length > MAX) throw new Error(`max ${MAX}`); const p = await Project.create(s); await validate(s.media); revalidatePath("/", "layout"); return p; }
    const old = await Project.findById(d._id); if (!old) throw new Error("not found");
    if (method === "PUT") {
      const s = shape(d), keep = new Set(s.media.map(m => m.publicId));
      const errors = await removeMedia(old.media.filter(m => !keep.has(m.publicId))); // média retiré = fichier supprimé
      Object.assign(old, s); await old.save(); await validate(s.media); revalidatePath("/", "layout"); return { ok: true, errors };
    }
    if (method === "DELETE") { const errors = await removeMedia(old.media); await old.deleteOne(); revalidatePath("/", "layout"); return { ok: true, errors }; }
  }
  if (resource === "upload" && method === "DELETE") { // formulaire abandonné : on supprime le fichier non enregistré
    const { publicId, type } = await req.json();
    if (await Project.exists({ "media.publicId": publicId })) return { ok: true, kept: true };
    return { ok: true, errors: await removeMedia([{ publicId, type }]) };
  }
  if (resource === "sign") { const { kind } = await req.json(); return sign(kind === "sound" ? "sound" : "media"); }
  if (resource === "sounds") { // musiques de l'intro (jamais purgées)
    const cur = async () => (await Setting.findOne({ key: "sounds" }).lean())?.value || [], save = async l => { await Setting.findOneAndUpdate({ key: "sounds" }, { value: l }, { upsert: true }); revalidatePath("/", "layout"); return l; };
    if (method === "GET") return cur();
    const d = await req.json();
    if (method === "POST") { if (!String(d.url || "").startsWith(`https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/`) || !d.publicId) throw new Error("invalid"); return save([...(await cur()), { publicId: clean(d.publicId, 200), url: clean(d.url, 500), name: clean(d.name, 80), title: clean(d.title || prettyTitle(d.name), 80) }].slice(0, 20)); }
    if (method === "PATCH") { const l = await cur(), i = l.findIndex(x => x.publicId === d.publicId); if (i < 0) throw new Error("not found"); l[i] = { ...l[i], title: clean(d.title, 80) }; return save(l); }
    if (method === "DELETE") { const l = await cur(); if (!l.some(x => x.publicId === d.publicId)) throw new Error("not found"); const errors = await removeMedia([{ publicId: d.publicId, type: "video" }]); return { errors, list: await save(l.filter(x => x.publicId !== d.publicId)) }; }
  }
  if (resource === "bookings") {
    if (method === "GET") return Booking.find().sort({ createdAt: -1 }).limit(300).lean();
    const d = await req.json();
    if (method === "DELETE") { await Booking.findByIdAndDelete(d._id); return { ok: true }; }
    if (!["pending", "confirmed", "declined", "archived"].includes(d.status)) throw new Error("status");
    const b = await Booking.findByIdAndUpdate(d._id, { status: d.status }, { new: true });
    if (d.notify && b && ["confirmed", "declined"].includes(d.status)) { // email client au gabarit Klin Studio
      const fr = b.lang === "fr", ok = d.status === "confirmed";
      const subject = ok ? (fr ? "Votre demande est acceptée" : "Your request is accepted") : (fr ? "À propos de votre demande" : "About your request");
      const body = ok ? (fr ? "Bonjour {{prenom}},\n\nNous confirmons votre demande. Nous revenons vers vous pour fixer le créneau.\n\nÀ très vite,\nChristian\nKlin Studio" : "Hello {{name}},\n\nWe confirm your request. We will get back to you to set the slot.\n\nSpeak soon,\nChristian\nKlin Studio")
        : (fr ? "Bonjour {{prenom}},\n\nMerci pour votre intérêt. Nous ne pouvons malheureusement pas donner suite pour le moment.\n\nBien cordialement,\nChristian\nKlin Studio" : "Hello {{name}},\n\nThank you for your interest. Unfortunately we cannot proceed at the moment.\n\nBest regards,\nChristian\nKlin Studio");
      await sendRaw(b.email, subject, renderMail({ lang: b.lang, name: b.name, title: subject, body, site: site() })); await Mail.create({ to: b.email, subject, body, ok: true, bookingId: String(b._id) });
    }
    return { ok: true };
  }
  if (resource === "mail") { // envoi individuel par destinataire (max 30), gabarit Klin Studio, {{prenom}} personnalisé
    if (method === "GET") return Mail.find().sort({ createdAt: -1 }).limit(100).lean();
    const d = await req.json(), list = parseRecipients(d.recipients).slice(0, 30);
    if (!list.length) throw new Error("Aucun destinataire valide");
    const subject = clean(d.subject, 200), title = clean(d.title, 200), body = clean(d.body, 8000), lang = d.lang === "en" ? "en" : "fr";
    if (!subject || !body) throw new Error("Objet et message requis");
    let sent = 0; const failed = [];
    for (const r of list) {
      try { await sendRaw(r.email, subject, renderMail({ lang, title, body, preheader: clean(d.preheader, 200), name: r.name, site: site() })); sent++; await Mail.create({ to: r.email, subject, body, ok: true, bookingId: clean(d.bookingId, 40) }); }
      catch (e) { failed.push(r.email); await Mail.create({ to: r.email, subject, body, ok: false, error: String(e.message).slice(0, 200) }); }
    }
    return { sent, failed };
  }
  if (resource === "texts") { // textes FR/EN : valeurs de base + surcharges, classés par section
    const over = (await Setting.findOne({ key: "texts" }).lean())?.value || {}, fr = flat(T.fr), en = flat(T.en);
    if (method === "GET") return Object.keys(fr).filter(k => !k.endsWith(".art")).map(k => ({ k, ...describe(k), fr: over[k]?.fr || fr[k], en: over[k]?.en || en[k], baseFr: fr[k], baseEn: en[k] }));
    const { values } = await req.json(), out = {};
    for (const [k, v] of Object.entries(values || {})) if (k in fr) { const f = clean(v.fr, 3000), e = clean(v.en, 3000); if ((f && f !== fr[k]) || (e && e !== en[k])) out[k] = { fr: f, en: e }; }
    await Setting.findOneAndUpdate({ key: "texts" }, { value: out }, { upsert: true }); revalidatePath("/", "layout"); return { ok: true, count: Object.keys(out).length };
  }
  if (resource === "health") return health();
  if (resource === "purge") return { ...(await purge()), failed: await Failed.countDocuments() };
  throw new Error("unknown");
}
