import { defineConfig, devices } from '@playwright/test';
import { basePathFor } from './vite.config';

/**
 * PRD §10.6/§10.7 — e2e runs against the *built* app on the same subpath the
 * deploy will serve it from, so a base-path regression fails the gate rather
 * than production. The base is read from the Vite config's own resolver, never
 * restated as a literal, which is what keeps the suite green under a fork, a
 * rename or a clone under any other name.
 */
const PORT = 4173;
const HOST = '127.0.0.1';

/** Fixed and strict: `--strictPort` makes a taken port a hard failure rather
 * than a silent hop to another one, which would leave `baseURL` pointing at
 * nothing. Staleness is governed by `reuseExistingServer` below, not by this. */
export const ORIGIN = `http://${HOST}:${PORT}`;

/**
 * The one place the runner's URL is assembled. Exported so the config spec can
 * exercise it for a repository name other than the ambient one — otherwise its
 * assertions collapse to `endsWith('/')` wherever `GITHUB_REPOSITORY` is unset.
 */
export function e2eBaseURLFor(githubRepository: string | undefined): string {
  return `${ORIGIN}${basePathFor(githubRepository)}`;
}

const BASE_URL = e2eBaseURLFor(process.env.GITHUB_REPOSITORY);

export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? [['html', { open: 'never' }], ['list']] : 'list',
  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
  },
  // Chromium only (PRD §10.7): `npx playwright install --with-deps chromium`
  // is the single out-of-band install step the README documents.
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: `npm run build && npm run preview -- --host ${HOST} --port ${PORT} --strictPort`,
    url: BASE_URL,
    // CI always builds and boots its own server. Locally the suite attaches to
    // whatever already answers on this port — fast, but it does mean a stale
    // `npm run preview` left running is what gets tested; kill it to force a
    // fresh build.
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    stdout: 'pipe',
    stderr: 'pipe',
  },
});
