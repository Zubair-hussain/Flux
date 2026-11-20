# Security policy

Please report vulnerabilities **privately** to **hello@zubairhussain.xyz** with the subject "Security", or use GitHub's [private vulnerability reporting](https://github.com/Zubair-hussain/Flux/security/advisories/new). Do not open a public issue.

Include the affected version or commit, steps to reproduce, and the impact. You will get a reply within a few days, and fixes are released as soon as they are ready.

## Design notes

- The web app's API is loopback-only (`src/lib/http.ts`). It rejects non-local hosts and foreign origins, and allows only Chrome extension origins besides the app itself.
- yt-dlp runs without a shell, with `--ignore-config`, and with `--` before every URL, so URLs cannot inject options.
- Clients never choose filesystem paths. Downloads go to job folders named by random UUIDs.
- Responses send CSP, `X-Frame-Options`, `nosniff`, referrer and permissions policies (`next.config.ts`).
