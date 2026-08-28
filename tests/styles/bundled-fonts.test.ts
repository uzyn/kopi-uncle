import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, readdirSync, rmSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, relative } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { PALETTE_TOKENS, ROOT, TYPE_SCALE } from './tokens';

/** PRD §3 constraint 3 — no font may be fetched from a CDN at runtime. */
const CDN_HOSTS = ['fonts.googleapis.com', 'fonts.gstatic.com'] as const;

/** PRD §9.3 — the three subsets, so a missing face fails by name. */
const EXPECTED_FONT_FILES = 3;

function filesUnder(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    return entry.isDirectory() ? filesUnder(path) : [path];
  });
}

/**
 * Built into a private directory rather than the repository's `dist/`.
 * `tests/scaffold/build.test.ts` spawns its own builds into `dist/`, Vitest runs
 * test files in parallel, and `vite build` empties its outDir before writing —
 * so sharing `dist/` lets either suite wipe the tree the other is mid-scan over.
 */
let outDir = '';
let built: string[] = [];

describe('the built bundle', () => {
  beforeAll(() => {
    outDir = mkdtempSync(join(tmpdir(), 'kopi-uncle-fonts-'));
    const result = spawnSync('npm', ['run', 'build', '--', '--outDir', outDir, '--emptyOutDir'], {
      cwd: ROOT,
      encoding: 'utf8',
    });
    expect(result.status, `npm run build failed:\n${result.stdout}\n${result.stderr}`).toBe(0);
    built = filesUnder(outDir);
    expect(built.length, 'the build emitted nothing').toBeGreaterThan(0);
  }, 180_000);

  afterAll(() => {
    if (outDir !== '') {
      rmSync(outDir, { recursive: true, force: true });
    }
  });

  it.each(CDN_HOSTS)('never references %s', (host) => {
    // latin1 so the woff payloads are scanned as bytes rather than being
    // mangled — and silently made unsearchable — by UTF-8 replacement.
    const offenders = built.filter((path) => readFileSync(path, 'latin1').includes(host));
    expect(
      offenders.map((path) => relative(outDir, path)),
      'PRD §3 constraint 3 — fonts are bundled, never fetched',
    ).toEqual([]);
  });

  it('emits both faces as font files under assets/', () => {
    const fonts = built
      .filter((path) => /\.(woff2?|ttf|otf|eot)$/i.test(path))
      .map((path) => relative(outDir, path));

    expect(
      fonts.length,
      'no font file reached the build — tokens.css is not in the graph',
    ).toBeGreaterThan(0);
    expect(
      fonts.every((path) => path.startsWith(`assets${'/'}`) || path.startsWith(`assets\\`)),
      `every font belongs under assets/, got: ${fonts.join(', ')}`,
    ).toBe(true);
    expect(
      fonts.some((path) => /anton/i.test(path)),
      'Anton was not bundled',
    ).toBe(true);
    expect(
      fonts.some((path) => /nunito/i.test(path)),
      'Nunito Sans was not bundled',
    ).toBe(true);
  });

  it('emits every font as a real file rather than an inlined data URI', () => {
    const woff = built.filter((path) => /\.woff2?$/i.test(path));

    // Asserted first: an all-inlined build emits no .woff at all, and a loop
    // over an empty list would pass green for exactly the failure named above.
    expect(
      new Set(woff.map((path) => path.replace(/\.woff2?$/i, ''))).size,
      `expected the ${EXPECTED_FONT_FILES} §9.3 subsets as files, got: ${woff
        .map((path) => relative(outDir, path))
        .join(', ')}`,
    ).toBeGreaterThanOrEqual(EXPECTED_FONT_FILES);

    for (const path of woff) {
      expect(statSync(path).size, `${relative(outDir, path)} is empty`).toBeGreaterThan(0);
    }

    const css = built
      .filter((path) => path.endsWith('.css'))
      .map((path) => readFileSync(path, 'utf8'))
      .join('\n');
    expect(css, 'a face was inlined into the stylesheet as a data URI').not.toMatch(
      /url\(\s*["']?data:(?:font|application)\//i,
    );
  });

  it('carries the palette and the type scale into the emitted stylesheet', () => {
    const css = built
      .filter((path) => path.endsWith('.css'))
      .map((path) => readFileSync(path, 'utf8'))
      .join('\n');
    expect(css.length, 'the build emitted no stylesheet').toBeGreaterThan(0);

    for (const token of PALETTE_TOKENS) {
      expect(css, `${token} did not reach the bundle`).toContain(`${token}:`);
    }
    for (const [token] of TYPE_SCALE) {
      expect(css, `${token} did not reach the bundle`).toContain(`${token}:`);
    }
    expect(css, 'the bundled @font-face rules lost font-display: swap').toMatch(
      /font-display:\s*swap/,
    );
  });
});

/**
 * The tokens reach the bundle by exactly one edge: `TitleScreen.module.css`
 * `@import`s them, and `App.tsx` imports that screen eagerly. Until a sprint
 * owns `src/main.tsx` and can load the sheet globally, that edge is load-bearing
 * — a lazy route or a code-split entry would silently drop the palette and both
 * faces from every other screen, and only a whole-app build would notice.
 * This asserts the edge itself, so its removal fails by name.
 */
describe('the route by which the tokens reach the bundle', () => {
  it('is TitleScreen.module.css @import-ing tokens.css', () => {
    const css = readFileSync(join(ROOT, 'src/app/TitleScreen.module.css'), 'utf8');
    expect(
      css,
      'src/app/TitleScreen.module.css is the only edge pulling src/styles/tokens.css into ' +
        'the graph; move the @import to the entry module before dropping it here',
    ).toMatch(/@import\s+["'][^"']*styles\/tokens\.css["']/);
  });
});
