/**
 * The frozen contract's third part (PRD §10.5): three signatures, no bodies.
 *
 * Track A fills these in at M1a. Until then every body throws, so a stub can
 * never be mistaken for a working engine — `src/dev/stubEngine.ts` is what the
 * presentation track develops against.
 */

import type { Action, GameState, Mode } from './types';

export function createInitialState(mode: Mode, seed: number): GameState {
  throw new Error(
    `NotImplemented: createInitialState(${mode}, ${seed}) — implemented by S21-2, ` +
      'which builds it and START_RUN as one reset path (§10.3).',
  );
}

export function tick(state: GameState, dtMs: number): GameState {
  throw new Error(
    `NotImplemented: tick(state in phase ${state.phase}, ${dtMs}) — implemented by S21-1, ` +
      "which owns R20's quantisation and R21's pipeline order.",
  );
}

export function applyAction(state: GameState, action: Action): GameState {
  throw new Error(
    `NotImplemented: applyAction(state in phase ${state.phase}, ${action.type}) — ` +
      'implemented by S21-2, which covers all seven actions.',
  );
}
