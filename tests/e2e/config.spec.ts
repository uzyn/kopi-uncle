import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { expect, test } from '@playwright/test';
import config from '../../playwright.config';
import { basePathFor } from '../../vite.config';

const CONFIG_SOURCE = readFileSync(
  fileURLToPath(new URL('../../playwright.config.ts', import.meta.url)),
  'utf8',
);

const resolvedBase = basePathFor(process.env.GITHUB_REPOSITORY);

test.describe('the Playwright configuration', () => {
  test('collects only tests/e2e and runs exactly one project, chromium', () => {
    expect(config.testDir).toBe('tests/e2e');
    expect(config.projects).toHaveLength(1);
    expect(config.projects?.[0]?.name).toBe('chromium');
  });

  test('serves a fresh build through vite preview on a fixed strict port', () => {
    const server = config.webServer as { command: string; reuseExistingServer?: boolean };

    expect(Array.isArray(config.webServer)).toBe(false);
    expect(server.command).toMatch(/build/);
    expect(server.command).toMatch(/preview/);
    expect(server.command).toMatch(/--strictPort/);
    expect(server.command).toMatch(/--port \d+/);
    expect(server.reuseExistingServer).toBe(!process.env.CI);
  });

  test('pins both the server URL and baseURL to the base path Vite resolved', () => {
    const server = config.webServer as { url?: string };

    expect(server.url?.endsWith(resolvedBase)).toBe(true);
    expect(config.use?.baseURL?.endsWith(resolvedBase)).toBe(true);
    // `page.goto('./')` must land inside the subpath, not at the origin root.
    expect(new URL('./', config.use?.baseURL).pathname).toBe(resolvedBase);
  });

  test('never writes a repository name as a literal', () => {
    expect(CONFIG_SOURCE).toMatch(/basePathFor/);
    expect(CONFIG_SOURCE).not.toMatch(/kopi-uncle/i);
  });
});
