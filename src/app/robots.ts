import type { MetadataRoute } from "next";
import { publicReady, siteUrl } from "@/lib/site";

// AI crawlers and assistants. They are always allowed (even before the site is
// open to search engines) so Flux can be found and cited in AI answers.
const aiCrawlers = [
  "GPTBot",
  "OAI-SearchBot",
  "ChatGPT-User",
  "ClaudeBot",
  "Claude-User",
  "Claude-SearchBot",
  "anthropic-ai",
  "PerplexityBot",
  "Perplexity-User",
  "Google-Extended",
  "GoogleOther",
  "Applebot-Extended",
  "Bingbot",
  "Amazonbot",
  "meta-externalagent",
  "Bytespider",
  "CCBot",
  "cohere-ai",
  "DuckAssistBot",
  "MistralAI-User",
  "YouBot",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: aiCrawlers, allow: "/", disallow: ["/api/"] },
      publicReady
        ? { userAgent: "*", allow: "/", disallow: ["/api/"] }
        : { userAgent: "*", disallow: "/" },
    ],
    ...(publicReady ? { sitemap: new URL("/sitemap.xml", siteUrl).href } : {}),
  };
}
