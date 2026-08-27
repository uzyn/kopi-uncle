# Kopi Uncle — Sprint Plan

Sprints are 2.5 days. Derived from `docs/prd.md`.

Quality gate for every story:
`npm run typecheck && npm run lint && npm run test && npm run build`

---

## Sprint 1 — Scaffold and CI — DONE

**Goal:** A building, linting, testing project skeleton.

- **S1-1** Vite + React + TypeScript strict scaffold
  - `npm run build` succeeds
  - `tsconfig` has `strict: true`
- **S1-2** Vitest, ESLint, Prettier wired to npm scripts
  - `npm run test` runs and passes with one placeholder test
- **S1-3** GitHub Actions workflow running the quality gate on push
  - Workflow green on `main`

---

## Sprint 2 — Types and RNG — DONE

**Goal:** The vocabulary of the game, and reproducible randomness.

- **S2-1** `src/game/types.ts` — `Base`, `Milk`, `Sugar`, `Strength`,
  `Temperature`, `Vessel`, `Drink`
  - No DOM or React imports anywhere in `src/game/`
- **S2-2** `src/game/rng.ts` — mulberry32
  - Same seed produces the same sequence across runs
  - 100% line coverage

---

## Sprint 3 — Kopi Grammar Parser — NOT STARTED

**Goal:** The formal grammar, exhaustively verified. This is the heart of the
codebase and the sprint everything else depends on.

- **S3-1** `src/game/grammar.ts` — `formatOrder`, `parseOrder`, `isValidDrink`,
  `matches`
  - `formatOrder` emits modifiers in canonical slot order
  - `parseOrder` returns `null` on unparseable input rather than throwing
  - `isValidDrink` rejects condensed milk combined with `siew-dai` or `kosong`
  - `matches` compares all six slots
  - No DOM or React imports
- **S3-2** Exhaustive round-trip property test
  - Enumerates the full cartesian product of slot values
  - Asserts exactly 240 valid drinks out of 288
  - For every valid drink, `parseOrder(formatOrder(drink))` deep-equals `drink`
  - `src/game/grammar.ts` at 100% line coverage

---

## Sprint 4 — Order Generator — NOT STARTED

**Goal:** Seeded, tier-constrained order generation.

- **S4-1** `src/game/generator.ts` — `generateOrder(rng, tier)`
  - Tier 1 produces at most 1 non-default slot
  - Tier 2 produces at most 3 non-default slots
  - Tier 3 produces any valid combination
  - Every generated drink satisfies `isValidDrink`
  - `siew-dai` and `kosong` are unreachable at tier 1 by construction
  - Same seed produces the same order sequence

---

## Sprint 5 — Scoring — NOT STARTED

**Goal:** Deterministic points and combo.

- **S5-1** `src/game/scoring.ts`
  - `round(100 × combo)` per correct serve
  - Combo starts at 1.0, +0.1 per consecutive correct, capped at 3.0
  - Combo resets on wrong serve and on walkout
  - Shift clear bonus of +500 when a shift ends with zero walkouts

---

## Sprint 6 — Queue and Patience Engine — NOT STARTED

**Goal:** The pure reducer that runs the game.

- **S6-1** `src/game/queue.ts` — arrivals, patience drain, walkouts
  - Queue caps at 3; arrivals pause when full
- **S6-2** `src/game/engine.ts` — `tick(state, dtMs)` and
  `applyAction(state, action)`
  - No `Date.now()`, `setTimeout` or wall clock in `src/game/`
  - A full shift is reproducible as a fold over ticks and actions
  - Wrong serve costs 35% of max patience, resets combo, sets a 0.6s lockout
  - Walkout costs one heart
