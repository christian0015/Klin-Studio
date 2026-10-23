// Métadonnées, hreflang, canonical, Open Graph / Twitter, JSON-LD
export const SITE = () => (process.env.SITE_URL || "http://localhost:3000").replace(/\/$/, "");
export function meta(lang, p, title, description, extra = {}) {
  const u = l => `${SITE()}/${l}${p}`, img = extra.image;
  return {
    title, description, alternates: { canonical: u(lang), languages: { fr: u("fr"), en: u("en"), "x-default": u("en") } },
    openGraph: { type: extra.type || "website", title, description, url: u(lang), siteName: "Klin Studio", locale: lang === "fr" ? "fr_MA" : "en_US", alternateLocale: [lang === "fr" ? "en_US" : "fr_MA"], ...(img ? { images: [{ url: img, width: 1200, height: 630, alt: title }] } : {}), ...(extra.article || {}) },
    twitter: { card: "summary_large_image", title, description, ...(img ? { images: [img] } : {}) },
  };
}
export const orgLd = () => ({ "@context": "https://schema.org", "@type": "ProfessionalService", name: "Klin Studio", url: SITE(), areaServed: "Worldwide", address: { "@type": "PostalAddress", addressLocality: "Casablanca", addressCountry: "MA" }, description: "Immersive websites for fashion & beauty brands", founder: { "@type": "Person", name: "Christian" }, sameAs: (process.env.SAME_AS || "").split(",").filter(Boolean) });
export const postLd = (lang, p, img) => ({ "@context": "https://schema.org", "@type": "BlogPosting", headline: p.title[lang], description: p.summary?.[lang], image: img ? [img] : undefined, datePublished: p.createdAt, dateModified: p.updatedAt, inLanguage: lang,
  author: { "@type": "Person", name: "Christian", worksFor: { "@type": "Organization", name: "Klin Studio" } }, publisher: { "@type": "Organization", name: "Klin Studio", url: SITE() }, mainEntityOfPage: `${SITE()}/${lang}/blog/${p.slug}` });
export const crumbLd = (lang, items) => ({ "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: items.map(([name, path], i) => ({ "@type": "ListItem", position: i + 1, name, item: `${SITE()}/${lang}${path}` })) });
export const faqLd = faq => ({ "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faq.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })) });
