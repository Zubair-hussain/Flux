# Live deployment check — 21 November 2026 (Pakistan time)

Target: https://flux.detroonshah.workers.dev/

The homepage, blog, About, Privacy, Cookies, Terms, Copyright, Content Policy, social preview image, robots, sitemap, llms.txt, and ads.txt returned HTTP 200. Canonical links use the live host. Cloudflare/OpenNext cache HIT headers were present on the homepage and static editorial pages. Observed individual page requests took roughly 130–730 ms from this machine; these are not general performance guarantees.

## Resolution — direct CLI distribution

The public command generator now provides `/downloads/flux.mjs` and generates `node ./flux.mjs '<video URL>'` for PowerShell or macOS/Linux Terminal. It no longer depends on the unpublished npm package. Builds copy the standalone bundle and its license files into public assets, and deployment smoke checks execute the downloaded bundle. Local API endpoints intentionally remain private: this is a public CLI companion website, not a hosted browser video-processing service.

The deployed CLI SHA-256 matched the tested local bundle (`912440541493b642d622aa0a1e64bc3f26ce1b6a42f3544010711c5a65749e8d`). Version and prerequisite checks passed. That downloaded file successfully inspected the Blender YouTube sample through 4K and completed a real NASA TikTok download at 720p. FFprobe verified AAC audio and HEVC video at 720×1280, duration 25.17 seconds, size 1,761,577 bytes. These checks establish those particular sources worked; other platforms can still impose authentication or regional restrictions.

Final Cloudflare deployment version: `3b69d8e7-bc1c-4eb6-ba84-2799620da9aa`. Live desktop/mobile browser checks passed for command generation, quality selection, and the direct CLI link. The mobile hero background overflow was corrected; viewport width and document width both measured 390px. Cloudflare build and 88 unit/API tests passed. Proof screenshots are in `reports/live/fixed-command-desktop.png` and `reports/live/fixed-command-mobile.png`.

Search indexing and AdSense remain disabled pending launch configuration. They are independent of the resolved CLI distribution issue.

## Installable npm package verification

On 21 November 2026, the public `.tgz` distribution was added at `https://flux.detroonshah.workers.dev/downloads/flux-downloader-1.0.0.tgz` (deployment `b03caf8f-4e28-400f-ad71-11adf27f85bb`). A fresh temporary npm project installed that live URL with lifecycle scripts disabled. The packaged version, executable shim (`npm exec --offline -- flux --version`), platform list, license files, unsupported-URL rejection, and helpful missing-engine/FFmpeg errors all passed. The exact advertised `npx --yes --package=<live archive URL> flux doctor` command passed independently.

That isolated installed package then inspected the real Blender YouTube sample through 4K and downloaded the NASA TikTok sample at 720p with audio. The public desktop/mobile command-generator checks passed again. All 88 unit/API tests and the Cloudflare production build passed. These installation checks ran on Windows with Node.js 24; the CI matrix is configured to repeat package checks on Linux and macOS, but those remote runs were not executed during this local session.

Repeat a clean installation check with `npm run verify:package -- https://flux.detroonshah.workers.dev/downloads/flux-downloader-1.0.0.tgz`. A machine-readable result is saved to `reports/package/latest.json`. The bare registry name is still unpublished: use the explicit archive URL or standalone `.mjs` download until npm publishing credentials and a registry release are available.

## Initial blocking issues (historical)

- Browser verification confirmed the live form uses **Get download command**, not Find video. It successfully generated `npx flux-downloader "https://www.youtube.com/watch?v=aqz-KE-bpKQ"`. However, `npm view flux-downloader version` returned registry E404 during this check. Visitors cannot run the advertised command from npm until the CLI is published or the site supplies a working installation/download route. No npm publication was performed.

- Every one of the ten URLs in SAMPLE-URLS.json returned HTTP 403 from POST /api/inspect with `Flux is a local-only service.` GET /api/downloads also returned 403. This is an application deployment restriction, not evidence that those source URLs are broken. No live media download was attempted because inspection is blocked.
- All inspected public pages specify noindex/nofollow. robots.txt disallows the entire site and sitemap.xml is empty. This matches the current preview configuration; public indexing is not enabled.
- ads.txt reports that the publisher is not configured. Advertising is not active.

## Architecture required for public downloads

The current guard in src/lib/http.ts intentionally permits only loopback hosts. Removing it alone will not create a working Cloudflare downloader: src/lib/engine.ts uses child processes, Python/yt-dlp, FFmpeg, and local job files. The Worker needs a separate authenticated download service running on a suitable Node/Python/container host, with a server-to-server proxy, job persistence, limits, and file delivery. Keep private backend credentials on the server. This audit makes no deployment or access-control changes.

The live website already presents a local CLI workflow. Finish its distribution/installation path before advertising it as ready. Enable public search indexing only when the operator is ready and the live product claims match the deployed functionality.

## Repeat checks

```powershell
node scripts/check-live-site.mjs https://flux.detroonshah.workers.dev
```

The checker reads the real sample URLs, submits metadata-only inspections, and saves timestamped HTTP results to reports/live/latest.json. It does not download video files. Browser evidence, when captured, is stored in reports/live/live-form-desktop.png.
