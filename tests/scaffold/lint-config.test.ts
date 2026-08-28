import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import prettierConfig from 'eslint-config-prettier';
import { describe, expect, it } from 'vitest';

const ROOT = fileURLToPath(new URL('../..', import.meta.url));
const CONFIG_PATH = join(ROOT, 'eslint.config.js');
const ESLINT_BIN = join(ROOT, 'node_modules', '.bin', 'eslint');

interface FlatConfig {
  files?: string[];
  rules?: Record<string, unknown>;
  languageOptions?: { parserOptions?: Record<string, unknown> };
}

/**
 * Imported through a computed URL rather than a static specifier: the config is
 * plain ESM JavaScript outside `tsconfig.json`'s `include`, so a literal import
 * would be a typecheck error against a file that is deliberately untyped.
 */
async function loadFlatConfig(): Promise<FlatConfig[]> {
  const module = (await import(pathToFileURL(CONFIG_PATH).href)) as { default: FlatConfig[] };
  return module.default;
}

interface PrintedConfig {
  rules: Record<string, [number, ...unknown[]]>;
  languageOptions?: { parserOptions?: Record<string, unknown> };
}

function printConfigFor(target: string): PrintedConfig {
  const result = spawnSync(ESLINT_BIN, ['--print-config', target], {
    cwd: ROOT,
    encoding: 'utf8',
  });
  expect(result.status, `eslint --print-config ${target} failed:\n${result.stderr}`).toBe(0);
  return JSON.parse(result.stdout) as PrintedConfig;
}

/** ESLint prints severity numerically: 0 off, 1 warn, 2 error. */
function severityOf(printed: PrintedConfig, rule: string): number | undefined {
  return printed.rules[rule]?.[0];
}

function npmRun(script: string) {
  return spawnSync('npm', ['run', '--silent', script], {
    cwd: ROOT,
    encoding: 'utf8',
    env: { ...process.env, FORCE_COLOR: '0' },
  });
}

/** A lint run is a whole ESLint process over the tree with a TS program behind it. */
const LINT_RUN_TIMEOUT_MS = 120_000;

/**
 * Drop a source file into the tree, run the real gate over it, and take it away
 * again. This is the only way to prove the gate *fails*: `scripts/lint.mjs` lints
 * the repo root, so a fixture parked outside the tree would never be reached, and
 * a fixture parked inside a directory this config ignores would prove nothing.
 *
 * `tests/scaffold/` is deliberate — it is neither `src/` nor a directory the
 * config names, so a probe caught here also shows the run covers the whole tree.
 */
function lintWithProbe(contents: string): ReturnType<typeof npmRun> {
  const probe = join(ROOT, 'tests', 'scaffold', `lint-probe.${process.pid}.ts`);
  writeFileSync(probe, contents);
  try {
    return npmRun('lint');
  } finally {
    rmSync(probe, { force: true });
  }
}

describe('eslint.config.js', () => {
  it('exists at the repo root and exports a flat-config array', async () => {
    expect(existsSync(CONFIG_PATH), 'eslint.config.js must live at the repo root').toBe(true);
    const config = await loadFlatConfig();
    expect(Array.isArray(config)).toBe(true);
    expect(config.length).toBeGreaterThan(0);
  });

  it('pins ESLint to the 9.x major in the lockfile', () => {
    const lock = JSON.parse(readFileSync(join(ROOT, 'package-lock.json'), 'utf8')) as {
      packages: Record<string, { version?: string } | undefined>;
    };
    const installed = lock.packages['node_modules/eslint']?.version;
    expect(installed, 'eslint is not in package-lock.json').toBeTruthy();
    expect(installed?.split('.')[0], `expected ESLint 9.x, found ${installed}`).toBe('9');
  });

  it('ends with eslint-config-prettier, so nothing re-enables a stylistic rule after it', async () => {
    const config = await loadFlatConfig();
    const last = config[config.length - 1];
    expect(last.rules, 'the last flat-config entry must be eslint-config-prettier').toStrictEqual(
      prettierConfig.rules,
    );
    expect(last.files, 'eslint-config-prettier must apply to every file').toBeUndefined();
  });

  it('does not install eslint-plugin-prettier', () => {
    const result = spawnSync('npm', ['ls', 'eslint-plugin-prettier'], {
      cwd: ROOT,
      encoding: 'utf8',
    });
    expect(
      result.status,
      "eslint-plugin-prettier must stay absent — formatting is Prettier's job, not lint's",
    ).not.toBe(0);
  });
});

describe('type-aware linting', () => {
  // Called inside each test, never in the describe body: an `expect` at
  // collection time surfaces as a whole-file collection error instead of a
  // named failure, and buries the `--print-config` stderr it captures.
  it('gives typescript-eslint a type-aware parser option', () => {
    const printed = printConfigFor('src/game/types.ts');
    const parserOptions = printed.languageOptions?.parserOptions ?? {};
    const typeAware =
      parserOptions.projectService !== undefined || parserOptions.project !== undefined;
    expect(
      typeAware,
      `expected projectService or project in ${JSON.stringify(parserOptions)}`,
    ).toBe(true);
  });

  it('enables a rule that cannot exist without type information', () => {
    expect(
      severityOf(printConfigFor('src/game/types.ts'), '@typescript-eslint/no-floating-promises'),
    ).toBe(2);
  });
});

describe('react-hooks rules', () => {
  // `Slot.tsx` does not exist yet — `--print-config` resolves a path against the
  // config without reading it, so this asserts the glob covers `src/components/**`
  // for the components Sprint 3 onwards will put there.
  for (const target of ['src/app/App.tsx', 'src/components/slots/Slot.tsx']) {
    it(`applies rules-of-hooks and exhaustive-deps at error for ${target}`, () => {
      const printed = printConfigFor(target);
      expect(severityOf(printed, 'react-hooks/rules-of-hooks')).toBe(2);
      expect(severityOf(printed, 'react-hooks/exhaustive-deps')).toBe(2);
    });
  }
});

describe('the lint gate', () => {
  it(
    'exits 0 on the current tree',
    () => {
      const result = npmRun('lint');
      expect(result.status, `${result.stdout}\n${result.stderr}`).toBe(0);
    },
    LINT_RUN_TIMEOUT_MS,
  );

  it(
    'exits non-zero on a violation anywhere in the tree',
    () => {
      const result = lintWithProbe('const unusedByDesign = 1;\n');
      expect(
        result.status,
        `the gate reported success over a file with a lint error:\n${result.stdout}\n${result.stderr}`,
      ).not.toBe(0);
    },
    LINT_RUN_TIMEOUT_MS,
  );

  it(
    'spends its warning budget at zero — a warning fails the gate too',
    () => {
      // An inline severity, so this holds whatever the rule set is: nothing in
      // the config is configured to `warn`, which is exactly why the only honest
      // way to test `--max-warnings 0` is to produce a warning and nothing else.
      const result = lintWithProbe(
        '/* eslint no-console: "warn" */\nexport const probe = () => console.log("probe");\n',
      );
      expect(
        result.status,
        `a warning did not fail the gate, so --max-warnings 0 is not in force:\n${result.stdout}\n${result.stderr}`,
      ).not.toBe(0);
    },
    LINT_RUN_TIMEOUT_MS,
  );

  it(
    'leaves the formatter green — the linter never fights Prettier',
    () => {
      const result = npmRun('format:check');
      expect(result.status, `${result.stdout}\n${result.stderr}`).toBe(0);
    },
    LINT_RUN_TIMEOUT_MS,
  );
});
