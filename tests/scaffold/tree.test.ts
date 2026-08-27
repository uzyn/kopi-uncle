import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const ROOT = fileURLToPath(new URL('../..', import.meta.url));

/** The PRD §10.2 directories that exist for the life of the project. */
const PERMANENT_DIRS = [
  'src/game',
  'src/app',
  'src/components/slots',
  'src/components/queue',
  'src/components/hud',
  'src/components/break',
  'src/components/share',
  'src/graphics',
  'src/storage',
  'src/styles',
  'tests/support',
  'tests/fixtures',
  'tests/contract',
  'tests/game',
  'tests/storage',
  'tests/styles',
  'tests/presentation',
  'tests/lint/fixtures',
  'tests/e2e',
] as const;

/**
 * Track B's scaffolding. PRD §10.2 and §10.5 schedule `src/dev/` for deletion
 * whole once the real engine is wired at M2, so these assertions retire with
 * the directory rather than turning that story's required behaviour red.
 */
const DEV_DIRS = ['src/dev', 'src/dev/gallery', 'tests/dev'] as const;

function trackedFiles(): string[] {
  const result = spawnSync('git', ['ls-files'], { cwd: ROOT, encoding: 'utf8' });
  expect(result.status, `git ls-files failed: ${result.stderr}`).toBe(0);
  return result.stdout.split('\n').filter((line) => line.length > 0);
}

const TRACKED = trackedFiles();

function expectTracked(dir: string): void {
  const prefix = `${dir}/`;
  const hits = TRACKED.filter((file) => file.startsWith(prefix));
  expect(
    hits.length,
    `${dir} exists in PRD §10.2 but git tracks no file under it — a directory ` +
      'with no tracked placeholder does not survive a clone',
  ).toBeGreaterThan(0);
}

describe('the PRD §10.2 tree', () => {
  it.each(PERMANENT_DIRS)('tracks at least one file under %s', (dir) => {
    expectTracked(dir);
  });

  it.skipIf(!existsSync(join(ROOT, 'src/dev')))(
    'tracks the Track B scaffolding directories until M2 deletes them',
    () => {
      for (const dir of DEV_DIRS) {
        expectTracked(dir);
      }
    },
  );
});
