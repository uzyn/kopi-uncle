import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, expectTypeOf, it } from 'vitest';

import type {
  Action,
  Base,
  Drink,
  GameEvent,
  GameState,
  Milk,
  Mode,
  Mood,
  Phase,
  ServeResult,
  SetSlot,
  ShiftId,
  Strength,
  Sugar,
  Temperature,
  Tier,
  Vessel,
} from '../../src/game/types';
import { setSlot } from '../../src/game/types';
import { SLOT_KEYS, SLOT_VALUES, allValidRawDrinks } from './slot-values';

/**
 * `expectTypeOf` assertions are compile-time. `npm run typecheck` runs `tsc
 * --noEmit` over `tests/` as well as `src/`, so a broken one is a gate failure
 * even before Sprint 8 turns on Vitest's own typechecker.
 */

describe('§10.3 — the closed unions', () => {
  it('declares every union with exactly the §10.3 members', () => {
    expectTypeOf<Phase>().toEqualTypeOf<'title' | 'playing' | 'paused' | 'break' | 'gameover'>();
    expectTypeOf<Mode>().toEqualTypeOf<'endless' | 'daily'>();
    expectTypeOf<Tier>().toEqualTypeOf<1 | 2 | 3>();
    expectTypeOf<ShiftId>().toEqualTypeOf<'breakfast' | 'lunch' | 'tea' | 'supper'>();
    expectTypeOf<Mood>().toEqualTypeOf<'calm' | 'impatient' | 'angry'>();
    expectTypeOf<ServeResult>().toEqualTypeOf<'clean' | 'fumbled' | 'walkout'>();
  });

  it('declares the six §7.1 slot unions', () => {
    expectTypeOf<Base>().toEqualTypeOf<'kopi' | 'teh'>();
    expectTypeOf<Milk>().toEqualTypeOf<'condensed' | 'evaporated' | 'none'>();
    expectTypeOf<Sugar>().toEqualTypeOf<'normal' | 'siew-dai' | 'ga-dai' | 'kosong'>();
    expectTypeOf<Strength>().toEqualTypeOf<'normal' | 'gao' | 'po'>();
    expectTypeOf<Temperature>().toEqualTypeOf<'hot' | 'peng'>();
    expectTypeOf<Vessel>().toEqualTypeOf<'cup' | 'bag'>();
  });

  it('gives GameEvent exactly seven variants', () => {
    expectTypeOf<GameEvent['type']>().toEqualTypeOf<
      'arrived' | 'served' | 'fumbled' | 'walkout' | 'heartLost' | 'shiftCleared' | 'gameOver'
    >();
    expectTypeOf<Extract<GameEvent, { type: 'served' }>>().toEqualTypeOf<{
      type: 'served';
      customerId: number;
      points: number;
    }>();
    expectTypeOf<Extract<GameEvent, { type: 'shiftCleared' }>>().toEqualTypeOf<{
      type: 'shiftCleared';
      shiftIndex: number;
      bonus: number;
    }>();
    expectTypeOf<Extract<GameEvent, { type: 'heartLost' }>>().toEqualTypeOf<{
      type: 'heartLost';
      remaining: number;
    }>();
  });
});

describe('§10.3 — GameState', () => {
  it('declares every field §10.3 names, and no others', () => {
    expectTypeOf<keyof GameState>().toEqualTypeOf<
      | 'phase'
      | 'mode'
      | 'queue'
      | 'activeId'
      | 'builder'
      | 'hearts'
      | 'comboTenths'
      | 'bestComboTenths'
      | 'score'
      | 'shiftIndex'
      | 'spawnedInShift'
      | 'servedInShift'
      | 'walkoutsInShift'
      | 'servesAttempted'
      | 'servesCorrect'
      | 'lockoutMs'
      | 'nextArrivalMs'
      | 'nextCustomerId'
      | 'rngState'
      | 'tickRemainderMs'
      | 'shiftResults'
      | 'frameEvents'
    >();
  });

  it('types the compound fields per §10.3', () => {
    expectTypeOf<GameState['activeId']>().toEqualTypeOf<number | null>();
    expectTypeOf<GameState['builder']>().toEqualTypeOf<Drink>();
    expectTypeOf<GameState['shiftResults']>().toEqualTypeOf<ServeResult[][]>();
    expectTypeOf<GameState['frameEvents']>().toEqualTypeOf<GameEvent[]>();
    expectTypeOf<GameState['queue'][number]['fumbled']>().toEqualTypeOf<boolean>();
    expectTypeOf<GameState['queue'][number]['order']>().toEqualTypeOf<Drink>();
  });
});

describe('§10.3 — SetSlot', () => {
  it('expands to exactly one variant per Drink slot', () => {
    expectTypeOf<SetSlot['slot']>().toEqualTypeOf<keyof Drink>();
    expectTypeOf<Extract<SetSlot, { slot: 'base' }>['value']>().toEqualTypeOf<Base>();
    expectTypeOf<Extract<SetSlot, { slot: 'milk' }>['value']>().toEqualTypeOf<Milk>();
    expectTypeOf<Extract<SetSlot, { slot: 'sugar' }>['value']>().toEqualTypeOf<Sugar>();
    expectTypeOf<Extract<SetSlot, { slot: 'strength' }>['value']>().toEqualTypeOf<Strength>();
    expectTypeOf<Extract<SetSlot, { slot: 'temperature' }>['value']>().toEqualTypeOf<Temperature>();
    expectTypeOf<Extract<SetSlot, { slot: 'vessel' }>['value']>().toEqualTypeOf<Vessel>();
  });

  it('has no variant for a slot that is not on Drink', () => {
    expectTypeOf<Extract<SetSlot, { slot: 'flavour' }>>().toEqualTypeOf<never>();
  });

  it('does not cross-pair a slot with values from another slot', () => {
    expectTypeOf<Extract<SetSlot, { slot: 'sugar' }>['value']>().not.toEqualTypeOf<Temperature>();
    expectTypeOf<Extract<SetSlot, { slot: 'temperature' }>['value']>().not.toEqualTypeOf<Sugar>();
  });
});

describe('§10.3 — Action', () => {
  it('is exactly seven action types', () => {
    expectTypeOf<Action['type']>().toEqualTypeOf<
      'START_RUN' | 'FOCUS' | 'SET_SLOT' | 'SERVE' | 'DISMISS_BREAK' | 'PAUSE' | 'RESUME'
    >();
  });

  it('proves exhaustiveness at compile time, with no runtime statement', () => {
    // §10.7 bans an unreachable `default: throw`. The proof therefore lives in
    // a module that is typechecked but never executed.
    const source = readFileSync(
      fileURLToPath(new URL('./action-exhaustive.ts', import.meta.url)),
      'utf8',
    );
    expect(source).toContain('satisfies never');
    expect(source).not.toMatch(/^\s*throw\b/m);
  });

  it('carries the payloads §10.3 names', () => {
    expectTypeOf<Extract<Action, { type: 'START_RUN' }>>().toEqualTypeOf<{
      type: 'START_RUN';
      mode: Mode;
      seed: number;
    }>();
    expectTypeOf<Extract<Action, { type: 'FOCUS' }>>().toEqualTypeOf<{
      type: 'FOCUS';
      customerId: number;
    }>();
  });
});

describe('§10.3 — setSlot', () => {
  const VALID = allValidRawDrinks();

  it('holds exactly one cast, in this one place', () => {
    const source = readFileSync(
      fileURLToPath(new URL('../../src/game/types.ts', import.meta.url)),
      'utf8',
    );
    const casts = source.match(/\bas\s+[A-Z]/g) ?? [];
    expect(casts).toHaveLength(1);
  });

  it('is typed so a slot only accepts its own values', () => {
    expectTypeOf(setSlot).toBeFunction();
    expectTypeOf(setSlot<'sugar'>)
      .parameter(2)
      .toEqualTypeOf<Sugar>();
    expectTypeOf(setSlot<'vessel'>)
      .parameter(2)
      .toEqualTypeOf<Vessel>();
    expectTypeOf(setSlot).returns.toEqualTypeOf<Drink>();
  });

  it('returns a new object with only the named slot changed, over 240 × 6', () => {
    expect(VALID).toHaveLength(240);

    for (const drink of VALID) {
      for (const slot of SLOT_KEYS) {
        for (const value of SLOT_VALUES[slot]) {
          const before = { ...drink };
          const next = setSlot(drink, slot, value);

          expect(next).not.toBe(drink);
          expect(next[slot]).toBe(value);

          for (const other of SLOT_KEYS) {
            if (other !== slot) {
              expect(next[other]).toBe(drink[other]);
            }
          }

          expect(drink).toEqual(before);
        }
      }
    }
  });
});
