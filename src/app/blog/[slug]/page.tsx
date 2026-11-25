import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { AdSlot } from "@/components/adsense";
import { bloggerArticle } from "@/lib/blogger-article";
import { creator, pageMetadata, publicReady, siteUrl } from "@/lib/site";

// Read from Blogger on each request so new posts appear without a redeploy.
export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await bloggerArticle(slug);
  if (!post) return { robots: { index: false, follow: false } };
  const path = `/blog/${post.slug}`;
  const base = pageMetadata(post.title, post.description, path);
  const image = post.image ?? "/social/blog.png";
  return {
    ...base,
    openGraph: {
      title: post.title,
      description: post.description,
      url: path,
      siteName: "Flux",
      type: "article",
      authors: [creator.name],
      ...(post.published ? { publishedTime: post.published } : {}),
      ...(post.updated ? { modifiedTime: post.updated } : {}),
      images: [{ url: image, alt: post.title }],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.description,
      images: [image],
    },
    robots: { index: publicReady, follow: publicReady },
  };
}

export default async function Post({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await bloggerArticle(slug);
  if (!post) notFound();
  const url = new URL(`/blog/${post.slug}`, siteUrl).href;
  const author = { "@type": "Person", name: creator.name, url: creator.url };
  const schema = [
    {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      headline: post.title,
      description: post.description,
      url,
      mainEntityOfPage: url,
      author,
      publisher: author,
      ...(post.image ? { image: post.image } : {}),
      ...(post.labels.length ? { keywords: post.labels.join(", ") } : {}),
      ...(post.published ? { datePublished: post.published } : {}),
      ...(post.updated || post.published
        ? { dateModified: post.updated ?? post.published }
        : {}),
    },
    {
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
          name: "Blog",
          item: new URL("/blog", siteUrl).href,
        },
        { "@type": "ListItem", position: 3, name: post.title, item: url },
      ],
    },
  ];
  return (
    <main className="editorial">
      <nav aria-label="Breadcrumb">
        <Link href="/">Home</Link> / <Link href="/blog">Blog</Link> /{" "}
        <span>{post.title}</span>
      </nav>
      <article>
        <h1>{post.title}</h1>
        <p className="editorial-lead">
          By{" "}
          <a href={creator.url} rel="author noopener">
            {creator.name}
          </a>
          {post.published ? (
            <>
              {" · "}
              <time dateTime={post.published}>
                {new Date(post.published).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                  timeZone: "UTC",
                })}
              </time>
            </>
          ) : null}
        </p>
        <div dangerouslySetInnerHTML={{ __html: post.html }} />
      </article>
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
