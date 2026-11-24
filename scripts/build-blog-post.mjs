// Builds the first Blogger article in Flux's style (all styles inline, because
// Blogger themes override page styles). The figures are inline SVG code.
//   node scripts/build-blog-post.mjs --schedule https://your-booking-link
//        [--site https://...] [--canonical https://post-address] [--date 2026-11-24]
// Output:
//   docs/blog/first-post.html       paste into Blogger's HTML view
//   docs/blog/first-post-full.html  complete page with Open Graph, Twitter and article data
import { writeFile } from "node:fs/promises";
import path from "node:path";
import { chartSvg, heroSvg, verticalSvg } from "./blog/svg-figures.mjs";

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
const canonical = option("canonical", "");
const date = option("date", new Date().toISOString().slice(0, 10));
for (const [name, value] of [
  ["--schedule", schedule === "SCHEDULE_LINK_HERE" ? "" : schedule],
  ["--canonical", canonical],
])
  if (value && !/^https:\/\/[^\s"<>]+$/.test(value))
    throw new Error(`${name} must be a full https:// link`);
if (!/^\d{4}-\d{2}-\d{2}$/.test(date))
  throw new Error("--date must look like 2026-11-24");

const c = {
  bg: "#101116",
  panel: "#191a22",
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
const strong = (t) => `<strong style="color:${c.white};">${t}</strong>`;
const figure = (svg, caption) => `
<figure style="margin:26px 0;">
  ${svg}
  <figcaption style="font-size:14px;color:#9899ad;margin-top:8px;text-align:center;">${caption}</figcaption>
</figure>`;
const callout = (title, body) => `
<div style="background:${c.panel};border:1px solid #3a3247;border-radius:14px;padding:20px 22px;margin:24px 0;">
  <div style="font-weight:800;color:${c.white};font-size:18px;margin-bottom:8px;">${title}</div>
  ${body}
</div>`;
const button = (href, label) =>
  `<a href="${href}" target="_blank" rel="noopener" style="display:inline-block;background:linear-gradient(135deg,#c7b3ff,#9873ff);color:#17102b;font-weight:800;font-size:17px;text-decoration:none;padding:14px 26px;border-radius:12px;">${label}</a>`;

const title = "Why 4K Isn't Always 4K";
const description =
  "Your 4K video may not be real 4K. See how Flux finds the true quality, with numbers from real tests.";
const labels = "video quality, 4K vs 1080p, video downloader, Flux";
const ogImage = `${site}/blog/why-4k-is-not-always-4k-hero.png`;
const ogAlt =
  "Flux banner reading: Why 4K isn't always 4K. Your 4K video may not be real 4K, with quality chips for 720p, 1080p, 4K and 8K";

const content = `
${p(`When you save a video, the quality menu looks simple: 720p, 1080p, 4K. In practice the numbers can mislead. This guide explains how ${a(site + "/", "Flux")} decides what to offer, using results from our own tests in November 2026.`)}

${figure(heroSvg(), "How Flux finds the real quality of a video.")}

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
${p(`Phone videos are tall, not wide. A TikTok clip we tested measured 720&times;1280. The shorter side is 720, so Flux calls it a ${strong("720p")} source. Judging by the long side would label it &ldquo;1280p&rdquo;, which exists on no quality menu and would promise detail the video does not have.`)}

${figure(verticalSvg(), "A 720&times;1280 clip is a 720p source.")}

${h2("What different platforms offered in our tests")}
${ul([
  `${strong("Dailymotion")} sample: versions up to 4K.`,
  `${strong("Pinterest")} sample: up to 1080p.`,
  `${strong("TikTok")} sample: 720p and 1080p.`,
  `${strong("Instagram, Streamable and Loom")} samples: 720p only.`,
])}
${p("These are single samples, not guarantees. Each uploader chooses how much quality to publish, and platforms change often.")}

${h2("Why 4K files are so much bigger")}
${p("In the same Dailymotion test, the 1080p version was about 61 MB and the 4K version about 216 MB, roughly 3.5 times larger. On a phone or a laptop screen the difference is hard to see, so 1080p is usually the better choice. Pick 4K when you will watch on a large screen or edit and crop the footage.")}

${figure(chartSvg(), "File size grows quickly with resolution. Sizes are estimates listed by the platform.")}

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

<p style="font-size:15px;color:#9899ad;margin:0;"><em>Flux is made by ${a("https://zubairhussain.xyz", "Zubair Hussain (zubairhussain.xyz)")}.</em></p>`;

const card = (inner) =>
  `<div style="font-family:${font};background:${c.bg};color:${c.text};border-radius:20px;padding:30px 28px;max-width:760px;margin:0 auto;">${inner}\n</div>`;

// --- Blogger paste version ----------------------------------------------------
const bloggerHeader = `<!--
  FIRST BLOG POST for Blogger (generated by scripts/build-blog-post.mjs).
  1. Blogger, New post. Click the pen icon and choose "HTML view".
  2. Paste everything below the "PASTE FROM HERE" line.
  3. Title:               ${title}
  4. Labels:              ${labels}
  5. Post settings, Search description (${description.length} characters):
     ${description}
  6. Permalink (custom):  why-4k-isnt-always-4k
  7. Publish. It appears on the website's Blog page and in /llms.txt within about 5 minutes.
  The figures are inline SVG code, so no image files are needed.
  Social preview: Blogger takes og:image from the first <img> in a post, and inline SVG is not one.
  See first-post-full.html (and its og:image) and docs/BLOGGER.md for how to set the preview image.
-->
<!-- PASTE FROM HERE -->`;

// --- Complete page with Open Graph data ----------------------------------------
const json = (value) => JSON.stringify(value).replace(/</g, "\\u003c");
const attr = (value) => value.replace(/&/g, "&amp;").replace(/"/g, "&quot;");
const author = {
  "@type": "Person",
  name: "Zubair Hussain",
  url: "https://zubairhussain.xyz",
};
const schema = {
  "@context": "https://schema.org",
  "@type": "BlogPosting",
  headline: title,
  description,
  image: [ogImage],
  datePublished: date,
  dateModified: date,
  inLanguage: "en",
  author,
  publisher: author,
  keywords: labels,
  ...(canonical ? { mainEntityOfPage: canonical } : {}),
};
const meta = [
  `<meta charset="utf-8">`,
  `<meta name="viewport" content="width=device-width, initial-scale=1">`,
  `<title>${attr(title)}</title>`,
  `<meta name="description" content="${attr(description)}">`,
  `<meta name="author" content="Zubair Hussain">`,
  ...(canonical ? [`<link rel="canonical" href="${canonical}">`] : []),
  `<meta name="robots" content="index, follow, max-image-preview:large">`,
  `<!-- Open Graph: Facebook, LinkedIn, WhatsApp, Discord, Slack -->`,
  `<meta property="og:type" content="article">`,
  `<meta property="og:site_name" content="Flux">`,
  `<meta property="og:title" content="${attr(title)}">`,
  `<meta property="og:description" content="${attr(description)}">`,
  ...(canonical ? [`<meta property="og:url" content="${canonical}">`] : []),
  `<meta property="og:image" content="${ogImage}">`,
  `<meta property="og:image:secure_url" content="${ogImage}">`,
  `<meta property="og:image:type" content="image/png">`,
  `<meta property="og:image:width" content="1200">`,
  `<meta property="og:image:height" content="630">`,
  `<meta property="og:image:alt" content="${attr(ogAlt)}">`,
  `<meta property="og:locale" content="en_US">`,
  `<meta property="article:published_time" content="${date}">`,
  `<meta property="article:author" content="https://zubairhussain.xyz">`,
  `<meta property="article:tag" content="video quality">`,
  `<meta property="article:tag" content="downloads">`,
  `<!-- Twitter / X -->`,
  `<meta name="twitter:card" content="summary_large_image">`,
  `<meta name="twitter:title" content="${attr(title)}">`,
  `<meta name="twitter:description" content="${attr(description)}">`,
  `<meta name="twitter:image" content="${ogImage}">`,
  `<meta name="twitter:image:alt" content="${attr(ogAlt)}">`,
  `<script type="application/ld+json">${json(schema)}</script>`,
].join("\n  ");

const full = `<!doctype html>
<html lang="en">
<head>
  ${meta}
</head>
<body style="margin:0;background:${c.bg};">
<article style="padding:24px 16px;">
${card(`\n<h1 style="font-size:40px;line-height:1.1;letter-spacing:-1.2px;color:${c.white};margin:0 0 22px;">${title}</h1>\n<p style="font-size:15px;color:#9899ad;margin:0 0 22px;">By ${a("https://zubairhussain.xyz", "Zubair Hussain")} · <time datetime="${date}">${date}</time></p>${content}`)}
</article>
</body>
</html>
`;

// Every inline figure must have a text alternative; the OG image must be absolute https.
for (const svg of full.match(/<svg\b[\s\S]*?<\/svg>/g) || []) {
  if (!/role="img"/.test(svg) || !/<title id="[^"]+">[^<]+<\/title>/.test(svg))
    throw new Error("An SVG figure is missing role=img or a title");
  if (!/<desc id="[^"]+">[^<]+<\/desc>/.test(svg))
    throw new Error("An SVG figure is missing a description");
}
if (!/^https:\/\//.test(ogImage)) throw new Error("og:image must be https");
if (description.length > 160)
  throw new Error("Search description is longer than 160 characters");

const here = (file) => path.resolve(import.meta.dirname, "../docs/blog", file);
await writeFile(
  here("first-post.html"),
  `${bloggerHeader}\n${card(content)}\n`,
);
await writeFile(here("first-post-full.html"), full);
console.log(
  `wrote docs/blog/first-post.html and first-post-full.html (schedule link: ${
    schedule === "SCHEDULE_LINK_HERE" ? "NOT SET YET" : schedule
  })`,
);
