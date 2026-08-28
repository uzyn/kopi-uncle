import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = fileURLToPath(new URL('../..', import.meta.url));
export const TOKENS_CSS = join(ROOT, 'src/styles/tokens.css');

/** PRD §9.2 — the palette, as the property names `tokens.css` must declare. */
export const PALETTE_TOKENS = [
  '--kopitiam-green',
  '--tile-teal',
  '--kaya-yellow',
  '--chilli-red',
  '--condensed-cream',
  '--teak',
] as const;

export type PaletteToken = (typeof PALETTE_TOKENS)[number];

/** PRD §9.3 — the type scale, as `[token, px]`. */
export const TYPE_SCALE: ReadonlyArray<readonly [string, number]> = [
  ['--step-12', 12],
  ['--step-14', 14],
  ['--step-16', 16],
  ['--step-20', 20],
  ['--step-28', 28],
  ['--step-40', 40],
  ['--step-64', 64],
];

export function tokenSource(): string {
  return readFileSync(TOKENS_CSS, 'utf8');
}

/**
 * Strips comments before parsing so a hex written inside a `/* ... *\/` block
 * can never satisfy — or corrupt — a declaration assertion.
 */
export function withoutComments(css: string): string {
  return css.replace(/\/\*[\s\S]*?\*\//g, '');
}

/**
 * The declared value of a custom property, or `null` when it is absent.
 * Whitespace is collapsed so a stack Prettier has wrapped across lines compares
 * equal to the single-line form the PRD writes it in.
 */
export function declaredValue(css: string, token: string): string | null {
  const match = new RegExp(`(?:^|[;{])\\s*${token}\\s*:\\s*([^;}]+)`, 'm').exec(
    withoutComments(css),
  );
  return match === null ? null : match[1].trim().replace(/\s+/g, ' ');
}

/** Every custom property `tokens.css` declares, in source order. */
export function declaredTokens(css: string): string[] {
  return [...withoutComments(css).matchAll(/(?:^|[;{])\s*(--[A-Za-z0-9-]+)\s*:/gm)].map(
    (match) => match[1],
  );
}

/** The six §9.2 values, read out of `tokens.css` rather than restated here. */
export function palette(css: string = tokenSource()): Record<PaletteToken, string> {
  const entries = PALETTE_TOKENS.map((token) => {
    const value = declaredValue(css, token);
    if (value === null) {
      throw new Error(`src/styles/tokens.css declares no ${token}`);
    }
    return [token, value] as const;
  });
  return Object.fromEntries(entries) as Record<PaletteToken, string>;
}

function channels(hex: string): [number, number, number] {
  const match = /^#([0-9a-f]{6})$/i.exec(hex.trim());
  if (match === null) {
    throw new Error(`expected a six-digit hex colour, got "${hex}"`);
  }
  const value = match[1];
  return [
    Number.parseInt(value.slice(0, 2), 16),
    Number.parseInt(value.slice(2, 4), 16),
    Number.parseInt(value.slice(4, 6), 16),
  ];
}

/** WCAG 2.x relative luminance. */
export function luminance(hex: string): number {
  const [r, g, b] = channels(hex).map((channel) => {
    const srgb = channel / 255;
    return srgb <= 0.03928 ? srgb / 12.92 : ((srgb + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** WCAG 2.x contrast ratio, order-independent. */
export function contrastRatio(foreground: string, background: string): number {
  const a = luminance(foreground);
  const b = luminance(background);
  const [lighter, darker] = a > b ? [a, b] : [b, a];
  return (lighter + 0.05) / (darker + 0.05);
}
