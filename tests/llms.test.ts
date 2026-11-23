import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { bloggerPosts, clearBloggerCache } from "../src/lib/blogger";
import { buildLlmsFull, buildLlmsTxt } from "../src/lib/llms";
import { GET as llms } from "../src/app/llms.txt/route";
import { GET as llmsFull } from "../src/app/llms-full.txt/route";
import { creator, pageMetadata } from "../src/lib/site";

const base = "https://flux.example.org";
const posts = [
  {
    title: "How to pick [a] quality\nfor video",
    url: "https://zubair.blogspot.com/2026/11/quality.html",
    published: "2026-11-22T09:30:00.000+05:00",
  },
  { title: "Older guide", url: "https://zubair.blogspot.com/2026/10/old.html" },
];
const blogger = (items: unknown[]) =>
  vi.fn().mockResolvedValue({ ok: true, json: async () => ({ items }) });
beforeEach(() => clearBloggerCache());
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

it("says who made the site, in the guide and in every page's metadata", () => {
  const guide = buildLlmsTxt([], base);
  expect(guide).toContain("zubairhussain.xyz");
  expect(guide).toContain("This website was made by zubairhussain.xyz");
  expect(guide.startsWith("# Flux\n")).toBe(true);
  const meta = pageMetadata("About Flux", "Description", "/about");
  expect(meta.authors).toEqual([creator]);
  expect(meta.creator).toBe("Zubair Hussain");
  expect(meta.publisher).toBe("Zubair Hussain");
});

it("lists blog articles with safe link text and the publish day", () => {
  const guide = buildLlmsTxt(posts, base);
  expect(guide).toContain(
    "- [How to pick a quality for video](https://zubair.blogspot.com/2026/11/quality.html): published 2026-11-22",
  );
  expect(guide).toContain(
    "- [Older guide](https://zubair.blogspot.com/2026/10/old.html)\n",
  );
  expect(guide).toContain(`[Blog](${base}/blog)`);
  expect(guide).toContain(`${base}/llms-full.txt`);
});

it("says so plainly when there are no articles yet", () => {
  expect(buildLlmsTxt([], base)).toContain(
    "- No articles have been published yet.",
  );
});

it("includes the full page text, platforms and the creator in the long version", () => {
  const full = buildLlmsFull(posts, base);
  expect(full).toContain("## Made by");
  expect(full).toContain("YouTube");
  expect(full).toContain(`Address: ${base}/privacy`);
  expect(full).toContain("### What Flux does");
  expect(full).toContain("Older guide");
});

it("serves plain text with a five minute cache", async () => {
  vi.stubEnv("BLOGGER_BLOG_ID", "");
  for (const route of [llms, llmsFull]) {
    const response = await route();
    expect(response.headers.get("content-type")).toBe(
      "text/plain; charset=utf-8",
    );
    expect(response.headers.get("cache-control")).toContain("max-age=300");
    expect(await response.text()).toContain("zubairhussain.xyz");
  }
});

it("shows a newly published article on the next read after the cache expires", async () => {
  vi.stubEnv("BLOGGER_BLOG_ID", "123");
  vi.stubEnv("BLOGGER_API_KEY", "key");
  vi.useFakeTimers();
  const first = blogger([{ title: "First", url: "https://x.blogspot.com/a" }]);
  vi.stubGlobal("fetch", first);
  expect(await (await llms()).text()).toContain("[First]");
  // inside five minutes: no second request to Blogger
  await llms();
  expect(first).toHaveBeenCalledTimes(1);
  // a new post is published and five minutes pass
  const second = blogger([
    { title: "Second", url: "https://x.blogspot.com/b" },
    { title: "First", url: "https://x.blogspot.com/a" },
  ]);
  vi.stubGlobal("fetch", second);
  vi.advanceTimersByTime(301_000);
  const text = await (await llms()).text();
  vi.useRealTimers();
  expect(text).toContain("[Second]");
  expect(second).toHaveBeenCalledTimes(1);
});

it("keeps the last good list when Blogger is briefly unavailable", async () => {
  vi.stubEnv("BLOGGER_BLOG_ID", "123");
  vi.stubEnv("BLOGGER_API_KEY", "key");
  vi.useFakeTimers();
  vi.stubGlobal(
    "fetch",
    blogger([{ title: "Kept", url: "https://x.blogspot.com/k" }]),
  );
  expect((await bloggerPosts()).map((p) => p.title)).toEqual(["Kept"]);
  vi.advanceTimersByTime(301_000);
  vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("down")));
  const after = await bloggerPosts();
  vi.useRealTimers();
  expect(after.map((p) => p.title)).toEqual(["Kept"]);
});

it("ignores a malformed publish date", async () => {
  vi.stubEnv("BLOGGER_BLOG_ID", "123");
  vi.stubEnv("BLOGGER_API_KEY", "key");
  vi.stubGlobal(
    "fetch",
    blogger([
      { title: "A", url: "https://x.blogspot.com/a", published: "not a date" },
    ]),
  );
  expect(await bloggerPosts()).toEqual([
    { title: "A", url: "https://x.blogspot.com/a" },
  ]);
});
