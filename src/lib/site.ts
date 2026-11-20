import type { Metadata } from "next";
export const siteUrl = process.env.SITE_URL || "http://localhost:3000";
export const publicReady =
  process.env.SEO_INDEXABLE === "true" &&
  siteUrl.startsWith("https://") &&
  !siteUrl.includes("example.");
export function pageMetadata(
  title: string,
  description: string,
  path: string,
): Metadata {
  const socialTitle = `${title} | Flux`;
  return {
    title: socialTitle,
    description,
    alternates: { canonical: path },
    robots: { index: publicReady, follow: publicReady },
    openGraph: {
      title: socialTitle,
      description,
      url: path,
      siteName: "Flux",
      type: "website",
      images: [
        {
          url: `/social/${path === "/" ? "home" : path.slice(1)}.png`,
          width: 1200,
          height: 630,
          alt: socialTitle,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: socialTitle,
      description,
      images: [`/social/${path === "/" ? "home" : path.slice(1)}.png`],
    },
  };
}
