// Full blog articles read from Blogger, so each post is shown on this website
// (at /blog/<slug>) instead of sending visitors away. Like the post list, the
// articles are kept in memory for five minutes.
export type BloggerArticle = {
  slug: string;
  title: string;
  html: string;
  description: string;
  published?: string;
  updated?: string;
  labels: string[];
  image?: string;
};

const keepFor = 300_000;
const state = globalThis as typeof globalThis & {
  fluxBloggerArticles?: { id: string; at: number; items: BloggerArticle[] };
};

export function clearBloggerArticles() {
  state.fluxBloggerArticles = undefined;
}

/** "https://x.blogspot.com/2026/11/my-post.html" becomes "my-post". */
export function postSlug(url: string) {
  try {
    const last = new URL(url).pathname.split("/").filter(Boolean).pop() || "";
    return last.replace(/\.html?$/i, "").toLowerCase();
  } catch {
    return "";
  }
}

/**
 * The article body comes from our own Blogger account, but it is still cleaned
 * before being shown: scripts, frames, embedded objects, inline event handlers
 * and javascript: links are removed. Inline SVG, images and styling stay.
 */
export function cleanHtml(html: string) {
  return html
    .replace(
      /<(script|iframe|object|embed|style|link|meta|base|form)\b[\s\S]*?(<\/\1\s*>|$)/gi,
      "",
    )
    .replace(/<(script|iframe|object|embed|link|meta|base)\b[^>]*>/gi, "")
    .replace(/\son[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    .replace(
      /\s(href|src|xlink:href|action|formaction)\s*=\s*("\s*(?:javascript|data):[^"]*"|'\s*(?:javascript|data):[^']*')/gi,
      "",
    );
}

const plain = (html: string) =>
  html
    .replace(/<svg[\s\S]*?<\/svg>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();

function summarise(html: string) {
  const text = plain(html);
  if (text.length <= 155) return text;
  return text.slice(0, 152).replace(/\s+\S*$/, "") + "...";
}

const date = (value: unknown) =>
  typeof value === "string" && !Number.isNaN(Date.parse(value))
    ? value
    : undefined;

export async function bloggerArticles(): Promise<BloggerArticle[]> {
  const id = process.env.BLOGGER_BLOG_ID;
  const key = process.env.BLOGGER_API_KEY;
  if (!id || !key || !/^\d+$/.test(id)) return [];
  const cached = state.fluxBloggerArticles;
  if (cached?.id === id && Date.now() - cached.at < keepFor)
    return cached.items;
  try {
    const url = new URL(
      `https://www.googleapis.com/blogger/v3/blogs/${id}/posts`,
    );
    url.searchParams.set("key", key);
    url.searchParams.set("fetchBodies", "true");
    url.searchParams.set("fetchImages", "true");
    url.searchParams.set("maxResults", "20");
    url.searchParams.set("status", "live");
    const response = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!response.ok) return cached?.id === id ? cached.items : [];
    const data = await response.json();
    const items = (Array.isArray(data.items) ? data.items : []).flatMap(
      (post: {
        title?: unknown;
        url?: unknown;
        content?: unknown;
        published?: unknown;
        updated?: unknown;
        labels?: unknown;
        images?: { url?: unknown }[];
      }): BloggerArticle[] => {
        if (
          typeof post.title !== "string" ||
          typeof post.url !== "string" ||
          typeof post.content !== "string"
        )
          return [];
        const slug = postSlug(post.url);
        if (!/^[a-z0-9][a-z0-9-]*$/.test(slug)) return [];
        const html = cleanHtml(post.content);
        const first = post.images?.find(
          (image) =>
            typeof image.url === "string" && image.url.startsWith("https://"),
        )?.url;
        const published = date(post.published);
        const updated = date(post.updated);
        return [
          {
            slug,
            title: post.title,
            html,
            description: summarise(html),
            ...(published ? { published } : {}),
            ...(updated ? { updated } : {}),
            labels: Array.isArray(post.labels)
              ? post.labels.filter((l): l is string => typeof l === "string")
              : [],
            ...(typeof first === "string" ? { image: first } : {}),
          },
        ];
      },
    );
    state.fluxBloggerArticles = { id, at: Date.now(), items };
    return items;
  } catch {
    return cached?.id === id ? cached.items : [];
  }
}

export async function bloggerArticle(slug: string) {
  return (await bloggerArticles()).find((item) => item.slug === slug) ?? null;
}
