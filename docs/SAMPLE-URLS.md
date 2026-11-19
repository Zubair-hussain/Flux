# Real sample URLs

Checked on **19 November 2026** through the local Flux `/api/inspect` endpoint. These are metadata checks, not full downloads. YouTube was also downloaded and verified during the original project validation. Results depend on your network and platform restrictions.

| Platform    | Real sample URL                                                                                      | Latest inspection                                                                            |
| ----------- | ---------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| YouTube     | https://www.youtube.com/watch?v=aqz-KE-bpKQ                                                          | Passed: 720p, 1080p, 1440p, 4K                                                               |
| TikTok      | https://www.tiktok.com/@nasa/video/7665075736742530317                                               | Passed: 720p, 1080p                                                                          |
| Instagram   | https://www.instagram.com/reel/C_bnaTAO2Ll/                                                          | Passed: 720p                                                                                 |
| Reddit      | https://www.reddit.com/r/space/comments/r1cqou/dart_mission_launch/                                  | Failed: source requires authentication                                                       |
| X / Twitter | https://x.com/michaelnicollsx/status/2051498745251201193                                             | Passed: 720p, 1080p                                                                          |
| LinkedIn    | https://www.linkedin.com/posts/dwaynelawrence_nasa-space-astronomy-activity-7478151654790418433-Cnsj | Failed: extractor provided no video dimensions; Flux cannot offer a verified resolution      |
| Twitch      | https://clips.twitch.tv/ZanyBlazingOtterNomNom-86PFh3-7kWWyJhrs                                      | Passed: 720p, 4K                                                                             |
| Vimeo       | https://vimeo.com/1084537                                                                            | Failed: source requires login                                                                |
| Facebook    | https://www.facebook.com/NASA/videos/10154861046561772/                                              | Failed: yt-dlp could not parse the source data                                               |
| Dailymotion | https://www.dailymotion.com/video/xbxi4vu                                                            | Failed: the extractor requires an impersonation dependency not installed in this environment |

Failure details above were obtained from a separate yt-dlp diagnostic run. The app deliberately returns a simpler source-access error for most extractor failures. A failure for one sample does not establish that every video on that platform fails.

## Test manually

1. Run `npm run dev` and open http://127.0.0.1:3000.
2. Copy a sample URL above into the URL field and click **Find video**.
3. A passed inspection should show the title and offered source qualities.
4. To test a full download, use media you own or have permission to save, choose a quality, click **Download**, then open **My downloads** and **Save file** after completion.

Start with the YouTube Blender sample, which is Creative Commons licensed. Do not expect 4K/8K options when the source does not offer those resolutions.

## Repeat all metadata checks

With Flux running in another terminal:

```powershell
node scripts/check-samples.mjs
```

URLs are stored in `docs/SAMPLE-URLS.json`. Timestamped results are saved to `docs/LIVE-SAMPLE-RESULTS.json`. The checker inspects at most three URLs concurrently and downloads no video files. This Markdown table is the reviewed result from the date above; reruns update the JSON results.

The initial live run found a portrait-resolution bug. Flux now recognizes 720×1280 as 720p and 1080×1920 as 1080p, using the shorter frame dimension. A regression test and live yt-dlp format-selection checks cover the fix.
