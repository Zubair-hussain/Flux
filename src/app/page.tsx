import { FluxApp, type AppMode } from "@/components/flux-app";
import { HomeGuide, faqFor } from "@/components/home-guide";
import { AdSlot } from "@/components/adsense";
import { creator, repositoryUrl, siteUrl } from "@/lib/site";
import { platforms } from "@/lib/platforms";

const buildJsonLd = (mode: AppMode) => ({
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
      creator: { "@id": `${creator.url}/#person` },
      author: { "@id": `${creator.url}/#person` },
      publisher: { "@id": `${creator.url}/#person` },
    },
    {
      "@type": "Person",
      "@id": `${creator.url}/#person`,
      name: creator.name,
      url: creator.url,
      sameAs: [creator.url, "https://github.com/Zubair-hussain", repositoryUrl],
    },
    {
      "@type": "WebApplication",
      "@id": new URL("/#app", siteUrl).href,
      author: { "@id": `${creator.url}/#person` },
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
      mainEntity: faqFor(mode).map(([q, a]) => ({
        "@type": "Question",
        name: q,
        acceptedAnswer: { "@type": "Answer", text: a },
      })),
    },
  ],
});

/** local: own computer · command: website builds a CLI command · remote: website downloads through a Flux server. */
function appMode(): { mode: AppMode; apiBase: string } {
  const apiBase = (process.env.NEXT_PUBLIC_FLUX_API || "").replace(/\/$/, "");
  if (process.env.FLUX_HOSTED === "true" || process.env.FLUX_ROUTER === "true")
    return { mode: "remote", apiBase: "" };
  if (process.env.FLUX_PUBLIC_SITE === "true")
    return apiBase
      ? { mode: "remote", apiBase }
      : { mode: "command", apiBase: "" };
  return { mode: "local", apiBase: "" };
}

export default function Home() {
  const { mode, apiBase } = appMode();
  return (
    <>
      <FluxApp
        mode={mode}
        apiBase={apiBase}
        turnstileSiteKey={
          process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || undefined
        }
        guide={
          <>
            <AdSlot placement="home" />
            <HomeGuide mode={mode} />
          </>
        }
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(buildJsonLd(mode)).replace(/</g, "\\u003c"),
        }}
      />
    </>
  );
}
