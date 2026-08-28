import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  PALETTE_TOKENS,
  ROOT,
  TOKENS_CSS,
  TYPE_SCALE,
  declaredTokens,
  declaredValue,
  tokenSource,
  withoutComments,
} from './tokens';

/** PRD §9.2 — the six values, spelled exactly as the PRD writes them. */
const PALETTE: ReadonlyArray<readonly [string, string]> = [
  ['--kopitiam-green', '#0E6B4F'],
  ['--tile-teal', '#2A9D8F'],
  ['--kaya-yellow', '#F4B93E'],
  ['--chilli-red', '#D62828'],
  ['--condensed-cream', '#FFF3D6'],
  ['--teak', '#4A2C18'],
];

/** PRD §9.3 — the @fontsource subsets, and nothing beyond them. */
const FONT_IMPORTS = [
  '@fontsource/anton/latin-400.css',
  '@fontsource/nunito-sans/latin-400.css',
  '@fontsource/nunito-sans/latin-700.css',
] as const;

const css = tokenSource();
const source = withoutComments(css);

describe('the PRD §9.2 palette', () => {
  it.each(PALETTE)('declares %s as %s', (token, value) => {
    const declared = declaredValue(css, token);
    expect(declared, `src/styles/tokens.css declares no ${token}`).not.toBeNull();
    expect(declared!.toLowerCase()).toBe(value.toLowerCase());
  });

  it('declares exactly six colour tokens — no seventh', () => {
    const colours = declaredTokens(css).filter((token) => {
      const value = declaredValue(css, token);
      return value !== null && /^#[0-9a-f]{3,8}$/i.test(value);
    });
    expect([...colours].sort()).toEqual([...PALETTE_TOKENS].sort());
  });

  it('writes each colour exactly once', () => {
    for (const [, value] of PALETTE) {
      const hits = source.match(new RegExp(value, 'gi')) ?? [];
      expect(hits.length, `${value} appears ${hits.length} times in tokens.css`).toBe(1);
    }
  });
});

describe('the PRD §9.3 type scale', () => {
  it.each(TYPE_SCALE)('declares %s as %ipx', (token, px) => {
    const declared = declaredValue(css, token);
    expect(declared, `src/styles/tokens.css declares no ${token}`).not.toBeNull();
    expect(declared).toBe(`${px}px`);
  });

  it('declares exactly the seven steps', () => {
    const steps = declaredTokens(css).filter((token) => token.startsWith('--step-'));
    expect([...steps].sort()).toEqual(TYPE_SCALE.map(([token]) => token).sort());
  });

  it('names each step after its own pixel value', () => {
    for (const [token, px] of TYPE_SCALE) {
      expect(token).toBe(`--step-${px}`);
    }
  });
});

describe('the PRD §9.3 fonts', () => {
  it.each(FONT_IMPORTS)('subset-imports %s', (specifier) => {
    expect(source).toMatch(new RegExp(`@import\\s+['"]${specifier.replace(/\//g, '\\/')}['"]`));
  });

  it('imports no face beyond those three subsets', () => {
    const imports = [...source.matchAll(/@import\s+['"]([^'"]+)['"]/g)].map((match) => match[1]);
    expect([...imports].sort()).toEqual([...FONT_IMPORTS].sort());
  });

  it('pulls Nunito Sans at 400 and 700 only, and no italic', () => {
    const nunito = FONT_IMPORTS.filter((specifier) => specifier.includes('nunito-sans'));
    expect(nunito).toHaveLength(2);
    expect(nunito.some((specifier) => specifier.includes('italic'))).toBe(false);
  });

  it('declares the exact §9.3 fallback stacks', () => {
    expect(declaredValue(css, '--font-display')).toBe(
      "'Anton', 'Arial Narrow', system-ui, sans-serif",
    );
    expect(declaredValue(css, '--font-body')).toBe(
      "'Nunito Sans', system-ui, -apple-system, sans-serif",
    );
  });

  it('ships every imported face with font-display: swap', () => {
    for (const specifier of FONT_IMPORTS) {
      const face = readFileSync(join(ROOT, 'node_modules', specifier), 'utf8');
      expect(face, `${specifier} does not declare font-display: swap`).toMatch(
        /font-display:\s*swap/,
      );
      expect(face, `${specifier} references a font file over the network`).not.toMatch(
        /url\(\s*['"]?https?:/i,
      );
    }
  });
});

describe('tokens.css as the single source of the palette', () => {
  /**
   * `git grep` rather than a manual walk: it sees exactly the tracked tree,
   * so an untracked scratch file cannot red the gate and a committed one
   * cannot hide from it.
   */
  function grepSrc(pattern: string): string[] {
    const result = spawnSync(
      'git',
      ['grep', '-IniE', '--', pattern, '--', 'src/', ':(exclude)src/styles/tokens.css'],
      { cwd: ROOT, encoding: 'utf8' },
    );
    // 1 means "no matches", which is the passing case; anything above is a fault.
    expect(result.status === 0 || result.status === 1, `git grep failed: ${result.stderr}`).toBe(
      true,
    );
    return result.stdout.split('\n').filter((line) => line.length > 0);
  }

  it('is the only file under src/ carrying a §9.2 hex literal', () => {
    const pattern = PALETTE.map(([, value]) => value).join('|');
    expect(
      grepSrc(pattern),
      'PRD §9.2 declares the palette once; reach it through var(--token)',
    ).toEqual([]);
  });

  it('holds the only copy of the §9.3 font-family names', () => {
    expect(
      grepSrc('\'Anton\'|"Anton"|\'Nunito Sans\'|"Nunito Sans"'),
      'the font stacks live in --font-display and --font-body',
    ).toEqual([]);
  });

  it('greps a tree the assertion can actually see', () => {
    // Guards against the two assertions above passing because `git grep` found
    // nothing at all — an empty or unreadable `src/` would look identical.
    expect(grepSrc('#[0-9a-f]{6}|var\\(--').length).toBeGreaterThan(0);
    expect(relative(ROOT, TOKENS_CSS)).toBe(join('src', 'styles', 'tokens.css'));
  });
});
