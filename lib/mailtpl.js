// Gabarit d'email Klin Studio (pur : sert à l'envoi ET à l'aperçu de l'admin)
const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
export const firstName = n => String(n || "").trim().split(/\s+/)[0] || "";
export function renderMail({ title = "", body = "", preheader = "", name = "", lang = "fr", site = "", bare = false }) {
  const sub = lang === "en" ? "Immersive web experiences · Fashion & Beauty" : "Expériences web immersives · Mode & Beauté";
  const who = firstName(name) || (lang === "en" ? "there" : "");
  const paras = String(body).replace(/\{\{\s*(prenom|name)\s*\}\}/gi, who).replace(/,\s*(?=\n|$)/g, m => (who ? m : "")).split(/\n{2,}/)
    .map(p => `<p style="margin:0 0 18px;font-size:16px;line-height:1.7;color:#2a2520">${esc(p.trim()).replace(/\n/g, "<br>")}</p>`).join("");
  const inner = `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#e9e3da"><tr><td align="center" style="padding:28px 12px">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#faf7f2;border-radius:18px;overflow:hidden;font-family:Georgia,'Times New Roman',serif">
<tr><td style="background:#161312;padding:34px 36px"><div style="font:600 12px Arial,sans-serif;letter-spacing:.4em;color:#e8cfa4">KLIN&nbsp;STUDIO</div><div style="width:44px;height:1px;background:#e8cfa4;margin:14px 0"></div><div style="font:13px Arial,sans-serif;letter-spacing:.06em;color:#d9d2c6">${sub}</div></td></tr>
<tr><td style="padding:38px 36px 12px"><h1 style="margin:0 0 24px;font-weight:400;font-size:30px;line-height:1.25;color:#161312">${esc(title)}</h1>${paras}</td></tr>
${site ? `<tr><td style="padding:6px 36px 34px"><a href="${esc(site)}" style="font:12px Arial,sans-serif;letter-spacing:.25em;text-transform:uppercase;color:#161312;text-decoration:none;border-bottom:1px solid #161312">${esc(site.replace(/^https?:\/\//, ""))}</a></td></tr>` : ""}
</table></td></tr></table>`;
  return bare ? inner : `<!doctype html><html><body style="margin:0;background:#e9e3da"><span style="display:none;max-height:0;overflow:hidden;opacity:0">${esc(preheader)}</span>${inner}</body></html>`;
}
