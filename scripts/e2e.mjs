#!/usr/bin/env node
/**
 * KOPI_SCAFFOLD_PLACEHOLDER — the `npm run e2e` gate stage, standing in until
 * Sprint 6 (S6-1) wires Playwright against the built app on its base path.
 *
 * It lives in its own file so that S6-1 replaces a file it owns instead of the
 * shared `package.json`. The npm script stays `node scripts/e2e.mjs` forever;
 * only this body changes.
 *
 * It refuses to pass vacuously: the moment `tests/e2e/` holds a spec — at any
 * depth — there is a real browser test that this script is not running, so it
 * exits 1 and forces the swap. That guard takes no override — the tree it walks
 * is always this file's own parent, so nothing in the environment can talk it
 * into a green gate. The test that exercises the refusal copies this script
 * into a temporary tree and runs the copy.
 *
 * Remove the KOPI_SCAFFOLD_PLACEHOLDER marker above when replacing this file —
 * the scaffold tests that assert placeholder behaviour retire on its absence.
 */
import { readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, relative, resolve } from 'node:path';

const REPLACED_BY = 'S6-1 (Sprint 6 — Playwright under the base path)';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const e2eDir = join(root, 'tests', 'e2e');

function findSpecs(dir) {
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return [];
  }
  const found = [];
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      found.push(...findSpecs(full));
    } else if (/\.spec\.tsx?$/.test(entry.name)) {
      found.push(relative(root, full));
    }
  }
  return found;
}

const specs = findSpecs(e2eDir).sort();

if (specs.length > 0) {
  console.error(
    `e2e: found ${specs.length} spec file(s) under tests/e2e/ that this placeholder ` +
      `does not run — ${specs.join(', ')}. ${REPLACED_BY} has not replaced it. ` +
      `Refusing to report a green gate.`,
  );
  process.exit(1);
}

console.log(`e2e: placeholder — no browser tests run. Replaced by ${REPLACED_BY}.`);
process.exit(0);
