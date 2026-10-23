"use client";
// Tige de menu : fine tige verticale avec point de progression ; ouvre un panneau plein écran (liens toujours présents dans le HTML)
import { useState, useEffect } from "react";
import Link from "next/link";
export default function MenuRod({ items, lang, other, menuLabel }) {
  const [open, setOpen] = useState(false), [p, setP] = useState(0);
  useEffect(() => {
    const on = () => { const m = document.documentElement.scrollHeight - innerHeight; setP(m > 0 ? scrollY / m : 0); }, k = e => e.key === "Escape" && setOpen(false);
    on(); addEventListener("scroll", on, { passive: true }); addEventListener("keydown", k);
    return () => { removeEventListener("scroll", on); removeEventListener("keydown", k); };
  }, []);
  return (
    <>
      <button className="rod" aria-expanded={open} aria-label="Menu" onClick={() => setOpen(!open)}><i style={{ "--p": p }} /><span>{open ? "×" : menuLabel || "Menu"}</span></button>
      <nav className={"sheet" + (open ? " open" : "")} aria-label="Menu" onClick={() => setOpen(false)}>
        {items.map(([k, v]) => <Link key={k || "home"} href={`/${lang}${k ? "/" + k : ""}`}>{v}</Link>)}
        <Link href={`/${other}`} hrefLang={other}>{other.toUpperCase()}</Link>
      </nav>
    </>
  );
}
