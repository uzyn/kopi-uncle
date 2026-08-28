#!/usr/bin/env node
/**
 * The `npm run lint` gate stage (S2-1) — the real linter, no longer a scaffold
 * placeholder.
 *
 * It stays an indirection through this file rather than naming `eslint` in
 * `package.json`, because the manifest is the one file `Touches:` cannot keep
 * two concurrent sprints out of: the lint and e2e stages each own a script so
 * Sprints 2 and 6 never collide (PRD §11.3).
 *
 * `--max-warnings 0` is the whole point of the stage. A warning nobody has to
 * fix is a rule that does nothing, so the gate treats the two severities alike.
 */
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

/**
 * ESLint's `package.json` and `bin/` are outside its `exports` map, so the
 * package root is recovered from the resolved entry point and the bin path read
 * from the manifest rather than hard-coded.
 */
function resolveEslintBin() {
  const require = createRequire(import.meta.url);
  const entry = require.resolve('eslint');
  const marker = `${sep}node_modules${sep}eslint${sep}`;
  const index = entry.lastIndexOf(marker);
  if (index === -1) {
    throw new Error(`could not locate the eslint package from ${entry}`);
  }
  const packageRoot = entry.slice(0, index + marker.length);
  const manifest = JSON.parse(readFileSync(join(packageRoot, 'package.json'), 'utf8'));
  const bin = typeof manifest.bin === 'string' ? manifest.bin : manifest.bin.eslint;
  return join(packageRoot, bin);
}

const result = spawnSync(process.execPath, [resolveEslintBin(), '.', '--max-warnings', '0'], {
  cwd: root,
  stdio: 'inherit',
});

if (result.error) {
  console.error(`lint: could not run eslint — ${result.error.message}`);
  process.exit(1);
}

process.exit(result.status ?? 1);
