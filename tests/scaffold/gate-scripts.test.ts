import { spawnSync } from 'node:child_process';
import { copyFileSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const ROOT = fileURLToPath(new URL('../..', import.meta.url));

interface PackageJson {
  scripts: Record<string, string>;
}

const pkg: PackageJson = JSON.parse(
  readFileSync(join(ROOT, 'package.json'), 'utf8'),
) as PackageJson;

const GATE_STAGES = ['typecheck', 'lint', 'test', 'build', 'e2e'] as const;

/** The file paths a shell command hands to an interpreter. */
function scriptFilesIn(command: string): string[] {
  return command.split(/\s+/).filter((token) => /\.(mjs|cjs|js|ts)$/.test(token));
}

function runNode(script: string, root: string = ROOT, env: NodeJS.ProcessEnv = process.env) {
  return spawnSync(process.execPath, [join(root, 'scripts', script)], {
    cwd: root,
    env,
    encoding: 'utf8',
  });
}

/**
 * A throwaway checkout with the placeholder copied into its own `scripts/`.
 * The scripts take no root override — each inspects its own parent directory
 * and nothing else — so copying is the only way to trip the refusal without
 * writing a real `eslint.config.js` or `*.spec.ts` into the working tree, where
 * a crashed test would leave the gate red.
 */
function withTempRoot(script: string, build: (root: string) => void): string {
  const root = mkdtempSync(join(tmpdir(), 'kopi-scaffold-'));
  mkdirSync(join(root, 'scripts'), { recursive: true });
  copyFileSync(join(ROOT, 'scripts', script), join(root, 'scripts', script));
  build(root);
  return root;
}

/*
 * These properties must hold for the life of the project. Neither gate command
 * names its tool directly, and the two commands share no file, so the sprint
 * that wires a real tool edits a file it owns instead of the shared manifest —
 * which is what lets Sprints 2 and 6 run concurrently (PRD §11.3).
 */
describe('the gate stages', () => {
  it('declares all five PRD §10.7 stages as npm scripts', () => {
    for (const stage of GATE_STAGES) {
      expect(pkg.scripts[stage], `package.json is missing the "${stage}" script`).toBeTruthy();
    }
  });

  it('runs lint and e2e through their own files, sharing none', () => {
    const lintFiles = scriptFilesIn(pkg.scripts.lint);
    const e2eFiles = scriptFilesIn(pkg.scripts.e2e);

    expect(lintFiles.length, `"lint" must delegate to a script file: ${pkg.scripts.lint}`).toBe(1);
    expect(e2eFiles.length, `"e2e" must delegate to a script file: ${pkg.scripts.e2e}`).toBe(1);
    expect(
      lintFiles.filter((file) => e2eFiles.includes(file)),
      'the lint and e2e gate commands must share no file, so the sprints wiring ' +
        'each tool never collide',
    ).toEqual([]);
  });

  it('never names eslint or playwright in the manifest', () => {
    for (const stage of ['lint', 'e2e'] as const) {
      expect(
        pkg.scripts[stage],
        `"${stage}" must stay an indirection through its own script file, so the sprint ` +
          'wiring the real tool edits that file rather than package.json',
      ).not.toMatch(/eslint|playwright/i);
    }
  });

  it('never runs the test stage in watch mode', () => {
    expect(pkg.scripts.test).toMatch(/\brun\b/);
  });
});

/*
 * Everything below asserts placeholder *behaviour*, so it retires the moment
 * the marker leaves the script — S2-1 and S6-1 replacing these files must not
 * red a test in tests/scaffold/ that neither sprint owns.
 */
const MARKER = 'KOPI_SCAFFOLD_PLACEHOLDER';

function isPlaceholder(script: string): boolean {
  return readFileSync(join(ROOT, 'scripts', script), 'utf8').includes(MARKER);
}

describe.skipIf(!isPlaceholder('lint.mjs'))('the lint placeholder', () => {
  it('passes and names the sprint that replaces it', () => {
    const result = runNode('lint.mjs');
    expect(result.status).toBe(0);
    expect(result.stdout).toContain('S2-1');
  });

  it('refuses to pass once an eslint config exists', () => {
    const root = withTempRoot('lint.mjs', (dir) => {
      writeFileSync(join(dir, 'eslint.config.js'), 'export default [];\n');
    });
    try {
      const result = runNode('lint.mjs', root);
      expect(result.status).toBe(1);
      expect(result.stderr).toContain('eslint.config.js');
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('cannot be pointed away from its own directory to buy a green gate', () => {
    const root = withTempRoot('lint.mjs', (dir) => {
      writeFileSync(join(dir, 'eslint.config.js'), 'export default [];\n');
    });
    const elsewhere = mkdtempSync(join(tmpdir(), 'kopi-elsewhere-'));
    try {
      // The refusal is the one guarantee this file exists to provide. An
      // environment pointing it at a config-free directory must not lift it.
      const result = runNode('lint.mjs', root, { ...process.env, KOPI_SCAFFOLD_ROOT: elsewhere });
      expect(result.status, `${result.stdout}\n${result.stderr}`).toBe(1);
    } finally {
      rmSync(root, { recursive: true, force: true });
      rmSync(elsewhere, { recursive: true, force: true });
    }
  });
});

describe.skipIf(!isPlaceholder('e2e.mjs'))('the e2e placeholder', () => {
  it('passes and names the sprint that replaces it', () => {
    const result = runNode('e2e.mjs');
    expect(result.status).toBe(0);
    expect(result.stdout).toContain('S6-1');
  });

  it('refuses to pass once tests/e2e holds a spec, at any depth', () => {
    const root = withTempRoot('e2e.mjs', (dir) => {
      mkdirSync(join(dir, 'tests', 'e2e', 'nested'), { recursive: true });
      writeFileSync(join(dir, 'tests', 'e2e', 'nested', 'deep.spec.ts'), '');
    });
    try {
      const result = runNode('e2e.mjs', root);
      expect(result.status).toBe(1);
      expect(result.stderr).toContain('deep.spec.ts');
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('cannot be pointed away from its own directory to buy a green gate', () => {
    const root = withTempRoot('e2e.mjs', (dir) => {
      mkdirSync(join(dir, 'tests', 'e2e'), { recursive: true });
      writeFileSync(join(dir, 'tests', 'e2e', 'walkout.spec.ts'), '');
    });
    const elsewhere = mkdtempSync(join(tmpdir(), 'kopi-elsewhere-'));
    try {
      const result = runNode('e2e.mjs', root, { ...process.env, KOPI_SCAFFOLD_ROOT: elsewhere });
      expect(result.status, `${result.stdout}\n${result.stderr}`).toBe(1);
    } finally {
      rmSync(root, { recursive: true, force: true });
      rmSync(elsewhere, { recursive: true, force: true });
    }
  });
});
