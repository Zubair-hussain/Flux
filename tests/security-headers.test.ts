import { expect, it } from "vitest";
import { contentSecurityPolicy, securityHeaders } from "../next.config";
const header = (env: Record<string, string>, key: string) =>
  securityHeaders(env).find((h) => h.key === key)?.value;
it("sends baseline security headers on every deployment", () => {
  const env = { SITE_URL: "http://localhost:3000" };
  expect(header(env, "X-Content-Type-Options")).toBe("nosniff");
  expect(header(env, "X-Frame-Options")).toBe("DENY");
  expect(header(env, "Referrer-Policy")).toBe(
    "strict-origin-when-cross-origin",
  );
  expect(header(env, "Permissions-Policy")).toContain("camera=()");
  expect(header(env, "Strict-Transport-Security")).toBeUndefined();
  const csp = header(env, "Content-Security-Policy")!;
  expect(csp).toContain("frame-ancestors 'none'");
  expect(csp).toContain("object-src 'none'");
  expect(csp).not.toContain("upgrade-insecure-requests");
  expect(csp).not.toContain("googlesyndication");
});
it("adds HSTS and request upgrades only for HTTPS sites", () => {
  const env = { SITE_URL: "https://flux.example.org" };
  expect(header(env, "Strict-Transport-Security")).toContain("max-age=");
  expect(contentSecurityPolicy(env)).toContain("upgrade-insecure-requests");
});
it("allows Google ad hosts only when ads are fully enabled", () => {
  expect(contentSecurityPolicy({ ADSENSE_ENABLED: "true" })).not.toContain(
    "googlesyndication",
  );
  const csp = contentSecurityPolicy({
    ADSENSE_ENABLED: "true",
    ADSENSE_CONSENT_READY: "true",
  });
  expect(csp).toContain("https://pagead2.googlesyndication.com");
  expect(csp).toMatch(/frame-src [^;]*doubleclick/);
});
it("permits dev tooling only in development", () => {
  expect(contentSecurityPolicy({ NODE_ENV: "development" })).toContain(
    "'unsafe-eval'",
  );
  expect(contentSecurityPolicy({ NODE_ENV: "production" })).not.toContain(
    "'unsafe-eval'",
  );
});
