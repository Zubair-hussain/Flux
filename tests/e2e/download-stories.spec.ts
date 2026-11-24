import { expect, test } from "@playwright/test";

test.setTimeout(90_000);

const info = {
  url: "https://www.instagram.com/reel/demo/",
  title: "A woodland walk",
  platform: "Instagram",
  creator: "Creator",
  duration: 20,
  qualities: [720],
};
const job = {
  id: "story-test",
  title: info.title,
  platform: info.platform,
  quality: 720,
  status: "downloading",
  createdAt: "2026-11-24T00:00:00Z",
};

test("plays silent stories during startup and stops as soon as the file is ready", async ({
  page,
}) => {
  let created = false;
  let complete = false;
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  const media: string[] = [];
  page.on("request", (request) => {
    if (request.url().includes("/animations/wildlife/"))
      media.push(request.url());
  });
  await page.route("**/api/inspect", (route) => route.fulfill({ json: info }));
  await page.route("**/api/downloads", async (route) => {
    if (route.request().method() === "POST") {
      await gate;
      created = true;
      return route.fulfill({ status: 202, json: job });
    }
    return route.fulfill({
      json: created
        ? [{ ...job, status: complete ? "complete" : "downloading" }]
        : [],
    });
  });
  await page.goto("/");
  expect(media).toHaveLength(0);
  await page.getByLabel("Video URL", { exact: true }).fill(info.url);
  await page.getByRole("button", { name: "Find video", exact: true }).click();
  await page
    .getByRole("button", { name: "Download 720p", exact: true })
    .click();
  const panel = page.getByRole("complementary", {
    name: "Wildlife stories while you wait",
  });
  await expect(panel).toBeVisible();
  await expect(
    panel.getByRole("heading", { name: "Starting your download…" }),
  ).toBeVisible();
  await expect(panel.locator("video")).toHaveJSProperty("muted", true);
  await expect
    .poll(() =>
      panel.locator("video").evaluate((el: HTMLVideoElement) => el.currentTime),
    )
    .toBeGreaterThan(0.1);
  await page.getByRole("button", { name: "Pause wildlife animation" }).click();
  await expect(panel.locator("video")).toHaveJSProperty("paused", true);
  const source = await panel.locator("video").getAttribute("src");
  await page.getByRole("button", { name: "Next wildlife story" }).click();
  await expect(panel.locator("video")).not.toHaveAttribute("src", source!);
  await page.getByRole("button", { name: "Play wildlife animation" }).click();
  await expect(panel.locator("video")).toHaveJSProperty("paused", false);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: `test-results/wildlife-${test.info().project.name}.png`,
    fullPage: true,
  });
  release();
  await expect(
    panel.getByRole("heading", { name: "Your video is on its way." }),
  ).toBeVisible();
  complete = true;
  await expect(panel).toHaveCount(0, { timeout: 10000 });
  await expect(page.getByRole("link", { name: "Save file" })).toBeVisible();
});

test("respects reduced motion and allows opting into playback", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.route("**/api/downloads", (route) =>
    route.fulfill({ json: [job] }),
  );
  await page.goto("/");
  await page.getByRole("button", { name: /My downloads/ }).click();
  const video = page.locator(".download-stories video");
  await expect(video).toBeVisible();
  await expect(video).toHaveJSProperty("paused", true);
  await page.getByRole("button", { name: "Play wildlife animation" }).click();
  await expect(video).toHaveJSProperty("paused", false);
  // Ended playback advances the story, rather than replaying one ten-second clip.
  const source = await video.getAttribute("src");
  await video.evaluate((el) => el.dispatchEvent(new Event("ended")));
  await expect(video).not.toHaveAttribute("src", source!);
});

test("returns to the download form and shows the actual error when startup fails", async ({
  page,
}) => {
  await page.route("**/api/inspect", (route) => route.fulfill({ json: info }));
  await page.route("**/api/downloads", (route) =>
    route.fulfill(
      route.request().method() === "POST"
        ? {
            status: 503,
            json: { error: "Download servers are starting. Please retry." },
          }
        : { json: [] },
    ),
  );
  await page.goto("/");
  await page.getByLabel("Video URL", { exact: true }).fill(info.url);
  await page.getByRole("button", { name: "Find video", exact: true }).click();
  await page
    .getByRole("button", { name: "Download 720p", exact: true })
    .click();
  await expect(
    page.getByRole("complementary", {
      name: "Wildlife stories while you wait",
    }),
  ).toHaveCount(0);
  await expect(
    page
      .getByRole("alert")
      .filter({ hasText: "Download servers are starting" }),
  ).toBeVisible();
});
