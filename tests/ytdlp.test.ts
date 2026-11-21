import { execFileSync } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  downloadSafetyArgs,
  formatSelector,
  safeModuleLauncher,
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
  );
  it("keeps the shared safety flags and exact-resolution selector", () => {
    expect(downloadSafetyArgs).toContain("!is_live & age_limit<?18");
    expect(formatSelector(1080)).toContain("bv[height=1080]");
    expect(formatSelector(720, "7")).toMatch(/\/7$/);
  }, 60_000);
});
