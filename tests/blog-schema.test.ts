import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { clearBloggerCache } from "../src/lib/blogger";
import Blog from "../src/app/blog/page";

beforeEach(() => clearBloggerCache());
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

const schemas = async () => {
  const html = renderToStaticMarkup(await Blog());
  return [
    ...html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/g),
  ].map((m) => JSON.parse(m[1].replace(/\\u003c/g, "<")));
};

it("describes each article with its date and the author", async () => {
  vi.stubEnv("BLOGGER_BLOG_ID", "123");
  vi.stubEnv("BLOGGER_API_KEY", "key");
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        items: [
          {
            title: "Why 4K </script> isn't 4K",
            url: "https://x.blogspot.com/a",
            published: "2026-11-24T10:00:00+05:00",
          },
        ],
      }),
    }),
  );
  const blog = (await schemas()).find((s) => s["@type"] === "Blog");
  expect(blog.author.name).toBe("Zubair Hussain");
  expect(blog.blogPost).toEqual([
    {
      "@type": "BlogPosting",
      headline: "Why 4K </script> isn't 4K",
      url: "https://x.blogspot.com/a",
      datePublished: "2026-11-24T10:00:00+05:00",
      author: {
        "@type": "Person",
        name: "Zubair Hussain",
        url: "https://zubairhussain.xyz",
      },
    },
  ]);
});

it("lists no articles when Blogger is not connected, and keeps the breadcrumb", async () => {
  vi.stubEnv("BLOGGER_BLOG_ID", "");
  const found = await schemas();
  expect(found.find((s) => s["@type"] === "Blog").blogPost).toEqual([]);
  expect(found.some((s) => s["@type"] === "BreadcrumbList")).toBe(true);
});
