import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { readFile, writeFile, mkdir, readdir, access } from "node:fs/promises";
import path from "node:path";
const run = promisify(execFile);
const proof = JSON.parse(await readFile("reports/package/latest.json", "utf8"));
await access(proof.entry).catch(() => {
  throw new Error(
    "Installed test package is missing. Run npm run verify:package with the live package URL first.",
  );
});
const selected = process.argv.slice(2).map((name) => name.toLowerCase());
const samples = JSON.parse(
  await readFile("docs/SAMPLE-URLS.json", "utf8"),
).filter(
  (sample) =>
    !selected.length || selected.includes(sample.platform.toLowerCase()),
);
if (!samples.length)
  throw new Error(
    "No matching platform name. Use names from docs/SAMPLE-URLS.json.",
  );
const summary = selected.length
  ? "reports/platform-downloads/latest-retry.json"
  : "reports/platform-downloads/latest.json";
const root = path.resolve(
  "reports/platform-downloads",
  new Date().toISOString().replace(/[:.]/g, "-"),
);
await mkdir(root, { recursive: true });
const results = [];
async function check(sample) {
  const result = { ...sample, checkedAt: new Date().toISOString() };
  const folder = path.join(root, sample.platform.replace(/\W+/g, "-"));
  try {
    const inspection = await run(
      process.execPath,
      [proof.entry, "info", sample.url, "--json"],
      { timeout: 110000, maxBuffer: 4 * 1024 * 1024, windowsHide: true },
    );
    const info = JSON.parse(inspection.stdout);
    result.title = info.title;
    result.qualities = info.qualities;
    console.log(
      JSON.stringify({
        platform: sample.platform,
        phase: "inspection",
        qualities: info.qualities,
      }),
    );
    if (!info.qualities?.length)
      throw new Error("No supported source resolution found.");
    const quality = Math.min(...info.qualities);
    result.downloadQuality = quality;
    await mkdir(folder, { recursive: true });
    try {
      const download = await run(
        process.execPath,
        [proof.entry, sample.url, "-q", String(quality), "-o", folder],
        { timeout: 240000, maxBuffer: 4 * 1024 * 1024, windowsHide: true },
      );
      await writeFile(
        path.join(folder, "download.log"),
        download.stdout + "\n" + download.stderr,
      );
    } catch (error) {
      await writeFile(
        path.join(folder, "download.log"),
        String(error.stdout || "") + "\n" + String(error.stderr || ""),
      );
      throw new Error(
        `Download failed: ${String(error.stdout || error.message)
          .trim()
          .slice(-1200)}`,
      );
    }
    const files = (await readdir(folder)).filter((name) =>
      /\.(mp4|mkv|webm|mov)$/.test(name),
    );
    if (files.length !== 1)
      throw new Error("No single complete media file found.");
    const probe = await run(
      "ffprobe",
      [
        "-v",
        "error",
        "-show_entries",
        "stream=codec_type,codec_name,width,height",
        "-show_entries",
        "format=duration,size",
        "-of",
        "json",
        path.join(folder, files[0]),
      ],
      { windowsHide: true, timeout: 20000 },
    );
    result.media = JSON.parse(probe.stdout);
    if (
      !result.media.streams?.some(
        (stream) => stream.codec_type === "video" && stream.width > 0,
      )
    )
      throw new Error("Downloaded file has no usable video stream.");
    result.audio = result.media.streams.some(
      (stream) => stream.codec_type === "audio",
    );
    const video = result.media.streams.find(
      (stream) => stream.codec_type === "video",
    );
    if (Math.min(video.width, video.height) !== quality)
      throw new Error(
        "Downloaded resolution does not match the requested source quality.",
      );
    result.status = "download verified";
  } catch (error) {
    result.status = "failed";
    result.error = String(error.stdout || error.message)
      .trim()
      .slice(-1500);
  }
  results.push(result);
  await writeFile(
    path.join(root, "results.json"),
    JSON.stringify(
      { package: proof.source, entry: proof.entry, results },
      null,
      2,
    ) + "\n",
  );
  console.log(JSON.stringify(result));
}
for (let i = 0; i < samples.length; i += 2)
  await Promise.all(samples.slice(i, i + 2).map(check));
await writeFile(
  summary,
  JSON.stringify(
    {
      package: proof.source,
      checkedAt: new Date().toISOString(),
      reportDirectory: root,
      results,
    },
    null,
    2,
  ) + "\n",
);
console.log(`Completed ${results.length} platforms. Results: ${summary}`);
