<div align="center">

# Flux: free video downloader for YouTube, TikTok, Instagram, X and more

**Save public videos in their original quality, from 720p to 4K and 8K.**
Web app · one-command CLI · Chrome extension · MCP server for AI agents. No account, no DRM bypass.

[![Verify Flux](https://github.com/Zubair-hussain/Flux/actions/workflows/ci.yml/badge.svg?branch=_prod)](https://github.com/Zubair-hussain/Flux/actions/workflows/ci.yml)
[![Sightline audit](https://github.com/Zubair-hussain/Flux/actions/workflows/sightline.yml/badge.svg?branch=_prod)](https://github.com/Zubair-hussain/Flux/actions/workflows/sightline.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-violet.svg)](LICENSE)
![Platforms](https://img.shields.io/badge/runs%20on-Windows%20%7C%20macOS%20%7C%20Linux-6e56cf)
![Quality](https://img.shields.io/badge/quality-720p%20to%208K-9873ff)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178c6)

[Demo](#see-it-work) · [CLI](#one-command-cli) · [Run the web app](#run) · [Legal](#legal-and-responsible-use) · [Contribute](#contributing)

</div>

Flux is an open-source, local-first video downloader by [Zubair Hussain](https://zubairhussain.xyz). Paste a link from YouTube, TikTok, Instagram, X (Twitter), LinkedIn, Twitch, Dailymotion and other sites. Flux shows only the resolutions the original upload really has, then saves the video to your own computer. It is built with Next.js, TypeScript, [yt-dlp](https://github.com/yt-dlp/yt-dlp) and FFmpeg.

⭐ **If Flux saves you time, star the repo.** It helps other people find it.

## Table of contents

1. [See it work](#see-it-work)
2. [One-command CLI](#one-command-cli)
3. [Run the web app](#run)
4. [Included](#included)
5. [Website audit (Sightline)](#website-audit-sightline)
6. [Download box on the website (optional)](#download-box-on-the-website-optional)
7. [Deploy (Cloudflare)](#deploy-cloudflare)
8. [Checks](#checks)
9. [Demo video](#demo-video)
10. [Limits](#limits)
11. [Legal and responsible use](#legal-and-responsible-use)
12. [Contributing](#contributing)
13. [License](#license)

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

| What Flux is for                                                |                                                                                                    |
| --------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| Saving your own or permitted videos in the **original quality** | 720p, 1080p, 1440p, 4K and 8K, only when the source has it. Never upscaled                         |
| **One place** for many platforms                                | YouTube, TikTok, Instagram, X, Twitch, LinkedIn, Dailymotion, Pinterest, Streamable, Loom and more |
| Keeping files **private**                                       | Runs on your computer. No account, and files never pass through someone else's server              |
| **Browser and AI workflows**                                    | Chrome extension and an MCP server for Claude, Codex and other agents                              |

## One-command CLI

Download [flux.mjs](https://flexdow.xyz/downloads/flux.mjs) to a folder and open PowerShell (Windows) or Terminal (macOS/Linux) there. The bundled CLI has no npm runtime dependencies; Node.js 22+, yt-dlp, and FFmpeg must be installed. Source availability varies by platform.

```bash
node ./flux.mjs 'https://youtu.be/aqz-KE-bpKQ'          # best available quality
node ./flux.mjs 'https://youtu.be/aqz-KE-bpKQ' -q 1080  # selected source quality
node ./flux.mjs info 'https://youtu.be/aqz-KE-bpKQ'     # inspect without downloading
node ./flux.mjs doctor                                # check prerequisites
```

The public website uses this direct download instead of depending on an npm release. From this repository, run `npm run build:cli` and `node packages/cli/dist/flux.mjs <url>`. Builds also copy the CLI and license files into the website's public downloads folder. Bare package-name installation requires a verified npm registry release; the direct archive below does not.

You can also use the installable [npm tarball](https://flexdow.xyz/downloads/flux-downloader-1.0.0.tgz) without a registry publication:

```powershell
npx --yes --package=https://flexdow.xyz/downloads/flux-downloader-1.0.0.tgz flux doctor
# Or download the .tgz file and install it globally:
npm install -g ./flux-downloader-1.0.0.tgz
flux --version
```

`npm run verify:package` checks a generated archive in an empty temporary directory, including installation, the npm executable shim, version, platform listing, licenses, and unsupported-URL rejection. Supply a live archive URL after `--` to verify the deployed package. CI runs this installation check on Windows, Linux, and macOS; the local check does not itself establish results on the other operating systems.

## Run

Run the web app locally:

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

- YouTube, TikTok, Reddit, LinkedIn, Instagram, Twitch, X, Vimeo, Facebook, Dailymotion, Pinterest, Streamable, and Loom domain support through yt-dlp. Source access and extractor support vary. Real download check on 21 November 2026 with the `flux` CLI at 720p (a file was saved and verified with ffprobe, with audio): **YouTube, TikTok, Instagram, Twitch, Dailymotion, LinkedIn, Pinterest, Streamable and Loom download correctly**. **X works but is very slow** (about 15 KB/s from the test network, so it can take an hour; Flux retries with single-file formats first). **Reddit and Vimeo** now require sign-in, which Flux deliberately does not support, and **Facebook** fails inside yt-dlp's own extractor (upstream). See the [open issues](https://github.com/Zubair-hussain/Flux/issues) for the plan.
- Exact source resolutions: 720p, 1080p, 1440p, 4K, 8K; never upscale. Video/audio merging uses FFmpeg, typically producing MKV for codec compatibility.
- URL and metadata filtering for sexual/NSFW and age-restricted content. **Metadata filtering cannot guarantee visual content safety**; see [content policy](docs/CONTENT-POLICY.md).
- Download queue/status and streamed local files; two concurrent download slots, restart detection, no shell interpolation, no client-controlled filesystem paths.
- [MCP / REST guide](docs/AGENTS.md) for agent clients, including Claude and Codex. Four tools inspect, download, list, and check status. Start the app first, then configure the stdio server (`npm run mcp`).
- Chrome extension: open `chrome://extensions`, enable Developer mode, click **Load unpacked**, and select the `extension/` folder. Open a supported video tab, click the extension, then **Open in Flux**. No history permission, remote scripts, or automatic page access.
- Optional Google AdSense with reserved, layout-safe ad positions. Ads are off by default; see [advertising configuration](docs/ADSENSE.md).
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

Latest results from the Sightline CI run on GitHub (20 November 2026):

| Page         | Overall | SEO | Links | Before this audit  |
| ------------ | ------- | --- | ----- | ------------------ |
| `/`          | 91      | 100 | 100   | 68 overall, SEO 67 |
| `/about`     | 90      | 98  | 100   | SEO 64             |
| `/blog`      | 90      | 98  | 100   | SEO 70             |
| Policy pages | 90      | 98  | 100   | SEO 64–70          |

Fixed from the audit: security headers (CSP, `nosniff`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`, and HSTS on HTTPS), `WebSite`/`WebApplication`/`FAQPage` JSON-LD, a server-rendered how-to guide and FAQ on the homepage, 30–60 character page titles, and fuller About/Blog content. The remaining website-health items (HTTPS redirect, Brotli, HTTP/3) come from the host or CDN, for example Cloudflare, so they cannot pass on a local build. The "render-blocking script" note refers to Next.js's `nomodule` legacy polyfill, which modern browsers skip. Policy pages keep a word-count note because they are intentionally short.

## Download box on the website (optional)

The website can offer a real download box next to the command-line option. It needs a small Flux server, because Cloudflare Workers cannot run yt-dlp or FFmpeg. The server ships as a Docker image with per-visitor rate limits, size, length and resolution caps, automatic deletion after an hour, optional Cloudflare Turnstile bot protection, and the same content rules as the local app. Without it, the website shows the command-line option only. Setup, costs and risks are in [docs/HOSTED-SERVER.md](docs/HOSTED-SERVER.md).

## Deploy (Cloudflare)

The public website runs on Cloudflare Workers: https://flexdow.xyz. Media processing runs on the visitor's computer, so the hosted homepage provides a downloadable CLI and a `node ./flux.mjs` command. `npm run cf:deploy` deploys, and [deploy-cloudflare.yml](.github/workflows/deploy-cloudflare.yml) does it on every push to `_prod` once the Cloudflare secrets are added. Setup details and going-public steps are in [docs/SEO-AND-HOSTING.md](docs/SEO-AND-HOSTING.md).

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

Design and scaling notes are in [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

Implementation references: [Next.js App Router](https://nextjs.org/docs/app), [yt-dlp format selection](https://github.com/yt-dlp/yt-dlp#format-selection), [MCP SDK](https://ts.sdk.modelcontextprotocol.io/), [Chrome extension documentation](https://developer.chrome.com/docs/extensions/develop).

## Legal and responsible use

Flux is a tool, and you are responsible for how you use it. Download only videos you own, have permission to save, or that are licensed for it, and follow each platform's terms of service. Flux never bypasses DRM, sign-in or paywalls, and blocks live streams, playlists, age-restricted and sexual content. It is **not affiliated with** YouTube, TikTok, Instagram, X, LinkedIn, Twitch, Dailymotion or any other platform. Read the full [legal notice](LEGAL.md). Copyright concerns: hello@zubairhussain.xyz.

## Contributing

Issues and pull requests are welcome. See [CONTRIBUTING.md](CONTRIBUTING.md) and the [code of conduct](CODE_OF_CONDUCT.md), and report security problems privately as described in [SECURITY.md](SECURITY.md). The default branch is `_prod`.

## License

[MIT](LICENSE) © 2026 [Zubair Hussain](https://zubairhussain.xyz). AI-readable project information is at `/llms.txt` on the website.
