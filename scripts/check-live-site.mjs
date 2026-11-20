import { readFile, mkdir, writeFile } from "node:fs/promises";
const base = process.argv[2] || "https://flux.detroonshah.workers.dev";
const results = [];
async function check(path, body) {
  const start = performance.now();
  try {
    const response = await fetch(new URL(path, base), {
      ...(body
        ? {
            method: "POST",
            headers: { "Content-Type": "application/json", Origin: base },
            body: JSON.stringify(body),
          }
        : {}),
      signal: AbortSignal.timeout(30000),
    });
    const text = await response.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {}
    const result = {
      path,
      ...(body ? { request: body } : {}),
      status: response.status,
      milliseconds: Math.round(performance.now() - start),
      contentType: response.headers.get("content-type"),
      cache: response.headers.get("x-opennext-cache"),
      ...(data
        ? { data }
        : {
            title: text.match(/<title>(.*?)<\/title>/s)?.[1],
            canonical: text.match(/rel="canonical" href="([^"]+)/)?.[1],
            robots: text.match(/name="robots" content="([^"]+)/)?.[1],
            excerpt: text.slice(
              0,
              path.endsWith(".txt") || path.endsWith(".xml") ? 1800 : 120,
            ),
          }),
    };
    results.push(result);
    console.log(JSON.stringify(result));
  } catch (error) {
    const result = { path, error: error.message };
    results.push(result);
    console.log(JSON.stringify(result));
  }
}
for (const path of [
  "/",
  "/blog",
  "/about",
  "/privacy",
  "/cookies",
  "/terms",
  "/copyright",
  "/content-policy",
  "/robots.txt",
  "/sitemap.xml",
  "/llms.txt",
  "/llm.txt",
  "/ads.txt",
  "/social/home.png",
  "/api/downloads",
])
  await check(path);
const samples = JSON.parse(
  await readFile(new URL("../docs/SAMPLE-URLS.json", import.meta.url), "utf8"),
);
for (let i = 0; i < samples.length; i += 3)
  await Promise.all(
    samples
      .slice(i, i + 3)
      .map((sample) => check("/api/inspect", { url: sample.url })),
  );
await check("/api/inspect", { url: "https://reddit.com/r/nsfw" });
await mkdir("reports/live", { recursive: true });
await writeFile(
  "reports/live/latest.json",
  JSON.stringify(
    {
      base,
      checkedAt: new Date().toISOString(),
      scope: "Public pages and metadata inspection only; no media downloaded",
      results,
    },
    null,
    2,
  ) + "\n",
);
