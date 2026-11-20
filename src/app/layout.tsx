import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import Link from "next/link";
import { pageMetadata, siteUrl } from "@/lib/site";
import { pages } from "@/lib/editorial";
const dmSans = localFont({
  src: "../../node_modules/@fontsource-variable/dm-sans/files/dm-sans-latin-wght-normal.woff2",
  variable: "--font-dm-sans",
  display: "swap",
  weight: "100 1000",
});
const manrope = localFont({
  src: "../../node_modules/@fontsource-variable/manrope/files/manrope-latin-wght-normal.woff2",
  variable: "--font-manrope",
  display: "swap",
  weight: "200 800",
});
export const metadata: Metadata = {
  ...pageMetadata(
    "Video downloader with source-quality selection",
    "Inspect public video links and save permitted videos locally with Flux. Source-quality selection, browser extension, and agent tools.",
    "/",
  ),
  metadataBase: new URL(siteUrl),
  title: "Flux — Great videos. Yours to keep.",
  description:
    "A local-first video downloader with source-quality downloads, a Chrome extension, and tools for AI agents.",
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${dmSans.variable} ${manrope.variable}`}>
      <body>
        {children}
        <nav className="public-links" aria-label="Resources and policies">
          <Link href="/blog">Blog</Link>
          {Object.entries(pages).map(([slug, page]) => (
            <Link key={slug} href={`/${slug}`}>
              {page.title}
            </Link>
          ))}
        </nav>
      </body>
    </html>
  );
}
