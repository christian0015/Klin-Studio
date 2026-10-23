// Gmail SMTP : envoi brut (gabarit dans mailtpl.js), accusé visiteur + notification studio
import nodemailer from "nodemailer";
import { renderMail } from "./mailtpl";
import { label } from "./options";
const tx = () => nodemailer.createTransport({ service: "gmail", auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASSWORD } });
const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
export const site = () => (process.env.SITE_URL || "").replace(/\/$/, "");
export const sendRaw = (to, subject, html, replyTo) => tx().sendMail({ from: `Klin Studio <${process.env.GMAIL_USER}>`, to, subject, html, replyTo });
export async function bookingMails(b) {
  const fr = b.lang === "fr";
  if (b.email) await sendRaw(b.email, fr ? "Votre demande est bien reçue" : "We received your request", renderMail({
    lang: b.lang, name: b.name, site: site(), title: fr ? "Merci, nous revenons vers vous" : "Thank you, we'll be in touch", preheader: fr ? "Nous avons bien reçu votre demande" : "We received your request",
    body: fr ? "Bonjour {{prenom}},\n\nNous avons bien reçu votre demande et revenons vers vous sous 48 h (délai indicatif).\n\nÀ très vite,\nChristian\nKlin Studio" : "Hello {{name}},\n\nWe received your request and will reply within 48 h (indicative).\n\nSpeak soon,\nChristian\nKlin Studio" }));
  const rows = [["Nom", b.name], ["Email", b.email || "—"], ["Téléphone", b.phone ? `${b.phone}${b.whatsapp ? " (WhatsApp OK)" : ""}` : "—"], ["Projet", `${label("type", b.type)} · ${label("sector", b.sector)}`], ["Budget", label("budget", b.budget)], ["Délai", label("deadline", b.deadline)],
    ["Créneau (heure de Casablanca)", b.slot ? b.slot.replace("T", " à ") : "—"], ["Langue", b.lang], ["Message", b.message]];
  await sendRaw(process.env.STUDIO_EMAIL || process.env.GMAIL_USER, `Nouvelle demande — ${b.name}`, `<div style="font-family:Arial,sans-serif">${rows.map(([k, v]) => `<p><b>${k}</b> : ${esc(v)}</p>`).join("")}</div>`, b.email);
}
