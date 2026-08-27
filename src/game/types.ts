/**
 * The frozen contract's type surface (PRD §10.3).
 *
 * Sprint 1 declares only `Phase`, because `src/app/App.tsx`'s screen registry
 * is keyed by it and a second, app-local copy of the union would be a contract
 * drift waiting to happen. S3-1 (Sprint 3 — the frozen contract) fills in the
 * rest of §10.3: `Mode`, `Tier`, `ShiftId`, `Mood`, `ServeResult`, `GameEvent`,
 * `Drink` and its six slot unions, `Customer`, `GameState`, `SetSlot`, `Action`
 * and the `setSlot` helper signature.
 */

export type Phase = 'title' | 'playing' | 'paused' | 'break' | 'gameover';
