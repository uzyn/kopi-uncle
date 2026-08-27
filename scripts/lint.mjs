#!/usr/bin/env node
/**
 * KOPI_SCAFFOLD_PLACEHOLDER — the `npm run lint` gate stage, standing in until
 * Sprint 2 (S2-1) wires ESLint 9 flat config.
 *
 * It lives in its own file so that S2-1 replaces a file it owns instead of the
 * shared `package.json`. The npm script stays `node scripts/lint.mjs` forever;
 * only this body changes.
 *
 * It refuses to pass vacuously: the moment an `eslint.config.*` exists, a real
 * linter is available and reporting green from here would be a lie, so this
 * exits 1 and forces the swap. That guard takes no override — the directory it
 * inspects is always this file's own parent, so nothing in the environment can
 * talk it into a green gate. The test that exercises the refusal copies this
 * script into a temporary tree and runs the copy.
 *
 * Remove the KOPI_SCAFFOLD_PLACEHOLDER marker above when replacing this file —
 * the scaffold tests that assert placeholder behaviour retire on its absence.
 */
import { readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const REPLACED_BY = 'S2-1 (Sprint 2 — ESLint 9, type-aware)';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

function eslintConfigIn(dir) {
  let entries;
  try {
    entries = readdirSync(dir);
  } catch {
    return null;
  }
  return entries.find((name) => /^eslint\.config\.[cm]?[jt]s$/.test(name)) ?? null;
}

const found = eslintConfigIn(root);

if (found !== null) {
  console.error(
    `lint: ${found} exists, so a real linter is configured, but ${REPLACED_BY} has ` +
      `not replaced this placeholder. Refusing to report a green gate. ` +
      `Point this script at the real linter, or delete the config.`,
  );
  process.exit(1);
}

console.log(`lint: placeholder — no files linted. Replaced by ${REPLACED_BY}.`);
process.exit(0);
