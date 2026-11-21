import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { guard, handle, preflight } from "../src/lib/http";
import { allowedOrigins, clientIp, enforceRateLimit } from "../src/lib/hosted";
import { GET as listDownloads } from "../src/app/api/downloads/route";

const call = (url: string, origin?: string, headers: HeadersInit = {}) =>
  new Request(url, {
    method: "POST",
    headers: { ...(origin ? { origin } : {}), ...headers },
  });

beforeEach(() => {
  (
    globalThis as { fluxRateHits?: Map<string, number[]> }
  ).fluxRateHits?.clear();
  vi.stubEnv("FLUX_HOSTED", "true");
  vi.stubEnv("FLUX_ALLOWED_ORIGINS", "https://flux.example.org/");
});
afterEach(() => vi.unstubAllEnvs());

describe("hosted mode", () => {
  it("accepts a public host and the configured website origins only", () => {
    const api = "https://api.example.org/api/inspect";
    expect(() => guard(call(api))).not.toThrow();
    expect(() => guard(call(api, "https://api.example.org"))).not.toThrow();
    expect(() => guard(call(api, "https://flux.example.org"))).not.toThrow();
    expect(() => guard(call(api, "https://evil.test"))).toThrow("Cross-origin");
    expect(() =>
      guard(call(api, "https://flux.example.org.evil.test")),
    ).toThrow("Cross-origin");
    expect(allowedOrigins()).toEqual(["https://flux.example.org"]);
  });
  it("is still local-only when hosted mode is off", () => {
    vi.stubEnv("FLUX_HOSTED", "");
    expect(() => guard(call("https://api.example.org/api/inspect"))).toThrow(
      "local-only",
    );
  });
  it("limits lookups and downloads per visitor, not globally", () => {
    vi.stubEnv("FLUX_RATE_DOWNLOAD", "2");
    const visitor = (ip: string) =>
      call("https://api.example.org/x", undefined, { "cf-connecting-ip": ip });
    enforceRateLimit(visitor("1.1.1.1"), "download");
    enforceRateLimit(visitor("1.1.1.1"), "download");
    expect(() => enforceRateLimit(visitor("1.1.1.1"), "download")).toThrow(
      "Too many downloads",
    );
    expect(() =>
      enforceRateLimit(visitor("2.2.2.2"), "download"),
    ).not.toThrow();
    // the window slides: an hour later the visitor can download again
    expect(() =>
      enforceRateLimit(visitor("1.1.1.1"), "download", Date.now() + 3_700_000),
    ).not.toThrow();
  });
  it("reads the visitor address from the proxy headers", () => {
    expect(
      clientIp(call("https://a.b/", undefined, { "fly-client-ip": "9.9.9.9" })),
    ).toBe("9.9.9.9");
    expect(
      clientIp(
        call("https://a.b/", undefined, {
          "x-forwarded-for": "7.7.7.7, 10.0.0.1",
        }),
      ),
    ).toBe("7.7.7.7");
    expect(clientIp(call("https://a.b/"))).toBe("unknown");
  });
  it("answers browser preflight only for allowed websites", () => {
    const ask = (origin: string) =>
      preflight(
        new Request("https://api.example.org/api/inspect", {
          method: "OPTIONS",
          headers: { origin },
        }),
      );
    const ok = ask("https://flux.example.org");
    expect(ok.status).toBe(204);
    expect(ok.headers.get("access-control-allow-origin")).toBe(
      "https://flux.example.org",
    );
    expect(ask("https://evil.test").status).toBe(403);
  });
  it("adds CORS headers to success and error responses for allowed websites", async () => {
    const request = call(
      "https://api.example.org/x",
      "https://flux.example.org",
    );
    const ok = await handle(request, undefined, () => Response.json({ ok: 1 }));
    expect(ok.headers.get("access-control-allow-origin")).toBe(
      "https://flux.example.org",
    );
    const failed = await handle(request, undefined, () => {
      throw new Error("boom");
    });
    expect(failed.status).toBe(500);
    expect(failed.headers.get("access-control-allow-origin")).toBe(
      "https://flux.example.org",
    );
    const blocked = await handle(
      call("https://api.example.org/x", "https://evil.test"),
      undefined,
      () => Response.json({}),
    );
    expect(blocked.status).toBe(403);
    expect(blocked.headers.get("access-control-allow-origin")).toBeNull();
  });
  it("never lists other visitors' downloads", async () => {
    const response = await listDownloads(
      new Request("https://api.example.org/api/downloads"),
    );
    expect(await response.json()).toEqual([]);
  });
  it("rejects videos longer than the configured limit", async () => {
    vi.stubEnv("FLUX_MAX_DURATION", "600");
    const { enforceContentPolicy } = await import("../src/lib/policy");
    expect(() =>
      enforceContentPolicy({ title: "t", formats: [], duration: 601 }),
    ).toThrow("up to 10 minutes");
    expect(() =>
      enforceContentPolicy({ title: "t", formats: [], duration: 599 }),
    ).not.toThrow();
  });
});
