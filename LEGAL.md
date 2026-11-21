# Legal notice and responsible use

Flux is free, open-source software (MIT License) by Zubair Hussain. It is a tool. **You are responsible for how you use it.**

## Use Flux only for videos you may save

Download a video only when at least one of these is true:

- You created it or own the rights to it.
- The creator or rights holder gave you permission.
- Its license allows downloading, for example public-domain or suitable Creative Commons works.
- The law where you live allows it, for example a narrow personal-use or fair-use exception.

A video being public does **not** give you the right to download, re-upload or monetize it. Many platforms' terms of service restrict downloading even where the law might allow it. Read and follow the terms of each platform you use.

## What Flux deliberately does not do

- It does not bypass DRM, encryption, paywalls, sign-in requirements, or other technical protection measures.
- It does not import browser cookies or ask for platform accounts.
- It does not download live streams, playlists, age-restricted content, or content whose metadata indicates sexual material.
- It does not host, cache, or redistribute anyone's videos. The web app and the `flux` CLI save files only to the user's own device.
- It does not upscale video or claim a higher quality than the source provides.

These safeguards are part of the code (`src/lib/policy.ts` and `src/lib/ytdlp.ts`). Anyone who removes them in a fork is responsible for the result.

## Private, third-party and adult content

- **Private content.** Flux cannot reach videos that need a sign-in, are private, or are limited to followers or friends, and it does not accept passwords, cookies or tokens, so it cannot be used to take private material. It only works on links anyone on the internet can open.
- **Other people's public content.** A video being public does not make it free to reuse. Flux saves files only on the user's own device, does not host or republish anything, and reminds the user to have permission before every CLI download. What the user does next is their responsibility, and republishing someone else's work without permission can infringe copyright.
- **Adult content and misuse.** Flux refuses links and metadata that look sexual or age-restricted and refuses age-restricted sources. This filter reads titles, descriptions, tags and platform flags. It **cannot see the pictures**, so it reduces misuse but cannot guarantee it. Flux does not download images, only video, and does not offer any way to publish or share what was saved.
- **Reporting.** If you see Flux used to harm someone, or find content on the Flux website that infringes your rights, email hello@zubairhussain.xyz. Reports about a specific video should also go to the platform that hosts it, because only the platform can remove it.

## Trademarks

YouTube, TikTok, Instagram, Facebook, X, Twitter, LinkedIn, Twitch, Reddit, Vimeo, Dailymotion and other names are trademarks of their respective owners. Flux is **not affiliated with, endorsed by, or sponsored by** any of them. Names are used only to describe compatibility.

## Third-party software

Flux uses [yt-dlp](https://github.com/yt-dlp/yt-dlp) (Unlicense) and [FFmpeg](https://ffmpeg.org/legal.html) (LGPL/GPL) as separately installed programs. They are not bundled, and their own licenses apply.

## Copyright concerns

If you believe content published on the Flux website or repository infringes your rights, email **hello@zubairhussain.xyz** with the subject "Copyright". Include the URL, the work concerned, and your contact details. Flux holds no copy of videos that users save, so for those, contact the platform where the video is hosted.

## No warranty

Flux is provided "as is", without warranty of any kind (see [LICENSE](LICENSE)). Platform support can change or break at any time. This notice is general information, not legal advice.
