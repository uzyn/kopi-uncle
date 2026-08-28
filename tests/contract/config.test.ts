import { describe, expect, it } from 'vitest';

import { CONFIG, gapMsFor, patienceMsFor, tierFor } from '../../src/game/config';

/**
 * §10.4 forbids restating a §8 number outside `config.ts`, test fixtures
 * included, so the expectations below read their operands from `CONFIG` rather
 * than repeating the shift table. What is under test is the three *formulas*,
 * which live in the selectors and nowhere else — the arithmetic constants that
 * are properties of those formulas (a decay over nine customers, a linear
 * midpoint) are stated here because they are not §8 table values.
 */

const [BREAKFAST, LUNCH, TEA, SUPPER] = CONFIG.SHIFTS;
const ENDLESS_SHIFT_INDEX = CONFIG.SHIFTS.length - 1;

function isDeeplyFrozen(value: unknown): boolean {
  if (typeof value !== 'object' || value === null) {
    return true;
  }
  if (!Object.isFrozen(value)) {
    return false;
  }
  return Object.values(value).every(isDeeplyFrozen);
}

describe('§10.4 — the single tuning object', () => {
  it('exports every constant §8 names', () => {
    expect(CONFIG.QUEUE_CAP).toBe(3);
    expect(CONFIG.HEARTS).toBe(3);
    expect(CONFIG.PATIENCE_FLOOR_MS).toBeGreaterThan(0);
    expect(CONFIG.WRONG_SERVE_PENALTY_FRACTION).toBeGreaterThan(0);
    expect(CONFIG.WRONG_SERVE_PENALTY_FRACTION).toBeLessThan(1);
    expect(CONFIG.LOCKOUT_MS).toBe(600);
    expect(CONFIG.COMBO_STEP_TENTHS).toBe(1);
    expect(CONFIG.COMBO_MIN_TENTHS).toBe(10);
    expect(CONFIG.COMBO_MAX_TENTHS).toBe(30);
    expect(CONFIG.BASE_POINTS).toBe(100);
    expect(CONFIG.SHIFT_CLEAR_BONUS).toBe(500);
    expect(CONFIG.TICK_MS).toBe(16);
    expect(CONFIG.MAX_FRAME_MS).toBe(250);
  });

  it('holds the §8.5 four-shift table with the right customer counts and tiers', () => {
    expect(CONFIG.SHIFTS.map((s) => s.id)).toEqual(['breakfast', 'lunch', 'tea', 'supper']);
    expect(CONFIG.SHIFTS.map((s) => s.customers)).toEqual([6, 8, 10, 10]);
    expect(CONFIG.SHIFTS.map((s) => s.tier)).toEqual([1, 2, 2, 3]);
    expect(TEA.lateTier).toBe(3);
    expect(TEA.lateTierFromCustomer).toBe(6);
  });

  it('ramps within every shift and steps patience down only at supper', () => {
    for (const shift of CONFIG.SHIFTS) {
      expect(shift.gapEndMs).toBeLessThan(shift.gapStartMs);
      expect(shift.patienceMs).toBeGreaterThanOrEqual(shift.patienceFloorMs);
    }
    expect([BREAKFAST, LUNCH, TEA].map((s) => s.patienceDecayPerCustomerMs)).toEqual([0, 0, 0]);
    expect(SUPPER.patienceDecayPerCustomerMs).toBeGreaterThan(0);
    expect(SUPPER.patienceFloorMs).toBeLessThan(SUPPER.patienceMs);
  });

  it('is frozen all the way down', () => {
    expect(Object.isFrozen(CONFIG)).toBe(true);
    expect(Object.isFrozen(CONFIG.SHIFTS)).toBe(true);
    for (const shift of CONFIG.SHIFTS) {
      expect(Object.isFrozen(shift)).toBe(true);
    }
    expect(isDeeplyFrozen(CONFIG)).toBe(true);
  });
});

describe('§8.5 — tierFor', () => {
  it.each([
    ['breakfast', 0, BREAKFAST],
    ['lunch', 1, LUNCH],
    ['tea', 2, TEA],
    ['supper', 3, SUPPER],
  ] as const)('is stable at customers 1, N and N+1 of %s', (_name, index, shift) => {
    const n = shift.customers;
    const expected = index === 2 ? shift.lateTier : shift.tier;
    expect(tierFor(index, 1)).toBe(shift.tier);
    expect(tierFor(index, n)).toBe(expected);
    expect(tierFor(index, n + 1)).toBe(expected);
  });

  it('splits tea at both sides of the customer-6 boundary (R17)', () => {
    expect(tierFor(2, TEA.lateTierFromCustomer - 1)).toBe(TEA.tier);
    expect(tierFor(2, TEA.lateTierFromCustomer)).toBe(TEA.lateTier);
  });

  it('holds tier 3 for the Endless repeat of supper', () => {
    expect(tierFor(ENDLESS_SHIFT_INDEX, SUPPER.customers + 1)).toBe(3);
    expect(tierFor(ENDLESS_SHIFT_INDEX + 4, 1)).toBe(3);
  });
});

describe('§8.5 — gapMsFor', () => {
  it.each([
    ['breakfast', 0, BREAKFAST],
    ['lunch', 1, LUNCH],
    ['tea', 2, TEA],
    ['supper', 3, SUPPER],
  ] as const)('interpolates start → end across %s', (_name, index, shift) => {
    const n = shift.customers;
    expect(gapMsFor(index, 1)).toBe(shift.gapStartMs);
    expect(gapMsFor(index, n)).toBe(shift.gapEndMs);
    expect(gapMsFor(index, n + 1)).toBe(shift.gapEndMs);
  });

  it('is linear in the customer index, not merely monotonic', () => {
    // The exact midpoint of breakfast's six customers: gap(3.5) would be the
    // mean of start and end, so gap(3) and gap(4) straddle it symmetrically.
    const mean = (BREAKFAST.gapStartMs + BREAKFAST.gapEndMs) / 2;
    expect(gapMsFor(0, 3) + gapMsFor(0, 4)).toBe(mean * 2);
    const step = (BREAKFAST.gapEndMs - BREAKFAST.gapStartMs) / (BREAKFAST.customers - 1);
    for (let i = 1; i < BREAKFAST.customers; i += 1) {
      expect(gapMsFor(0, i + 1) - gapMsFor(0, i)).toBe(step);
    }
  });

  it('returns whole milliseconds everywhere (R20)', () => {
    for (let index = 0; index < CONFIG.SHIFTS.length; index += 1) {
      for (let i = 1; i <= CONFIG.SHIFTS[index].customers + 2; i += 1) {
        expect(Number.isInteger(gapMsFor(index, i))).toBe(true);
      }
    }
  });

  it('holds the gap at the supper floor for the Endless repeat', () => {
    expect(gapMsFor(ENDLESS_SHIFT_INDEX, SUPPER.customers + 1)).toBe(SUPPER.gapEndMs);
    expect(gapMsFor(ENDLESS_SHIFT_INDEX + 7, 40)).toBe(SUPPER.gapEndMs);
  });
});

describe('§8.5 — patienceMsFor', () => {
  it.each([
    ['breakfast', 0, BREAKFAST],
    ['lunch', 1, LUNCH],
    ['tea', 2, TEA],
  ] as const)('is constant across %s at customers 1, N and N+1', (_name, index, shift) => {
    const n = shift.customers;
    expect(patienceMsFor(index, 1)).toBe(shift.patienceMs);
    expect(patienceMsFor(index, n)).toBe(shift.patienceMs);
    expect(patienceMsFor(index, n + 1)).toBe(shift.patienceMs);
  });

  it('decays supper per customer down to its floor', () => {
    const n = SUPPER.customers;
    expect(patienceMsFor(3, 1)).toBe(SUPPER.patienceMs);
    expect(patienceMsFor(3, n)).toBe(SUPPER.patienceMs - SUPPER.patienceDecayPerCustomerMs * 9);
    expect(patienceMsFor(3, n)).toBe(10200);
    expect(patienceMsFor(3, n + 1)).toBe(SUPPER.patienceFloorMs);
    expect(patienceMsFor(3, n + 1)).toBe(10000);
  });

  it('holds patience at the supper floor for the Endless repeat', () => {
    expect(patienceMsFor(ENDLESS_SHIFT_INDEX, 25)).toBe(SUPPER.patienceFloorMs);
    expect(patienceMsFor(ENDLESS_SHIFT_INDEX + 3, 25)).toBe(SUPPER.patienceFloorMs);
  });

  it('never returns less than the shift floor, and never more than customer 1', () => {
    for (let index = 0; index < CONFIG.SHIFTS.length; index += 1) {
      const shift = CONFIG.SHIFTS[index];
      for (let i = 1; i <= shift.customers + 20; i += 1) {
        const patience = patienceMsFor(index, i);
        expect(patience).toBeGreaterThanOrEqual(shift.patienceFloorMs);
        expect(patience).toBeLessThanOrEqual(shift.patienceMs);
      }
    }
  });
});

describe('the selectors are total', () => {
  it('clamps a shift index below the table to the first shift', () => {
    expect(tierFor(-1, 1)).toBe(BREAKFAST.tier);
    expect(gapMsFor(-1, 1)).toBe(BREAKFAST.gapStartMs);
    expect(patienceMsFor(-1, 1)).toBe(BREAKFAST.patienceMs);
  });

  it('clamps a customer index below 1 to the first customer', () => {
    expect(gapMsFor(0, 0)).toBe(BREAKFAST.gapStartMs);
    expect(patienceMsFor(3, 0)).toBe(SUPPER.patienceMs);
  });
});
