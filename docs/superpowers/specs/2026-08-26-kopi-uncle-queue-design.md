# Kopi Uncle — Queue, Patience and Failure Design

**Date:** 2026-08-26
**Owner:** U-Zyn Chua
**Status:** Approved design, ready for PRD revision
**Supersedes:** `docs/idea.md` §5 (Game mechanics), and amends §4, §6.5, §6.6, §8.2
**Context:** Demo project for NUS-ISS Learning Festival 2026 talk, "Agentic AI in Software Engineering, One Year On: Skills, Subagents, Loops"

---

## 1. Purpose

The v0.1 PRD specified a single-customer, single-timer loop: one order, a 12-second countdown, wrong-or-expired costs a life. This document replaces that with a queue-and-patience model, and settles the four decisions that follow from it.

The design goal is unchanged: the core must be deterministic rules, because rules can be tested by unattended agents and "fun" cannot. Every mechanic below is a pure function of state and elapsed time.

## 2. Research basis

Three findings from prior-art review drove the design.

**A queue is only interesting if the player chooses who to serve.** In Diner Dash, the patience meter works because the player picks which table to attend — patience is a prioritisation signal, not a countdown. A strictly first-in-first-out queue makes the patience of customers 2..N a hidden accumulating penalty for being slow at customer 1, which is mathematically identical to one tighter timer but with three times the UI and worse phone readability. FIFO queues are pressure theatre.

**Unguarded queue pressure produces unrecoverable death spirals.** PlateUp players report rush conditions where queue timers deplete faster than any play can survive. A hard queue cap that pauses arrivals is a one-line guard against this.

**Cooking Mama is a low-stress skill-performance game, not a triage game.** Its mistakes affect grade, not survival. The reference is therefore to its *feel* — discrete chunked taps, immediate visual feedback, no failure from imprecision — not to its failure model. The failure model here is Diner Dash's. The PRD must say this explicitly or implementers will muddle the two.

Sources are listed in §11.

## 3. Decisions

| # | Decision | Chosen |
|---|---|---|
| 1 | Queue model | Free-select with one persistent global builder |
| 2 | Death model | Walkouts are the only thing that costs a life |
| 3 | Run structure | Four shifts with breathers between them |
| 4 | Serve gesture | Tap a customer to focus, one full-width SERVE |

## 4. Core loop

```
customer arrives  →  joins line (max 3)  →  patience drains
                            ↓
        player taps a card → it becomes ACTIVE (28px order text)
                            ↓
        player sets slots on the ONE persistent builder
                            ↓
                     press SERVE
                            ↓
              matches(built, active.order) ?
                 ↙                        ↘
            CORRECT                     WRONG
        customer leaves happy      drink tipped away
        combo +0.1                 that customer: −35% max patience
        slot state PERSISTS        combo → 1.0
        (this is the batching)     0.6s pour lockout
                                   customer stays, remake it
```

### 4.1 The rule that makes the game

**The builder does not reset after a serve.** Serve `Kopi C` to customer 1, flip one slot, serve `Kopi C siew dai` to customer 3.

Reading the whole line and choosing a service order that minimises slot changes is the entire skill ceiling. It emerges for free from the six-slot mechanic already specified in the PRD, it is specific to this game rather than borrowed from Diner Dash, and it is exhaustively testable. Naive first-to-last play remains viable through the early shifts, so the skill is a ceiling and not a barrier.

### 4.2 Failure

- **Walkout** (patience reaches zero): customer storms off, −1 heart, combo resets to 1.0.
- **Wrong serve**: drink is tipped away, that customer loses 35% of *maximum* patience, combo resets to 1.0, 0.6s input lockout. **No heart is lost. The customer stays.**
- Player starts with 3 hearts. Game over at zero.

Rationale: a wrong drink is a recoverable mistake, so making it fatal teaches fear of the grammar rather than the grammar itself. Ignoring someone is genuinely unrecoverable. This collapses the death condition to one legible sentence — *you never lose for getting the drink wrong, you lose for making someone wait* — which is both good UX and a good line for the talk.

Serve-spamming is not viable: a wrong serve costs 35% patience plus a lockout plus the combo, so guessing is strictly worse than reading the order.

### 4.3 Deleted concepts

The following from `docs/idea.md` no longer exist and must be removed in the PRD revision:

- §5.2 speed bonus (see §6.1 below for why)
- §5.3 order timer and its 0.2s-per-order decay
- §5.2 "Timer expiry counts as a wrong order" — patience *is* the timer now
- Milo as a base, throughout §4, including validity rule §4.3.3
- The single-customer wireframe in §6.5

## 5. Shifts and difficulty

Difficulty ramps *within* each shift by tightening the arrival gap, then resets to a floor one notch above the previous shift. This produces a sawtooth rather than a monotonic climb.

| Shift | Customers (Daily) | Tier | Patience | Arrival gap (start → end) |
|---|---|---|---|---|
| Breakfast | 6 | 1 (≤1 non-default slot) | 18.0s | 6.0s → 4.0s |
| Lunch | 8 | 2 (≤3 non-default slots) | 16.0s | 5.0s → 3.0s |
| Tea | 10 | 2 for customers 1–5, 3 for 6–10 | 14.0s | 4.0s → 2.5s |
| Supper | 10 (∞ in Endless) | 3 (any valid) | 12.0s, −0.2s per customer, floor 10.0s | 3.0s → 2.0s floor |

Arrival gap interpolates **linearly across the shift's customer count**, from the start value at customer 1 to the end value at the final customer, then clamps at the end value. Patience is constant within a shift, except at supper where it steps down 0.2s per customer to its floor.

Between shifts, a break card shows customers served, best combo, and the next shift name ("LUNCH CROWD INCOMING"). This is the sawtooth's rest beat, the anti-spiral valve, and a natural pause point in a live demo.

### 5.1 Queue cap is the spiral guard

The line holds **at most 3 customers**. When it is full, arrivals pause until a slot frees. The player can always dig out of a bad position. This also solves the phone layout problem in §7 — off-screen customers whose patience drains invisibly would be the worst possible outcome.

### 5.2 Tuning status

The numbers above are **starting values, not tuned values**. Rough sanity check at the supper floor: a tier-3 order is roughly six taps (~5s naive, ~3s batched), and a third-in-line customer waits ~10s before service begins. Against 10s patience, naive play loses them and batched play saves them — which is the curve doing its job.

`docs/idea.md` §10.4 stands: the difficulty curve is tuned by a human play session, not by an agent story. Agents implement these constants behind a single named config object so tuning is a one-file change.

### 5.3 Tier 1 and the condensed-milk rule

Under §4.3.1 of the PRD, condensed milk cannot combine with `siew-dai` or `kosong`. Since milk defaults to `condensed`, reaching either sugar value requires *also* changing the milk slot — two non-default slots.

**Therefore `siew dai` and `kosong` are unreachable at tier 1 by construction.** This is correct and intended. The generator needs no special case; it falls out of `isValidDrink` plus the non-default-slot budget. Implementers should not "fix" it.

## 6. Scoring

```
per correct serve:   round(100 × combo)
combo:               starts 1.0, +0.1 per consecutive correct, cap 3.0
combo resets on:     wrong serve OR walkout
shift clear bonus:   +500 if zero walkouts in that shift
```

### 6.1 Why the speed bonus is deleted

PRD §5.2 scaled a bonus by the fraction of the order timer remaining. Ported naively onto patience, that pays best for serving the *freshest* customer — making optimal play "ignore the person about to storm off", which fights the death model directly. It is a perverse incentive and a subtle one.

Speed is already rewarded structurally: faster service means more customers served, which means more points. The combo carries the risk/reward — a 3.0x combo is worth protecting, so a near-walkout genuinely hurts. Fewer moving parts, no perverse pull.

## 7. Modes

**Endless.** All four shifts in order, then supper repeats indefinitely with arrival gap and patience **held at their floors**. Difficulty does not climb past the floor; endurance at the floor is the challenge. Runs until hearts are exhausted. High score in localStorage.

**Daily.** Exactly one day: **34 customers** (6 + 8 + 10 + 10), fully scripted from mulberry32 seeded on the current date in `YYYY-MM-DD` form, Singapore time. Hearts still apply. The run ends at day's end *or* at zero hearts; either way the score is comparable across players.

**Share.** Clipboard text only, no image generation and no external service. The wrong-serve rule creates a natural third state:

```
Kopi Uncle 2026-08-26   4,820
🟩🟩🟨🟩🟩🟩 · 🟩🟩🟥🟩🟩🟨🟩🟩 · ...
🟩 clean   🟨 fumbled first   🟥 walked out
```

## 8. UX and accessibility

Amends PRD §6.5 and §6.6. All existing constraints — 44px touch targets, one-handed play, WCAG AA, `prefers-reduced-motion` — carry over unchanged.

### 8.1 Phone layout, portrait

```
┌─────────────────────────────┐
│ ♥♥♥   KOPI UNCLE      x2.3  │
├─────────────────────────────┤
│ ┏━━━━━━━━━━━━━━━━┓ ┌───┐ ┌───┐│
│ ┃ ◕‿◕           ┃ │◔_◔│ │ಠ益ಠ││
│ ┃ Kopi C        ┃ │Teh │ │Kopi││
│ ┃ siew dai!     ┃ │O   │ │C   ││
│ ┃ ← 28px        ┃ │gao │ │peng││
│ ┃ ◍◍◍◍◍◍◍░░░░░ ┃ │◍◍◍ │ │◍_ _││
│ ┗━━━━━━━━━━━━━━━━┛ └───┘ └───┘│
│   ACTIVE            tap to switch│
│        [ drink ]            │
│ BASE  kopi │ teh            │
│ MILK   ●   │ C  │ O         │
│  ...                        │
│ ▐      SERVE       ▌        │
└─────────────────────────────┘
```

### 8.2 Rules

- **One chunk per customer.** Face, order text and patience ring compose a single card, not three competing readouts. Standard cognitive-load chunking.
- **The active card expands, the others stay compact.** This is what buys the 28px order text required by PRD §6.3 within a portrait viewport. It is the reason tap-to-focus was chosen over a segmented "serve to 1|2|3" row, which would have pushed all three orders below the text-size floor and split one 44px target into three.
- **Patience is never carried by colour alone** (PRD §6.2). A continuous ring *plus* three discrete face states, testable as an enum:

  | State | Patience remaining |
  |---|---|
  | `calm` | 100% – 60% |
  | `impatient` | 60% – 30% |
  | `angry` | 30% – 0% |

- **Keyboard:** `Q`/`W`/`E` focus customer 1/2/3; `↑`/`↓` move between slot rows; `1`–`4` select a value within the focused row; `Enter` serves. No conflict with the scheme in PRD §6.6.
- **`prefers-reduced-motion`:** the walkout becomes an instant removal plus a static stamp. The cup→bag transition remains the one animated moment in the game.

## 9. Grammar changes

v1 ships `kopi` and `teh` only. Milo is deferred to a later sprint.

Consequences:

- Base becomes a two-way toggle, which reads well on a phone.
- Validity rule §4.3.3 (Milo takes no milk modifier) is deleted. **§4.3.1 becomes the only validity rule.**
- Combination space: 2 bases × 3 milks × 4 sugars × 3 strengths × 2 temperatures × 2 vessels = **288 raw**, of which condensed × {`siew-dai`, `kosong`} accounts for **48 invalid**, leaving **240 valid drinks**.

240 is small enough to enumerate exhaustively, so the round-trip property test in PRD §4.5 remains a complete cartesian sweep rather than a sample:

```
∀ drink where isValidDrink(drink):
    parseOrder(formatOrder(drink)) deep-equals drink
```

## 10. Architecture

Amends PRD §8.2. The 100%-coverage promise for `src/game/` survives the queue **only if time is an input rather than ambient state**.

```ts
tick(state: GameState, dtMs: number): GameState
applyAction(state: GameState, action: Action): GameState
```

No `Date.now()`, no `setTimeout`, no wall clock anywhere inside `src/game/`. The React layer owns the animation frame and feeds `dtMs` in; the engine is a pure reducer.

This makes an entire shift a pure fold over a list of ticks and actions. A walkout, a near-spiral, a perfectly batched run, and the exact frame a customer's patience crosses into `angry` all become ordinary unit tests. It also lets Playwright fast-forward a shift instead of waiting 18 real seconds per customer.

Two new pure modules join the existing four:

```
src/game/
  types.ts
  grammar.ts       format, parse, validate
  generator.ts     seeded order generation
  scoring.ts
  rng.ts           mulberry32
  queue.ts         arrivals, patience, walkouts      ← new
  engine.ts        tick + applyAction reducer        ← new
```

State shape:

```ts
interface Customer {
  id: number;
  order: Drink;
  maxPatienceMs: number;
  patienceMs: number;
  fumbled: boolean;        // drives the 🟨 share state
}

interface GameState {
  queue: Customer[];       // length 0..3
  activeId: number | null;
  builder: Drink;          // persists across serves — see §4.1
  hearts: number;
  combo: number;
  score: number;
  shift: ShiftId;
  lockoutMs: number;       // 0.6s after a wrong serve
  nextArrivalMs: number;
}
```

## 11. Prior art

Neither of these blocks the project. Differentiation is the queue plus the grammar-as-formal-system framing, not the setting.

- **LIM SIMI?** — existing browser kopitiam game. Tap ingredients, build the drink, beat the timer, five rounds, ranked "Kopi King" / "Teh Expert".
- **Kopi King** — 2020 Singaporean card game by Origame on the same premise.

## 12. Sources

- Diner Dash — TV Tropes: https://tvtropes.org/pmwiki/pmwiki.php/VideoGame/DinerDash
- Diner Dash — Grokipedia: https://grokipedia.com/page/Diner_Dash
- Queue Patience Timer Needs a Cap On Speed — PlateUp! discussions: https://steamcommunity.com/app/1599600/discussions/0/685240346635030858/
- MDA: Cooking Mama — The Mechanics of Magic: https://mechanicsofmagic.com/2022/04/12/mda-cooking-mama/
- The MDA of Overcooked 2 — Avni Kakkar: https://medium.com/game-design-fundamentals/the-mda-of-overcooked-2-f1e3343de8a7
- Everything I'd change about Overcooked — Pollywog Games: https://pollywog.games/blog/overcooked.html
- Minimizing Cognitive Load in Game UX — Corey Hobson: https://coreyhobson.medium.com/minimizing-cognitive-load-strategies-for-simplifying-complex-systems-in-game-ux-fcc72544c8e3
- 10 Free Singapore-Themed Browser Games (LIM SIMI?) — The Smart Local: https://thesmartlocal.com/read/free-singapore-themed-browser-games/
- Kopi King — Origame: https://www.origame.co/kopi-king
