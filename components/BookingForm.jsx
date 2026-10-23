"use client";
// Assistant de rendez-vous en 3 étapes : 1 projet · 2 budget & délai (optionnel) · 3 coordonnées + calendrier
import { useState, useEffect } from "react";
import Calendar from "./Calendar";
import { OPT } from "@/lib/options";
export const fmtSlot = (s, lang) => (s ? new Date(s + ":00Z").toLocaleString(lang === "en" ? "en-US" : "fr-FR", { timeZone: "UTC", weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" }) : "");
export default function BookingForm({ lang, t }) {
  const li = lang === "en" ? 2 : 1, ri = lang === "en" ? 4 : 3;
  const [s, setS] = useState(0), [d, setD] = useState({}), [st, setSt] = useState("idle"), [err, setErr] = useState(""), [taken, setTaken] = useState([]);
  const load = () => fetch("/api/booking").then(r => r.json()).then(j => setTaken(j.taken || [])).catch(() => {});
  useEffect(() => { load(); }, []);
  const set = (k, v) => setD(x => ({ ...x, [k]: v }));
  const Chip = ({ k, o, rg }) => <button type="button" className={"chip" + (d[k] === o[0] ? " on" : "")} aria-pressed={d[k] === o[0]} onClick={() => set(k, d[k] === o[0] ? "" : o[0])}>{rg ? <b>{o[li]}</b> : o[li]}{rg && <small>{o[ri]}</small>}</button>;
  const go = n => { setErr(""); setS(n); const el = document.getElementById("wiz"); if (el && el.getBoundingClientRect().top < 0) el.scrollIntoView({ behavior: "smooth", block: "start" }); };
  const digits = (d.phone || "").replace(/\D/g, ""), okMail = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(d.email || "");
  async function send() {
    if ((d.name || "").trim().length < 2) return setErr(t.name + " ?");
    if (!okMail && digits.length < 6) return setErr(t.need);
    setSt("sending"); setErr("");
    try { const r = await fetch("/api/booking", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...d, lang }) }); if (r.ok) return setSt("ok"); if (r.status === 409) { setErr(t.taken); set("slot", ""); load(); } else setErr(t.err); } catch { setErr(t.err); }
    setSt("idle");
  }
  if (st === "ok") return (
    <div className="wiz done" role="status">
      <svg viewBox="0 0 60 60" className="art" style={{ "--dp": 1, maxWidth: 70 }} fill="none" stroke="currentColor"><circle className="d" cx="30" cy="30" r="26" pathLength="1" style={{ "--k": 0 }} /><path className="d" d="M18 31l8 8 16-18" pathLength="1" style={{ "--k": 2 }} /></svg>
      <h3 className="wq">{t.ok}</h3><p>{t.okp}</p>{d.slot && <p>{t.chosen} : <b>{fmtSlot(d.slot, lang)}</b></p>}
    </div>);
  return (
    <div className="wiz" id="wiz">
      <ol className="stp">{t.steps.map((l, i) => <li key={i} className={i === s ? "on" : i < s ? "done" : ""}>{l}</li>)}</ol>
      {s === 0 && <div className="wstep" key="0">
        <p className="wq">{t.q1}</p><div className="chips">{OPT.type.map(o => <Chip key={o[0]} k="type" o={o} />)}</div>
        <p className="wq">{t.q1s}</p><div className="chips">{OPT.sector.map(o => <Chip key={o[0]} k="sector" o={o} />)}</div>
        <div className="nav-b"><button type="button" className="btn" disabled={!d.type || !d.sector} onClick={() => go(1)}>{t.next}</button></div></div>}
      {s === 1 && <div className="wstep" key="1">
        <p className="wq">{t.q2} <small>{t.optional}</small></p><p className="wh">{t.q2h}</p><div className="cards">{OPT.budget.map(o => <Chip key={o[0]} k="budget" o={o} rg />)}</div>
        <p className="wq">{t.q2d} <small>{t.optional}</small></p><div className="cards">{OPT.deadline.map(o => <Chip key={o[0]} k="deadline" o={o} rg />)}</div>
        <div className="nav-b"><button type="button" className="btn ghost" onClick={() => go(0)}>{t.back}</button><button type="button" className="btn" onClick={() => go(2)}>{t.next}</button><button type="button" className="lnk" onClick={() => { setD(x => ({ ...x, budget: "", deadline: "" })); go(2); }}>{t.skip}</button></div></div>}
      {s === 2 && <div className="wstep" key="2">
        <p className="wq">{t.q3}</p>
        <div className="wf"><label>{t.name}<input autoComplete="name" value={d.name || ""} onChange={e => set("name", e.target.value)} /></label>
          <div className="wf2"><label>{t.email}<input type="email" autoComplete="email" inputMode="email" value={d.email || ""} onChange={e => set("email", e.target.value)} /></label><label>{t.phone}<input type="tel" autoComplete="tel" inputMode="tel" value={d.phone || ""} onChange={e => set("phone", e.target.value)} /></label></div>
          <p className="wh">{t.or}</p>
          {digits.length >= 6 && <div><p className="wh" style={{ margin: "0 0 .5rem" }}>{t.whatsapp}</p><div className="chips"><button type="button" className={"chip" + (d.whatsapp === "yes" ? " on" : "")} onClick={() => set("whatsapp", "yes")}>{t.yes}</button><button type="button" className={"chip" + (d.whatsapp === "no" ? " on" : "")} onClick={() => set("whatsapp", "no")}>{t.no}</button></div></div>}</div>
        <p className="wq">{t.q3c} <small>{t.optional}</small></p><p className="wh">{t.q3ch}</p>
        <Calendar lang={lang} value={d.slot || ""} onChange={v => set("slot", v)} taken={taken} />
        {d.slot && <p className="wh">{t.chosen} : <b>{fmtSlot(d.slot, lang)}</b> <button type="button" className="lnk" onClick={() => set("slot", "")}>{t.clear}</button></p>}
        <div className="wf" style={{ marginTop: "1.2rem" }}><label>{t.message}<textarea rows="3" value={d.message || ""} onChange={e => set("message", e.target.value)} /></label>
          <input className="hp" tabIndex="-1" autoComplete="off" aria-hidden="true" value={d.website || ""} onChange={e => set("website", e.target.value)} /></div>
        <p className="wh">{t.consent}</p>{err && <p role="alert" className="werr">{err}</p>}
        <div className="nav-b"><button type="button" className="btn ghost" onClick={() => go(1)}>{t.back}</button><button type="button" className="btn" disabled={st === "sending"} onClick={send}>{st === "sending" ? t.sending : t.send}</button></div></div>}
    </div>
  );
}
