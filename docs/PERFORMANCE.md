# Performance changes

Measured locally on 19 November 2026 using the public Blender YouTube sample. These are individual local runs, not a general throughput benchmark. Source/platform response time and host load vary.

| Request               | Before (development server) | After (same development server) | After (production server) |
| --------------------- | --------------------------: | ------------------------------: | ------------------------: |
| Repeated inspection 1 |                    8,187 ms |                           87 ms |                     35 ms |
| Repeated inspection 2 |                   14,503 ms |                           68 ms |                     41 ms |

The repeat checks used the same URL within the 60-second cache window. First-time extraction still contacts the platform: it took 9,145 ms before and 19,001 ms / 41,319 ms in the later development / production runs during local build/browser-test activity. Caching does not make a new source instantaneous, and these runs do not establish a cold-request speedup. Homepage cold-start measurements also varied under that activity; no page-load speedup percentage is claimed.

## What changed

- Cache up to 100 successful metadata inspections for 60 seconds. Concurrent inspections of the same normalized URL share one subprocess. Returned objects are cloned to prevent a caller from mutating cached data. Failed or blocked inspections are never cached. Expired entries reload.
- Reuse a recent successful inspection for download preflight. Clicking Download after Find video no longer waits for another identical preflight extraction. The actual download still lets yt-dlp resolve the source and runs its age/live match filter.
- Cache job lists for two seconds and invalidate immediately after every atomic job write. Concurrent callers share reads. This avoids repeated directory and JSON reads across local clients without delaying local status changes behind the cache TTL.
- Poll idle pages every 15 seconds instead of three (80% fewer steady-state idle requests). Poll active jobs every two seconds, pause hidden tabs, refresh on return, and cancel pending polling on unmount. Polls cannot overlap.
- Serve the existing DM Sans and Manrope fonts locally using `next/font/local`, with two preloaded variable WOFF2 fonts. Browsers no longer need Google font CSS or font-server requests, and builds use installed package files instead of downloading fonts.
- Fetch up to four DASH/HLS fragments concurrently where yt-dlp supports it (previous default: one). Actual download throughput is still limited by the source, connection, and disk; no throughput improvement has been measured here.
- Limit browser tests to two workers to reduce local machine load during verification.

## Run the optimized server

Stop the development server with Ctrl+C, then:

```powershell
npm run build
npm start
```

Rebuild after source changes. Keep `npm run dev` for editing. Both servers bind to loopback; use only one instance against a given downloads directory.

With a server running, repeat the metadata benchmark:

```powershell
npm run benchmark
# Optional alternate local server:
npm run benchmark -- http://127.0.0.1:3100
```

The benchmark performs one homepage request, one download-list request, and three inspections. It downloads no media. A process restart, cache expiry, or a different URL makes the next inspection cold.

## Regression checks

`tests/async-cache.test.ts` checks shared concurrent loads, expiration, retry after failure, bounded entries, returned-object isolation, and invalidation during an in-flight load. Engine tests verify that inspect-to-download performs only one metadata extraction and that job writes invalidate list caching. Desktop/mobile browser tests check idle polling, hidden-tab suspension, visibility refresh, and local font loading.
