import type { MetadataRoute } from "next";
import { bloggerPosts } from "@/lib/blogger";
import { postSlug } from "@/lib/blogger-article";
import { publicReady, siteUrl } from "@/lib/site";
import { pages } from "@/lib/editorial";
// Blog posts are read from Blogger, so the sitemap is built on request.
export const dynamic = "force-dynamic";
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  if (!publicReady) return [];
  const posts = await bloggerPosts();
  return [
    ...["/", "/blog", ...Object.keys(pages).map((slug) => `/${slug}`)].map(
      (path) => ({ url: new URL(path, siteUrl).href }),
    ),
    ...posts.flatMap((post) => {
      const slug = postSlug(post.url);
      return slug
        ? [
            {
              url: new URL(`/blog/${slug}`, siteUrl).href,
              ...(post.published ? { lastModified: post.published } : {}),
            },
          ]
        : [];
    }),
  ];
}
