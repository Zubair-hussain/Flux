# flux-downloader

**One command to save public videos in their original quality**, from YouTube, TikTok, Instagram, X, LinkedIn, Twitch, Dailymotion, Pinterest, Streamable, Loom and more. It works on Windows, macOS and Linux, needs no account, and never bypasses DRM.

```bash
node ./flux.mjs 'https://youtu.be/aqz-KE-bpKQ'
```

First download [flux.mjs](https://flexdow.xyz/downloads/flux.mjs) and open PowerShell or Terminal in that folder. This works without an npm release. Run `node ./flux.mjs doctor` to check prerequisites.

For npm installation before a registry release, use the hosted package:

```bash
npx --yes --package=https://flexdow.xyz/downloads/flux-downloader-1.0.0.tgz flux doctor
```

The following npm installation is only available after a verified npm publication:

```bash
npm install -g flux-downloader
flux https://www.tiktok.com/@nasa/video/7665075736742530317 -q 1080
```

## Requirements

| Tool        | Install                                                                                                 |
| ----------- | ------------------------------------------------------------------------------------------------------- |
| Node.js 22+ | https://nodejs.org                                                                                      |
| yt-dlp      | `python -m pip install -U "yt-dlp[default,curl-cffi]"`                                                  |
| FFmpeg      | Windows: `winget install Gyan.FFmpeg` · macOS: `brew install ffmpeg` · Linux: `sudo apt install ffmpeg` |

Run `flux doctor` to check all three.

## Commands

| Command                  | What it does                                                           |
| ------------------------ | ---------------------------------------------------------------------- |
| `flux <url>`             | Download in the best quality the source offers                         |
| `flux <url> -q 1080`     | Download an exact resolution: `720`, `1080`, `1440`, `4k`, `8k`        |
| `flux <url> -o ~/Videos` | Choose the folder to save into                                         |
| `flux info <url>`        | Show the title, creator and available qualities (`--json` for scripts) |
| `flux platforms`         | List supported platforms                                               |
| `flux doctor`            | Check Node.js, yt-dlp and FFmpeg                                       |

Flux offers only the resolutions the original upload really has (720p to 8K) and never upscales. Portrait videos count by their short edge, so a 1080×1920 clip is 1080p. Video and audio are merged into one MKV or MP4 file.

## Responsible use

Only download videos you own or have permission to save, and follow each platform's terms. Flux blocks live streams, playlists, age-restricted and sexual content, and never bypasses DRM, sign-in or paywalls. See [LEGAL.md](https://github.com/Zubair-hussain/Flux/blob/_prod/LEGAL.md). Flux is not affiliated with any video platform.

Part of [Flux](https://github.com/Zubair-hussain/Flux), which also has a web app, Chrome extension and MCP server. MIT License © Zubair Hussain.
