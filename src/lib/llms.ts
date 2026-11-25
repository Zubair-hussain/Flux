// Builds /llms.txt and /llms-full.txt, the plain-text guides that AI assistants
// and search tools read to understand this site. They are generated on request
// from the same page copy and Blogger posts the website shows, so they stay
// current without anyone editing a file.
import type { BloggerPost } from "./blogger";
import { postSlug } from "./blogger-article";
import { pages } from "./editorial";
import { platforms } from "./platforms";
import { creator, repositoryUrl, siteUrl } from "./site";

const summary = `Flux is a free, open-source video downloader that saves public videos in their original quality, from 720p up to 8K, from ${platforms.map((p) => p.name).join(", ")}. It is made by ${creator.name} (${creator.url}).`;

/** Link text and descriptions must not break out of markdown or span lines. */
const text = (value: string) =>
  value
    .replace(/[\r\n]+/g, " ")
    .replace(/[[\]]/g, "")
    .trim();
const day = (iso?: string) => (iso ? iso.slice(0, 10) : "");
const absolute = (path: string, base: string) => new URL(path, base).href;

function postLines(posts: BloggerPost[], base: string) {
  return posts.length
    ? posts.map(
        (post) =>
          `- [${text(post.title)}](${absolute(`/blog/${postSlug(post.url)}`, base)})${post.published ? `: published ${day(post.published)}` : ""}`,
      )
    : ["- No articles have been published yet."];
}

export function buildLlmsTxt(posts: BloggerPost[], base = siteUrl) {
  return [
    "# Flux",
    "",
    `> ${summary}`,
    "",
    "Flux uses Next.js, TypeScript, yt-dlp, and FFmpeg. It inspects supported public video links and offers the real source resolutions. Portrait video is classified by its shorter side. It does not upscale video and does not bypass DRM, sign-in, or paywalls. Only download videos you own or have permission to save.",
    "",
    "## Creator",
    "",
    `- [${creator.name}](${creator.url}): Creator, developer, and operator of Flux. This website was made by zubairhussain.xyz.`,
    `- [Source code](${repositoryUrl}): MIT-licensed repository with the web app, command-line tool, Chrome extension, and MCP server.`,
    "",
    "## Website",
    "",
    `- [Home](${absolute("/", base)}): Paste a public video link and download it, or copy the command-line version.`,
    `- [About](${absolute("/about", base)}): What Flux does and its limits.`,
    `- [Blog](${absolute("/blog", base)}): Guides and updates.`,
    `- [Content policy](${absolute("/content-policy", base)}): Restrictions and editorial standards.`,
    "",
    "## Latest blog articles",
    "",
    ...postLines(posts, base),
    "",
    "## Policies",
    "",
    `- [Privacy](${absolute("/privacy", base)}): Data processing and retention.`,
    `- [Cookies](${absolute("/cookies", base)}): Browser storage and advertising disclosures.`,
    `- [Terms](${absolute("/terms", base)}): Permitted use and limitations.`,
    `- [Copyright](${absolute("/copyright", base)}): Creator rights and how to report a concern.`,
    "",
    "## Optional",
    "",
    `- [Full text of this site](${absolute("/llms-full.txt", base)}): Every page and article title in one file.`,
    "",
    "This file is an informational index, not a crawler permission file or a replacement for robots.txt.",
    "",
  ].join("\n");
}

export function buildLlmsFull(posts: BloggerPost[], base = siteUrl) {
  const sections = Object.entries(pages).flatMap(([slug, page]) => [
    `## ${page.title}`,
    "",
    `Address: ${absolute(`/${slug}`, base)}`,
    "",
    page.description,
    "",
    ...page.sections.flatMap(([heading, body]) => [
      `### ${heading}`,
      "",
      body,
      "",
    ]),
  ]);
  return [
    "# Flux: full site text",
    "",
    `> ${summary}`,
    "",
    "## Made by",
    "",
    `This website and the Flux software were made by ${creator.name} (zubairhussain.xyz, ${creator.url}). Source code: ${repositoryUrl}.`,
    "",
    "## Supported platforms",
    "",
    ...platforms.map((p) => `- ${p.name}`),
    "",
    "## Latest blog articles",
    "",
    ...postLines(posts, base),
    "",
    ...sections,
  ].join("\n");
}
