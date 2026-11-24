// Draws the blog images in Flux's look (dark, violet, DM Sans) into public/blog/.
// Run: node scripts/make-blog-images.mjs   (needs: npx playwright install chromium)
import { chromium } from "@playwright/test";
import { mkdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";

const root = path.resolve(import.meta.dirname, "..");
const out = path.join(root, "public/blog");
const font = pathToFileURL(
  path.join(
    root,
    "node_modules/@fontsource-variable/dm-sans/files/dm-sans-latin-wght-normal.woff2",
  ),
).href;

const base = `
  @font-face { font-family: "DM Sans"; src: url("${font}"); font-weight: 100 1000; }
  * { box-sizing: border-box; margin: 0; }
  body { font-family: "DM Sans", system-ui, sans-serif; color: #f3f2fa;
    background: radial-gradient(1200px 600px at 85% -10%, #3a2a66 0%, transparent 60%),
                radial-gradient(900px 500px at -10% 110%, #2a1f4d 0%, transparent 60%), #101116; }
  .brand { display: flex; align-items: center; gap: 14px; font-weight: 800; font-size: 34px; letter-spacing: -0.5px; }
  .mark { width: 46px; height: 46px; border-radius: 13px; background: linear-gradient(135deg, #c7b3ff, #9873ff); display: grid; place-items: center; }
  .mark i { width: 22px; height: 22px; border: 4px solid #17102b; border-radius: 6px; transform: rotate(45deg); }
  .dot { color: #ad91ff; }
  .accent { background: linear-gradient(90deg, #c7b3ff, #9873ff); -webkit-background-clip: text; background-clip: text; color: transparent; }
  .muted { color: #9899ad; }
  .site { position: absolute; left: 64px; bottom: 44px; font-size: 22px; color: #9899ad; }
`;

const brand = `<div class="brand"><span class="mark"><i></i></span><span>flux<span class="dot">.</span></span></div>`;

const images = [
  {
    file: "why-4k-is-not-always-4k-hero.png",
    width: 1200,
    height: 630,
    html: `
      <style>${base}
        .wrap { position: relative; width: 1200px; height: 630px; padding: 56px 64px; }
        h1 { font-size: 150px; line-height: 0.98; letter-spacing: -6px; font-weight: 800; margin-top: 60px; }
        p.sub { font-size: 38px; line-height: 1.3; margin-top: 34px; max-width: 920px; color: #c9c5da; font-weight: 500; }
        .chips { position: absolute; right: 64px; top: 60px; display: flex; gap: 12px; }
        .chips span { border: 1px solid #3a3247; background: #17161f; padding: 10px 18px; border-radius: 999px; font-weight: 700; font-size: 22px; color: #d9cffa; }
        .chips span.on { background: linear-gradient(135deg, #c7b3ff, #9873ff); color: #17102b; border-color: transparent; }
      </style>
      <div class="wrap">
        ${brand}
        <div class="chips"><span>720p</span><span>1080p</span><span class="on">4K</span><span>8K</span></div>
        <h1>Why 4K<br><span class="accent">isn't always 4K</span></h1>
        <p class="sub">Your 4K video may not be real 4K.</p>
        <div class="site">By Zubair Hussain · zubairhussain.xyz</div>
      </div>`,
  },
  {
    file: "quality-file-size-chart.png",
    width: 1200,
    height: 675,
    html: (() => {
      // Sizes the platform listed for one Dailymotion sample, November 2026 (MiB, estimated).
      const rows = [
        ["720p", 28.2],
        ["1080p", 60.7],
        ["1440p", 136.0],
        ["4K", 216.4],
      ];
      const max = 216.4;
      return `
      <style>${base}
        .wrap { position: relative; width: 1200px; height: 675px; padding: 52px 64px; }
        h2 { font-size: 52px; letter-spacing: -1.5px; font-weight: 800; margin-top: 30px; }
        .note { font-size: 24px; margin-top: 8px; }
        .rows { margin-top: 38px; display: grid; gap: 22px; }
        .row { display: grid; grid-template-columns: 120px 1fr 150px; align-items: center; gap: 22px; }
        .label { font-size: 32px; font-weight: 800; }
        .track { height: 46px; background: #191a22; border: 1px solid #2a2b36; border-radius: 12px; overflow: hidden; }
        .bar { height: 100%; border-radius: 11px; background: linear-gradient(90deg, #9873ff, #c7b3ff); }
        .size { font-size: 30px; font-weight: 700; text-align: right; color: #d9cffa; }
      </style>
      <div class="wrap">
        ${brand}
        <h2>Same video, <span class="accent">four sizes</span></h2>
        <div class="note muted">4K is about 3.5 times larger than 1080p. One Dailymotion sample, November 2026.</div>
        <div class="rows">
          ${rows
            .map(
              ([
                label,
                mb,
              ]) => `<div class="row"><div class="label">${label}</div>
                <div class="track"><div class="bar" style="width:${((mb / max) * 100).toFixed(1)}%"></div></div>
                <div class="size">~${Math.round(mb)} MB</div></div>`,
            )
            .join("")}
        </div>
        <div class="site">Sizes are estimates listed by the platform · flux.detroonshah.workers.dev</div>
      </div>`;
    })(),
  },
  {
    file: "vertical-video-quality.png",
    width: 1200,
    height: 675,
    html: `
      <style>${base}
        .wrap { position: relative; width: 1200px; height: 675px; padding: 52px 64px; }
        h2 { font-size: 52px; letter-spacing: -1.5px; font-weight: 800; margin-top: 30px; max-width: 560px; line-height: 1.05; }
        p { font-size: 26px; line-height: 1.45; margin-top: 22px; max-width: 540px; color: #c9c5da; }
        .phone { position: absolute; right: 190px; top: 56px; width: 270px; height: 480px; border-radius: 30px;
          background: linear-gradient(160deg, #2a1f4d, #191a22); border: 2px solid #9873ff; }
        .w { position: absolute; right: 190px; top: 560px; width: 270px; text-align: center; font-weight: 800; font-size: 28px; color: #c7b3ff; }
        .w:before { content: ""; position: absolute; left: 0; right: 0; top: -12px; border-top: 3px solid #c7b3ff; }
        .h { position: absolute; right: 112px; top: 56px; height: 480px; width: 60px; display: grid; place-items: center; font-weight: 700; font-size: 26px; color: #9899ad; }
        .h span { writing-mode: vertical-rl; }
        .tag { position: absolute; right: 232px; top: 262px; width: 186px; text-align: center; font-size: 46px; font-weight: 800; }
      </style>
      <div class="wrap">
        ${brand}
        <h2>Tall videos count by the <span class="accent">short side</span></h2>
        <p>A phone clip measuring 720&times;1280 is a 720p source. Calling it "1280p" would promise detail the video does not have.</p>
        <div class="phone"></div>
        <div class="tag accent">720p</div>
        <div class="w">720 px</div>
        <div class="h"><span>1280 px (long side)</span></div>
        <div class="site">By Zubair Hussain · zubairhussain.xyz</div>
      </div>`,
  },
];

await mkdir(out, { recursive: true });
const temp = await (
  await import("node:fs/promises")
).mkdtemp(path.join(os.tmpdir(), "flux-img-"));
const browser = await chromium.launch();
for (const image of images) {
  const page = await browser.newPage({
    viewport: { width: image.width, height: image.height },
    deviceScaleFactor: 1,
  });
  const file = path.join(temp, "page.html");
  await writeFile(file, `<!doctype html><meta charset="utf-8">${image.html}`);
  await page.goto(pathToFileURL(file).href);
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: path.join(out, image.file) });
  await page.close();
  console.log("wrote public/blog/" + image.file);
}
await browser.close();
await rm(temp, { recursive: true, force: true });
