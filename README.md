# Flux — video downloader

Local-first Next.js + TypeScript downloader with a responsive violet/dark homepage, source-quality selection, persistent download records, an MCP server, and a Chrome Manifest V3 extension.

## Run

Requires Node.js 22+ (also used for YouTube challenges), Python 3.10+ (3.11+ recommended), and FFmpeg on PATH.

```powershell
npm install
python -m pip install -U "yt-dlp[default]"
# If FFmpeg is missing on Windows:
winget install Gyan.FFmpeg
npm run dev
```

Open **http://127.0.0.1:3000**. Paste a public video link, select an available resolution, start the download, then use **My downloads → Save file**. Files remain in the ignored `downloads/` folder. A missing engine produces setup instructions in the UI. Optional executable overrides are in `.env.example`.

For a production local build: `npm run build`, then `npm start`. Keep this single-process server bound to loopback. Background jobs require a continuously running Node process; serverless/edge deployment is unsupported.

## Included

- YouTube, TikTok, Reddit, LinkedIn, Instagram, Twitch, X, Vimeo, Facebook, and Dailymotion domain support through yt-dlp. Source access and extractor support vary.
- Exact source resolutions: 720p, 1080p, 1440p, 4K, 8K; never upscale. Video/audio merging uses FFmpeg, typically producing MKV for codec compatibility.
- URL and metadata filtering for sexual/NSFW and age-restricted content. **Metadata filtering cannot guarantee visual content safety**; see [content policy](docs/CONTENT-POLICY.md).
- Download queue/status and streamed local files; two concurrent download slots, restart detection, no shell interpolation, no client-controlled filesystem paths.
- [MCP / REST guide](docs/AGENTS.md) for agent clients, including Claude and Codex. Four tools inspect, download, list, and check status. Start the app first, then configure the stdio server (`npm run mcp`).
- Chrome extension: open `chrome://extensions`, enable Developer mode, click **Load unpacked**, and select the `extension/` folder. Open a supported video tab, click the extension, then **Open in Flux**. No history permission, remote scripts, or automatic page access.
- [Desktop/mobile wireframes](docs/WIREFRAMES.md), [test matrix](docs/TEST-CASES.md), and [delivery plan](docs/PLAN.md).

## Checks

```powershell
npm run typecheck
npm test
npx playwright install chromium
npm run test:e2e
npm run build
```

Coverage covers backend and API code, with enforced thresholds; open `coverage/index.html` after `npm test`. UI behavior is checked separately with desktop/mobile Playwright tests. Screenshots are in `test-results/`. The tests mock source networks; they do not prove universal platform availability. See the test matrix for per-file scope and manual extension/live-media checks.

## Limits

Download only media you own or have permission to save. No DRM bypass, login-cookie import, playlists, current livestream recording, or sexual content. No account is required by Flux; source platforms may still restrict access. High-resolution media needs adequate disk space. Failed partial files require manual cleanup. This is a trusted local MVP, not a public multi-user service or a fully moderated product.

Implementation references: [Next.js App Router](https://nextjs.org/docs/app), [yt-dlp format selection](https://github.com/yt-dlp/yt-dlp#format-selection), [MCP SDK](https://ts.sdk.modelcontextprotocol.io/), [Chrome extension documentation](https://developer.chrome.com/docs/extensions/develop).
