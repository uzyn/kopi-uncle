/**
 * The six slot unions, enumerated once for the contract suite.
 *
 * `satisfies` ties each list to its union in `types.ts`, so dropping or
 * misspelling a value is a typecheck failure rather than a silently smaller
 * sweep. The declaration order is §7.5's, which is the order §7.6's stable
 * 240 depends on.
 */

import type { Drink } from '../../src/game/types';
import { isValidDrink } from '../../src/game/view';

export const SLOT_VALUES = {
  base: ['kopi', 'teh'],
  milk: ['condensed', 'evaporated', 'none'],
  sugar: ['normal', 'siew-dai', 'ga-dai', 'kosong'],
  strength: ['normal', 'gao', 'po'],
  temperature: ['hot', 'peng'],
  vessel: ['cup', 'bag'],
} as const satisfies { [K in keyof Drink]: readonly Drink[K][] };

export const SLOT_KEYS = ['base', 'milk', 'sugar', 'strength', 'temperature', 'vessel'] as const;

/** All 2 × 3 × 4 × 3 × 2 × 2 = 288 raw combinations, in §7.5's slot order. */
export function allRawDrinks(): Drink[] {
  const drinks: Drink[] = [];
  for (const base of SLOT_VALUES.base) {
    for (const milk of SLOT_VALUES.milk) {
      for (const sugar of SLOT_VALUES.sugar) {
        for (const strength of SLOT_VALUES.strength) {
          for (const temperature of SLOT_VALUES.temperature) {
            for (const vessel of SLOT_VALUES.vessel) {
              drinks.push({ base, milk, sugar, strength, temperature, vessel });
            }
          }
        }
      }
    }
  }
  return drinks;
}

/** The raw sweep filtered by §7.3 — the canonical 240, in the same stable order. */
export function allValidRawDrinks(): Drink[] {
  return allRawDrinks().filter(isValidDrink);
}
