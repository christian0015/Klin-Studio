// Cloudinary : envoi (tag "pending" tant que non validé), suppression rejouable, limite 10, purge des orphelins
import { v2 as c } from "cloudinary";
import { db, Project, Failed } from "./db";
export const MAX = 10;
c.config({ cloud_name: process.env.CLOUDINARY_CLOUD_NAME, api_key: process.env.CLOUDINARY_API_KEY, api_secret: process.env.CLOUDINARY_API_SECRET });
const rt = t => (t === "video" ? "video" : "image");

export function upload(file) {
  return file.arrayBuffer().then(ab => new Promise((res, rej) =>
    c.uploader.upload_stream({ folder: "klin-studio/projects", resource_type: "auto", tags: ["klin-studio-media", "pending"] }, (e, r) => e ? rej(e) :
      res({ publicId: r.public_id, url: r.secure_url, type: r.resource_type === "video" ? "video" : "image" })).end(Buffer.from(ab))));
}
export async function validate(items) { // médias enregistrés : on retire le tag pending
  for (const t of ["image", "video"]) { const ids = items.filter(i => rt(i.type) === t).map(i => i.publicId); if (ids.length) await c.uploader.remove_tag("pending", ids, { resource_type: t }).catch(() => {}); }
}
export async function removeMedia(items) { // erreurs visibles et rejouables via Failed
  const errors = [];
  for (const i of items) try { await c.uploader.destroy(i.publicId, { resource_type: rt(i.type), invalidate: true }); }
  catch (e) { errors.push(i.publicId); await Failed.create({ publicId: i.publicId, type: rt(i.type), error: String(e.message || e) }); }
  return errors;
}
export async function replay() {
  const f = await Failed.find(), still = [];
  for (const x of f) try { await c.uploader.destroy(x.publicId, { resource_type: x.type }); await x.deleteOne(); } catch (e) { still.push(x.publicId); }
  return still;
}
export async function purge() { // médias taggués « klin-studio-media » non référencés en base depuis plus d'1 h
  await db();
  const used = new Set((await Project.find().lean()).flatMap(p => p.media.map(m => m.publicId))), old = Date.now() - 36e5, out = [];
  for (const t of ["image", "video"]) {
    const r = await c.api.resources_by_tag("klin-studio-media", { resource_type: t, max_results: 500 });
    for (const a of r.resources) if (!used.has(a.public_id) && new Date(a.created_at).getTime() < old) out.push({ publicId: a.public_id, type: t });
  }
  return { deleted: out.length, errors: await removeMedia(out), retried: await replay() };
}
export async function health() { // diagnostic Cloudinary : lecture + création (envoi d'un pixel de test supprimé aussitôt)
  const out = { cloud: process.env.CLOUDINARY_CLOUD_NAME, read: false, create: false, error: null };
  try { await c.api.ping(); out.read = true; } catch (e) { out.error = e.error?.message || String(e.message); }
  try { const r = await c.uploader.upload("data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7", { folder: "klin-studio/projects", tags: ["klin-studio-test"] }); await c.uploader.destroy(r.public_id); out.create = true; }
  catch (e) { out.error = e.error?.message || out.error || String(e.message); }
  return out;
}
// Envoi direct navigateur → Cloudinary (contourne la limite de 4,5 Mo des fonctions Vercel)
export function sign(kind) {
  const timestamp = Math.round(Date.now() / 1000), p = kind === "sound" ? { folder: "klin-studio/sounds", tags: "klin-studio-sound", timestamp } : { folder: "klin-studio/projects", tags: "klin-studio-media,pending", timestamp };
  return { ...p, signature: c.utils.api_sign_request(p, process.env.CLOUDINARY_API_SECRET), apiKey: process.env.CLOUDINARY_API_KEY, cloudName: process.env.CLOUDINARY_CLOUD_NAME };
}
