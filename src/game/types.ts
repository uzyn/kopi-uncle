/**
 * The frozen contract's type surface (PRD §10.3, §10.5).
 *
 * Both tracks compile against this file. Nothing here may be widened, renamed
 * or reordered without a seam break — §10.5 makes it one of the three parts of
 * the track seam, alongside `view.ts` and the three `engine.ts` signatures.
 *
 * This module is excluded from the §10.7 coverage threshold: it is types plus
 * the one helper §10.3 ships with them.
 */

export type Phase = 'title' | 'playing' | 'paused' | 'break' | 'gameover';
export type Mode = 'endless' | 'daily';
export type Tier = 1 | 2 | 3;
export type ShiftId = 'breakfast' | 'lunch' | 'tea' | 'supper';
export type Mood = 'calm' | 'impatient' | 'angry';
export type ServeResult = 'clean' | 'fumbled' | 'walkout';

export type GameEvent =
  | { type: 'arrived'; customerId: number }
  | { type: 'served'; customerId: number; points: number }
  | { type: 'fumbled'; customerId: number }
  | { type: 'walkout'; customerId: number }
  | { type: 'heartLost'; remaining: number }
  | { type: 'shiftCleared'; shiftIndex: number; bonus: number }
  | { type: 'gameOver' };

export type Base = 'kopi' | 'teh';
export type Milk = 'condensed' | 'evaporated' | 'none';
export type Sugar = 'normal' | 'siew-dai' | 'ga-dai' | 'kosong';
export type Strength = 'normal' | 'gao' | 'po';
export type Temperature = 'hot' | 'peng';
export type Vessel = 'cup' | 'bag';

export interface Drink {
  base: Base;
  milk: Milk;
  sugar: Sugar;
  strength: Strength;
  temperature: Temperature;
  vessel: Vessel;
}

export interface Customer {
  id: number;
  order: Drink;
  maxPatienceMs: number;
  patienceMs: number;
  /** Drives the 🟨 share state (§8.9). */
  fumbled: boolean;
}

export interface GameState {
  phase: Phase;
  mode: Mode;
  /** Length 0..3, always ascending by id — R22. */
  queue: Customer[];
  activeId: number | null;
  /** Persists across serves — §8.2. */
  builder: Drink;
  hearts: number;
  /** Integer 10..30 — §8.8. */
  comboTenths: number;
  bestComboTenths: number;
  score: number;
  /** 0..3, then pinned at 3 in Endless. */
  shiftIndex: number;
  spawnedInShift: number;
  servedInShift: number;
  walkoutsInShift: number;
  /** For §8.10's accuracy. */
  servesAttempted: number;
  servesCorrect: number;
  /** Set to `CONFIG.LOCKOUT_MS` by a wrong serve — R5. */
  lockoutMs: number;
  nextArrivalMs: number;
  nextCustomerId: number;
  /** mulberry32 state — keeps `tick` pure. */
  rngState: number;
  /** Sub-step carry — R20. */
  tickRemainderMs: number;
  /** One inner array per shift — §8.9. */
  shiftResults: ServeResult[][];
  /** OVERWRITTEN every call, never appended — R21. */
  frameEvents: GameEvent[];
}

export type SetSlot = {
  [K in keyof Drink]: { type: 'SET_SLOT'; slot: K; value: Drink[K] };
}[keyof Drink];

export type Action =
  | { type: 'START_RUN'; mode: Mode; seed: number }
  | { type: 'FOCUS'; customerId: number }
  | SetSlot
  | { type: 'SERVE' }
  | { type: 'DISMISS_BREAK' }
  | { type: 'PAUSE' }
  | { type: 'RESUME' };

/**
 * The single place §10.3's unavoidable cast is allowed to live.
 *
 * Destructuring `{ slot, value }` out of `SetSlot` widens them to `keyof Drink`
 * and a union of all six value types, so `draft[slot] = value` cannot typecheck
 * under `strict`. Callers go through this generic instead, which re-ties the
 * slot to its own value union at the call site.
 */
export function setSlot<K extends keyof Drink>(d: Drink, slot: K, value: Drink[K]): Drink {
  return { ...d, [slot]: value } as Drink;
}
