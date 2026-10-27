"use client";
// Son proposé via une fenêtre (aucun autoplay), lecture aléatoire sans répétition immédiate, pause/suivant en icônes SVG,
// titre qui défile ; choix mémorisé. Le son continue en arrière-plan ; l'état suit l'élément audio (interruptions système).
import { useRef, useState, useEffect } from "react";
import { attachAnalyser, resumeAudio } from "@/lib/audio";
import { prettyTitle } from "@/lib/options";
const S = { width: 16, height: 16, viewBox: "0 0 24 24", "aria-hidden": "true" };
const Ico = { // icônes dessinées : aucun caractère emoji, rendu identique partout (iOS compris)
  play: <svg {...S}><path d="M7 4.5v15l13-7.5z" fill="currentColor" /></svg>,
  pause: <svg {...S}><rect x="6" y="4.5" width="4" height="15" rx="1" fill="currentColor" /><rect x="14" y="4.5" width="4" height="15" rx="1" fill="currentColor" /></svg>,
  next: <svg {...S}><path d="M5 5v14l10-7z" fill="currentColor" /><rect x="17" y="5" width="2.6" height="14" rx="1" fill="currentColor" /></svg>,
  note: <svg {...S} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18V6l10-2v12" /><circle cx="7" cy="18" r="2.2" /><circle cx="17" cy="16" r="2.2" /></svg>,
  head: <svg width="26" height="26" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"><path d="M4 15v-3a8 8 0 0 1 16 0v3" /><path d="M4 15a1.5 1.5 0 0 1 1.5-1.5H7v6H5.5A1.5 1.5 0 0 1 4 18z" /><path d="M20 15a1.5 1.5 0 0 0-1.5-1.5H17v6h1.5A1.5 1.5 0 0 0 20 18z" /></svg>,
};
function Marquee({ text, playing }) { // défile seulement si le titre dépasse la fenêtre ; se fige en pause
  const box = useRef(), m = useRef(), [run, setRun] = useState(false);
  useEffect(() => { setRun((m.current?.offsetWidth || 0) > (box.current?.clientWidth || 0) + 2); }, [text]);
  return (
    <div className={"mq" + (run ? " is-run" : "")} ref={box} aria-label={text}>
      <span className="mq-m" ref={m} aria-hidden="true">{text}</span>
      <span className={"mq-t" + (run ? " run" : "")} style={run ? { animationDuration: Math.max(7, text.length * 0.45) + "s", animationPlayState: playing ? "running" : "paused" } : undefined}>
        <span>{text}</span>{run && <span aria-hidden="true">{text}</span>}
      </span>
    </div>
  );
}
export default function AudioPlayer({ tracks = [], lang, t }) {
  const a = useRef(), last = useRef(-1), yes = useRef(), [st, setSt] = useState("idle"), [show, setShow] = useState(false), [title, setTitle] = useState("");
  const L = { title: "Mettez l'ambiance", text: "Activer l'ambiance sonore pour une expérience complète", yes: "Activer", no: "Non merci", ask: "Activer le son ?", play: "Lecture", pause: "Pause", next: "Piste suivante", ...(t || {}) };
  useEffect(() => { if (!tracks.length) return; setSt(localStorage.getItem("snd") === "no" ? "no" : "ask"); }, [tracks.length]);
  useEffect(() => { // la fenêtre apparaît juste après le premier affichage de l'intro
    if (st !== "ask") { setShow(false); return; }
    const id = setTimeout(() => setShow(true), 1200); return () => clearTimeout(id);
  }, [st]);
  useEffect(() => { // fenêtre ouverte : pas de scroll derrière, focus sur « Activer », Échap = fermer
    if (!show) return;
    const root = document.documentElement, prev = root.style.overflow; root.style.overflow = "hidden"; yes.current?.focus();
    const k = e => e.key === "Escape" && setSt("no"); addEventListener("keydown", k);
    return () => { root.style.overflow = prev; removeEventListener("keydown", k); };
  }, [show]);
  const pick = () => {
    const el = a.current; let i = Math.floor(Math.random() * tracks.length); if (tracks.length > 1 && i === last.current) i = (i + 1) % tracks.length; last.current = i;
    const o = typeof tracks[i] === "string" ? { url: tracks[i], title: prettyTitle(tracks[i].split("/").pop()) } : tracks[i];
    el.src = o.url; setTitle(o.title || ""); return el.play();
  };
  const start = async () => { localStorage.setItem("snd", "yes"); attachAnalyser(a.current); resumeAudio(); await pick().catch(() => {}); setSt("play"); };
  const refuse = () => { localStorage.setItem("snd", "no"); setSt("no"); };
  const toggle = () => { const el = a.current; if (el.paused) { resumeAudio(); el.play(); setSt("play"); } else { el.pause(); setSt("pause"); } };
  if (!tracks.length) return null;
  return (
    <>
      <div className="audio">
        <audio ref={a} crossOrigin="anonymous" preload="none" onEnded={pick}
          onPlay={() => setSt(s => (s === "pause" ? "play" : s))} onPause={e => { if (!e.currentTarget.ended) setSt(s => (s === "play" ? "pause" : s)); }} />
        {(st === "play" || st === "pause") && <div className="audio-col">
          {title && <div className="mq-line"><span className="mq-note">{Ico.note}</span><Marquee text={title} playing={st === "play"} /></div>}
          <div className="audio-row"><button onClick={toggle} aria-label={st === "play" ? L.pause : L.play}>{st === "play" ? Ico.pause : Ico.play}</button><button onClick={pick} aria-label={L.next}>{Ico.next}</button></div></div>}
        {st === "no" && <button className="audio-re" onClick={() => { localStorage.removeItem("snd"); setSt("ask"); }} aria-label={L.ask}>{Ico.note}</button>}
      </div>
      {st === "ask" && show && (
        <div className="snd-ov" role="dialog" aria-modal="true" aria-labelledby="snd-t" data-lenis-prevent onClick={e => e.target === e.currentTarget && setSt("no")}>
          <div className="snd-card">
            <div className="snd-ico">{Ico.head}</div>
            <h2 id="snd-t" className="ty">{L.title}</h2><p>{L.text}</p>
            <div className="snd-b"><button ref={yes} className="snd-y" onClick={start}>{L.yes}</button><button className="snd-n" onClick={refuse}>{L.no}</button></div>
          </div>
        </div>)}
    </>
  );
}
