# Kopi Uncle — Product Requirements Document

**Version:** 0.1 (initial pass)
**Owner:** U-Zyn Chua
**Status:** Draft for agent execution
**Context:** Demo project for NUS-ISS Learning Festival 2026 talk, "Agentic AI in Software Engineering, One Year On: Skills, Subagents, Loops"

---

## 1. Overview

**Kopi Uncle** is a single-player, browser-based reflex and memory game. You play the kopitiam uncle. Customers call out drink orders in Singlish, you assemble the drink correctly before the timer runs out, and you keep the queue moving.

The appeal is that ordering kopi in Singapore is a real formal grammar. "Kopi C siew dai peng" is not slang noise, it is base plus milk plus sugar plus temperature. The game teaches that grammar by making you perform it under time pressure.

**Tagline:** Can you take the order or not?

### Why this project exists

This app is built almost entirely by AI agents running an unattended sprint loop. The PRD and the sprint plan are the human inputs. Everything downstream is agent work, verified by tests rather than by opinion. That constrains the design: the game's core must be deterministic rules, because rules can be tested and "fun" cannot.

---

## 2. Goals and non-goals

### Goals

- A complete, playable game reachable at a public URL, working on a phone and on a desktop browser.
- Core game logic that is pure, deterministic, and fully unit tested.
- Visual identity that is unmistakably Singaporean and cheerful, not a generic game template.
- A daily challenge that produces the same order sequence for everyone on a given date, with a shareable result.
- Every user story verifiable by an automated check, with no acceptance criteria that depend on subjective judgement.

### Non-goals

- Multiplayer, global leaderboards, or any server-side state.
- User accounts or authentication.
- Photo-realistic art or a custom art pipeline.
- Physics, free movement, or anything whose correctness depends on how it feels.
- Faithful reproduction of every regional kopi variation. See section 4.6.

---

## 3. Hard constraints

These are non-negotiable and exist to keep unattended agents from wandering into unsolvable work.

1. **Fully static.** No backend, no server, no database, no serverless functions. The entire app must run from static files on GitHub Pages.
2. **No API keys, no external API calls at runtime.** Nothing that requires a secret or a network round trip to work.
3. **No external asset dependencies at runtime.** All graphics are inline SVG authored in code. Fonts are bundled into the build, not loaded from a CDN. The game must work correctly on a laptop with no internet connection after first load, because conference wifi is unreliable.
4. **No binary image files.** No PNG, JPG, or sprite sheets. If a visual is needed, it is drawn with SVG or CSS.
5. **Persistence is localStorage only.** Stats, streaks, and settings live in the browser.
6. **No story may require human aesthetic judgement to pass.** If a story cannot be verified by a test, it does not belong in a sprint. Aesthetic decisions are made by the human, in this document, up front.

---

## 4. The kopi grammar

This is the heart of the game and the most important section for implementers. **Treat this as the canonical specification. Do not infer additional rules from outside knowledge.**

A drink is six independent slots. Each slot has a default that applies when the customer does not say anything about it.

### 4.1 Slot definitions

| Slot | Values | Default | Spoken form |
|---|---|---|---|
| Base | `kopi`, `teh`, `milo` | none, always stated | "Kopi", "Teh", "Milo" |
| Milk | `condensed`, `evaporated`, `none` | `condensed` | (unstated), "C", "O" |
| Sugar | `normal`, `siew-dai`, `ga-dai`, `kosong` | `normal` | (unstated), "siew dai", "ga dai", "kosong" |
| Strength | `normal`, `gao`, `po` | `normal` | (unstated), "gao", "po" |
| Temperature | `hot`, `peng` | `hot` | (unstated), "peng" |
| Vessel | `cup`, `bag` | `cup` | (unstated), "da bao" |

Meanings, for UI labels and the in-game help screen:

- **Milk.** `condensed` is sweetened condensed milk, the default. `evaporated` ("C") is unsweetened evaporated milk. `none` ("O") is black.
- **Sugar.** `siew dai` is less sweet. `ga dai` is extra sweet. `kosong` is no sugar at all.
- **Strength.** `gao` is thick and strong. `po` is thin and weak.
- **Temperature.** `peng` is iced.
- **Vessel.** `da bao` is takeaway, served in a plastic bag with a string handle.

### 4.2 Canonical spoken order

Modifiers are always spoken in this sequence:

```
Base → Milk → Sugar → Strength → Temperature → Vessel
```

Examples:

- `Kopi` = coffee, condensed milk, normal sugar, normal strength, hot, cup
- `Kopi O` = coffee, black, normal sugar, hot
- `Kopi C siew dai` = coffee, evaporated milk, less sweet, hot
- `Teh O kosong gao peng` = tea, black, no sugar, strong, iced
- `Kopi C peng da bao` = iced coffee with evaporated milk, takeaway

### 4.3 Validity rules

These produce the invalid combinations the game must reject when generating orders, and they are excellent unit test material.

1. **Condensed milk cannot combine with `kosong` or `siew-dai`.** Condensed milk is itself sweetened, so its sweetness is not adjustable. Sugar modifiers below `normal` require `evaporated` or `none`.
2. **`ga-dai` is valid with any milk**, including condensed.
3. **`milo` does not take a milk modifier.** Milo always carries its own milk. For `milo`, the milk slot is fixed to `condensed` and no `O` or `C` form exists. Milo does accept sugar, strength, temperature, and vessel modifiers.
4. All other slot combinations are valid.

### 4.4 Required pure functions

Implement these in `src/game/` with no DOM or React dependency.

```ts
type Base = 'kopi' | 'teh' | 'milo';
type Milk = 'condensed' | 'evaporated' | 'none';
type Sugar = 'normal' | 'siew-dai' | 'ga-dai' | 'kosong';
type Strength = 'normal' | 'gao' | 'po';
type Temperature = 'hot' | 'peng';
type Vessel = 'cup' | 'bag';

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
isValidDrink(drink: Drink): boolean      // enforces section 4.3
matches(served: Drink, ordered: Drink): boolean
generateOrder(rng: () => number, tier: 1 | 2 | 3): Drink
```

### 4.5 The round-trip property

**This is the single most important test in the codebase.** For every drink that satisfies `isValidDrink`, the following must hold:

```
parseOrder(formatOrder(drink)) deep-equals drink
```

Implement this as an exhaustive test over the full cartesian product of valid slot values. The space is small enough to enumerate completely, so there is no need for property-based fuzzing. Any story touching the grammar must keep this test green.

### 4.6 Explicit simplifications

Stated here so nobody relitigates them mid-sprint:

- Regional and stall-to-stall variation in kopi terminology is real. This game picks one consistent ruleset and applies it uniformly.
- `di lo`, `tarik`, `yuan yang`, `bandung`, `horlicks`, and Milo Dinosaur are out of scope for v1. They are candidate content for a later sprint.
- The rule that condensed milk cannot take `siew dai` or `kosong` is a deliberate game-design ruling that makes the validity logic crisp. Real usage is looser.

---

## 5. Game mechanics

### 5.1 Core loop

1. A customer arrives at the counter and calls out an order, shown as text in a speech bubble.
2. An order timer starts.
3. The player sets each slot using tap or click controls.
4. The live drink preview updates as slots change.
5. The player presses **Serve**.
6. The served drink is compared to the ordered drink on all six slots.
7. Correct or wrong feedback shows, score updates, next customer arrives.

### 5.2 Scoring

- Correct order: **+100**
- Speed bonus: **+0 to +50**, scaled linearly by the fraction of the order timer remaining
- Combo multiplier: starts at **1.0**, increases by **0.1** per consecutive correct order, capped at **3.0**
- Final points per order: `round((100 + speedBonus) * comboMultiplier)`
- Wrong order: combo resets to 1.0, one life lost
- Timer expiry: counts as a wrong order

### 5.3 Lives and difficulty ramp

- Player starts with **3 lives**. Game ends at zero.
- Order timer starts at **12.0 seconds** and decreases by **0.2 seconds** per order served, with a floor of **5.0 seconds**.
- Difficulty tiers control how many non-default slots an order may use:
  - **Tier 1**, orders 1 to 5: at most 1 non-default slot
  - **Tier 2**, orders 6 to 12: at most 3 non-default slots
  - **Tier 3**, orders 13 and beyond: any valid combination

### 5.4 Modes

**Endless.** The default mode. Plays until lives run out. High score persists in localStorage.

**Daily.** A fixed sequence of **20 orders** generated from a seeded PRNG where the seed is derived from the current date in `YYYY-MM-DD` form in Singapore time. Everyone playing on the same day gets the same sequence. No lives; every order is attempted, and the result is a score plus an accuracy count.

Use **mulberry32** as the PRNG. It is specified explicitly so that daily sequences are reproducible across builds and so agents do not each pick a different algorithm.

**Share result.** After a daily run, a share button copies a short text block to the clipboard: the date, the score, and a row of emoji indicating correct and wrong per order. No image generation, no external service.

---

## 6. Visual design

### 6.1 Direction

The world is the traditional kopitiam: mosaic floor tiles, marble-top tables, enamel and porcelain cups, bright plastic stools, hand-painted signage. The palette is warm and saturated. The mood is cheerful and busy, not nostalgic or muted.

Deliberately avoided: muted cream backgrounds with a serif display face, dark mode with a single neon accent, and flat pastel "corporate illustration" styling. None of those say Singapore.

### 6.2 Design tokens

```css
--kopitiam-green: #0E6B4F;   /* the green rim on the classic porcelain cup */
--tile-teal:      #2A9D8F;   /* mosaic floor tile */
--kaya-yellow:    #F4B93E;   /* signage, highlights, score */
--chilli-red:     #D62828;   /* plastic stool red, errors, urgency */
--condensed-cream:#FFF3D6;   /* primary background */
--teak:           #4A2C18;   /* counter, text, outlines */
```

Rules of use:

- `--condensed-cream` is the page background.
- `--teak` is the primary text colour and the outline colour on all SVG.
- `--kopitiam-green` is chrome: header, counter surface, primary buttons.
- `--kaya-yellow` is reserved for score, combo, and the active slot state.
- `--chilli-red` is reserved for errors, the last life, and the timer under 3 seconds.
- Colour is never the only carrier of meaning. Every state that uses colour also uses a label, an icon, or a shape change.

### 6.3 Typography

Two roles, both bundled via `@fontsource` so there is no runtime CDN dependency.

- **Display:** a heavy condensed signage face for the logo, score, and headings. Suggested: Bungee or Anton. The reference is hand-painted stall signage, so heavy and slightly compressed reads correctly.
- **Body and UI:** a rounded humanist sans for labels, buttons, and the order bubble. Suggested: Nunito Sans. It has friendly numerals, which matters because the timer and score are always on screen.

Type scale: 12, 14, 16, 20, 28, 40, 64. Order text is set at 28 or larger on all viewports, because it is the thing the player reads under pressure.

### 6.4 The signature element

**The drink preview.** A live SVG that redraws as the player changes slots. This is the one place to spend effort and boldness.

- Liquid colour interpolates by base and milk: black coffee is near-black, condensed milk is a warm tan, evaporated is a paler grey-tan, Milo is a dark chocolate brown.
- `gao` deepens the liquid colour, `po` lightens it.
- `peng` adds visible ice cubes and condensation droplets on the vessel.
- `cup` renders the classic white porcelain cup with a green rim, sitting on a saucer.
- **`bag` renders the drink in a clear plastic bag with a looped string handle**, which is the single most recognisably Singaporean image available and is the visual the game should be remembered for.

The transition between cup and bag should be the one animated moment in the game. Everything else stays quiet.

### 6.5 Layout

**Phone, portrait, primary target.**

```
┌─────────────────────────┐
│ ♥♥♥      KOPI UNCLE  x2.3│  lives, logo, combo
│ ▓▓▓▓▓▓▓▓░░░░  score 1240 │  timer bar, score
├─────────────────────────┤
│  (uncle)  ╭────────────╮ │
│           │ Kopi C siew│ │  order bubble
│           │ dai peng!  │ │
│           ╰────────────╯ │
├─────────────────────────┤
│                         │
│        [ drink ]        │  live SVG preview
│                         │
├─────────────────────────┤
│ BASE   kopi│teh │milo   │
│ MILK   ●   │ C  │ O     │  slot selectors,
│ SUGAR  ●│siew│ga │kosong│  thumb reach zone
│ BREW   ●   │gao │po     │
│ TEMP   hot │peng        │
│ TAKE   cup │bag         │
├─────────────────────────┤
│      ▐  SERVE  ▌        │  full-width primary
└─────────────────────────┘
```

**Desktop and tablet.** Same content, arranged as a counter viewed head-on. Max content width 1100px, centred. Customer and order bubble on the left, drink preview centre, slot selectors right, Serve button spanning the bottom of the control column. Do not simply stretch the mobile layout.

### 6.6 Interaction and accessibility quality floor

- Touch targets minimum 44 by 44 CSS pixels.
- Full keyboard play: number keys select within the focused slot row, arrow keys move between rows, Enter serves. Keyboard shortcuts are shown on the help screen.
- Visible focus rings on every interactive element.
- `prefers-reduced-motion` respected. When set, the cup-to-bag transition and all feedback animations become instant state changes.
- Order text and all UI text meet WCAG AA contrast against their backgrounds.
- The game is playable one-handed on a phone. All controls sit in the lower two thirds of the viewport.

---

## 7. Screens

1. **Title.** Logo, Play, Daily Challenge, How to Play, Stats. Ambient detail only, no animation loop that burns battery.
2. **How to play.** The grammar, presented as a reference card. Every modifier with its meaning and an example. Reachable mid-game via a pause button.
3. **Game.** As wireframed above.
4. **Game over.** Score, orders served, best combo, high score, Play Again, Share if in daily mode.
5. **Stats.** Games played, high score, best combo, daily streak, accuracy percentage. All from localStorage.

---

## 8. Technical specification

### 8.1 Stack

- **Vite** with **React** and **TypeScript**, strict mode on
- **CSS Modules** with the design tokens above declared as custom properties in a single `tokens.css`
- **Vitest** for unit tests
- **Playwright** for end-to-end smoke tests
- **ESLint** and **Prettier**
- Fonts via `@fontsource`, bundled

Chosen for being well-trodden and low-configuration. Do not introduce a CSS framework, a state management library, a game engine, or an animation library without a story that justifies it.

### 8.2 Structure

```
src/
  game/          pure logic, zero DOM imports
    types.ts
    grammar.ts       format, parse, validate
    generator.ts     seeded order generation
    scoring.ts
    rng.ts           mulberry32
  components/    React components
  graphics/      SVG components, including the drink preview
  styles/
    tokens.css
  storage/       localStorage wrapper, versioned schema
docs/
  PRD.md
  SPRINTS.md
tests/
  e2e/
```

The `src/game/` directory must remain importable in Node with no browser globals. This is what makes the logic exhaustively testable and is the reason the project suits unattended agents at all.

### 8.3 Deployment

- GitHub Actions workflow building on push to `main` and deploying to GitHub Pages.
- Vite `base` set to the repository name so asset paths resolve on the Pages subpath.
- The deployed URL must be recorded in the README once live.

### 8.4 Quality gate

Every story is done when this passes:

```
npm run typecheck && npm run lint && npm run test && npm run build && npm run e2e
```

Additional standing requirements:

- `src/game/` maintains 100 percent line coverage.
- The round-trip property test from section 4.5 is green.
- The Playwright smoke test loads the deployed build, starts a game, sets all six slots, serves, and asserts the score changed.

---

## 9. Out of scope for v1

Backend of any kind. Accounts. Global leaderboards. Sound (candidate for a later sprint, and if added it must be synthesised with the Web Audio API rather than shipped as audio files). Additional drinks beyond kopi, teh, and Milo. Animated customer characters beyond a static illustration. Localisation. Analytics.

---

## 10. Open questions for the human

1. Does the grammar in section 4 match your understanding, particularly the ruling in 4.3.1 that condensed milk cannot take `siew dai` or `kosong`?
2. Is `milo` worth including in v1, or should v1 ship `kopi` and `teh` only and add `milo` as a later sprint?
3. Confirm the game name and the repository name.
4. Is the difficulty curve in 5.3 acceptable as a starting point? It is a guess and will need one human play session to tune. Tuning is explicitly a human decision, not an agent story.
