/**
 * The frozen display barrel (PRD §10.5, part 2).
 *
 * Every export is a pure function of a `Drink` or of two numbers. This module
 * imports nothing from `engine.ts`, React or the DOM, and Sprint 7's boundary
 * lint is written against exactly this shape.
 *
 * M1a *extends* `grammar.ts` and re-exports through here; it never rewrites
 * what this file froze.
 */

import type { Drink, Mood } from './types';

/** §9.5's wireframe row labels, one per slot. */
export const SLOT_ROW_LABELS: Record<keyof Drink, string> = {
  base: 'BASE',
  milk: 'MILK',
  sugar: 'SUGAR',
  strength: 'BREW',
  temperature: 'TEMP',
  vessel: 'TAKE',
};

/**
 * Every slot value's display label — §7.1's spoken form where one exists, and
 * a plain word for the defaults, which have none because they are unstated.
 */
export const SLOT_VALUE_LABELS: { [K in keyof Drink]: Record<Drink[K], string> } = {
  base: { kopi: 'Kopi', teh: 'Teh' },
  milk: { condensed: 'condensed', evaporated: 'C', none: 'O' },
  sugar: { normal: 'normal', 'siew-dai': 'siew dai', 'ga-dai': 'ga dai', kosong: 'kosong' },
  strength: { normal: 'normal', gao: 'gao', po: 'po' },
  temperature: { hot: 'hot', peng: 'peng' },
  vessel: { cup: 'cup', bag: 'da bao' },
};

/**
 * §7.1's defaults for the five modifier slots. Base has no default — it is
 * always stated — and never counts toward §8.6's tier budget.
 */
const MODIFIER_DEFAULTS = {
  milk: 'condensed',
  sugar: 'normal',
  strength: 'normal',
  temperature: 'hot',
  vessel: 'cup',
} as const satisfies Omit<Drink, 'base'>;

/** §7.2's canonical order, minus the always-first base. */
const MODIFIER_SLOTS = ['milk', 'sugar', 'strength', 'temperature', 'vessel'] as const;

type ModifierSlot = (typeof MODIFIER_SLOTS)[number];

function isDefault<K extends ModifierSlot>(drink: Drink, slot: K): boolean {
  return drink[slot] === MODIFIER_DEFAULTS[slot];
}

function labelOf<K extends keyof Drink>(slot: K, value: Drink[K]): string {
  return SLOT_VALUE_LABELS[slot][value];
}

/**
 * §7.2 — `Base → Milk → Sugar → Strength → Temperature → Vessel`, with every
 * default omitted.
 */
export function formatOrder(drink: Drink): string {
  const parts: string[] = [labelOf('base', drink.base)];
  for (const slot of MODIFIER_SLOTS) {
    if (!isDefault(drink, slot)) {
      parts.push(labelOf(slot, drink[slot]));
    }
  }
  return parts.join(' ');
}

/**
 * §7.3 — the one validity rule: condensed milk is already sweetened, so it
 * cannot combine with `siew-dai` or `kosong`. `ga-dai` is valid with any milk.
 */
export function isValidDrink(drink: Drink): boolean {
  if (drink.milk !== 'condensed') {
    return true;
  }
  return drink.sugar !== 'siew-dai' && drink.sugar !== 'kosong';
}

/** §8.6 — how many modifier slots differ from their default. 0..5, base excluded. */
export function nonDefaultCount(drink: Drink): number {
  let count = 0;
  for (const slot of MODIFIER_SLOTS) {
    if (!isDefault(drink, slot)) {
      count += 1;
    }
  }
  return count;
}

/** §9.6 — half-open bands; both boundary values belong to the lower band. */
const CALM_ABOVE = 0.6;
const IMPATIENT_ABOVE = 0.3;

/**
 * §9.6 — the *only* place the patience ratio is computed. Neither track may
 * re-derive it.
 *
 * A non-positive `maxPatienceMs` returns `'angry'` rather than propagating a
 * `NaN` or an `Infinity` into the face and ring: the least-calm state is the
 * safe read of "no patience budget at all", and it keeps the function total.
 */
export function moodFor(patienceMs: number, maxPatienceMs: number): Mood {
  if (maxPatienceMs <= 0) {
    return 'angry';
  }
  const p = patienceMs / maxPatienceMs;
  if (p > CALM_ABOVE) {
    return 'calm';
  }
  if (p > IMPATIENT_ABOVE) {
    return 'impatient';
  }
  return 'angry';
}
