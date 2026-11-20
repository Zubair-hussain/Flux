// Records a real walkthrough of Flux as a WebM video (docs/media/flux-demo.webm).
// Start Flux first (npm run build && npm start), then: npm run demo:video
//   DEMO_BASE_URL  Flux address (default http://127.0.0.1:3000)
//   DEMO_VIDEO_URL Public video to inspect and download (default: a short NASA clip)
//   DEMO_QUALITY   Resolution to download (default: lowest offered, to keep it quick)
import { chromium } from "@playwright/test";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { mkdir, readdir, rename, rm } from "node:fs/promises";
import path from "node:path";

const base = process.env.DEMO_BASE_URL || "http://127.0.0.1:3000";
const videoUrl =
  process.env.DEMO_VIDEO_URL ||
  "https://www.tiktok.com/@nasa/video/7665075736742530317";
const out = path.resolve(import.meta.dirname, "../docs/media");
const temp = path.join(out, ".recording");
const size = { width: 1280, height: 720 };
await rm(temp, { recursive: true, force: true });
await mkdir(temp, { recursive: true });

// Warm Flux's 60-second inspection cache so the video does not show a long
// spinner while yt-dlp contacts the source.
const warm = await fetch(`${base}/api/inspect`, {
  method: "POST",
  headers: { "Content-Type": "application/json", Origin: base },
  body: JSON.stringify({ url: videoUrl }),
});
if (!warm.ok)
  throw new Error(`Inspection failed: ${(await warm.json()).error}`);

const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: size,
  deviceScaleFactor: 1,
  colorScheme: "dark",
  recordVideo: { dir: temp, size },
});
const page = await context.newPage();
const recordingStarted = Date.now();
const videoTime = () => (Date.now() - recordingStarted) / 1000;
const pause = (ms) => page.waitForTimeout(ms);
const started = Date.now();
const log = (step) =>
  console.log(`${((Date.now() - started) / 1000).toFixed(1)}s ${step}`);

// Caption bar drawn on top of the real UI so viewers know what each step does.
async function caption(step, text) {
  log(text);
  await page.evaluate(
    ([step, text]) => {
      let bar = document.getElementById("demo-caption");
      if (!bar) {
        bar = document.createElement("div");
        bar.id = "demo-caption";
        Object.assign(bar.style, {
          position: "fixed",
          left: "50%",
          bottom: "28px",
          transform: "translateX(-50%)",
          zIndex: "9999",
          padding: "14px 22px",
          borderRadius: "14px",
          background: "rgba(18, 14, 30, 0.92)",
          border: "1px solid rgba(173, 145, 255, 0.45)",
          boxShadow: "0 12px 40px rgba(0,0,0,0.5)",
          color: "#f3f2fa",
          font: "600 20px/1.35 system-ui, sans-serif",
          display: "flex",
          gap: "14px",
          alignItems: "center",
          maxWidth: "80%",
          transition: "opacity 0.25s ease",
        });
        document.body.appendChild(bar);
      }
      bar.style.opacity = "0";
      setTimeout(() => {
        bar.innerHTML = "";
        if (step) {
          const badge = document.createElement("span");
          badge.textContent = step;
          Object.assign(badge.style, {
            minWidth: "34px",
            height: "34px",
            borderRadius: "50%",
            display: "grid",
            placeItems: "center",
            background: "linear-gradient(135deg, #c7b3ff, #9873ff)",
            color: "#120d1d",
            fontWeight: "800",
          });
          bar.appendChild(badge);
        }
        bar.appendChild(document.createTextNode(text));
        bar.style.opacity = "1";
      }, 250);
    },
    [step, text],
  );
  await pause(400);
}

await page.goto(base, { waitUntil: "networkidle" });
await caption("", "Flux: save public videos in their original quality");
await pause(3200);

const scrollBy = (top) =>
  page.evaluate((top) => window.scrollBy({ top, behavior: "smooth" }), top);
await caption("", "Works with YouTube, TikTok, Instagram, X, Twitch and more");
await scrollBy(420);
await pause(2800);
await page.evaluate(() => window.scrollTo({ top: 0, behavior: "smooth" }));
await pause(1200);

await caption("1", "Paste a public video link");
const input = page.locator("#video-url");
await input.click();
await input.pressSequentially(videoUrl, { delay: 28 });
await pause(900);

await caption("2", "Flux reads the resolutions the source really offers");
await page.getByRole("button", { name: "Find video" }).click();
await page.locator(".video-result").waitFor({ timeout: 120_000 });
await page
  .locator(".video-result")
  .evaluate((el) => el.scrollIntoView({ block: "center", behavior: "smooth" }));
await pause(2600);

const select = page.locator(".result-actions select");
const options = await select
  .locator("option")
  .evaluateAll((o) => o.map((x) => x.value));
const quality = process.env.DEMO_QUALITY || options[0];
await caption("3", "Pick a quality: nothing is upscaled");
await select.selectOption(quality);
await pause(2000);

await caption("4", "Download. Video and audio are merged into one file");
await page.locator(".result-actions .primary-button").click();
await page.locator(".queue-page").waitFor();
await pause(1500);
await caption("5", "It downloads in the background, with live status");
const waitStart = videoTime() + 3;
await page
  .locator(".job .save-button", { hasText: "Save file" })
  .first()
  .waitFor({ timeout: 300_000 });
const waitEnd = videoTime() - 0.5;
await caption("6", "Done. Save the finished file to your device");
await pause(800);
await page.locator(".job .save-button").first().hover();
await pause(2600);

await page.getByRole("button", { name: /Video downloader/ }).click();
await pause(600);
await caption("", "Plus a step-by-step guide and FAQ on the homepage");
await page.locator("#how-it-works").scrollIntoViewIfNeeded();
await pause(1200);
await scrollBy(360);
await pause(2600);
await caption("", "Flux · free, local-first, no account needed");
await pause(3000);

const recording = page.video();
await context.close();
await browser.close();
const file = path.join(out, "flux-demo.webm");
await rm(file, { force: true });
const raw = await recording.path();
if (waitEnd - waitStart > 4) {
  // Jump-cut the real download wait so the demo stays short.
  try {
    await promisify(execFile)(
      process.env.FFMPEG_PATH || "ffmpeg",
      [
        "-v",
        "error",
        "-y",
        "-i",
        raw,
        "-vf",
        `select='not(between(t,${waitStart.toFixed(2)},${waitEnd.toFixed(2)}))',setpts=N/FRAME_RATE/TB`,
        "-an",
        "-c:v",
        "libvpx-vp9",
        "-crf",
        "34",
        "-b:v",
        "0",
        "-row-mt",
        "1",
        "-deadline",
        "good",
        "-cpu-used",
        "4",
        file,
      ],
      { timeout: 600_000 },
    );
  } catch (error) {
    console.warn(`FFmpeg trim skipped (${error.message.split("\n")[0]})`);
    await rename(raw, file);
  }
} else await rename(raw, file);
await rm(temp, { recursive: true, force: true });
// README preview: GitHub cannot play repository .webm files inline, so an
// animated GIF links to the full video.
try {
  await promisify(execFile)(
    process.env.FFMPEG_PATH || "ffmpeg",
    [
      "-v",
      "error",
      "-y",
      "-i",
      file,
      "-vf",
      "fps=8,scale=860:-1:flags=lanczos,split[a][b];[a]palettegen=max_colors=96:stats_mode=diff[p];[b][p]paletteuse=dither=bayer:bayer_scale=4:diff_mode=rectangle",
      path.join(out, "flux-demo-preview.gif"),
    ],
    { timeout: 600_000 },
  );
} catch (error) {
  console.warn(`README preview GIF skipped (${error.message.split("\n")[0]})`);
}
console.log(`Saved ${file} (${(await readdir(out)).join(", ")})`);
