# Public publishing setup

This checkout remains a local Node downloader. Static editorial pages can be served quickly, but Python/FFmpeg background jobs require a continuously running Node host. Cloudflare Workers/D1 do not run the existing downloader unchanged. Do not remove the loopback API guard to make public downloads work; a public download service requires a separate authenticated worker architecture.

## Live deployment (Cloudflare Workers)

The public website is deployed with OpenNext to Cloudflare Workers at https://flux.detroonshah.workers.dev. Because Workers cannot run Python, yt-dlp or FFmpeg, the hosted site runs in **public-site mode** (`FLUX_PUBLIC_SITE=true`): the homepage builds a ready-to-run `npx flux-downloader` command instead of downloading, and the API routes keep refusing non-local requests. Videos are saved on the visitor's own device.

```powershell
npm run cf:preview     # build and run in Cloudflare's runtime locally
npm run cf:deploy      # build and deploy with wrangler (needs `wrangler login`)
```

`wrangler.jsonc` holds the runtime variables. Static pages read `SITE_URL` and `SEO_INDEXABLE` at build time, so change them in both `wrangler.jsonc` and the repository variables `FLUX_PUBLIC_URL` / `SEO_INDEXABLE`. The workflow [deploy-cloudflare.yml](../.github/workflows/deploy-cloudflare.yml) deploys every push to `_prod` once the repository secrets `CLOUDFLARE_API_TOKEN` (Workers Scripts: Edit) and `CLOUDFLARE_ACCOUNT_ID` exist.

**Going public:** attach your domain under Workers → flux → Settings → Domains, turn on "Always Use HTTPS" in the zone, set `SITE_URL` to it and `SEO_INDEXABLE=true`, redeploy, then submit the sitemap to Google Search Console. The site stays `noindex` until then.

## Placeholders and indexing

Set SITE_URL to the real HTTPS domain, replace operator/contact/jurisdiction placeholders in src/lib/editorial.ts, review the policy text against actual operations, then explicitly set SEO_INDEXABLE=true and rebuild. Preview pages default to noindex and robots disallow; the preview sitemap is empty. Do not submit the preview to search engines. Public API routes must remain private and excluded from indexing/caching.

## Blogger

Enable Blogger API v3 in a Google project. Set server-only BLOGGER_BLOG_ID and BLOGGER_API_KEY for your public blog. Restrict the key to Blogger API and the hosting environment where supported. The blog page fetches up to 20 published titles every five minutes and links to their original articles. It renders no remote HTML. Missing configuration, timeout, or errors show a coming-soon state. No private account access or article publishing is performed. Blogger remains the original article location, avoiding duplicate full-text copies. The connection is implemented but cannot be live-verified without your blog ID/key.

## Titles and content

Each page has one HTML title, one visible H1, Open Graph title, Twitter card title, and a root metadata fallback. These are different display contexts, not four title tags. Sections use descriptive H2 headings. Avoid keyword stuffing and artificial title variation. No meta-keywords list or invented reviews, author credentials, publication dates, or ranking guarantees are included. Breadcrumb schema describes visible navigation. Social images are local 1200×630 PNGs for every public route.

Google does not categorically reject AI assistance. Its guidance emphasizes accuracy and added value and warns against scaled low-value content. Have a real editor verify articles, include first-hand tests with limitations, cite sources, and publish meaningful corrections. Bing similarly emphasizes clear, useful, accessible content and rejects artificial promotion. Submit the live sitemap to Google Search Console and Bing Webmaster Tools after verifying domain ownership.

## Cloudflare cache plan

Place Cloudflare in front of the Node host only after selecting the public architecture. Cache /_next/static/* with the origin's immutable headers. Cache public /social/* images and icon assets with a one-day edge TTL. Cache only anonymous GET/HEAD editorial pages (/blog, /about, /privacy, /cookies, /terms, /copyright, /content-policy) for at most five minutes, respecting origin Cache-Control and bypassing requests with cookies or Authorization. Purge after policy/content changes. NEVER use Cache Everything on /api/*, file downloads, errors, or authenticated responses. Keep the interactive homepage at origin defaults. Enable Brotli and HTTP/3 in the zone; measure Core Web Vitals after deployment.

## D1 preparation

cloudflare/migrations/0001_video_catalog.sql is an optional reviewed public metadata catalog, not video storage. Provision a D1 database in your Cloudflare account, then apply the SQL with Wrangler or the dashboard. Bind it only to an authenticated backend before implementing catalog writes. This schema is not provisioned or connected to the application. Download job files stay local; videos would require object storage such as R2 plus an appropriate authorization/retention design. No Cloudflare account, credentials, or domain was supplied, so no cache rules or cloud database have been deployed.

## Sources checked

- https://developers.google.com/search/docs/fundamentals/using-gen-ai-content
- https://www.bing.com/webmasters/help/bing-webmaster-guidelines-30fba23a
- https://developers.google.com/blogger/docs/3.0/using
- https://developers.google.com/blogger/docs/3.0/reference/posts/list
- https://developers.cloudflare.com/workers/cache/configuration/

These policy pages describe the current implementation and clearly mark missing operator details. They require operator and jurisdiction-specific review before public launch; a template cannot establish legal compliance.
