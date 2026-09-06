import { test, expect } from '@playwright/test';

test('Pages preview works below the repository path without calling an API', async ({ page }) => {
  const errors: string[] = [];
  const apiRequests: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('response', (response) => {
    if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`);
  });
  page.on('request', (request) => {
    if (new URL(request.url()).pathname.includes('/api/')) apiRequests.push(request.url());
  });
  await page.goto('./');
  await expect(page.locator('.preview-notice')).toBeVisible();
  await expect(page.locator('.event-card')).toHaveCount(3);
  await page.evaluate(() => document.fonts.ready);
  for (const img of await page.locator('img').all()) {
    if (!(await img.isVisible())) continue;
    await img.scrollIntoViewIfNeeded();
    await expect
      .poll(() =>
        img.evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth > 0),
      )
      .toBe(true);
  }
  await page.evaluate(() => window.scrollTo(0, 0));
  await expect(page.locator('.admin-link')).toHaveCount(0);
  await page.screenshot({ path: '.local/screenshots/pages-desktop.png', fullPage: true });
  await page.locator('.event-card').first().click();
  await expect(page.locator('.preview-form-note')).toContainText(
    'Înscrierile vor fi disponibile la lansare',
  );
  await expect(page.getByLabel('Număr de telefon')).toHaveCount(0);
  await page.getByRole('button', { name: 'Închide', exact: true }).click();
  await page.locator('.desktop-nav').getByRole('button', { name: 'Amintiri' }).click();
  await page.locator('.event-card').first().click();
  await expect(page.locator('.photo-grid img')).toHaveCount(3);
  await page.locator('.photo-grid button').first().click();
  await expect(page.locator('.lightbox img')).toBeVisible();
  await page.getByRole('button', { name: 'Închide fotografia' }).click();
  await page.getByRole('button', { name: 'Închide', exact: true }).click();
  await page.locator('.desktop-nav').getByRole('button', { name: 'Pentru suflet' }).click();
  await page.locator('.art-card').first().click();
  await expect(page.locator('.preview-form-note')).toContainText(
    'Cererile de cumpărare vor fi disponibile la lansare',
  );
  await expect(page.locator('form')).toHaveCount(0);
  await page.getByRole('button', { name: 'Închide', exact: true }).click();
  for (const width of [390, 320]) {
    await page.setViewportSize({ width, height: 844 });
    await page.goto('./#calendar');
    await expect(page.locator('.calendar-panel')).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
  }
  expect(apiRequests).toEqual([]);
  expect(errors).toEqual([]);
});

test('PWA manifest, icons and offline navigation remain inside the repository path', async ({
  page,
  context,
}) => {
  await page.goto('./');
  await page.waitForFunction(
    async () => !!(await navigator.serviceWorker.getRegistration())?.active,
  );
  const result = await page.evaluate(async () => {
    const url = (document.querySelector('link[rel="manifest"]') as HTMLLinkElement).href;
    const manifest = await (await fetch(url)).json();
    return {
      start: new URL(manifest.start_url, url).pathname,
      icons: await Promise.all(
        manifest.icons.map(
          async (icon: { src: string }) => (await fetch(new URL(icon.src, url))).status,
        ),
      ),
    };
  });
  expect(result.start).toBe('/atelier-de-vise/');
  expect(result.icons).toEqual([200, 200, 200]);
  await page.reload();
  await page.waitForFunction(() => !!navigator.serviceWorker.controller);
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Un mic răgaz.' })).toBeVisible();
  await expect
    .poll(() =>
      page.locator('img').evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0),
    )
    .toBe(true);
  await expect(page.getByRole('link', { name: 'Încearcă din nou' })).toHaveAttribute('href', './');
});
