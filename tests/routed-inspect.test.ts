import { afterEach, beforeEach, expect, it, vi } from "vitest";
const shared = vi.hoisted(() => ({ route: vi.fn() }));
vi.mock("../src/lib/backend-router", () => ({
  routeBackend: shared.route,
  isRouter: () => true,
}));
import { inspectTtl, routedInspect } from "../src/lib/routed-inspect";

/** A stand-in for Cloudflare's cache: stores bodies by URL and remembers TTLs. */
function fakeCache() {
  const entries = new Map<
    string,
    { body: string; status: number; ttl: string }
  >();
  return {
    entries,
    match: async (request: Request) => {
      const hit = entries.get(request.url);
      return hit
        ? new Response(hit.body, {
            status: hit.status,
            headers: { "Content-Type": "application/json" },
          })
        : undefined;
    },
    put: async (request: Request, response: Response) => {
      entries.set(request.url, {
        body: await response.text(),
        status: response.status,
        ttl: response.headers.get("cache-control") || "",
      });
    },
  };
}
const lookup = (url: unknown = "https://www.tiktok.com/@nasa/video/1") =>
  new Request("https://website.test/api/inspect", {
    method: "POST",
    body: JSON.stringify({ url, turnstileToken: "t" }),
  });
const details = { title: "Launch", qualities: [720, 1080] };
let cache: ReturnType<typeof fakeCache>;
beforeEach(() => {
  cache = fakeCache();
  vi.stubGlobal("caches", { default: cache });
  shared.route
    .mockReset()
    .mockImplementation(async () => Response.json(details));
});
afterEach(() => vi.unstubAllGlobals());

it("answers a repeated link from the cache without asking a backend", async () => {
  const first = await routedInspect(lookup());
  expect(first.headers.get("x-flux-cache")).toBe("MISS");
  expect(await first.json()).toEqual(details);
  const second = await routedInspect(lookup());
  expect(second.headers.get("x-flux-cache")).toBe("HIT");
  expect(await second.json()).toEqual(details);
  expect(shared.route).toHaveBeenCalledTimes(1);
  // the original request body is forwarded once, not consumed twice
  expect(JSON.parse(shared.route.mock.calls[0][3]).url).toContain("tiktok");
});

it("treats equivalent links as one cache entry and different links separately", async () => {
  await routedInspect(lookup("https://www.tiktok.com/@nasa/video/1#share"));
  await routedInspect(lookup("https://www.tiktok.com/@nasa/video/1"));
  expect(shared.route).toHaveBeenCalledTimes(1);
  await routedInspect(lookup("https://www.tiktok.com/@nasa/video/2"));
  expect(shared.route).toHaveBeenCalledTimes(2);
});

it("stores the cache key as a hash, never the link", async () => {
  await routedInspect(lookup());
  const [key] = [...cache.entries.keys()];
  expect(key).toMatch(/^https:\/\/flux-cache\.invalid\/inspect\/[a-f0-9]{64}$/);
  expect(key).not.toContain("tiktok");
});

it("keeps good answers for five minutes and refusals for one", async () => {
  await routedInspect(lookup());
  expect([...cache.entries.values()][0].ttl).toBe(
    `public, max-age=${inspectTtl.found}`,
  );
  cache.entries.clear();
  shared.route.mockImplementation(async () =>
    Response.json({ error: "blocked", fallback: "cli" }, { status: 422 }),
  );
  const refused = await routedInspect(lookup());
  expect(refused.status).toBe(422);
  expect([...cache.entries.values()][0].ttl).toBe(
    `public, max-age=${inspectTtl.refused}`,
  );
  const again = await routedInspect(lookup());
  expect(again.status).toBe(422);
  expect(again.headers.get("x-flux-cache")).toBe("HIT");
});

it("never caches busy or error responses", async () => {
  for (const status of [429, 503, 500]) {
    shared.route.mockImplementation(async () =>
      Response.json({ error: "busy" }, { status }),
    );
    await routedInspect(lookup());
  }
  expect(cache.entries.size).toBe(0);
});

it("rejects unsupported or malformed links before any backend is contacted", async () => {
  await expect(
    routedInspect(lookup("https://example.com/v")),
  ).rejects.toMatchObject({
    status: 400,
  });
  await expect(routedInspect(lookup(42))).rejects.toMatchObject({
    status: 400,
  });
  await expect(
    routedInspect(
      new Request("https://website.test/api/inspect", {
        method: "POST",
        body: "{not json",
      }),
    ),
  ).rejects.toMatchObject({ status: 400 });
  expect(shared.route).not.toHaveBeenCalled();
});

it("still works when no edge cache exists or it fails", async () => {
  vi.stubGlobal("caches", undefined);
  expect((await routedInspect(lookup())).status).toBe(200);
  vi.stubGlobal("caches", {
    default: {
      match: async () => {
        throw new Error("cache down");
      },
      put: async () => {
        throw new Error("cache down");
      },
    },
  });
  expect((await routedInspect(lookup())).status).toBe(200);
  expect(shared.route).toHaveBeenCalledTimes(2);
});
