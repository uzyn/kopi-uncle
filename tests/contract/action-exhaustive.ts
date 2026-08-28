/**
 * §10.7's compile-time exhaustiveness proof over `Action`.
 *
 * A `default: throw` arm over a closed union is an unreachable line that can
 * never be covered, so exhaustiveness is proven here instead: if a variant is
 * ever added to `Action` without being listed below, `Exclude` stops collapsing
 * to `never` and this file fails `npm run typecheck`.
 *
 * The module is deliberately never imported at runtime — `types.test.ts`
 * asserts its text instead. It is a type declaration, not a statement that runs.
 */

import type { Action, Mode, SetSlot } from '../../src/game/types';

type HandledAction =
  | { type: 'START_RUN'; mode: Mode; seed: number }
  | { type: 'FOCUS'; customerId: number }
  | SetSlot
  | { type: 'SERVE' }
  | { type: 'DISMISS_BREAK' }
  | { type: 'PAUSE' }
  | { type: 'RESUME' };

declare const unhandledAction: Exclude<Action, HandledAction>;

export const ACTION_EXHAUSTIVE: never = unhandledAction satisfies never;
