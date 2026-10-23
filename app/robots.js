import { SITE } from "@/lib/seo";
const AI = ["GPTBot", "ChatGPT-User", "CCBot", "Google-Extended", "anthropic-ai", "ClaudeBot", "PerplexityBot", "Bytespider", "Amazonbot", "FacebookBot", "Applebot-Extended"];
export default () => ({ rules: [{ userAgent: "*", allow: "/", disallow: ["/admin", "/api"] }, ...AI.map(userAgent => ({ userAgent, disallow: "/" }))], sitemap: `${SITE()}/sitemap.xml` });
