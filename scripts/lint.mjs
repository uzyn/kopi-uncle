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
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

/**
 * ESLint's `bin/` is outside its `exports` map, so the bin path is read from the
 * manifest rather than hard-coded. `eslint/package.json` *is* exported, which
 * means the package root comes from Node's own resolver and no `node_modules`
 * layout is assumed — pnpm's virtual store, Yarn PnP and `npm link` all work.
 */
function resolveEslintBin() {
  const require = createRequire(import.meta.url);
  let manifestPath;
  try {
    manifestPath = require.resolve('eslint/package.json');
  } catch (error) {
    throw new Error(`could not resolve the eslint package — ${error.message}`);
  }
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
  const bin = typeof manifest.bin === 'string' ? manifest.bin : manifest.bin?.eslint;
  if (typeof bin !== 'string') {
    throw new Error(`eslint's manifest at ${manifestPath} declares no bin entry`);
  }
  return join(dirname(manifestPath), bin);
}

let eslintBin;
try {
  eslintBin = resolveEslintBin();
} catch (error) {
  console.error(`lint: ${error.message}`);
  process.exit(1);
}

const result = spawnSync(process.execPath, [eslintBin, '.', '--max-warnings', '0'], {
  cwd: root,
  stdio: 'inherit',
});

if (result.error) {
  console.error(`lint: could not run eslint — ${result.error.message}`);
  process.exit(1);
}

process.exit(result.status ?? 1);
