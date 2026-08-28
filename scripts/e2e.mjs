#!/usr/bin/env node
/**
 * The `npm run e2e` gate stage (S6-1). Runs Playwright against a fresh build
 * served by `vite preview` on the base path Vite resolved — see
 * `playwright.config.ts`.
 *
 * It stays an indirection through this file rather than naming the tool in
 * `package.json`, so the manifest is never the file two sprints have to share.
 *
 * The one out-of-band install step is `npx playwright install --with-deps
 * chromium`; the config declares chromium as its only project, so no other
 * browser binary is ever required. A missing binary is reported here as the
 * install command to run rather than as a wall of Playwright output.
 */
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const playwrightCli = join(root, 'node_modules', '@playwright', 'test', 'cli.js');

if (!existsSync(playwrightCli)) {
  console.error('e2e: @playwright/test is not installed — run `npm ci` first.');
  process.exit(1);
}

const result = spawnSync(process.execPath, [playwrightCli, 'test', ...process.argv.slice(2)], {
  cwd: root,
  stdio: 'inherit',
  env: process.env,
});

if (result.error) {
  console.error(`e2e: failed to start Playwright — ${result.error.message}`);
  process.exit(1);
}

if (result.status !== 0) {
  console.error(
    'e2e: Playwright reported failures. If the browser binary is missing, run ' +
      '`npx playwright install --with-deps chromium`.',
  );
}

process.exit(result.status ?? 1);
