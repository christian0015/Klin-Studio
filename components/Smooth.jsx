"use client";
// Défilement lissé (lerp) : inertie douce sur toute la page ; désactivé si « réduire les animations »
import { useEffect } from "react";
import Lenis from "lenis";
export default function Smooth() {
  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const l = new Lenis({ lerp: 0.085, wheelMultiplier: 0.9, smoothWheel: true }); let id;
    const raf = t => { l.raf(t); id = requestAnimationFrame(raf); }; id = requestAnimationFrame(raf);
    return () => { cancelAnimationFrame(id); l.destroy(); };
  }, []);
  return null;
}
