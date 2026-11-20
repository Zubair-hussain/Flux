import { test, expect } from "@playwright/test";

test("public pages have unique metadata, breadcrumbs, working social images and preview protection", async ({
  page,
  request,
}) => {
  const titles = new Set<string>();
  for (const slug of [
    "blog",
    "about",
    "privacy",
    "cookies",
    "terms",
    "copyright",
    "content-policy",
  ]) {
    await page.goto(`/${slug}`);
    await expect(page.locator("h1")).toHaveCount(1);
    await expect(
      page.getByRole("navigation", { name: "Breadcrumb" }),
    ).toBeVisible();
    const title = await page.title();
    expect(titles.has(title)).toBe(false);
    titles.add(title);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      "href",
      `http://localhost:3000/${slug}`,
    );
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
      "content",
      /noindex/,
    );
    await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute(
      "content",
      "summary_large_image",
    );
    const image = await page
      .locator('meta[property="og:image"]')
      .getAttribute("content");
    expect(image).toContain(`/social/${slug}.png`);
    expect((await request.get(`/social/${slug}.png`)).status()).toBe(200);
    const schema = JSON.parse(
      await page.locator('script[type="application/ld+json"]').innerText(),
    );
    expect(schema["@type"]).toBe("BreadcrumbList");
    expect(schema.itemListElement[1].item).toBe(
      `http://localhost:3000/${slug}`,
    );
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
  await page.goto("/blog");
  await expect(page.getByText(/Our publication is coming soon/)).toBeVisible();
  await page.screenshot({
    path: `test-results/blog-${test.info().project.name}.png`,
    fullPage: true,
  });
  expect(await (await request.get("/robots.txt")).text()).toContain(
    "Disallow: /",
  );
  expect(await (await request.get("/sitemap.xml")).text()).not.toContain(
    "<loc>",
  );
});
