// Compte admin unique (.env), session signée HMAC en cookie HttpOnly/SameSite=Strict
import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
const key = () => process.env.SESSION_SECRET || process.env.ADMIN_PASSWORD || "x";
const sig = v => createHmac("sha256", key()).update(v).digest("base64url");
const eq = (a, b) => { const x = Buffer.from(a), y = Buffer.from(b); return x.length === y.length && timingSafeEqual(x, y); };
export const checkLogin = (u, p) => !!process.env.ADMIN_PASSWORD && eq(u || "", process.env.ADMIN_USERNAME || "") && eq(p || "", process.env.ADMIN_PASSWORD);
export async function setSession() {
  const v = `admin.${Date.now() + 6048e5}`;
  (await cookies()).set("klin_s", `${v}.${sig(v)}`, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict", path: "/", maxAge: 604800 });
}
export async function isAdmin() {
  const c = (await cookies()).get("klin_s")?.value; if (!c) return false;
  const i = c.lastIndexOf("."), v = c.slice(0, i); return eq(sig(v), c.slice(i + 1)) && +v.split(".")[1] > Date.now();
}
export async function clearSession() { (await cookies()).delete("klin_s"); }
