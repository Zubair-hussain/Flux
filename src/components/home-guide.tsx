import Link from "next/link";
import { platforms } from "@/lib/platforms";
import type { AppMode } from "@/components/flux-app";

const names = platforms.map((p) => p.name).join(", ");

const faqBase: [string, string][] = [
  [
    "Which video sites does Flux support?",
    `Flux recognises links from ${names}. It uses the open-source yt-dlp engine, so access depends on each platform: some videos need a sign-in or are region-locked, and Flux never asks for your account.`,
  ],
  [
    "Can Flux download 4K or 8K video?",
    "Yes, when the source actually offers it. Flux lists only the resolutions the original upload provides, from 720p to 8K, and never upscales. Portrait clips count by their short edge, so a 1080×1920 TikTok is 1080p.",
  ],
];
const faqLegal: [string, string] = [
  "Is it legal to download videos with Flux?",
  "Only download videos you own or have permission to save, and follow each platform’s terms. A video being public does not give you the right to reuse it. Flux blocks age-restricted and sexual content based on source metadata.",
];
const faqBroken: [string, string] = [
  "Why does a link say it cannot be accessed?",
  "The platform may require a login, restrict downloads, limit the video to some regions, or have changed its site. Try again later or use a different public link. Updating yt-dlp often fixes platform changes.",
];

export function faqFor(mode: AppMode): [string, string][] {
  const free: [string, string] =
    mode === "remote"
      ? [
          "Is Flux free, and do I need an account?",
          "Flux is free and needs no account. Download on this website (the file is prepared on our server and deleted shortly after), or run the open-source flux command on your own computer so nothing passes through a server.",
        ]
      : [
          "Is Flux free, and do I need an account?",
          "Flux is free and needs no account. It runs on your own computer, and finished files stay in your local downloads folder until you delete them.",
        ];
  const extra: [string, string][] =
    mode === "remote"
      ? [
          [
            "Why is a download on the website limited?",
            "To keep the service fast for everyone, the website limits video length, file size, resolution and how many downloads one network can start per hour. The flux command on your own computer has no such limits and works from 720p up to 8K.",
          ],
        ]
      : [];
  return [...faqBase, free, faqLegal, faqBroken, ...extra];
}
export const homeFaq = faqFor("local");

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

const commandSteps: [string, string][] = [
  steps[0],
  [
    "Paste it into Flux",
    "Drop the link into the box above and choose Get download command. Flux checks that the platform is supported.",
  ],
  [
    "Run the command",
    "Download the small Flux CLI file shown in the box, then paste the command into a terminal on Windows, macOS or Linux. Pick a quality such as 1080p or 4K, or keep the best available.",
  ],
  [
    "Find the file",
    "The video is saved straight to the folder you ran the command in. It never passes through this website.",
  ],
];

const remoteSteps: [string, string][] = [
  steps[0],
  steps[1],
  steps[2],
  [
    "Save the file",
    "Open My downloads when it is ready and choose Save file. The file is prepared on our server and deleted shortly after. Prefer no server at all? Use the command-line option and the video downloads straight to your computer.",
  ],
];

export function HomeGuide({ mode = "local" }: { mode?: AppMode }) {
  const list =
    mode === "remote" ? remoteSteps : mode === "command" ? commandSteps : steps;
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
          {faqFor(mode).map(([q, a]) => (
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
