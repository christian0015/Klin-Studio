import Link from "next/link";
import Arrow from "@/components/Arrow";
import { R } from "@/components/R";
import { Mist, Hero } from "@/components/ui";
import { getT, getProjects, cld } from "@/lib/content";
import { meta, crumbLd, SITE } from "@/lib/seo";
export async function generateMetadata({ params }) { const { lang } = await params, t = await getT(lang); return meta(lang, "/blog", t.seo.blog.title, t.seo.blog.desc); }
export default async function Blog({ params }) {
  const { lang } = await params, t = await getT(lang), posts = await getProjects(true), dt = d => new Date(d).toLocaleDateString(lang === "fr" ? "fr-FR" : "en-US", { year: "numeric", month: "long", day: "numeric" });
  const ld = [{ "@context": "https://schema.org", "@type": "Blog", name: t.blog.title, url: `${SITE()}/${lang}/blog`, inLanguage: lang, blogPost: posts.map(p => ({ "@type": "BlogPosting", headline: p.title[lang], url: `${SITE()}/${lang}/blog/${p.slug}`, datePublished: p.createdAt, dateModified: p.updatedAt, image: p.media?.[0]?.url })) }, crumbLd(lang, [[t.ui.home, ""], ["Blog", "/blog"]])];
  return (
    <main className="pg"><Mist /><Hero art="ripple" title={t.blog.title} lead={t.blog.text[0]} />
      {posts.length === 0 ? <R className="k">{t.blog.empty}</R> : <div className="cardg">{posts.map((p, i) => { const img = cld(p.media.find(m => m.type !== "video")?.url, "f_auto,q_auto,w_720,h_450,c_fill"); return (
        <Link key={p.slug} href={`/${lang}/blog/${p.slug}`} className="card pc rv" style={{ "--d": (i % 3) * 0.1 + "s" }}>
          <div className="pc-i">{img ? <img src={img} alt={p.title[lang]} loading="lazy" decoding="async" /> : <span />}</div>
          <small className="k">{t.project[p.origin === "client" ? "client" : "personal"]} · {dt(p.createdAt)}</small><h3>{p.title[lang]}</h3><p>{p.summary?.[lang]}</p><span className="k">{t.project.read} <Arrow dir="right" /></span></Link>); })}</div>}
      {ld.map((l, i) => <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(l) }} />)}
    </main>
  );
}
