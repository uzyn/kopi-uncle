import { describe, expect, it } from 'vitest';
import { contrastRatio, palette, type PaletteToken } from './tokens';

/**
 * PRD §9.2's approved contrast matrix. The colours are read out of
 * `src/styles/tokens.css` rather than restated here, so editing a token to a
 * value that breaks a pairing reds this suite instead of silently diverging
 * from the table it is supposed to encode.
 *
 * `#FFFFFF` is not a §9.2 token — the table names it as a literal, and it is
 * the only literal permitted here.
 */
const WHITE = '#FFFFFF';

/** WCAG 2.1 AA for body text. */
const AA_FLOOR = 4.5;

type Colour = PaletteToken | '#FFFFFF';

const APPROVED: ReadonlyArray<readonly [Colour, Colour, number, string]> = [
  ['--teak', '--condensed-cream', 11.44, 'body text, labels, order text'],
  ['--teak', '--kaya-yellow', 7.12, 'score, combo, active slot'],
  [WHITE, '--kopitiam-green', 6.49, 'primary button labels'],
  ['--condensed-cream', '--kopitiam-green', 5.89, 'header text'],
  [WHITE, '--chilli-red', 5.01, 'error text'],
  ['--chilli-red', '--condensed-cream', 4.54, 'last heart, `angry` band'],
];

/**
 * The pairings §9.2 rules out by name. Kaya-on-cream is the defect the PRD
 * corrected in v1.1, so the exclusions are asserted too — a table whose
 * forbidden rows are untested is decorative.
 */
const FORBIDDEN: ReadonlyArray<readonly [Colour, Colour, number, string]> = [
  ['--kaya-yellow', '--condensed-cream', 1.61, 'kaya yellow is a fill behind teak, never text'],
  ['--tile-teal', '--condensed-cream', 3.01, 'tile teal is decorative only'],
];

const TOKENS = palette();

function resolve(colour: Colour): string {
  return colour === WHITE ? WHITE : TOKENS[colour];
}

describe('the PRD §9.2 contrast matrix', () => {
  it.each(APPROVED)('%s on %s measures %f — %s', (foreground, background, expected) => {
    const ratio = contrastRatio(resolve(foreground), resolve(background));
    expect(ratio).toBeCloseTo(expected, 2);
    expect(Math.abs(ratio - expected)).toBeLessThanOrEqual(0.01);
  });

  it.each(APPROVED)('%s on %s clears the AA floor', (foreground, background) => {
    expect(contrastRatio(resolve(foreground), resolve(background))).toBeGreaterThanOrEqual(
      AA_FLOOR,
    );
  });

  it.each(FORBIDDEN)('%s on %s fails AA at %f — %s', (foreground, background, expected) => {
    const ratio = contrastRatio(resolve(foreground), resolve(background));
    expect(Math.abs(ratio - expected)).toBeLessThanOrEqual(0.01);
    expect(
      ratio,
      'this pairing is forbidden for text by §9.2; if it now clears AA the ' +
        'token has moved and the table must be recomputed',
    ).toBeLessThan(AA_FLOOR);
  });

  it('draws every colour it asserts from tokens.css', () => {
    const used = new Set([...APPROVED, ...FORBIDDEN].flatMap(([f, b]) => [f, b]));
    for (const colour of used) {
      if (colour === WHITE) {
        continue;
      }
      expect(TOKENS[colour], `${colour} is asserted but not declared`).toMatch(/^#[0-9a-f]{6}$/i);
    }
  });
});

describe('the ratio implementation', () => {
  it('agrees with the WCAG reference values', () => {
    expect(contrastRatio('#000000', '#FFFFFF')).toBeCloseTo(21, 5);
    expect(contrastRatio('#FFFFFF', '#FFFFFF')).toBeCloseTo(1, 5);
    expect(contrastRatio('#777777', '#FFFFFF')).toBeCloseTo(4.48, 2);
  });

  it('is order-independent', () => {
    for (const [foreground, background] of APPROVED) {
      expect(contrastRatio(resolve(foreground), resolve(background))).toBeCloseTo(
        contrastRatio(resolve(background), resolve(foreground)),
        10,
      );
    }
  });

  it('rejects anything that is not a six-digit hex colour', () => {
    expect(() => contrastRatio('#fff', '#FFFFFF')).toThrow(/six-digit hex colour/);
    expect(() => contrastRatio('rebeccapurple', '#FFFFFF')).toThrow(/six-digit hex colour/);
  });
});
