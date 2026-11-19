# Flux wireframes

## Desktop

```text
┌────────────────────┬──────────────────────────────────────────────────┐
│ ✦ flux.            │ Workspace / Video downloader      Local & private │
│                    ├──────────────────────────────────────────────────┤
│ YOUR WORKSPACE     │                 THE INTERNET MOVES               │
│ Video downloader   │                  Great videos.                   │
│ My downloads [n]   │                  Yours to keep.                  │
│ Platforms          │              Source-quality benefits             │
│                    │                                                  │
│ MAKE IT YOURS      │   ┌──────────────────────────────────────────┐   │
│ Chrome extension   │   │ Drop a link. Get the video.      Filter  │   │
│ For AI agents      │   │ [ Video URL                     ][Paste] │   │
│                    │   │ Creator rights              [Find video]│   │
│                    │   │ Result: title / source quality / download│   │
│                    │   └──────────────────────────────────────────┘   │
│                    │ All your platforms. One downloader.              │
│ Every pixel        │ [YT] [TT] [IG] [Reddit] [X] [in] [Twitch] [Vimeo] │
│ matters.           │                                                  │
│ UP TO 8K           │ [Source quality] [Content policy] [Extension]     │
│ Local workspace    │ Footer: creator rights / local-first              │
└────────────────────┴──────────────────────────────────────────────────┘
```

## Mobile (390px)

```text
┌──────────────────────────────┐
│ ✦       [Home][Jobs][Ext][AI] │
│ Workspace / Downloader       │
│       Great videos.          │
│       Yours to keep.         │
│       Benefits               │
│ ┌──────────────────────────┐ │
│ │ Drop a link              │ │
│ │ [URL             ][Paste]│ │
│ │ Creator rights [Find]    │ │
│ │ Result / quality / save  │ │
│ └──────────────────────────┘ │
│ [YT] [TT] [IG] [Reddit]      │
│ [X] [in] [Twitch] [Vimeo]    │
│ [Source quality            ] │
│ [Content filter            ] │
│ [Chrome extension          ] │
│ Footer                       │
└──────────────────────────────┘
```

## Interaction states

URL input → inspect (loading) → title + actual source qualities → download (loading) → jobs list (queued/downloading) → complete → Save file.

Blocked URL/metadata → inline error. Unavailable source → actionable error. Restart during a job → failed with retry guidance. Empty jobs → primary action back to downloader. Extension/agent/platform help → dismissible dialog.

Sidebar collapses to icons below 960px and a sticky navigation bar below 600px. Cards stack on mobile. Keyboard focus, labeled URL input, live status and error announcements, and reduced-motion preferences are supported.
