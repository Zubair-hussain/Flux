import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { requireHuman, turnstileRequired } from "../src/lib/turnstile";
import { contentSecurityPolicy } from "../next.config";
import { POST as inspect } from "../src/app/api/inspect/route";

const request = (headers: HeadersInit = {}) =>
  new Request("https://api.example.org/api/inspect", {
    method: "POST",
    headers,
  });
const siteverify = (result: unknown, ok = true) =>
  vi.fn(async () =>
    ok ? Response.json(result) : Promise.reject(new Error("network")),
  );

beforeEach(() => {
  (
    globalThis as { fluxRateHits?: Map<string, number[]> }
  ).fluxRateHits?.clear();
  vi.stubEnv("FLUX_HOSTED", "true");
  vi.stubEnv("TURNSTILE_SECRET_KEY", "secret");
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("Turnstile bot check", () => {
  it("is enforced only on a hosted server that has a secret key", () => {
    expect(turnstileRequired()).toBe(true);
    vi.stubEnv("TURNSTILE_SECRET_KEY", "");
    expect(turnstileRequired()).toBe(false);
    vi.stubEnv("TURNSTILE_SECRET_KEY", "secret");
    vi.stubEnv("FLUX_HOSTED", "");
    expect(turnstileRequired()).toBe(false);
  });
  it("skips the check entirely when not required", async () => {
    vi.stubEnv("TURNSTILE_SECRET_KEY", "");
    const fetchMock = siteverify({ success: false });
    vi.stubGlobal("fetch", fetchMock);
    await expect(requireHuman(request(), undefined)).resolves.toBeUndefined();
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it("rejects a missing, empty or oversized token without calling Cloudflare", async () => {
    const fetchMock = siteverify({ success: true });
    vi.stubGlobal("fetch", fetchMock);
    for (const token of [undefined, "", 42, "x".repeat(3000)])
      await expect(requireHuman(request(), token)).rejects.toMatchObject({
        status: 403,
      });
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it("accepts a token Cloudflare confirms and sends the secret and visitor address", async () => {
    const fetchMock = siteverify({ success: true });
    vi.stubGlobal("fetch", fetchMock);
    await requireHuman(request({ "cf-connecting-ip": "5.5.5.5" }), "token-1");
    const [url, init] = fetchMock.mock.calls[0] as unknown as [
      string,
      { body: URLSearchParams },
    ];
    expect(url).toBe(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
    );
    expect(init.body.get("secret")).toBe("secret");
    expect(init.body.get("response")).toBe("token-1");
    expect(init.body.get("remoteip")).toBe("5.5.5.5");
  });
  it("rejects a token Cloudflare refuses", async () => {
    vi.stubGlobal(
      "fetch",
      siteverify({ success: false, "error-codes": ["timeout-or-duplicate"] }),
    );
    await expect(requireHuman(request(), "used")).rejects.toMatchObject({
      status: 403,
    });
  });
  it("fails closed when Cloudflare cannot be reached", async () => {
    vi.stubGlobal("fetch", siteverify({}, false));
    await expect(requireHuman(request(), "t")).rejects.toMatchObject({
      status: 503,
    });
  });
  it("blocks lookups without a token before any video work happens", async () => {
    vi.stubGlobal("fetch", siteverify({ success: true }));
    const response = await inspect(
      new Request("https://api.example.org/api/inspect", {
        method: "POST",
        body: JSON.stringify({ url: "https://youtu.be/abc" }),
      }),
    );
    expect(response.status).toBe(403);
    expect((await response.json()).error).toContain("verification");
  });
  it("lets the website load the widget only when a site key is configured", () => {
    expect(contentSecurityPolicy({})).not.toContain(
      "challenges.cloudflare.com",
    );
    const csp = contentSecurityPolicy({
      NEXT_PUBLIC_TURNSTILE_SITE_KEY: "0x4AAA",
    });
    expect(csp).toMatch(
      /script-src [^;]*https:\/\/challenges\.cloudflare\.com/,
    );
    expect(csp).toMatch(/frame-src https:\/\/challenges\.cloudflare\.com/);
    expect(csp).toMatch(
      /connect-src [^;]*https:\/\/challenges\.cloudflare\.com/,
    );
  });
});
