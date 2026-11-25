import { afterEach, beforeEach, expect, it, vi } from "vitest";
import {
  bloggerArticle,
  clearBloggerArticles,
  cleanHtml,
  postSlug,
} from "../src/lib/blogger-article";

beforeEach(() => clearBloggerArticles());
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

it("turns a Blogger address into a short slug", () => {
  expect(
    postSlug("https://x.blogspot.com/2026/11/Why-4K-isnt-always-4k.html"),
  ).toBe("why-4k-isnt-always-4k");
  expect(postSlug("not a url")).toBe("");
});

it("removes scripts, frames, event handlers and javascript links", () => {
  const dirty =
    '<p onclick="x()">Hi</p><script>alert(1)</script><iframe src="https://e.test"></iframe>' +
    '<a href="javascript:alert(1)">bad</a><img src=x onerror=alert(1)>' +
    '<svg role="img"><title>ok</title></svg><h2 style="color:red">Keep</h2>';
  const clean = cleanHtml(dirty);
  expect(clean).not.toMatch(/script|iframe|onclick|onerror|javascript:/i);
  expect(clean).toContain("<svg");
  expect(clean).toContain('<h2 style="color:red">Keep</h2>');
});

it("reads one article with its text summary and cover image", async () => {
  vi.stubEnv("BLOGGER_BLOG_ID", "123");
  vi.stubEnv("BLOGGER_API_KEY", "key");
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        items: [
          {
            title: "Why 4K",
            url: "https://z.blogspot.com/2026/11/why-4k.html",
            content: "<p>Hello <b>world</b></p><script>x</script>",
            published: "2026-11-22T09:30:00.000+05:00",
            labels: ["video quality"],
            images: [{ url: "https://img.test/a.png" }],
          },
        ],
      }),
    }),
  );
  const post = await bloggerArticle("why-4k");
  expect(post).toMatchObject({
    slug: "why-4k",
    title: "Why 4K",
    description: "Hello world",
    labels: ["video quality"],
    image: "https://img.test/a.png",
  });
  expect(post?.html).not.toContain("script");
  expect(await bloggerArticle("missing")).toBeNull();
});
