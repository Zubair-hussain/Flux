import { notFound } from "next/navigation";
import { pages } from "@/lib/editorial";
import { pageMetadata } from "@/lib/site";
import { ContentPage } from "@/components/content-page";
export function generateStaticParams() {
  return Object.keys(pages).map((slug) => ({ slug }));
}
export const dynamicParams = false;
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const page = pages[slug as keyof typeof pages];
  return page ? pageMetadata(page.seoTitle, page.description, `/${slug}`) : {};
}
export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const page = pages[slug as keyof typeof pages];
  if (!page) notFound();
  return (
    <ContentPage
      title={page.title}
      description={page.description}
      path={`/${slug}`}
    >
      {page.sections.map(([heading, text]) => (
        <section key={heading}>
          <h2>{heading}</h2>
          <p>{text}</p>
        </section>
      ))}
    </ContentPage>
  );
}
