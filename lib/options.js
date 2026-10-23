// Options partagées (formulaire de RDV, admin, modèles d'emails) — module pur, utilisable côté client et serveur
export const OPT = {
  type: [["site", "Site vitrine immersif", "Immersive showcase site"], ["shop", "Boutique en ligne", "Online store"], ["launch", "Lancement collection / produit", "Collection / product launch"], ["redesign", "Refonte de site existant", "Redesign of an existing site"], ["other", "Autre", "Other"]],
  sector: [["fashion", "Mode", "Fashion"], ["beauty", "Beauté", "Beauty"], ["jewelry", "Joaillerie", "Jewelry"], ["other", "Autre", "Other"]],
  budget: [["essential", "Essentiel", "Essential", "moins de 3 000 €", "under €3,000"], ["standard", "Standard", "Standard", "3 000 à 6 000 €", "€3,000 to €6,000"], ["premium", "Premium", "Premium", "6 000 à 12 000 €", "€6,000 to €12,000"], ["signature", "Signature", "Signature", "12 000 € et plus", "€12,000 and above"], ["tbd", "À définir ensemble", "To define together", "nous vous guidons", "we'll guide you"]],
  deadline: [["urgent", "Urgent", "Urgent", "moins d'1 mois", "under 1 month"], ["asap", "Rapide", "Soon", "1 à 2 mois", "1–2 months"], ["quarter", "Planifié", "Planned", "3 à 4 mois", "3–4 months"], ["flex", "Flexible", "Flexible", "pas de date précise", "no fixed date"]],
};
const LEGACY = { comfortable: "Confortable" };
export const label = (k, v, lang = "fr") => { // « Nom · fourchette » pour budget et délai
  const o = OPT[k]?.find(x => x[0] === v); if (!o) return LEGACY[v] || v || "—";
  const nm = o[lang === "en" ? 2 : 1], rg = o[lang === "en" ? 4 : 3]; return rg ? `${nm} · ${rg}` : nm;
};
// Créneaux de rendez-vous : jours ouvrés, 10:00 → 17:30 (heure de Casablanca)
export const SLOTS = Array.from({ length: 16 }, (_, i) => `${String(10 + (i >> 1)).padStart(2, "0")}:${i % 2 ? "30" : "00"}`);
export const TEXT_SECTIONS = [["accueil", "Accueil"], ["services", "Services"], ["studio", "Studio"], ["contact", "Contact"], ["legal", "Mentions légales"], ["projets", "Pages projets"], ["rdv", "Rendez-vous et emails"], ["menu", "Menu et son"], ["seo", "Référencement"]];
export const TEMPLATES = [
  { id: "free", name: "Message libre", lang: "fr", subject: "", preheader: "", title: "", body: "" },
  { id: "prospect_fr", name: "Prospection mode & beauté (FR)", lang: "fr", subject: "Une expérience web à la hauteur de votre marque", preheader: "Sites immersifs pour la mode et la beauté", title: "Votre marque mérite plus qu'une page",
    body: "Bonjour {{prenom}},\n\nJe m'appelle Christian, fondateur de Klin Studio. Nous concevons des sites immersifs pour les marques de mode et de beauté : une navigation en 3D fluide, un contenu lisible et référencé, pensé pour convertir.\n\nSi vous préparez un lancement, une collection ou une refonte, je serais ravi d'échanger quelques minutes pour voir si nous pouvons vous aider.\n\nBien cordialement,\nChristian\nKlin Studio" },
  { id: "prospect_en", name: "Prospecting fashion & beauty (EN)", lang: "en", subject: "A web experience worthy of your brand", preheader: "Immersive websites for fashion and beauty", title: "Your brand deserves more than a page",
    body: "Hello {{name}},\n\nI'm Christian, founder of Klin Studio. We design immersive websites for fashion and beauty brands: fluid 3D navigation, readable and search-friendly content, built to convert.\n\nIf you're preparing a launch, a collection or a redesign, I'd be glad to talk for a few minutes and see how we can help.\n\nBest regards,\nChristian\nKlin Studio" },
  { id: "followup_fr", name: "Suite à un échange (FR)", lang: "fr", subject: "Suite à notre échange", preheader: "Les prochaines étapes de votre projet", title: "Merci pour votre temps",
    body: "Bonjour {{prenom}},\n\nMerci pour notre échange. Comme convenu, voici les prochaines étapes possibles pour votre projet.\n\n[Ajoutez ici les détails]\n\nJe reste disponible pour toute question.\n\nBien cordialement,\nChristian\nKlin Studio" },
  { id: "followup_en", name: "Follow-up after a call (EN)", lang: "en", subject: "Following our conversation", preheader: "Next steps for your project", title: "Thank you for your time",
    body: "Hello {{name}},\n\nThank you for our conversation. As agreed, here are the possible next steps for your project.\n\n[Add details here]\n\nI remain available for any question.\n\nBest regards,\nChristian\nKlin Studio" },
];
// « Prénom <email> » ou simple email, un par ligne (ou séparés par « ; »)
export function parseRecipients(txt) {
  const seen = new Set(), out = [];
  for (const raw of String(txt || "").split(/[\n;]+/)) {
    const l = raw.trim(); if (!l) continue;
    const m = l.match(/^(.*?)\s*<\s*([^<>\s]+@[^<>\s]+)\s*>$/), email = (m ? m[2] : l).trim().toLowerCase(), name = m ? m[1].replace(/["']/g, "").trim() : "";
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) || seen.has(email)) continue; seen.add(email); out.push({ name, email });
  }
  return out;
}

export const prettyTitle = (n = "") => { let s = String(n); try { s = decodeURIComponent(s); } catch {} s = s.replace(/\.[a-z0-9]{2,5}$/i, "").replace(/[-_.]+/g, " ").replace(/\s+/g, " ").trim(); return s ? s[0].toUpperCase() + s.slice(1) : ""; };
