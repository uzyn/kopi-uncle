/**
 * Every tuning number in PRD §8, in one frozen file (§10.4).
 *
 * Nothing in §8 may be written as a literal anywhere else in the codebase,
 * test fixtures included — `tests/contract/config-single-source.test.ts`
 * enforces that.
 *
 * M0 freezes this file's shape and keys, not its values. A value change is
 * never a seam break and never requires re-verifying either track: the
 * difficulty curve is tuned by a human play session (§13.1), so tuning must
 * stay a one-file change.
 */

import type { ShiftId, Tier } from './types';

/**
 * One row of §8.5's shift table.
 *
 * The table is deliberately not flat — tea splits tier mid-shift and supper
 * decays patience per customer — but the *formulas* that read these fields live
 * in the three selectors below and nowhere else (§10.4).
 */
export interface ShiftConfig {
  readonly id: ShiftId;
  /** N in §8.5's `gap(i)` interpolation. */
  readonly customers: number;
  /** Tier for customers before `lateTierFromCustomer`. */
  readonly tier: Tier;
  /** Tier from `lateTierFromCustomer` onward — equal to `tier` when no split. */
  readonly lateTier: Tier;
  /** 1-based customer index at which `lateTier` takes over; 1 when no split. */
  readonly lateTierFromCustomer: number;
  /** Patience for customer 1 of the shift. */
  readonly patienceMs: number;
  /** Per-customer patience step-down; 0 for every shift but supper. */
  readonly patienceDecayPerCustomerMs: number;
  /** Floor the decay stops at; equal to `patienceMs` when there is no decay. */
  readonly patienceFloorMs: number;
  readonly gapStartMs: number;
  readonly gapEndMs: number;
}

const SHIFTS: readonly ShiftConfig[] = Object.freeze([
  Object.freeze({
    id: 'breakfast',
    customers: 6,
    tier: 1,
    lateTier: 1,
    lateTierFromCustomer: 1,
    patienceMs: 18000,
    patienceDecayPerCustomerMs: 0,
    patienceFloorMs: 18000,
    gapStartMs: 6000,
    gapEndMs: 4000,
  } as const),
  Object.freeze({
    id: 'lunch',
    customers: 8,
    tier: 2,
    lateTier: 2,
    lateTierFromCustomer: 1,
    patienceMs: 16000,
    patienceDecayPerCustomerMs: 0,
    patienceFloorMs: 16000,
    gapStartMs: 5000,
    gapEndMs: 3000,
  } as const),
  Object.freeze({
    id: 'tea',
    customers: 10,
    tier: 2,
    lateTier: 3,
    lateTierFromCustomer: 6,
    patienceMs: 14000,
    patienceDecayPerCustomerMs: 0,
    patienceFloorMs: 14000,
    gapStartMs: 4000,
    gapEndMs: 2500,
  } as const),
  Object.freeze({
    id: 'supper',
    customers: 10,
    tier: 3,
    lateTier: 3,
    lateTierFromCustomer: 1,
    patienceMs: 12000,
    patienceDecayPerCustomerMs: 200,
    patienceFloorMs: 10000,
    gapStartMs: 3000,
    gapEndMs: 2000,
  } as const),
]);

export const CONFIG = Object.freeze({
  /** §8.7 — the spiral guard. */
  QUEUE_CAP: 3,
  /** §8.3 — game over at zero. */
  HEARTS: 3,
  /** R7 — a wrong serve can never push patience below this. */
  PATIENCE_FLOOR_MS: 2000,
  /** R7 — fraction of *maximum* patience a wrong serve costs. */
  WRONG_SERVE_PENALTY_FRACTION: 0.35,
  /** R5 — input lockout after a wrong serve. */
  LOCKOUT_MS: 600,
  /** §8.8 — combo is integer tenths; +1 tenth per consecutive correct serve. */
  COMBO_STEP_TENTHS: 1,
  COMBO_MIN_TENTHS: 10,
  COMBO_MAX_TENTHS: 30,
  /** §8.8 — points are `round(BASE_POINTS * comboTenths / 10)`. */
  BASE_POINTS: 100,
  /** R15 — awarded on entering the break with zero walkouts that shift. */
  SHIFT_CLEAR_BONUS: 500,
  /** R20 — the engine's quantisation step. */
  TICK_MS: 16,
  /** R20 — the React layer's per-frame clamp. */
  MAX_FRAME_MS: 250,
  /** §8.5 — the four shifts, in order. Endless pins `shiftIndex` at the last. */
  SHIFTS,
});

function clamp(value: number, min: number, max: number): number {
  return value < min ? min : value > max ? max : value;
}

/**
 * The shift row for a `shiftIndex`, with Endless's pin at the last shift
 * (§8.5 — supper repeats indefinitely).
 */
function shiftFor(shiftIndex: number): ShiftConfig {
  return CONFIG.SHIFTS[clamp(shiftIndex, 0, CONFIG.SHIFTS.length - 1)];
}

/** §8.5 — tea is the only shift whose tier changes mid-shift. */
export function tierFor(shiftIndex: number, customerIndex: number): Tier {
  const shift = shiftFor(shiftIndex);
  return customerIndex >= shift.lateTierFromCustomer ? shift.lateTier : shift.tier;
}

/**
 * §8.5 — `gap(i) = start + (end − start) × (i − 1) / (N − 1)`, in integer
 * milliseconds (R20). Past the shift's customer count the gap holds at its
 * floor, which is Endless's repeating supper.
 */
export function gapMsFor(shiftIndex: number, customerIndex: number): number {
  const shift = shiftFor(shiftIndex);
  const i = clamp(customerIndex, 1, shift.customers);
  const span = shift.gapEndMs - shift.gapStartMs;
  return Math.round(shift.gapStartMs + (span * (i - 1)) / (shift.customers - 1));
}

/**
 * §8.5 — constant within a shift, except supper, which steps down per customer
 * to its floor. The floor is what Endless holds patience at.
 */
export function patienceMsFor(shiftIndex: number, customerIndex: number): number {
  const shift = shiftFor(shiftIndex);
  const i = Math.max(customerIndex, 1);
  const decayed = shift.patienceMs - shift.patienceDecayPerCustomerMs * (i - 1);
  return Math.max(decayed, shift.patienceFloorMs);
}
