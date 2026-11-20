import { ContentPage } from "@/components/content-page";
import { bloggerPosts } from "@/lib/blogger";
import { pageMetadata } from "@/lib/site";
export const revalidate = 300;
export const metadata = pageMetadata(
  "Video download guides and updates",
  "Practical Flux guides, source-quality explanations, and updates from our Blogger publication.",
  "/blog",
);
export default async function Blog() {
  const posts = await bloggerPosts();
  return (
    <ContentPage
      title="Flux blog"
      description="Practical guides for saving permitted videos and understanding source quality."
      path="/blog"
    >
      <section>
        <h2>From our Blogger publication</h2>
        {posts.length ? (
          posts.map((post) => (
            <article key={post.url}>
              <h3>
                <a href={post.url} rel="noopener noreferrer">
                  {post.title}
                </a>
              </h3>
              <p>Read the original article on our publication.</p>
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
        <h2>Respect the creator</h2>
        <p>
          Check permission before saving or republishing. A download tool does
          not replace the creator’s license or the platform’s terms.
        </p>
      </section>
    </ContentPage>
  );
}
