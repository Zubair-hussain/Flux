import Link from "next/link";
import { platforms } from "@/lib/platforms";

export const homeFaq: [string, string][] = [
  [
    "Which video sites does Flux support?",
    `Flux recognises links from ${platforms.map((p) => p.name).join(", ")}. It uses the open-source yt-dlp engine, so access depends on each platform: some videos need a sign-in or are region-locked, and Flux never asks for your account.`,
  ],
  [
    "Can Flux download 4K or 8K video?",
    "Yes, when the source actually offers it. Flux lists only the resolutions the original upload provides, from 720p to 8K, and never upscales. Portrait clips count by their short edge, so a 1080×1920 TikTok is 1080p.",
  ],
  [
    "Is Flux free, and do I need an account?",
    "Flux is free and needs no account. It runs on your own computer, and finished files stay in your local downloads folder until you delete them.",
  ],
  [
    "Is it legal to download videos with Flux?",
    "Only download videos you own or have permission to save, and follow each platform’s terms. A video being public does not give you the right to reuse it. Flux blocks age-restricted and sexual content based on source metadata.",
  ],
  [
    "Why does a link say it cannot be accessed?",
    "The platform may require a login, restrict downloads, limit the video to some regions, or have changed its site. Try again later or use a different public link. Updating yt-dlp often fixes platform changes.",
  ],
];

const steps: [string, string][] = [
  [
    "Copy the video link",
    "Open the video on YouTube, TikTok, Instagram, X or another supported site and copy its address from the share menu or address bar.",
  ],
  [
    "Paste it into Flux",
    "Press Paste or drop the link into the box above, then choose Find video. Flux reads the source details without downloading anything yet.",
  ],
  [
    "Pick the real source quality",
    "Choose from the resolutions the original upload offers, such as 1080p, 1440p or 4K. Video and audio are merged with FFmpeg.",
  ],
  [
    "Save the file",
    "Open My downloads when the job finishes and choose Save file. The video stays on your device, not on someone else’s server.",
  ],
];

const publicSteps: [string, string][] = [
  steps[0],
  [
    "Paste it into Flux",
    "Drop the link into the box above and choose Get download command. Flux checks that the platform is supported.",
  ],
  [
    "Run the command",
    "Download flux.mjs using the link beside your generated command. Open PowerShell on Windows or Terminal on macOS/Linux in the download folder, then run the node ./flux.mjs command. Node.js 22+, yt-dlp and FFmpeg are required. Pick a source quality or keep best available.",
  ],
  [
    "Find the file",
    "The video is saved straight to the folder you ran the command in. It never passes through this website.",
  ],
];

export function HomeGuide({ publicSite = false }: { publicSite?: boolean }) {
  const list = publicSite ? publicSteps : steps;
  return (
    <section className="home-guide" aria-labelledby="how-it-works">
      <div className="guide-block">
        <h2 id="how-it-works">How to download a video in four steps</h2>
        <ol className="guide-steps">
          {list.map(([title, text], i) => (
            <li key={title}>
              <span className="step-number">{i + 1}</span>
              <div>
                <h3>{title}</h3>
                <p>{text}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
      <div className="guide-block">
        <h2 id="faq">Frequently asked questions</h2>
        <div className="faq-list">
          {homeFaq.map(([q, a]) => (
            <details key={q}>
              <summary>{q}</summary>
              <p>{a}</p>
            </details>
          ))}
        </div>
        <p className="guide-more">
          Read the <Link href="/blog">Flux blog</Link> for guides, or the{" "}
          <Link href="/content-policy">content policy</Link> for what Flux
          blocks.
        </p>
      </div>
    </section>
  );
}
