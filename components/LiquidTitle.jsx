// Titre « verre liquide » : un film fin suit les contours exacts des lettres, un reflet dispersé (R/V/B décalés) les parcourt,
// des gouttelettes suintent le long du tracé. SVG + CSS pur (aucun JS), rendu serveur possible.
export default function LiquidTitle({ text = "KLIN" }) {
  return (
    <svg className="lw" viewBox="0 0 680 140" aria-hidden="true">
      <defs><text id="lwt" x="364" y="108" textAnchor="middle">{text}</text></defs>
      <use href="#lwt" className="lw-fill" />
      <use href="#lwt" className="lw-film" />
      <use href="#lwt" className="lw-run r" /><use href="#lwt" className="lw-run g" /><use href="#lwt" className="lw-run b" />
      <use href="#lwt" className="lw-drop" />
    </svg>
  );
}
