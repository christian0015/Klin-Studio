// Briques communes des pages intérieures (rendu serveur)
import Link from "next/link";
import Art from "./Art";
import { R } from "./R";
export const Mist = () => <div className="mist" aria-hidden="true" />;
export function Hero({ art, title, lead, kicker }) {
  return <header className="hero2">{art && <Art name={art} />}{kicker && <R className="k">{kicker}</R>}<R as="h1" words className="big">{title}</R>{lead && <R d={0.2} className="lead">{lead}</R>}</header>;
}
export function Cta({ c, lang }) {
  return <section className="band"><Art name="petal" /><R as="h2" words className="big ty">{c.h}</R><R d={0.2}>{c.p}</R><R d={0.3}><Link className="btn" href={`/${lang}/contact`}>{c.b}</Link></R></section>;
}
