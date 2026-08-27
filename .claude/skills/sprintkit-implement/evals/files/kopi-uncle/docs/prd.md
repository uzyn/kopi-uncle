# Kopi Uncle — Product Requirements Document

**Status:** Approved
**Context:** Browser game demo, built by an unattended agent sprint loop.

## 1. Overview

Kopi Uncle is a single-player browser game. You play the kopitiam uncle.
Customers queue up and call out drink orders in Singlish, you assemble each
drink on a six-slot counter, and you keep the line moving.

Ordering kopi is a real formal grammar — "Kopi C siew dai peng" is base plus
milk plus sugar plus temperature. The game teaches that grammar under pressure.

## 2. Hard constraints

1. Fully static. No backend, no database, no serverless functions.
2. No API keys and no runtime network calls.
3. No external asset dependencies at runtime. All graphics are inline SVG.
4. No binary image files.
5. Persistence is localStorage only.
6. No story may require human aesthetic judgement to pass.

## 3. The kopi grammar

A drink is six independent slots, each with a default applied when the customer
says nothing about it.

| Slot | Values | Default |
|---|---|---|
| Base | `kopi`, `teh` | none, always stated |
| Milk | `condensed`, `evaporated`, `none` | `condensed` |
| Sugar | `normal`, `siew-dai`, `ga-dai`, `kosong` | `normal` |
| Strength | `normal`, `gao`, `po` | `normal` |
| Temperature | `hot`, `peng` | `hot` |
| Vessel | `cup`, `bag` | `cup` |

Modifiers are always spoken in slot order: Base → Milk → Sugar → Strength →
Temperature → Vessel.

**Validity rule.** Condensed milk cannot combine with `siew-dai` or `kosong`;
condensed milk is already sweetened, so sweetness below normal requires
`evaporated` or `none`. This leaves 240 valid drinks out of 288 combinations.

### Required pure functions

Implemented in `src/game/`, with no DOM or React dependency:

```ts
formatOrder(drink: Drink): string        // Drink → "Kopi C siew dai peng"
parseOrder(text: string): Drink | null   // "Kopi C siew dai peng" → Drink
isValidDrink(drink: Drink): boolean
matches(served: Drink, ordered: Drink): boolean
generateOrder(rng: () => number, tier: 1 | 2 | 3): Drink
```

**The round-trip property** is the most important test in the codebase. For
every drink satisfying `isValidDrink`, `parseOrder(formatOrder(drink))` must
deep-equal `drink`, verified exhaustively over all 240 valid drinks.

## 4. Game mechanics

Up to three customers queue, each with a draining patience meter. The player
taps a customer to focus them, builds the drink on one shared counter, and
serves. **The counter does not reset between serves** — ordering service to
minimise slot changes is the skill ceiling.

- Walkout (patience hits zero): −1 heart. Three hearts, game over.
- Wrong serve: −35% of that customer's max patience, combo reset, 0.6s
  lockout. No heart lost; the customer stays.
- Scoring: `round(100 × combo)`. Combo starts at 1.0, +0.1 per consecutive
  correct serve, capped at 3.0. Shift clear bonus +500 for zero walkouts.

Four shifts — breakfast, lunch, tea, supper — each ramping arrival rate and
order complexity, with a break screen between them. The queue caps at three;
when full, arrivals pause. This is the death-spiral guard.

Time must be an input rather than ambient state: `tick(state, dtMs)` and
`applyAction(state, action)` are pure, so `src/game/` holds no wall clock.

## 5. Modes

- **Endless.** All four shifts, then supper repeats at its floor until hearts
  run out. High score in localStorage.
- **Daily.** 34 customers, scripted from a mulberry32 PRNG seeded on the date
  in Singapore time. Everyone gets the same sequence. Shareable result.

## 6. Screens

Title, How to Play (the grammar as a reference card), Game, Game Over, Stats.

## 7. Technical stack

Vite, React, TypeScript in strict mode, CSS Modules, Vitest for unit tests,
Playwright for end-to-end smoke tests, ESLint and Prettier. Deployed static to
GitHub Pages via GitHub Actions.

`src/game/` must remain importable in Node with no browser globals, and holds
100 percent line coverage.

## 8. Phased roadmap

- **Phase 1 — Foundation.** Project scaffold, CI, types, the grammar
  (`formatOrder`, `parseOrder`, `isValidDrink`, `matches`), mulberry32,
  the exhaustive round-trip test, scoring.
- **Phase 2 — Core game.** Queue and patience engine, order generator, the
  live SVG drink preview, slot controls, the game screen, shift ramp.
- **Phase 3 — Modes and polish.** Daily challenge, share text, stats and
  streaks, title / help / game-over screens.
- **Phase 4 — Deployment and accessibility.** Pages deploy, full keyboard
  play, `prefers-reduced-motion`, WCAG AA contrast, Playwright smoke test.

## 9. Quality gate

Every story is done when this passes:

```
npm run typecheck && npm run lint && npm run test && npm run build && npm run e2e
```

## 10. Out of scope for v1

Backend of any kind. Accounts. Global leaderboards. Sound. Drinks beyond kopi
and teh. Animated characters. Localisation. Analytics.
