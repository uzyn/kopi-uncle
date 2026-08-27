# Kopi Uncle — Product Requirements Document

**Version:** 1.3
**Owner:** U-Zyn Chua
**Status:** Approved for agent execution
**Date:** 2026-08-27
**Primary target during the build:** the local dev server — `npm run dev`.
**Deploy target:** the GitHub Pages project site of whichever repository hosts this — `https://<owner>.github.io/<repo>/`, derived at build time, landing in the final sprint.

**Supersedes:** `docs/idea.md` (v0.1) in full, and
`docs/superpowers/specs/2026-08-26-kopi-uncle-queue-design.md`. Where this
document and either source disagree, **this document wins**. The two sources
remain in the repository as design history; implementers should not read them
for requirements.

**v1.3 amendments.** A trial run of the v1.2 plan stalled on its own first
sprint: four review cycles, three hours and 10,000 lines without a merge, on a
sprint that had not written a line of game code. The cause was that Sprint 1 was
chartered to bind all 51 sprints behind it — a hash-frozen screen registry, a
dependency freeze enforced by a test that parsed the sprint plan, and a
whole-tree `Touches:`. Its correctness could therefore only be judged against 51
sets of unwritten acceptance criteria, so every review found another forward
contradiction, and each fix moved the frozen surface and created more: four of
one round's six findings were manufactured by the previous round's fixes.
Changed: **no sprint freezes a surface against a later sprint** — conventions
replace enforced forward contracts; **the Pages deploy moves from the first
sprint to the last**, and `npm run dev` is the target the build is judged against
until then; Sprint 1 shrinks to a scaffold that runs; a review-cycle budget joins
§4.2's metrics; and reviews are scoped to the sprint under review (see the sprint
plan's standing instructions).

**v1.2 amendments.** A scheduling pass against the generated sprint graph found
the plan was a queue wearing a graph's clothes — 39 of 46 sprints depended only
on the sprint above them, four runners bought 1.34×, and the first fan-out was
six sprints deep. Changed: §11.3's sequencing note, which claimed M0 "admits no
parallelism" and was the single sentence serialising the build — M0 is now one
blocking foundation sprint followed by a file-disjoint fan; the dependency freeze
moves from "during M0" to that first sprint; §10.2 splits `components/` into
per-cluster directories and gives each screen its own file pair, because
concurrent sprints must be file-disjoint and a flat directory re-serialises the
presentation track; and M3 work with no engine dependency is explicitly
schedulable early as slack-fill.

**v1.1 amendments.** A sizing and adversarial-review pass before sprint planning
found the v1.0 seam under-specified in ways that would have surfaced only at
integration, plus one outright defect. Changed: the frozen contract widens to a
view barrel so the presentation track can render an order (§10.5); `GameState`
gains events, integer combo, tick quantisation and shift-grouped results
(§10.3); rulings R18–R23 settle builder validity, pause, tick ordering and queue
invariants (§8.4); the palette's score/combo role failed WCAG AA at 1.61:1 and
is corrected with a committed contrast matrix (§9.2); the Pages deploy moves
from M3 to the first story of M0 (§11.3); and §13's open questions are ruled
with committed values so an unattended loop never stalls waiting for a human.

---

## 1. Overview

**Kopi Uncle** is a single-player, browser-based queue-management game. You
play the kopitiam uncle. Up to three customers wait in line, each calling out a
drink order in Singlish with a draining patience meter. You tap a customer to
focus them, build their drink on one shared six-slot counter, and serve.

The appeal is that ordering kopi in Singapore is a real formal grammar. "Kopi C
siew dai peng" is not slang noise — it is base plus milk plus sugar plus
temperature, spoken in a fixed order. The game teaches that grammar by making
you perform it under pressure.

**Tagline:** Can you take the order or not?

**The one-line rule:** You never lose for getting the drink wrong. You lose for
making someone wait.

### 1.1 Why this project exists

This app is built almost entirely by AI agents running an unattended sprint
loop. This PRD and the sprint plan derived from it are the human inputs;
everything downstream is agent work, verified by tests rather than by opinion.

That constraint shapes the design directly: **the game's core must be
deterministic rules, because rules can be tested and "fun" cannot.** Every
mechanic in §8 is a pure function of state and elapsed time. Every aesthetic
decision is made by the human, in this document, up front.

---

## 2. Problem statement

Two problems, one product.

**For the player.** Kopi ordering is a formal grammar that Singaporeans acquire
by osmosis and visitors never acquire at all. Existing treatments are either
static reference charts, which nobody retains, or trivia quizzes, which test
recall rather than production. Nothing makes you *produce* a valid order under
time pressure, which is the only condition under which the grammar is actually
used. Prior art (LIM SIMI?, Kopi King — §12.2) treats kopi as a theme; none
treats it as a system with validity rules.

**For the build.** A talk claiming that agents can ship real software needs a
substrate where "it works" is decidable without human taste. Most demo projects
fail this: their acceptance criteria bottom out in "looks right" or "feels
good", so the agent loop cannot self-verify and a human silently becomes the
test suite. A game whose core is a 240-element formal grammar plus a pure
reducer over time is decidable end to end — which is what makes it a fair
demonstration rather than a staged one.

Not solving either: the grammar stays folklore, and the claim about agentic
engineering stays an assertion rather than an artefact.

---

## 3. Hard constraints

Non-negotiable. These exist to keep unattended agents from wandering into
unsolvable work.

1. **Fully static.** No backend, no server, no database, no serverless
   functions. The entire app runs from static files on GitHub Pages.
2. **No API keys, no runtime network calls.** Nothing requiring a secret or a
   network round trip to function.
3. **No external runtime assets.** All graphics are inline SVG authored in
   code. Fonts are bundled into the build via `@fontsource`, never loaded from
   a CDN. The game must work correctly with no internet connection after first
   load.
4. **No binary image files.** No PNG, JPG, or sprite sheets. Visuals are SVG or
   CSS.
5. **Persistence is `localStorage` only**, behind a versioned schema wrapper.
6. **No story may require human aesthetic judgement to pass.** If a story
   cannot be verified by an automated check, it does not belong in a sprint.
7. **No wall clock inside `src/game/`.** No `Date.now()`, no `setTimeout`, no
   `performance.now()`, no `Math.random()`. Time and randomness are inputs.
   See §10.3.

---

## 4. Goals and success metrics

### 4.1 Product

| Goal | Metric | Target |
|---|---|---|
| The game is real and reachable | Playable build at the deploy URL | Live, loads in < 2s on 4G |
| It works where it will be played | Portrait phone and desktop, one-handed on phone | Both, no horizontal scroll at 360px |
| It survives bad wifi | Full play after first load with the network disabled | Zero failed requests, game fully playable |
| The grammar is correct | Round-trip property over all valid drinks | 240/240 green |
| The core is trustworthy | Line coverage of `src/game/` | 100% |
| The generator is honest | Tier pool sizes assert exactly | 16 / 144 / 240 |
| It is usable by everyone | Keyboard-only full play; WCAG AA contrast; reduced-motion honoured | All three verified |
| Determinism holds | Same date seed reproduces the same 34-order Daily sequence | Byte-identical across builds |

### 4.2 Build pipeline

Measured because the project's premise is that agents can execute this
document without supervision. These are observations of the process, not
stories for agents to implement.

| Goal | Metric | Target |
|---|---|---|
| Agents ship without hand-holding | Sprints merged with zero human code edits | ≥ 80% |
| The spec is unambiguous | Human clarifications requested mid-sprint | ≤ 1 per sprint |
| The quality gate is real, not theatre | Sprints passing the full gate on first review | ≥ 70% |
| Review converges | Implement→review cycles per sprint | ≤ 2 |
| Work is legible after the fact | Every merged PR traceable to a story ID | 100% |

---

## 5. User personas

**Ah Seng — the Singaporean player.** Knows the grammar cold and wants to prove
it. *Needs:* immediate difficulty, a score worth defending, a result worth
sending to a group chat. *Context:* phone, one hand, standing, 90 seconds.
Bounces instantly if it explains kopi to him.

**Maria — the visitor.** Has heard "kopi C siew dai" and has no idea what it
decomposes into. *Needs:* the grammar as a readable system, reachable mid-game
without losing her run; forgiveness while learning. *Context:* desktop, curious,
will read the How to Play screen before pressing Play. She is the reason wrong
drinks cost patience and never a heart.

**The implementing agent.** The other reader of this document. *Needs:*
requirements stated as decidable checks, constants named and located, edge cases
ruled on rather than left to inference. *Context:* executes a sprint
unattended, cannot ask a follow-up question mid-run, and will implement any
ambiguity as whatever seems locally reasonable. Every §8 ruling exists because
its absence would produce a plausible wrong answer.

---

## 6. User stories

### P0 — must have

- As a player, I want to see up to three waiting customers with their orders and
  patience, so that I can decide who to serve next.
- As a player, I want to tap a customer to focus them, so that their order is
  legible and my next serve is aimed at them.
- As a player, I want to set each of the six drink slots with a single tap, so
  that I can build an order faster than I can read it.
- As a player, I want the counter to keep its state after I serve, so that
  serving similar orders back to back is faster than serving them in
  arrival order.
- As a player, I want to see a live drawing of the drink I am building, so that
  I can confirm it without re-reading the slot controls.
- As a player, I want a wrong drink to cost me time and my combo but never a
  life, so that I am punished for carelessness and not for learning.
- As a player, I want a customer to walk out if I ignore them long enough, so
  that the pressure is about triage rather than typing speed.
- As a player, I want the difficulty to rise across four named shifts with a
  breather between them, so that a run has shape.
- As a player, I want my score and best combo shown at game over, so that I know
  whether that run was good.
- As a visitor, I want a reference card explaining every modifier, reachable
  from the title screen and mid-game, so that I can learn the grammar.

### P1 — should have

- As a player, I want a Daily challenge that gives everyone the same 34 orders,
  so that comparing scores is fair.
- As a player, I want to copy a spoiler-free emoji summary of my Daily run, so
  that I can share it without sharing the answers.
- As a player, I want my high score, streak and accuracy remembered, so that I
  have something to beat.
- As a keyboard player, I want to play the entire game without a mouse, so that
  I can play fast on a laptop.
- As a player with reduced-motion set, I want animations to become instant state
  changes, so that the game does not make me ill.

### P2 — nice to have

- As a player, I want the between-shift card to tell me how I did in the shift I
  just finished, so that the breather is informative.
- As a player, I want customer faces to visibly change mood as patience drains,
  so that I can triage from peripheral vision.
- As a player, I want an on-screen hint of the keyboard shortcuts, so that I
  discover them without opening help.

---

## 7. The kopi grammar

**This is the canonical specification. Do not infer additional rules from
outside knowledge.** v1 ships `kopi` and `teh` only.

### 7.1 Slots

A drink is six independent slots. Each has a default that applies when the
customer says nothing about it.

| Slot | Values | Default | Spoken form |
|---|---|---|---|
| Base | `kopi`, `teh` | none, always stated | "Kopi", "Teh" |
| Milk | `condensed`, `evaporated`, `none` | `condensed` | (unstated), "C", "O" |
| Sugar | `normal`, `siew-dai`, `ga-dai`, `kosong` | `normal` | (unstated), "siew dai", "ga dai", "kosong" |
| Strength | `normal`, `gao`, `po` | `normal` | (unstated), "gao", "po" |
| Temperature | `hot`, `peng` | `hot` | (unstated), "peng" |
| Vessel | `cup`, `bag` | `cup` | (unstated), "da bao" |

Meanings, for UI labels and the How to Play screen:

- **Milk.** `condensed` is sweetened condensed milk, the default. `evaporated`
  ("C") is unsweetened evaporated milk. `none` ("O") is black.
- **Sugar.** `siew dai` is less sweet. `ga dai` is extra sweet. `kosong` is no
  sugar at all.
- **Strength.** `gao` is thick and strong. `po` is thin and weak.
- **Temperature.** `peng` is iced.
- **Vessel.** `da bao` is takeaway, in a clear plastic bag with a string handle.

### 7.2 Canonical spoken order

```
Base → Milk → Sugar → Strength → Temperature → Vessel
```

Examples:

- `Kopi` — coffee, condensed milk, normal sugar, normal strength, hot, cup
- `Kopi O` — coffee, black, normal sugar, hot
- `Kopi C siew dai` — coffee, evaporated milk, less sweet, hot
- `Teh O kosong gao peng` — tea, black, no sugar, strong, iced
- `Kopi C peng da bao` — iced coffee, evaporated milk, takeaway

### 7.3 The validity rule

There is exactly one.

> **Condensed milk cannot combine with `siew-dai` or `kosong`.** Condensed milk
> is itself sweetened, so its sweetness is not adjustable downward. Sugar values
> below `normal` require `evaporated` or `none`.

`ga-dai` is valid with any milk, including condensed. All other combinations
are valid.

### 7.4 The combination space

Verified by enumeration:

| Quantity | Count |
|---|---|
| Raw combinations (2 × 3 × 4 × 3 × 2 × 2) | 288 |
| Invalid (condensed × {`siew-dai`, `kosong`}) | 48 |
| **Valid drinks** | **240** |

Distribution by number of non-default modifier slots — the basis of the
difficulty tiers in §8.6:

| Non-default slots | 0 | 1 | 2 | 3 | 4 | 5 |
|---|---|---|---|---|---|---|
| Valid drinks | 2 | 14 | 46 | 82 | 72 | 24 |

### 7.5 Required pure functions

In `src/game/grammar.ts` and `src/game/generator.ts`, with no DOM or React
import anywhere in the module graph.

```ts
type Base        = 'kopi' | 'teh';
type Milk        = 'condensed' | 'evaporated' | 'none';
type Sugar       = 'normal' | 'siew-dai' | 'ga-dai' | 'kosong';
type Strength    = 'normal' | 'gao' | 'po';
type Temperature = 'hot' | 'peng';
type Vessel      = 'cup' | 'bag';

interface Drink {
  base: Base;
  milk: Milk;
  sugar: Sugar;
  strength: Strength;
  temperature: Temperature;
  vessel: Vessel;
}

formatOrder(drink: Drink): string        // Drink → "Kopi C siew dai peng"
parseOrder(text: string): Drink | null   // "Kopi C siew dai peng" → Drink
isValidDrink(drink: Drink): boolean      // enforces §7.3
matches(served: Drink, ordered: Drink): boolean   // all six slots equal
nonDefaultCount(drink: Drink): number    // 0..5, excludes base
allValidDrinks(): readonly Drink[]       // the canonical 240, stable order
generateOrder(rng: () => number, tier: Tier): Drink
```

`allValidDrinks()` must return a **stable, deterministic order** across runs and
builds. Daily reproducibility depends on it. Iterate slots in the declaration
order above, outermost `base` to innermost `vessel`.

`parseOrder` is case-insensitive and collapses runs of whitespace. It returns
`null` for any string that is not exactly a canonical formatted order —
including valid tokens in the wrong sequence, and orders that parse structurally
but fail `isValidDrink`.

### 7.6 The round-trip property

**The single most important test in the codebase.**

```
∀ drink ∈ allValidDrinks():
    parseOrder(formatOrder(drink)) deep-equals drink
```

240 is small enough to enumerate completely, so this is an exhaustive cartesian
sweep, not property-based sampling. Additionally assert `allValidDrinks().length
=== 240` and that the 48 excluded combinations each fail `isValidDrink`. Any
story touching the grammar keeps these green.

### 7.7 Explicit simplifications

Stated so nobody relitigates them mid-sprint.

- Regional and stall-to-stall variation in kopi terminology is real. This game
  picks one consistent ruleset and applies it uniformly.
- The rule that condensed milk cannot take `siew dai` or `kosong` is a
  deliberate game-design ruling that makes validity crisp. Real usage is looser.
- `milo`, `di lo`, `tarik`, `yuan yang`, `bandung`, `horlicks` and Milo Dinosaur
  are out of scope for v1.

---

## 8. Functional requirements — game mechanics

### 8.1 Core loop

```
customer arrives  →  joins line (max 3)  →  patience drains
                            ↓
        player taps a card → it becomes ACTIVE (28px order text)
                            ↓
        player sets slots on the ONE persistent builder
                            ↓
                     press SERVE
                            ↓
              matches(builder, active.order) ?
                 ↙                        ↘
            CORRECT                     WRONG
    customer leaves happy        drink tipped away
    score += round(100 × combo)  that customer: −35% max patience (floored)
    combo += 0.1 (cap 3.0)       combo → 1.0
    builder state PERSISTS       0.6s input lockout
    (this is the batching)       customer STAYS — remake it
                                 no heart lost, ever
```

### 8.2 The rule that makes the game

**The builder does not reset after a serve.** Serve `Kopi C` to customer 1, flip
one slot, serve `Kopi C siew dai` to customer 3.

Reading the whole line and choosing a service order that minimises slot changes
is the entire skill ceiling. It emerges from the six-slot mechanic for free, it
is specific to this game, and it is exhaustively testable. Naive first-to-last
play stays viable through the early shifts, so this is a ceiling and not a
barrier.

The builder persists across serves, across walkouts, across shift breaks, and
for the whole run. It is reset only when a new run starts.

### 8.3 Failure

- **Walkout** — patience reaches zero. Customer leaves angry, **−1 heart**,
  combo → 1.0, their result is recorded as `walkout`.
- **Wrong serve** — drink tipped away, that customer loses 35% of *maximum*
  patience, combo → 1.0, 0.6s input lockout, their `fumbled` flag is set.
  **No heart is lost. The customer stays and must still be served.**
- Player starts with **3 hearts**. Game over at zero.

Rationale: a wrong drink is a recoverable mistake, so making it fatal teaches
fear of the grammar rather than the grammar itself. Ignoring someone is
genuinely unrecoverable. This collapses the death condition to one legible
sentence — *you never lose for getting the drink wrong, you lose for making
someone wait* — which is both good UX and true without an asterisk (see R7).

Serve-spamming is not viable: a wrong serve costs 35% patience plus a lockout
plus the combo, so guessing is strictly worse than reading the order.

### 8.4 Engine rulings

Edge cases the sources left open. Each is a decidable requirement, and each is
here because its absence produces a plausible wrong implementation.

| # | Ruling |
|---|---|
| **R1** | The builder's initial state is plain `Kopi` — every slot at its default. |
| **R2** | The builder persists across serves, walkouts and shift breaks; it resets only on `START_RUN`. |
| **R3** | When the active customer leaves for any reason, focus moves automatically to the **front of the queue** (earliest arrival), or `null` if the queue is empty. The player may tap any card to override at any time. |
| **R4** | `SERVE` with `activeId === null` is a no-op: no score change, no combo change, no lockout, no penalty. |
| **R5** | All player actions are ignored while `lockoutMs > 0`, including slot changes and focus changes. |
| **R6** | Patience continues to drain during a lockout. |
| **R7** | A wrong serve computes `patienceMs = max(patienceMs − 0.35 × maxPatienceMs, PATIENCE_FLOOR_MS)` with `PATIENCE_FLOOR_MS = 2000`. If patience is already at or below the floor it is left unchanged. **A wrong serve can therefore never cause a walkout.** |
| **R8** | A shift ends when every customer scheduled for it has both spawned *and* left the queue (served or walked out). Only then does `phase` become `break`. |
| **R9** | The break card requires an explicit `DISMISS_BREAK` action. It never auto-advances. |
| **R10** | Arrivals are suspended while the queue holds 3 customers, while `phase !== 'playing'`, and once the shift's spawn count is exhausted. |
| **R11** | The first customer of a run arrives immediately (`nextArrivalMs` starts at 0). The first customer of each subsequent shift arrives immediately after the break is dismissed. |
| **R12** | `generateOrder` filters `allValidDrinks()` to `nonDefaultCount(d) <= budget` and selects `pool[Math.floor(rng() * pool.length)]`. Pool sizes must assert exactly **16 / 144 / 240** for tiers 1 / 2 / 3. |
| **R13** | Repeated and duplicate orders are permitted and are not de-duplicated. Two identical consecutive orders are a legitimate zero-slot-change reward for batching. |
| **R14** | A customer who is fumbled and later walks out is recorded as `walkout`. `walkout` outranks `fumbled`; `fumbled` outranks `clean`. |
| **R15** | The shift-clear bonus of +500 is awarded on entering the break **only if `walkoutsInShift === 0`**. Wrong serves do not forfeit it. |
| **R16** | Game over occurs the moment hearts reach zero. Only the walkout that took the last heart is recorded; customers still waiting in the queue are discarded and produce no result. A Daily run that ends early therefore has a share grid shorter than 34 glyphs, which is correct. |
| **R17** | `siew dai` and `kosong` are unreachable at tier 1 by construction, because reaching either requires also changing the milk slot. This is correct and intended. The generator needs no special case and implementers must not "fix" it. |
| **R18** | `SET_SLOT` never rejects and never auto-corrects. The builder may legally hold a drink `isValidDrink` rejects. The two offending sugar buttons stay tappable and carry a persistent non-colour-only invalid marker (§9.2). Serving an invalid drink is simply a wrong serve — the generator only ever emits valid drinks, so it can never match. This preserves §8.3's death model and serves Maria in §5, who learns the rule by bumping into it rather than by being blocked. |
| **R19** | `PAUSE` is legal only from `playing`; `RESUME` only from `paused`. While `phase === 'paused'`, `tick` is a total no-op — patience does not drain — and every action except `RESUME` is ignored. Pause composes with R5: `lockoutMs` is preserved across a pause, not consumed by it. |
| **R20** | `tick` quantises time. It accumulates `dtMs` into `tickRemainderMs` and applies whole `TICK_MS = 16` steps, carrying the remainder. All engine time is integer milliseconds. A single `tick` may therefore spawn and walk out **several** customers, which §10.3 guarantees will happen because Playwright fast-forwards a shift. The React layer floors its own rAF delta, carries its own fraction, and clamps any single frame to `MAX_FRAME_MS = 250` so a backgrounded tab does not resume by walking the whole queue out at once. |
| **R21** | Within each step, the pipeline order is fixed: **(1)** decrement `lockoutMs` to a floor of 0; **(2)** drain patience of every queued customer; **(3)** resolve walkouts in ascending `id` order, each costing a heart, resetting combo and recording `walkout`; **(4)** apply R16 game-over and stop; **(5)** apply R8 shift-end, awarding R15's bonus, and stop; **(6)** decrement `nextArrivalMs` and spawn while an arrival is due and R10 permits; **(7)** re-resolve focus per R3. `frameEvents` is **overwritten** at the start of every `tick` and `applyAction`, never appended, so it stays a frame-local outbox and the state remains a pure fold. |
| **R22** | `queue` is always ascending by `id`, and `nextCustomerId` is monotonic — so id order *is* arrival order, and `queue[0]` is the "front" R3 refers to. Every removal path preserves relative order. Assert as a property test on both the engine and the M0 stub, so the two cannot silently disagree. |
| **R23** | R16 preempts R8 and R15 within the same step. The walkout that takes the last heart ends the run *before* the shift-end check fires and *before* the +500 bonus is evaluated. A run cannot both end and clear a shift on the same step. |
| **R24** | A Daily run ends when the 34th customer departs. The shift-clear check (R15) still fires for the final shift, so a clean supper earns its +500; `phase` then goes directly to `gameover` without passing through `break`. Endless never ends this way — supper repeats per §8.5. |
| **R25** | `SERVE` increments `servesAttempted` on every non-no-op serve and `servesCorrect` only on a match. §8.10's accuracy is `servesCorrect / servesAttempted`, accumulated across runs in storage. A walkout is not a serve and touches neither counter. |

### 8.5 Shifts

Difficulty ramps *within* each shift by tightening the arrival gap, then resets
to a floor one notch above the previous shift. The result is a sawtooth, not a
monotonic climb.

| Shift | Customers | Tier | Patience | Arrival gap (start → end) |
|---|---|---|---|---|
| Breakfast | 6 | 1 | 18.0s | 6.0s → 4.0s |
| Lunch | 8 | 2 | 16.0s | 5.0s → 3.0s |
| Tea | 10 | 2 for customers 1–5, 3 for 6–10 | 14.0s | 4.0s → 2.5s |
| Supper | 10 (repeats in Endless) | 3 | 12.0s, −0.2s per customer, floor 10.0s | 3.0s → 2.0s |

**Arrival gap** interpolates linearly across the shift's customer count. For
customer `i` of `N` (1-based):

```
gap(i) = start + (end − start) × (i − 1) / (N − 1)
```

**Patience** is constant within a shift, except at supper where it steps down
0.2s per customer to its 10.0s floor.

**In Endless**, supper repeats indefinitely after the first pass, with arrival
gap and patience **held at their floors** — 2.0s and 10.0s, constant. Difficulty
does not climb past the floor; endurance at the floor is the challenge. Each
repeat is its own shift for break and bonus purposes.

Between shifts, a break card shows customers served, walkouts, best combo, and
the next shift name ("LUNCH CROWD INCOMING"). This is the sawtooth's rest beat
and the anti-spiral valve.

### 8.6 Difficulty tiers

Tiers cap how many **non-default modifier slots** an order may use. Base is
always stated and never counts toward the budget.

| Tier | Budget | Pool size |
|---|---|---|
| 1 | ≤ 1 non-default slot | 16 |
| 2 | ≤ 3 non-default slots | 144 |
| 3 | any valid drink | 240 |

The complete tier-1 pool, for test fixtures: `Kopi`, `Kopi C`, `Kopi O`,
`Kopi ga dai`, `Kopi gao`, `Kopi po`, `Kopi peng`, `Kopi da bao`, and the eight
`Teh` equivalents.

### 8.7 The queue cap is the spiral guard

The line holds **at most 3 customers**. When full, arrivals pause until a slot
frees. The player can always dig out of a bad position.

This also solves the phone layout problem: off-screen customers whose patience
drains invisibly would be the worst possible outcome.

### 8.8 Scoring

```
per correct serve:   round(100 × combo)
combo:               starts 1.0, +0.1 per consecutive correct serve, cap 3.0
combo resets to 1.0: on a wrong serve OR a walkout
shift clear bonus:   +500 on entering the break, if zero walkouts that shift
```

**Combo is stored as integer tenths.** Repeatedly adding `0.1` to a float
produces `1.0999999999999999` and `2.9999999999999996` against a `3.0` cap,
which breaks both the cap comparison and §4.1's byte-identical determinism
target. `GameState` holds `comboTenths: number` in the range 10…30; the
displayed multiplier is `comboTenths / 10` and points are
`Math.round(100 * comboTenths / 10)`, computed from the integer.

There is **no speed bonus.** Scaling a bonus by patience remaining would pay
best for serving the *freshest* customer, making optimal play "ignore the person
about to storm off" — a perverse incentive that fights the death model. Speed is
already rewarded structurally: faster service means more customers served means
more points, and the combo carries the risk/reward, so a near-walkout genuinely
hurts.

### 8.9 Modes

**Endless.** All four shifts in order, then supper repeats at its floors until
hearts are exhausted. High score persists in `localStorage`.

**Daily.** Exactly one day: **34 customers** (6 + 8 + 10 + 10), fully scripted
from mulberry32 seeded on the current date in `YYYY-MM-DD` form, **Singapore
time (UTC+8)**. Hearts still apply. The run ends at day's end *or* at zero
hearts; either way the score is comparable across players.

The date must be computed in UTC+8 regardless of the device's timezone, so that
two players in different timezones on the same Singapore day get the same
sequence. Derive the seed by hashing the `YYYY-MM-DD` string to a 32-bit integer;
the hash function must be specified in code and covered by a test with at least
three known-input/known-output pairs.

**Share.** Clipboard text only. No image generation, no external service.

```
Kopi Uncle 2026-08-26   4,820
🟩🟩🟨🟩🟩🟩 · 🟩🟩🟥🟩🟩🟨🟩🟩 · ...
🟩 clean   🟨 fumbled first   🟥 walked out
```

One glyph per customer, grouped by shift and separated by ` · `. The grid
reveals no order contents, so it is spoiler-free. It is rendered directly from
`shiftResults` (§10.3) — one inner array per shift, pushed on entering each —
because a flat array cannot be re-banded into 6/8/10/10 once R16 truncates a run
that ended early. A Daily run ending at zero hearts therefore produces a grid
with fewer than 34 glyphs and correct per-shift grouping, which is correct.

### 8.10 Persistence

`localStorage` only, behind a versioned wrapper in `src/storage/`. A schema
version mismatch or any parse failure discards the stored blob and starts from
defaults — it must never throw into the UI.

Stored: games played, high score (Endless), best combo, Daily streak, last Daily
date played, last Daily score, cumulative `servesCorrect` / `servesAttempted`
(R25), and settings.

**Streak semantics, ruled** so no agent has to guess: a Daily run extends the
streak when its date is exactly one day after the stored date; a same-day replay
never changes the streak or the stored score; a gap of two or more days resets
the streak to 1; and a run that ends at zero hearts still counts as played and
still extends the streak. The arithmetic lives in a pure `src/game/daily.ts`
tested across a month boundary, a year boundary, a leap day, a same-day replay
and a two-day gap, with one test forced under `TZ=America/New_York` to prove
timezone independence.

---

## 9. Non-functional requirements

### 9.1 Visual direction

The world is the traditional kopitiam: mosaic floor tiles, marble-top tables,
enamel and porcelain cups, bright plastic stools, hand-painted signage. Palette
warm and saturated. Mood cheerful and busy, not nostalgic or muted.

Deliberately avoided: muted cream backgrounds with a serif display face; dark
mode with a single neon accent; flat pastel "corporate illustration". None of
those say Singapore.

### 9.2 Design tokens

Declared once as custom properties in `src/styles/tokens.css`.

```css
--kopitiam-green:  #0E6B4F;   /* green rim on the classic porcelain cup */
--tile-teal:       #2A9D8F;   /* mosaic floor tile */
--kaya-yellow:     #F4B93E;   /* signage, highlights, score */
--chilli-red:      #D62828;   /* plastic stool red, errors, urgency */
--condensed-cream: #FFF3D6;   /* primary background */
--teak:            #4A2C18;   /* counter, text, outlines */
```

- `--condensed-cream` is the page background.
- `--teak` is the primary text colour and the outline colour on all SVG.
- `--kopitiam-green` is chrome: header, counter surface, primary buttons.
- `--kaya-yellow` owns score, combo and the active slot state — but **only as a
  background or fill behind `--teak`, never as text on `--condensed-cream`.**
  That pair measures **1.61:1** and fails AA outright; inverted (`--teak` on
  `--kaya-yellow`) it measures 7.12:1. Score and combo therefore render as
  `--teak` on a `--kaya-yellow` plate seated in the header chrome.
- `--chilli-red` is reserved for errors, the last heart, and the `angry` mood
  band. It clears AA on cream at 4.54:1.
- `--tile-teal` is decorative only — floor tile, dividers, rules. At 3.01:1 on
  cream it is never used for text.
- **Colour is never the only carrier of meaning.** Every state using colour also
  uses a label, an icon, or a shape change.

**Approved contrast pairs.** These are the only foreground/background pairings
permitted for text. `tokens.css` ships with this matrix committed, and a unit
test parses the token values and asserts each pair clears 4.5:1 — so §9.7's AA
requirement is a gate failure rather than a review opinion.

| Foreground | Background | Ratio | Use |
|---|---|---|---|
| `--teak` | `--condensed-cream` | 11.44 | body text, labels, order text |
| `--teak` | `--kaya-yellow` | 7.12 | score, combo, active slot |
| `#FFFFFF` | `--kopitiam-green` | 6.49 | primary button labels |
| `--condensed-cream` | `--kopitiam-green` | 5.89 | header text |
| `#FFFFFF` | `--chilli-red` | 5.01 | error text |
| `--chilli-red` | `--condensed-cream` | 4.54 | last heart, `angry` band |

Any pair absent from this table is forbidden for text. Adding one means
computing the ratio and extending the test.

### 9.3 Typography

Two roles, both bundled via `@fontsource`.

- **Display — Anton.** A heavy condensed grotesque for the logo, score and
  headings; the reference is hand-painted stall signage. Bungee was the
  alternative and is rejected: it carries more novelty than a 40px score readout
  can afford, and Anton ships a single 400 weight, which keeps the §9.8 bundle
  budget honest. Import the Latin subset only: `@fontsource/anton/latin-400.css`.
- **Body and UI — Nunito Sans** for labels, buttons and the order bubble, chosen
  for friendly numerals since the score and patience readouts are always on
  screen. Latin subset, weights 400 and 700 only.

Both declare a metric-compatible fallback and `font-display: swap`, so a slow
font load shifts no layout: `'Anton', 'Arial Narrow', system-ui, sans-serif` and
`'Nunito Sans', system-ui, -apple-system, sans-serif`.

Type scale, as tokens `--step-12` … `--step-64`: 12, 14, 16, 20, 28, 40, 64.
**Active order text is 28px or larger on every viewport**, because it is the
thing the player reads under pressure. The longest tier-3 order —
`Teh O kosong gao peng da bao` — must render in the active-card style at a 360px
viewport with no horizontal overflow. That is a Playwright assertion, not a
judgement call.

### 9.4 The signature element

**The drink preview.** A live SVG that redraws as the player changes slots. This
is the one place to spend effort and boldness.

- Liquid colour interpolates by base and milk: black coffee near-black,
  condensed a warm tan, evaporated a paler grey-tan.
- `gao` deepens the liquid colour, `po` lightens it.
- `peng` adds visible ice cubes and condensation droplets on the vessel.
- **`bag` renders the drink in a clear plastic bag with a looped string
  handle** — the single most recognisably Singaporean image available, and the
  visual the game should be remembered for. It is built **first**, and `cup` and
  `bag` ship as one atomic story whose acceptance is that both variants render.
- `cup` renders the classic white porcelain cup with a green rim, on a saucer.

The cup↔bag transition is the one animated moment in the game. Everything else
stays quiet.

### 9.5 Layout — phone, portrait, primary target

```
┌─────────────────────────────────┐
│ ♥♥♥      KOPI UNCLE       x2.3  │  hearts, logo, combo
│                      score 1240 │
├─────────────────────────────────┤
│ ┏━━━━━━━━━━━━━━━┓ ┌────┐ ┌────┐ │
│ ┃ ◕‿◕           ┃ │◔_◔ │ │ಠ益ಠ│ │
│ ┃ Kopi C        ┃ │Teh │ │Kopi│ │
│ ┃ siew dai!     ┃ │O   │ │C   │ │
│ ┃ ← 28px        ┃ │gao │ │peng│ │
│ ┃ ◍◍◍◍◍◍◍░░░░░  ┃ │◍◍◍ │ │◍_ _│ │
│ ┗━━━━━━━━━━━━━━━┛ └────┘ └────┘ │
│   ACTIVE           tap to switch │
├─────────────────────────────────┤
│           [ drink ]             │  live SVG preview
├─────────────────────────────────┤
│ BASE   kopi │ teh               │
│ MILK    ●   │ C   │ O           │  slot selectors,
│ SUGAR   ●   │siew │ ga │ kosong │  thumb reach zone
│ BREW    ●   │ gao │ po          │
│ TEMP   hot  │peng               │
│ TAKE   cup  │ bag               │
├─────────────────────────────────┤
│ ▐          SERVE           ▌    │  full-width primary
└─────────────────────────────────┘
```

**Desktop and tablet.** Same content as a counter viewed head-on. Max content
width 1100px, centred. Queue and orders left, drink preview centre, slot
selectors right, SERVE spanning the bottom of the control column. Do not simply
stretch the mobile layout.

### 9.6 Queue card rules

- **One chunk per customer.** Face, order text and patience ring compose a
  single card, not three competing readouts.
- **The active card expands; the others stay compact.** This is what buys 28px
  order text inside a portrait viewport, and it is why tap-to-focus was chosen
  over a segmented "serve to 1|2|3" row — that alternative would have pushed all
  three orders below the text-size floor and split one 44px target into three.
- **Patience is never carried by colour alone.** A continuous ring *plus* three
  discrete face states. The enum is computed in exactly one place —
  `moodFor(patienceMs, maxPatienceMs)` in the frozen view barrel (§10.5) — and
  neither track recomputes the ratio itself. Intervals are half-open so every
  boundary is decidable:

  | State | Condition on `p = patienceMs / maxPatienceMs` |
  |---|---|
  | `calm` | `p > 0.60` |
  | `impatient` | `0.30 < p ≤ 0.60` |
  | `angry` | `p ≤ 0.30` |

  Both boundary values belong to the lower band. `moodFor` is unit-tested at
  exactly `p = 0.60` and `p = 0.30`, and the engine tests assert the exact tick
  on which a customer crosses into `angry`.

### 9.7 Interaction and accessibility floor

- Touch targets minimum 44 × 44 CSS pixels.
- **R5's 0.6s lockout must be visible.** Silence reads as a frozen app. While
  `lockoutMs > 0` the SERVE button shows a depleting bar and `aria-disabled`,
  the six slot rows dim to an `aria-disabled` state, and the tipped-away drink
  animates out. Under `prefers-reduced-motion` the bar becomes a static disabled
  state. Per §9.2 none of this may be carried by colour alone.
- **Full keyboard play.** `Q`/`W`/`E` focus queue positions 1/2/3; `↑`/`↓` move
  between slot rows; `1`–`4` select a value within the focused row; `Enter`
  serves and dismisses the break card; `?` opens help; `Esc` pauses. Shown on
  the help screen.
- Visible focus rings on every interactive element.
- `prefers-reduced-motion` honoured: the walkout becomes an instant removal plus
  a static stamp, feedback animations become instant state changes, and the
  cup↔bag transition becomes an instant swap.
- All text meets WCAG AA contrast against its background.
- Playable one-handed on a phone; all controls sit in the lower two-thirds of
  the viewport.
- The game must not depend on hover. Every hover affordance has a tap and a
  keyboard equivalent.

### 9.8 Performance

- Interactive within 2s on a mid-range phone over 4G, from a cold cache.
- Sustained 60fps during play on a 2021-class phone. The engine tick is O(3) in
  queue size, so any frame cost is rendering.
- Total JS bundle under 200KB gzipped, fonts excluded.

---

## 10. Technical considerations

### 10.1 Stack

- **Vite** + **React** + **TypeScript**, `strict: true`
- **CSS Modules**, with §9.2 tokens in a single `tokens.css`
- **Vitest** for unit tests, **Playwright** for end-to-end
- **ESLint** + **Prettier**
- Fonts via `@fontsource`, bundled

Chosen for being well-trodden and low-configuration. **Do not introduce a CSS
framework, a state-management library, a game engine, or an animation library
without a story that justifies it.**

### 10.2 Structure

```
src/
  game/            pure logic, zero DOM imports
    types.ts         Drink, Customer, GameState, Action, Phase, Mood, ShiftId…
    config.ts        ALL tuning constants + the three selectors — see §10.4
    view.ts          frozen pure display barrel — see §10.5
    rng.ts           mulberry32
    grammar.ts       format, parse, validate, matches
    generator.ts     seeded order generation
    scoring.ts       combo, points, shift bonus
    queue.ts         arrivals, patience, walkouts
    engine.ts        tick + applyAction reducer
    daily.ts         SG date string, seed hash, streak arithmetic
  app/
    App.tsx            the screen registry — written once, never re-edited
    EngineContext.tsx  the ONLY module naming an engine implementation
    useGameClock.ts    the requestAnimationFrame loop feeding dtMs
    TitleScreen.tsx    one file pair per screen: <Screen>.tsx + <Screen>.module.css
    HowToPlay.tsx
    GameScreen.tsx
    GameOver.tsx
    Pause.tsx
    StatsScreen.tsx
  dev/             Track B scaffolding — deleted by an M2 story
    stubEngine.ts
    fixtures.ts      the named GameState catalogue — see §10.5
    gallery/         the fixture gallery, dev-only
  components/      React components, one directory per cluster
    slots/           the six slot-selector rows
    queue/           queue cards, patience ring, mood faces
    hud/             hearts, score, combo
    break/           the between-shift break card
    share/           the emoji share grid
  graphics/        SVG components, including the drink preview
  storage/         localStorage wrapper, versioned schema
  styles/
    tokens.css       §9.2 palette and the type scale
    motion.css       the cup↔bag transition and its reduced-motion branch
docs/
  prd.md
  sprint.md
tests/
  support/         fold / advance / runUntil / expectSameState harness
  fixtures/        committed golden files — see §10.7
  lint/fixtures/   files that MUST fail lint, proving the boundary bites
  e2e/
```

**One directory per cluster, one file pair per screen, and CSS Modules colocated
with their component.** This is a scheduling constraint, not a style preference:
`sprintkit-autopilot` refuses to co-schedule two sprints whose declared paths
intersect, so a flat `components/` would serialise the whole presentation track
against itself. `styles/` holds only the two shared stylesheets. `App.tsx`
registers every screen up front with placeholder modules, so a screen sprint
fills its own file and never touches the router.

`src/game/` must remain importable in Node with no browser globals. This is what
makes the logic exhaustively testable and is the reason this project suits
unattended agents at all. Enforce it with an ESLint boundary rule, not a
convention.

### 10.3 The engine is a pure reducer

The 100%-coverage promise survives the queue **only if time is an input rather
than ambient state.**

```ts
tick(state: GameState, dtMs: number): GameState
applyAction(state: GameState, action: Action): GameState
createInitialState(mode: Mode, seed: number): GameState
```

No `Date.now()`, no `setTimeout`, no `performance.now()`, no bare
`Math.random()` anywhere inside `src/game/`. The React layer owns the animation
frame and feeds `dtMs` in.

**The PRNG state lives inside `GameState`**, not in a module-level closure.
Otherwise `tick` is not pure and Daily reproducibility breaks under React strict
mode's double-invocation.

This makes an entire shift a pure fold over a list of ticks and actions. A
walkout, a near-spiral, a perfectly batched run, and the exact frame a
customer's patience crosses into `angry` all become ordinary unit tests. It also
lets Playwright fast-forward a shift instead of waiting 18 real seconds per
customer.

```ts
type Phase = 'title' | 'playing' | 'paused' | 'break' | 'gameover';
type Mode  = 'endless' | 'daily';
type Tier  = 1 | 2 | 3;
type ShiftId = 'breakfast' | 'lunch' | 'tea' | 'supper';
type Mood = 'calm' | 'impatient' | 'angry';
type ServeResult = 'clean' | 'fumbled' | 'walkout';

type GameEvent =
  | { type: 'arrived';      customerId: number }
  | { type: 'served';       customerId: number; points: number }
  | { type: 'fumbled';      customerId: number }
  | { type: 'walkout';      customerId: number }
  | { type: 'heartLost';    remaining: number }
  | { type: 'shiftCleared'; shiftIndex: number; bonus: number }
  | { type: 'gameOver' };

interface Customer {
  id: number;
  order: Drink;
  maxPatienceMs: number;
  patienceMs: number;
  fumbled: boolean;             // drives the 🟨 share state
}

interface GameState {
  phase: Phase;
  mode: Mode;
  queue: Customer[];            // length 0..3, always ascending by id — R22
  activeId: number | null;
  builder: Drink;               // persists across serves — see §8.2
  hearts: number;
  comboTenths: number;          // integer 10..30 — see §8.8
  bestComboTenths: number;
  score: number;
  shiftIndex: number;           // 0..3, then pinned at 3 in Endless
  spawnedInShift: number;
  servedInShift: number;
  walkoutsInShift: number;
  servesAttempted: number;      // for §8.10 accuracy
  servesCorrect: number;
  lockoutMs: number;            // 600ms after a wrong serve
  nextArrivalMs: number;
  nextCustomerId: number;
  rngState: number;             // mulberry32 state — keeps tick pure
  tickRemainderMs: number;      // sub-step carry — see R20
  shiftResults: ServeResult[][];// one inner array per shift — see §8.9
  frameEvents: GameEvent[];     // OVERWRITTEN every call, never appended — R21
}

type SetSlot = {
  [K in keyof Drink]: { type: 'SET_SLOT'; slot: K; value: Drink[K] }
}[keyof Drink];

type Action =
  | { type: 'START_RUN'; mode: Mode; seed: number }
  | { type: 'FOCUS'; customerId: number }
  | SetSlot
  | { type: 'SERVE' }
  | { type: 'DISMISS_BREAK' }
  | { type: 'PAUSE' }
  | { type: 'RESUME' };
```

**`SetSlot` does not narrow on its own.** Destructuring `{ slot, value }` from
the union gives TypeScript `keyof Drink` and a union of all six value types, so
`draft[slot] = value` does not typecheck under `strict`. The contract therefore
also ships one generic helper, which is the single place the unavoidable cast
lives:

```ts
function setSlot<K extends keyof Drink>(d: Drink, slot: K, value: Drink[K]): Drink;
```

**State identity is part of the contract**, with one exemption R20 forces.
`tick` returns the *identical* state reference when `phase !== 'playing'` or
`dtMs === 0`. A sub-step `dtMs` cannot return the identical reference, because
R20 requires the remainder to be carried: it returns a state differing **only**
in `tickRemainderMs`, with `builder`, every `Customer`, `shiftResults` and the
shared frozen empty `frameEvents` all identity-preserved. In every case `tick`
preserves object identity for `builder` and for any `Customer` whose fields did
not change. Without this, a
new object every animation frame re-renders the §9.4 SVG preview 60 times a
second and §9.8's frame budget is unreachable. Assert it with `Object.is` on
`state.builder` across 1000 ticks with no `SET_SLOT`.

**`START_RUN` and `createInitialState` are one reset path, not two.**
`applyAction(state, { type: 'START_RUN', mode, seed })` must equal
`createInitialState(mode, seed)` by construction — implement one in terms of the
other and assert the equality for both modes. `createInitialState` is used only
for the pre-title bootstrap; every actual run begins with `START_RUN`. Endless
seeds are supplied by the React layer as a fresh value per run; Daily seeds come
from §8.9's date hash.

### 10.4 All tuning lives in one file

`src/game/config.ts` exports a single frozen object holding every constant in
§8: queue cap, hearts, patience floor, wrong-serve penalty fraction, lockout
duration, combo step and cap, base points, shift-clear bonus, and the per-shift
table of customer count, tier, patience and arrival gaps.

Nothing in §8 may be written as a literal anywhere else in the codebase —
**including test fixtures**, which read their patience, gap, lockout and bonus
values from config rather than restating them.

The shift table is not a flat constants list. Tea splits its tier mid-shift and
supper decays patience per customer while Endless holds both at floors (§8.5),
so `config.ts` also exports three pure selectors that own those formulas:

```ts
tierFor(shiftIndex: number, customerIndex: number): Tier
gapMsFor(shiftIndex: number, customerIndex: number): number
patienceMsFor(shiftIndex: number, customerIndex: number): number
```

Each is unit-tested at customers 1, N and N+1 of every shift, and each handles
the Endless `shiftIndex >= 3` floor-held case.

M0 freezes config's **shape and keys, not its values.** A value change is
explicitly never a seam break and never requires re-verifying either track — the
difficulty curve is tuned by a human play session (§13.1), not by an agent
story, and tuning must stay a one-file change.

### 10.5 The track seam

The build runs as two parallel tracks (§11.3). They meet at exactly one
interface, frozen before either track starts. It has three parts:

1. **`src/game/types.ts`** — the shapes in §10.3.
2. **`src/game/view.ts`** — a barrel of *pure display helpers*, implemented for
   real in M0 rather than stubbed. Track B cannot render a queue card without
   these, and every one of them is a pure function of a `Drink` or two numbers
   with no engine dependency:

   ```ts
   formatOrder(drink: Drink): string
   isValidDrink(drink: Drink): boolean
   nonDefaultCount(drink: Drink): number
   moodFor(patienceMs: number, maxPatienceMs: number): Mood
   SLOT_ROW_LABELS: Record<keyof Drink, string>          // "BASE", "MILK", …
   SLOT_VALUE_LABELS: Record<keyof Drink, Record<string, string>>
   ```

3. **`createInitialState` / `tick` / `applyAction`** — the three signatures.

The presentation track imports **only** `types.ts`, `view.ts` and those three
signatures. The logic track never imports from `components/` or `graphics/`.
M1a *extends* `grammar.ts` and re-exports through `view.ts`; it never rewrites
what M0 froze.

**The stub is a scripted replay, not a fake.** A stub that merely typechecks
unblocks nothing: patience rings, mood faces, break cards and game-over states
are all functions of behaviour over time. M0 therefore ships
`src/dev/stubEngine.ts` plus `src/dev/fixtures.ts` — a hand-written, hand-checked
catalogue of named `GameState` snapshots covering an empty queue, one/two/three
customers, each mood band *plus both boundary values exactly*, active and
no-active, mid-lockout, immediately post-wrong-serve, break, and a game-over
with an R16-truncated results list. Track B renders fixtures; it never simulates.

**One indirection owns the swap.** `src/app/EngineContext.tsx` exporting
`useEngine(): { state, dispatch }` is the only module in the codebase that
names either implementation. Every M1b component takes state as props or reads
the context, so M2's swap is a one-file change and an M2 story deletes
`src/dev/` entirely.

Enforce the boundary with ESLint `no-restricted-imports` in both directions, and
the §3.7 purity ban with `no-restricted-syntax` AST selectors — `Date.now()`,
`performance.now()` and `Math.random()` are member expressions, so a
`no-restricted-globals` rule silently misses all three and only catches
`setTimeout`. Because a rule that looks right and does nothing is worse than no
rule, M0 commits four fixture files that must fail lint and a Vitest test that
runs the ESLint API over each and asserts the specific `ruleId` fires.

### 10.6 Deployment

**The build is judged locally until the very end.** `npm run dev` is the target
every sprint before the last is measured against: it starts in seconds, needs no
network, and shows a change the moment it merges. Publishing is a single sprint
at the end of the plan, not a dependency of the first one.

- `npm run dev` serves the app from Sprint 1 onward. No sprint before the final
  deploy sprint may depend on a deployed URL, and no acceptance criterion before
  it may assert against one.
- The final sprint adds a GitHub Actions workflow building on push to `main` and
  deploying to GitHub Pages, gated on the full §10.7 quality gate. A red gate
  must not publish.
- Vite `base` is derived at build time from `GITHUB_REPOSITORY` — `/<repo>/`
  under GitHub Actions, `/` otherwise — so asset paths resolve on the Pages
  subpath with the repository name appearing nowhere as a literal. This lands in
  Sprint 1 because it costs three lines of config and spares the deploy sprint a
  retrofit; a fork, a rename or a clone under any name then deploys unchanged.
- The deployed URL comes from the `deploy-pages` action's `page_url` output.
  Nothing hard-codes it; it is recorded in the README once live.

### 10.7 Quality gate

Every story is done when this passes:

```
npm run typecheck && npm run lint && npm run test && npm run build && npm run e2e
```

Standing requirements:

- `src/game/` maintains **100% line coverage**, enforced by a Vitest threshold
  that fails the run, not by inspection. The config is specified, not inferred:
  provider `v8`, `all: true`, `include: ['src/game/**/*.ts']`,
  `exclude: ['src/game/types.ts']`, `perFile: true`, `autoUpdate: false`.
  `src/dev/` is excluded with a comment naming the M2 story that deletes it.
- **Exhaustiveness is compile-time, not runtime.** A `default: throw` arm over a
  closed union is an unreachable line that can never be covered, so inside
  `src/game/` exhaustiveness is proven by a `satisfies never` assignment with no
  runtime statement. Where a runtime guard is genuinely unavoidable it carries
  the exact comment `/* v8 ignore next */`, and a grep test caps how many such
  comments may exist so the escape hatch cannot spread.
- The §7.6 round-trip test is green, asserted index-for-index against a
  committed golden file rather than by length alone.
- The §8.6 tier pool sizes assert exactly 16 / 144 / 240.
- **Golden fixtures make "byte-identical" (§4.1) an actual assertion**, since it
  is otherwise untestable inside a single build:
  `tests/fixtures/all-valid-drinks.json` (the 240 formatted strings in order),
  `tests/fixtures/mulberry32.json` (a known seed and its first ten outputs), and
  `tests/fixtures/daily-2026-08-28.json` (the 34 formatted orders and their
  patience values for a pinned date).
- **A test seam exists from M0**, behind `import.meta.env.VITE_E2E` and stripped
  from the production bundle: `window.__KOPI__ = { advance(ms), getState(),
  dispatch(action) }`, plus `?seed=` and `?date=` query params consumed at
  `START_RUN`. Without it the smoke test below cannot pass — breakfast patience
  is 18.0s and the customer walks out mid-test.
- The Playwright smoke test loads the built app with a pinned seed, reads the
  active order via `formatOrder(getState().queue[0].order)`, clicks the six
  matching slots, serves, and asserts a **positive** score delta. Note that only
  a *correct* serve pays (§8.8), so the test cannot mash slots at random.
- A test registers a `requestfailed` listener, calls `setOffline(true)` after
  first load, completes a full focus-build-serve cycle and asserts zero failed
  requests — this is what makes §3.3 and §4.1's offline claim decidable.
- CI asserts the gzipped `dist/assets` total against §9.8's 200KB budget.

---

## 11. Scope and milestones

### 11.1 In scope for v1

The complete game as specified in §7–§10: the grammar and its exhaustive tests,
the queue-and-patience engine, the four-shift ramp, the live SVG drink preview
including the cup↔bag transition, Endless and Daily modes, share text, stats and
streaks, all five screens, full keyboard play, the accessibility floor, and the
GitHub Pages deployment.

### 11.2 Out of scope for v1

Backend of any kind. Accounts. Global leaderboards. Sound — a candidate for a
later sprint, and if added it must be synthesised with the Web Audio API rather
than shipped as audio files. Drinks beyond `kopi` and `teh`, `milo` included.
Animated customer characters beyond static faces with three mood states.
Localisation. Analytics. Any form of monetisation.

### 11.3 Build structure — two parallel tracks

Work fans out into a logic track and a presentation track that meet at the §10.5
seam. This exercises parallel agents, which is the point of the exercise, and it
means visual progress and engine progress are visible at the same time rather
than sequentially.

```
Sprint 1  scaffold + a running dev server             (the ONLY blocking sprint)
    │
    ├── lint ──┬── boundary + purity rules ──┐
    ├── CI gate                              │
    ├── the frozen contract ──┬──────────────┼── seam ──┐
    ├── design tokens ────────┤              │          │
    └── Playwright ───────────┼──────────────┘          │
                              │                         │
              ┌───────────────┴───────────────┐         │
              │                               │         │
        Track A: logic                  Track B: presentation
        rng · grammar · scoring         tokens · vessels · slot rows
        queue · generator · daily       queue cards · screens
              │                               │         │
              └───────────────┬───────────────┴─────────┘
                              ▼
                     M2 integration ──► M3 modes, polish ──► deploy (last)

Slack-fillers (storage, title screen, How to Play) hang off the contract and
tokens directly, and run whenever a runner is otherwise idle.
```

| Milestone | Description | Key deliverables |
|---|---|---|
| **M0 — Contract** | One blocking foundation sprint, then a file-disjoint fan. Everything both tracks depend on, and nothing else. **It ends where `npm run dev` renders something; publishing waits for the last sprint.** | **A running dev server from hour one** — Vite/React/TS strict scaffold with the §10.2 tree and the five gate scripts; ESLint, Prettier, Vitest, Playwright wired to npm scripts; CI running the full gate; `tokens.css` with the §9.2 contrast matrix test and both fonts; `types.ts` frozen per §10.3; `config.ts` and its selectors per §10.4; `view.ts` implemented for real per §10.5; the three engine signatures; `src/dev/` stub and fixture catalogue; `EngineContext`; the test seam; the boundary and purity lint rules with their failing fixtures |
| **M1a — Logic** | Track A. Pure, headless, 100% covered. | `rng.ts` (mulberry32); `grammar.ts` with the exhaustive 240-drink round-trip test; `generator.ts` asserting 16/144/240; `scoring.ts`; `queue.ts` (arrivals, patience, walkouts); `engine.ts` implementing `tick`/`applyAction` against every §8.4 ruling |
| **M1b — Presentation** | Track B. Built against the stub; no engine dependency. | The live SVG drink preview including the cup↔bag transition; the six slot-selector rows; queue cards with patience rings and the three mood states; the game screen at both breakpoints; keyboard navigation |
| **M2 — Integration** | The seam closes. The game becomes playable. | Real engine wired to real UI; the requestAnimationFrame loop feeding `dtMs`; shift ramp and break card; game-over screen; Playwright smoke test green |
| **M3 — Modes and ship** | Everything that sits on a working game. | Daily mode with the UTC+8 date seed and its golden fixture; share text; `storage/` with stats and streaks; title, How to Play and stats screens; `prefers-reduced-motion`; the offline and bundle-budget assertions |

**Sequencing note for the sprint planner.** Exactly one sprint is genuinely
blocking: the foundation sprint that creates the tree, installs the dependencies
and gets `npm run dev` rendering. **Everything else in M0 fans out from it** — the linter, the
CI gate, the frozen contract, the design tokens and the browser runner need the
scaffold and nothing from each other, so they run concurrently and the plan must
say so in its `**Dependencies:**` lines. Declare the minimal true dependency;
never write "the previous sprint" out of habit.

Concurrent sprints must also be **file-disjoint**, which is what §10.2's
directory split is for. Every sprint declares `**Touches:**`. **Every dependency
either track is known to need is installed in that first sprint**, so that in
practice no later sprint has cause to open the manifest. That is a convention,
not an enforced freeze: a sprint that genuinely needs a new dependency adds it
and declares `package.json` in its `**Touches:**`, which the scheduler then reads
as a real edge and serialises accordingly. **No sprint asserts anything about a
later sprint's files, plan text or acceptance criteria** — a forward contract
cannot be verified by running anything, so it is paid for in review rounds
instead of in tests.

M1a and M1b are read as file scopes rather than as phases: a logic sprint depends
on the frozen contract and the purity lint, a presentation sprint on the contract
and the tokens, and neither depends on the sprint above it. M2 cannot start until
both tracks are green. Completion of M3 is desirable but not required — see §4.2.

**M3 work with no engine dependency may be scheduled early.** `daily.ts`, the
versioned storage wrapper, the title screen and the How to Play grammar reference
depend only on the contract, the RNG or the tokens. Because the scheduler picks
the ready sprint with the largest transitive downstream first, these near-leaves
are chosen only when a runner would otherwise idle — they fill slack instead of
displacing critical work, so hoisting them costs the stop-anywhere ordering
nothing.

**Stop-anywhere ordering.** Because the run is expected to stop mid-plan, the
plan is ordered so that stopping is never embarrassing. `npm run dev` renders
from Sprint 1, so there is something to look at before any game code exists, and
every merge after it changes what that page shows. Publishing is deliberately
last: a deploy that must stay green is a standing liability across an unattended
run, and the demo is the local server. Within M1b the two vessel renders are a
single atomic story with the **bag first** (§9.4), because the bag is the visual
the game is meant to be remembered for and a half-finished cup is not a demo.

**Pre-authorised descope ladder.** If time runs short, cut in this order and do
not ask: Daily mode and share, then the stats screen, then the desktop
three-column composition (a centred single-column fallback passes), then the
cup↔bag *animation* — §9.7 already requires an instant swap under reduced
motion, so the animation is the one genuinely cuttable item in §9.4. Never cut:
a working `npm run dev`, the §7.6 round-trip suite, the six slot controls, or the
bag render. The Pages deploy is the last sprint and is itself cuttable — losing
it costs a URL, not the demo.

---

## 12. Risks and mitigations

### 12.1 Delivery and execution

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| The two tracks diverge and integration at M2 is expensive | High | High | Freeze `types.ts` and the three engine signatures in M0 before either track starts; enforce the boundary with lint in both directions (§10.5); Track B develops against a stub that satisfies the real contract |
| Timeline is extremely compressed — the build starts 2 days before the talk | High | Medium | Scope is explicitly ordered so value lands early; M0→M2 produces a playable game and M3 is additive. Completion is not the success condition (§4.2) |
| An agent "fixes" the tier-1 unreachability of `siew dai` / `kosong` | Medium | Medium | Ruled explicitly in R17 and §7.7 with the rationale attached, and asserted by the 16/144/240 pool-size test which would fail if changed |
| An agent reaches for `Date.now()` or module-level RNG state, breaking purity | Medium | High | Constraint 7 in §3, R-rules in §10.3, an ESLint rule banning the globals inside `src/game/`, and a test that folds a fixed tick/action list to a byte-identical state twice |
| The frozen contract is itself wrong, and both tracks build on it | Medium | High | This was live in v1.0 and is the reason for v1.1: an adversarial pass found the seam could not render an order, had no event channel, no pause, no tick quantisation and an un-regroupable results array. Contract changes are cheap before M0 and expensive after, so the seam is now reviewed *as a deliverable* — M0's exit criterion is that a fixture-driven M1b component renders without importing anything outside §10.5 |
| The loop stalls overnight waiting on a human judgement call | High | High | §13 is ruled rather than open, the descope ladder in §11.3 is pre-authorised, and the standing instruction is to never ask but to take the green, reversible option and record it |
| Difficulty numbers are untuned guesses | High | Low | Acknowledged: they are starting values. All of §8 lives in one `config.ts` (§10.4), so tuning is a one-file human change and never an agent story |
| 100% coverage on `src/game/` becomes a rubber stamp — tests written to touch lines rather than assert behaviour | Medium | Medium | Coverage is a floor, not the goal. The round-trip sweep, the pool-size assertions and the determinism fold are behavioural and cannot be satisfied by line-touching |

### 12.2 Product

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Three simultaneous orders overwhelm a phone screen | Medium | High | Active card expands, others compact (§9.6); queue capped at 3 so nothing is ever off-screen (§8.7); 28px floor on active order text |
| Players never discover batching, so the skill ceiling goes unused | Medium | Medium | The builder visibly persists after a serve, which is the affordance; naive play stays viable through breakfast and lunch, so discovery is rewarded rather than required |
| The grammar ruling in §7.3 draws "that's not how it works" objections | Medium | Low | §7.7 states the simplification openly, and the How to Play screen presents the rule as this game's rule |
| Prior art overlap — LIM SIMI? and Kopi King occupy the same setting | Low | Low | Differentiation is the queue plus grammar-as-formal-system, not the setting. Neither prior work treats kopi as a validity-checked system |
| Conference wifi fails during play | Medium | Medium | Already a hard constraint (§3.3): no runtime network calls, fonts and graphics bundled, fully playable offline after first load |

---

## 13. Ruled for v1, revisit after tuning

**These are decided, not pending.** An unattended loop that reads a question
stalls until a human answers, and the two overnight blocks are exactly when
nobody is watching. Every item below therefore carries a committed value that
ships as written. The standing instruction to the loop is: **never ask — when
blocked on a product judgement, take the option that keeps the build green and
reversible, and record it in the sprint file.**

1. **Difficulty tuning.** Every number in §8.5 is a starting value that has never
   been played. One human play session is needed to tune arrival gaps and
   patience. This is explicitly a human decision, not an agent story — §10.4
   exists to make it a one-file change.
2. **Break card pacing — ruled: keep R9's explicit dismiss.** Ships as written.
   If play-testing shows it breaks flow, the alternative is a 3-second
   auto-advance with dismiss-to-skip, but that is a post-tuning change and no
   agent story may make it.
3. **Patience floor constant — ruled: `PATIENCE_FLOOR_MS = 2000`.** Ships as
   written and is tuned with the rest of §8.5 in the same one-file pass.
4. **Endless supper monotony — ruled: hold at the floors, ship §8.5 as written.**
   If it reads flat after tuning, the lever is weighting the tier-3 pool toward
   4- and 5-modifier drinks rather than tightening the clock further. Not a v1
   change.
5. **Post-v1 content.** `milo` and the wider drink vocabulary (`tarik`,
   `yuan yang`, `bandung`, Milo Dinosaur) are the obvious first expansion. Milo
   reintroduces a second validity rule, so it is a grammar change rather than a
   content change and needs its own sprint.
