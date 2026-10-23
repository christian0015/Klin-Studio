"use client";
// Admin Klin Studio : Demandes · Projets · Emails · Textes · Sons · Maintenance
import { useState, useEffect, useMemo } from "react";
import { OPT, label, TEMPLATES, TEXT_SECTIONS, parseRecipients, prettyTitle } from "@/lib/options";
import { renderMail } from "@/lib/mailtpl";
import RichEditor from "./RichEditor";

const api = async (r, method = "GET", body) => {
  const res = await fetch("/api/admin/" + r, { method, headers: body ? { "Content-Type": "application/json" } : undefined, body: body && JSON.stringify(body) });
  const j = await res.json().catch(() => ({})); if (!res.ok) throw new Error(j.error || "Erreur"); return j;
};
async function direct(file, kind) { // envoi signé direct vers Cloudinary (dossier klin-studio)
  const s = await api("sign", "POST", { kind }), fd = new FormData();
  fd.append("file", file); fd.append("api_key", s.apiKey); fd.append("timestamp", s.timestamp); fd.append("signature", s.signature); fd.append("folder", s.folder); if (s.tags) fd.append("tags", s.tags);
  const r = await fetch(`https://api.cloudinary.com/v1_1/${s.cloudName}/auto/upload`, { method: "POST", body: fd }), j = await r.json();
  if (!r.ok) { const m = j.error?.message || "Échec de l'envoi"; throw new Error(/permission/i.test(m) ? "Cloudinary refuse l'envoi : la clé API n'a pas la permission « create ». Active les droits d'upload pour cette clé (Console Cloudinary → Settings → API Keys), puis mets à jour CLOUDINARY_API_KEY / SECRET. Onglet Maintenance → « Tester Cloudinary » pour vérifier." : m); }
  return { publicId: j.public_id, url: j.secure_url, type: j.resource_type === "video" ? "video" : "image" };
}
const fmt = d => (d ? new Date(d).toLocaleString("fr-FR", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—");
const fmtSlot = d => (!d ? "—" : /Z|\+/.test(d) ? fmt(d) : new Date(d + ":00Z").toLocaleString("fr-FR", { timeZone: "UTC", weekday: "short", day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) + " (heure de Casablanca)");
const ST = { pending: "En attente", confirmed: "Confirmée", declined: "Refusée", archived: "Archivée" };
const Field = ({ label: l, full, children }) => <label className={"ad-f" + (full ? " full" : "")}><span>{l}</span>{children}</label>;
const DEF = {
  summary: { fr: "Étude de cas : conception d'un site immersif pour une marque de mode et de beauté.", en: "Case study: an immersive website designed for a fashion and beauty brand." },
  context: { fr: "Une marque de mode et de beauté avait besoin d'un site qui transmette son univers dès la première seconde, sans sacrifier la performance ni le référencement.", en: "A fashion and beauty brand needed a website that conveys its world from the very first second, without sacrificing performance or search visibility." },
  challenge: { fr: "Traduire une identité sensible en expérience web immersive, tout en gardant un chargement rapide sur mobile et un contenu lisible par Google.", en: "Turn a delicate identity into an immersive web experience while keeping fast mobile loading and content Google can read." },
  solution: { fr: "Nous avons conçu une direction artistique sur mesure, une navigation en 3D fluide et un contenu rendu côté serveur pour être indexé. Chaque détail visuel a été optimisé pour rester léger.", en: "We created a tailor-made art direction, fluid 3D navigation and server-rendered content so it can be indexed. Every visual detail was optimised to stay light." },
  result: { fr: "Un site plus mémorable, plus rapide et mieux référencé, qui met la marque en valeur et simplifie la prise de contact.", en: "A more memorable, faster and better-ranked website that showcases the brand and makes getting in touch easier." },
  body: { fr: "<h2>Le projet</h2><p>Ce projet réunit direction artistique, 3D temps réel et développement web pour offrir à la marque une vitrine à la hauteur de son univers.</p><h2>Notre approche</h2><p>Nous sommes partis de l'identité de la marque : ses matières, sa lumière, son rythme. Chaque choix visuel a ensuite été validé pour rester rapide et accessible, sur mobile comme sur ordinateur.</p><h2>Ce que le site apporte</h2><ul><li>Une identité visuelle immersive et cohérente</li><li>Un chargement rapide, y compris sur mobile</li><li>Un contenu structuré pour le référencement</li></ul>", en: "<h2>The project</h2><p>This project combines art direction, real-time 3D and web development to give the brand a showcase worthy of its world.</p><h2>Our approach</h2><p>We started from the brand's identity: its materials, its light, its rhythm. Every visual choice was then validated to stay fast and accessible, on mobile and desktop.</p><h2>What the site delivers</h2><ul><li>An immersive, consistent visual identity</li><li>Fast loading, including on mobile</li><li>Content structured for search</li></ul>" },
};
const NEW = n => ({ slug: "", title: { fr: "", en: "" }, summary: DEF.summary, body: DEF.body, role: { fr: "Conception et développement", en: "Design and development" }, context: DEF.context, challenge: DEF.challenge, solution: DEF.solution, result: DEF.result, url: "", origin: "personal", published: true, featured: true, order: n, media: [] });

// Composants définis HORS des écrans : sinon React les recrée à chaque frappe et le champ perd le focus (« saut »)
const Two = ({ cur, up, k, l, rows = 2, ph = [] }) => <><Field label={`${l} · FR`}><textarea rows={rows} value={cur[k].fr} onChange={up(k, "fr")} placeholder={ph[0]} /></Field><Field label={`${l} · EN`}><textarea rows={rows} value={cur[k].en} onChange={up(k, "en")} placeholder={ph[1]} /></Field></>;
function TextField({ r, l, vals, set }) { // champ simple ou multiligne selon le texte d'origine (stable pendant la frappe)
  const base = l === "fr" ? r.baseFr : r.baseEn, v = vals[r.k]?.[l] ?? base;
  return <Field label={`${r.label} · ${l.toUpperCase()}`}>{base.length > 70 ? <textarea rows={3} value={v} onChange={e => set(r.k, l, e.target.value)} /> : <input value={v} onChange={e => set(r.k, l, e.target.value)} />}
    {v !== base && <button className="ad-link" onClick={() => set(r.k, l, base)}>Rétablir</button>}</Field>;
}
export default function Admin({ authed }) {
  const [ok, setOk] = useState(authed), [tab, setTab] = useState("req"), [toast, setToast] = useState(null), [err, setErr] = useState("");
  const [req, setReq] = useState([]), [prj, setPrj] = useState([]), [mails, setMails] = useState([]), [snd, setSnd] = useState([]), [compose, setCompose] = useState(null);
  const say = (m, k = "ok") => { setToast({ m, k }); setTimeout(() => setToast(t => (t && t.m === m ? null : t)), 5500); };
  const load = () => Promise.all([api("bookings"), api("projects"), api("mail"), api("sounds")]).then(([a, b, c, d]) => { setReq(a); setPrj(b); setMails(c); setSnd(d); }).catch(e => say(e.message, "err"));
  useEffect(() => { if (ok) load(); }, [ok]);
  async function signin(e) { e.preventDefault(); const r = await fetch("/api/admin/session", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(Object.fromEntries(new FormData(e.target))) }); r.ok ? setOk(true) : setErr((await r.json()).error === "rate" ? "Trop d'essais, réessaie plus tard." : "Identifiants incorrects."); }

  if (!ok) return (
    <div className="ad-login"><p className="ad-brand">Klin Studio · Admin</p>
      <form className="ad-card" onSubmit={signin}>
        <Field label="Identifiant"><input name="username" autoComplete="username" required /></Field>
        <Field label="Mot de passe"><input name="password" type="password" autoComplete="current-password" required /></Field>
        <button className="ad-btn primary" style={{ width: "100%" }}>Connexion</button>{err && <p role="alert" style={{ color: "var(--bad)" }}>{err}</p>}
      </form></div>
  );
  const pending = req.filter(b => b.status === "pending").length;
  const TABS = [["req", "Demandes", pending], ["prj", "Projets"], ["mail", "Emails"], ["txt", "Textes"], ["snd", "Sons"], ["mnt", "Maintenance"]];
  return (
    <div className="ad">
      <div className="ad-top"><span className="ad-brand">Klin Studio · Admin</span><button className="ad-btn sm" onClick={async () => { await fetch("/api/admin/session", { method: "DELETE" }); setOk(false); }}>Sortir</button></div>
      <nav className="ad-tabs">{TABS.map(([k, l, n]) => <button key={k} className={"ad-pill" + (tab === k ? " on" : "")} onClick={() => setTab(k)}>{l}{n ? <i>{n}</i> : null}</button>)}</nav>
      {tab === "req" && <Requests items={req} reload={load} say={say} reply={b => { setCompose(b); setTab("mail"); }} />}
      {tab === "prj" && <Projects items={prj} reload={load} say={say} />}
      {tab === "mail" && <Emails history={mails} reload={load} say={say} compose={compose} clear={() => setCompose(null)} />}
      {tab === "txt" && <Texts say={say} />}
      {tab === "snd" && <Sounds items={snd} setItems={setSnd} say={say} />}
      {tab === "mnt" && <Maintenance say={say} />}
      {toast && <div className={"ad-toast" + (toast.k === "err" ? " err" : "")} role="status">{toast.m}</div>}
    </div>
  );
}

/* ---------------- Demandes ---------------- */
function Requests({ items, reload, say, reply }) {
  const [f, setF] = useState("all"), [q, setQ] = useState(""), [notify, setNotify] = useState(true);
  const F = [["all", "Toutes"], ["pending", "En attente"], ["confirmed", "Confirmées"], ["declined", "Refusées"], ["archived", "Archivées"]];
  const cnt = k => (k === "all" ? items.length : items.filter(b => b.status === k).length);
  const list = items.filter(b => (f === "all" || b.status === f) && (!q || (b.name + b.email + b.message).toLowerCase().includes(q.toLowerCase())));
  const set = async (b, s) => { try { await api("bookings", "PATCH", { _id: b._id, status: s, notify: notify && (s === "confirmed" || s === "declined") }); say(notify && s !== "archived" && s !== "pending" ? "Statut mis à jour · client notifié" : "Statut mis à jour"); reload(); } catch (e) { say(e.message, "err"); } };
  return (<>
    <div className="ad-head"><h1>Demandes</h1><input className="ad-in ad-search" placeholder="Rechercher…" value={q} onChange={e => setQ(e.target.value)} /></div>
    <div className="ad-seg">{F.map(([k, l]) => <button key={k} className={"ad-pill" + (f === k ? " on" : "")} onClick={() => setF(k)}>{l}<i>{cnt(k)}</i></button>)}
      <label className="ad-check" style={{ marginLeft: "auto" }}><input type="checkbox" checked={notify} onChange={e => setNotify(e.target.checked)} /> Notifier le client par email (Confirmer / Refuser)</label></div>
    {list.length === 0 && <p className="ad-mut">Aucune demande.</p>}
    {list.map(b => (
      <div key={b._id} className="ad-card ad-req">
        <div className="row"><div><h3>{b.name}</h3>{b.email && <a href={"mailto:" + b.email}>{b.email}</a>}{b.email && b.phone && " · "}{b.phone && <a href={"tel:" + b.phone}>{b.phone}</a>}{b.whatsapp && <> · <a href={"https://wa.me/" + b.phone.replace(/\D/g, "")} target="_blank" rel="noopener">WhatsApp ↗</a></>}</div><span className={"ad-badge b-" + b.status}>{ST[b.status]}</span></div>
        <dl className="ad-dl"><dt>Reçue</dt><dd>{fmt(b.createdAt)}</dd><dt>Créneau</dt><dd><b>{fmtSlot(b.slot)}</b></dd><dt>Projet</dt><dd>{label("type", b.type)} · {label("sector", b.sector)}</dd>
          <dt>Budget</dt><dd>{label("budget", b.budget)} · {label("deadline", b.deadline)}</dd><dt>Langue</dt><dd>{b.lang === "en" ? "Anglais" : "Français"}</dd>{b.message && <><dt>Message</dt><dd>{b.message}</dd></>}</dl>
        <div className="ad-actions">
          <button className="ad-btn ok sm" onClick={() => set(b, "confirmed")}>Confirmer</button><button className="ad-btn bad sm" onClick={() => set(b, "declined")}>Refuser</button><button className="ad-btn sm" onClick={() => set(b, "archived")}>Archiver</button>
          <button className="ad-btn sm" disabled={!b.email} title={b.email ? "" : "Pas d'email : utilisez le téléphone / WhatsApp"} onClick={() => reply(b)}>Répondre</button>
          <button className="ad-btn sm" style={{ marginLeft: "auto" }} onClick={() => confirm("Supprimer définitivement cette demande ?") && api("bookings", "DELETE", { _id: b._id }).then(reload)}>Supprimer</button>
        </div>
      </div>))}
  </>);
}

/* ---------------- Projets ---------------- */
function Projects({ items, reload, say }) {
  const [cur, setCur] = useState(null), [fresh, setFresh] = useState([]), [busy, setBusy] = useState(false), [bl, setBl] = useState("fr");
  const nextOrder = items.reduce((m, p) => Math.max(m, p.order || 0), 0) + 1;
  const up = (k, l) => e => setCur(c => (l ? { ...c, [k]: { ...c[k], [l]: e.target.value } } : { ...c, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value }));
  const add = async e => { const files = [...e.target.files]; e.target.value = ""; setBusy(true); try { for (const f of files) { if (cur.media.length >= 10) { say("Maximum 10 médias", "err"); break; } const m = await direct(f, "media"); setFresh(x => [...x, m]); setCur(c => ({ ...c, media: [...c.media, m].slice(0, 10) })); } } catch (er) { say(er.message, "err"); } setBusy(false); };
  const rm = async m => { setCur(c => ({ ...c, media: c.media.filter(x => x.publicId !== m.publicId) })); if (fresh.some(x => x.publicId === m.publicId)) { await api("upload", "DELETE", m).catch(() => {}); setFresh(x => x.filter(y => y.publicId !== m.publicId)); } };
  const mv = (i, d) => setCur(c => { const a = [...c.media]; [a[i], a[i + d]] = [a[i + d], a[i]]; return { ...c, media: a }; });
  const cancel = async () => { for (const m of fresh.filter(m => cur.media.some(x => x.publicId === m.publicId))) await api("upload", "DELETE", m).catch(() => {}); setFresh([]); setCur(null); }; // abandon : fichiers non enregistrés supprimés
  const save = async () => { if (!cur.title.fr && !cur.title.en) return say("Ajoute au moins un titre", "err"); try { const r = await api("projects", cur._id ? "PUT" : "POST", cur); say(r.errors?.length ? "Enregistré · échec de suppression de " + r.errors.length + " fichier(s)" : "Projet enregistré"); setFresh([]); setCur(null); reload(); } catch (e) { say(e.message, "err"); } };
  if (!cur) return (<>
    <div className="ad-head"><div><h1>Projets</h1><p>Chaque projet devient un article /blog/slug et un cadre sur le mur.</p></div><button className="ad-btn primary" onClick={() => setCur(NEW(nextOrder))}>+ Nouveau projet</button></div>
    <div className="ad-card ad-list">{items.length === 0 && <p className="ad-mut">Aucun projet pour l'instant.</p>}
      {items.map(p => (<div className="item" key={p._id}>{p.media[0]?.type === "image" ? <img src={p.media[0].url} alt="" /> : <span className="ph" />}
        <div><b>{p.title.fr || p.title.en}</b><div className="ad-mut">/{p.slug} · {p.origin === "client" ? "Projet client" : "Projet personnel"} · {p.media.length}/10 médias · ordre {p.order}</div></div>
        <span className={"ad-badge " + (p.published ? "b-confirmed" : "b-archived")}>{p.published ? "Publié" : "Brouillon"}</span>
        <button className="ad-btn sm" onClick={() => setCur(p)}>Éditer</button>
        <button className="ad-btn sm bad" onClick={() => confirm("Supprimer ce projet et ses médias ?") && api("projects", "DELETE", { _id: p._id }).then(r => { say(r.errors?.length ? "Supprimé · échec de suppression de médias" : "Projet supprimé"); reload(); })}>Supprimer</button></div>))}</div></>);
  return (<>
    <div className="ad-head"><h1>{cur._id ? "Modifier le projet" : "Nouveau projet"}</h1><div className="ad-actions"><button className="ad-btn" onClick={cancel}>Annuler</button><button className="ad-btn primary" onClick={save} disabled={busy}>Enregistrer</button></div></div>
    <section className="ad-card"><h2>L'essentiel</h2><div className="ad-grid">
      <Field label="Titre · FR"><input value={cur.title.fr} onChange={up("title", "fr")} placeholder="Ex. Atelier Soleil" /></Field><Field label="Titre · EN"><input value={cur.title.en} onChange={up("title", "en")} placeholder="E.g. Atelier Soleil" /></Field></div>
      <div className="ad-grid4" style={{ marginTop: 16 }}>
        <Field label="Adresse (slug)"><input value={cur.slug} onChange={up("slug")} placeholder="atelier-soleil" /></Field><Field label="Lien du site réel"><input value={cur.url} onChange={up("url")} placeholder="https://…" /></Field>
        <Field label="Origine"><select value={cur.origin} onChange={up("origin")}><option value="personal">Projet personnel (nos marques)</option><option value="client">Projet client</option></select></Field>
        <Field label="Ordre d'affichage"><input type="number" value={cur.order} onChange={up("order")} /></Field></div>
      <div className="ad-actions" style={{ marginTop: 14 }}><label className="ad-check"><input type="checkbox" checked={cur.published} onChange={up("published")} /> Publié</label><label className="ad-check"><input type="checkbox" checked={cur.featured} onChange={up("featured")} /> Mis en avant sur le mur</label></div>
      <p className="ad-url">Adresse FR : /fr/blog/{cur.slug || "(générée depuis le titre)"} · EN : /en/blog/{cur.slug || "…"}</p></section>
    <section className="ad-card"><h2>Le récit</h2><div className="ad-grid">
      <Two cur={cur} up={up} k="summary" l="Résumé court (cartes + Google)" ph={["Une phrase qui donne envie", "One sentence that sells it"]} /><Two cur={cur} up={up} k="role" l="Rôle" /><Two cur={cur} up={up} k="context" l="Contexte" rows={3} /><Two cur={cur} up={up} k="challenge" l="Défi" rows={3} /><Two cur={cur} up={up} k="solution" l="Solution" rows={3} /><Two cur={cur} up={up} k="result" l="Résultat" rows={3} /></div></section>
    <section className="ad-card"><h2>Médias <span className="ad-mut">{cur.media.length}/10 · le 1er est l'image du cadre</span></h2><div className="ad-media">
      {cur.media.map((m, i) => <div key={m.publicId} className="ad-th">{m.type === "video" ? <video src={m.url} muted /> : <img src={m.url} alt="" />}{i === 0 && <b>Principal</b>}
        <div><button disabled={i === 0} onClick={() => mv(i, -1)}>←</button><button disabled={i === cur.media.length - 1} onClick={() => mv(i, 1)}>→</button><button onClick={() => rm(m)}>✕</button></div></div>)}
      {cur.media.length < 10 && <label className="ad-drop">{busy ? "Envoi…" : "+ Ajouter"}<input type="file" hidden multiple accept="image/*,video/*" onChange={add} /></label>}</div></section>
    <section className="ad-card"><h2>Article <span className="ad-mut">· mini traitement de texte (titres, gras, polices, couleurs…)</span></h2><div className="ad-seg">{[["fr", "Français"], ["en", "English"]].map(([l, n]) => <button key={l} type="button" className={"ad-pill" + (bl === l ? " on" : "")} onClick={() => setBl(l)}>{n}</button>)}</div>
      <RichEditor key={bl} value={cur.body[bl]} onChange={h => setCur(c => ({ ...c, body: { ...c.body, [bl]: h } }))} /></section>
  </>);
}

/* ---------------- Emails ---------------- */
function Emails({ history, reload, say, compose, clear }) {
  const T0 = TEMPLATES[1], [tid, setTid] = useState(T0.id), [f, setF] = useState({ recipients: "", lang: T0.lang, subject: T0.subject, preheader: T0.preheader, title: T0.title, body: T0.body }), [busy, setBusy] = useState(false);
  const apply = id => { const t = TEMPLATES.find(x => x.id === id); setTid(id); setF(s => ({ ...s, lang: t.lang, subject: t.subject, preheader: t.preheader, title: t.title, body: t.body })); };
  useEffect(() => { if (!compose) return; const t = TEMPLATES.find(x => x.id === (compose.lang === "en" ? "followup_en" : "followup_fr")); setTid(t.id); setF({ recipients: `${compose.name} <${compose.email}>`, lang: t.lang, subject: t.subject, preheader: t.preheader, title: t.title, body: t.body }); clear(); }, [compose]);
  const set = k => e => setF(s => ({ ...s, [k]: e.target.value })), list = parseRecipients(f.recipients);
  const prev = useMemo(() => renderMail({ lang: f.lang, name: list[0]?.name || "Camille", title: f.title || "Titre de l'email", body: f.body || "Votre message…", preheader: f.preheader, bare: true }), [f]);
  const send = async () => { if (!confirm(`Envoyer à ${list.length} destinataire(s) ?`)) return; setBusy(true); try { const r = await api("mail", "POST", f); say(r.failed.length ? `${r.sent} envoyé(s) · échec : ${r.failed.join(", ")}` : `${r.sent} email(s) envoyé(s)`, r.failed.length ? "err" : "ok"); reload(); } catch (e) { say(e.message, "err"); } setBusy(false); };
  return (<>
    <div className="ad-head"><h1>Emails</h1><p className="ad-mut">Un message individuel par destinataire, avec le gabarit Klin Studio</p></div>
    <div className="ad-split">
      <section className="ad-card"><div className="ad-grid" style={{ gridTemplateColumns: "1fr" }}>
        <Field label="Modèle"><select value={tid} onChange={e => apply(e.target.value)}>{TEMPLATES.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</select></Field>
        <Field label="Destinataires (un par ligne : « Prénom <email> » ou juste l'email, 30 max)"><textarea rows={5} value={f.recipients} onChange={set("recipients")} placeholder={"Camille <camille@marque.com>\nbonjour@autre-marque.com"} /></Field>
        <div className="ad-grid"><Field label="Langue"><select value={f.lang} onChange={set("lang")}><option value="fr">Français</option><option value="en">English</option></select></Field><Field label="Objet"><input value={f.subject} onChange={set("subject")} /></Field></div>
        <Field label="Pré-en-tête (l'aperçu dans la boîte de réception)"><input value={f.preheader} onChange={set("preheader")} /></Field><Field label="Titre dans l'email"><input value={f.title} onChange={set("title")} /></Field>
        <Field label="Message — {{prenom}} est remplacé pour chaque destinataire"><textarea rows={11} value={f.body} onChange={set("body")} /></Field>
        <div className="ad-actions"><button className="ad-btn primary" disabled={busy || !list.length} onClick={send}>{busy ? "Envoi…" : `Envoyer${list.length ? " à " + list.length : ""}`}</button><span className="ad-mut" style={{ alignSelf: "center" }}>{list.length} destinataire(s) valide(s)</span></div></div></section>
      <section className="ad-card"><h2>Aperçu</h2><div className="ad-prev" dangerouslySetInnerHTML={{ __html: prev }} /></section></div>
    <section className="ad-card"><h2>Historique</h2>{history.length === 0 && <p className="ad-mut">Aucun email envoyé.</p>}
      {history.slice(0, 30).map(m => <p key={m._id} style={{ margin: "6px 0" }}><span className="ad-mut">{fmt(m.createdAt)}</span> → {m.to} · <b>{m.subject}</b> {m.ok === false && <span style={{ color: "var(--bad)" }}>(échec)</span>}</p>)}</section>
  </>);
}

/* ---------------- Textes ---------------- */
function Texts({ say }) {
  const [rows, setRows] = useState(null), [vals, setVals] = useState({}), [saved, setSaved] = useState(""), [sec, setSec] = useState("accueil");
  useEffect(() => { api("texts").then(r => { setRows(r); const v = Object.fromEntries(r.map(x => [x.k, { fr: x.fr, en: x.en }])); setVals(v); setSaved(JSON.stringify(v)); }).catch(e => say(e.message, "err")); }, []);
  if (!rows) return <p className="ad-mut">Chargement…</p>;
  const dirty = JSON.stringify(vals) !== saved, groups = new Map();
  rows.filter(r => r.section === sec).forEach(r => { if (!groups.has(r.group)) groups.set(r.group, []); groups.get(r.group).push(r); });
  const set = (k, l, v) => setVals(s => ({ ...s, [k]: { ...s[k], [l]: v } }));
  const save = async () => { try { const r = await api("texts", "PUT", { values: vals }); setSaved(JSON.stringify(vals)); say(`Textes enregistrés (${r.count} personnalisé${r.count > 1 ? "s" : ""})`); } catch (e) { say(e.message, "err"); } };
  return (<>
    <div className="ad-head"><div><h1>Textes du site</h1><p>Français et anglais côte à côte. « Rétablir » remet le texte d'origine.</p></div><button className="ad-btn primary" disabled={!dirty} onClick={save}>{dirty ? "Enregistrer" : "Enregistré"}</button></div>
    <div className="ad-seg">{TEXT_SECTIONS.map(([k, l]) => <button key={k} className={"ad-pill" + (sec === k ? " on" : "")} onClick={() => setSec(k)}>{l}</button>)}</div>
    {[...groups].map(([g, items]) => <section key={g} className="ad-card"><h3>{g}</h3>{items.map(r => <div className="ad-two" key={r.k}><TextField r={r} l="fr" vals={vals} set={set} /><TextField r={r} l="en" vals={vals} set={set} /></div>)}</section>)}
  </>);
}

/* ---------------- Sons ---------------- */
function Sounds({ items, setItems, say }) {
  const [busy, setBusy] = useState(false);
  const add = async e => { const f = e.target.files[0]; e.target.value = ""; if (!f) return; setBusy(true); try { const a = await direct(f, "sound"); setItems(await api("sounds", "POST", { ...a, name: f.name })); say("Son ajouté"); } catch (er) { say(er.message, "err"); } setBusy(false); };
  return (<>
    <div className="ad-head"><div><h1>Sons de l'intro</h1><p>Musiques calmes (mp3 / ogg / m4a). Le liquide et les nappes réagissent à leurs basses.</p></div><label className="ad-btn primary">{busy ? "Envoi…" : "+ Ajouter un son"}<input type="file" hidden accept="audio/*" onChange={add} /></label></div>
    <div className="ad-card ad-list">{items.length === 0 && <p className="ad-mut">Aucun son ajouté (les fichiers de public/sounds/ restent actifs).</p>}
      {items.map(x => <div className="item" key={x.publicId}><div><b>{x.name || x.publicId}</b><div className="ad-f" style={{ margin: ".6rem 0" }}><span>Titre affiché dans le lecteur</span><input defaultValue={x.title ?? prettyTitle(x.name)} onBlur={e => api("sounds", "PATCH", { publicId: x.publicId, title: e.target.value }).then(l => { setItems(l); say("Titre enregistré"); }).catch(er => say(er.message, "err"))} /></div><audio src={x.url} controls preload="none" style={{ height: 32 }} /></div>
        <button className="ad-btn sm bad" onClick={() => api("sounds", "DELETE", { publicId: x.publicId }).then(r => { setItems(r.list); say(r.errors?.length ? "Retiré · échec de suppression du fichier" : "Son supprimé"); }).catch(e => say(e.message, "err"))}>Supprimer</button></div>)}</div></>);
}

/* ---------------- Maintenance ---------------- */
function Maintenance({ say }) {
  const [h, setH] = useState(null), [p, setP] = useState(null);
  return (<>
    <div className="ad-head"><div><h1>Maintenance</h1><p>Diagnostic et nettoyage.</p></div></div>
    <section className="ad-card"><h2>Tester Cloudinary</h2><p className="ad-mut">Vérifie la lecture et la création (envoie un pixel de test, supprimé aussitôt) dans le dossier klin-studio.</p>
      <button className="ad-btn" onClick={() => api("health").then(setH).catch(e => say(e.message, "err"))}>Lancer le test</button>
      {h && <p>Cloud <b>{h.cloud}</b> · lecture {h.read ? "✅" : "❌"} · création {h.create ? "✅" : "❌"}{h.error && <><br /><span style={{ color: "var(--bad)" }}>{h.error}</span></>}</p>}</section>
    <section className="ad-card"><h2>Purger les médias orphelins</h2><p className="ad-mut">Supprime les fichiers Cloudinary non rattachés à un projet (envois abandonnés) et rejoue les suppressions échouées.</p>
      <button className="ad-btn" onClick={() => api("purge", "POST").then(r => { setP(r); say("Purge terminée"); }).catch(e => say(e.message, "err"))}>Lancer la purge</button>
      {p && <p>{p.deleted} supprimé(s) · {p.errors.length} erreur(s) · {p.failed} en attente de nouvel essai</p>}</section></>);
}
