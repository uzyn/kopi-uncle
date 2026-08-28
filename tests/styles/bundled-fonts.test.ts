import { spawnSync } from 'node:child_process';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { beforeAll, describe, expect, it } from 'vitest';
import { PALETTE_TOKENS, ROOT, TYPE_SCALE } from './tokens';

const DIST = join(ROOT, 'dist');

/** PRD §3 constraint 3 — no font may be fetched from a CDN at runtime. */
const CDN_HOSTS = ['fonts.googleapis.com', 'fonts.gstatic.com'] as const;

function filesUnder(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    return entry.isDirectory() ? filesUnder(path) : [path];
  });
}

let built: string[] = [];

describe('the built bundle', () => {
  beforeAll(() => {
    const result = spawnSync('npm', ['run', 'build'], { cwd: ROOT, encoding: 'utf8' });
    expect(result.status, `npm run build failed:\n${result.stdout}\n${result.stderr}`).toBe(0);
    built = filesUnder(DIST);
    expect(built.length, 'the build emitted nothing').toBeGreaterThan(0);
  }, 180_000);

  it.each(CDN_HOSTS)('never references %s', (host) => {
    // latin1 so the woff payloads are scanned as bytes rather than being
    // mangled — and silently made unsearchable — by UTF-8 replacement.
    const offenders = built.filter((path) => readFileSync(path, 'latin1').includes(host));
    expect(
      offenders.map((path) => relative(ROOT, path)),
      'PRD §3 constraint 3 — fonts are bundled, never fetched',
    ).toEqual([]);
  });

  it('emits both faces as font files under dist/assets', () => {
    const fonts = built
      .filter((path) => /\.(woff2?|ttf|otf|eot)$/i.test(path))
      .map((path) => relative(DIST, path));

    expect(
      fonts.length,
      'no font file reached dist/ — tokens.css is not in the graph',
    ).toBeGreaterThan(0);
    expect(
      fonts.every((path) => path.startsWith(`assets${'/'}`) || path.startsWith(`assets\\`)),
      `every font belongs under dist/assets, got: ${fonts.join(', ')}`,
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
    for (const path of built.filter((file) => /\.woff2?$/i.test(file))) {
      expect(statSync(path).size, `${relative(DIST, path)} is empty`).toBeGreaterThan(0);
    }
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
