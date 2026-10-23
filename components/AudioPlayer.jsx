"use client";
// Son proposé (aucun autoplay), lecture aléatoire sans répétition immédiate, pause/suivant, titre qui défile ; choix mémorisé
import { useRef, useState, useEffect } from "react";
import { attachAnalyser, resumeAudio } from "@/lib/audio";
import { prettyTitle } from "@/lib/options";
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
  const a = useRef(), last = useRef(-1), [st, setSt] = useState("idle"), [title, setTitle] = useState("");
  const L = t || { ask: "Activer le son ?", yes: "Oui", no: "Non" };
  useEffect(() => { if (!tracks.length) return; setSt(localStorage.getItem("snd") === "no" ? "no" : "ask"); }, [tracks.length]);
  const pick = () => {
    const el = a.current; let i = Math.floor(Math.random() * tracks.length); if (tracks.length > 1 && i === last.current) i = (i + 1) % tracks.length; last.current = i;
    const o = typeof tracks[i] === "string" ? { url: tracks[i], title: prettyTitle(tracks[i].split("/").pop()) } : tracks[i];
    el.src = o.url; setTitle(o.title || ""); return el.play();
  };
  const start = async () => { localStorage.setItem("snd", "yes"); attachAnalyser(a.current); resumeAudio(); await pick().catch(() => {}); setSt("play"); };
  const toggle = () => { const el = a.current; if (el.paused) { resumeAudio(); el.play(); setSt("play"); } else { el.pause(); setSt("pause"); } };
  if (!tracks.length) return null;
  return (
    <div className="audio">
      <audio ref={a} crossOrigin="anonymous" onEnded={pick} preload="none" />
      {st === "ask" && <><span>{L.ask} </span><button onClick={start}>{L.yes}</button><button onClick={() => { localStorage.setItem("snd", "no"); setSt("no"); }}>{L.no}</button></>}
      {(st === "play" || st === "pause") && <div className="audio-col">
        {title && <div className="mq-line"><span className="mq-note" aria-hidden="true">♪</span><Marquee text={title} playing={st === "play"} /></div>}
        <div className="audio-row"><button onClick={toggle}>{st === "play" ? "❚❚" : "▶"}</button><button onClick={pick}>⏭</button></div></div>}
      {st === "no" && <button onClick={() => { localStorage.removeItem("snd"); setSt("ask"); }}>♪</button>}
    </div>
  );
}
