import { afterEach, beforeEach, expect, it, vi } from "vitest";
const engine = vi.hoisted(() => ({
  inspectVideo: vi.fn(),
  createJob: vi.fn(),
  listJobs: vi.fn(),
  getJob: vi.fn(),
  publicJob: vi.fn((x: unknown) => x),
  downloadFile: vi.fn(),
  backendCapacity: vi.fn(() => ({ active: 1, capacity: 3 })),
}));
const router = vi.hoisted(() => ({ proxy: vi.fn() }));
vi.mock("../src/lib/backend-router", () => ({
  isRouter: () => process.env.FLUX_ROUTER === "true",
  routeBackend: router.proxy,
}));
vi.mock("../src/lib/engine", () => engine);
vi.mock("node:fs", () => ({
  createReadStream: () => Readable.from([Buffer.from("test-video")]),
}));
import { Readable } from "node:stream";
import { POST as inspect } from "../src/app/api/inspect/route";
import { POST as create, GET as list } from "../src/app/api/downloads/route";
import { GET as get } from "../src/app/api/downloads/[id]/route";
import { GET as file } from "../src/app/api/downloads/[id]/file/route";
import { AppError } from "../src/lib/policy";
import { GET as health } from "../src/app/api/health/route";
const request = (body?: unknown) =>
  new Request(
    "http://localhost:3000/api",
    body ? { method: "POST", body: JSON.stringify(body) } : {},
  );
const context = { params: Promise.resolve({ id: "abc" }) };
beforeEach(() => vi.clearAllMocks());
afterEach(() => vi.unstubAllEnvs());

it("exposes capacity only to an authenticated router", async () => {
  vi.stubEnv("FLUX_HOSTED", "true");
  vi.stubEnv("FLUX_ROUTER_SECRET", "health-secret");
  expect(await (await health(request())).json()).toEqual({ ok: true });
  expect(
    await (
      await health(
        new Request("https://backend.test/api/health", {
          headers: { "X-Flux-Router-Secret": "health-secret" },
        }),
      )
    ).json(),
  ).toEqual({ ok: true, active: 1, capacity: 3 });
});

it("routes inspection, creation, status and files without executing the local engine", async () => {
  vi.stubEnv("FLUX_ROUTER", "true");
  router.proxy.mockImplementation(async () => Response.json({ proxied: true }));
  await inspect(request({ url: "x" }));
  expect(router.proxy).toHaveBeenLastCalledWith(
    expect.any(Request),
    "/api/inspect",
  );
  await create(request({ url: "x", quality: 720 }));
  expect(router.proxy).toHaveBeenLastCalledWith(
    expect.any(Request),
    "/api/downloads",
  );
  await get(request(), context);
  expect(router.proxy).toHaveBeenLastCalledWith(
    expect.any(Request),
    "/api/downloads/abc",
    "abc",
  );
  await file(request(), context);
  expect(router.proxy).toHaveBeenLastCalledWith(
    expect.any(Request),
    "/api/downloads/abc/file",
    "abc",
  );
  expect(await (await list(request())).json()).toEqual([]);
  expect(engine.createJob).not.toHaveBeenCalled();
  expect(engine.inspectVideo).not.toHaveBeenCalled();
});
it("inspects URLs and passes policy failures through", async () => {
  engine.inspectVideo.mockResolvedValue({ title: "A" });
  expect(
    await (await inspect(request({ url: "https://youtu.be/a" }))).json(),
  ).toEqual({ title: "A" });
  engine.inspectVideo.mockRejectedValue(new AppError("Blocked", 403));
  expect((await inspect(request({ url: "x" }))).status).toBe(403);
});
it("creates, lists and reads jobs", async () => {
  engine.createJob.mockResolvedValue({ id: "abc" });
  expect((await create(request({ url: "x", quality: 1080 }))).status).toBe(202);
  engine.listJobs.mockResolvedValue([]);
  expect(await (await list(request())).json()).toEqual([]);
  engine.getJob.mockResolvedValue({ id: "abc" });
  expect(await (await get(request(), context)).json()).toEqual({ id: "abc" });
});
it("handles job errors and invalid JSON", async () => {
  engine.createJob.mockRejectedValue(new AppError("Busy", 429));
  expect((await create(request({ url: "x" }))).status).toBe(429);
  engine.listJobs.mockRejectedValue(new Error("private"));
  expect((await list(request())).status).toBe(500);
  engine.getJob.mockRejectedValue(new AppError("Missing", 404));
  expect((await get(request(), context)).status).toBe(404);
  expect(
    (
      await inspect(
        new Request("http://localhost:3000", { method: "POST", body: "{" }),
      )
    ).status,
  ).toBe(500);
});
it("returns file readiness errors", async () => {
  engine.downloadFile.mockRejectedValue(new AppError("Not ready", 409));
  expect((await file(request(), context)).status).toBe(409);
});
it("streams a finished attachment with safe headers", async () => {
  engine.downloadFile.mockResolvedValue({
    file: "/local/video.mkv",
    size: 10,
    name: "flux-test.mkv",
  });
  const response = await file(request(), context);
  expect(response.headers.get("content-disposition")).toBe(
    'attachment; filename="flux-test.mkv"',
  );
  expect(response.headers.get("x-content-type-options")).toBe("nosniff");
  expect(await response.text()).toBe("test-video");
});
