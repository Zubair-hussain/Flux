import { test, expect } from '@playwright/test';
test.beforeEach(async ({ page }) => { await page.route('**/api/downloads', route => route.fulfill({ json: [] })); });
test('homepage is responsive and platform shortcuts focus the URL input', async ({ page }) => {
  await page.goto('/'); await expect(page.getByRole('heading', { name: 'Great videos. Yours to keep.' })).toBeVisible();
  await page.getByRole('button', { name: 'YouTube', exact: true }).click(); await expect(page.getByLabel('Video URL', { exact: true })).toBeFocused();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: `test-results/home-${test.info().project.name}.png`, fullPage: true });
});
test('inspects source qualities and starts a download', async ({ page }) => {
  await page.route('**/api/inspect', route => route.fulfill({ json: { url: 'https://youtube.com/watch?v=demo', title: 'Mountain sunrise', platform: 'YouTube', creator: 'Creator', duration: 65, qualities: [1080, 2160] } }));
  await page.route('**/api/downloads', route => route.request().method() === 'POST' ? route.fulfill({ status: 202, json: { id: 'test', title: 'Mountain sunrise', platform: 'YouTube', quality: 2160, status: 'queued', createdAt: new Date().toISOString() } }) : route.fulfill({ json: [] }));
  await page.goto('/'); await page.getByLabel('Video URL', { exact: true }).fill('https://youtube.com/watch?v=demo'); await page.getByRole('button', { name: 'Find video', exact: true }).click();
  await expect(page.getByRole('combobox')).toHaveValue('2160'); await expect(page.getByRole('option', { name: '8K', exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'Download 4K', exact: true }).click(); await expect(page.getByRole('heading', { name: 'Mountain sunrise' })).toBeVisible(); await expect(page.getByText('queued', { exact: true })).toBeVisible();
});
test('shows policy errors and installation instructions', async ({ page }) => {
  await page.route('**/api/inspect', route => route.fulfill({ status: 403, json: { error: 'Sexual content is not allowed.' } }));
  await page.goto('/'); await page.getByLabel('Video URL', { exact: true }).fill('https://reddit.com/r/nsfw'); await page.getByRole('button', { name: 'Find video', exact: true }).click(); await expect(page.getByRole('alert')).toHaveText('Sexual content is not allowed.');
  await page.getByRole('button', { name: 'Get the Chrome extension' }).click(); await expect(page.getByRole('dialog')).toContainText('Load unpacked'); await page.keyboard.press('Escape'); await expect(page.getByRole('dialog')).toHaveCount(0);
});
