// Flèches dessinées en SVG (pas de caractères « ↗ → » : sur iOS ils s'affichent en emoji)
export default function Arrow({ dir = "ne" }) {
  const d = { ne: "M7 17L17 7M8 7h9v9", right: "M5 12h14M13 6l6 6-6 6", left: "M19 12H5M11 18l-6-6 6-6" }[dir];
  return <svg className={"arw" + (dir === "left" ? " arw-l" : "")} viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={d} /></svg>;
}
