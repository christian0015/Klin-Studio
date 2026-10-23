import "@fontsource/tenor-sans/400.css";
import "@fontsource/jost/300.css";
import "@fontsource/jost/400.css";
import "@fontsource/playfair-display/400.css";
import "@fontsource/cormorant-garamond/400.css";
import "@fontsource/cormorant-garamond/400-italic.css";
import "@fontsource/great-vibes/400.css";
import "../globals.css";
import Link from "next/link";
import { notFound } from "next/navigation";
import AudioPlayer from "@/components/AudioPlayer";
import MenuRod from "@/components/MenuRod";
import RevealRoot from "@/components/RevealRoot";
import Smooth from "@/components/Smooth";
import { LANGS, getT, getSounds } from "@/lib/content";
import { orgLd, SITE } from "@/lib/seo";
export const metadata = { metadataBase: new URL(SITE()), ...(process.env.GOOGLE_SITE_VERIFICATION ? { verification: { google: process.env.GOOGLE_SITE_VERIFICATION } } : {}) };
export const generateStaticParams = () => LANGS.map(lang => ({ lang }));
export default async function Layout({ children, params }) {
  const { lang } = await params; if (!LANGS.includes(lang)) notFound();
  const t = await getT(lang), other = lang === "fr" ? "en" : "fr", c = t.contact;
  return (
    <html lang={lang} suppressHydrationWarning><head><script dangerouslySetInnerHTML={{ __html: "document.documentElement.classList.add('js')" }} /></head><body>
      <MenuRod lang={lang} other={other} menuLabel={t.ui.menu} items={[["", t.ui.home], ...Object.entries(t.nav)]} />
      {children}
      <footer className="foot"><div className="foot-in">
        <div><b className="ty"><Link href={`/${lang}`} aria-label={`Klin Studio — ${t.ui.home}`}>Klin Studio</Link></b><p>{t.tagline}</p></div>
        <nav aria-label="Footer">{Object.entries(t.nav).map(([k, v]) => <Link key={k} href={`/${lang}/${k}`}>{v}</Link>)}</nav>
        <div className="foot-c">{c.email && <a href={`mailto:${c.email}`}>{c.email}</a>}{c.phone && <a href={`tel:${c.phone.replace(/\s/g, "")}`}>{c.phone}</a>}<span>{c.city}</span></div></div>
        <small>© {new Date().getFullYear()} Klin Studio</small></footer>
      <RevealRoot /><Smooth />
      <AudioPlayer tracks={await getSounds()} lang={lang} t={t.sound} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgLd()) }} />
    </body></html>
  );
}
