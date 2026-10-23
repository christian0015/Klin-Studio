"use client";
// Mini traitement de texte : styles de titre, gras/italique/souligné, polices (dont calligraphiques), tailles, couleurs, listes, alignement, liens
import { useRef } from "react";
const FONTS = ["Jost", "Tenor Sans", "Playfair Display", "Cormorant Garamond", "Great Vibes"], SIZES = [["2", "Petit"], ["3", "Normal"], ["5", "Grand"], ["6", "Très grand"], ["7", "Titre"]];
export default function RichEditor({ value, onChange }) {
  const ref = useRef(), init = useRef(value || ""), sel = useRef(null);
  const save = () => { const s = getSelection(); if (s.rangeCount && ref.current?.contains(s.anchorNode)) sel.current = s.getRangeAt(0).cloneRange(); };
  const cmd = (c, v = null) => { ref.current.focus(); if (sel.current) { const s = getSelection(); s.removeAllRanges(); s.addRange(sel.current); } document.execCommand("styleWithCSS", false, true); document.execCommand(c, false, v); save(); onChange(ref.current.innerHTML); };
  const Bt = ({ c, v, children, title }) => <button type="button" title={title} onMouseDown={e => { e.preventDefault(); cmd(c, v); }}>{children}</button>;
  return (
    <div className="ad-rt">
      <div className="ad-rt-bar">
        <select defaultValue="" onChange={e => { if (e.target.value) cmd("formatBlock", e.target.value); e.target.value = ""; }}><option value="" disabled>Style</option><option value="<p>">Paragraphe</option><option value="<h2>">Titre</option><option value="<h3>">Sous-titre</option><option value="<blockquote>">Citation</option></select>
        <select defaultValue="" onChange={e => { if (e.target.value) cmd("fontName", e.target.value); e.target.value = ""; }}><option value="" disabled>Police</option>{FONTS.map(f => <option key={f} value={f} style={{ fontFamily: f }}>{f}</option>)}</select>
        <select defaultValue="" onChange={e => { if (e.target.value) cmd("fontSize", e.target.value); e.target.value = ""; }}><option value="" disabled>Taille</option>{SIZES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
        <Bt c="bold" title="Gras"><b>G</b></Bt><Bt c="italic" title="Italique"><i>I</i></Bt><Bt c="underline" title="Souligné"><u>S</u></Bt>
        <label className="ad-rt-c" title="Couleur du texte">A<input type="color" defaultValue="#e8cfa4" onChange={e => cmd("foreColor", e.target.value)} /></label>
        <Bt c="insertUnorderedList" title="Liste à puces">• Liste</Bt><Bt c="insertOrderedList" title="Liste numérotée">1. Liste</Bt>
        <Bt c="justifyLeft" title="Aligner à gauche">⇤</Bt><Bt c="justifyCenter" title="Centrer">↔</Bt>
        <button type="button" title="Lien" onMouseDown={e => { e.preventDefault(); const u = prompt("Adresse du lien (https://…)"); if (u) cmd("createLink", u); }}>🔗</button>
        <Bt c="removeFormat" title="Effacer la mise en forme">✕ Format</Bt><Bt c="undo" title="Annuler">↶</Bt><Bt c="redo" title="Rétablir">↷</Bt>
      </div>
      <div ref={ref} className="ad-rt-ed" contentEditable suppressContentEditableWarning dangerouslySetInnerHTML={{ __html: init.current }}
        onInput={() => onChange(ref.current.innerHTML)} onKeyUp={save} onMouseUp={save} onBlur={save}
        onPaste={e => { e.preventDefault(); document.execCommand("insertText", false, e.clipboardData.getData("text/plain")); }} />
    </div>
  );
}
