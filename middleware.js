// Langue + garde-fous : limitation de débit par IP (bannissement 10 min si abus), filtrage de robots de copie.
// Aucun blocage de host : les domaines *.vercel.app et les previews fonctionnent toujours.
import { NextResponse } from "next/server";
const L = ["fr", "en"], hits = new Map(), bans = new Map();
const BAD = /(scrapy|httrack|wget|curl\/|python-requests|libwww|go-http-client|aiohttp|node-fetch|axios|okhttp|webcopier|teleport|sitesucker)/i;
function abuse(ip, api) {
  const now = Date.now(); if ((bans.get(ip) || 0) > now) return true;
  const w = (hits.get(ip) || []).filter(t => now - t < 10000); w.push(now); hits.set(ip, w);
  if (hits.size > 5000) hits.clear();
  if (w.length > (api ? 40 : 120)) { bans.set(ip, now + 6e5); return true; }
  return false;
}
export function middleware(req) {
  const { pathname } = req.nextUrl, ip = (req.headers.get("x-forwarded-for") || "local").split(",")[0].trim();
  if (abuse(ip, pathname.startsWith("/api"))) return new NextResponse("Too Many Requests", { status: 429, headers: { "Retry-After": "600" } });
  if (BAD.test(req.headers.get("user-agent") || "")) return new NextResponse("Forbidden", { status: 403 });
  if (/^\/(admin|api)/.test(pathname) || L.some(l => pathname === `/${l}` || pathname.startsWith(`/${l}/`)) || ["/robots.txt", "/sitemap.xml"].includes(pathname) || pathname.startsWith("/opengraph-image") || pathname.startsWith("/twitter-image")) return NextResponse.next();
  const c = req.cookies.get("lang")?.value, lang = L.includes(c) ? c : (req.headers.get("accept-language") || "").toLowerCase().startsWith("fr") ? "fr" : "en";
  const u = req.nextUrl.clone(); u.pathname = `/${lang}${pathname === "/" ? "" : pathname}`; return NextResponse.redirect(u);
}
export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"] };
