import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({
  exec: vi.fn(),
  spawnCode: 0,
  spawnArgs: [] as string[],
}));
vi.mock("node:child_process", async () => {
  const { promisify } = await import("node:util");
  const { EventEmitter } = await import("node:events");
  return {
    execFile: Object.assign(() => {}, { [promisify.custom]: mocks.exec }),
    spawn: vi.fn((_binary: string, args: string[]) => {
      mocks.spawnArgs = args;
      const child = new EventEmitter();
      setTimeout(() => child.emit("close", mocks.spawnCode));
      return child;
    }),
  };
});
vi.mock("node:fs/promises", () => ({ mkdir: vi.fn(async () => {}) }));
import { help, main, parseArgs, pickQuality } from "../src/cli/flux";

const video = {
  title: "Launch day",
  uploader: "NASA",
  duration: 95,
  age_limit: 0,
  formats: [
    { width: 720, height: 1280, vcodec: "avc1" },
    { width: 1080, height: 1920, vcodec: "avc1" },
  ],
};
const run = async (...argv: string[]) => {
  const lines: string[] = [];
  const code = await main(argv, (line) => lines.push(line));
  return { code, out: lines.join("\n") };
};
beforeEach(() => {
  mocks.exec.mockReset();
  mocks.exec.mockResolvedValue({ stdout: JSON.stringify(video) });
  mocks.spawnCode = 0;
});

describe("flux CLI", () => {
  it("parses commands, quality aliases and output folders", () => {
    expect(parseArgs(["https://youtu.be/a"], "/tmp")).toMatchObject({
      command: "download",
      url: "https://youtu.be/a",
      output: expect.stringContaining("tmp"),
    });
    expect(parseArgs(["info", "https://youtu.be/a", "--json"])).toMatchObject({
      command: "info",
      json: true,
    });
    expect(parseArgs(["https://youtu.be/a", "-q", "4K"]).quality).toBe(2160);
    expect(parseArgs([]).command).toBe("help");
    expect(parseArgs(["platforms"]).command).toBe("platforms");
    expect(() => parseArgs(["https://youtu.be/a", "-q", "360"])).toThrow(
      "Quality must be",
    );
    expect(() => parseArgs(["--nope"])).toThrow("Unknown option");
    expect(() => parseArgs(["info"])).toThrow("Add a video URL");
    expect(() => parseArgs(["https://youtu.be/a", "-o"])).toThrow(
      "needs a value",
    );
  });
  it("picks the best quality or rejects one the source lacks", () => {
    expect(pickQuality([720, 1080])).toBe(1080);
    expect(pickQuality([720, 1080], 720)).toBe(720);
    expect(() => pickQuality([720, 1080], 4320)).toThrow(
      "does not offer 8K. Available: 720p, 1080p",
    );
  });
  it("shows help, version and platforms", async () => {
    expect((await run("--help")).out).toBe(help);
    expect((await run("platforms")).out).toContain("YouTube");
    expect((await run("-v")).code).toBe(0);
    expect((await run("--bad")).code).toBe(2);
  });
  it("reports source qualities without downloading", async () => {
    const { code, out } = await run(
      "info",
      "https://www.tiktok.com/@nasa/video/1",
    );
    expect(code).toBe(0);
    expect(out).toContain("720p, 1080p");
    const json = JSON.parse(
      (await run("info", "https://www.tiktok.com/@nasa/video/1", "--json")).out,
    );
    expect(json).toMatchObject({ platform: "TikTok", qualities: [720, 1080] });
    expect(json).not.toHaveProperty("formatIds");
  });
  it("downloads with the shared safety flags and exact format selector", async () => {
    const { code, out } = await run("https://youtu.be/abc", "-q", "720");
    expect(code).toBe(0);
    expect(out).toContain("permission");
    expect(mocks.spawnArgs).toContain("--ignore-config");
    expect(mocks.spawnArgs).toContain("!is_live & age_limit<?18");
    expect(mocks.spawnArgs).toContain(
      "bv[height=720][width>=?720]+ba/b[height=720][width>=?720]/bv[width=720][height>720]+ba/b[width=720][height>720]",
    );
    expect(mocks.spawnArgs.at(-2)).toBe("--");
  });
  it("enforces the content policy and explains failures", async () => {
    mocks.exec.mockResolvedValue({
      stdout: JSON.stringify({ ...video, age_limit: 18 }),
    });
    expect((await run("https://youtu.be/abc")).out).toContain("Age-restricted");
    expect((await run("https://example.com/v")).out).toContain(
      "flux platforms",
    );
    mocks.exec.mockRejectedValue({ code: "ENOENT" });
    expect((await run("info", "https://youtu.be/abc")).out).toContain(
      "yt-dlp[default,curl-cffi]",
    );
    mocks.exec.mockResolvedValue({ stdout: JSON.stringify(video) });
    mocks.spawnCode = 1;
    const failed = await run("https://youtu.be/abc");
    expect(failed.code).toBe(1);
    expect(failed.out).toContain("download stopped");
  });
  it("doctor reports missing tools with install hints", async () => {
    mocks.exec.mockRejectedValue(new Error("missing"));
    const { code, out } = await run("doctor");
    expect(code).toBe(1);
    expect(out).toContain("yt-dlp missing");
    expect(out).toContain("FFmpeg missing");
  });
});
