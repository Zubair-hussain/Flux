import type { MetadataRoute } from "next";
import { publicReady, siteUrl } from "@/lib/site";
export default function robots(): MetadataRoute.Robots {
  return {
    rules: publicReady
      ? { userAgent: "*", allow: "/", disallow: ["/api/"] }
      : { userAgent: "*", disallow: "/" },
    ...(publicReady ? { sitemap: new URL("/sitemap.xml", siteUrl).href } : {}),
  };
}
