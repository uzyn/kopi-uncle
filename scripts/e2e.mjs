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
 * browser binary is ever required. This wrapper checks for that binary up
 * front and names the install command if it is absent; everything after that
 * is Playwright's own output, unedited, so a failure is reported as whatever
 * it actually was.
 */
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);

// Resolution rules rather than a hardcoded `node_modules` path, so a
// non-hoisting installer does not read as a missing dependency.
let playwrightCli;
try {
  playwrightCli = require.resolve('@playwright/test/cli');
} catch {
  console.error('e2e: @playwright/test is not installed — run `npm ci` first.');
  process.exit(1);
}

try {
  const { chromium } = await import('@playwright/test');
  if (!existsSync(chromium.executablePath())) {
    console.error(
      'e2e: the chromium binary is missing — run `npx playwright install --with-deps chromium`.',
    );
    process.exit(1);
  }
} catch {
  // Playwright's own launch error names the install command; let it speak.
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

process.exit(result.status ?? 1);
