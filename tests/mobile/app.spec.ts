import { test, expect, type Page } from '@playwright/test';

const back = (page: Page) =>
  page.evaluate(() => window.dispatchEvent(new Event('atelier:back', { cancelable: true })));

test('bundled mobile demo has all sections, no API, and no browser installation prompt', async ({
  page,
}) => {
  const errors: string[] = [];
  const apiRequests: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('request', (request) => {
    if (new URL(request.url()).pathname.startsWith('/api/')) apiRequests.push(request.url());
  });
  await page.goto('/');
  await expect(page.locator('html')).toHaveClass('native-app');
  await expect(page.locator('.event-card')).toHaveCount(3);
  await expect(page.getByRole('button', { name: 'Ia atelierul cu tine' })).toHaveCount(0);
  await expect(page.locator('.admin-link')).toHaveCount(0);
  expect(
    await page.evaluate(async () => (await navigator.serviceWorker.getRegistrations()).length),
  ).toBe(0);
  for (const name of ['Calendar', 'Amintiri', 'Pentru suflet', 'Pentru ochi', 'Ateliere']) {
    await page.locator('.mobile-nav').getByRole('button', { name, exact: true }).click();
    await expect(page.locator('.mobile-nav button.active')).toHaveText(name);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
  }
  await page.screenshot({ path: '.local/screenshots/mobile-home.png', fullPage: true });
  expect(apiRequests).toEqual([]);
  expect(errors).toEqual([]);
});

test('Android back dismisses photo, then event, then returns home', async ({ page }) => {
  await page.goto('/#memories');
  await page.locator('.event-card').first().click();
  await page.locator('.photo-grid button').first().click();
  await expect(page.locator('.lightbox')).toBeVisible();
  expect(await back(page)).toBe(false);
  await expect(page.locator('.lightbox')).toHaveCount(0);
  await expect(page.locator('dialog')).toBeVisible();
  expect(await back(page)).toBe(false);
  await expect(page.locator('dialog')).toHaveCount(0);
  await expect(page.locator('.mobile-nav button.active')).toHaveText('Amintiri');
  expect(await back(page)).toBe(false);
  await expect(page.locator('.mobile-nav button.active')).toHaveText('Ateliere');
  expect(await back(page)).toBe(true); // Native bridge may now minimize the app.
});

test('calendar export still downloads an ICS when the mobile build is previewed in a browser', async ({
  page,
}) => {
  await page.goto('/#exhibitions');
  await page.locator('.event-card').first().click();
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Salvează / distribuie data' }).click();
  const file = await download;
  expect(file.suggestedFilename()).toBe('atelier-de-vise.ics');
  const stream = await file.createReadStream();
  let data = '';
  for await (const chunk of stream!) data += chunk.toString();
  expect(data).toContain('BEGIN:VCALENDAR');
  expect(data).toContain('BEGIN:VEVENT');
  expect(data).toContain('DTSTART:');
  await expect(page.locator('.error')).toHaveCount(0);
});

test('notch and Android inset variables protect content in portrait and landscape', async ({
  page,
}) => {
  await page.goto('/#calendar');
  for (const [width, height] of [
    [320, 740],
    [430, 932],
    [844, 390],
  ]) {
    await page.setViewportSize({ width, height });
    await page.evaluate(() => {
      for (const [edge, value] of Object.entries({ top: 48, bottom: 24, left: 12, right: 12 })) {
        document.documentElement.style.setProperty(`--safe-area-inset-${edge}`, `${value}px`);
      }
    });
    expect(await page.evaluate(() => getComputedStyle(document.body).paddingTop)).toBe('48px');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    if (width < 768) {
      expect(
        await page.locator('.mobile-nav').evaluate((el) => getComputedStyle(el).paddingBottom),
      ).toBe('33px');
    }
  }
});

test('native calendar bridge shares a private-cache ICS and handles cancellation and errors', async ({
  page,
}) => {
  // Contract test of our bridge calls; actual OS sheets still need device testing.
  await page.addInitScript(() => {
    const state = window as unknown as Record<string, any>;
    state.androidBridge = {};
    state.nativeCalls = [];
    state.shareResult = 'ok';
    state.Capacitor = {
      PluginHeaders: Object.entries({
        App: ['addListener', 'removeListener', 'minimizeApp'],
        StatusBar: ['setStyle'],
        SplashScreen: ['hide'],
        Filesystem: ['writeFile'],
        Share: ['share'],
      }).map(([name, methods]) => ({
        name,
        methods: methods.map((method) => ({
          name: method,
          rtype: method === 'addListener' ? 'callback' : 'promise',
        })),
      })),
      nativeCallback: () => 'test-listener',
      nativePromise: async (plugin: string, method: string, options: unknown) => {
        state.nativeCalls.push({ plugin, method, options });
        if (plugin === 'Filesystem') return { uri: 'file:///cache/atelier-de-vise.ics' };
        if (plugin === 'Share' && state.shareResult !== 'ok') throw new Error(state.shareResult);
        return {};
      },
    };
  });
  await page.goto('/#exhibitions');
  await page.locator('.event-card').first().click();
  const share = page.getByRole('button', { name: 'Salvează / distribuie data' });
  await share.click();
  await expect(share).toBeEnabled();
  const calls = await page.evaluate(() => (window as unknown as Record<string, any>).nativeCalls);
  expect(calls.find((call: any) => call.plugin === 'Filesystem').options).toMatchObject({
    directory: 'CACHE',
    encoding: 'utf8',
    data: expect.stringContaining('BEGIN:VCALENDAR'),
  });
  expect(calls.find((call: any) => call.plugin === 'Share').options.files).toEqual([
    'file:///cache/atelier-de-vise.ics',
  ]);
  await page.evaluate(() => {
    (window as unknown as Record<string, any>).shareResult = 'Share canceled';
  });
  await share.click();
  await expect(share).toBeEnabled();
  await expect(page.locator('.error')).toHaveCount(0);
  await page.evaluate(() => {
    (window as unknown as Record<string, any>).shareResult = 'Native storage unavailable';
  });
  await share.click();
  await expect(page.locator('.error')).toContainText('Nu am putut exporta data');
  await expect(share).toBeEnabled();
});
