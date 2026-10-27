"use client";
// Zone cliquable INVISIBLE sur le coin haut droite de l'intro (« PLUS QU'UN SITE WEB ») : ouvre le menu comme le font
// les visiteurs habitués au menu en haut à droite. Aucun changement visuel ; disparaît dès que le scroll commence
// (la tige latérale s'anime alors et prend le relais). Pour la retirer : supprimer <HeroMenuHit /> dans app/[lang]/page.jsx.
import { useEffect, useState } from "react";
export default function HeroMenuHit() {
  const [on, setOn] = useState(true);
  useEffect(() => {
    const f = () => setOn(scrollY < innerHeight * 0.25);
    f(); addEventListener("scroll", f, { passive: true }); return () => removeEventListener("scroll", f);
  }, []);
  if (!on) return null;
  return <div aria-hidden="true" onClick={() => dispatchEvent(new Event("klin:menu"))} style={{ position: "fixed", top: 0, right: 0, width: "min(260px,45vw)", height: "clamp(96px,17vh,140px)", zIndex: 7, cursor: "pointer", WebkitTapHighlightColor: "transparent" }} />;
}
