import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { mkdtemp, readFile, mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import assert from "node:assert/strict";
const run = promisify(execFile);
const { version } = JSON.parse(
  await readFile("packages/cli/package.json", "utf8"),
);
const source =
  process.argv[2] ||
  path.resolve(`public/downloads/flux-downloader-${version}.tgz`);
const cwd = await mkdtemp(path.join(tmpdir(), "flux-package-check-"));
const npmCli = process.env.npm_execpath;
if (!npmCli) throw new Error("Use npm run verify:package.");
async function npm(args) {
  return run(process.execPath, [npmCli, ...args], {
    cwd,
    windowsHide: true,
    timeout: 120000,
    maxBuffer: 1024 * 1024,
  });
}
await npm(["install", "--ignore-scripts", "--no-audit", "--no-fund", source]);
const entry = path.join(cwd, "node_modules/flux-downloader/dist/flux.mjs");
const actual = await run(process.execPath, [entry, "--version"], {
  cwd,
  windowsHide: true,
});
assert.equal(actual.stdout.trim(), version);
const platforms = await run(process.execPath, [entry, "platforms"], {
  cwd,
  windowsHide: true,
});
assert.match(platforms.stdout, /YouTube/);
assert.match(platforms.stdout, /TikTok/);
await readFile(path.join(cwd, "node_modules/flux-downloader/LICENSE"));
await readFile(path.join(cwd, "node_modules/flux-downloader/LEGAL.md"));
const binary = await npm(["exec", "--offline", "--", "flux", "--version"]);
assert.equal(binary.stdout.trim(), version);
let rejected = false;
try {
  await run(process.execPath, [entry, "info", "https://example.com/video"], {
    cwd,
    windowsHide: true,
  });
} catch (error) {
  assert.equal(error.code, 1);
  rejected = true;
}
assert.ok(rejected);
let missingToolsHandled = false;
try {
  await run(process.execPath, [entry, "doctor"], {
    cwd,
    windowsHide: true,
    env: {
      ...process.env,
      YTDLP_PATH: "",
      PYTHON_PATH: "__flux_missing_python__",
      FFMPEG_PATH: "__flux_missing_ffmpeg__",
    },
  });
} catch (error) {
  assert.equal(error.code, 1);
  assert.match(error.stdout, /yt-dlp missing/);
  assert.match(error.stdout, /FFmpeg missing/);
  assert.match(error.stdout, /pip install/);
  missingToolsHandled = true;
}
assert.ok(missingToolsHandled);
console.log(
  `PASS: clean npm install, packaged version ${version}, executable bin, platform list, licenses, invalid-URL rejection, and actionable missing-tool errors.`,
);
console.log(`Source: ${source}\nIsolated installation: ${cwd}`);
await mkdir("reports/package", { recursive: true });
await writeFile(
  "reports/package/latest.json",
  JSON.stringify(
    {
      checkedAt: new Date().toISOString(),
      source,
      version,
      installation: cwd,
      entry,
      passed: true,
    },
    null,
    2,
  ) + "\n",
);
