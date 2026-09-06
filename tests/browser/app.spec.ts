import { test, expect } from '@playwright/test';

test('desktop: public pages, calendar, gallery and buying request form', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Fă loc bucuriei.' })).toBeVisible();
  await expect(page.locator('.event-card')).toHaveCount(3);
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: '.local/screenshots/desktop.png', fullPage: true });
  await page.getByRole('button', { name: 'Descoperă atelierele' }).click();
  await expect(page.locator('.calendar-panel')).toBeVisible();
  await page.getByRole('button', { name: 'Mic, dar desenez', exact: true }).click();
  await expect(page.locator('.calendar-events .event-card')).toHaveCount(2);
  await page.locator('.calendar-events .event-card').first().click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page.getByLabel('Numele tău')).toBeVisible();
  await expect(
    page.getByText('Completează datele părintelui sau tutorelui.', { exact: false }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Închide', exact: true }).click();
  await page.locator('.desktop-nav').getByRole('button', { name: 'Amintiri' }).click();
  await expect(page.locator('.event-card')).toHaveCount(2);
  await page.locator('.event-card').first().click();
  await expect(page.getByText('Acest eveniment s-a încheiat.', { exact: false })).toBeVisible();
  await page.getByRole('button', { name: 'Închide', exact: true }).click();
  await page.locator('.desktop-nav').getByRole('button', { name: 'Pentru suflet' }).click();
  await page.locator('.art-card').first().click();
  await expect(page.getByRole('button', { name: 'Sunt interesat(ă)' })).toBeVisible();
  await page.getByRole('button', { name: 'Închide', exact: true }).click();
  await page.locator('.desktop-nav').getByRole('button', { name: 'Pentru ochi' }).click();
  await page.locator('.event-card').first().click();
  await expect(page.getByRole('button', { name: 'Adaugă în calendar' })).toBeVisible();
  await page.getByRole('button', { name: 'Închide', exact: true }).click();
  expect(errors).toEqual([]);
});
test('mobile: no horizontal overflow, usable navigation and registration dialog', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await expect(page.locator('.event-card')).toHaveCount(3);
  await page.evaluate(() => document.fonts.ready);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: '.local/screenshots/mobile.png', fullPage: true });
  await page.locator('.mobile-nav').getByRole('button', { name: 'Calendar', exact: true }).click();
  await expect(page.locator('.calendar-panel')).toBeVisible();
  await page.locator('.calendar-events .event-card').first().click();
  await page.getByLabel('Numele tău').fill('Test vizual');
  await page.getByLabel('Număr de telefon').fill('0712345678');
  await expect(page.getByRole('button', { name: 'Confirmă înscrierea' })).toBeEnabled();
  await page.screenshot({ path: '.local/screenshots/mobile-booking.png', fullPage: true });
  await page.getByRole('button', { name: 'Închide', exact: true }).click();
  await page.setViewportSize({ width: 320, height: 700 });
  await page.goto('/');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
test('administrator: login, editor, photograph management and settings', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/admin');
  await page.getByLabel('Email', { exact: true }).fill(process.env.ADMIN_EMAIL!);
  await page.getByLabel('Parolă', { exact: true }).fill(process.env.ADMIN_PASSWORD!);
  await page.getByRole('button', { name: 'Intră în atelier' }).click();
  await expect(page.locator('.admin-event')).toHaveCount(10);
  await page.screenshot({ path: '.local/screenshots/admin.png', fullPage: true });
  await page.getByRole('button', { name: 'Adaugă eveniment' }).click();
  await expect(page.getByLabel('Repetare săptămânală')).toBeVisible();
  await page.getByLabel('Activitate', { exact: true }).selectOption('adults');
  await expect(page.getByLabel('Format', { exact: true })).toHaveValue('private');
  await page.getByRole('button', { name: 'Închide', exact: true }).click();
  await page.locator('.admin-event').first().getByRole('button', { name: 'Fotografii' }).click();
  await expect(page.getByText('Adaugă fotografii', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Închide', exact: true }).click();
  await page.getByRole('button', { name: 'Setări atelier', exact: true }).click();
  await expect(page.getByLabel('Numele artistului / atelierului')).toHaveValue('Atelier de vise');
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByRole('button', { name: 'Deconectare' }).click();
  await expect(page.getByLabel('Parolă', { exact: true })).toBeVisible();
});
