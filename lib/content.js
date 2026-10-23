// Textes FR/EN, lecture des projets, liste des sons
import fs from "fs"; import path from "path";
import { db, Project } from "./db";
import { TEXT_SECTIONS, prettyTitle } from "./options";
export const LANGS = ["fr", "en"];
export const PAGES = ["services", "studio", "contact", "legal"];
export const T = {
  fr: {
    tagline: "Sites immersifs pour marques de mode et beauté", cta: "Prendre rendez-vous",
    intro: "Klin Studio conçoit des sites web immersifs, rapides et référencés pour les marques de mode et de beauté, depuis le Maroc, pour le monde entier.",
    work: "Projets", more: "Lire l'étude de cas", nav: { blog: "Blog", services: "Services", studio: "Studio", contact: "Contact", legal: "Mentions légales" },
    services: { title: "Services", text: ["Site vitrine immersif (3D, shaders, vidéo) à partir de — sur devis.", "Boutique et lancement de collection.", "SEO technique, performance, maintenance."], steps: ["Brief (2 à 3 jours)", "Direction artistique", "Build", "Livraison et support"], faq: [["Et la performance ?", "Version simplifiée automatique sur mobile modeste."], ["Et le SEO ?", "Contenu rendu côté serveur, indexable sans la 3D."], ["À qui appartient le code ?", "À vous, à la livraison."]] },
    studio: { title: "Le studio", text: ["Fondé par Christian, ingénieur logiciel et créatif (montage cinématique, 3D, VFX).", "Délais et garanties : valeurs provisoires à valider."] },
    contact: { title: "Contact", text: ["Parlez-nous de votre projet : réponse annoncée sous 48 h."] },
    legal: { title: "Mentions légales", text: ["Contenu provisoire : à compléter dans l'admin."] },
    form: { next: "Suivant", back: "Retour", send: "Envoyer", ok: "Merci, demande envoyée.", name: "Nom", email: "Email", type: "Type de projet", sector: "Secteur", budget: "Budget indicatif", deadline: "Délai", slot: "Créneau souhaité", message: "Message" },
  },
  en: {
    tagline: "Immersive websites for fashion & beauty brands", cta: "Book a call",
    intro: "Klin Studio designs immersive, fast and search-friendly websites for fashion and beauty brands, from Morocco, for the world.",
    work: "Projects", more: "Read the case study", nav: { blog: "Blog", services: "Services", studio: "Studio", contact: "Contact", legal: "Legal" },
    services: { title: "Services", text: ["Immersive showcase site (3D, shaders, video), from — on quote.", "Store and collection launch.", "Technical SEO, performance, maintenance."], steps: ["Brief (2–3 days)", "Art direction", "Build", "Delivery & support"], faq: [["What about performance?", "A lighter version is served automatically on modest phones."], ["What about SEO?", "Server-rendered content, indexable without 3D."], ["Who owns the code?", "You do, on delivery."]] },
    studio: { title: "The studio", text: ["Founded by Christian, software engineer and creative (cinematic editing, 3D, VFX).", "Lead times and guarantees: provisional values to confirm."] },
    contact: { title: "Contact", text: ["Tell us about your project: reply announced within 48 h."] },
    legal: { title: "Legal notice", text: ["Provisional content: complete it in the admin."] },
    form: { next: "Next", back: "Back", send: "Send", ok: "Thanks, request sent.", name: "Name", email: "Email", type: "Project type", sector: "Sector", budget: "Indicative budget", deadline: "Deadline", slot: "Preferred slot", message: "Message" },
  },
};
import { COPY } from "./copy";
Object.assign(T.fr, COPY.fr); Object.assign(T.en, COPY.en);
const plain = x => JSON.parse(JSON.stringify(x));
export async function getProjects(all = false) {
  try { await db(); return plain(await Project.find(all ? { published: { $ne: false } } : { published: { $ne: false }, featured: true }).sort({ order: 1 }).lean()); } catch { return []; }
}
export async function getProject(slug) {
  try { await db(); return plain(await Project.findOne({ slug, published: { $ne: false } }).lean()); } catch { return null; }
}
export const cld = (u, t = "f_auto,q_auto") => u?.replace("/upload/", `/upload/${t}/`);
export const sounds = () => { try { return fs.readdirSync(path.join(process.cwd(), "public/sounds")).filter(f => /\.(mp3|ogg|wav|m4a|webm)$/i.test(f)).map(f => ({ url: "/sounds/" + f, title: prettyTitle(f) })); } catch { return []; } };

/* ---- Accueil + textes surchargeables depuis l'admin ---- */
import { Setting } from "./db";
T.fr.home = {
  soon: "Bientôt", wall: "Projets",
  manifesto: { h: "Plus qu'un site web.", p: "Chaque marque a une matière : la soie, la pierre, l'eau, la lumière. Nous la transformons en expérience." },
  services: { h: "Savoir-faire", items: [
    { t: "Sites immersifs", d: "3D, shaders et vidéo pensés pour le luxe, fluides même sur mobile.", art: "silk" },
    { t: "Boutiques mode & beauté", d: "Parcours d'achat sobres, lancement de collection, performance.", art: "flacon" },
    { t: "SEO & performance", d: "Contenu indexable, études de cas façon blog, Core Web Vitals.", art: "ripple" }] },
  process: { h: "Méthode", steps: [
    { t: "Brief", d: "Marque, public, objectifs." }, { t: "Direction artistique", d: "Matières, lumière, rythme." },
    { t: "Conception", d: "Développement 3D et contenu." }, { t: "Mise en ligne", d: "Livraison, formation, suivi." }] },
  cta: { h: "Parlons de votre marque." },
};
T.en.home = {
  soon: "Soon", wall: "Projects",
  manifesto: { h: "More than a website.", p: "Every brand has a material: silk, stone, water, light. We turn it into an experience." },
  services: { h: "Craft", items: [
    { t: "Immersive sites", d: "3D, shaders and video made for luxury, smooth even on mobile.", art: "silk" },
    { t: "Fashion & beauty stores", d: "Quiet purchase journeys, collection launches, performance.", art: "flacon" },
    { t: "SEO & performance", d: "Indexable content, blog-style case studies, Core Web Vitals.", art: "ripple" }] },
  process: { h: "Method", steps: [
    { t: "Brief", d: "Brand, audience, goals." }, { t: "Art direction", d: "Materials, light, rhythm." },
    { t: "Build", d: "3D development and content." }, { t: "Launch", d: "Delivery, training, follow-up." }] },
  cta: { h: "Let's talk about your brand." },
};
export function flat(o, p = "", out = {}) {
  for (const [k, v] of Object.entries(o)) { const key = p ? p + "." + k : k; if (typeof v === "string") out[key] = v; else if (v && typeof v === "object") flat(v, key, out); }
  return out;
}
export async function getT(lang) {
  const t = structuredClone(T[lang]);
  try {
    await db(); const s = await Setting.findOne({ key: "texts" }).lean();
    for (const [k, v] of Object.entries(s?.value || {})) {
      const val = v?.[lang]; if (typeof val !== "string" || !val) continue;
      const ks = k.split("."); let n = t; for (const x of ks.slice(0, -1)) n = n?.[x];
      if (n && ks.at(-1) in n) n[ks.at(-1)] = val;
    }
  } catch {}
  return t;
}

T.fr.blog = { title: "Projets & études de cas", text: ["Chaque projet est raconté comme un article : contexte, direction artistique, choix techniques, résultats."], empty: "Les premières études de cas arrivent bientôt." };
T.en.blog = { title: "Projects & case studies", text: ["Each project is told as an article: context, art direction, technical choices, results."], empty: "The first case studies are coming soon." };

export async function getSounds() {
  let extra = []; try { await db(); extra = ((await Setting.findOne({ key: "sounds" }).lean())?.value || []).map(x => ({ url: x.url, title: x.title || prettyTitle(x.name) })); } catch {}
  return [...sounds(), ...extra];
}
T.fr.home.corners = { tl: ["Design", "Développement", "3D / VFX"], tr: ["Plus qu'un", "site web"], bl: "Maroc / International" };
T.en.home.corners = { tl: ["Design", "Development", "3D / VFX"], tr: ["More than", "a website"], bl: "Morocco / International" };
T.fr.home.story = ["Chaque marque a une matière.", "Nous la transformons en expérience."];
T.en.home.story = ["Every brand has a material.", "We turn it into an experience."];

/* ---- textes supplémentaires (éditables dans l'admin) ---- */
T.fr.home.hint = { long: "Défile pour découvrir", short: "Défile" };
T.en.home.hint = { long: "Scroll to discover", short: "Scroll" };
T.fr.sound = { ask: "Activer le son ?", yes: "Oui", no: "Non" }; T.en.sound = { ask: "Enable sound?", yes: "Yes", no: "No" };
T.fr.ui = { menu: "Menu", home: "Accueil" }; T.en.ui = { menu: "Menu", home: "Home" };
T.fr.project = { role: "Rôle", context: "Contexte", challenge: "Défi", solution: "Solution", result: "Résultat", visit: "Voir le site" };
T.en.project = { role: "Role", context: "Context", challenge: "Challenge", solution: "Solution", result: "Result", visit: "Visit site" };
T.fr.form.choose = "Choisir…"; T.en.form.choose = "Choose…";
T.fr.seo = { home: { title: "Klin Studio — Sites immersifs pour marques de mode et beauté", desc: T.fr.intro }, blog: { title: "Projets & études de cas — Klin Studio", desc: T.fr.blog.text[0] },
  services: { title: "Services — Klin Studio", desc: T.fr.services.text[0] }, studio: { title: "Le studio — Klin Studio", desc: T.fr.studio.text[0] }, contact: { title: "Contact — Klin Studio", desc: T.fr.contact.text[0] }, legal: { title: "Mentions légales — Klin Studio", desc: T.fr.legal.text[0] } };
T.en.seo = { home: { title: "Klin Studio — Immersive websites for fashion & beauty brands", desc: T.en.intro }, blog: { title: "Projects & case studies — Klin Studio", desc: T.en.blog.text[0] },
  services: { title: "Services — Klin Studio", desc: T.en.services.text[0] }, studio: { title: "The studio — Klin Studio", desc: T.en.studio.text[0] }, contact: { title: "Contact — Klin Studio", desc: T.en.contact.text[0] }, legal: { title: "Legal notice — Klin Studio", desc: T.en.legal.text[0] } };
export { TEXT_SECTIONS };
const LB = { title: "Titre", h: "Titre", t: "Titre", text: "Texte", p: "Texte", d: "Description", desc: "Description", tagline: "Accroche", cta: "Bouton", intro: "Introduction", long: "Texte long (ordinateur)", short: "Texte court (mobile)",
  more: "Lien « lire l'étude de cas »", empty: "Message « aucun projet »", soon: "Libellé « Bientôt »", wall: "Titre de section", name: "Nom", email: "Email", type: "Type de projet", sector: "Secteur", budget: "Budget", deadline: "Délai", slot: "Créneau",
  message: "Message", next: "Bouton Suivant", back: "Bouton Retour", send: "Bouton Envoyer", ok: "Message de confirmation", choose: "Texte des listes", ask: "Question du son", yes: "Bouton Oui", no: "Bouton Non", menu: "Libellé du menu", home: "Lien Accueil",
  role: "Rôle", context: "Contexte", challenge: "Défi", solution: "Solution", result: "Résultat", visit: "Bouton « Voir le site »" };
const FORM_LB = { q1: "Question 1", q1s: "Question 1 (secteur)", q2: "Question budget", q2h: "Aide budget", q2d: "Question délai", optional: "Mot « optionnel »", skip: "Bouton « Passer »", q3: "Question contact", or: "Aide email/téléphone", whatsapp: "Question WhatsApp", yes: "Réponse Oui", no: "Réponse Non", q3c: "Titre du calendrier", q3ch: "Aide du calendrier", noSlot: "Aucune préférence", consent: "Mention données", sending: "Bouton en cours d'envoi", okp: "Confirmation (suite)", err: "Message d'erreur", need: "Email/téléphone requis", taken: "Créneau déjà pris", chosen: "Créneau choisi", clear: "Bouton Effacer" };
const PG = { services: "Services", studio: "Studio", contact: "Contact", legal: "Mentions légales", home: "Accueil", blog: "Blog" };
export function describe(k) { // classement des textes par section / groupe / libellé pour l'admin
  const [a, b, c, d, e] = k.split("."), n = i => +i + 1, lb = x => LB[x] || x, o = (section, group, label) => ({ section, group, label });
  if (!b) { if (["tagline", "cta", "intro"].includes(a)) return o("accueil", "Bannière", lb(a)); if (a === "more") return o("projets", "Liste des projets", lb(a)); }
  if (a === "home") {
    if (b === "hint") return o("accueil", "Indice de scroll", lb(c));
    if (b === "story") return o("accueil", "Phrases du parcours", `Phrase ${n(c)}`);
    if (b === "manifesto") return o("accueil", "Manifeste", lb(c));
    if (b === "services") return c === "h" ? o("accueil", "Savoir-faire", "Titre de section") : o("accueil", `Savoir-faire · ${n(d)}`, lb(e));
    if (b === "process") return c === "h" ? o("accueil", "Méthode", "Titre de section") : o("accueil", `Méthode · étape ${n(d)}`, lb(e));
    if (b === "cta") return o("accueil", "Appel à l'action", "Titre");
    if (b === "corners") return o("accueil", "Coins de l'intro", `${{ tl: "Haut gauche", tr: "Haut droite", bl: "Bas gauche" }[c]}${d !== undefined ? " · ligne " + n(d) : ""}`);
    return o("accueil", "Parcours", lb(b));
  }
  if (["services", "studio", "contact", "legal"].includes(a)) {
    const g = (grp, l) => o(a, grp, l);
    if (b === "title") return g("En-tête", "Titre"); if (b === "lead") return g("En-tête", "Phrase d'accroche"); if (b === "text") return g("Introduction", `Paragraphe ${n(c)}`);
    if (b === "offersTitle") return g("Prestations", "Titre de section"); if (b === "offers") return g(`Prestation · ${n(c)}`, lb(d));
    if (b === "stepsTitle") return g("Étapes", "Titre de section"); if (b === "steps") return g(`Étape ${n(c)}`, lb(d));
    if (b === "faqTitle") return g("FAQ", "Titre de section"); if (b === "faq") return g(`FAQ · ${n(c)}`, d === "0" ? "Question" : "Réponse");
    if (b === "valuesTitle") return g("Valeurs", "Titre de section"); if (b === "values") return g(`Valeur · ${n(c)}`, lb(d));
    if (b === "person") return g("Fondateur", { t: "Nom", r: "Rôle", d: "Présentation" }[c]); if (b === "cta") return g("Appel à l'action", { h: "Titre", p: "Texte", b: "Bouton" }[c]);
    if (b === "sections") return g(`Section · ${n(c)}`, lb(d));
    return g("Coordonnées", { infoTitle: "Titre", email: "Email", phone: "Téléphone", hours: "Horaires", city: "Ville / zone" }[b] || b);
  }
  if (a === "blog") return o("projets", "Page Blog", b === "text" ? "Introduction" : lb(b));
  if (a === "project") return o("projets", "Fiche projet", { personal: "Étiquette projet personnel", client: "Étiquette projet client", published: "Publié le", read: "Lien « lire l'étude »", all: "Lien « tous les projets »", related: "Titre « À lire aussi »", share: "Titre « Partager »", min: "min de lecture", ctaH: "Bandeau final · titre", ctaP: "Bandeau final · texte" }[b] || lb(b));
  if (a === "form") return o("rdv", "Formulaire de rendez-vous", b === "steps" ? `Étape ${n(c)}` : FORM_LB[b] || lb(b));
  if (a === "nav") return o("menu", "Menu", PG[b] || lb(b));
  if (a === "ui") return o("menu", "Menu", lb(b));
  if (a === "sound") return o("menu", "Son", lb(b));
  if (a === "seo") return o("seo", PG[b] || b, c === "title" ? "Titre (onglet / Google)" : "Description (Google)");
  return o("accueil", "Autres", k);
}
