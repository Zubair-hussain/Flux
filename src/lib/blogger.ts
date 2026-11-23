export type BloggerPost = { title: string; url: string; published?: string };

// The website is served from Cloudflare's edge with no writable page cache, so
// posts are read from Blogger at request time and remembered here for five
// minutes. New posts therefore appear on the blog page and in llms.txt without a
// redeploy, and Blogger's request quota is not used up by visitors.
const keepFor = 300_000;
const state = globalThis as typeof globalThis & {
  fluxBloggerCache?: { id: string; at: number; posts: BloggerPost[] };
};

export function clearBloggerCache() {
  state.fluxBloggerCache = undefined;
}

export async function bloggerPosts(): Promise<BloggerPost[]> {
  const id = process.env.BLOGGER_BLOG_ID;
  const key = process.env.BLOGGER_API_KEY;
  if (!id || !key || !/^\d+$/.test(id)) return [];
  const cached = state.fluxBloggerCache;
  if (cached?.id === id && Date.now() - cached.at < keepFor)
    return cached.posts;
  try {
    const url = new URL(
      `https://www.googleapis.com/blogger/v3/blogs/${id}/posts`,
    );
    url.searchParams.set("key", key);
    url.searchParams.set("fetchBodies", "false");
    url.searchParams.set("maxResults", "20");
    url.searchParams.set("status", "live");
    const response = await fetch(url, {
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) return cached?.id === id ? cached.posts : [];
    const data = await response.json();
    const posts = (Array.isArray(data.items) ? data.items : []).flatMap(
      (post: { title?: unknown; url?: unknown; published?: unknown }) => {
        if (typeof post.title !== "string" || typeof post.url !== "string")
          return [];
        try {
          const link = new URL(post.url);
          if (link.protocol !== "https:" || link.username || link.password)
            return [];
          const published =
            typeof post.published === "string" &&
            !Number.isNaN(Date.parse(post.published))
              ? post.published
              : undefined;
          return [
            {
              title: post.title,
              url: link.href,
              ...(published ? { published } : {}),
            },
          ];
        } catch {
          return [];
        }
      },
    );
    state.fluxBloggerCache = { id, at: Date.now(), posts };
    return posts;
  } catch {
    // If Blogger is briefly unreachable, keep showing the last good list.
    return cached?.id === id ? cached.posts : [];
  }
}
