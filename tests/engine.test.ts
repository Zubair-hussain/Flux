import { beforeEach, describe, expect, it, vi } from "vitest";
import path from "node:path";
import { readFile } from "node:fs/promises";
import * as directory from "../src/lib/firebase";
const mocks = vi.hoisted(() => ({
  run: vi.fn(),
  files: new Map<string, string>(),
  names: [] as string[],
  missing: false,
}));
vi.mock("node:child_process", async () => {
  const { promisify } = await import("node:util");
  return {
    execFile: Object.assign(() => {}, { [promisify.custom]: mocks.run }),
  };
});
vi.mock("node:fs/promises", () => ({
  mkdir: vi.fn(async () => {}),
  writeFile: vi.fn(async (name: string, content: string) => {
    mocks.files.set(name, content);
  }),
  rename: vi.fn(async (from: string, to: string) => {
    mocks.files.set(to, mocks.files.get(from)!);
    mocks.files.delete(from);
  }),
  readFile: vi.fn(async (name: string) => {
    if (!mocks.files.has(name)) throw new Error("ENOENT");
    return mocks.files.get(name);
  }),
  readdir: vi.fn(async (dir: string) =>
    dir.endsWith("downloads")
      ? [...mocks.files.keys()].map((f) => path.basename(f))
      : mocks.names,
  ),
  stat: vi.fn(async () => ({ size: 123 })),
  rm: vi.fn(async (target: string) => {
    mocks.files.delete(target);
  }),
}));
import {
  createJob,
  downloadFile,
  getJob,
  inspectVideo,
  listJobs,
  pruneOldJobs,
  publicJob,
} from "../src/lib/engine";
const metadata = {
  title: "Mountain sunrise",
  uploader: "Creator",
  duration: 65,
  age_limit: 0,
  thumbnail: "https://example.com/image.jpg",
  formats: [
    { height: 1080, vcodec: "avc1" },
    { height: 2160, vcodec: "vp9" },
    { height: 4320, vcodec: "vp9", has_drm: true },
    { height: 720, vcodec: "none" },
  ],
};
const id = "12345678-1234-1234-1234-123456789abc";
beforeEach(() => {
  const state = globalThis as typeof globalThis & {
    fluxInspectionCache?: { clear(): void };
    fluxJobListCache?: { clear(): void };
  };
  state.fluxInspectionCache?.clear();
  state.fluxJobListCache?.clear();
  mocks.files.clear();
  mocks.names = ["video.mkv"];
  mocks.run.mockReset();
  mocks.run.mockImplementation(async (_binary, args: string[]) => ({
    stdout: args.includes("--dump-single-json") ? JSON.stringify(metadata) : "",
  }));
});
describe("download engine", () => {
  it("publishes every lifecycle transition without making Firebase mandatory locally", async () => {
    const statuses: string[] = [];
    const publish = vi
      .spyOn(directory, "publishJob")
      .mockImplementation(async (job) => {
        statuses.push(job.status);
      });
    try {
      const job = await createJob("https://youtu.be/shared", 1080);
      await vi.waitFor(() =>
        expect(statuses).toEqual(["queued", "downloading", "complete"]),
      );
      expect((await getJob(job.id)).status).toBe("complete");
    } finally {
      publish.mockRestore();
    }
  });

  it("does not start a download when publishing its initial ownership fails", async () => {
    const publish = vi
      .spyOn(directory, "publishJob")
      .mockRejectedValueOnce(new Error("directory unavailable"));
    try {
      await expect(
        createJob("https://youtu.be/unavailable", 1080),
      ).rejects.toThrow("directory unavailable");
      expect(
        mocks.run.mock.calls.every(([, args]) =>
          args.includes("--dump-single-json"),
        ),
      ).toBe(true);
    } finally {
      publish.mockRestore();
    }
  });

  it("reuses job list reads and invalidates them when a job changes", async () => {
    const first = await createJob("https://youtu.be/abc", 1080);
    await vi.waitFor(async () =>
      expect((await getJob(first.id)).status).toBe("complete"),
    );
    expect(await listJobs()).toHaveLength(1);
    const reads = vi.mocked(readFile).mock.calls.length;
    expect(await listJobs()).toHaveLength(1);
    expect(vi.mocked(readFile).mock.calls.length).toBe(reads);
    const second = await createJob("https://youtu.be/def", 1080);
    await vi.waitFor(async () =>
      expect((await getJob(second.id)).status).toBe("complete"),
    );
    expect(await listJobs()).toHaveLength(2);
  });
  it("shares repeated inspections and reuses the result for download preflight", async () => {
    const url = "https://youtu.be/abc";
    await Promise.all([inspectVideo(url), inspectVideo(url)]);
    await inspectVideo(url);
    const job = await createJob(url, 1080);
    await vi.waitFor(async () =>
      expect((await getJob(job.id)).status).toBe("complete"),
    );
    expect(
      mocks.run.mock.calls.filter(([, args]) =>
        args.includes("--dump-single-json"),
      ),
    ).toHaveLength(1);
    expect(
      mocks.run.mock.calls.filter(([, args]) => args.includes("--format")),
    ).toHaveLength(1);
  });
  it("extracts only source qualities and excludes DRM/audio-only formats", async () => {
    const info = await inspectVideo("https://youtube.com/watch?v=abc");
    expect(info.qualities).toEqual([1080, 2160]);
    expect(info.platform).toBe("YouTube");
    const args = mocks.run.mock.calls[0][1];
    expect(args).toContain("--ignore-config");
    expect(args.at(-2)).toBe("--");
  });
  it("handles missing optional thumbnail and uploader", async () => {
    mocks.run.mockResolvedValue({
      stdout: JSON.stringify({
        ...metadata,
        uploader: undefined,
        thumbnail: "http://example.com",
      }),
    });
    const info = await inspectVideo("https://youtu.be/abc");
    expect(info.thumbnail).toBeUndefined();
    expect(info.creator).toBe("YouTube");
  });
  it("rejects unusable source resolutions", async () => {
    mocks.run.mockResolvedValue({
      stdout: JSON.stringify({ ...metadata, formats: [{ height: 360 }] }),
    });
    await expect(inspectVideo("https://youtu.be/abc")).rejects.toThrow(
      "No supported",
    );
  });
  it.each([{ code: "ENOENT" }, { stderr: "No module named yt_dlp" }])(
    "explains a missing engine",
    async (failure) => {
      mocks.run.mockRejectedValue(failure);
      await expect(inspectVideo("https://youtu.be/abc")).rejects.toThrow(
        "engine missing",
      );
    },
  );
  it("reports source errors without exposing subprocess internals", async () => {
    mocks.run.mockRejectedValue(new Error("sensitive"));
    await expect(inspectVideo("https://youtu.be/abc")).rejects.toThrow(
      "could not be accessed",
    );
  });
  it("creates a job, finishes it, lists it and resolves the file safely", async () => {
    const job = await createJob("https://youtu.be/abc", 2160);
    expect(job).not.toHaveProperty("file");
    await vi.waitFor(async () =>
      expect((await getJob(job.id)).status).toBe("complete"),
    );
    expect((await downloadFile(job.id)).size).toBe(123);
    expect(await listJobs()).toHaveLength(1);
    const args = mocks.run.mock.calls[1][1];
    expect(
      args.slice(
        args.indexOf("--concurrent-fragments"),
        args.indexOf("--concurrent-fragments") + 2,
      ),
    ).toEqual(["--concurrent-fragments", "4"]);
    expect(args).toContain(
      "bv[height=2160][width>=?2160]+ba/b[height=2160][width>=?2160]/bv[width=2160][height>2160]+ba/b[width=2160][height>2160]",
    );
  });
  it("recognizes portrait qualities without treating their long edge as resolution", async () => {
    mocks.run.mockResolvedValue({
      stdout: JSON.stringify({
        ...metadata,
        formats: [
          { width: 720, height: 1280, vcodec: "avc1" },
          { width: 1080, height: 1920, vcodec: "avc1" },
          { width: 608, height: 1080, vcodec: "avc1" },
          { width: 2160, height: 3840, vcodec: "avc1", has_drm: true },
        ],
      }),
    });
    expect(
      (await inspectVideo("https://www.tiktok.com/@test/video/123")).qualities,
    ).toEqual([720, 1080]);
  });
  it("reads resolution labels from media URLs when dimensions are missing (LinkedIn)", async () => {
    mocks.run.mockImplementation(async (_binary, args: string[]) => ({
      stdout: args.includes("--dump-single-json")
        ? JSON.stringify({
            ...metadata,
            formats: [
              {
                format_id: "0",
                url: "https://dms.licdn.com/playlist/vid/v2/x/mp4-640p-30fp-crf28/y",
              },
              {
                format_id: "1",
                url: "https://dms.licdn.com/playlist/vid/v2/x/mp4-720p-30fp-crf28/y",
              },
              { format_id: "2", url: "https://cdn.test/video-v2.mp4" },
            ],
          })
        : "",
    }));
    const url = "https://www.linkedin.com/posts/test-activity-123";
    const info = await inspectVideo(url);
    expect(info.qualities).toEqual([720]);
    expect(info).not.toHaveProperty("formatIds");
    const job = await createJob(url, 720);
    await vi.waitFor(async () =>
      expect((await getJob(job.id)).status).toBe("complete"),
    );
    const args = mocks.run.mock.calls.find(([, a]) =>
      a.includes("--format"),
    )![1];
    expect(args[args.indexOf("--format") + 1]).toMatch(/\/1$/);
  });
  it("deletes finished downloads older than the retention period", async () => {
    const dir = path.join(process.cwd(), "downloads");
    const oldId = "aaaaaaaa-1234-1234-1234-123456789abc";
    const newId = "bbbbbbbb-1234-1234-1234-123456789abc";
    const record = (jobId: string, ageDays: number) =>
      JSON.stringify({
        id: jobId,
        status: "complete",
        createdAt: new Date(Date.now() - ageDays * 86_400_000).toISOString(),
      });
    mocks.files.set(path.join(dir, `${oldId}.json`), record(oldId, 30));
    mocks.files.set(path.join(dir, `${newId}.json`), record(newId, 1));
    expect(await pruneOldJobs()).toBe(1);
    expect(mocks.files.has(path.join(dir, `${oldId}.json`))).toBe(false);
    expect(mocks.files.has(path.join(dir, `${newId}.json`))).toBe(true);
    vi.stubEnv("FLUX_RETENTION_DAYS", "0");
    expect(await pruneOldJobs()).toBe(0);
    vi.unstubAllEnvs();
  });
  it("retries with single-file formats first when the first download fails", async () => {
    let downloads = 0;
    mocks.run.mockImplementation(async (_binary, args: string[]) => {
      if (args.includes("--dump-single-json"))
        return { stdout: JSON.stringify(metadata) };
      if (args.includes("--format") && ++downloads === 1)
        throw new Error("fragments failed");
      return { stdout: "" };
    });
    const job = await createJob("https://youtu.be/abc", 1080);
    await vi.waitFor(async () =>
      expect((await getJob(job.id)).status).toBe("complete"),
    );
    const selectors = mocks.run.mock.calls
      .filter(([, a]) => a.includes("--format"))
      .map(([, a]) => a[a.indexOf("--format") + 1]);
    expect(selectors).toHaveLength(2);
    expect(selectors[0]).toMatch(/^bv\[height=1080\]/);
    expect(selectors[1]).toMatch(/^b\[height=1080\]/);
  });
  it("sends only the configured platforms through the proxy", async () => {
    vi.stubEnv("FLUX_PROXY_URL", "http://proxy.example:8080");
    vi.stubEnv("FLUX_PROXY_PLATFORMS", "youtube");
    await inspectVideo("https://www.youtube.com/watch?v=proxied");
    await inspectVideo("https://www.tiktok.com/@a/video/1");
    const [youtube, tiktok] = mocks.run.mock.calls.map(([, args]) => args);
    expect(youtube).toContain("--proxy");
    expect(youtube[youtube.indexOf("--proxy") + 1]).toBe(
      "http://proxy.example:8080",
    );
    expect(tiktok).not.toContain("--proxy");
    vi.unstubAllEnvs();
  });
  it("includes direct file links for the qualities the visitor can pick", async () => {
    mocks.run.mockImplementation(async (_binary, args: string[]) => ({
      stdout: args.includes("--dump-single-json")
        ? JSON.stringify({
            ...metadata,
            formats: [
              {
                url: "https://video.twimg.com/a/1280x720/a.mp4",
                protocol: "https",
                ext: "mp4",
                width: 1280,
                height: 720,
              },
              {
                url: "https://video.twimg.com/b/1920x1080/b.mp4",
                protocol: "https",
                ext: "mp4",
                width: 1920,
                height: 1080,
              },
            ],
          })
        : "",
    }));
    vi.stubEnv("FLUX_MAX_HEIGHT", "720");
    const info = await inspectVideo("https://x.com/user/status/123456789");
    // 1080p is above this server's cap, so neither download nor link is offered
    expect(info.qualities).toEqual([720]);
    expect(Object.keys(info.direct ?? {})).toEqual(["720"]);
    expect(info.direct?.[720]).toContain("twimg.com");
    vi.unstubAllEnvs();
  });
  it("fails a job when no finished media file is produced", async () => {
    mocks.names = ["video.mkv.part"];
    const job = await createJob("https://youtu.be/abc", 1080);
    await vi.waitFor(async () =>
      expect((await getJob(job.id)).status).toBe("failed"),
    );
    expect((await getJob(job.id)).error).toContain("complete file");
  });
  it("rejects unavailable quality and invalid identifiers", async () => {
    await expect(createJob("https://youtu.be/abc", 4320)).rejects.toThrow(
      "does not offer",
    );
    await expect(getJob("../secret")).rejects.toThrow("not found");
    await expect(getJob(id)).rejects.toThrow("not found");
  });
  it("marks interrupted jobs failed after restart", async () => {
    mocks.files.set(
      path.join(process.cwd(), "downloads", `${id}.json`),
      JSON.stringify({ id, status: "downloading" }),
    );
    expect((await getJob(id)).error).toContain("server restarted");
    await expect(downloadFile(id)).rejects.toThrow("not ready");
  });
  it("blocks persisted paths outside the job directory", async () => {
    mocks.files.set(
      path.join(process.cwd(), "downloads", `${id}.json`),
      JSON.stringify({
        id,
        status: "complete",
        file: path.join(process.cwd(), "secret"),
      }),
    );
    await expect(downloadFile(id)).rejects.toThrow("Invalid file");
  });
  it("removes server paths from public job responses", () =>
    expect(
      publicJob({
        id,
        title: "A",
        platform: "YouTube",
        quality: 720,
        status: "complete",
        createdAt: "",
        file: "/secret",
      }),
    ).not.toHaveProperty("file"));
});
