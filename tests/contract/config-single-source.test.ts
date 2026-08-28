import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

import { CONFIG } from '../../src/game/config';

const ROOT = fileURLToPath(new URL('../..', import.meta.url));

/** The one file §10.4 permits these numbers to appear in. */
const SINGLE_SOURCE = 'src/game/config.ts';

/**
 * Derived from `CONFIG` rather than restated, so this test cannot itself
 * become the second source of the numbers it polices.
 */
const TUNING_VALUES: readonly number[] = [
  ...new Set([
    ...CONFIG.SHIFTS.flatMap((shift) => [shift.patienceMs, shift.gapStartMs, shift.gapEndMs]),
    CONFIG.WRONG_SERVE_PENALTY_FRACTION,
  ]),
];

function scannedFiles(): string[] {
  const result = spawnSync('git', ['ls-files', 'src', 'tests'], { cwd: ROOT, encoding: 'utf8' });
  expect(result.status, `git ls-files failed: ${result.stderr}`).toBe(0);
  return result.stdout.split('\n').filter((file) => file.length > 0 && file !== SINGLE_SOURCE);
}

function literalPattern(value: number): RegExp {
  const digits = String(value).replace('.', '\\.');
  return new RegExp(`(?<![\\d.])${digits}(?![\\d.])`);
}

describe('§10.4 — every §8 number lives in config.ts and nowhere else', () => {
  const FILES = scannedFiles();

  it('scans a non-trivial set of tracked files', () => {
    expect(FILES.length).toBeGreaterThan(20);
    expect(TUNING_VALUES.length).toBeGreaterThan(9);
  });

  it.each(TUNING_VALUES)('finds %s in no file under src/ or tests/ but config.ts', (value) => {
    const pattern = literalPattern(value);
    const offenders = FILES.filter((file) => pattern.test(readFileSync(join(ROOT, file), 'utf8')));
    expect(
      offenders,
      `${value} is a §8 tuning value — read it from src/game/config.ts instead of ` +
        'restating it, test fixtures included (§10.4)',
    ).toEqual([]);
  });

  it('still finds each of them in config.ts, so the scan is not vacuous', () => {
    const source = readFileSync(join(ROOT, SINGLE_SOURCE), 'utf8');
    for (const value of TUNING_VALUES) {
      expect(literalPattern(value).test(source)).toBe(true);
    }
  });
});
