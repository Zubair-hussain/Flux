# Verification results

Verified locally on Windows with Node 24, Next.js 16, Python 3.10, yt-dlp 2026.10.21 plus EJS, and FFmpeg.

- Production build: passed, including all five API route handlers.
- TypeScript: passed.
- Unit/API tests: 61 passed, including a portrait-resolution regression case added after live sample checks.
- Backend/API V8 coverage: statements 98.21%, branches 94.28%, functions 93.93%, lines 98.17%. UI, MCP, extension, configuration, and docs are outside these percentages.
- Browser suite: 10 passed across desktop (1440px) and mobile (390px). Includes source-quality selection, creating a job, policy error display, dialog dismissal, layout overflow, and mocked Chrome popup behavior.
- MCP: real stdio handshake, discovery of all four tool schemas, and list-downloads API round-trip passed (`node scripts/smoke-mcp.mjs` with the app running).
- Dependency audit: zero vulnerabilities after upgrading Vitest/coverage and Zod.
- Live YouTube extraction: official Blender Big Buck Bunny source returned 720p, 1080p, 1440p, and 2160p. 8K correctly absent.
- Live download: completed the Blender source at 720p, merged into MKV with AV1 video and AAC audio. The complete file is 101,989,630 bytes; FFprobe reports 1280×720 and 634.624 seconds. Saved through the real HTTP attachment endpoint.

Screenshots: `test-results/home-desktop.png` and `test-results/home-mobile.png`. HTML coverage: `coverage/index.html`. These generated artifacts are ignored by Git; CI uploads verification artifacts.

Chrome's actual load-unpacked installation and every supported platform/source combination are not automated here. Third-party access varies; inspect/download failures are exposed in the UI. Public hosting and visual content moderation are outside this local MVP's scope.

Live sample checks for all ten configured platforms are recorded in [SAMPLE-URLS.md](SAMPLE-URLS.md) and `LIVE-SAMPLE-RESULTS.json`. Five passed inspection on the recorded run; the remaining five exposed source restrictions, missing dimensions, or extractor/dependency limitations. The portrait-quality fix was also checked with real yt-dlp format selection for both a 720×1280 TikTok source and a 1280×720 YouTube source.
