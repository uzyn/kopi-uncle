// @vitest-environment jsdom
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { StartRequest, TitleRoute } from '../../src/app/TitleScreen';
import TitleScreen, { freshSeed } from '../../src/app/TitleScreen';

/*
 * S12-1 — the title screen's own suite.
 *
 * Two kinds of assertion live here. The behavioural ones drive the component
 * through the DOM the player actually gets; the source ones read
 * `TitleScreen.module.css` and `TitleScreen.tsx` as text, because a rule that
 * jsdom cannot lay out (a 44px target, a colour pair, an `infinite` animation)
 * is still a rule the sprint has to hold.
 */
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const TITLE_CSS = readFileSync(join(ROOT, 'src/app/TitleScreen.module.css'), 'utf8');
const TITLE_TSX = readFileSync(join(ROOT, 'src/app/TitleScreen.tsx'), 'utf8');
const TOKENS_CSS = readFileSync(join(ROOT, 'src/styles/tokens.css'), 'utf8');

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

/** Resolves `var(--token)` chains through `tokens.css` down to a literal. */
function resolveToken(value: string, hops = 0): string {
  expect(hops, `resolving "${value}" exceeded 16 var() hops`).toBeLessThan(16);
  const varMatch = /var\(\s*(--[A-Za-z0-9-]+)\s*(?:,\s*([^)]+))?\)/.exec(value);
  if (varMatch === null) {
    return value.trim();
  }
  const [, token, fallback] = varMatch;
  const declared = new RegExp(`${token}\\s*:\\s*([^;]+)`).exec(TOKENS_CSS);
  if (declared !== null) {
    return resolveToken(declared[1].trim(), hops + 1);
  }
  expect(fallback, `${token} is declared in neither tokens.css nor a var() fallback`).toBeTruthy();
  return resolveToken(fallback, hops + 1);
}

function luminance(hex: string): number {
  const match = /^#([0-9a-f]{6})$/i.exec(hex.trim());
  expect(match, `expected a six-digit hex colour, got "${hex}"`).not.toBeNull();
  const value = match![1];
  const channels = [0, 2, 4].map((offset) => Number.parseInt(value.slice(offset, offset + 2), 16));
  const [r, g, b] = channels.map((channel) => {
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

/** Every `<number>px` in a declaration, as numbers. */
function pixels(value: string): number[] {
  return [...value.matchAll(/(-?\d+(?:\.\d+)?)px/g)].map((match) => Number(match[1]));
}

const CONTROL_NAMES = ['Play', 'Daily Challenge', 'How to Play', 'Stats'];

describe('the title screen', () => {
  it('renders the wordmark and exactly the four documented controls', () => {
    render(<TitleScreen />);
    expect(screen.getByRole('heading', { level: 1, name: 'KOPI UNCLE' })).toBeDefined();
    const buttons = screen.getAllByRole('button');
    expect(buttons.map((button) => button.textContent)).toEqual(CONTROL_NAMES);
  });

  it('keeps the wordmark inside the screen surface it takes its colours from', () => {
    render(<TitleScreen />);
    const wordmark = screen.getByRole('heading', { level: 1, name: 'KOPI UNCLE' });
    expect(wordmark.className).toMatch(/wordmark/);
    expect(wordmark.closest('[class*="screen"]')).not.toBeNull();
  });

  it('starts an endless run with a fresh seed, different on each press', async () => {
    const user = userEvent.setup();
    const onStart = vi.fn<(request: StartRequest) => void>();
    render(<TitleScreen onStart={onStart} />);

    const play = screen.getByRole('button', { name: 'Play' });
    await user.click(play);
    await user.click(play);

    expect(onStart).toHaveBeenCalledTimes(2);
    const [first, second] = onStart.mock.calls.map(([request]) => request as unknown);
    for (const request of [first, second]) {
      expect(request).toMatchObject({ mode: 'endless' });
      const { seed } = request as { seed: number };
      expect(Number.isInteger(seed)).toBe(true);
      expect(seed).toBeGreaterThanOrEqual(0);
      expect(seed).toBeLessThanOrEqual(0xffffffff);
    }
    expect((first as { seed: number }).seed).not.toBe((second as { seed: number }).seed);
  });

  it('takes the seed from the injected generator when one is supplied', async () => {
    const user = userEvent.setup();
    const onStart = vi.fn<(request: StartRequest) => void>();
    const makeSeed = vi.fn<() => number>().mockReturnValueOnce(7).mockReturnValueOnce(11);
    render(<TitleScreen onStart={onStart} makeSeed={makeSeed} />);

    const play = screen.getByRole('button', { name: 'Play' });
    await user.click(play);
    await user.click(play);

    expect(onStart.mock.calls.map(([request]) => request)).toEqual([
      { mode: 'endless', seed: 7 },
      { mode: 'endless', seed: 11 },
    ]);
  });

  it('starts the Daily with no seed of its own — the date decides it', async () => {
    const user = userEvent.setup();
    const onStart = vi.fn<(request: StartRequest) => void>();
    const makeSeed = vi.fn<() => number>().mockReturnValue(7);
    render(<TitleScreen onStart={onStart} makeSeed={makeSeed} />);

    await user.click(screen.getByRole('button', { name: 'Daily Challenge' }));

    expect(onStart).toHaveBeenCalledTimes(1);
    expect(onStart.mock.calls[0][0]).toEqual({ mode: 'daily', seed: null });
    expect(
      makeSeed,
      'a Daily that draws a random seed would not be the same run for everyone',
    ).not.toHaveBeenCalled();
  });

  it('navigates to How to Play and Stats', async () => {
    const user = userEvent.setup();
    const onNavigate = vi.fn<(route: TitleRoute) => void>();
    render(<TitleScreen onNavigate={onNavigate} />);

    await user.click(screen.getByRole('button', { name: 'How to Play' }));
    await user.click(screen.getByRole('button', { name: 'Stats' }));

    expect(onNavigate.mock.calls.map(([route]) => route)).toEqual(['howToPlay', 'stats']);
  });

  it('never throws when the wiring layer has passed no handlers', async () => {
    const user = userEvent.setup();
    render(<TitleScreen />);
    for (const name of CONTROL_NAMES) {
      await user.click(screen.getByRole('button', { name }));
    }
    expect(screen.getAllByRole('button')).toHaveLength(4);
  });

  it('reaches every control by Tab in visual order and activates it with Enter', async () => {
    const user = userEvent.setup();
    const onStart = vi.fn<(request: StartRequest) => void>();
    const onNavigate = vi.fn<(route: TitleRoute) => void>();
    render(<TitleScreen onStart={onStart} onNavigate={onNavigate} />);

    const reached: (string | null)[] = [];
    for (let index = 0; index < CONTROL_NAMES.length; index += 1) {
      await user.tab();
      reached.push(document.activeElement?.textContent ?? null);
      await user.keyboard('{Enter}');
    }

    expect(reached).toEqual(CONTROL_NAMES);
    expect(onStart.mock.calls.map(([request]) => (request as { mode: string }).mode)).toEqual([
      'endless',
      'daily',
    ]);
    expect(onNavigate.mock.calls.map(([route]) => route)).toEqual(['howToPlay', 'stats']);
  });

  it('exposes no positive tabindex, so DOM order is tab order', () => {
    render(<TitleScreen />);
    for (const button of screen.getAllByRole('button')) {
      expect(button.getAttribute('tabindex')).toBeNull();
    }
  });
});

describe('freshSeed', () => {
  it('returns a uint32 and does not repeat across a long draw', () => {
    const seeds = new Set<number>();
    for (let draw = 0; draw < 500; draw += 1) {
      const seed = freshSeed();
      expect(Number.isInteger(seed)).toBe(true);
      expect(seed).toBeGreaterThanOrEqual(0);
      expect(seed).toBeLessThanOrEqual(0xffffffff);
      seeds.add(seed);
    }
    expect(
      seeds.size,
      'a seed source this degenerate would make every run identical',
    ).toBeGreaterThan(450);
  });

  it('still yields a uint32 when the platform has no crypto', () => {
    const original = globalThis.crypto;
    // A jsdom without `crypto` is the stand-in for an insecure-context browser.
    Reflect.deleteProperty(globalThis, 'crypto');
    try {
      const seed = freshSeed();
      expect(Number.isInteger(seed)).toBe(true);
      expect(seed).toBeGreaterThanOrEqual(0);
      expect(seed).toBeLessThanOrEqual(0xffffffff);
    } finally {
      Object.defineProperty(globalThis, 'crypto', { value: original, configurable: true });
    }
  });
});

describe('the title screen never animates', () => {
  it('declares no infinite animation and no keyframes', () => {
    expect(TITLE_CSS).not.toMatch(/\binfinite\b/);
    expect(TITLE_CSS).not.toMatch(/@keyframes/);
  });

  it('runs no timer and no frame loop of its own', () => {
    expect(TITLE_TSX).not.toMatch(/setInterval/);
    expect(TITLE_TSX).not.toMatch(/setTimeout/);
    expect(TITLE_TSX).not.toMatch(/requestAnimationFrame/);
  });
});

describe('the title screen palette', () => {
  it('paints the wordmark teak on condensed cream at the display step', () => {
    const screenBody = ruleBody(TITLE_CSS, 'screen');
    expect(resolveToken(declaration(screenBody, 'color')).toLowerCase()).toBe('#4a2c18');
    expect(resolveToken(declaration(screenBody, 'background-color')).toLowerCase()).toBe('#fff3d6');

    const wordmarkBody = ruleBody(TITLE_CSS, 'wordmark');
    expect(declaration(wordmarkBody, 'font-family')).toBe('var(--font-display)');
    expect(resolveToken(declaration(wordmarkBody, 'font-family'))).toMatch(/^'Anton'/);
    expect(declaration(wordmarkBody, 'font-size')).toBe('var(--step-64)');
    expect(resolveToken(declaration(wordmarkBody, 'font-size'))).toBe('64px');
    expect(resolveToken(declaration(wordmarkBody, 'color')).toLowerCase()).toBe('#4a2c18');
  });

  it('renders control labels white on kopitiam green — §9.2, 6.49:1', () => {
    const body = ruleBody(TITLE_CSS, 'control');
    const foreground = resolveToken(declaration(body, 'color'));
    const background = resolveToken(declaration(body, 'background-color'));
    expect(foreground.toLowerCase()).toBe('#ffffff');
    expect(background.toLowerCase()).toBe('#0e6b4f');
    expect(contrastRatio(foreground, background)).toBeCloseTo(6.49, 1);
  });

  it('pairs kaya yellow with cream nowhere — that pair is 1.61:1 and forbidden', () => {
    expect(contrastRatio('#F4B93E', '#FFF3D6')).toBeLessThan(4.5);
    const rules = [...TITLE_CSS.matchAll(/\{([^{}]*)\}/g)].map((match) => match[1]);
    for (const rule of rules) {
      const colour = /(?:^|;)\s*color\s*:\s*([^;]+)/i.exec(rule);
      const background = /(?:^|;)\s*background-color\s*:\s*([^;]+)/i.exec(rule);
      if (colour === null || background === null) {
        continue;
      }
      const pair = [resolveToken(colour[1]), resolveToken(background[1])];
      expect(pair.map((value) => value.toLowerCase())).not.toEqual(['#f4b93e', '#fff3d6']);
      expect(contrastRatio(pair[0], pair[1])).toBeGreaterThanOrEqual(4.5);
    }
  });

  it('writes no §9.2 hex literal of its own — every colour comes from a token', () => {
    expect(TITLE_CSS.replace(/#fff\b|#ffffff\b/gi, '')).not.toMatch(/#[0-9a-f]{3,8}\b/i);
  });
});

describe('the title screen touch targets and layout', () => {
  it('sizes every control at 44px or more in both axes', () => {
    const body = ruleBody(TITLE_CSS, 'control');
    for (const property of ['min-height', 'min-width']) {
      const declared = pixels(declaration(body, property));
      expect(declared.length, `${property} must be declared in px so this can decide it`).toBe(1);
      expect(declared[0]).toBeGreaterThanOrEqual(44);
    }
  });

  it('never lets its own content force a horizontal scrollbar at 360px', () => {
    const screenBody = ruleBody(TITLE_CSS, 'screen');
    const controlBody = ruleBody(TITLE_CSS, 'control');
    expect(declaration(screenBody, 'box-sizing')).toBe('border-box');
    expect(declaration(controlBody, 'box-sizing')).toBe('border-box');
    expect(declaration(controlBody, 'max-width')).toBe('100%');
    // A control column wider than the narrowest supported viewport is the one
    // way this screen can overflow, so the declared width is bounded here.
    const menuBody = ruleBody(TITLE_CSS, 'menu');
    expect(pixels(declaration(menuBody, 'width'))).toEqual([]);
  });

  it('shows a visible focus ring of at least 2px', () => {
    const match = /:focus-visible[^{}]*\{([^{}]*)\}/.exec(TITLE_CSS);
    expect(match, 'no :focus-visible rule in TitleScreen.module.css').not.toBeNull();
    const outlineWidth = pixels(declaration(match![1], 'outline'));
    expect(outlineWidth[0]).toBeGreaterThanOrEqual(2);
  });
});
