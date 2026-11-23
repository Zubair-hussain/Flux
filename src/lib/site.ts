import type { Metadata } from "next";
export const siteUrl = process.env.SITE_URL || "http://localhost:3000";
/** The person behind Flux; shown to search engines and AI assistants. */
export const creator = {
  name: "Zubair Hussain",
  url: "https://zubairhussain.xyz",
};
export const repositoryUrl = "https://github.com/Zubair-hussain/Flux";
export const publicReady =
  process.env.SEO_INDEXABLE === "true" &&
  siteUrl.startsWith("https://") &&
  !siteUrl.includes("example.");
export function pageMetadata(
  title: string,
  description: string,
  path: string,
): Metadata {
  const socialTitle = /\bFlux\b/.test(title) ? title : `${title} | Flux`;
  return {
    title: socialTitle,
    description,
    authors: [creator],
    creator: creator.name,
    publisher: creator.name,
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
