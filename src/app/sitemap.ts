import type { MetadataRoute } from "next";
import { publicReady, siteUrl } from "@/lib/site";
import { pages } from "@/lib/editorial";
export default function sitemap(): MetadataRoute.Sitemap {
  return publicReady
    ? ["/", "/blog", ...Object.keys(pages).map((slug) => `/${slug}`)].map(
        (path) => ({ url: new URL(path, siteUrl).href }),
      )
    : [];
}
