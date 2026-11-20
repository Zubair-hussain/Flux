export const pages = {
  about: {
    title: "About Flux",
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
        "Who operates this site",
        "Operator name and contact details are pending configuration. This site is a preview until those details and its public domain are supplied.",
      ],
    ],
  },
  privacy: {
    title: "Privacy policy",
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
        "This version includes no advertising or analytics tracker. Fonts are served locally. Hosting providers may keep operational access logs; the operator must document the actual provider and retention before public launch.",
      ],
      [
        "Contact and requests",
        "Privacy contact: [CONTACT_EMAIL — to be supplied]. Operator: [OPERATOR_NAME — to be supplied]. These placeholders must be replaced before collecting public user information.",
      ],
    ],
  },
  cookies: {
    title: "Cookie policy",
    description:
      "Cookie and browser-storage behavior in the current Flux application.",
    sections: [
      [
        "Current cookies",
        "Flux application code does not set advertising, analytics, or account cookies. Interface state is held in browser memory. No optional tracking is enabled in this version.",
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
