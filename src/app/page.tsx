import { FluxApp } from "@/components/flux-app";
import { HomeGuide, homeFaq } from "@/components/home-guide";
import { AdSlot } from "@/components/adsense";
import { siteUrl } from "@/lib/site";
import { platforms } from "@/lib/platforms";

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": new URL("/#website", siteUrl).href,
      url: new URL("/", siteUrl).href,
      name: "Flux",
      description:
        "A local-first video downloader with source-quality selection up to 8K.",
      inLanguage: "en",
      creator: {
        "@type": "Person",
        name: "Zubair Hussain",
        url: "https://zubairhussain.xyz",
      },
    },
    {
      "@type": "WebApplication",
      "@id": new URL("/#app", siteUrl).href,
      name: "Flux video downloader",
      url: new URL("/", siteUrl).href,
      applicationCategory: "MultimediaApplication",
      operatingSystem: "Windows, macOS, Linux",
      browserRequirements: "Requires a modern browser",
      isAccessibleForFree: true,
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
      featureList: [
        "Source-quality downloads from 720p to 8K",
        "Portrait video support",
        `Links from ${platforms.map((p) => p.name).join(", ")}`,
        "Chrome extension",
        "MCP tools for AI agents",
      ],
    },
    {
      "@type": "FAQPage",
      mainEntity: homeFaq.map(([q, a]) => ({
        "@type": "Question",
        name: q,
        acceptedAnswer: { "@type": "Answer", text: a },
      })),
    },
  ],
};

export default function Home() {
  return (
    <>
      <FluxApp
        guide={
          <>
            <AdSlot placement="home" />
            <HomeGuide />
          </>
        }
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
        }}
      />
    </>
  );
}
