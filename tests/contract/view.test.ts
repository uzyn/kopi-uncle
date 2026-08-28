import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

import type { Drink } from '../../src/game/types';
import * as view from '../../src/game/view';
import {
  SLOT_ROW_LABELS,
  SLOT_VALUE_LABELS,
  formatOrder,
  isValidDrink,
  moodFor,
  nonDefaultCount,
} from '../../src/game/view';
import { SLOT_KEYS, SLOT_VALUES, allRawDrinks, allValidRawDrinks } from './slot-values';

const VIEW_SOURCE = readFileSync(
  fileURLToPath(new URL('../../src/game/view.ts', import.meta.url)),
  'utf8',
);

const PLAIN_KOPI: Drink = {
  base: 'kopi',
  milk: 'condensed',
  sugar: 'normal',
  strength: 'normal',
  temperature: 'hot',
  vessel: 'cup',
};

function drink(overrides: Partial<Drink>): Drink {
  return { ...PLAIN_KOPI, ...overrides };
}

/**
 * Every specifier form TypeScript accepts: static `from`, side-effect
 * `import '…'`, dynamic `import(…)` and `require(…)`, in either quote style.
 * A double-quoted or dynamic import must not slip past the §10.5 boundary.
 */
function specifiersIn(source: string): string[] {
  const pattern = /(?:\bfrom|\bimport|\brequire)\s*\(?\s*(?:'([^']*)'|"([^"]*)")/g;
  return [...source.matchAll(pattern)].map((match) => match[1] ?? match[2]);
}

describe('§10.5 — the frozen export surface', () => {
  it('exports exactly the six names the seam names, and nothing more', () => {
    expect(Object.keys(view).sort()).toEqual(
      [
        'SLOT_ROW_LABELS',
        'SLOT_VALUE_LABELS',
        'formatOrder',
        'isValidDrink',
        'moodFor',
        'nonDefaultCount',
      ].sort(),
    );
  });

  it('imports nothing from the engine, React or the DOM', () => {
    const imports = specifiersIn(VIEW_SOURCE);
    expect(imports).toEqual(['./types']);
    expect(VIEW_SOURCE).toMatch(/import type \{[^}]*\} from '\.\/types'/);
    expect(VIEW_SOURCE).not.toMatch(/\b(document|window|globalThis)\b/);
  });

  it('the boundary scan catches double-quoted, side-effect and dynamic imports', () => {
    expect(specifiersIn(`import type { A } from "./engine";`)).toEqual(['./engine']);
    expect(specifiersIn(`import "react";`)).toEqual(['react']);
    expect(specifiersIn(`const m = await import('./engine');`)).toEqual(['./engine']);
    expect(specifiersIn(`const m = require("react-dom");`)).toEqual(['react-dom']);
  });
});

describe('§7.2 — formatOrder', () => {
  it.each([
    [PLAIN_KOPI, 'Kopi'],
    [drink({ milk: 'none' }), 'Kopi O'],
    [drink({ milk: 'evaporated', sugar: 'siew-dai' }), 'Kopi C siew dai'],
    [
      drink({ base: 'teh', milk: 'none', sugar: 'kosong', strength: 'gao', temperature: 'peng' }),
      'Teh O kosong gao peng',
    ],
    [drink({ milk: 'evaporated', temperature: 'peng', vessel: 'bag' }), 'Kopi C peng da bao'],
  ])('renders the canonical spoken order (%#)', (input, expected) => {
    expect(formatOrder(input)).toBe(expected);
  });

  it('renders the §9.3 longest tier-3 order', () => {
    expect(
      formatOrder({
        base: 'teh',
        milk: 'none',
        sugar: 'kosong',
        strength: 'gao',
        temperature: 'peng',
        vessel: 'bag',
      }),
    ).toBe('Teh O kosong gao peng da bao');
  });

  it('always leads with the base and never emits a default', () => {
    for (const d of allValidRawDrinks()) {
      const text = formatOrder(d);
      expect(text.startsWith(SLOT_VALUE_LABELS.base[d.base])).toBe(true);
      expect(text).not.toMatch(/\s{2}/);
      expect(text.trim()).toBe(text);
      expect(text.split(' ').length).toBeGreaterThanOrEqual(1);
    }
  });

  it('emits a distinct string for every one of the 240 valid drinks', () => {
    const rendered = allValidRawDrinks().map(formatOrder);
    expect(new Set(rendered).size).toBe(240);
  });

  it('never mutates its input', () => {
    const d = drink({ milk: 'none', vessel: 'bag' });
    const before = { ...d };
    formatOrder(d);
    expect(d).toEqual(before);
  });
});

describe('§7.3 — isValidDrink', () => {
  it('accepts exactly 240 of the 288 raw combinations', () => {
    const raw = allRawDrinks();
    expect(raw).toHaveLength(288);
    expect(raw.filter(isValidDrink)).toHaveLength(240);
    expect(raw.filter((d) => !isValidDrink(d))).toHaveLength(48);
  });

  it('rejects condensed milk with siew-dai or kosong, and nothing else', () => {
    for (const d of allRawDrinks()) {
      const expected = !(
        d.milk === 'condensed' &&
        (d.sugar === 'siew-dai' || d.sugar === 'kosong')
      );
      expect(isValidDrink(d)).toBe(expected);
    }
  });

  it('accepts ga-dai with condensed milk', () => {
    expect(isValidDrink(drink({ sugar: 'ga-dai' }))).toBe(true);
    expect(isValidDrink(drink({ base: 'teh', sugar: 'ga-dai' }))).toBe(true);
  });
});

describe('§7.4 — nonDefaultCount', () => {
  it('matches the published distribution exactly', () => {
    const histogram: Record<number, number> = {};
    for (const d of allValidRawDrinks()) {
      const count = nonDefaultCount(d);
      histogram[count] = (histogram[count] ?? 0) + 1;
    }
    expect(histogram).toEqual({ 0: 2, 1: 14, 2: 46, 3: 82, 4: 72, 5: 24 });
  });

  it('excludes base and stays within 0..5', () => {
    expect(nonDefaultCount(PLAIN_KOPI)).toBe(0);
    expect(nonDefaultCount(drink({ base: 'teh' }))).toBe(0);
    expect(
      nonDefaultCount({
        base: 'teh',
        milk: 'none',
        sugar: 'kosong',
        strength: 'gao',
        temperature: 'peng',
        vessel: 'bag',
      }),
    ).toBe(5);
    for (const d of allRawDrinks()) {
      expect(nonDefaultCount(d)).toBeGreaterThanOrEqual(0);
      expect(nonDefaultCount(d)).toBeLessThanOrEqual(5);
    }
  });

  it('agrees with the number of words formatOrder emits after the base', () => {
    // Only `siew dai` and `da bao` are two words, so counting words is not a
    // second implementation — it is a cross-check that no modifier is dropped.
    for (const d of allValidRawDrinks()) {
      const words = formatOrder(d).split(' ').length - 1;
      const twoWordModifiers =
        (d.sugar === 'siew-dai' || d.sugar === 'ga-dai' ? 1 : 0) + (d.vessel === 'bag' ? 1 : 0);
      expect(words - twoWordModifiers).toBe(nonDefaultCount(d));
    }
  });
});

describe('§9.6 — moodFor', () => {
  const MAX = 1000;

  it('puts both boundary values in the lower band', () => {
    expect(moodFor(0.6 * MAX, MAX)).toBe('impatient');
    expect(moodFor(0.3 * MAX, MAX)).toBe('angry');
  });

  it('is calm strictly above 0.60', () => {
    expect(moodFor(0.601 * MAX, MAX)).toBe('calm');
    expect(moodFor(MAX, MAX)).toBe('calm');
  });

  it('is impatient strictly above 0.30', () => {
    expect(moodFor(0.301 * MAX, MAX)).toBe('impatient');
  });

  it('is angry at zero patience and below', () => {
    expect(moodFor(0, MAX)).toBe('angry');
    expect(moodFor(-MAX, MAX)).toBe('angry');
  });

  it('returns angry rather than NaN when there is no patience budget', () => {
    // Ruled for v1 (§13): a non-positive maximum yields the least-calm state
    // rather than a NaN ratio leaking into the face and the ring.
    expect(moodFor(0, 0)).toBe('angry');
    expect(moodFor(MAX, 0)).toBe('angry');
    expect(moodFor(MAX, -MAX)).toBe('angry');
  });

  it('is monotonic in patience across the whole range', () => {
    const rank = { angry: 0, impatient: 1, calm: 2 } as const;
    let previous = 0;
    for (let patience = 0; patience <= MAX; patience += 1) {
      const current = rank[moodFor(patience, MAX)];
      expect(current).toBeGreaterThanOrEqual(previous);
      previous = current;
    }
    expect(previous).toBe(rank.calm);
  });
});

describe('§9.5 — the slot labels', () => {
  it('holds the six wireframe row labels', () => {
    expect(SLOT_ROW_LABELS).toEqual({
      base: 'BASE',
      milk: 'MILK',
      sugar: 'SUGAR',
      strength: 'BREW',
      temperature: 'TEMP',
      vessel: 'TAKE',
    });
  });

  it('labels all 16 slot values, non-empty and unique within their slot', () => {
    let total = 0;
    for (const slot of SLOT_KEYS) {
      const labels: Record<string, string> = SLOT_VALUE_LABELS[slot];
      const values: readonly string[] = SLOT_VALUES[slot];
      expect(Object.keys(labels).sort()).toEqual([...values].sort());
      const rendered = values.map((value) => labels[value]);
      for (const label of rendered) {
        expect(label.length).toBeGreaterThan(0);
        expect(label.trim()).toBe(label);
      }
      expect(new Set(rendered).size).toBe(values.length);
      total += values.length;
    }
    expect(total).toBe(16);
  });

  it('uses the §7.1 spoken form wherever one exists', () => {
    expect(SLOT_VALUE_LABELS.milk.evaporated).toBe('C');
    expect(SLOT_VALUE_LABELS.milk.none).toBe('O');
    expect(SLOT_VALUE_LABELS.sugar['siew-dai']).toBe('siew dai');
    expect(SLOT_VALUE_LABELS.sugar['ga-dai']).toBe('ga dai');
    expect(SLOT_VALUE_LABELS.sugar.kosong).toBe('kosong');
    expect(SLOT_VALUE_LABELS.strength.gao).toBe('gao');
    expect(SLOT_VALUE_LABELS.strength.po).toBe('po');
    expect(SLOT_VALUE_LABELS.temperature.peng).toBe('peng');
    expect(SLOT_VALUE_LABELS.vessel.bag).toBe('da bao');
    expect(SLOT_VALUE_LABELS.base.kopi).toBe('Kopi');
    expect(SLOT_VALUE_LABELS.base.teh).toBe('Teh');
  });
});
