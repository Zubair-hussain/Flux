import { ContentPage } from "@/components/content-page";
import Link from "next/link";
import { bloggerPosts } from "@/lib/blogger";
import { postSlug } from "@/lib/blogger-article";
import { creator, pageMetadata, siteUrl } from "@/lib/site";
// Read Blogger on each request so new articles appear without a redeploy.
export const dynamic = "force-dynamic";
export const metadata = pageMetadata(
  "Video download guides and updates",
  "Practical Flux guides, source-quality explanations, and updates from our Blogger publication.",
  "/blog",
);
export default async function Blog() {
  const posts = await bloggerPosts();
  // Lets search engines read each article with its date and author.
  const schema = {
    "@context": "https://schema.org",
    "@type": "Blog",
    name: "Flux blog",
    url: new URL("/blog", siteUrl).href,
    author: { "@type": "Person", name: creator.name, url: creator.url },
    publisher: { "@type": "Person", name: creator.name, url: creator.url },
    blogPost: posts.map((post) => ({
      "@type": "BlogPosting",
      headline: post.title,
      url: new URL(`/blog/${postSlug(post.url)}`, siteUrl).href,
      ...(post.published ? { datePublished: post.published } : {}),
      author: { "@type": "Person", name: creator.name, url: creator.url },
    })),
  };
  return (
    <ContentPage
      title="Flux blog"
      description="Practical guides for saving permitted videos and understanding source quality."
      path="/blog"
    >
      <section>
        <h2>Latest articles</h2>
        {posts.length ? (
          posts.map((post) => (
            <article key={post.url}>
              <h3>
                <Link href={`/blog/${postSlug(post.url)}`}>{post.title}</Link>
              </h3>
              <p>Read the article.</p>
            </article>
          ))
        ) : (
          <p>
            Our publication is coming soon. Articles will appear here after the
            Blogger connection is configured and the first reviewed posts are
            published.
          </p>
        )}
      </section>
      <section>
        <h2>Start with source quality</h2>
        <p>
          Choosing 4K cannot add detail to a 720p source. Flux lists the source
          formats it can inspect, and treats 720×1280 portrait video as 720p.
        </p>
      </section>
      <section>
        <h2>When a link does not work</h2>
        <p>
          Login requirements, regional restrictions, missing metadata, and
          platform changes can prevent extraction. A supported platform name
          does not guarantee that every video is accessible.
        </p>
      </section>
      <section>
        <h2>1080p or 4K: which should you pick?</h2>
        <p>
          A 4K file is often three to four times the size of the same video in
          1080p. Pick 4K when you will watch on a large screen or edit and crop
          the footage. For phones, laptops, and quick sharing, 1080p usually
          looks the same and downloads much faster. Portrait clips from TikTok
          or Instagram rarely go above 1080p.
        </p>
      </section>
      <section>
        <h2>Why the file is MKV</h2>
        <p>
          High-resolution sources usually deliver video and audio as separate
          streams in different codecs. Flux merges them with FFmpeg into MKV
          because that container accepts nearly every codec without re-encoding,
          so you keep the original quality. VLC, mpv, and most modern players
          open MKV directly.
        </p>
      </section>
      <section>
        <h2>Keep the engine up to date</h2>
        <p>
          Video sites change often. If a link that used to work starts failing,
          update the engine with{" "}
          <code>
            python -m pip install -U &quot;yt-dlp[default,curl-cffi]&quot;
          </code>{" "}
          and try again. The curl-cffi extra lets yt-dlp reach sites such as
          Dailymotion that check which browser is asking.
        </p>
      </section>
      <section>
        <h2>Respect the creator</h2>
        <p>
          Check permission before saving or republishing. A download tool does
          not replace the creator’s license or the platform’s terms.
        </p>
      </section>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(schema).replace(/</g, "\\u003c"),
        }}
      />
    </ContentPage>
  );
}
