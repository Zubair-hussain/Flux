# Why some platforms do not download on the server, and what to do

Checked on the live site on 22 November 2026, with the sample links in `docs/SAMPLE-URLS.json`.

| Platform                                                            | On the website server | On a visitor's own computer | Cause                                                                                              |
| ------------------------------------------------------------------- | --------------------- | --------------------------- | -------------------------------------------------------------------------------------------------- |
| TikTok, Instagram, X, LinkedIn, Twitch, Pinterest, Streamable, Loom | Works                 | Works                       |                                                                                                    |
| **YouTube**                                                         | Blocked               | Works                       | YouTube refuses requests from hosting-company addresses ("confirm you're not a bot")               |
| **Dailymotion**                                                     | Blocked               | Works                       | Same kind of block (it works in a Linux container on a home connection, not on Render)             |
| **Reddit, Vimeo, Facebook**                                         | Fails                 | Fails                       | They now require a sign-in, or yt-dlp cannot read the page. Flux does not use passwords or cookies |

The first two rows are an **address problem**, not a code problem. A second download engine does not help: I tried gallery-dl and you-get on the failing links and neither worked (Reddit blocked gallery-dl, and you-get returned only a 64×64 picture).

## What Flux does about it

1. **The page offers your visitor's own computer.** When the server cannot fetch a video, the error says so and the command for the visitor's computer appears below it, ready to copy. A home connection is trusted far more than a data centre, so YouTube and Dailymotion work there.
2. **The load balancer fails over.** If a backend is refused by a platform (or is busy), the router asks the next healthy backend before giving up. Only requests that start new work move; a file stays on the server that holds it.
3. **A backend can be marked `fallback`.** It is only asked after the normal backends have refused. Use this for a server on a home connection (below).
4. **A paid proxy can carry only the blocked platforms** (below).

## Option A: add a backend on a home connection (free)

A computer on your home internet is not blocked the way a data centre is, so it can serve YouTube and Dailymotion while the cloud backend serves everything else.

1. On that computer install Node.js 24, Python 3.11+, FFmpeg, and yt-dlp (`python -m pip install -U "yt-dlp[default,curl-cffi]"`).
2. Clone the repository, run `npm ci` and `npm run build`.
3. Start it with the **same** `FIREBASE_DATABASE_URL`, `FIREBASE_SERVICE_ACCOUNT_JSON` and `FLUX_ROUTER_SECRET` as the other backends, plus `FLUX_HOSTED=true`, a unique `FLUX_BACKEND_ID` (for example `home-1`), `FLUX_MAX_CONCURRENT=1`, and the same size and length limits. Then `npm start`. Details: [FIREBASE-RENDER.md](FIREBASE-RENDER.md).
4. Give it a public HTTPS address with a Cloudflare Tunnel (`cloudflared tunnel --url http://127.0.0.1:3000` gives a temporary address; a named tunnel on your own domain gives a permanent one). The address must have no port and no path.
5. Add it to the router's `FLUX_BACKENDS` secret as a fallback and redeploy the website:

```json
{
  "backend-1": "https://YOUR-SERVICE.onrender.com",
  "home-1": { "url": "https://home.your-domain.example", "fallback": true }
}
```

Be aware of the trade-offs:

- The computer must be on and online. When it is off, the router simply skips it and the page falls back to the visitor's-own-computer command.
- Downloads leave from **your home address**. A platform that dislikes the traffic can slow or block it, and your internet provider's terms apply. Keep the limits low and the Turnstile bot check on.
- A temporary tunnel address changes every start, so the secret would need updating each time. Use a named tunnel for anything lasting.
- This setup has not been tested end to end here, because it needs your Firebase and Cloudflare accounts. The router logic is covered by automated tests.

## Option B: send only the blocked platforms through a proxy

Set these on a backend:

| Variable               | Example                               | Meaning                                                                           |
| ---------------------- | ------------------------------------- | --------------------------------------------------------------------------------- |
| `FLUX_PROXY_URL`       | `http://user:pass@proxy.example:8080` | The proxy (`http`, `https`, `socks4`, `socks5` or `socks5h`)                      |
| `FLUX_PROXY_PLATFORMS` | `youtube,dailymotion`                 | Which platforms use it. Nothing is proxied unless listed (`all` sends everything) |

Only the listed platforms use the proxy, so you pay for little traffic. The address is never logged or shown to visitors. **Cost warning:** residential proxies are usually billed per gigabyte, and one 720p video is tens of megabytes, so check the price per download. Use a proxy service whose terms allow this use. Datacenter proxies are cheap but usually blocked by the same platforms.

## What will not be added

Flux will not log in to platforms or use cookies or passwords to get around these blocks. That would put real accounts at risk and open the door to private content (see [LEGAL.md](../LEGAL.md)). Reddit, Vimeo and Facebook stay unsupported until they change or yt-dlp fixes them.
