# Flux — video downloader

**Made by [zubairhussain.xyz](https://zubairhussain.xyz).**

AI-readable site information is available at `/llms.txt`; `/llm.txt` redirects there. Optional Google AdSense setup is documented in [advertising configuration](docs/ADSENSE.md). Ads are disabled by default.

Local-first Next.js + TypeScript downloader with a responsive violet/dark homepage, source-quality selection, persistent download records, an MCP server, and a Chrome Manifest V3 extension.

## Table of contents

1. [See it work](#see-it-work)
2. [Run](#run)
3. [Included](#included)
4. [Website audit (Sightline)](#website-audit-sightline)
5. [Checks](#checks)
6. [Demo video](#demo-video)
7. [Limits](#limits)

## See it work

<p align="center">
  <a href="docs/media/flux-demo.webm" title="Play the full demo video (WebM)">
    <img src="docs/media/flux-demo-preview.gif" width="860" alt="Flux demo: pasting a TikTok link, picking 720p, downloading in the background and saving the finished file">
  </a>
</p>

<p align="center">
  ▶️ <a href="docs/media/flux-demo.webm"><b>Play the full 40-second demo (WebM)</b></a>
</p>

Paste a public link, Flux reads the real source resolutions, you pick a quality, it downloads in the background, then you save the file. This is a real recording of a TikTok download (`npm run demo:video` records it again; see [Demo video](#demo-video)).

| What Flux is for                                                |                                                                                       |
| --------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| Saving your own or permitted videos in the **original quality** | 720p, 1080p, 1440p, 4K and 8K, only when the source has it. Never upscaled            |
| **One place** for many platforms                                | YouTube, TikTok, Instagram, X, Twitch, LinkedIn, Dailymotion and more                 |
| Keeping files **private**                                       | Runs on your computer. No account, and files never pass through someone else's server |
| **Browser and AI workflows**                                    | Chrome extension and an MCP server for Claude, Codex and other agents                 |

## Run

Requires Node.js 22+ (also used for YouTube challenges), Python 3.11+ (yt-dlp has deprecated 3.10), and FFmpeg on PATH.

```powershell
npm install
python -m pip install -U "yt-dlp[default,curl-cffi]"
# If FFmpeg is missing on Windows:
winget install Gyan.FFmpeg
npm run dev
```

Open **http://127.0.0.1:3000**. Paste a public video link, select an available resolution, start the download, then use **My downloads → Save file**. Files remain in the ignored `downloads/` folder. A missing engine produces setup instructions in the UI. Optional executable overrides are in `.env.example`.

For everyday use, stop the development server with Ctrl+C, run `npm run build` once, then `npm start`. This uses the optimized production server; `npm run dev` is for editing and has compilation overhead. Rebuild after source changes. Keep this single-process server bound to loopback. Background jobs require a continuously running Node process; serverless/edge deployment is unsupported.

Successful inspections are reused for 60 seconds, including when starting a download. Duplicate simultaneous requests share one extraction. Idle pages check jobs every 15 seconds, active queues every 2 seconds, and hidden tabs pause polling. Fragmented media can fetch four fragments concurrently. See [performance measurements](docs/PERFORMANCE.md); repeat the metadata benchmark with `npm run benchmark` while Flux is running.

## Included

- [Blog](/blog), About, Privacy, Cookies, Terms, Copyright, and Content Policy pages with breadcrumbs, canonical metadata, social cards, and preview-safe indexing. Blogger connection, public-domain configuration, and Cloudflare/D1 preparation are documented in [SEO and hosting](docs/SEO-AND-HOSTING.md). Placeholders are intentional; cloud services are not provisioned.

- YouTube, TikTok, Reddit, LinkedIn, Instagram, Twitch, X, Vimeo, Facebook, and Dailymotion domain support through yt-dlp. Source access and extractor support vary. Live check on 20 November 2026 (`node scripts/check-samples.mjs`, results in [docs/LIVE-SAMPLE-RESULTS.json](docs/LIVE-SAMPLE-RESULTS.json)): **YouTube, TikTok, Instagram, X, LinkedIn, Twitch and Dailymotion pass**. Reddit and Vimeo now require sign-in, which Flux deliberately does not support, and Facebook fails inside yt-dlp's own extractor (upstream).
- Exact source resolutions: 720p, 1080p, 1440p, 4K, 8K; never upscale. Video/audio merging uses FFmpeg, typically producing MKV for codec compatibility.
- URL and metadata filtering for sexual/NSFW and age-restricted content. **Metadata filtering cannot guarantee visual content safety**; see [content policy](docs/CONTENT-POLICY.md).
- Download queue/status and streamed local files; two concurrent download slots, restart detection, no shell interpolation, no client-controlled filesystem paths.
- [MCP / REST guide](docs/AGENTS.md) for agent clients, including Claude and Codex. Four tools inspect, download, list, and check status. Start the app first, then configure the stdio server (`npm run mcp`).
- Chrome extension: open `chrome://extensions`, enable Developer mode, click **Load unpacked**, and select the `extension/` folder. Open a supported video tab, click the extension, then **Open in Flux**. No history permission, remote scripts, or automatic page access.
- [Desktop/mobile wireframes](docs/WIREFRAMES.md), [test matrix](docs/TEST-CASES.md), [verification results](docs/VERIFICATION.md), and [delivery plan](docs/PLAN.md).

## Website audit (Sightline)

Flux is audited with **[Sightline](https://github.com/Zubair-hussain/Sightline)**, an open-source website audit tool by the same author. It checks SEO (titles, descriptions, canonicals, robots.txt, sitemap, JSON-LD, Open Graph, content depth), every link, hreflang, and website health (HTTPS, HSTS, CSP and other security headers, compression, caching).

```powershell
# One-time: get the Sightline CLI next to this project
git clone https://github.com/Zubair-hussain/Sightline .sightline
$env:ELECTRON_SKIP_BINARY_DOWNLOAD = "1"; npm ci --prefix .sightline --ignore-scripts; npm run build --prefix .sightline
# Audit every public page of a running Flux (npm run build; npm start)
npm run audit
# Or audit the live site, including HTTPS/HSTS/HTTP-3 checks
$env:AUDIT_BASE_URL = "https://your-domain"; npm run audit
```

Reports are saved to `reports/sightline/` (an HTML report and JSON per page, plus `summary.md`). The command fails when any page scores below **SEO 90** or **Links 90**, or below **Website health 80** on an HTTPS address. Override these with `AUDIT_MIN_SEO`, `AUDIT_MIN_LINKS` and `AUDIT_MIN_WEBSITE`. `SIGHTLINE_CLI` can point at another Sightline build.

**CI:** [`.github/workflows/sightline.yml`](.github/workflows/sightline.yml) builds Flux exactly as it will be indexed at launch, runs Sightline on all 8 pages for every push and pull request, posts a score table to the job summary, and uploads the HTML reports as the `sightline-reports` artifact. Set the repository variable `FLUX_PUBLIC_URL` to also audit the live site every Monday, or start the workflow manually with any URL.

Latest launch-mode results (20 November 2026, local build):

| Page         | Overall | SEO | Links | Before this audit  |
| ------------ | ------- | --- | ----- | ------------------ |
| `/`          | 91      | 100 | 100   | 68 overall, SEO 67 |
| `/about`     | 91      | 100 | 100   | SEO 64             |
| `/blog`      | 90      | 98  | 100   | SEO 70             |
| Policy pages | 90      | 98  | 100   | SEO 64–70          |

Fixed from the audit: security headers (CSP, `nosniff`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`, and HSTS on HTTPS), `WebSite`/`WebApplication`/`FAQPage` JSON-LD, a server-rendered how-to guide and FAQ on the homepage, 30–60 character page titles, and fuller About/Blog content. The remaining website-health items (HTTPS redirect, Brotli, HTTP/3) come from the host or CDN, for example Cloudflare, so they cannot pass on a local build. The "render-blocking script" note refers to Next.js's `nomodule` legacy polyfill, which modern browsers skip. Policy pages keep a word-count note because they are intentionally short.

## Checks

```powershell
npm run typecheck
npm test
npx playwright install chromium
npm run test:e2e
npm run build
npm run audit          # Sightline SEO, link and security-header audit (Flux must be running)
```

Coverage covers backend and API code, with enforced thresholds; open `coverage/index.html` after `npm test`. UI behavior is checked separately with desktop/mobile Playwright tests. Screenshots are in `test-results/`. The tests mock source networks; they do not prove universal platform availability. See the test matrix for per-file scope and manual extension/live-media checks.

## Demo video

`npm run demo:video` records [docs/media/flux-demo.webm](docs/media/flux-demo.webm) with Playwright from a running Flux (`npm run build; npm start`). It inspects and really downloads a short public NASA clip, adds step captions, and uses FFmpeg to shorten the download wait. Set `DEMO_BASE_URL`, `DEMO_VIDEO_URL` or `DEMO_QUALITY` to change it. Run the server from an empty folder if your own download history should stay out of the recording. It also regenerates `docs/media/flux-demo-preview.gif`, the animated preview shown at the top of this README, because GitHub does not play repository `.webm` files inline.

## Limits

Download only media you own or have permission to save. No DRM bypass, login-cookie import, playlists, current livestream recording, or sexual content. No account is required by Flux; source platforms may still restrict access. High-resolution media needs adequate disk space. Failed partial files require manual cleanup. This is a trusted local MVP, not a public multi-user service or a fully moderated product.

Implementation references: [Next.js App Router](https://nextjs.org/docs/app), [yt-dlp format selection](https://github.com/yt-dlp/yt-dlp#format-selection), [MCP SDK](https://ts.sdk.modelcontextprotocol.io/), [Chrome extension documentation](https://developer.chrome.com/docs/extensions/develop).
