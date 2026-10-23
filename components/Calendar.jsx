"use client";
// Calendrier de rendez-vous : mois navigable, jours ouvrés (J+1 → J+60), puis créneaux horaires (heure de Casablanca)
import { useState } from "react";
import { SLOTS } from "@/lib/options";
const pad = n => String(n).padStart(2, "0"), key = (y, m, d) => `${y}-${pad(m + 1)}-${pad(d)}`;
export default function Calendar({ value, onChange, taken = [], lang = "fr" }) {
  const now = new Date(), start = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1), end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 60);
  const [day, setDay] = useState(value ? value.slice(0, 10) : ""), [view, setView] = useState(() => new Date(start.getFullYear(), start.getMonth(), 1));
  const y = view.getFullYear(), m = view.getMonth(), first = (new Date(y, m, 1).getDay() + 6) % 7, n = new Date(y, m + 1, 0).getDate();
  const cells = [...Array(first).fill(null), ...Array.from({ length: n }, (_, i) => i + 1)], loc = lang === "en" ? "en-US" : "fr-FR";
  const ok = d => { const dt = new Date(y, m, d), wd = dt.getDay(); return dt >= start && dt <= end && wd !== 0 && wd !== 6; };
  const wk = [...Array(7)].map((_, i) => new Date(2024, 0, 1 + i).toLocaleDateString(loc, { weekday: "narrow" })), tk = new Set(taken);
  const canPrev = y > start.getFullYear() || m > start.getMonth(), canNext = y < end.getFullYear() || m < end.getMonth();
  return (
    <div className="cal">
      <div className="cal-h"><button type="button" aria-label="‹" disabled={!canPrev} onClick={() => setView(new Date(y, m - 1, 1))}>‹</button><b>{view.toLocaleDateString(loc, { month: "long", year: "numeric" })}</b><button type="button" aria-label="›" disabled={!canNext} onClick={() => setView(new Date(y, m + 1, 1))}>›</button></div>
      <div className="cal-g">{wk.map((w, i) => <span className="cal-w" key={i}>{w}</span>)}
        {cells.map((d, i) => d ? <button type="button" key={i} className={"cal-d" + (key(y, m, d) === day ? " on" : "")} disabled={!ok(d)} onClick={() => { setDay(key(y, m, d)); onChange(""); }}>{d}</button> : <span key={i} />)}</div>
      {day && <div className="slots">{SLOTS.map(s => <button type="button" key={s} className={"slot" + (value === `${day}T${s}` ? " on" : "")} disabled={tk.has(`${day}T${s}`)} onClick={() => onChange(`${day}T${s}`)}>{s}</button>)}</div>}
    </div>
  );
}
