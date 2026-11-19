import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "Flux — Great videos. Yours to keep.",
  description:
    "A local-first video downloader with source-quality downloads, a Chrome extension, and tools for AI agents.",
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
