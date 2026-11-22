import { afterEach, beforeEach, expect, it, vi } from "vitest";
const shared = vi.hoisted(() => ({ job: vi.fn() }));
vi.mock("../src/lib/firebase", () => ({ firebaseJob: shared.job }));
import { routeBackend, isRouter } from "../src/lib/backend-router";
import { guard } from "../src/lib/http";
const id = "12345678-1234-1234-1234-123456789abc";
const fetcher = vi.fn();
beforeEach(() => {
  vi.stubEnv("FLUX_ROUTER", "true");
  vi.stubEnv("FLUX_ROUTER_SECRET", "secret-value");
  vi.stubEnv(
    "FLUX_BACKENDS",
    JSON.stringify({ one: "https://one.test", two: "https://two.test" }),
  );
  shared.job
    .mockReset()
    .mockResolvedValue({ backendId: "two", expiresAt: Date.now() + 60_000 });
  fetcher.mockReset().mockImplementation(async (url) =>
    String(url).endsWith("/api/health")
      ? Response.json({
          active: String(url).includes("one") ? 1 : 0,
          capacity: 2,
        })
      : Response.json({ id }, { status: 202 }),
  );
  vi.stubGlobal("fetch", fetcher);
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});
const request = () =>
  new Request("https://website.test/api/downloads", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "CF-Connecting-IP": "203.0.113.1",
      "X-Flux-Router-Secret": "attacker",
    },
    body: JSON.stringify({ url: "https://youtu.be/example", quality: 720 }),
  });

it("selects the least loaded server and forwards trusted credentials and the body", async () => {
  expect(isRouter()).toBe(true);
  const result = await routeBackend(request(), "/api/downloads");
  expect(result.status).toBe(202);
  expect(fetcher.mock.calls[2][0]).toBe("https://two.test/api/downloads");
  const init = fetcher.mock.calls[2][1];
  expect(init.headers.get("X-Flux-Router-Secret")).toBe("secret-value");
  expect(init.redirect).toBe("manual");
  expect(init.headers.get("CF-Connecting-IP")).toBe("203.0.113.1");
  expect(JSON.parse(init.body)).toMatchObject({ quality: 720 });
  expect(result.headers.get("cache-control")).toBe("no-store");
});

it("rejects upstream redirects without replaying credentials", async () => {
  fetcher.mockImplementation(async (url) =>
    String(url).endsWith("/api/health")
      ? Response.json({ active: 0, capacity: 1 })
      : new Response(null, {
          status: 302,
          headers: { Location: "https://untrusted.test" },
        }),
  );
  await expect(routeBackend(request(), "/api/downloads")).rejects.toMatchObject(
    { status: 503 },
  );
  expect(
    fetcher.mock.calls.some(([url]) => String(url).includes("untrusted")),
  ).toBe(false);
});

it("routes an existing file straight to its owner and streams its response", async () => {
  fetcher.mockResolvedValue(
    new Response("video bytes", {
      headers: {
        "Content-Disposition": "attachment; filename=video.mp4",
        "Set-Cookie": "untrusted=1",
      },
    }),
  );
  const response = await routeBackend(
    new Request("https://website.test"),
    `/api/downloads/${id}/file`,
    id,
  );
  expect(fetcher).toHaveBeenCalledTimes(1);
  expect(fetcher.mock.calls[0][0]).toBe(
    `https://two.test/api/downloads/${id}/file`,
  );
  expect(await response.text()).toBe("video bytes");
  expect(response.headers.get("content-disposition")).toContain("video.mp4");
  expect(response.headers.has("set-cookie")).toBe(false);
});

it("deletes expired ownership and does not contact a backend", async () => {
  shared.job.mockResolvedValue({ backendId: "two", expiresAt: 1 });
  await expect(
    routeBackend(new Request("https://website.test"), "/api/downloads/x", id),
  ).rejects.toMatchObject({ status: 410 });
  expect(shared.job).toHaveBeenLastCalledWith(id, "DELETE");
  expect(fetcher).not.toHaveBeenCalled();
});

it.each([null, { backendId: "removed", expiresAt: Date.now() + 60_000 }])(
  "handles missing jobs and removed owners",
  async (record) => {
    shared.job.mockResolvedValue(record);
    await expect(
      routeBackend(new Request("https://website.test"), "/api/downloads/x", id),
    ).rejects.toMatchObject({ status: record ? 503 : 404 });
    expect(fetcher).not.toHaveBeenCalled();
  },
);

it.each([
  "broken",
  "[]",
  "{}",
  '{"one":"http://one.test"}',
  '{"one":"https://one.test/path"}',
  '{"one":"https://user:pass@one.test"}',
])("rejects invalid backend configuration %s", async (value) => {
  vi.stubEnv("FLUX_BACKENDS", value);
  await expect(routeBackend(request(), "/api/downloads")).rejects.toMatchObject(
    { status: 503 },
  );
  expect(fetcher).not.toHaveBeenCalled();
});

it("requires a router secret", async () => {
  vi.stubEnv("FLUX_ROUTER_SECRET", "");
  await expect(routeBackend(request(), "/api/downloads")).rejects.toMatchObject(
    { status: 503 },
  );
});

it.each(["full", "unreachable", "unauthorized", "invalid"])(
  "returns a retry message if every server is %s",
  async (kind) => {
    fetcher.mockImplementation(async () => {
      if (kind === "unreachable") throw new Error("timeout");
      if (kind === "unauthorized") return new Response(null, { status: 403 });
      return Response.json(
        kind === "invalid" ? { ok: true } : { active: 2, capacity: 2 },
      );
    });
    await expect(
      routeBackend(request(), "/api/downloads"),
    ).rejects.toMatchObject({ status: 503 });
    expect(fetcher).toHaveBeenCalledTimes(2);
  },
);

it("never replays an ambiguous download POST", async () => {
  fetcher.mockImplementation(async (url) => {
    if (String(url).endsWith("/api/health"))
      return Response.json({ active: 0, capacity: 1 });
    throw new Error("timeout after job creation");
  });
  await expect(routeBackend(request(), "/api/downloads")).rejects.toMatchObject(
    { status: 503 },
  );
  expect(
    fetcher.mock.calls.filter(([, init]) => init.method === "POST"),
  ).toHaveLength(1);
});

it("blocks direct backend access while allowing authenticated router requests", () => {
  vi.stubEnv("FLUX_ROUTER", "false");
  vi.stubEnv("FLUX_HOSTED", "true");
  expect(() => guard(new Request("https://one.test/api/downloads"))).toThrow(
    "through the website",
  );
  expect(() =>
    guard(
      new Request("https://one.test/api/downloads", {
        headers: { "X-Flux-Router-Secret": "wrong-length" },
      }),
    ),
  ).toThrow();
  expect(() =>
    guard(
      new Request("https://one.test/api/downloads", {
        headers: { "X-Flux-Router-Secret": "secret-value" },
      }),
    ),
  ).not.toThrow();
});
