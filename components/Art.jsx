// Dessins au trait (SVG) liés à l'univers : éclipse, soie, ondes, flacon, pétales, pierre. Tracé animé quand visible.
const A = {
  eclipse: [["path", { d: "M30 100a70 70 0 1 0 140 0a70 70 0 1 0 -140 0" }], ["path", { d: "M100 30A70 70 0 0 1 100 170A50 70 0 0 0 100 30Z" }], ["path", { d: "M52 40A80 80 0 0 1 168 62" }], ["path", { d: "M20 184H180" }]],
  silk: [["path", { d: "M10 140C50 40 90 190 130 110S190 40 190 70" }], ["path", { d: "M10 150C50 50 90 200 130 120S190 50 190 80" }], ["path", { d: "M10 160C50 60 90 210 130 130S190 60 190 90" }], ["path", { d: "M10 140L10 160M190 70L190 90" }]],
  ripple: [["path", { d: "M100 28C100 28 78 62 78 80a22 22 0 0 0 44 0C122 62 100 28 100 28Z" }], ["ellipse", { cx: 100, cy: 140, rx: 22, ry: 6 }], ["ellipse", { cx: 100, cy: 140, rx: 44, ry: 12 }], ["ellipse", { cx: 100, cy: 140, rx: 68, ry: 19 }], ["ellipse", { cx: 100, cy: 140, rx: 90, ry: 26 }]],
  flacon: [["rect", { x: 58, y: 92, width: 84, height: 90, rx: 18 }], ["rect", { x: 68, y: 102, width: 64, height: 70, rx: 12 }], ["rect", { x: 88, y: 72, width: 24, height: 20 }], ["rect", { x: 80, y: 36, width: 40, height: 36, rx: 6 }], ["path", { d: "M100 36V24M80 130H120" }]],
  petal: [["path", { d: "M100 170C60 150 50 100 100 40C150 100 140 150 100 170Z" }], ["path", { d: "M100 170C50 165 20 120 40 80C75 95 95 130 100 170Z" }], ["path", { d: "M100 170C150 165 180 120 160 80C125 95 105 130 100 170Z" }], ["path", { d: "M40 178Q100 196 160 178" }]],
  stone: [["path", { d: "M20 170L50 120L78 128L104 82L132 104L150 90L182 170Z" }], ["path", { d: "M50 120L70 170M104 82L96 170M132 104L124 170M78 128L96 150" }], ["path", { d: "M10 178H190" }]],
};
export default function Art({ name, className = "" }) {
  return (
    <svg className={`art ${className}`} viewBox="0 0 200 200" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {(A[name] || []).map(([Tag, p], i) => <Tag key={i} {...p} pathLength="1" className="d" style={{ "--k": i }} vectorEffect="non-scaling-stroke" />)}
    </svg>
  );
}
