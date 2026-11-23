import { execFileSync } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  directLinks,
  downloadSafetyArgs,
  formatSelector,
  proxyArgs,
  safeModuleLauncher,
  sourceAccessError,
  ytdlpCommand,
} from "../src/lib/ytdlp";

const hasPython = (() => {
  try {
    execFileSync("python", ["--version"], { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
})();

describe("source access errors", () => {
  it("distinguishes YouTube server restrictions from extractor failures", () => {
    expect(
      sourceAccessError(
        "ERROR: [youtube] abc: Sign in to confirm you’re not a bot.",
      ).message,
    ).toContain("YouTube is refusing requests");
    expect(
      sourceAccessError("ERROR: [youtube] abc: Signature extraction failed")
        .status,
    ).toBe(503);
    expect(
      sourceAccessError("ERROR: HTTP Error 429: Too Many Requests").status,
    ).toBe(429);
  });
  it("keeps raw source output private and does not infer a YouTube block from another platform", () => {
    const raw =
      "ERROR: [other] private-title https://private.test/video /srv/downloads/key";
    expect(sourceAccessError(raw).message).not.toContain("private");
    expect(
      sourceAccessError("[other] Sign in to confirm you’re not a bot").message,
    ).not.toContain("YouTube");
    expect(sourceAccessError("").status).toBe(422);
  });
});

describe("yt-dlp launcher", () => {
  it("loads yt-dlp without trusting the current folder", () => {
    const { binary, args } = ytdlpCommand(["--version"], {});
    expect(binary).toBe("python");
    expect(args.slice(0, 2)).toEqual(["-c", safeModuleLauncher]);
    expect(args).toContain("--ignore-config");
    expect(args.at(-1)).toBe("--version");
  });
  it("uses an explicit yt-dlp executable as is", () => {
    const { binary, args } = ytdlpCommand([], {
      YTDLP_PATH: "C:/tools/yt-dlp.exe",
    });
    expect(binary).toBe("C:/tools/yt-dlp.exe");
    expect(args).not.toContain("-c");
  });
  it.skipIf(!hasPython)(
    "ignores a yt_dlp.py planted in the working folder",
    () => {
      const dir = mkdtempSync(path.join(tmpdir(), "flux-hijack-"));
      writeFileSync(path.join(dir, "yt_dlp.py"), 'print("HIJACKED")\n');
      const { binary, args } = ytdlpCommand(["--version"], {});
      let output = "";
      try {
        output = execFileSync(binary, args, {
          cwd: dir,
          encoding: "utf8",
          stdio: "pipe",
        });
      } catch (error) {
        output = String((error as { stdout?: string }).stdout || "");
      }
      expect(output).not.toContain("HIJACKED");
    },
    60_000,
  );
  it("keeps the shared safety flags and exact-resolution selector", () => {
    expect(downloadSafetyArgs).toContain("!is_live & age_limit<?18");
    expect(formatSelector(1080)).toContain("bv[height=1080]");
    expect(formatSelector(720, "7")).toMatch(/\/7$/);
  }, 60_000);
});

describe("per-platform proxy", () => {
  const env = {
    FLUX_PROXY_URL: "http://user:pass@proxy.example:8080",
    FLUX_PROXY_PLATFORMS: "YouTube, dailymotion",
  };
  it("proxies only the platforms listed", () => {
    expect(proxyArgs("YouTube", env)).toEqual(["--proxy", env.FLUX_PROXY_URL]);
    expect(proxyArgs("Dailymotion", env)).toEqual([
      "--proxy",
      env.FLUX_PROXY_URL,
    ]);
    expect(proxyArgs("TikTok", env)).toEqual([]);
    expect(proxyArgs(undefined, env)).toEqual([]);
  });
  it("needs an explicit platform list, and accepts 'all'", () => {
    expect(
      proxyArgs("YouTube", { FLUX_PROXY_URL: env.FLUX_PROXY_URL }),
    ).toEqual([]);
    expect(
      proxyArgs("TikTok", { ...env, FLUX_PROXY_PLATFORMS: "all" }),
    ).toHaveLength(2);
  });
  it("ignores unsafe or malformed proxy addresses", () => {
    for (const bad of [
      "--exec rm",
      "file:///etc/passwd",
      "not a url",
      "http://a b.example",
      "ftp://proxy.example",
    ])
      expect(proxyArgs("YouTube", { ...env, FLUX_PROXY_URL: bad })).toEqual([]);
    expect(
      proxyArgs("YouTube", {
        ...env,
        FLUX_PROXY_URL: "socks5h://p.example:1080",
      }),
    ).toHaveLength(2);
  });
});

describe("source failures", () => {
  it("tell the page that the visitor's own computer may succeed", () => {
    for (const stderr of [
      "[youtube] x: Sign in to confirm you're not a bot",
      "HTTP Error 429: Too Many Requests",
      "ERROR: something else",
    ]) {
      const error = sourceAccessError(stderr);
      expect(error.fallback).toBe("cli");
      expect(error.message).not.toContain(stderr);
    }
  });
});

describe("direct video-file links", () => {
  const file = (over: Record<string, unknown> = {}) => ({
    format_id: "http-2176",
    url: "https://video.twimg.com/ext_tw_video/1/vid/avc1/1280x720/a.mp4",
    protocol: "https",
    ext: "mp4",
    width: 1280,
    height: 720,
    tbr: 2176,
    ...over,
  });
  it("offers the platform's own single file, one per quality", () => {
    const links = directLinks(
      [
        file(),
        file({
          url: "https://video.twimg.com/b/1920x1080/b.mp4",
          width: 1920,
          height: 1080,
          tbr: 10368,
        }),
        file({ url: "https://video.twimg.com/c/720.mp4", tbr: 900 }),
      ],
      "X / Twitter",
    );
    expect(Object.keys(links)).toEqual(["720", "1080"]);
    expect(links[720]).toContain("a.mp4"); // the higher-bitrate 720p wins
  });
  it("reads the quality from the file name when sizes are missing (LinkedIn)", () => {
    const links = directLinks(
      [
        file({
          url: "https://dms.licdn.com/playlist/vid/mp4-720p-30fp-crf28/y",
          width: undefined,
          height: undefined,
        }),
      ],
      "LinkedIn",
    );
    expect(Object.keys(links)).toEqual(["720"]);
  });
  it("never links outside the platform's own servers", () => {
    for (const url of [
      "https://evil.example/a.mp4",
      "https://video.twimg.com.evil.example/a.mp4",
      "https://twimg.com@evil.example/a.mp4",
      "http://video.twimg.com/a.mp4",
      "https://user:pass@video.twimg.com/a.mp4",
      "javascript:alert(1)",
      "https://video.twimg.com/" + "a".repeat(4100),
    ])
      expect(directLinks([file({ url })], "X / Twitter")).toEqual({});
  });
  it("skips anything that is not one ready-made file with audio", () => {
    for (const odd of [
      { protocol: "m3u8_native" },
      { fragments: [{ url: "x" }] },
      { acodec: "none" },
      { vcodec: "none" },
      { has_drm: true },
      { ext: "m4a" },
      { http_headers: { Cookie: "a=b" } },
    ])
      expect(directLinks([file(odd)], "X / Twitter")).toEqual({});
  });
  it("is off for platforms that are not listed", () => {
    expect(directLinks([file()], "YouTube")).toEqual({});
    expect(directLinks([file()], "TikTok")).toEqual({});
  });
});
