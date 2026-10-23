import { SITE } from "@/lib/seo";
import { LANGS, PAGES, getProjects } from "@/lib/content";
export default async function sitemap() {
  const ps = await getProjects(true), items = [["", null], ["/blog", null], ...PAGES.map(p => ["/" + p, null]), ...ps.map(p => ["/blog/" + p.slug, p.updatedAt])];
  return items.flatMap(([p, m]) => LANGS.map(l => ({ url: `${SITE()}/${l}${p}`, lastModified: m ? new Date(m) : undefined, alternates: { languages: Object.fromEntries(LANGS.map(x => [x, `${SITE()}/${x}${p}`])) } })));
}
