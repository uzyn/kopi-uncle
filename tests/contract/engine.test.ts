import { describe, expect, expectTypeOf, it } from 'vitest';

import { CONFIG, patienceMsFor } from '../../src/game/config';
import * as engine from '../../src/game/engine';
import { applyAction, createInitialState, tick } from '../../src/game/engine';
import type { Action, GameState, Mode } from '../../src/game/types';

/** A structurally valid state, so the stubs throw for the right reason. */
const STATE: GameState = {
  phase: 'playing',
  mode: 'endless',
  queue: [],
  activeId: null,
  builder: {
    base: 'kopi',
    milk: 'condensed',
    sugar: 'normal',
    strength: 'normal',
    temperature: 'hot',
    vessel: 'cup',
  },
  hearts: CONFIG.HEARTS,
  comboTenths: CONFIG.COMBO_MIN_TENTHS,
  bestComboTenths: CONFIG.COMBO_MIN_TENTHS,
  score: 0,
  shiftIndex: 0,
  spawnedInShift: 0,
  servedInShift: 0,
  walkoutsInShift: 0,
  servesAttempted: 0,
  servesCorrect: 0,
  lockoutMs: 0,
  nextArrivalMs: 0,
  nextCustomerId: 1,
  rngState: 1,
  tickRemainderMs: 0,
  shiftResults: [[]],
  frameEvents: [],
};

const ACTIONS: readonly Action[] = [
  { type: 'START_RUN', mode: 'daily', seed: 1 },
  { type: 'FOCUS', customerId: 1 },
  { type: 'SET_SLOT', slot: 'sugar', value: 'kosong' },
  { type: 'SERVE' },
  { type: 'DISMISS_BREAK' },
  { type: 'PAUSE' },
  { type: 'RESUME' },
];

describe('§10.5 — the three engine signatures', () => {
  it('exports exactly the three names the seam names', () => {
    expect(Object.keys(engine).sort()).toEqual(
      ['applyAction', 'createInitialState', 'tick'].sort(),
    );
  });

  it('types them per §10.3', () => {
    expectTypeOf(createInitialState).toEqualTypeOf<(mode: Mode, seed: number) => GameState>();
    expectTypeOf(tick).toEqualTypeOf<(state: GameState, dtMs: number) => GameState>();
    expectTypeOf(applyAction).toEqualTypeOf<(state: GameState, action: Action) => GameState>();
  });
});

describe('the M0 stub refuses to be mistaken for an engine', () => {
  it('throws NotImplemented from createInitialState', () => {
    expect(() => createInitialState('endless', 1)).toThrow(/NotImplemented/);
    expect(() => createInitialState('daily', patienceMsFor(0, 1))).toThrow(/NotImplemented/);
  });

  it('throws NotImplemented from tick', () => {
    expect(() => tick(STATE, CONFIG.TICK_MS)).toThrow(/NotImplemented/);
    expect(() => tick(STATE, 0)).toThrow(/NotImplemented/);
  });

  it('throws NotImplemented from applyAction, for every one of the seven actions', () => {
    for (const action of ACTIONS) {
      expect(() => applyAction(STATE, action)).toThrow(/NotImplemented/);
    }
  });

  it('names the M1a story that will implement each body', () => {
    const messages = [
      captureMessage(() => createInitialState('endless', 1)),
      captureMessage(() => tick(STATE, CONFIG.TICK_MS)),
      captureMessage(() => applyAction(STATE, { type: 'SERVE' })),
    ];
    for (const message of messages) {
      expect(message).toMatch(/\bS\d+-\d+\b/);
    }
  });
});

function captureMessage(run: () => unknown): string {
  try {
    run();
  } catch (error) {
    return error instanceof Error ? error.message : String(error);
  }
  throw new Error('expected the stub to throw');
}
