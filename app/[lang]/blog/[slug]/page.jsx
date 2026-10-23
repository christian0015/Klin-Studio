import { notFound } from "next/navigation";
import Link from "next/link";
import { R } from "@/components/R";
import { Mist, Cta } from "@/components/ui";
import { getProject, getProjects, getT, cld } from "@/lib/content";
import { meta, postLd, crumbLd, SITE } from "@/lib/seo";
import { sanitizeHtml, isHtml } from "@/lib/sanitize";
const og = p => { const i = p.media?.find(m => m.type !== "video"); return i ? cld(i.url, "f_auto,q_auto,w_1200,h_630,c_fill") : undefined; };
export async function generateMetadata({ params }) {
  const { lang, slug } = await params, p = await getProject(slug), t = await getT(lang); if (!p) return {};
  return meta(lang, "/blog/" + slug, `${p.title[lang]} — Klin Studio`, p.summary?.[lang] || t.seo.blog.desc, { type: "article", image: og(p), article: { publishedTime: p.createdAt, modifiedTime: p.updatedAt, authors: ["Christian"] } });
}
export default async function Post({ params }) {
  const { lang, slug } = await params, p = await getProject(slug), t = await getT(lang); if (!p) notFound();
  const secs = ["role", "context", "challenge", "solution", "result"].filter(k => p[k]?.[lang]), body = p.body?.[lang] || "", url = `${SITE()}/${lang}/blog/${p.slug}`;
  const words = [p.summary?.[lang], ...secs.map(k => p[k][lang]), body.replace(/<[^>]+>/g, " ")].join(" ").split(/\s+/).filter(Boolean).length, mins = Math.max(1, Math.ceil(words / 200));
  const date = new Date(p.createdAt).toLocaleDateString(lang === "fr" ? "fr-FR" : "en-US", { year: "numeric", month: "long", day: "numeric" });
  const related = (await getProjects(true)).filter(x => x.slug !== p.slug).slice(0, 2), enc = encodeURIComponent;
  const Media = ({ m, i }) => <figure>{m.type === "video" ? <video src={cld(m.url, "f_auto,q_auto")} autoPlay loop muted playsInline /> : <img src={cld(m.url, "f_auto,q_auto,w_1400")} alt={`${p.title[lang]} — ${i + 1}`} loading={i ? "lazy" : "eager"} decoding="async" fetchPriority={i ? "auto" : "high"} />}</figure>;
  return (
    <main className="pg"><Mist />
      <article className="post-a">
        <nav className="crumb k" aria-label="Breadcrumb"><Link href={`/${lang}`}>{t.ui.home}</Link> / <Link href={`/${lang}/blog`}>Blog</Link></nav>
        <header className="hero2"><div className="k">{t.project[p.origin === "client" ? "client" : "personal"]} · <time dateTime={p.createdAt}>{date}</time> · {mins} {t.project.min}</div>
          <R as="h1" words className="big">{p.title[lang]}</R><R d={0.2} className="lead">{p.summary?.[lang]}</R><div className="k byline">Christian · Klin Studio</div></header>
        {p.media[0] && <Media m={p.media[0]} i={0} />}
        {secs.map(k => <section key={k} className="prose"><h2>{t.project[k]}</h2>{p[k][lang].split(/\n{2,}/).map((x, i) => <p key={i}>{x}</p>)}</section>)}
        {p.media.slice(1).map((m, i) => <Media key={m.publicId} m={m} i={i + 1} />)}
        {body && (isHtml(body) ? <div className="prose" dangerouslySetInnerHTML={{ __html: sanitizeHtml(body) }} /> : <div className="prose">{body.split(/\n{2,}/).map((x, i) => <p key={i}>{x}</p>)}</div>)}
        <div className="share k">{t.project.share} : <a href={`https://www.linkedin.com/sharing/share-offsite/?url=${enc(url)}`} target="_blank" rel="noopener">LinkedIn</a><a href={`https://twitter.com/intent/tweet?url=${enc(url)}&text=${enc(p.title[lang])}`} target="_blank" rel="noopener">X</a><a href={`https://wa.me/?text=${enc(p.title[lang] + " " + url)}`} target="_blank" rel="noopener">WhatsApp</a>
          {p.url && <a className="btn" href={p.url} rel="noopener" target="_blank">{t.project.visit} ↗</a>}</div>
      </article>
      {related.length > 0 && <section className="sect"><R as="h2" className="k ty">{t.project.related}</R><div className="cardg">{related.map(r => <Link key={r.slug} className="card pc" href={`/${lang}/blog/${r.slug}`}><h3>{r.title[lang]}</h3><p>{r.summary?.[lang]}</p><span className="k">{t.project.read} →</span></Link>)}</div></section>}
      <Cta c={{ h: t.project.ctaH, p: t.project.ctaP, b: t.cta }} lang={lang} />
      {[postLd(lang, p, og(p)), crumbLd(lang, [[t.ui.home, ""], ["Blog", "/blog"], [p.title[lang], "/blog/" + p.slug]])].map((l, i) => <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(l) }} />)}
    </main>
  );
}
