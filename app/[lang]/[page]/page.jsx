import { notFound } from "next/navigation";
import Arrow from "@/components/Arrow";
import Art from "@/components/Art";
import { R } from "@/components/R";
import BookingForm from "@/components/BookingForm";
import { Mist, Hero, Cta } from "@/components/ui";
import { getT, PAGES } from "@/lib/content";
import { meta, crumbLd, faqLd } from "@/lib/seo";
const ART = { services: "silk", studio: "stone", contact: "petal", legal: "eclipse" };
export async function generateMetadata({ params }) { const { lang, page } = await params; if (!PAGES.includes(page)) return {}; const t = await getT(lang); return meta(lang, "/" + page, t.seo[page].title, t.seo[page].desc); }
export default async function Page({ params }) {
  const { lang, page } = await params; if (!PAGES.includes(page)) notFound();
  const t = await getT(lang), c = t[page], ld = [crumbLd(lang, [[t.ui.home, ""], [t.nav[page], "/" + page]]), ...(page === "services" ? [faqLd(c.faq)] : [])];
  const wa = (process.env.STUDIO_WHATSAPP || c.phone || "").replace(/\D/g, "");
  return (
    <main className="pg"><Mist /><Hero art={ART[page]} title={c.title} lead={c.lead} />
      {page === "services" && <>
        <div className="prose">{c.text.map((x, i) => <R key={i} d={i * 0.1}>{x}</R>)}</div>
        <section className="sect"><R as="h2" className="k ty">{c.offersTitle}</R><div className="cardg">{c.offers.map((o, i) => <div className="card rv" style={{ "--d": (i % 3) * 0.1 + "s" }} key={i}><Art name={o.art} /><h3>{o.t}</h3><p>{o.d}</p></div>)}</div></section>
        <section className="sect"><R as="h2" className="k ty">{c.stepsTitle}</R><ol className="tl">{c.steps.map((s, i) => <li className="rv" key={i}><b>{s.t}</b>{s.d}</li>)}</ol></section>
        <section className="sect faq"><R as="h2" className="k ty">{c.faqTitle}</R>{c.faq.map(([q, a]) => <details key={q} className="rv"><summary>{q}</summary><p>{a}</p></details>)}</section>
        <Cta c={c.cta} lang={lang} /></>}
      {page === "studio" && <>
        <div className="prose">{c.text.map((x, i) => <R key={i} d={i * 0.1}>{x}</R>)}</div>
        <section className="sect"><R as="h2" className="k ty">{c.valuesTitle}</R><div className="cardg">{c.values.map((v, i) => <div className="card rv" style={{ "--d": i * 0.1 + "s" }} key={i}><h3>{v.t}</h3><p>{v.d}</p></div>)}</div></section>
        <section className="sect"><div className="card person rv"><span className="mono">{c.person.t[0]}</span><div><h3>{c.person.t}</h3><small className="k">{c.person.r}</small><p>{c.person.d}</p></div></div></section>
        <Cta c={c.cta} lang={lang} /></>}
      {page === "contact" && <div className="sect two rev">
        <div><R>{c.text[0]}</R><R as="h2" className="k ty">{c.stepsTitle}</R><ol className="tl">{c.steps.map((s, i) => <li className="rv" key={i}><b>{s.t}</b>{s.d}</li>)}</ol>
          <div className="card info rv" style={{ marginTop: "1.4rem" }}><h3>{c.infoTitle}</h3>
            {c.email && <a href={`mailto:${c.email}`}>{c.email}</a>}{c.phone && <a href={`tel:${c.phone.replace(/\s/g, "")}`}>{c.phone}</a>}{wa && <a href={`https://wa.me/${wa}`} target="_blank" rel="noopener">WhatsApp <Arrow dir="ne" /></a>}
            <span>{c.hours}</span><span className="k">{c.city}</span></div></div>
        <BookingForm lang={lang} t={t.form} /></div>}
      {page === "legal" && <div className="prose"><R>{c.text[0]}</R>{c.sections.map((s, i) => <section key={i} className="rv"><h2>{s.t}</h2><p>{s.d}</p></section>)}</div>}
      {ld.map((l, i) => <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(l) }} />)}
    </main>
  );
}
