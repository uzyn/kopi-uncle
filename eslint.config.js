import js from '@eslint/js';
import prettierConfig from 'eslint-config-prettier';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';
import tseslint from 'typescript-eslint';

/**
 * ESLint 9 flat config (S2-1).
 *
 * Type-aware by construction: `projectService` hands typescript-eslint the real
 * program, which is what lets Sprint 7 (S7-1, S7-2) express PRD §10.5's track
 * seam and §3's no-wall-clock rule as rules the linter can actually decide.
 *
 * Formatting is Prettier's job. `eslint-config-prettier` is the last entry so
 * nothing after it re-enables a stylistic rule, and `eslint-plugin-prettier` is
 * deliberately not installed — routing a reformat through lint turns every
 * whitespace drift into a gate failure with a stack trace attached.
 */

// `.mts`/`.cts` are listed although the tree has none: typescript-eslint's own
// `eslint-recommended` claims them, and re-scoping it below would otherwise
// hand such a file to espree, turning a lint run into a parse error.
const TS_FILES = ['**/*.ts', '**/*.tsx', '**/*.mts', '**/*.cts'];
const JS_FILES = ['**/*.js', '**/*.mjs', '**/*.cjs'];

/** Scope a borrowed config array to a file glob without mutating the source. */
function scopedTo(files, configs) {
  return configs.map((config) => ({ ...config, files }));
}

export default [
  {
    ignores: ['dist/**', 'coverage/**', 'playwright-report/**', 'test-results/**'],
  },

  js.configs.recommended,

  ...scopedTo(TS_FILES, tseslint.configs.recommendedTypeChecked),

  {
    files: TS_FILES,
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },

  // Browser globals stop at the render tree. `src/game/**` is importable in
  // Node with no DOM, which PRD §10.5 makes a rule Sprint 7 enforces; leaving
  // `window` and friends out of its scope keeps this config from quietly
  // contradicting that boundary in the meantime.
  {
    files: ['src/**/*.{ts,tsx}'],
    ignores: ['src/game/**'],
    languageOptions: { globals: globals.browser },
  },

  // Config files and gate scripts are plain ESM run by Node, outside tsconfig's
  // `include`. `no-undef` is live here — typescript-eslint's `eslint-recommended`
  // turns it off for TS — so this is the one place the global set decides
  // whether a typo is caught, hence Node's names alone and no browser ones.
  {
    files: JS_FILES,
    languageOptions: { globals: globals.node },
  },

  {
    files: ['*.config.ts', 'tests/**/*.{ts,tsx}'],
    languageOptions: { globals: { ...globals.node, ...globals.browser } },
  },

  // React lives only under these two trees (PRD §10.2); `src/game/**` must
  // never see a hook.
  //
  // The two rules are named individually rather than pulled in through the
  // plugin's `recommended` set. v7's set is much wider than the hook rules and
  // includes compiler-adjacent opinions such as `static-components`, which
  // already rejects the screen registry's dispatch on a `Phase` — enabling a
  // rule that no sprint chartered would put the gate at the mercy of a plugin
  // minor across every screen still to be written.
  {
    files: ['src/components/**/*.{ts,tsx}', 'src/app/**/*.{ts,tsx}'],
    plugins: { 'react-hooks': reactHooks },
    rules: {
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'error',
    },
  },

  prettierConfig,
];
