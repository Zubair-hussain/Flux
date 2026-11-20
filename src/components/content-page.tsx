import Link from "next/link";
import { siteUrl } from "@/lib/site";
import { AdSlot } from "@/components/adsense";
export function ContentPage({
  title,
  description,
  path,
  children,
}: {
  title: string;
  description: string;
  path: string;
  children: React.ReactNode;
}) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: new URL("/", siteUrl).href,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: title,
        item: new URL(path, siteUrl).href,
      },
    ],
  };
  return (
    <main className="editorial">
      <nav aria-label="Breadcrumb">
        <Link href="/">Home</Link> / <span>{title}</span>
      </nav>
      <h1>{title}</h1>
      <p className="editorial-lead">{description}</p>
      {children}
      <AdSlot placement="content" />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(schema).replace(/</g, "\\u003c"),
        }}
      />
    </main>
  );
}
