import { expect, test } from '@playwright/test';

test('the built app renders the wordmark under its base path', async ({ page, baseURL }) => {
  // A dropped `use.baseURL` should fail as an expectation, not as a
  // `TypeError: Invalid URL` from the assertion below.
  expect(baseURL, 'playwright.config.ts must set use.baseURL').toBeTruthy();

  // Relative — the base path lives in `use.baseURL` and nowhere else, so this
  // navigation is what proves the built asset URLs resolve on the subpath.
  const response = await page.goto('./');
  expect(response?.ok()).toBe(true);

  await expect(page.getByRole('heading', { name: 'KOPI UNCLE' })).toBeVisible();
  expect(new URL(page.url()).pathname).toBe(new URL(baseURL as string).pathname);
});

test('loads every asset the page asks for', async ({ page }) => {
  const failures: string[] = [];
  page.on('requestfailed', (request) => failures.push(`failed ${request.url()}`));
  page.on('response', (response) => {
    if (response.status() >= 400) failures.push(`${response.status()} ${response.url()}`);
  });

  await page.goto('./');
  await expect(page.getByRole('heading', { name: 'KOPI UNCLE' })).toBeVisible();
  // Fonts and other late requests must settle before the list is read, or a
  // 404 that arrives after the wordmark renders is silently missed.
  await page.waitForLoadState('networkidle');

  expect(failures).toEqual([]);
});

// SCRATCH: a deliberate e2e failure proving the gate uploads its artifacts. Never merged.
test('SCRATCH deliberate e2e failure', async ({ page }) => {
  await page.goto('./');
  await expect(page.getByRole('heading', { name: 'THIS HEADING DOES NOT EXIST' })).toBeVisible({
    timeout: 3000,
  });
});
