import { test, expect } from '@playwright/test';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
test('extension popup sends only the active supported URL to Flux', async ({ page }) => {
  await page.addInitScript(() => {
    Object.assign(window, { chrome: { tabs: { query: (_: unknown, callback: (tabs: { url: string }[]) => void) => callback([{ url: 'https://www.youtube.com/watch?v=demo' }]), create: (options: { url: string }) => { document.body.dataset.opened = options.url; } } } });
  });
  await page.goto(pathToFileURL(path.resolve('extension/popup.html')).href);
  await expect(page.getByRole('status')).toHaveText('www.youtube.com');
  await page.getByRole('button', { name: 'Open in Flux' }).click();
  expect(await page.locator('body').getAttribute('data-opened')).toBe('http://127.0.0.1:3000/?url=https%3A%2F%2Fwww.youtube.com%2Fwatch%3Fv%3Ddemo');
});
test('extension rejects unsupported active tabs', async ({ page }) => {
  await page.addInitScript(() => { Object.assign(window, { chrome: { tabs: { query: (_: unknown, callback: (tabs: { url: string }[]) => void) => callback([{ url: 'https://example.com' }]) } } }); });
  await page.goto(pathToFileURL(path.resolve('extension/popup.html')).href);
  await expect(page.getByRole('button', { name: 'Open in Flux' })).toBeDisabled();
});
