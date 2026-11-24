// Builds the first Blogger article as paste-ready HTML in Flux's style
// (all styles inline, because Blogger themes override page styles).
//   node scripts/build-blog-post.mjs --schedule https://your-booking-link
// Output: docs/blog/first-post.html
import { writeFile } from "node:fs/promises";
import path from "node:path";

const args = process.argv.slice(2);
const option = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
};
const site = option("site", "https://flux.detroonshah.workers.dev").replace(
  /\/$/,
  "",
);
const schedule = option("schedule", "SCHEDULE_LINK_HERE");
if (
  schedule !== "SCHEDULE_LINK_HERE" &&
  !/^https:\/\/[^\s"<>]+$/.test(schedule)
)
  throw new Error("--schedule must be a full https:// link");

const c = {
  bg: "#101116",
  panel: "#191a22",
  line: "#2a2b36",
  text: "#c9c5da",
  white: "#f3f2fa",
  violet: "#ad91ff",
  link: "#c6a8ff",
};
const font = `'DM Sans','Segoe UI',system-ui,-apple-system,Arial,sans-serif`;

const h2 = (t) =>
  `<h2 style="font-size:26px;line-height:1.25;margin:38px 0 14px;color:${c.white};padding-left:14px;border-left:4px solid ${c.violet};letter-spacing:-0.4px;">${t}</h2>`;
const p = (t) =>
  `<p style="font-size:17px;line-height:1.75;margin:0 0 16px;color:${c.text};">${t}</p>`;
const a = (href, t) =>
  `<a href="${href}" style="color:${c.link};text-decoration:underline;">${t}</a>`;
const li = (t) => `<li style="margin:0 0 8px;color:${c.text};">${t}</li>`;
const ul = (items) =>
  `<ul style="font-size:17px;line-height:1.7;margin:0 0 18px;padding-left:22px;">${items.map(li).join("")}</ul>`;
const figure = (file, alt, caption, width, height, first = false) => `
<figure style="margin:26px 0;">
  <img src="${site}/blog/${file}" alt="${alt}" width="${width}" height="${height}" ${
    first ? 'fetchpriority="high"' : 'loading="lazy"'
  } decoding="async" style="width:100%;height:auto;display:block;border-radius:14px;border:1px solid ${c.line};">
  <figcaption style="font-size:14px;color:#9899ad;margin-top:8px;text-align:center;">${caption}</figcaption>
</figure>`;
const callout = (title, body) => `
<div style="background:${c.panel};border:1px solid #3a3247;border-radius:14px;padding:20px 22px;margin:24px 0;">
  <div style="font-weight:800;color:${c.white};font-size:18px;margin-bottom:8px;">${title}</div>
  ${body}
</div>`;
const button = (href, label) =>
  `<a href="${href}" target="_blank" rel="noopener" style="display:inline-block;background:linear-gradient(135deg,#c7b3ff,#9873ff);color:#17102b;font-weight:800;font-size:17px;text-decoration:none;padding:14px 26px;border-radius:12px;">${label}</a>`;

const post = `
<div style="font-family:${font};background:${c.bg};color:${c.text};border-radius:20px;padding:30px 28px;max-width:760px;margin:0 auto;">

${p(`When you save a video, the quality menu looks simple: 720p, 1080p, 4K. In practice the numbers can mislead. This guide explains how ${a(site + "/", "Flux")} decides what to offer, using results from our own tests in November 2026.`)}

${figure(
  "why-4k-is-not-always-4k-hero.png",
  "Flux banner reading: Why a 4K video isn't always 4K, with quality chips for 720p, 1080p, 4K and 8K",
  "How Flux finds the real quality of a video.",
  1200,
  630,
  true,
)}

${callout(
  "The short version",
  ul([
    "Flux only offers qualities the video really has, and never stretches a small picture.",
    "Tall phone videos are counted by their short side: 720&times;1280 is a 720p source.",
    "4K files are far bigger than 1080p, and on most screens the difference is hard to see.",
  ]),
)}

${h2("Flux only offers what the source really has")}
${p("Flux reads the list of versions that a platform actually provides and shows only those, from 720p up to 8K. It never creates a higher resolution by stretching a smaller picture. A 720p upload stays a 720p download, because upscaling adds file size but no detail.")}

${h2("Vertical videos count by their short side")}
${p('Phone videos are tall, not wide. A TikTok clip we tested measured 720&times;1280. The shorter side is 720, so Flux calls it a <strong style="color:' + c.white + ';">720p</strong> source. Judging by the long side would label it &ldquo;1280p&rdquo;, which exists on no quality menu and would promise detail the video does not have.')}

${figure(
  "vertical-video-quality.png",
  "Diagram of a tall phone video measuring 720 pixels wide by 1280 pixels high, labelled as a 720p source because quality is counted by the short side",
  "A 720&times;1280 clip is a 720p source.",
  1200,
  675,
)}

${h2("What different platforms offered in our tests")}
${ul([
  '<strong style="color:' +
    c.white +
    ';">Dailymotion</strong> sample: versions up to 4K.',
  '<strong style="color:' +
    c.white +
    ';">Pinterest</strong> sample: up to 1080p.',
  '<strong style="color:' +
    c.white +
    ';">TikTok</strong> sample: 720p and 1080p.',
  '<strong style="color:' +
    c.white +
    ';">Instagram, Streamable and Loom</strong> samples: 720p only.',
])}
${p("These are single samples, not guarantees. Each uploader chooses how much quality to publish, and platforms change often.")}

${h2("Why 4K files are so much bigger")}
${p("In the same Dailymotion test, the 1080p version was about 61 MB and the 4K version about 216 MB, roughly 3.5 times larger. On a phone or a laptop screen the difference is hard to see, so 1080p is usually the better choice. Pick 4K when you will watch on a large screen or edit and crop the footage.")}

${figure(
  "quality-file-size-chart.png",
  "Bar chart of one Dailymotion video's file size by quality: about 28 MB at 720p, 61 MB at 1080p, 136 MB at 1440p and 216 MB at 4K",
  "File size grows quickly with resolution. Sizes are estimates listed by the platform.",
  1200,
  675,
)}

${h2("Why some files are MKV")}
${p("At higher quality, many platforms deliver the picture and the sound as separate files. Flux joins them with FFmpeg into one file. When the two parts use different codecs, MKV can hold them together without re-encoding, so nothing is lost. VLC, mpv and most modern players open MKV directly.")}

${h2("Download only what you may keep")}
${p(`A public video is not automatically free to reuse. Save videos you own, that you have permission to keep, or that are licensed for it, and follow each platform's terms. Flux does not bypass DRM, sign-in or paywalls, and it blocks live streams, playlists and age-restricted or sexual content. Read the ${a(site + "/content-policy", "content policy")} for details.`)}

${h2("Try it")}
${p(`Paste a public video link into ${a(site + "/", "Flux")}, check which qualities the source offers, and choose the one that fits. If a link cannot be fetched from our server, Flux shows a command you can run on your own computer instead. The source code is open on ${a("https://github.com/Zubair-hussain/Flux", "GitHub")}.`)}

<div style="background:linear-gradient(135deg,#2a1f4d,#191a22);border:1px solid #6d5aa8;border-radius:18px;padding:28px 26px;margin:34px 0 22px;text-align:center;">
  <div style="font-size:24px;font-weight:800;color:${c.white};letter-spacing:-0.4px;margin-bottom:8px;">Want something like this built?</div>
  <p style="font-size:17px;line-height:1.6;color:${c.text};margin:0 0 20px;">Flux started as one idea, a downloader that is honest about quality. If you have a tool, website or automation in mind, book a short call and tell me about it.</p>
  ${button(schedule, "Book a call with Zubair")}
  <div style="font-size:13px;color:#9899ad;margin-top:12px;">Free to book. No obligation.</div>
</div>

<p style="font-size:15px;color:#9899ad;margin:0;"><em>Flux is made by ${a("https://zubairhussain.xyz", "Zubair Hussain (zubairhussain.xyz)")}.</em></p>
</div>
`;

const labels = "video quality, downloads, guides";
const title = "Why a 4K video isn't always 4K: how Flux finds the real quality";
const description =
  "What video quality really means, why Flux never upscales, and why 4K files are so much bigger than 1080p, with numbers from real tests.";

const header = `<!--
  FIRST BLOG POST for Blogger (generated by scripts/build-blog-post.mjs).
  1. Blogger, New post. Click the pen icon and choose "HTML view".
  2. Paste everything below the "PASTE FROM HERE" line.
  3. Title:               ${title}
  4. Labels:              ${labels}
  5. Post settings, Search description (${description.length} characters):
     ${description}
  6. Publish. It appears on the website's Blog page and in /llms.txt within about 5 minutes.
  Images are served from ${site}/blog/ and need that website deployed.
-->
<!-- PASTE FROM HERE -->`;

// Every image needs alt text and dimensions; refuse to write a post without them.
for (const tag of post.match(/<img\b[^>]*>/g) || []) {
  for (const attribute of ["alt", "width", "height"])
    if (!new RegExp(`\\s${attribute}="[^"]+"`).test(tag))
      throw new Error(`Image is missing ${attribute}: ${tag.slice(0, 80)}`);
}
if (description.length > 160)
  throw new Error("Search description is longer than 160 characters");

const file = path.resolve(import.meta.dirname, "../docs/blog/first-post.html");
await writeFile(file, `${header}\n${post.trim()}\n`);
console.log(
  `wrote docs/blog/first-post.html (schedule link: ${
    schedule === "SCHEDULE_LINK_HERE" ? "NOT SET YET" : schedule
  })`,
);
