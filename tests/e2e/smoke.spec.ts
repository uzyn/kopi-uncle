import { expect, test } from '@playwright/test';

test('the built app renders the wordmark under its base path', async ({ page, baseURL }) => {
  // Relative — the base path lives in `use.baseURL` and nowhere else, so this
  // navigation is what proves the built asset URLs resolve on the subpath.
  const response = await page.goto('./');
  expect(response?.ok()).toBe(true);

  await expect(page.getByRole('heading', { name: 'KOPI UNCLE' })).toBeVisible();
  expect(new URL(page.url()).pathname).toBe(new URL(baseURL ?? '').pathname);
});

test('loads every asset the page asks for', async ({ page }) => {
  const failures: string[] = [];
  page.on('requestfailed', (request) => failures.push(`failed ${request.url()}`));
  page.on('response', (response) => {
    if (response.status() >= 400) failures.push(`${response.status()} ${response.url()}`);
  });

  await page.goto('./');
  await expect(page.getByRole('heading', { name: 'KOPI UNCLE' })).toBeVisible();

  expect(failures).toEqual([]);
});
