"use client";
// Révélations (.rv), tracés SVG et fil de la méthode liés au scroll (--dp), anti-copie basique des médias
import { useEffect } from "react";
export default function RevealRoot() {
  useEffect(() => {
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }), { rootMargin: "0px 0px -8% 0px", threshold: 0.12 });
    let raf = 0;
    const upd = () => { // progression de chaque dessin selon sa position à l'écran (réversible : suit le scroll dans les deux sens)
      raf = 0; const vh = innerHeight;
      document.querySelectorAll(".art,.steps").forEach(el => { const r = el.getBoundingClientRect(); el.style.setProperty("--dp", Math.min(1, Math.max(0, (vh * 0.9 - r.top) / (Math.max(r.height, vh * 0.5) + vh * 0.1))).toFixed(3)); });
    };
    const req = () => { if (!raf) raf = requestAnimationFrame(upd); };
    const scan = () => { document.querySelectorAll(".rv:not(.in)").forEach(el => io.observe(el)); req(); };
    scan(); addEventListener("scroll", req, { passive: true }); addEventListener("resize", req);
    const mo = new MutationObserver(scan); mo.observe(document.body, { childList: true, subtree: true });
    const block = e => { if (e.target.closest?.("img,video,canvas,svg")) e.preventDefault(); };
    addEventListener("contextmenu", block); addEventListener("dragstart", block);
    return () => { io.disconnect(); mo.disconnect(); removeEventListener("scroll", req); removeEventListener("resize", req); removeEventListener("contextmenu", block); removeEventListener("dragstart", block); };
  }, []);
  return null;
}
