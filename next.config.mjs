const prod = process.env.NODE_ENV === "production";
const csp = ["default-src 'self'", "img-src 'self' data: blob: https://res.cloudinary.com", "media-src 'self' blob: https://res.cloudinary.com", "script-src 'self' 'unsafe-inline' 'unsafe-eval'", "style-src 'self' 'unsafe-inline'", "font-src 'self' data:", "connect-src 'self' https://res.cloudinary.com https://api.cloudinary.com https://www.gstatic.com", "worker-src 'self' blob:", "object-src 'none'", "base-uri 'self'", "form-action 'self'", "frame-ancestors 'none'", ...(prod ? ["upgrade-insecure-requests"] : [])].join("; ");
export default {
  poweredByHeader: false, productionBrowserSourceMaps: false, images: { unoptimized: true },
  async headers() {
    return [
      { source: "/:path*", headers: [
        { key: "Content-Security-Policy", value: csp }, { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
        { key: "X-Frame-Options", value: "DENY" }, { key: "X-Content-Type-Options", value: "nosniff" }, { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" }, { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
        { key: "X-Robots-Tag", value: "noai, noimageai" }] },
      { source: "/(sounds|cloud.png)/:path*", headers: [{ key: "Cross-Origin-Resource-Policy", value: "same-origin" }] },
    ];
  },
};
