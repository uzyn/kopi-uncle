// @vitest-environment jsdom
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import App from '../../src/app/App';

/*
 * Derived from this module's own location, like every other suite here, so the
 * paths below do not depend on the runner's cwd.
 *
 * Spelled out rather than as `new URL('../..', import.meta.url)` — the form the
 * node-environment suites use — because this file runs under jsdom, where Vite
 * applies its web asset transform and rewrites that exact literal pattern into
 * a served `http://localhost/@fs/...` URL that `fileURLToPath` then rejects.
 * `import.meta.url` itself is a file URL in both environments.
 */
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const TITLE_CSS = join(ROOT, 'src/app/TitleScreen.module.css');
const TOKENS_CSS = join(ROOT, 'src/styles/tokens.css');

afterEach(cleanup);

/** The declarations of the first rule whose selector list mentions `.className`. */
function ruleBody(css: string, className: string): string {
  const pattern = new RegExp(`(^|[,\\s{}])\\.${className}\\b[^{}]*\\{([^{}]*)\\}`, 'm');
  const match = pattern.exec(css);
  expect(match, `no rule for .${className} in TitleScreen.module.css`).not.toBeNull();
  return match![2];
}

function declaration(body: string, property: string): string {
  const match = new RegExp(`(?:^|;)\\s*${property}\\s*:\\s*([^;]+)`, 'i').exec(body);
  expect(match, `no "${property}" declaration found`).not.toBeNull();
  return match![1].trim();
}

function tokenSource(): string {
  return existsSync(TOKENS_CSS) ? readFileSync(TOKENS_CSS, 'utf8') : '';
}

/** Deep enough for any real token chain, shallow enough to catch a cycle. */
const MAX_TOKEN_HOPS = 16;

/**
 * Resolves a colour that may be written as a literal now and as a design token
 * later: S5-1 replaces these literals with var(--teak) / var(--condensed-cream)
 * once src/styles/tokens.css lands, and this assertion has to survive that.
 */
function resolveColour(value: string, tokens: string, hops = 0): string {
  expect(
    hops,
    `resolving "${value}" took more than ${MAX_TOKEN_HOPS} var() hops — ` +
      'src/styles/tokens.css declares a cycle',
  ).toBeLessThan(MAX_TOKEN_HOPS);

  const varMatch = /var\(\s*(--[A-Za-z0-9-]+)\s*(?:,\s*([^)]+))?\)/.exec(value);
  if (varMatch === null) {
    return value.trim();
  }
  const [, token, fallback] = varMatch;
  const declared = new RegExp(`${token}\\s*:\\s*([^;]+)`).exec(tokens);
  if (declared !== null) {
    return resolveColour(declared[1].trim(), tokens, hops + 1);
  }
  expect(
    fallback,
    `${token} is used by TitleScreen.module.css but declared in neither ` +
      'src/styles/tokens.css nor a var() fallback',
  ).toBeTruthy();
  return resolveColour(fallback, tokens, hops + 1);
}

function channels(hex: string): [number, number, number] {
  const match = /^#([0-9a-f]{6})$/i.exec(hex.trim());
  expect(match, `expected a six-digit hex colour, got "${hex}"`).not.toBeNull();
  const value = match![1];
  return [
    Number.parseInt(value.slice(0, 2), 16),
    Number.parseInt(value.slice(2, 4), 16),
    Number.parseInt(value.slice(4, 6), 16),
  ];
}

/** WCAG 2.x relative luminance. */
function luminance(hex: string): number {
  const [r, g, b] = channels(hex).map((channel) => {
    const srgb = channel / 255;
    return srgb <= 0.03928 ? srgb / 12.92 : ((srgb + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrastRatio(foreground: string, background: string): number {
  const a = luminance(foreground);
  const b = luminance(background);
  const [lighter, darker] = a > b ? [a, b] : [b, a];
  return (lighter + 0.05) / (darker + 0.05);
}

describe('the title screen', () => {
  it('renders the KOPI UNCLE wordmark', () => {
    render(<App />);
    expect(screen.getByRole('heading', { name: 'KOPI UNCLE' })).toBeDefined();
  });

  it('seats the wordmark inside the screen surface it takes its colours from', () => {
    render(<App />);
    const wordmark = screen.getByRole('heading', { name: 'KOPI UNCLE' });
    expect(wordmark.className).toMatch(/wordmark/);
    expect(
      wordmark.closest('[class*="screen"]'),
      'the wordmark must sit inside the .screen surface, so it inherits the ' +
        'colour pair asserted below',
    ).not.toBeNull();
  });

  it('renders teak on condensed cream, clearing WCAG AA by a wide margin', () => {
    const css = readFileSync(TITLE_CSS, 'utf8');
    const body = ruleBody(css, 'screen');
    const tokens = tokenSource();
    const foreground = resolveColour(declaration(body, 'color'), tokens);
    const background = resolveColour(declaration(body, 'background-color'), tokens);

    expect(foreground.toLowerCase()).toBe('#4a2c18');
    expect(background.toLowerCase()).toBe('#fff3d6');

    const ratio = contrastRatio(foreground, background);
    expect(ratio).toBeGreaterThanOrEqual(4.5);
    expect(ratio).toBeCloseTo(11.44, 2);
  });

  it('resolves the pair through tokens once S5-1 replaces the literals', () => {
    const tokens = ':root {\n  --teak: #4A2C18;\n  --condensed-cream: #FFF3D6;\n}';
    expect(resolveColour('var(--teak)', tokens)).toBe('#4A2C18');
    expect(resolveColour('var(--condensed-cream)', tokens)).toBe('#FFF3D6');
    expect(resolveColour('var(--teak, #4A2C18)', '')).toBe('#4A2C18');
    expect(
      contrastRatio(
        resolveColour('var(--teak)', tokens),
        resolveColour('var(--condensed-cream)', tokens),
      ),
    ).toBeCloseTo(11.44, 2);
  });

  it('says what is missing when the CSS it parses does not hold up', () => {
    // These helpers outlive this sprint — S5-1 reruns them against a token file
    // this test cannot see — so their failure messages are the diagnosis a
    // future sprint gets, and are asserted rather than assumed.
    expect(() => ruleBody('.wordmark {\n  color: #4a2c18;\n}', 'screen')).toThrow(
      /no rule for \.screen/,
    );
    expect(() => declaration('color: #4a2c18;', 'background-color')).toThrow(
      /no "background-color" declaration found/,
    );
    expect(() => resolveColour('var(--teak)', '')).toThrow(/declared in neither/);
    expect(() => resolveColour('var(--teak)', ':root { --teak: var(--teak); }')).toThrow(
      /declares a cycle/,
    );
  });

  it('computes a ratio the WCAG reference values agree with', () => {
    // Anchors, so a broken luminance implementation cannot make the assertion
    // above pass by accident.
    expect(contrastRatio('#000000', '#FFFFFF')).toBeCloseTo(21, 5);
    expect(contrastRatio('#FFFFFF', '#FFFFFF')).toBeCloseTo(1, 5);
    // PRD §9.2's rejected pair — kaya yellow on cream, 1.61:1, fails AA.
    expect(contrastRatio('#F4B93E', '#FFF3D6')).toBeLessThan(4.5);
  });
});
