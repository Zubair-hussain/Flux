export async function bloggerPosts(): Promise<
  { title: string; url: string }[]
> {
  const id = process.env.BLOGGER_BLOG_ID;
  const key = process.env.BLOGGER_API_KEY;
  if (!id || !key || !/^\d+$/.test(id)) return [];
  try {
    const url = new URL(
      `https://www.googleapis.com/blogger/v3/blogs/${id}/posts`,
    );
    url.searchParams.set("key", key);
    url.searchParams.set("fetchBodies", "false");
    url.searchParams.set("maxResults", "20");
    url.searchParams.set("status", "live");
    const response = await fetch(url, {
      next: { revalidate: 300 },
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) return [];
    const data = await response.json();
    return (Array.isArray(data.items) ? data.items : []).flatMap(
      (post: { title?: unknown; url?: unknown }) => {
        if (typeof post.title !== "string" || typeof post.url !== "string")
          return [];
        try {
          const link = new URL(post.url);
          return link.protocol === "https:" && !link.username && !link.password
            ? [{ title: post.title, url: link.href }]
            : [];
        } catch {
          return [];
        }
      },
    );
  } catch {
    return [];
  }
}
