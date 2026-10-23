// Connexion Mongoose + modèles (Project, Booking, Setting, Failed)
import mongoose from "mongoose";
const g = globalThis; g._klin ||= { p: null };
export const db = () => (g._klin.p ||= mongoose.connect(process.env.MONGODB_URI));
const S = mongoose.Schema, L = { fr: String, en: String };
const media = new S({ publicId: String, url: String, type: { type: String, default: "image" } }, { _id: false });
const m = (n, s, o) => mongoose.models[n] || mongoose.model(n, new S(s, o));
export const Project = m("Project", { slug: { type: String, unique: true, index: true }, title: L, summary: L, body: L, role: L, context: L, challenge: L, solution: L, result: L, origin: { type: String, default: "personal" }, published: { type: Boolean, default: true }, url: String, featured: { type: Boolean, default: true }, order: { type: Number, default: 0 }, media: { type: [media], validate: v => v.length <= 10 } }, { timestamps: true });
export const Booking = m("Booking", { name: String, email: String, phone: String, whatsapp: Boolean, type: String, sector: String, budget: String, deadline: String, slot: String, message: String, lang: String, status: { type: String, default: "pending" } }, { timestamps: true });
export const Setting = m("Setting", { key: { type: String, unique: true }, value: S.Types.Mixed });
export const Failed = m("Failed", { publicId: String, type: String, error: String }, { timestamps: true });
export const Mail = m("Mail", { to: String, subject: String, body: String, bookingId: String, ok: Boolean, error: String }, { timestamps: true });
