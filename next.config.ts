import type { NextConfig } from "next";

// Response security headers applied to every route.
// Computed at build time, so rebuild after changing SITE_URL or AdSense settings.
type Env = Record<string, string | undefined>;

const adsenseHosts = [
  "https://pagead2.googlesyndication.com",
  "https://*.googlesyndication.com",
  "https://*.doubleclick.net",
  "https://*.google.com",
  "https://*.gstatic.com",
  "https://*.googleadservices.com",
  "https://fundingchoicesmessages.google.com",
  "https://adservice.google.com",
];

export function contentSecurityPolicy(env: Env = process.env): string {
  const ads =
    env.ADSENSE_ENABLED === "true" && env.ADSENSE_CONSENT_READY === "true";
  const dev = env.NODE_ENV === "development";
  const adHosts = ads ? ` ${adsenseHosts.join(" ")}` : "";
  // Next.js injects inline bootstrap scripts, so 'unsafe-inline' is required
  // without a per-request nonce. Everything else stays first-party.
  return [
    "default-src 'self'",
    `script-src 'self' 'unsafe-inline'${dev ? " 'unsafe-eval'" : ""}${adHosts}`,
    "style-src 'self' 'unsafe-inline'",
    `img-src 'self' data: blob:${ads ? " https:" : ""}`,
    "font-src 'self'",
    `connect-src 'self'${adHosts}${dev ? " ws: wss:" : ""}`,
    `frame-src ${ads ? adHosts.trim() : "'none'"}`,
    "media-src 'self' blob:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    ...((env.SITE_URL || "").startsWith("https://")
      ? ["upgrade-insecure-requests"]
      : []),
  ].join("; ");
}

export function securityHeaders(env: Env = process.env) {
  const https = (env.SITE_URL || "").startsWith("https://");
  return [
    { key: "Content-Security-Policy", value: contentSecurityPolicy(env) },
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "X-Frame-Options", value: "DENY" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    {
      key: "Permissions-Policy",
      value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
    },
    { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
    // HSTS only makes sense once the public site is served over HTTPS.
    ...(https
      ? [
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
        ]
      : []),
  ];
}

const config: NextConfig = {
  devIndicators: false,
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders() }];
  },
};
export default config;
