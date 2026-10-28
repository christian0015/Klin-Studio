import Link from "next/link";
import Arrow from "@/components/Arrow";
import Scene from "@/components/Scene";
import HeroMenuHit from "@/components/HeroMenuHit";
import Art from "@/components/Art";
import { R } from "@/components/R";
import { getT, getProjects, cld } from "@/lib/content";
import { meta } from "@/lib/seo";
export async function generateMetadata({ params }) { const { lang } = await params, t = await getT(lang); return meta(lang, "", t.seo.home.title, t.seo.home.desc); }
export default async function Home({ params }) {
  const { lang } = await params, t = await getT(lang), h = t.home, projects = await getProjects();
  const items = projects.length
    ? projects.map(p => ({ title: p.title[lang], summary: p.summary?.[lang], href: `/${lang}/blog/${p.slug}`, img: cld(p.media.find(m => m.type !== "video")?.url, "f_auto,q_auto,w_1000") || null }))
    : [1, 2, 3].map(() => ({ title: h.soon, summary: "", img: null }));
  const list = items.slice(0, 8);
  return (
    <main>
      <Scene copy={{ tagline: t.tagline, cta: t.cta, href: `/${lang}/contact`, corners: h.corners, story: h.story, hint: h.hint }} images={list.map(i => i.img)} />
      <HeroMenuHit />
      <section className="sr"><h2>{t.seo.home.title}</h2><p>{t.intro}</p><p>{t.tagline}</p></section>
      {/* Parcours épinglé : zoom de l'intro → portail → marche horizontale devant le mur de cuir */}
      <section className="story" data-story style={{ height: `calc(100vh * ${(3.7 + 0.9 * list.length).toFixed(2)})` }}>
        <div className="pin" data-wall>
          <div className="track" data-track>
            <div className="fw lead"><R as="h2" className="k ty">{h.wall}</R></div>
            {list.map((it, i) => (
              <div className="fw" key={i}>
                {it.href ? <Link className="frame" data-frame={i} href={it.href} aria-label={it.title} /> : <div className="frame" data-frame={i} />}
                <div className="cap"><R as="h3" words>{it.title}</R>{it.summary && <R d={0.2}>{it.summary}</R>}{it.href && <R d={0.4}><Link href={it.href}>{t.more} <Arrow dir="right" /></Link></R>}</div>
              </div>
            ))}
            <div className="fw lead"><Link className="k" href={`/${lang}/blog`}>{t.nav.blog} <Arrow dir="right" /></Link></div>
          </div>
        </div>
      </section>
      <section className="sec center"><Art name="eclipse" /><R as="h2" words className="big ty">{h.manifesto.h}</R><R d={0.3}>{h.manifesto.p}</R></section>
      <section className="sec"><R as="h2" className="k ty">{h.services.h}</R>
        <div className="grid3">{h.services.items.map((s, i) => <div key={i}><Art name={s.art} /><R as="h3" className="ty" d={i * 0.15}>{s.t}</R><R d={i * 0.15 + 0.1}>{s.d}</R></div>)}</div>
      </section>
      <section className="sec"><R as="h2" className="k ty">{h.process.h}</R>
        <ol className="steps rv">{h.process.steps.map((s, i) => <li key={i}><b>{s.t}</b>{s.d}</li>)}</ol>
      </section>
      <section className="sec center"><Art name="petal" /><R as="h2" words className="big ty">{h.cta.h}</R><R d={0.3}><Link className="btn" href={`/${lang}/contact`}>{t.cta}</Link></R></section>
    </main>
  );
}
