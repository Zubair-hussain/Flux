# Live deployment check — 21 November 2026 (Pakistan time)

Target: https://flux.detroonshah.workers.dev/

The homepage, blog, About, Privacy, Cookies, Terms, Copyright, Content Policy, social preview image, robots, sitemap, llms.txt, and ads.txt returned HTTP 200. Canonical links use the live host. Cloudflare/OpenNext cache HIT headers were present on the homepage and static editorial pages. Observed individual page requests took roughly 130–730 ms from this machine; these are not general performance guarantees.

## Blocking issues

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
