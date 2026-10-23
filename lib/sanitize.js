// Assainisseur HTML (liste blanche) pour l'article riche saisi dans l'admin — module pur
const TAGS = new Set(["p", "h2", "h3", "h4", "blockquote", "ul", "ol", "li", "strong", "b", "em", "i", "u", "s", "a", "br", "span", "div", "hr"]);
const FONTS = /^(jost|tenor sans|playfair display|cormorant garamond|great vibes|georgia|serif|sans-serif|cursive)$/i;
function cleanStyle(st) {
  const out = [];
  for (const decl of String(st).split(";")) {
    const [k0, ...r] = decl.split(":"); if (!r.length) continue; const k = k0.trim().toLowerCase(), v = r.join(":").trim();
    if (k === "color" && /^(#[0-9a-f]{3,8}|rgba?\([\d\s,.%]+\)|hsla?\([\d\s,.%deg]+\)|[a-z]+)$/i.test(v)) out.push(`color:${v}`);
    else if (k === "font-family") { const f = v.split(",")[0].replace(/["']/g, "").trim(); if (FONTS.test(f)) out.push(`font-family:'${f}'`); }
    else if (k === "font-size" && /^(xx-small|x-small|small|medium|large|x-large|xx-large|xxx-large|\d{1,2}(\.\d+)?(px|rem|em))$/i.test(v)) out.push(`font-size:${v}`);
    else if (k === "text-align" && /^(left|right|center|justify)$/i.test(v)) out.push(`text-align:${v}`);
    else if (k === "font-weight" && /^(normal|bold|[1-9]00)$/i.test(v)) out.push(`font-weight:${v}`);
    else if (k === "font-style" && /^(normal|italic)$/i.test(v)) out.push(`font-style:${v}`);
    else if (k === "text-decoration" && /^(none|underline|line-through)$/i.test(v)) out.push(`text-decoration:${v}`);
  }
  return out.join(";");
}
export function sanitizeHtml(html) {
  let s = String(html || "").slice(0, 200000);
  s = s.replace(/<!--[\s\S]*?-->/g, "").replace(/<(script|style|iframe|object|embed|svg|math)[\s\S]*?<\/\1\s*>/gi, "");
  return s.replace(/<\/?([a-z][a-z0-9]*)\b([^>]*)>/gi, (m, tag, attrs) => {
    tag = tag.toLowerCase(); if (!TAGS.has(tag)) return ""; if (m.startsWith("</")) return `</${tag}>`;
    let out = `<${tag}`; const st = attrs.match(/\sstyle\s*=\s*("([^"]*)"|'([^']*)')/i);
    if (st) { const c = cleanStyle(st[2] ?? st[3]); if (c) out += ` style="${c}"`; }
    if (tag === "a") { const h = attrs.match(/\shref\s*=\s*("([^"]*)"|'([^']*)')/i), u = ((h && (h[2] ?? h[3])) || "").trim(); if (/^(https?:\/\/|mailto:|\/|#)/i.test(u)) out += ` href="${u.replace(/"/g, "&quot;")}" rel="noopener noreferrer"` + (/^https?:/i.test(u) ? ' target="_blank"' : ""); }
    return out + (tag === "br" || tag === "hr" ? " />" : ">");
  });
}
export const isHtml = s => /<\/?[a-z][^>]*>/i.test(String(s || ""));
