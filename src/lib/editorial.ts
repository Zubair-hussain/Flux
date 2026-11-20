export const pages = {
  about: {
    title: "About Flux",
    seoTitle: "About Flux, the local-first video downloader",
    description:
      "How Flux handles local video downloads, supported platforms, and source quality.",
    sections: [
      [
        "What Flux does",
        "Flux is a local video downloader built with Next.js, yt-dlp, and FFmpeg. It inspects a public video link and shows the resolutions reported by that source.",
      ],
      [
        "What quality means",
        "4K and 8K appear only when supported formats exist. Flux does not upscale video. Portrait videos are classified by their shorter dimension.",
      ],
      [
        "What we have tested",
        "Local verification covers URL validation, download jobs, portrait formats, and browser interactions. A Blender YouTube sample completed a download with audio. Results for other platforms vary with login requirements and extractor changes.",
      ],
      [
        "Supported platforms",
        "Flux recognises links from YouTube, TikTok, Instagram, Reddit, X, LinkedIn, Twitch, Vimeo, Facebook, and Dailymotion. Each platform decides what is reachable without an account, and the same platform can allow one video and block another. Some, such as Reddit and Vimeo, increasingly require sign-in, and Flux deliberately does not import login cookies. When a platform changes its site, updating yt-dlp usually restores support.",
      ],
      [
        "How a download works",
        "Flux first asks yt-dlp for the video’s metadata without downloading media. It checks the title, flags, and age rating against the content policy, then lists the real source resolutions. When you start a download, the best video and audio streams at that resolution are fetched and merged by FFmpeg into one file in your local downloads folder.",
      ],
      [
        "Tools for browsers and AI agents",
        "A Chrome extension sends the current tab to Flux without needing history or page access permissions. An MCP server lets assistants such as Claude inspect a link, start a download, and check its status through the same local API and safety rules as the website.",
      ],
      [
        "Who operates this site",
        "Operator name and contact details are pending configuration. This site is a preview until those details and its public domain are supplied.",
      ],
    ],
  },
  privacy: {
    title: "Privacy policy",
    seoTitle: "Privacy policy: how Flux handles your data",
    description:
      "What the Flux local downloader stores and how external video platforms receive requests.",
    sections: [
      [
        "Information processed",
        "The local app processes submitted video URLs, source metadata, downloaded files, and job status. Records and partial files remain in the downloads folder until the device operator removes them.",
      ],
      [
        "External services",
        "Inspecting or downloading a video sends requests to the source platform and its media servers. Those services can receive the server IP address and request information. Configured Blogger integration sends requests from this server to Google.",
      ],
      [
        "Tracking and retention",
        "Advertising is disabled by default. Deployments may enable Google AdSense after configuring consent management; Google can then receive device, network, cookie, and advertising information under its policies and the applicable consent choices. No analytics integration is included. Fonts are served locally. The operator must publish actual provider and retention details before public launch.",
      ],
      [
        "Contact and requests",
        "Privacy contact: [CONTACT_EMAIL — to be supplied]. Operator: [OPERATOR_NAME — to be supplied]. These placeholders must be replaced before collecting public user information.",
      ],
    ],
  },
  cookies: {
    title: "Cookie policy",
    seoTitle: "Cookie policy: browser storage and ads on Flux",
    description:
      "Which cookies and browser storage Flux uses, and how optional Google AdSense changes that.",
    sections: [
      [
        "Current cookies",
        "The default configuration does not load advertising or analytics scripts. Interface state is held in browser memory. If the operator enables Google AdSense, Google and its partners may use cookies or local storage for advertising, measurement, and fraud prevention subject to applicable consent requirements. The configured consent provider must offer the appropriate controls.",
      ],
      [
        "Third-party destinations",
        "Opening a source video or Blogger article takes you to another website, where its own cookie policy applies. Flux does not embed those sites in this version.",
      ],
      [
        "Hosting changes",
        "A future Cloudflare deployment may introduce security cookies depending on enabled features. The operator must inventory those features and update this page before deployment. Optional tracking must remain disabled until any required consent is obtained.",
      ],
      [
        "Your controls",
        "You can manage site cookies and storage in browser settings. Contact details are pending: [CONTACT_EMAIL].",
      ],
    ],
  },
  terms: {
    title: "Terms of use",
    seoTitle: "Terms of use for the Flux video downloader",
    description:
      "Permitted use, source restrictions, and limitations of the Flux downloader.",
    sections: [
      [
        "Permission to download",
        "Use Flux only for media you own or have permission to save. Respect applicable law and the source platform’s terms. A publicly visible video does not automatically grant reuse rights.",
      ],
      [
        "Prohibited use",
        "Do not use Flux for sexual content, unlawful material, bypassing DRM, circumventing access controls, or violating another person’s privacy or intellectual property rights.",
      ],
      [
        "Availability and quality",
        "Source availability, formats, speed, and platform compatibility can change. Flux cannot guarantee a download or a particular resolution. Keep independent copies of important files.",
      ],
      [
        "Operator and applicable terms",
        "Operator: [OPERATOR_NAME]. Contact: [CONTACT_EMAIL]. Jurisdiction and legally required consumer terms must be completed and reviewed for the intended market before public launch.",
      ],
    ],
  },
  copyright: {
    title: "Copyright and removal requests",
    seoTitle: "Copyright and removal requests | Flux",
    description:
      "How to raise a copyright concern about content published on the Flux website.",
    sections: [
      [
        "Creator rights",
        "Creators retain rights in their videos. Flux does not grant a license to third-party content. Its local downloader saves files on the operator’s device.",
      ],
      [
        "Report website content",
        "For content published on this website, provide the affected page URL, identification of your work, your contact details, and a clear description of the concern.",
      ],
      [
        "Contact pending",
        "Send reports to [COPYRIGHT_EMAIL — to be supplied]. This preview does not claim to have a registered DMCA agent or a statutory takedown process.",
      ],
      [
        "Review process",
        "The operator must establish a monitored reporting channel and an appropriate review process before public launch. Reports concerning source-platform content should also be directed to that platform.",
      ],
    ],
  },
  "content-policy": {
    title: "Content and editorial policy",
    seoTitle: "Content and editorial policy | Flux",
    description:
      "Flux content restrictions, metadata filtering limits, and editorial standards.",
    sections: [
      [
        "Restricted downloads",
        "Flux blocks sexual terms in URLs and source metadata, NSFW flags, and age-restricted sources. It does not provide a visual moderation guarantee. Misleading or missing metadata can evade this filter.",
      ],
      [
        "Useful publishing",
        "Blog posts should answer real questions with reproducible steps, original examples, and verifiable sources. We do not publish bulk keyword variants, fabricated reviews, or invented author credentials.",
      ],
      [
        "AI assistance and review",
        "AI-assisted drafts require human factual review before publication. This preview’s policy text is a starting point for operator review, not a representation of completed legal review.",
      ],
      [
        "Corrections",
        "Publish genuine author and review details, preserve original publication dates, and explain material corrections. Contact details are pending: [CONTACT_EMAIL].",
      ],
    ],
  },
} as const;
