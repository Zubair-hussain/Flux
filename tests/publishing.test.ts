import { afterEach, expect, it, vi } from "vitest";
import { bloggerPosts } from "../src/lib/blogger";
import { pageMetadata, publicReady } from "../src/lib/site";
import { pages } from "../src/lib/editorial";
import robots from "../src/app/robots";
import sitemap from "../src/app/sitemap";
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});
it("keeps unconfigured previews out of search and gives each page metadata", () => {
  expect(publicReady).toBe(false);
  expect(sitemap()).toEqual([]);
  expect(robots().rules).toEqual({ userAgent: "*", disallow: "/" });
  for (const [slug, page] of Object.entries(pages)) {
    const meta = pageMetadata(page.title, page.description, `/${slug}`);
    expect(meta.title).toContain(page.title);
    expect(meta.alternates?.canonical).toBe(`/${slug}`);
    expect(meta.openGraph).toBeDefined();
    expect(meta.twitter).toBeDefined();
    expect(page.sections.length).toBeGreaterThanOrEqual(4);
  }
});
it("handles unconfigured Blogger without network access", async () => {
  vi.stubEnv("BLOGGER_BLOG_ID", "");
  expect(await bloggerPosts()).toEqual([]);
});
it("lists safe published links and excludes malformed sources", async () => {
  vi.stubEnv("BLOGGER_BLOG_ID", "123");
  vi.stubEnv("BLOGGER_API_KEY", "test");
  const fetcher = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({
      items: [
        { title: "Guide", url: "https://example.blogspot.com/guide" },
        { title: "Bad", url: "javascript:alert(1)" },
        { title: "Bad", url: "broken" },
        { title: 1 },
      ],
    }),
  });
  vi.stubGlobal("fetch", fetcher);
  expect(await bloggerPosts()).toEqual([
    { title: "Guide", url: "https://example.blogspot.com/guide" },
  ]);
  expect(String(fetcher.mock.calls[0][0])).toContain("status=live");
});
it("handles Blogger errors, malformed lists and timeouts", async () => {
  vi.stubEnv("BLOGGER_BLOG_ID", "123");
  vi.stubEnv("BLOGGER_API_KEY", "test");
  const fetcher = vi
    .fn()
    .mockResolvedValueOnce({ ok: false })
    .mockResolvedValueOnce({ ok: true, json: async () => ({}) })
    .mockRejectedValueOnce(new Error("timeout"));
  vi.stubGlobal("fetch", fetcher);
  expect(await bloggerPosts()).toEqual([]);
  expect(await bloggerPosts()).toEqual([]);
  expect(await bloggerPosts()).toEqual([]);
});
