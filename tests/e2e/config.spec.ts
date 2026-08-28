import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { expect, test } from '@playwright/test';
import config, { ORIGIN, e2eBaseURLFor } from '../../playwright.config';
import { basePathFor } from '../../vite.config';

const CONFIG_SOURCE = readFileSync(
  fileURLToPath(new URL('../../playwright.config.ts', import.meta.url)),
  'utf8',
);

/** Comments legitimately mention paths; only executable source is checked. */
const CONFIG_CODE = CONFIG_SOURCE.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

const resolvedBase = basePathFor(process.env.GITHUB_REPOSITORY);

test.describe('the Playwright configuration', () => {
  test('collects only tests/e2e and runs exactly one project, chromium', () => {
    expect(config.testDir).toBe('tests/e2e');
    expect(config.projects).toHaveLength(1);
    expect(config.projects?.[0]?.name).toBe('chromium');
  });

  test('serves a fresh build through vite preview on the origin it tests', () => {
    const server = config.webServer as { command: string; reuseExistingServer?: boolean };

    expect(Array.isArray(config.webServer)).toBe(false);
    expect(server.command).toMatch(/build/);
    expect(server.command).toMatch(/preview/);
    expect(server.command).toMatch(/--strictPort/);
    // The port served must be the port tested, not merely *a* port.
    expect(server.command).toContain(`--port ${new URL(ORIGIN).port}`);
    expect(server.reuseExistingServer).toBe(!process.env.CI);
  });

  test('derives the base path from the repository name, whatever it is', () => {
    // Explicit cases, so these assertions still bite where `GITHUB_REPOSITORY`
    // is unset and the ambient base collapses to `/`.
    expect(e2eBaseURLFor('acme/demo')).toBe(`${ORIGIN}/demo/`);
    expect(e2eBaseURLFor(undefined)).toBe(`${ORIGIN}/`);
    expect(new URL('./', e2eBaseURLFor('acme/demo')).pathname).toBe('/demo/');
  });

  test('pins both the server URL and baseURL to the base path Vite resolved', () => {
    const server = config.webServer as { url?: string };

    expect(config.use?.baseURL).toBe(e2eBaseURLFor(process.env.GITHUB_REPOSITORY));
    expect(server.url).toBe(config.use?.baseURL);
    expect(config.use?.baseURL?.endsWith(resolvedBase)).toBe(true);
    // `page.goto('./')` must land inside the subpath, not at the origin root.
    expect(new URL('./', config.use?.baseURL).pathname).toBe(resolvedBase);
  });

  test('never writes a repository name as a literal', () => {
    expect(CONFIG_CODE).toMatch(/basePathFor/);
    // Structural rather than a check for today's repository name: no string
    // literal in the config may carry a named `/segment/` path at all, so this
    // keeps biting after a rename.
    expect(CONFIG_CODE).not.toMatch(/['"`][^'"`\n]*\/[A-Za-z0-9][^'"`\n]*\//);
  });
});
