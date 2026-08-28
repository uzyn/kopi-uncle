# Kopi Uncle — Sprint Plan

**Derived from:** `docs/prd.md` v1.2 (2026-08-27)
**Team:** Solo human owner (U-Zyn Chua) plus unattended AI agent sprint loop
**Merge mode:** `sprintkit-autopilot`, direct to `main` — every sprint merge changes what `npm run dev` shows
**Total sprints:** 53
**Total estimate:** 205 augmented-hours
**Window:** Wed 2026-08-26 ~17:00 SGT → **code freeze Fri 2026-08-28 06:00 SGT** (~37h)
**Talk:** NUS-ISS Learning Festival 2026, Fri 2026-08-28, 09:30 SGT

---

## Read this before starting the loop

### This plan is a graph, and Sprint 1 is the only serial sprint

The v1.1 cut of this plan was a queue wearing a graph's clothes: 39 of its 46
sprints depended only on the sprint above them, four runners bought 1.34×, and
the first fan-out was six sprints deep. The v1.2 cut fixed that, and then broke
something else — see the next section.

**Sprint 1 sets up the shared surfaces so that later sprints rarely have to open
one.** Three surfaces caused almost all the false serialisation:

- `package.json` / `package-lock.json` — the known dependency surface is
  installed in Sprint 1 (S1-2), not spread across M0, so in practice no later
  sprint has cause to open the manifest.
- `vitest.config.ts` — Sprint 1 wires a *minimal but real* Vitest, so Sprint 3
  writes real tests immediately. Sprint 8 substitutes §10.7's exact configuration
  over it rather than being a prerequisite for it.
- `src/app/App.tsx` — Sprint 1 writes the screen registry with a placeholder
  module per screen, so a screen sprint fills its own file pair rather than
  editing the router.

**Sprint 1 therefore releases five sprints at once** — the linter, the frozen
contract, the CI gate, the design tokens and the browser runner. None of them
needs anything from the others. Their `**Touches:**` paths are pairwise disjoint,
which is what makes it safe to run them concurrently.

### No sprint asserts anything about a later sprint

All three bullets above are **conventions, not enforced freezes.** This is the
v1.3 change and it is the important one.

The v1.2 cut enforced them: a hash lock on `App.tsx`, a committed test asserting
the installed dependency set against a record in this file, and another test that
parsed this file to prove no later sprint declared the manifest. A trial run of
that plan spent four review cycles and three hours on Sprint 1 without merging.
The reason is structural. A sprint that binds the 51 sprints behind it can only
be judged against 51 sets of acceptance criteria that nobody has implemented yet,
no test can check prose against prose, and each fix moved the frozen surface and
created fresh contradictions — four of one round's six findings were manufactured
by the previous round's fixes.

So:

- **No hash locks, no "written once", no "unchanged from Sprint N".** If a later
  sprint needs to edit a file, it edits it and declares it in `**Touches:**`;
  the scheduler reads that as a real edge and serialises the pair.
- **No test may parse `docs/sprint.md`** to assert something about another
  sprint's plan text, `Touches:` line or acceptance criteria.
- **No sprint's acceptance criteria may reference a later sprint's criteria.**
  Naming a later sprint as the place something lands is fine and useful;
  asserting that it will still be true there is not.
- **A test that a later sprint's *required* behaviour must break is a defect in
  the sprint that wrote it.** This is the one forward-looking obligation that
  survives, and it is not a forward contract: it says write assertions that are
  true for the life of the project, or make them retire when the thing they
  describe legitimately goes away. Sprint 1's gate placeholders are the worked
  example.
- **A sprint that turns on a new gate rule owns the mechanical conformance it
  forces.** Sprint 2's type-aware linter finds errors across files Sprint 2 does
  not own; where the fix is a rule option matching the tree's existing
  convention, configure it in the file this sprint owns. Only where that is
  genuinely impossible does the sprint declare the affected paths in `Touches:`,
  and that is expected rather than scope creep.
- `Object.freeze` on runtime data (§10.3, §10.4, §10.5) is a different thing
  entirely and stays exactly as specified.

The cost is some parallelism. That is the right trade: a sprint that merges in
one review cycle and serialises against one neighbour beats a sprint that fans
out four ways and cannot merge.

### Dependencies are executable, and so is Touches

Every sprint declares `**Dependencies:**` and `**Touches:**`. Both are read by
`sprintkit-autopilot`, not by a human:

- **Declare the minimal true dependency.** "The sprint above" is not a reason.
  A logic sprint depends on Sprint 3 (the contract) and Sprint 7 (the purity
  lint); a presentation sprint on Sprint 3 and Sprint 5 (the tokens). Neither
  depends on its neighbour unless it genuinely edits the same file.
- **`Touches:` is enforced plan-wide** the moment any sprint declares it, and
  every sprint here does. A sprint that declared nothing would be treated as
  touching everything and would run alone. The scheduler refuses to co-schedule
  two sprints whose paths intersect, which is the merge-collision guard — it is
  also why §10.2 splits `src/components/` into per-cluster directories and gives
  each screen its own file pair. A flat `src/components/**` would re-serialise
  the entire presentation track against itself.
- **Where two sprints must edit the same file, that is a real dependency** and it
  is declared as one — Sprint 41 → Sprint 40 on `EngineContext.tsx`, Sprint 42 →
  Sprint 41 on `engine.ts`. Never leave it to luck.

### M3 work with no engine dependency is scheduled early, on purpose

`daily.ts`, the storage wrapper, the title screen and the How to Play reference
depend only on the contract, the RNG or the tokens — never on the engine. They
are marked `M3 (slack-fill)` and placed early.

This does not compete with the critical path. `sprintkit-autopilot` picks the ready
sprint with the **largest transitive downstream** first, and these are
near-leaves, so a runner takes one only when it would otherwise sit idle. They
fill slack rather than displace critical work, and the stop-anywhere ordering
below is unaffected. Do not "fix" this by re-chaining them into M3.

### Sprint size deviates from the 2.5-day default, deliberately

The `sprintkit-plan` default is a 2.5-day sprint, which at 12h/day is 30
augmented-hours. That unit is wrong for this project in two ways. It does not
divide into the window — 37 hours is 1.2 such sprints for a 207-hour plan —
and under direct-to-main autopilot the sprint boundary is also the merge boundary
and the visible-change boundary, so a 30-hour sprint means the page the dev
server serves changes six times across the entire build and a stall stays
invisible for hours.

Sprints here are therefore **~4 augmented-hours, 1–3 stories each**, and the cut
line lands on a fine boundary instead of a coarse one.

**Sprint 1 is ~2.5h and two stories** — the tree, the dependency surface, the
screen registry and a dev server that renders. It used to also carry the deploy,
the build stamp and three enforced freezes, at ~6h; that is what the v1.3 pass
removed. The serial head should be as short as it can be while still releasing
the fan, because nothing else can start until it merges.

The total estimate is 207h against the previous cut's 192h. The ~8%
increase is the cost of more sprint boundaries — every sprint runs the full gate —
and it is bought back many times over by the parallelism.

### Completion is not the success condition

PRD §4.2 is explicit: the unattended build is itself the demo, and M3 is
additive. **This plan is expected to stop part-way through, and it is ordered so
that stopping is never embarrassing.**

Sprint 1 puts a page in front of `npm run dev` before a single line of game code
exists, and every subsequent merge changes what it shows. Publishing is the last
sprint: a deployed URL that must stay green is a standing liability across an
unattended run, and it buys nothing the local server does not already give you.

### Delivery tiers — where the cut line falls

| Tier | Sprints | What exists when it lands |
|---|---|---|
| **0 — Floor** | 1 | `npm run dev` serves a page, the gate chain runs, every dependency installed. **This must land.** |
| **1 — Contract** | 2–13 | The frozen seam, CI, the lint rules, tokens, the stub and fixtures — and the fan is visibly running |
| **2 — Tracks** | 14–35 | Grammar exhaustively verified; the bag and cup render; slot controls and queue cards work against fixtures |
| **3 — Playable** | 36–46 | Someone can run it locally and play the game |
| **4 — Ship** | 47–52 | Daily, share, stats, screens, accessibility |
| **5 — Publish** | 53 | The Pages deploy and the live URL. Cuttable — losing it costs a URL, not the demo |

Realistically the cut line falls inside Tier 2. Tier 0 is the commitment;
everything after it is upside.

### Standing instructions for the unattended loop

1. **Never ask a question.** Two overnight blocks fall inside this window and
   nobody is watching. When blocked on a product judgement, take the option that
   keeps the build green and reversible, and record the decision in the sprint
   file. PRD §13 is ruled, not open, for exactly this reason.
2. **Never merge red.** The full gate is the definition of done for every story.
3. **If `main` is broken — the gate red, or `npm run dev` not serving — fixing it
   preempts every other story**, including the current sprint. This overrides the
   zero-human-edit metric in PRD §4.2.
4. **Prefer not to edit `package.json` or `package-lock.json` after Sprint 1**,
   because two *concurrent* sprints editing a manifest is the one collision
   `Touches:` cannot save you from. It is not forbidden: a sprint that genuinely
   needs a dependency adds it and declares `package.json` in its `**Touches:**`,
   which makes the scheduler serialise it against anything else that does. Do not
   escalate, and do not work around a missing dependency.
5. **Cut in the pre-authorised order** (PRD §11.3) and do not ask first: Daily
   mode and share → the stats screen → the desktop three-column composition (a
   centred single-column fallback passes) → the cup↔bag animation → Sprint 53's
   deploy. Never cut a working `npm run dev`, the §7.6 round-trip suite, the six
   slot controls, or the bag render.
6. **Review the sprint under review, and nothing else.** A finding blocks the PR
   only if it fails one of *this* sprint's acceptance criteria, makes the gate
   red, or is a correctness or security defect in the code this PR ships.
   Anything about a later sprint's plan text, acceptance criteria or files is a
   **plan finding**: record it in the Non-blocking Review Backlog at the foot of
   this file and merge. Plan findings are drained between sprints, not inside a
   PR. Cycle 3 of any sprint may only re-check blockers already named in cycle 2;
   a new blocker class found at cycle 3 or later is a plan finding by definition.
7. **Reserve the final 60–90 minutes before freeze** for the one thing PRD §13.1
   and §10.4 explicitly reserve for a human: a play session tuning §8.5's
   arrival gaps and patience values as a one-file change to `config.ts`. No
   agent story may tune these.

### Quality gate for every story

```
npm run typecheck && npm run lint && npm run test && npm run build && npm run e2e
```

Plus the standing requirements in PRD §10.7: 100% line coverage on `src/game/`,
the exhaustive 240-drink round-trip, tier pools asserting 16/144/240, and the
committed golden fixtures.

---

## Sprint 1 — Scaffold and a running dev server [DONE]

**Goal:** Create the tree, install the dependencies both tracks need, and get `npm run dev` rendering a page — so that this is the last sprint anything has to wait for.

**Track:** M0 foundation
**Estimate:** 2.5h augmented
**Dependencies:** none
**Touches:** `**` (the whole tree — this sprint runs alone by construction, and is the only sprint that may declare `**`)

### S1-1 — Vite + React + TypeScript strict scaffold

*As the implementing agent, I want a configured project tree with every gate script declared, so that later sprints fill in tooling rather than restructuring the repo.*

**Technical context:** The five gate scripts of §10.7 must exist from this sprint even though the real linter arrives in Sprint 2 and the browser runner in Sprint 6. Each placeholder lives in **its own file** — `scripts/lint.mjs` and `scripts/e2e.mjs` — so that the sprint replacing it edits a file nothing else touches, instead of the shared manifest. Two concurrent sprints editing `package.json` is the one collision `Touches:` cannot prevent, and Sprints 2 and 6 are concurrent by construction. `npm run test` is *not* a placeholder: S1-2 wires a minimal Vitest here so Sprint 3 writes real tests on day one.

`src/app/App.tsx` is written here as the screen registry with a placeholder module per screen, so that a screen sprint fills its own file pair rather than editing the router. **That is a convention, not a freeze.** Nothing asserts the file is unchanged, and a later sprint that genuinely needs to change the registry changes it and declares `src/app/App.tsx` in its `**Touches:**`.

**Acceptance criteria:**
- [x] `package.json` declares all five scripts named in §10.7 — `typecheck`, `lint`, `test`, `build`, `e2e` — and the chain `npm run typecheck && npm run lint && npm run test && npm run build && npm run e2e` exits 0. `lint` runs `node scripts/lint.mjs` and `e2e` runs `node scripts/e2e.mjs`; both print a banner naming the sprint that replaces them (S2-1, S6-1) and exit 0. `test` is real from this sprint per S1-2.
- [x] Each placeholder refuses to pass vacuously once its real tooling exists: `scripts/lint.mjs` exits 1 if an `eslint.config.*` is present, `scripts/e2e.mjs` exits 1 if `tests/e2e/` contains any `*.spec.ts` (searched **recursively** — a nested spec must trip it too) — so S2-1 and S6-1 cannot report a green gate without actually wiring their tool. Both trips are asserted by a committed test.
- [x] **Every assertion about placeholder *behaviour* self-retires**, guarded on a marker in the script, so that S2-1 and S6-1 replacing those files does not red a test in `tests/scaffold/**` that neither sprint owns. Assertions about properties that must hold forever — the two gate commands sharing no file, neither command naming `eslint` or `playwright` directly — do not retire. A test that the next sprint's required behaviour must break is a defect in this sprint, not a problem for that one.
- [x] `tsconfig.json` sets `"strict": true` per §10.1; `npm run typecheck` runs `tsc --noEmit` and exits 0.
- [x] `vite.config.ts` derives `base` from `GITHUB_REPOSITORY` per §10.6 — `/<repo>/` when set, `/` when unset — with no repository name anywhere as a literal; `GITHUB_REPOSITORY=acme/demo npm run build` yields a `dist/index.html` whose every `src=` and `href=` begins with `/demo/`, and a build with the variable unset yields paths beginning with `/` — both asserted by grep, zero non-conforming matches.
- [x] The §10.2 tree exists and is tracked by git, **including the per-cluster component directories** that keep concurrent sprints file-disjoint: `src/game/`, `src/app/`, `src/dev/`, `src/dev/gallery/`, `src/components/slots/`, `src/components/queue/`, `src/components/hud/`, `src/components/break/`, `src/components/share/`, `src/graphics/`, `src/storage/`, `src/styles/`, `tests/support/`, `tests/fixtures/`, `tests/contract/`, `tests/game/`, `tests/dev/`, `tests/storage/`, `tests/styles/`, `tests/presentation/`, `tests/lint/fixtures/`, `tests/e2e/` — `git ls-files` lists a placeholder in each.
- [x] `src/app/App.tsx` is the screen registry: it maps `Phase` to a screen component and imports a placeholder module for each of `TitleScreen`, `HowToPlay`, `GameScreen`, `GameOver`, `Pause` and `StatsScreen`, each with its own `<Screen>.module.css`. A test asserts every `Phase` value resolves to a component. Nothing asserts the file is unchanged by any later sprint.
- [x] CSS Modules is live, not merely configured: one `*.module.css` is imported by a component and its hashed class name appears in a built `dist/assets/*.css` file — grep assertion.
- [x] Dependency surface matches §10.1: `dependencies` are exactly `react` and `react-dom`; no CSS framework, state-management library, game engine or animation library is present in either dependency block — asserted by an explicit deny-list check over `package.json`.

### S1-2 — The dependency surface and a real Vitest

*As the scheduler, I want every dependency either track is known to need present after this sprint, so that concurrent sprints have no cause to open `package.json` and the fan-out is safe.*

**Technical context:** Installing the known surface once means no later sprint has a reason to touch the manifest. It is a convention rather than an enforced freeze — no test asserts the installed set against a record, and no test parses this file to police a later sprint's `Touches:`. A sprint that genuinely needs a dependency adds it and declares `package.json`, which the scheduler then serialises. Vitest is installed *and wired* rather than merely installed: a minimal `vitest.config.ts` with no coverage thresholds makes `npm run test` real from the first merge, so Sprint 3 writes real tests without waiting on Sprint 8's hardening.

**Acceptance criteria:**
- [x] Every dependency named anywhere in this plan is installed in this sprint: `react`, `react-dom` as the only two `dependencies` per §10.1; and as `devDependencies` — `vite`, `@vitejs/plugin-react`, `typescript`, `@types/react`, `@types/react-dom`, `@types/node`, `eslint` (`^9`), `@eslint/js`, `globals`, `typescript-eslint`, `eslint-plugin-react-hooks`, `eslint-config-prettier`, `prettier`, `vitest`, `@vitest/coverage-v8`, `jsdom`, `@testing-library/react`, `@testing-library/dom`, `@testing-library/user-event`, `@playwright/test`, `@fontsource/anton`, `@fontsource/nunito-sans`.
- [x] A minimal `vitest.config.ts` exists and `npm run test` runs it for real — not a placeholder — with at least one passing committed test; coverage thresholds, the node/jsdom split and the §10.7 exclusions are deliberately absent and land in Sprint 8, which this file names in a comment.
- [x] `npx playwright install --with-deps chromium` is documented in the README as the one out-of-band install step — no other browser binary is ever required.
- [x] **Prettier is wired here, not in Sprint 2.** `.prettierrc`, `.prettierignore` and the `format` / `format:check` scripts exist, and `prettier --check .` exits 0. A formatter rewrites every file it is pointed at, so it cannot be file-disjoint from any concurrent sprint and belongs in the one sprint that runs alone. `.prettierignore` excludes `docs/` and `.claude/` — planning documents and vendored agent skills are not this project's code, and reformatting them would produce a diff in the thousands of lines. `eslint-plugin-prettier` is deliberately not installed; Sprint 2 adds `eslint-config-prettier` last in its flat config so the linter never fights the formatter.
- [x] **Sprint exit criterion — the thing that makes this sprint worth merging:** `npm install && npm run dev` serves a page that renders the wordmark `KOPI UNCLE` as `#4A2C18` on `#FFF3D6` — §9.2's teak-on-cream pair at 11.44:1, the only approved pairing for body text. The colour pair is asserted by a Vitest render test that computes the contrast ratio from the parsed CSS rather than asserting the number by eye; S5-1 replaces the literals with tokens. The README documents the two-command start.
- [x] The full gate passes: `npm run typecheck && npm run lint && npm run test && npm run build && npm run e2e`.

---

## Sprint 2 — ESLint 9, type-aware [IN PROGRESS]

**Goal:** Put a real, type-aware linter behind `npm run lint`, so that Sprint 7's boundary and purity rules have the analysis they need.

**Prettier is not here.** It moved to Sprint 1 — see the note under that sprint. A formatter rewrites whatever it is pointed at, so it cannot be file-disjoint from anything and must land in the sprint that already runs alone.

**Track:** M0 fan
**Estimate:** 2.5h augmented
**Dependencies:** Sprint 1
**Touches:** `eslint.config.js`, `scripts/lint.mjs`, `tests/scaffold/lint-config.test.ts`

### S2-1 — ESLint 9 flat config with type-aware rules

*As the implementing agent, I want lint that reads types, so that the §10.5 boundary rules in Sprint 7 have the analysis they need and Prettier never fights the linter.*

**Technical context:** Prettier is wired as a formatter and `eslint-config-prettier` disables conflicting stylistic rules; `eslint-plugin-prettier` is deliberately not installed, because routing formatting through lint makes every reformat a gate failure with a stack trace attached.

**Acceptance criteria:**
- [ ] `eslint.config.js` exists at the repo root, exports a flat-config array, and ESLint `^9` is the installed major — asserted from `package-lock.json`.
- [ ] typescript-eslint is configured type-aware: `npx eslint --print-config src/game/types.ts` shows a `projectService` or `project` parser option set, and shows `@typescript-eslint/no-floating-promises` at `error` — a rule that cannot exist without type information.
- [ ] `eslint-plugin-react-hooks` contributes `react-hooks/rules-of-hooks` and `react-hooks/exhaustive-deps` at `error` for `src/components/**` and `src/app/**` — asserted via `--print-config`.
- [ ] `eslint-config-prettier` is the last entry of the flat-config array; `npm ls eslint-plugin-prettier` exits non-zero, proving the plugin is absent.
- [ ] `npm run lint` runs `eslint .` with `--max-warnings 0` and exits 0; `npm run format:check` runs `prettier --check .` and exits 0.

---

## Sprint 3 — The frozen contract [IN PROGRESS]

**Goal:** Freeze `types.ts`, `config.ts`, `view.ts` and the three engine signatures — everything both tracks compile against — so that every logic and presentation sprint after this one can start from the same fixed surface.

**Track:** M0 fan
**Estimate:** 5.5h augmented
**Dependencies:** Sprint 1
**Touches:** `src/game/types.ts`, `src/game/config.ts`, `src/game/view.ts`, `src/game/engine.ts`, `tests/contract/**`

### S3-1 — `src/game/types.ts` exactly per §10.3

*As the implementing agent on either track, I want the state and action shapes fixed and type-tested, so that a contract drift shows up as a red typecheck rather than at M2 integration.*

**Technical context:** §10.3 warns that `SetSlot` does not narrow on destructuring — `{ slot, value }` widens to `keyof Drink` and a union of all six value types, so `draft[slot] = value` will not compile under `strict`. The generic `setSlot<K extends keyof Drink>` helper is the single place the unavoidable cast is allowed to live.

**Acceptance criteria:**
- [ ] `src/game/types.ts` declares, verbatim in shape, every type in §10.3: `Phase`, `Mode`, `Tier`, `ShiftId`, `Mood`, `ServeResult`, the seven-variant `GameEvent`, `Drink` and its six slot unions, `Customer`, `GameState` with all twenty fields, the `SetSlot` mapped union, `Action`, and the `setSlot` signature.
- [ ] A `tests/` type test using `expectTypeOf` asserts `SetSlot` expands to exactly six variants — one assertion per slot, e.g. `Extract<SetSlot, { slot: 'sugar' }>['value']` equals `Sugar` — and asserts `Extract<SetSlot, { slot: 'flavour' }>` is `never`.
- [ ] A type test asserts `Action['type']` equals the union of exactly seven literals: `'START_RUN' | 'FOCUS' | 'SET_SLOT' | 'SERVE' | 'DISMISS_BREAK' | 'PAUSE' | 'RESUME'`.
- [ ] Exhaustiveness over `Action` is proven at compile time by a `satisfies never` assignment with no runtime statement, per §10.7's ban on unreachable `default: throw` arms.
- [ ] `setSlot` is implemented with exactly one cast and is asserted over all 240 valid drinks × six slots to return a new object whose other five slots are strictly equal to the input's.
- [ ] `npm run test` runs Vitest with typechecking enabled, so a failing `expectTypeOf` assertion is a gate failure; `src/game/types.ts` is in the coverage `exclude` list per §10.7.

### S3-2 — `src/game/config.ts` and the three selectors

*As the human tuner, I want every §8 number in one frozen file behind three selectors, so that tuning the difficulty curve is a one-file change and never an agent story (§10.4, §13.1).*

**Technical context:** The shift table is not flat: tea splits tier mid-shift, supper decays patience per customer, and Endless pins `shiftIndex` at 3 while holding both gap and patience at their floors. Those three formulas live in the selectors and nowhere else.

**Acceptance criteria:**
- [ ] `src/game/config.ts` exports one frozen object holding, at minimum: queue cap 3, hearts 3, `PATIENCE_FLOOR_MS` 2000, wrong-serve penalty fraction 0.35, lockout 600ms, combo step 1 tenth, combo range 10…30 tenths, base points 100, shift-clear bonus 500, `TICK_MS` 16, `MAX_FRAME_MS` 250, and the four-shift table of customer count (6/8/10/10), tier, patience and arrival gaps per §8.5.
- [ ] `Object.isFrozen` holds for the exported object and for the shift table entries — asserted recursively.
- [ ] `tierFor` is asserted at customers 1, N and N+1 of every shift: breakfast → 1; lunch → 2; tea → 2 at customer 5 and 3 at customer 6 (the R17-relevant split asserted at both sides of the boundary); supper → 3; and the Endless case `tierFor(3, 11) === 3`.
- [ ] `gapMsFor` implements §8.5's `gap(i) = start + (end − start) × (i − 1) / (N − 1)` and is asserted at i=1 and i=N for all four shifts (6000→4000, 5000→3000, 4000→2500, 3000→2000 ms), and at i=N+1 where it clamps to the end value; `gapMsFor(3, 11) === 2000` for the Endless floor-held case.
- [ ] `patienceMsFor` returns constants 18000/16000/14000 for the first three shifts at i=1, N and N+1, and for supper implements the −200ms-per-customer decay with a 10000 floor: 12000 at i=1, 10200 at i=10, 10000 at i=11, and 10000 at i=25 — the Endless floor-held case.
- [ ] A named test asserts §10.4's single-source rule: the shift-table values (18000, 16000, 14000, 12000, 6000, 5000, 4000, 3000, 2500, 2000) and the fraction 0.35 appear in no file under `src/` or `tests/` other than `src/game/config.ts` — test fixtures included.
- [ ] `config.ts` reports 100% line coverage under the `perFile: true` threshold.

### S3-3 — `src/game/view.ts` implemented for real per §10.5

*As a Track B agent, I want the display helpers real rather than stubbed, so that I can render an order, a mood face and a slot row on day one without an engine.*

**Technical context:** M1a will extend `grammar.ts` and re-export through `view.ts`; it never rewrites what this story freezes. `moodFor` is the single place the patience ratio is computed — §9.6 forbids either track from re-deriving it.

**Acceptance criteria:**
- [ ] `src/game/view.ts` exports exactly six names — `formatOrder`, `isValidDrink`, `nonDefaultCount`, `moodFor`, `SLOT_ROW_LABELS`, `SLOT_VALUE_LABELS` — asserted by comparing the sorted keys of a namespace import to that list, so nothing leaks into the frozen surface.
- [ ] `formatOrder` emits §7.2's canonical `Base → Milk → Sugar → Strength → Temperature → Vessel` order with defaults omitted, asserted verbatim against all five §7.2 examples plus §9.3's longest tier-3 order `Teh O kosong gao peng da bao`.
- [ ] `isValidDrink` enforces §7.3 and nothing else: a sweep over all 288 raw combinations asserts exactly 240 true and 48 false, and asserts `ga-dai` with `condensed` is valid.
- [ ] `nonDefaultCount` excludes base and returns 0..5; a histogram over the 240 valid drinks asserts §7.4's distribution exactly: `{0: 2, 1: 14, 2: 46, 3: 82, 4: 72, 5: 24}`.
- [ ] `moodFor` implements §9.6's half-open bands and is unit-tested at exactly `p = 0.60 → 'impatient'` and `p = 0.30 → 'angry'` — both boundaries to the lower band — plus `p = 0.601 → 'calm'` and `patienceMs = 0 → 'angry'`.
- [ ] `moodFor` with `maxPatienceMs <= 0` returns `'angry'` rather than producing `NaN`; the behaviour is asserted by a test and the ruling is recorded in `docs/sprint.md` per §13's never-ask instruction.
- [ ] `SLOT_ROW_LABELS` is a `Record<keyof Drink, string>` holding exactly the §9.5 wireframe row labels `BASE`, `MILK`, `SUGAR`, `BREW`, `TEMP`, `TAKE`.
- [ ] `SLOT_VALUE_LABELS` covers all 16 slot values (2+3+4+3+2+2); a test iterates every slot union and asserts a non-empty, within-slot-unique label exists for each, and that §7.1's spoken forms are used where one exists — `C`, `O`, `siew dai`, `ga dai`, `kosong`, `gao`, `po`, `peng`, `da bao`.
- [ ] `view.ts` imports nothing from `engine.ts`, React or the DOM — Sprint 7's boundary rule is written against exactly this shape and must be green over it once it lands — and reports 100% line coverage.
- [ ] The full gate passes: `npm run typecheck && npm run lint && npm run test && npm run build && npm run e2e`.

### S3-4 — `src/game/engine.ts` signatures with NotImplemented bodies

*As a Track A agent, I want the three signatures already committed and typechecked, so that M1a fills bodies rather than negotiating shapes.*

**Acceptance criteria:**
- [ ] `src/game/engine.ts` exports exactly three names with §10.3's signatures: `createInitialState(mode: Mode, seed: number): GameState`, `tick(state: GameState, dtMs: number): GameState`, `applyAction(state: GameState, action: Action): GameState` — export surface asserted against that exact list.
- [ ] Each body throws an `Error` whose message contains `NotImplemented` and the M1a story ID that will implement it, so the stub can never be mistaken for a working engine.
- [ ] A unit test asserts all three throw with a message matching `/NotImplemented/`, which also keeps `engine.ts` at 100% line coverage under the `perFile` threshold from this sprint onward.
- [ ] `npm run typecheck` is green with the signatures referenced from `src/app/EngineContext.tsx`.

---

## Sprint 4 — The CI gate [NOT STARTED]

**Goal:** Run the whole §10.7 gate on every push and pull request, so that "done" means the same thing for an agent as it does for a human.

**Track:** M0 fan
**Estimate:** 2.5h augmented
**Dependencies:** Sprint 1
**Touches:** `.github/workflows/**`

### S4-1 — Workflow running all five gate commands

*As the project owner, I want every push and PR to main to run the whole gate, so that "done" means the same thing for an agent as it does for me.*

**Acceptance criteria:**
- [ ] `.github/workflows/ci.yml` triggers on `push` to `main` and on `pull_request` targeting `main`.
- [ ] The gate job runs `typecheck`, `lint`, `test`, `build`, `e2e` as five separately named steps in §10.7's order, so the failing stage is identifiable from the job summary without opening logs.
- [ ] The job runs `npm ci` and pins Node via `node-version-file`; no step uses `--no-verify`, `continue-on-error`, or `|| true` — asserted by grepping the workflow for those strings and finding zero hits.
- [ ] The gate is proven to bite: a scratch branch introducing a deliberate type error produces a red run; the run URL is recorded in `docs/sprint.md` under this story and the branch is deleted.
- [ ] CI asserts the gzipped `dist/assets` total against §9.8's 200KB budget and fails above it; the current measured total is printed in the job summary.

### S4-2 — Caching and failure artifacts

*As the implementing agent, I want a fast gate and a legible failure, so that an unattended loop diagnoses a red run from artifacts instead of re-running it.*

**Acceptance criteria:**
- [ ] `actions/setup-node` is configured with `cache: 'npm'`; a second consecutive run on an unchanged lockfile logs a cache hit.
- [ ] Playwright browsers are cached with a key derived from the resolved Playwright version in `package-lock.json`; on a cache hit the install step is skipped, asserted from the run log.
- [ ] On failure, `actions/upload-artifact` with `if: failure()` uploads `playwright-report/`, `test-results/` and `coverage/`; the red run from S4-1 carries all three artifacts.
- [ ] Artifact retention is set explicitly rather than left to the account default.

---

## Sprint 5 — Design tokens, both fonts and the contrast matrix [IN PROGRESS]

**Goal:** Commit the palette, type scale and both fonts with WCAG contrast asserted, so that §9.7's AA floor is a gate failure rather than a review opinion.

**Track:** M0 fan
**Estimate:** 3.5h augmented
**Dependencies:** Sprint 1
**Touches:** `src/styles/**`, `src/app/TitleScreen.module.css`, `tests/styles/**`

### S5-1 — `tokens.css`, both fonts, the type scale and the contrast matrix test

*As a Track B agent, I want the palette, type scale and fonts committed with contrast asserted, so that §9.7's WCAG AA floor is a gate failure rather than a review opinion.*

**Technical context:** The contrast test parses the hex values out of `tokens.css` rather than restating them, so editing a token to a failing value fails the test instead of silently diverging from it. §9.2's kaya-yellow-on-cream pair at 1.61:1 is the defect v1.1 corrected, so the test asserts the exclusions too.

**Acceptance criteria:**
- [ ] `src/styles/tokens.css` declares exactly the six §9.2 custom properties with exact values: `--kopitiam-green: #0E6B4F`, `--tile-teal: #2A9D8F`, `--kaya-yellow: #F4B93E`, `--chilli-red: #D62828`, `--condensed-cream: #FFF3D6`, `--teak: #4A2C18`.
- [ ] Seven type-scale tokens exist — `--step-12`, `--step-14`, `--step-16`, `--step-20`, `--step-28`, `--step-40`, `--step-64` — with values 12, 14, 16, 20, 28, 40 and 64px, asserted by parsing the file.
- [ ] Both faces are subset-imported from `@fontsource`: `@fontsource/anton/latin-400.css`, and Nunito Sans latin weights 400 and 700 only; the fallback stacks are exactly `'Anton', 'Arial Narrow', system-ui, sans-serif` and `'Nunito Sans', system-ui, -apple-system, sans-serif`, with `font-display: swap`.
- [ ] No runtime font fetch (§3.3): `dist/` contains zero occurrences of `fonts.googleapis.com` or `fonts.gstatic.com`, and the font files are emitted into `dist/assets` — both grep assertions.
- [ ] The contrast-matrix unit test parses the token values from `tokens.css` and asserts all six §9.2 approved pairs to within ±0.01: teak/cream 11.44, teak/kaya 7.12, `#FFFFFF`/green 6.49, cream/green 5.89, `#FFFFFF`/chilli 5.01, chilli/cream 4.54.
- [ ] The same test asserts the two forbidden pairs fail the 4.5:1 floor — kaya-yellow on cream at 1.61 and tile-teal on cream at 3.01 — so the table's exclusions are load-bearing rather than decorative.
- [ ] No §9.2 hex literal appears anywhere under `src/` outside `tokens.css`, closing S1-2's inlined wordmark colours in `src/app/TitleScreen.module.css` — grep assertion, zero hits. Placeholder screen modules carry no §9.2 literal of their own; if one has appeared, it is converted here too.
- [ ] The full gate passes: `npm run typecheck && npm run lint && npm run test && npm run build && npm run e2e`.

---

## Sprint 6 — Playwright under the base path [IN PROGRESS]

**Goal:** Put a real browser runner behind `npm run e2e` against the built app on its real subpath, so that a base-path regression fails the gate rather than production.

**Track:** M0 fan
**Estimate:** 3h augmented
**Dependencies:** Sprint 1
**Touches:** `playwright.config.ts`, `tests/e2e/**`, `scripts/e2e.mjs`

### S6-1 — Playwright, chromium only, under the base path

*As the implementing agent, I want e2e to run against the built app on its real subpath, so that a base-path regression fails the gate rather than production.*

**Acceptance criteria:**
- [ ] `playwright.config.ts` has `testDir: 'tests/e2e'` and a `projects` array of length exactly 1, chromium — asserted by a unit test importing the config.
- [ ] `webServer` runs `vite preview` against a fresh build on a fixed strict port, with `url` including whatever base path the build resolved — read from the Vite config, never written as a literal — and `reuseExistingServer: !process.env.CI`.
- [ ] `use.baseURL` ends with that same resolved base path, so a relative `page.goto('./')` resolves under it; running the suite with `GITHUB_REPOSITORY=acme/demo` set still passes, proving nothing is pinned to one repository name.
- [ ] `tests/e2e/smoke.spec.ts` navigates relatively and asserts the `KOPI UNCLE` wordmark is visible; `npm run e2e` exits 0 from a clean checkout with no server already running.
- [ ] Only chromium binaries are required: `npx playwright install --with-deps chromium` is sufficient for `npm run e2e` to pass on a machine with no other browsers installed.
- [ ] The full gate passes: `npm run typecheck && npm run lint && npm run test && npm run build && npm run e2e`.

---

## Sprint 7 — Boundary and purity lint [NOT STARTED]

**Goal:** Make §10.5's seam and §3's no-wall-clock rule mechanically unbreakable before either track writes logic against them.

**Track:** M0 fan
**Estimate:** 4h augmented
**Dependencies:** Sprint 2
**Touches:** `eslint.config.js`, `tests/lint/**`

### S7-1 — no-restricted-imports in both directions

*As the implementing agent, I want the track boundary enforced by lint, so that M1a and M1b cannot silently couple and make M2's integration expensive (§12.1).*

**Acceptance criteria:**
- [ ] A flat-config override for `src/game/**` bans importing `react`, `react-dom`, `src/components/*`, `src/graphics/*`, `src/app/*`, `src/dev/*`, `src/storage/*`, and any `*.css` or `*.module.css` — so §10.2's "importable in Node with no browser globals" is checked, not conventional.
- [ ] A flat-config override for `src/components/**` and `src/graphics/**` bans importing anything under `src/game/` except `src/game/types` and `src/game/view` — exactly §10.5's three-part seam minus the engine signatures.
- [ ] `src/app/EngineContext.tsx` is the only path permitted to import `src/game/engine` or `src/dev/stubEngine`; every other file under `src/` is denied by the config, and a unit test greps the tree to assert zero other importers.
- [ ] Each restriction carries a `message` naming §10.5, so a failure tells the agent which contract it broke.
- [ ] `npm run lint` exits 0 on the current tree with all overrides active.

### S7-2 — no-restricted-syntax purity selectors

*As the implementing agent, I want the wall-clock ban expressed as AST selectors, so that §3's constraint 7 fails lint rather than surfacing as a non-reproducible Daily run.*

**Technical context:** §10.5 is explicit that `no-restricted-globals` catches only `setTimeout` — `Date.now()`, `performance.now()` and `Math.random()` are member expressions and slip straight through it. The selectors must match on `CallExpression > MemberExpression` shape.

**Acceptance criteria:**
- [ ] `src/game/**` carries `no-restricted-syntax` selectors matching `Date.now()`, `performance.now()` and `Math.random()` as member-expression calls, and `setTimeout`/`setInterval`/`requestAnimationFrame` as identifiers.
- [ ] Each selector's message names §3 constraint 7 and R20, stating that time arrives as `dtMs` and randomness as `rngState` inside `GameState`.
- [ ] `no-restricted-globals` is not used as the mechanism for the three member expressions — asserted by a test that the config's `src/game/**` block contains the syntax selectors.
- [ ] `npm run lint` exits 0 on the current tree.

### S7-3 — Four committed fixtures that must fail lint

*As the project owner, I want proof that the rules bite, so that a rule which looks right and does nothing cannot ship (§10.5).*

**Technical context:** The fixtures must be linted through the ESLint Node API with their real on-disk paths, because the overrides are path-glob scoped — `lintText` with a synthetic filename that does not match `src/game/**` would pass and prove nothing.

**Acceptance criteria:**
- [ ] Exactly four fixtures are committed: `tests/lint/fixtures/game-imports-react.ts` (boundary, logic→presentation), `tests/lint/fixtures/component-imports-engine.tsx` (boundary, presentation→engine), `tests/lint/fixtures/game-uses-date-now.ts` (`Date.now`, `performance.now`, `Math.random`), and `tests/lint/fixtures/game-uses-set-timeout.ts` (`setTimeout`).
- [ ] `tests/lint/boundary.test.ts` constructs an `ESLint` instance against the project config and lints each fixture, asserting for each at least one message whose `ruleId` is exactly `no-restricted-imports` (fixtures 1–2) or `no-restricted-syntax` (fixtures 3–4) — the assertion is on the specific ruleId, never on the error count alone.
- [ ] The same test asserts fixture 3 produces three distinct violations, one per banned member expression, so a selector that catches only `Date.now` fails the test.
- [ ] A negative control is asserted: a compliant sample under `src/game/` lints with zero messages, so the test cannot pass by the rules firing on everything.
- [ ] The fixtures are excluded from `npm run typecheck` and from `npm run lint`'s own file set, so both stay green with deliberately illegal files committed — asserted by running both and observing exit 0.
- [ ] The full gate passes: `npm run typecheck && npm run lint && npm run test && npm run build && npm run e2e`.

---

## Sprint 8 — Vitest coverage hardening [NOT STARTED]

**Goal:** Replace Sprint 1's minimal Vitest with §10.7's exact coverage configuration, now that `src/game/` has real files to hold to 100%.

**Track:** M0 fan
**Estimate:** 2.5h augmented
**Dependencies:** Sprint 3, Sprint 6
**Touches:** `vitest.config.ts`

### S8-1 — Vitest with the §10.7 coverage config

*As the implementing agent, I want the coverage threshold specified rather than inferred, so that `src/game/`'s 100% promise fails the run instead of being reviewed by eye.*

**Technical context:** §10.7 pins the config exactly; the two traps are `tests/e2e/**` being collected by Vitest (Playwright specs then fail as unit tests) and `src/dev/**` counting against the threshold even though an M2 story deletes it. This sprint is a substitution over S1-2's minimal config, not an addition — it depends on Sprint 3 so the `perFile` threshold is proven against real files rather than an empty directory. It also depends on Sprint 6, which is what puts a real `*.spec.ts` under `tests/e2e/` and replaces `scripts/e2e.mjs`'s placeholder: committing a spec here instead would trip S1-1's refuse-to-pass guard, and neither `scripts/e2e.mjs` nor `tests/e2e/**` is in this sprint's `Touches:`. Sprint 6 is in Sprint 1's fan, so this edge costs no wall-clock. *(PF-1, drained at the Sprint 1 sync.)*

**Acceptance criteria:**
- [ ] Coverage config matches §10.7 exactly: provider `v8`, `all: true`, `include: ['src/game/**/*.ts']`, `exclude` containing `'src/game/types.ts'`, `perFile: true`, `autoUpdate: false`, and line threshold `100`.
- [ ] `src/dev/**` is excluded from coverage and the exclusion carries an inline comment naming the M2 story that deletes `src/dev/` — asserted by a test that greps the config for both the glob and a story ID matching `/S\d+-\d+/`.
- [ ] Node/jsdom split is real: a test in the node project asserts `typeof window === 'undefined'` and a test in the jsdom project asserts `typeof window === 'object'`; both green in one `npm run test` run.
- [ ] **The split places every already-committed suite, and reds nothing this sprint does not own.** `tests/scaffold/build.test.ts` imports `basePathFor` from `vite.config.ts` and spawns two `npm run build` subprocesses, so it belongs to the **node** project; `tests/scaffold/title-screen.test.tsx` carries a `// @vitest-environment jsdom` pragma and belongs to the **jsdom** project. Assert from `--reporter=json` that no committed test file falls outside a project and that the whole suite is green in one run. The project globs live in `vitest.config.ts`, which this sprint owns — do not edit `tests/scaffold/**`, which it does not. *(PF-3, drained at the Sprint 1 sync.)*
- [ ] `tests/e2e/**` is excluded from Vitest collection — Sprint 6's committed `tests/e2e/smoke.spec.ts` does not appear in `npm run test`'s collected-file list, asserted from `--reporter=json` output. This sprint commits nothing under `tests/e2e/`; it asserts against the spec Sprint 6 already shipped.
- [ ] `npm run test` runs with `--coverage` and exits 0 at the 100% `perFile` threshold over Sprint 3's `config.ts`, `view.ts` and `engine.ts` — the threshold is proven to bite here rather than deferred: temporarily deleting one covered line from a `view.ts` test turns the run red, recorded and reverted.

---

## Sprint 9 — The stub engine and the fixture catalogue [NOT STARTED]

**Goal:** Ship the scripted replay and the named state catalogue the presentation track develops against, so that queue cards, moods, break cards and game-over screens are all reachable without an engine.

**Track:** M0 fan
**Estimate:** 4h augmented
**Dependencies:** Sprint 3
**Touches:** `src/dev/stubEngine.ts`, `src/dev/fixtures.ts`, `tests/dev/**`

### S9-1 — `src/dev/stubEngine.ts` and the `src/dev/fixtures.ts` catalogue

*As a Track B agent, I want a scripted replay and a named state catalogue, so that patience rings, mood faces, break cards and game-over screens are all reachable without an engine.*

**Technical context:** §10.5 is explicit that a stub which merely typechecks unblocks nothing — the states Track B must render are functions of behaviour over time. The stub therefore walks a fixed timeline of fixtures on `advance(ms)`; it never simulates, and Track B never simulates either.

**Acceptance criteria:**
- [ ] `src/dev/fixtures.ts` exports the §10.5 catalogue as named `GameState` constants covering: empty queue; one, two and three customers; each of the three §9.6 mood bands; **both boundary values exactly** (`p = 0.60` and `p = 0.30`); active and no-active (`activeId === null`); mid-lockout; immediately post-wrong-serve; `phase: 'break'`; and a `gameover` with an R16-truncated `shiftResults`.
- [ ] A test asserts the two boundary fixtures resolve through `view.moodFor` to exactly `'impatient'` and `'angry'` respectively — Track B never recomputes the ratio itself (§9.6).
- [ ] The post-wrong-serve fixture satisfies R7 and R25: patience is `max(patienceMs − 0.35 × maxPatienceMs, 2000)`, `fumbled` is true, `comboTenths` is 10, `lockoutMs` is 600, hearts are unchanged, and `servesAttempted` is one greater than `servesCorrect`.
- [ ] The gameover fixture satisfies R16: `hearts === 0`, `phase === 'gameover'`, and the flattened `shiftResults` length is strictly fewer than 34 glyphs while remaining correctly grouped per shift (§8.9).
- [ ] Every fixture is asserted structurally valid: `queue.length <= 3` read from config, `queue` ascending by `id` (R22), `activeId` either null or present in `queue`, `comboTenths` an integer in 10…30 (§8.8), and all millisecond fields integers (R20).
- [ ] Fixtures read patience, gap, lockout and bonus values from `src/game/config.ts` and restate no §8 literal (§10.4) — covered by S3-2's single-source test.
- [ ] `src/dev/stubEngine.ts` exports the same three signatures as `engine.ts` and is a scripted replay: repeated `advance(ms)` calls walk the timeline through calm → impatient → angry → walkout → break → gameover, asserted by a test that folds a fixed list of advances and checks the phase and mood sequence.
- [ ] R22's property test — `queue` ascending by `id`, `nextCustomerId` monotonic — runs against the stub in this sprint and is re-used verbatim against the real engine in M1a, so the two cannot silently disagree.

---

## Sprint 10 — The fold harness [NOT STARTED]

**Goal:** Give the logic track the primitive every later sprint folds against — a deterministic step harness — so the engine can be tested as a fold over time rather than by waiting on a clock.

**Track:** Track A (logic)
**Estimate:** 2.5h augmented
**Dependencies:** Sprint 3
**Touches:** `tests/support/**`

### S10-1 — The fold harness

*As the implementing agent, I want to drive engine state with an explicit list of ticks and actions so that a whole shift is an ordinary unit test instead of an 18-second wait.*

**Technical context:** `runUntil` is the only unbounded construct in the suite; without a loop guard a regression that stops spawning turns a test failure into a hung CI job. `expectSameState` compares a canonical key-sorted serialisation rather than `toEqual` so that key insertion order and accidental `undefined` fields cannot mask a determinism break.

**Acceptance criteria:**
- [ ] `tests/support/harness.ts` exists and exports `fold`, `advance`, `runUntil`,
      `expectSameState`, and the `Step = { tick: number } | Action` type.
- [ ] `fold(state, steps)` applies steps in array order, dispatching `{ tick: n }`
      through `tick(state, n)` and every other step through `applyAction`; a test
      asserts the input state is not mutated by comparing a canonical
      serialisation captured before the call.
- [ ] `advance(state, totalMs)` slices `totalMs` into chunks of at most
      `MAX_FRAME_MS` (250) read from `src/game/config.ts`, never a literal, and a
      test asserts `expectSameState(advance(s, 5000), fold(s, [{ tick: 5000 }]))`
      — chunking is invariant because R20 carries `tickRemainderMs`.
- [ ] `runUntil(state, predicate, maxMs)` advances in `TICK_MS` (16) increments
      and returns `{ state, elapsedMs }` with `elapsedMs % 16 === 0` and
      `predicate(state) === true`.
- [ ] The loop guard is tested: `runUntil` with a predicate that never holds
      throws an `Error` whose message contains the `maxMs` budget, and the test
      itself completes under a 1000ms Vitest timeout.
- [ ] `expectSameState` serialises with a recursive key-sorted replacer: a test
      proves two states built with different key insertion order compare equal,
      and that a single differing nested field (`queue[1].patienceMs`) fails with
      a message naming that path.
- [ ] `tests/support/harness.ts` imports only from `src/game/`; a test asserts it
      names no module under `src/components/`, `src/graphics/` or `src/dev/`.
- [ ] The full gate passes: `npm run typecheck && npm run lint && npm run test && npm run build && npm run e2e`.

---

## Sprint 11 — Storage: versioned localStorage [NOT STARTED]

**Goal:** Land the versioned persistence wrapper now — it depends only on the frozen contract, so it fills an idle runner instead of waiting behind the engine.

**Track:** M3 (slack-fill)
**Estimate:** 3.5h augmented
**Dependencies:** Sprint 3
**Touches:** `src/storage/**`, `tests/storage/**`

### S11-1 — Versioned localStorage wrapper

*As a player, I want the game to keep working after an update or a corrupted save so that a bad blob never shows me a blank screen.*

**Technical context:** Three distinct failure modes must all land on defaults: the blob parses but its version is wrong, the blob does not parse, and `localStorage` itself throws (Safari private mode on `setItem`, `SecurityError` on `getItem` under blocked third-party storage, or the object being absent entirely under Node). Validate shape per key rather than trusting a version match — a truncated write can carry the right version and a missing field.

**Acceptance criteria:**
- [ ] `src/storage/schema.ts` exports `SCHEMA_VERSION`, the `Stats` type and a frozen `DEFAULT_STATS` covering every §8.10 field: `gamesPlayed`, `highScore`, `bestComboTenths`, `dailyStreak`, `lastDailyDate`, `lastDailyScore`, `servesCorrect`, `servesAttempted`, `settings`.
- [ ] `src/storage/index.ts` exports `load(): Stats`, `save(next: Stats): void` and `clear(): void`, reading and writing one namespaced key that includes `SCHEMA_VERSION`.
- [ ] Round-trip asserted: `save(x)` then `load()` deep-equals `x` for a fully populated `Stats`.
- [ ] `load()` returns `DEFAULT_STATS` for every hostile input, each its own named case: version mismatch, `'{'` (parse failure), `'null'`, `'[]'`, a valid-version object missing `servesAttempted`, and a valid-version object whose `highScore` is a string.
- [ ] `load()` returns `DEFAULT_STATS` when `globalThis.localStorage` is `undefined`, and when `getItem` is stubbed to throw.
- [ ] `save()` does not throw when `setItem` is stubbed to throw a `QuotaExceededError`; the test asserts the call returns normally and a subsequent `load()` still returns valid `Stats`.
- [ ] A single test wraps `load`, `save` and `clear` in `expect(...).not.toThrow()` across all of the above cases — this is the "never throws into the UI" gate of §8.10.
- [ ] `load()` never returns the `DEFAULT_STATS` object itself: assert `Object.is(load(), DEFAULT_STATS) === false` and that mutating the result leaves a second `load()` unaffected.
- [ ] The boundary bites: an ESLint `no-restricted-imports` entry forbids `src/game/**` importing `src/storage/**`, with a fixture under `tests/lint/fixtures/` and a Vitest test running the ESLint API over it asserting the specific `ruleId` fires.
- [ ] The full gate passes: `npm run typecheck && npm run lint && npm run test && npm run build && npm run e2e`.

---

## Sprint 12 — Title screen [NOT STARTED]

**Goal:** Fill the title screen's registry slot from tokens alone, so `npm run dev` shows a real front door long before the game behind it exists.

**Track:** M3 (slack-fill)
**Estimate:** 3.5h augmented
**Dependencies:** Sprint 5
**Touches:** `src/app/TitleScreen.tsx`, `src/app/TitleScreen.module.css`

### S12-1 — Title screen and mode entry

*As a player, I want a title screen with clear ways in so that I can start a run, take today's Daily, learn the grammar or check my stats.*

**Technical context:** The rAF loop that feeds `dtMs` must not be running at `phase === 'title'` — a title screen that ticks 60 times a second drains a phone while the player reads it, and §9.8's frame budget is for play. Gate the loop on `phase === 'playing'`.

**Acceptance criteria:**
- [ ] `src/components/TitleScreen.tsx` and its CSS module render at `phase === 'title'` with the logo in Anton at `--step-64` and four controls: Play, Daily Challenge, How to Play, Stats.
- [ ] Play dispatches `START_RUN` with `mode: 'endless'` and a fresh seed supplied by the React layer; a test asserts two consecutive presses produce different seeds.
- [ ] Daily Challenge dispatches `START_RUN` with `mode: 'daily'` and `seed === hashDateSeed(singaporeDateString(now))`; the `?date=` query param overrides the date at `START_RUN`, asserted by loading `?date=2026-08-28` and matching entry 1 of `tests/fixtures/daily-2026-08-28.json`.
- [ ] How to Play and Stats each navigate to their own screen with a Back control that returns to `phase === 'title'`; the e2e asserts both round trips. Their content lands in S32-1 and S50-1.
- [ ] No animation loop on the title: `tests/e2e/title.spec.ts` patches `requestAnimationFrame` before load, sits on the title for 2000ms and asserts the call count is 0.
- [ ] A source test asserts `TitleScreen.module.css` contains no `infinite` keyword and the component module contains no `setInterval`.
- [ ] All four controls measure at least 44×44 CSS pixels via `boundingBox()` at a 360px viewport, and `document.scrollWidth <= document.clientWidth` on the title at 360px.
- [ ] Button labels render `#FFFFFF` on `--kopitiam-green` (6.49:1) and the logo renders `--teak`; a test asserts no text node on the title pairs `--kaya-yellow` foreground with `--condensed-cream` background (1.61:1, forbidden by §9.2).
- [ ] Every control is reachable by Tab in visual order with a visible focus ring, and `Enter` activates the focused control.
- [ ] The full gate passes: `npm run typecheck && npm run lint && npm run test && npm run build && npm run e2e`.

---

## Sprint 13 — EngineContext, the VITE_E2E seam and the M0 exit probe [NOT STARTED]

**Goal:** Close M0 by naming the implementation in exactly one module and opening the seam that lets Playwright fast-forward time.

**Track:** M0 fan
**Estimate:** 3.5h augmented
**Dependencies:** Sprint 6, Sprint 7, Sprint 9
**Touches:** `src/app/EngineContext.tsx`, `tests/e2e/seam.spec.ts`

### S13-1 — `EngineContext.tsx` and the `VITE_E2E` test seam

*As the implementing agent, I want one module naming the implementation and one seam for fast-forwarding time, so that M2's swap is a one-file diff and Playwright never waits 18 real seconds for a walkout.*

**Technical context:** §10.7's smoke test is impossible without `advance(ms)` — breakfast patience is 18.0s and the customer walks out mid-test. The seam must be stripped from the production bundle, so it is gated on `import.meta.env.VITE_E2E` and the strip is asserted by grepping `dist/`.

**Acceptance criteria:**
- [ ] `src/app/EngineContext.tsx` exports `useEngine(): { state, dispatch }` and is the only module in the repo naming either `src/game/engine` or `src/dev/stubEngine` — Sprint 7's rule enforces it and a grep test asserts zero other importers.
- [ ] The implementation choice is a single expression in that file, so the M2 swap is a one-line diff; the M2 story ID that performs the swap and deletes `src/dev/` is named in a comment.
- [ ] Under `VITE_E2E`, `window.__KOPI__` is installed with `advance(ms)`, `getState()` and `dispatch(action)` exactly as §10.7 specifies; a Playwright spec calls `advance(20000)` and asserts the stub state advanced past the patience window without real waiting.
- [ ] `?seed=` and `?date=` query params are parsed and consumed at `START_RUN`; a malformed or non-numeric `seed` falls back to a defined default and never throws into the UI, asserted by a unit test.
- [ ] The seam is stripped from production: `npm run build` produces a `dist/` in which `__KOPI__` appears zero times; `VITE_E2E=1 npm run build` produces one in which it appears — both grep assertions.
- [ ] M0's exit criterion per §12.1 is met: a fixture-driven probe component renders a queue card from `src/dev/fixtures.ts` on the live page, importing nothing outside §10.5's `types.ts`, `view.ts` and the three signatures; lint proves the import restriction and a Playwright assertion confirms the rendered order text is exactly `formatOrder` of the fixture's drink.

---

## Sprint 14 — mulberry32 with externalised state [NOT STARTED]

**Goal:** Land the pure, externalised-state PRNG so `tick` stays pure and Daily reproducibility survives React strict mode's double invocation.

**Track:** Track A (logic)
**Estimate:** 2h augmented
**Dependencies:** Sprint 3, Sprint 7
**Touches:** `src/game/rng.ts`, `tests/fixtures/mulberry32.json`, `tests/game/rng.test.ts`

### S14-1 — mulberry32 with externalised state

*As the implementing agent, I want the PRNG's state to live in `GameState` rather than a module closure so that `tick` stays pure and Daily reproducibility survives React strict mode's double invocation.*

**Technical context:** §10.3 forbids module-level RNG state, but §7.5's `generateOrder` takes a `() => number`. The module therefore ships a pure step function plus a short-lived closure factory built on it, so a closure never outlives one reducer call and its final state is written back into `rngState`.

**Acceptance criteria:**
- [ ] `src/game/rng.ts` exists and exports `rngNext(state: number): { value: number; state: number }`
      and `makeRng(state: number): { rng: () => number; state: () => number }`,
      with `makeRng` implemented in terms of `rngNext`.
- [ ] A test asserts `rngNext` is pure: the same input state called twice yields
      deep-equal results, and the argument is unchanged.
- [ ] `tests/fixtures/mulberry32.json` is committed, holding one pinned seed, its
      first ten `value` outputs and its first ten successor states.
- [ ] A test asserts the fixture index-for-index with `toBe` on each of the ten
      floats (exact equality, not `toBeCloseTo`) and on each of the ten states.
- [ ] Over a 10,000-draw walk every `value` satisfies `0 <= value < 1` and every
      `state` satisfies `Number.isInteger(state) && state >= 0 && state <= 0xFFFFFFFF`.
- [ ] Two independent `makeRng(seed)` instances produce identical first 100
      values for the same seed and different sequences for two different seeds.
- [ ] `src/game/rng.ts` contains no `Math.random`, `Date.now`, `performance.now`
      or `setTimeout` — the M0 purity lint rule covers `src/game/` and
      `npm run lint` exits zero.
- [ ] Coverage: `src/game/rng.ts` reports 100% lines under the `perFile`
      threshold from §10.7.
- [ ] The full gate passes: `npm run typecheck && npm run lint && npm run test && npm run build && npm run e2e`.

---

## Sprint 15 — Grammar core and the 240-string golden file [NOT STARTED]

**Goal:** Land the canonical 240-drink grammar as the single source `view.ts` re-exports, and freeze its output in a golden file.

**Track:** Track A (logic)
**Estimate:** 4h augmented
**Dependencies:** Sprint 3, Sprint 7
**Touches:** `src/game/grammar.ts`, `src/game/view.ts`, `tests/fixtures/all-valid-drinks.json`, `tests/game/grammar.test.ts`

### S15-1 — Format, validate, match, count, enumerate

*As the implementing agent, I want the five grammar primitives implemented once in `grammar.ts` and re-exported through the frozen view barrel so that Track A and Track B can never disagree about what a drink says.*

**Technical context:** §10.5 froze `view.ts` in M0 with real implementations; M1a must move the canonical implementation into `grammar.ts` and turn the view barrel into a re-export, never a second copy. Enumeration order is load-bearing for Daily reproducibility: nested loops run outermost `base` to innermost `vessel` in §7.1 declaration order.

**Acceptance criteria:**
- [ ] `src/game/grammar.ts` exports `formatOrder`, `isValidDrink`, `matches`,
      `nonDefaultCount` and `allValidDrinks` with the §7.5 signatures.
- [ ] `src/game/view.ts` re-exports those four display helpers from `grammar.ts`:
      a test asserts `Object.is(view.formatOrder, grammar.formatOrder)`,
      `Object.is(view.isValidDrink, grammar.isValidDrink)` and
      `Object.is(view.nonDefaultCount, grammar.nonDefaultCount)`, proving
      re-export rather than reimplementation.
- [ ] The M0 `view.ts` tests remain green with no edits — `git diff --exit-code`
      over the M0 view test file exits zero at sprint end.
- [ ] `formatOrder` asserted against the §7.2 examples exactly: `Kopi`, `Kopi O`,
      `Kopi C siew dai`, `Teh O kosong gao peng`, `Kopi C peng da bao`, plus the
      §9.3 longest order `Teh O kosong gao peng da bao`. Single spaces, no
      leading or trailing whitespace.
- [ ] `isValidDrink` swept over the full 288-element cartesian product: exactly
      240 true and 48 false, and every false case satisfies
      `milk === 'condensed' && (sugar === 'siew-dai' || sugar === 'kosong')`.
      `{ condensed, ga-dai }` asserted true (§7.3).
- [ ] `nonDefaultCount` excludes `base`, returns 0 for plain `Kopi` and 5 for
      `Teh O kosong gao peng da bao`; the distribution over `allValidDrinks()`
      asserted index-for-index as `[2, 14, 46, 82, 72, 24]` (§7.4).
- [ ] `matches` asserted true for all 240 self-pairs, and false for every
      single-slot mutation of every drink (2400 negative cases).
- [ ] `allValidDrinks()` returns 240 entries in declaration order:
      `formatOrder(allValidDrinks()[0]) === 'Kopi'` and
      `formatOrder(allValidDrinks()[239]) === 'Teh O kosong po peng da bao'`;
      repeated calls return the identical frozen reference (`Object.is`) and
      `Object.isFrozen` holds for the array and every element.
- [ ] The full gate passes: `npm run typecheck && npm run lint && npm run test && npm run build && npm run e2e`.

### S15-2 — The 240-string golden file

*As the implementing agent, I want the formatted grammar pinned in a committed fixture so that §4.1's byte-identical claim is an assertion inside one build rather than a comparison across two.*

**Acceptance criteria:**
- [ ] `tests/fixtures/all-valid-drinks.json` is committed and contains a JSON
      array of exactly 240 strings.
- [ ] A test asserts `fixture.length === 240` and, for every `i` in 0..239,
      `formatOrder(allValidDrinks()[i]) === fixture[i]` — index-for-index, never
      set equality and never length alone (§10.7).
- [ ] `new Set(fixture).size === 240`, proving `formatOrder` injective over the
      valid space.
- [ ] `fixture[0] === 'Kopi'` and `fixture[239] === 'Teh O kosong po peng da bao'`.
- [ ] The suite never writes the fixture: `git diff --exit-code tests/fixtures/`
      exits zero after `npm run test`.
- [ ] The full gate passes: `npm run typecheck && npm run lint && npm run test && npm run build && npm run e2e`.

---

## Sprint 16 — parseOrder and the round-trip [NOT STARTED]

**Goal:** Implement the strict canonical tokenizer and land §7.6's exhaustive round-trip sweep, the single most important test in the codebase.

**Track:** Track A (logic)
**Estimate:** 4h augmented
**Dependencies:** Sprint 15
**Touches:** `src/game/grammar.ts`, `tests/game/roundtrip.test.ts`

### S16-1 — parseOrder as a strict tokenizer

*As Maria the visitor, I want the game to accept exactly the canonical order and nothing else, so that what the game teaches me is the real grammar rather than a bag of words.*

**Technical context:** A `Map` keyed on `formatOrder` output would pass every behavioural test in this story and make §7.6 vacuous — the round-trip would be asserting that a table agrees with the function that built it. `parseOrder` must therefore be a positional state machine over lowercased, whitespace-collapsed tokens, consuming slots in the §7.2 order and rejecting anything left over.

**Acceptance criteria:**
- [ ] `parseOrder(text: string): Drink | null` exported from `src/game/grammar.ts`.
- [ ] A structural test reads `src/game/grammar.ts`, isolates the `parseOrder`
      function body and asserts it references neither `allValidDrinks` nor
      `formatOrder` and constructs no lookup keyed on formatted strings — the
      test fails if `parseOrder` is reimplemented as a table lookup.
- [ ] Case-insensitivity: `parseOrder('KOPI C SIEW DAI PENG')`,
      `parseOrder('kopi c siew dai peng')` and `parseOrder('Kopi C siew dai peng')`
      all deep-equal each other.
- [ ] Whitespace collapsing: `'  Kopi\tC   siew   dai\npeng  '` deep-equals
      `parseOrder('Kopi C siew dai peng')`; the two-word tokens `siew dai`,
      `ga dai` and `da bao` parse across arbitrary internal whitespace.
- [ ] Ordering is positional: `parseOrder('Kopi peng C')`,
      `parseOrder('Kopi siew dai C')` and `parseOrder('Kopi da bao peng')` each
      return `null` despite every token being individually valid (§7.5).
- [ ] Structural-but-invalid returns null: `parseOrder('Kopi siew dai')` and
      `parseOrder('Kopi kosong')` are `null` because they fail `isValidDrink`,
      while `parseOrder('Kopi ga dai')` is non-null (§7.3).
- [ ] Malformed input returns null, never throws: `''`, `'Milo'`, `'Kopi C siew'`,
      `'Kopi C siew dai extra'`, `'Kopi C C'`, `'kopikopi'` — plus a 1000-case
      fuzz sweep of shuffled token sequences asserting the return is `Drink | null`
      and no call throws.
- [ ] Every non-null return satisfies `isValidDrink` — asserted across the fuzz
      sweep.
- [ ] The full gate passes: `npm run typecheck && npm run lint && npm run test && npm run build && npm run e2e`.

### S16-2 — The §7.6 exhaustive round-trip

*As the implementing agent, I want the round-trip proved over all 240 drinks and all 48 exclusions, so that any future grammar edit fails loudly at the exact drink it broke.*

**Acceptance criteria:**
- [ ] `tests/game/grammar.roundtrip.test.ts` contains a suite named
      `§7.6 round-trip` driven by `it.each(allValidDrinks())`, so the run reports
      240 discrete cases and a failure names the offending drink.
- [ ] For every drink, `parseOrder(formatOrder(drink))` deep-equals `drink` on all
      six slots. 240/240 green.
- [ ] The same file asserts `allValidDrinks().length === 240` (§7.6).
- [ ] The full 288-element cartesian product is enumerated in the test: exactly
      48 fail `isValidDrink`, and for each of those 48
      `parseOrder(formatOrder(d)) === null`.
- [ ] `288 - 48 === 240` and the valid subset equals `allValidDrinks()` compared
      by canonical serialisation via `expectSameState`'s serializer.
- [ ] For every string in `tests/fixtures/all-valid-drinks.json`,
      `parseOrder(s)` is non-null and `formatOrder(parseOrder(s)!) === s` — the
      reverse round-trip, asserted index-for-index.
- [ ] The full gate passes: `npm run typecheck && npm run lint && npm run test && npm run build && npm run e2e`.

---

## Sprint 17 — Scoring [NOT STARTED]

**Goal:** Land combo, points and shift bonus as integer arithmetic over `config.ts` — it needs the contract and nothing else, so it runs beside the grammar rather than behind it.

**Track:** Track A (logic)
**Estimate:** 3.5h augmented
**Dependencies:** Sprint 3, Sprint 7
**Touches:** `src/game/scoring.ts`, `tests/game/scoring.test.ts`

### S17-1 — Integer combo, points, bonus and result precedence

*As Ah Seng, I want my combo to reach exactly 3.0 and my points to be whole numbers, so that a score is something I can defend rather than a float artefact.*

**Technical context:** §8.8 stores combo as integer tenths precisely because repeated `+= 0.1` produces `2.9999999999999996` against a `3.0` cap, breaking both the cap comparison and §4.1's determinism target. Every function here takes and returns integers; the displayed multiplier is a render-time division that never re-enters the engine.

**Acceptance criteria:**
- [ ] `src/game/scoring.ts` exports `pointsFor(comboTenths)`, `bumpCombo(comboTenths)`,
      `shiftBonus(walkoutsInShift)` and `escalateResult(prev, next): ServeResult`.
- [ ] All constants come from `src/game/config.ts` — combo start 10, step 1, cap
      30, base points 100, shift-clear bonus 500. A test asserts neither
      `scoring.ts` nor its test file restates them as literals (§10.4).
- [ ] `pointsFor` asserted for all 21 values of `comboTenths` 10..30:
      `pointsFor(10) === 100`, `pointsFor(15) === 150`, `pointsFor(23) === 230`,
      `pointsFor(30) === 300`, and `Number.isInteger` holds for all 21.
- [ ] `bumpCombo` asserted across the whole domain: 10→11 … 29→30, and
      `bumpCombo(30) === 30` (cap, idempotent).
- [ ] The float guard: applying `bumpCombo` 100 times from 10 yields exactly 30 —
      never 29, never 31 — and every intermediate value satisfies
      `Number.isInteger`.
- [ ] Combo reset returns exactly 10 on a wrong serve and on a walkout (§8.8),
      asserted from cap and from mid-range.
- [ ] `bestComboTenths` tracking asserted monotone: feeding the sequence
      10,11,12,10,11 leaves best at 12.
- [ ] R15: `shiftBonus(0) === 500`, `shiftBonus(1) === 0`, `shiftBonus(3) === 0`;
      a case with two fumbled customers and zero walkouts still returns 500 —
      wrong serves do not forfeit the bonus.
- [ ] R14: `escalateResult` asserted over all nine ordered pairs of
      `clean`/`fumbled`/`walkout` — `walkout` outranks `fumbled`, `fumbled`
      outranks `clean`, equal pairs are idempotent.
- [ ] Coverage: `src/game/scoring.ts` reports 100% lines under the `perFile`
      threshold.
- [ ] The full gate passes: `npm run typecheck && npm run lint && npm run test && npm run build && npm run e2e`.

---

## Sprint 18 — Queue, arrivals and the shift ramp [NOT STARTED]

**Goal:** Implement the queue as pure helpers — arrivals on the interpolated gap, patience drain, walkouts, the R7 floor and the R22 ordering invariant — so the engine reducer is assembly rather than invention.

**Track:** Track A (logic)
**Estimate:** 4.5h augmented
**Dependencies:** Sprint 3, Sprint 7, Sprint 10
**Touches:** `src/game/queue.ts`, `tests/game/queue.test.ts`

### S18-1 — Arrivals and the gap ramp

*As a player, I want the line to tighten across a shift and to stop growing when three people are already waiting, so that pressure ramps without ever becoming unrecoverable.*

**Technical context:** Two readings had to be ruled and recorded. First, `gapMsFor(shift, i)` is the wait *preceding* customer `i`, so after spawning customer `i` the engine sets `nextArrivalMs = gapMsFor(shift, i + 1)` and R11 makes customer 1's wait zero. Second, R10 suspension means the countdown *holds*: while the queue is full, `nextArrivalMs` is not decremented at all, matching §8.7's "arrivals pause until a slot frees" and preventing a freed slot from dumping a backlog.

**Acceptance criteria:**
- [ ] `src/game/queue.ts` exists, imports only `types.ts`, `config.ts`,
      `generator.ts`, `rng.ts` and `scoring.ts`, and contains no DOM or React
      import — `npm run lint` exits zero under the M0 boundary rule.
- [ ] `queue.ts` computes no interpolation itself: a test asserts the file
      contains no arrival-gap or patience arithmetic and calls `gapMsFor`,
      `patienceMsFor` and `tierFor` from `config.ts` (§10.4).
- [ ] The breakfast spawn-to-spawn schedule is asserted exactly as
      `[0, 5600, 5200, 4800, 4400]` for its 6 customers (§8.5 with R11), and
      every `gapMsFor` return over all four shifts at i = 1, mid and N satisfies
      `Number.isInteger`.
- [ ] R11: after `START_RUN`, `nextArrivalMs === 0` and the first
      `tick(state, 16)` spawns one customer whose `id` equals the pre-tick
      `nextCustomerId`, with `nextCustomerId` exactly one greater afterwards.
- [ ] Patience on spawn: all six breakfast customers get 18000ms; supper
      customers 1..10 get exactly `[12000, 11800, 11600, 11400, 11200, 11000,
      10800, 10600, 10400, 10200]`; an Endless supper repeat holds at the 10000ms
      floor and the 2000ms gap floor (§8.5). `maxPatienceMs === patienceMs` on
      spawn.
- [ ] Tier on spawn follows `tierFor`: tea customers 1–5 are tier 2 and 6–10 are
      tier 3; each spawn advances `rngState` by exactly one draw.
- [ ] R10 and §8.7: with `queue.length === 3`, folding 10,000ms of ticks leaves
      `nextArrivalMs` and `spawnedInShift` unchanged; removing one customer
      resumes the held countdown and the next spawn lands exactly that many ms
      later, asserted at the exact tick index.
- [ ] R10's other two suspensions asserted: no spawn while `phase !== 'playing'`,
      and no spawn once `spawnedInShift` equals the shift's customer count.
- [ ] The full gate passes: `npm run typecheck && npm run lint && npm run test && npm run build && npm run e2e`.

### S18-2 — Patience, walkouts and the ordering invariant

*As a player, I want someone to walk out only because I ignored them and never because I handed them the wrong drink, so that the one-line rule of the game is true without an asterisk.*

**Technical context:** R7's clamp is not `max(p - 0.35 * maxP, 2000)` alone — that would *raise* a customer already below the floor. Patience at or below `PATIENCE_FLOOR_MS` is left untouched, which is what makes "a wrong serve can never cause a walkout" hold at every value.

**Acceptance criteria:**
- [ ] Drain: every queued customer loses exactly `TICK_MS` (16) per step; after
      `k` steps `patienceMs === initial - 16 * k` for all three queue positions,
      including the active customer and including steps during a lockout (R6).
- [ ] Walkout fires at the exact tick: a breakfast customer (18000ms) is still
      queued after 1124 steps and gone after 1125 (18000 / 16 = 1125). Each
      walkout costs one heart, resets `comboTenths` to 10 and records `walkout`
      into `shiftResults[shiftIndex]`.
- [ ] Simultaneous walkouts resolve in ascending `id` order per R21 step 3: three
      customers crossing zero in one step produce results in id order and
      `heartLost` events with `remaining` 2, 1, 0.
- [ ] R7 asserted at four points against 18000ms max: 18000 → 11700; 8000 → 2000
      (clamped, not 1700); 2000 → 2000 (unchanged); **1500 → 1500 (unchanged, not
      raised to the floor)**. `PATIENCE_FLOOR_MS` is read from `config.ts`.
- [ ] R7's guarantee as a sweep: for every shift's max patience and every
      `patienceMs` from 1 to max in 16ms steps, the post-penalty value is
      strictly greater than 0 — a wrong serve can never cause a walkout.
- [ ] The penalty is integer milliseconds: `Number.isInteger` holds for
      `0.35 * maxPatienceMs` across all shift patience values (6300, 5600, 4900,
      4200, 3570 asserted).
- [ ] R14: a fumbled customer who later walks out records `walkout`; a fumbled
      customer served correctly records `fumbled`; a clean serve records `clean`
      — routed through `escalateResult`, not re-derived.
- [ ] R22 as a property test: `tests/support/invariants.ts` exports
      `assertQueueInvariants(state)` — ids strictly ascending, `queue.length <= 3`,
      `nextCustomerId` monotonic and greater than every queued id — applied at
      every step of a 5,000-step seeded run mixing spawns, serves and walkouts
      (seeded via `rng.ts`, never `Math.random`), and applied to
      `src/dev/stubEngine.ts` in the same file so the two cannot silently
      disagree.
- [ ] The full gate passes: `npm run typecheck && npm run lint && npm run test && npm run build && npm run e2e`.

---

## Sprint 19 — Generator [NOT STARTED]

**Goal:** Land seeded order generation with the tier pools asserting exactly 16/144/240.

**Track:** Track A (logic)
**Estimate:** 4h augmented
**Dependencies:** Sprint 14, Sprint 16
**Touches:** `src/game/generator.ts`, `tests/game/generator.test.ts`

### S19-1 — Tier pools

*As Ah Seng, I want breakfast orders to stay simple and supper orders to use the whole grammar, so that a run has a real difficulty curve rather than uniform randomness.*

**Acceptance criteria:**
- [ ] `src/game/generator.ts` exports `generateOrder(rng: () => number, tier: Tier): Drink`
      and `poolFor(tier: Tier): readonly Drink[]`.
- [ ] Tier budgets are read from `src/game/config.ts`; a test asserts
      `generator.ts` contains no numeric budget literal (§10.4).
- [ ] Pool sizes assert exactly: `poolFor(1).length === 16`,
      `poolFor(2).length === 144`, `poolFor(3).length === 240` (§8.6, R12, §10.7).
- [ ] Every member of `poolFor(t)` satisfies `isValidDrink` and
      `nonDefaultCount(d) <= budget(t)`; `poolFor(1)` ⊂ `poolFor(2)` ⊂ `poolFor(3)`
      asserted by membership.
- [ ] Pools preserve `allValidDrinks()` order: the indices of `poolFor(t)` within
      `allValidDrinks()` are strictly increasing.
- [ ] `poolFor(t)` returns the identical frozen reference on repeated calls
      (`Object.is`), computed once.
- [ ] R17 is asserted, not fixed: no member of `poolFor(1)` has
      `sugar === 'siew-dai'` or `sugar === 'kosong'`, and the test carries a
      comment naming R17 as intended behaviour.
- [ ] The full gate passes: `npm run typecheck && npm run lint && npm run test && npm run build && npm run e2e`.

### S19-2 — Deterministic selection

*As a Daily player, I want everyone to get the same 34 orders from the same seed, so that comparing scores is fair.*

**Technical context:** R13 forbids de-duplication or re-rolling — two identical consecutive orders are a legitimate zero-slot-change reward for batching. The cheapest mechanical proof of "no re-roll" is a call counter on the injected `rng`: exactly one draw per `generateOrder`.

**Acceptance criteria:**
- [ ] Selection is exactly `pool[Math.floor(rng() * pool.length)]` per R12,
      asserted with a scripted `rng`: `0` yields `pool[0]`, `0.9999999` yields
      `pool[len - 1]`, and `(k + 0.5) / len` yields `pool[k]` for a sample of k
      across each tier.
- [ ] R13: a scripted `rng` returning the same value twice yields two deep-equal
      drinks, and a call counter asserts the injected `rng` was invoked exactly
      once per `generateOrder` call over 200 calls — no retry, no re-draw, no
      de-duplication.
- [ ] Determinism: 100 successive `generateOrder(rng, 3)` calls from
      `makeRng(seed)` deep-equal a second identical run from the same seed, and
      the run's terminal `state()` matches.
- [ ] The tier-1 pool is asserted member-for-member as formatted strings in
      `allValidDrinks()` order:
      `['Kopi','Kopi da bao','Kopi peng','Kopi gao','Kopi po','Kopi ga dai','Kopi C','Kopi O','Teh','Teh da bao','Teh peng','Teh gao','Teh po','Teh ga dai','Teh C','Teh O']`,
      and additionally as a set equal to §8.6's listing of the 16.
- [ ] `generateOrder` never returns a drink failing `isValidDrink`: swept over
      10,000 seeded draws per tier.
- [ ] Coverage: `src/game/generator.ts` reports 100% lines under the `perFile`
      threshold.
- [ ] The full gate passes: `npm run typecheck && npm run lint && npm run test && npm run build && npm run e2e`.

---

## Sprint 20 — daily.ts [NOT STARTED]

**Goal:** Land the Singapore date string, seed hash and streak arithmetic — pure functions over `rng` and `config` that never needed the engine, so they fill an idle runner during the logic track.

**Track:** M3 (slack-fill)
**Estimate:** 4h augmented
**Dependencies:** Sprint 14
**Touches:** `src/game/daily.ts`, `tests/game/daily.test.ts`

### S20-1 — Singapore date, seed hash and streak arithmetic

*As a player in any timezone, I want the Daily to be keyed to the Singapore date so that my friend in London and I get the same 34 orders on the same day.*

**Technical context:** Singapore has no DST and a fixed +08:00 offset, so the date is exact integer arithmetic — add `8 * 3600_000` to the epoch millisecond input and read the UTC fields. Do not reach for `Intl`/`toLocaleDateString` with a `timeZone` option: it is locale- and ICU-build-dependent and defeats §4.1's byte-identical target. `now` is a parameter, never `Date.now()` — constraint 7 in §3 applies to this file.

**Acceptance criteria:**
- [ ] `src/game/daily.ts` exists and exports `singaporeDateString(nowMs: number): string`, `hashDateSeed(date: string): number`, and `nextStreak(lastPlayedDate: string | null, streak: number, today: string): number`. No DOM import and no React import anywhere in its module graph.
- [ ] The §10.5 purity lint passes on the new file: a test runs the ESLint API over `src/game/daily.ts` and asserts zero `no-restricted-syntax` and `no-restricted-globals` violations — no `Date.now()`, `performance.now()`, `Math.random()` or `setTimeout`.
- [ ] `singaporeDateString` returns `YYYY-MM-DD` zero-padded, asserted at the offset boundary: `Date.parse('2026-08-28T15:59:59Z') → '2026-08-28'` and `Date.parse('2026-08-28T16:00:00Z') → '2026-08-29'`.
- [ ] `hashDateSeed` is asserted against three committed known-input/known-output pairs per §8.9, including `'2026-08-28'`, with the expected integers written literally in the test. A property test over all 366 dates of 2028 asserts every result satisfies `Number.isInteger(h) && h >= 0 && h <= 4294967295`.
- [ ] `hashDateSeed` is injective over those 366 dates (assert `new Set(hashes).size === 366`), so no two adjacent days collide onto the same order sequence.
- [ ] `nextStreak` implements §8.10 exactly and is asserted case by case: `null` last date → `1`; `today === lastPlayedDate` → `streak` unchanged; exactly one day later → `streak + 1`; two or more days later → `1`.
- [ ] Boundary cases asserted: month `'2026-08-31' → '2026-09-01'` extends; year `'2026-12-31' → '2027-01-01'` extends; leap `'2028-02-28' → '2028-02-29'` and `'2028-02-29' → '2028-03-01'` extend; non-leap `'2027-02-28' → '2027-03-01'` extends; `'2026-08-26' → '2026-08-28'` resets to `1`.
- [ ] A zero-hearts run still extends the streak: the streak test asserts `nextStreak` is a function of dates only and takes no heart or score input, so an R16 early end cannot suppress it.
- [ ] The whole `daily` suite runs a second time under a forced `TZ=America/New_York` via a dedicated npm script wired into CI, and every assertion above is identical in both runs. Add a same-day-replay case (`'2026-08-28' → '2026-08-28'` → unchanged) to that forced run.
- [ ] `src/game/daily.ts` hits 100% line coverage under the §10.7 threshold (`perFile: true`), so the run fails if any branch of the streak arithmetic is untested.
- [ ] The full gate passes: `npm run typecheck && npm run lint && npm run test && npm run build && npm run e2e`.

---

## Sprint 21 — The engine reducer [NOT STARTED]

**Goal:** Assemble `tick` and `applyAction` from the pure helpers, closing the logic track's core.

**Track:** Track A (logic)
**Estimate:** 5h augmented
**Dependencies:** Sprint 9, Sprint 17, Sprint 18, Sprint 19
**Touches:** `src/game/engine.ts`, `tests/game/engine.test.ts`

### S21-1 — tick: quantisation and the pipeline

*As the implementing agent, I want one tick of any size to produce exactly the same state as the equivalent run of 16ms steps, so that Playwright can fast-forward a shift and get the state a real player would have reached.*

**Technical context:** §10.3's identity clause and R20's carry conflict at sub-step deltas — the remainder must be stored, so the reference cannot be literally identical. Ruled and recorded: identity is returned when `phase !== 'playing'` or `dtMs === 0`; a sub-step delta returns a state differing only in `tickRemainderMs`, with `builder`, every `Customer`, `shiftResults` and the shared frozen empty `frameEvents` all identity-preserved. That is what §10.3's own stated assertion checks and what the render budget needs.

**Acceptance criteria:**
- [ ] `src/game/engine.ts` exports `tick`, `applyAction` and `createInitialState`
      with the exact §10.3 signatures.
- [ ] R20 quantisation: `tick(s, 8)` applies 0 steps and leaves
      `tickRemainderMs === 8`; a second `tick(s, 8)` applies exactly 1 step and
      leaves `tickRemainderMs === 0`; `tick(s, 10000)` applies exactly 625 steps.
      `TICK_MS` is read from `config.ts`.
- [ ] Identity contract: `Object.is(tick(s, 0), s)` and `Object.is(tick(pausedOrBreakState, 5000), …)`
      hold; across 1000 ticks with no `SET_SLOT`, `Object.is` holds on
      `state.builder` at every step (§10.3's named assertion); when no events
      fire, `frameEvents` is the shared frozen empty array (`Object.is` across
      ticks) and unchanged `Customer` objects keep their references.
- [ ] R21 order asserted by a scripted single step in which a lockout expires,
      patience hits zero, hearts reach zero, a shift would end and an arrival is
      due: `frameEvents` is exactly `walkout`, `heartLost`, `gameOver` — no
      `shiftCleared`, no `arrived` — proving R23 preemption of R8 and R15.
- [ ] Multiple spawns in one call: from an empty queue with three arrivals due
      inside one `tick`, exactly 3 `arrived` events fire, `queue.length === 3`
      and no fourth spawn occurs (queue cap, R10).
- [ ] Multiple walkouts in one call: three customers at 100/200/300ms patience
      under `tick(s, 400)` produce 3 walkouts in ascending id order, 3 hearts
      lost and `phase === 'gameover'`.
- [ ] R16: on game over the still-waiting customers are discarded and produce no
      result — a Daily run ending early has `shiftResults.flat().length < 34`,
      asserted with correct per-shift grouping.
- [ ] `frameEvents` is overwritten, never appended: after a tick that produces
      events and a following quiet tick, the second state's `frameEvents.length === 0`
      and carries nothing from the first.
- [ ] Determinism: folding the identical step list twice from the same initial
      state passes `expectSameState` (S10-1 harness).
- [ ] The full gate passes: `npm run typecheck && npm run lint && npm run test && npm run build && npm run e2e`.

### S21-2 — applyAction: all seven actions

*As a player, I want every button I press to do exactly one legible thing — and nothing at all while I am locked out or paused — so that the game never feels like it swallowed my input at random.*

**Technical context:** `START_RUN` and `createInitialState` are one reset path, so both must yield `phase: 'playing'`; ruled and recorded that the `'title'` phase is an app-level route, never a reducer output. `SET_SLOT` writes through the generic `setSlot<K>` helper from §10.3, which is the single place the unavoidable cast lives.

**Acceptance criteria:**
- [ ] `applyAction(s, { type: 'START_RUN', mode, seed })` passes `expectSameState`
      against `createInitialState(mode, seed)` for both modes and three seeds,
      with one implemented in terms of the other (§10.3); `createInitialState(mode, seed).phase === 'playing'`
      and `builder` deep-equals plain `Kopi` with all six slots at defaults (R1, R2).
- [ ] `FOCUS`: sets `activeId` for a queued id; returns the identical reference
      for an id not in the queue, during lockout (R5) and while paused (R19).
- [ ] `SET_SLOT`: all six slots settable; each returns a new `builder` with the
      other five values identical; setting a slot to its current value returns
      the identical state reference. R18 — the builder legally holds
      `{ milk: 'condensed', sugar: 'kosong' }`, `isValidDrink(builder) === false`,
      and no rejection or auto-correction occurs.
- [ ] `SERVE` R4: with `activeId === null` returns the identical state reference —
      `score`, `comboTenths`, `lockoutMs`, `servesAttempted` all unchanged.
- [ ] Correct serve: points use the pre-bump combo — from `comboTenths === 10`
      the score rises by exactly 100 and combo becomes 11; customer removed;
      `servesCorrect` and `servesAttempted` each +1 (R25); result recorded via
      `escalateResult`; `Object.is` holds on `builder` (§8.2, R2); focus
      re-resolves to `queue[0]` or `null` (R3); a `served` event carries `points`.
- [ ] Wrong serve: `servesAttempted` +1 and `servesCorrect` unchanged (R25);
      `comboTenths` → 10; `lockoutMs` set from `config.ts` (600); customer stays
      with `fumbled === true` and R7-penalised patience; `hearts` unchanged;
      `Object.is` holds on `builder`; a `fumbled` event fires.
- [ ] R5: while `lockoutMs > 0`, `FOCUS`, `SET_SLOT` and `SERVE` each return the
      identical state reference; R6 still drains patience across the lockout.
- [ ] `DISMISS_BREAK` (R9): illegal outside `phase === 'break'` (identity
      no-op); 60,000ms of ticks in `break` change nothing; on dismissal
      `phase` → `playing`, `shiftIndex` +1 (pinned at 3 in Endless),
      `spawnedInShift`/`servedInShift`/`walkoutsInShift` → 0, a fresh inner array
      is pushed onto `shiftResults`, and `nextArrivalMs === 0` (R11).
- [ ] R19: `PAUSE` legal only from `playing` and `RESUME` only from `paused`,
      both identity no-ops otherwise; while paused `tick(s, 100000)` returns the
      identical reference and no patience drains; all six non-`RESUME` actions
      return identity; `lockoutMs` is preserved exactly across a 10s pause and
      resumes decrementing afterwards.
- [ ] R24: a Daily run whose 34th customer departs awards the final shift's R15
      bonus and moves `phase` directly to `gameover` without passing through
      `break`; the Endless supper repeat does not end this way.
- [ ] Exhaustiveness is compile-time: the action switch ends in a `satisfies never`
      assignment with no runtime statement; a test asserts `engine.ts` contains no
      `default: throw`, and that `/* v8 ignore next */` occurrences across
      `src/game/` do not exceed the committed cap (§10.7).
- [ ] The full gate passes: `npm run typecheck && npm run lint && npm run test && npm run build && npm run e2e`.

---

## Sprint 22 — Ruling matrix and coverage [NOT STARTED]

**Goal:** Prove every §8.4 ruling R1–R25 and hold `src/game/` at 100% line coverage, closing Track A.

**Track:** Track A (logic)
**Estimate:** 3.5h augmented
**Dependencies:** Sprint 21
**Touches:** `tests/game/rulings.test.ts`

### S22-1 — The R1–R25 matrix

*As the implementing agent, I want each of the twenty-five rulings named and asserted in one place, so that a future change that violates one fails against the ruling rather than against an unrelated test.*

**Acceptance criteria:**
- [ ] `tests/game/rulings.test.ts` drives `it.each` from a single exported
      `RULINGS` table whose keys are exactly `R1` … `R25`; a meta-test asserts
      `Object.keys(RULINGS).length === 25`, no duplicates and no gaps.
- [ ] Every entry's test title begins with its ruling id and quotes the ruling's
      text; a meta-test asserts the collected suite titles cover `R1`..`R25` with
      none missing.
- [ ] Each entry asserts behaviour rather than presence — the assertion for a
      ruling must fail if the ruling is reverted. Rulings already covered
      elsewhere re-assert here against the engine, not against `queue.ts` or
      `grammar.ts` in isolation.
- [ ] Numbers cited come from `config.ts`, never literals: 3 hearts, queue cap 3,
      `PATIENCE_FLOOR_MS` 2000, 600ms lockout, `TICK_MS` 16, combo tenths 10..30,
      +500 shift bonus, tier pools 16/144/240, Daily 34 customers as 6 + 8 + 10 + 10.
- [ ] R17's entry is annotated as intended behaviour with its rationale, and
      fails if a future agent makes `siew dai` or `kosong` reachable at tier 1.
- [ ] R22's entry runs `assertQueueInvariants` against both `engine.ts` and
      `src/dev/stubEngine.ts`.
- [ ] The full gate passes: `npm run typecheck && npm run lint && npm run test && npm run build && npm run e2e`.

### S22-2 — Coverage threshold and the determinism fold

*As the implementing agent, I want 100% line coverage enforced by a threshold and determinism asserted by a fold, so that "the core is trustworthy" is a gate failure rather than a claim.*

**Technical context:** The quantisation carry means step count, not wall time, decides equality: 313 × 16ms is 5008ms, so the exact-multiple form is asserted against `tick(5008)`, and `tick(5000)` is asserted against 312 whole steps plus an 8ms tail carrying `tickRemainderMs === 8`. Both directions are checked so a dropped remainder cannot pass.

**Acceptance criteria:**
- [ ] Vitest coverage config committed exactly as §10.7 specifies: provider `v8`,
      `all: true`, `include: ['src/game/**/*.ts']`,
      `exclude: ['src/game/types.ts']` plus `src/dev/` with a comment naming the
      M2 story that deletes it, `perFile: true`, `autoUpdate: false`, and a 100%
      lines threshold.
- [ ] `npm run test` exits zero and reports 100% lines for every file under
      `src/game/`; the run fails non-zero if any single file drops below the
      threshold (`perFile`).
- [ ] Determinism fold, exact-multiple form:
      `expectSameState(fold(s0, [{ tick: 5008 }]), fold(s0, Array(313).fill({ tick: TICK_MS })))`
      — 313 × 16 = 5008 — with `tickRemainderMs === 0` on both sides.
- [ ] Determinism fold, carry form:
      `expectSameState(fold(s0, [{ tick: 5000 }]), fold(s0, [...Array(312).fill({ tick: TICK_MS }), { tick: 8 }]))`
      with `tickRemainderMs === 8` on both sides.
- [ ] Both folds run for `endless` and `daily` from a pinned seed, and each fold
      repeated twice produces byte-identical canonical serialisations (§4.1).
- [ ] A scripted 60-second breakfast fold asserts exact terminal values —
      `score`, `hearts`, `comboTenths`, `bestComboTenths` and `shiftResults` —
      not just a shape.
- [ ] A Node-environment test imports every module under `src/game/` via
      `import.meta.glob` and asserts each loads with no browser global present,
      proving §10.2's headless requirement at runtime as well as by lint.
- [ ] A grep test asserts `/* v8 ignore next */` occurrences across `src/game/`
      are at or below the committed cap and each is the exact comment text
      (§10.7).
- [ ] The full gate passes: `npm run typecheck && npm run lint && npm run test && npm run build && npm run e2e`.

---

## Sprint 23 — Slot selector rows [NOT STARTED]

**Goal:** Build the six builder rows against `view.ts`'s frozen labels and the design tokens — no engine, no fixtures.

**Track:** Track B (presentation)
**Estimate:** 4h augmented
**Dependencies:** Sprint 3, Sprint 5
**Touches:** `src/components/slots/**`

### S23-1 — The six slot rows

*As a player, I want to set each of the six drink slots with a single tap, so that I can build an order faster than I can read it.*

**Technical context:** Row order, row labels and value labels all come from `SLOT_ROW_LABELS` and `SLOT_VALUE_LABELS` in the frozen view barrel (§10.5). Restating any of them as a literal in the component would let the two tracks disagree silently, so the tests grep for that. R18 is the trap here: the two condensed-milk-invalid sugar buttons must stay live and tappable, marked but never disabled.

**Acceptance criteria:**
- [ ] `src/components/SlotSelectors.tsx` and `SlotSelectors.module.css` exist and take
      `{ builder: Drink, lockoutMs: number, dispatch }`.
- [ ] Rows render in §7.1 declaration order — base, milk, sugar, strength, temperature,
      vessel — with labels deep-equal to `Object.values(SLOT_ROW_LABELS)`: `BASE`, `MILK`,
      `SUGAR`, `BREW`, `TEMP`, `TAKE` per the §9.5 wireframe.
- [ ] No label literals in the component: `grep -nE '"(BASE|MILK|SUGAR|BREW|TEMP|TAKE|siew|kosong|gao|da bao)"' src/components/SlotSelectors.tsx`
      exits non-zero, wired as a test.
- [ ] Exactly 16 value buttons render (2 + 3 + 4 + 3 + 2 + 2), asserted as a single count
      and per row.
- [ ] Each button dispatches exactly `{ type: 'SET_SLOT', slot, value }` for its own slot
      and value — 16 table-driven assertions covering every button.
- [ ] Exactly one button per row carries `data-selected="true"`, driven by the `builder`
      prop; asserted for the R1 initial builder (plain `Kopi`, every slot default) and for
      `Teh O kosong gao peng da bao`.
- [ ] 44×44 minimum (§9.7): `tests/e2e/slots.spec.ts` at a 360×640 viewport asserts every
      one of the 16 buttons has `boundingBox().width >= 44` and `height >= 44`, and that
      `document.documentElement.scrollWidth === clientWidth`.
- [ ] R18: with `builder.milk === 'condensed'`, the `siew dai` and `kosong` buttons have no
      `disabled` attribute, remain clickable, and still dispatch their `SET_SLOT`. A test
      asserts the resulting builder is one `isValidDrink` rejects — the builder may legally
      hold an invalid drink.
- [ ] R18 marker: exactly those two buttons carry `data-testid="invalid-marker"` when
      `isValidDrink` (imported from `src/game/view.ts`, never recomputed locally) rejects the
      would-be builder. The marker is not colour-only — it renders a glyph element plus a
      non-empty accessible name naming the rule, asserted by text content, and the marker
      count drops to 0 when milk is `evaporated` or `none`.
- [ ] R5: for the mid-lockout fixture (`lockoutMs > 0`) all 16 buttons carry
      `aria-disabled="true"`, render a non-colour-only dimmed state (a lock glyph element
      present in addition to reduced opacity), and clicking any of them dispatches nothing —
      asserted with a spy call count of 0.
- [ ] The gallery renders `SlotSelectors` for every catalogue fixture with zero
      `console.error`.
- [ ] The full gate passes: `npm run typecheck && npm run lint && npm run test && npm run build && npm run e2e`.

---

## Sprint 24 — Slot rows: keyboard and a11y [NOT STARTED]

**Goal:** Give the slot rows real radio semantics and keyboard navigation, so §9.7's keyboard-only floor holds.

**Track:** Track B (presentation)
**Estimate:** 4h augmented
**Dependencies:** Sprint 23
**Touches:** `src/components/slots/**`

### S24-1 — Arrow and number-key navigation

*As a keyboard player, I want `↑`/`↓` to move between slot rows and `1`–`4` to pick a value in the focused row, so that I can play fast on a laptop without a mouse.*

**Technical context:** Roving tabindex — one tab stop for the whole group, arrows move focus within it. Rows have 2–4 values against four number keys, so eight key/row pairs are out of range; §9.7 does not rule on wrapping, so this sprint rules it: `↑`/`↓` clamp at the first and last row rather than wrapping, recorded here as the reversible choice per §13.

**Acceptance criteria:**
- [ ] Roving tabindex: exactly one node inside the selector group has `tabindex="0"` at all
      times, asserted after each of a sequence of six `↓` presses.
- [ ] `↑`/`↓` move focus between the six rows in §7.1 order and clamp at the ends: from the
      BASE row `↑` is a no-op and focus stays on BASE; from the TAKE row `↓` is a no-op.
- [ ] `1`–`4` select the nth value of the focused row and dispatch the matching
      `SET_SLOT` — 11 assertions covering every in-range key/row pair
      (2 + 3 + 4 + 3 + 2 + 2 = 16 buttons reachable across 6 rows).
- [ ] Out-of-range keys are an explicit no-op: a table-driven test enumerates exactly 8
      cases — BASE `3`,`4`; MILK `4`; BREW `4`; TEMP `3`,`4`; TAKE `3`,`4` — and asserts each
      dispatches nothing, moves no focus, and changes no `aria-checked`.
- [ ] ARIA: each row is `role="radiogroup"` with `aria-label` from `SLOT_ROW_LABELS`; each
      value is `role="radio"`; exactly one `aria-checked="true"` per row, six across the
      component, asserted for the R1 initial builder.
- [ ] Visible focus rings (§9.7): `tests/e2e/keyboard.spec.ts` focuses each of the 16
      buttons via keyboard and asserts computed `outline-style !== 'none'` and
      `outline-width >= 2px`, with the ring colour resolving to `--teak` (11.44:1 on
      `--condensed-cream`, §9.2).
- [ ] No hover dependence (§9.7): a test parses `SlotSelectors.module.css` and asserts every
      selector containing `:hover` has a sibling rule with `:focus-visible` applying the same
      declarations.
- [ ] R5 covers the keyboard too: with `lockoutMs > 0`, `↑`, `↓` and `1`–`4` all dispatch
      nothing and do not change `aria-checked`.
- [ ] Keyboard-only build e2e: starting from page load with no pointer events, `Tab` into the
      group and build `Teh O kosong gao peng da bao` using only `↑`/`↓` and `1`–`4`; assert the
      preview's `aria-label` equals that exact string (§9.3's longest tier-3 order).
- [ ] The full gate passes: `npm run typecheck && npm run lint && npm run test && npm run build && npm run e2e`.

---

## Sprint 25 — The vessels: bag then cup [NOT STARTED]

**Goal:** Render the signature SVG — the bag first, per §9.4, because it is the visual the game is meant to be remembered for.

**Track:** Track B (presentation)
**Estimate:** 5h augmented
**Dependencies:** Sprint 3, Sprint 5
**Touches:** `src/graphics/**`

### S25-1 — Plastic bag vessel

*As Ah Seng, I want a `da bao` order drawn as a clear plastic bag with a looped string handle, so that the game reads as a Singapore kopitiam at a glance.*

**Technical context:** §9.4 and §11.3 both order the bag first: a half-finished cup is not a demo, a bag alone is. All geometry is inline SVG authored in code — §3.3 and §3.4 ban external and binary assets outright.

**Acceptance criteria:**
- [ ] `src/graphics/DrinkBag.tsx` exists, renders inline SVG only, and takes
      `{ drink: Drink }`. A test asserts the rendered subtree contains no `<image>` element
      and no `url(` in any attribute — §3.3 / §3.4.
- [ ] The subtree carries `data-testid="drink-liquid"` and `data-testid="drink-bag-handle"`,
      the handle being a closed loop path.
- [ ] Every vessel and handle path carries `stroke: var(--teak)` (11.44:1 on
      `--condensed-cream`, §9.2), so shape legibility never depends on fill contrast.
- [ ] A test enumerates the 288 raw slot combinations locally, filters with `isValidDrink`
      from `src/game/view.ts`, asserts the survivor count is exactly 240 (§7.4), and renders
      the 120 `vessel: 'bag'` drinks without a throw. Track B may not import `grammar.ts`
      or `generator.ts` — the seam exposes no `allValidDrinks()` (§10.5).

### S25-2 — Porcelain cup vessel and the preview switch

*As a player, I want a cup order drawn as the classic green-rimmed porcelain cup on a saucer, so that the preview confirms what I built without me re-reading the six slot rows.*

**Acceptance criteria:**
- [ ] `src/graphics/DrinkCup.tsx` renders the cup with a rim stroked
      `var(--kopitiam-green)` and a saucer carrying `data-testid="drink-saucer"`.
- [ ] `src/graphics/DrinkPreview.tsx` switches on `drink.vessel` and is the only module
      either vessel is rendered through. Exhaustiveness over `Vessel` is proven by a
      `satisfies never` assignment with no runtime statement (§10.7).
- [ ] Across all 240 valid drinks: `drink-bag-handle` is present iff `vessel === 'bag'`,
      `drink-saucer` is present iff `vessel === 'cup'`, and `drink-liquid` is present in
      both. 240 assertions, table-driven.
- [ ] The preview root has `role="img"` and an `aria-label` exactly equal to
      `formatOrder(drink)` from `src/game/view.ts` — asserted for all 240, including
      `Kopi` and `Teh O kosong gao peng da bao`.
- [ ] `data-testid` hooks `drink-liquid`, `drink-ice`, `drink-condensation`,
      `drink-bag-handle` and `drink-saucer` are declared once as exported string constants
      in `src/graphics/testids.ts` and referenced by name from both components and tests,
      so a rename cannot desynchronise them.
- [ ] The fixture gallery renders `DrinkPreview` for the complete 16-drink tier-1 pool of
      §8.6 (`Kopi`, `Kopi C`, `Kopi O`, `Kopi ga dai`, `Kopi gao`, `Kopi po`, `Kopi peng`,
      `Kopi da bao` and the eight `Teh` equivalents), asserted by name via `formatOrder`.
- [ ] `tests/e2e/preview.spec.ts` asserts both vessels render at a 360px viewport with
      `scrollWidth === clientWidth`.
- [ ] The full gate passes: `npm run typecheck && npm run lint && npm run test && npm run build && npm run e2e`.

---

## Sprint 26 — Liquid colour model [NOT STARTED]

**Goal:** Derive the drink's colour from its slots as one pure function over all eighteen cases.

**Track:** Track B (presentation)
**Estimate:** 4h augmented
**Dependencies:** Sprint 25
**Touches:** `src/graphics/**`

### S26-1 — `liquidColor` pure function

*As the implementing agent, I want liquid colour computed by one pure function over three slots, so that "gao deepens, po lightens" is an assertion about relative luminance instead of a design opinion.*

**Technical context:** §9.4's requirements are ordering claims, so test them as ordering claims: compute WCAG relative luminance from the returned hex and assert monotonicity per base×milk pair. Reuse the luminance helper M0 wrote for §9.2's contrast-matrix test rather than writing a second one.

**Acceptance criteria:**
- [ ] `src/graphics/liquid.ts` exports
      `liquidColor(base: Base, milk: Milk, strength: Strength): string`, pure, with no DOM,
      no `Math.random` and no module-level mutable state.
- [ ] Return value always matches `/^#[0-9a-f]{6}$/i`. Asserted across all
      2 × 3 × 3 = 18 combinations.
- [ ] `src/graphics/liquid.test.ts` covers all 18 combinations explicitly, not by sampling.
- [ ] `gao` deepens and `po` lightens: for each of the 6 base×milk pairs,
      `L(po) > L(normal) > L(gao)` strictly, where `L` is WCAG relative luminance.
      18 comparisons.
- [ ] Milk ordering per §9.4: for each base and strength, `L(evaporated) > L(condensed) > L(none)`,
      and `none` is near-black — `L(base, 'none', 'gao') < 0.05`.
- [ ] `condensed` is warm tan and `evaporated` is paler grey-tan: assert
      `saturation(condensed) > saturation(evaporated)` for each base and strength, computed
      in HSL from the returned hex.
- [ ] Golden fixture `tests/fixtures/liquid-colors.json` holds the 18 values keyed
      `<base>|<milk>|<strength>` and is asserted key-for-key, so a colour change is a
      visible diff rather than a silent drift.
- [ ] `DrinkPreview` drives the `fill` of `data-testid="drink-liquid"` from
      `liquidColor(drink.base, drink.milk, drink.strength)` — asserted equal for all 240
      valid drinks, in both vessels.
- [ ] `sugar`, `temperature` and `vessel` do not affect liquid colour: a test asserts the
      fill is identical across all 4 sugar values, both temperatures and both vessels for a
      fixed base/milk/strength.
- [ ] The full gate passes: `npm run typecheck && npm run lint && npm run test && npm run build && npm run e2e`.

---

## Sprint 27 — Peng: ice and condensation [NOT STARTED]

**Goal:** Render the iced variant — cubes and condensation — so `peng` reads instantly.

**Track:** Track B (presentation)
**Estimate:** 4h augmented
**Dependencies:** Sprint 26
**Touches:** `src/graphics/**`

### S27-1 — Ice cubes and condensation droplets

*As a player, I want an iced drink to visibly carry ice and condensation, so that I can confirm `peng` from the preview without re-reading the TEMP row.*

**Technical context:** §3.7's `Math.random` ban is lint-enforced only inside `src/game/`, so nothing stops a random scatter here — and a random scatter would move every animation frame once M2 wires rAF. Positions therefore come from a committed constant offset table in the module, and re-render stability is asserted directly on markup.

**Acceptance criteria:**
- [ ] `src/graphics/Ice.tsx` and `src/graphics/Condensation.tsx` exist, rendering
      `data-testid="drink-ice"` and `data-testid="drink-condensation"` respectively.
- [ ] Placement comes from an exported frozen constant array of offsets in
      `src/graphics/ice-layout.ts`. A test asserts the ice cube count equals
      `ICE_OFFSETS.length` and that the array is frozen.
- [ ] No randomness in the presentation graphics:
      `grep -rn "Math.random" src/graphics/ src/components/` exits non-zero, wired as a test
      since the M0 purity lint rule scopes to `src/game/` only.
- [ ] Re-render stability: rendering the same drink twice yields byte-identical
      `outerHTML` for the preview subtree; and changing an unrelated slot
      (`sugar: 'normal' → 'kosong'`) leaves every ice and droplet coordinate attribute
      unchanged.
- [ ] Across all 240 valid drinks, `drink-ice` and `drink-condensation` are present iff
      `temperature === 'peng'` and absent for `'hot'`, in both vessels.
- [ ] `peng` is not colour-only (§9.2): a test asserts the `peng` preview contains at least
      one element the `hot` preview does not, comparing element counts by testid rather
      than fills.
- [ ] Ice and condensation are static: a test asserts every ice and droplet node computes
      `animation-name: none` and `transition-duration: 0s`.
- [ ] `tests/e2e/preview.spec.ts` gains a `peng` case asserting both testids visible at 360px
      with `scrollWidth === clientWidth`.
- [ ] The full gate passes: `npm run typecheck && npm run lint && npm run test && npm run build && npm run e2e`.

---

## Sprint 28 — The cup↔bag transition [NOT STARTED]

**Goal:** Animate the vessel swap with a reduced-motion branch that swaps instantly.

**Track:** Track B (presentation)
**Estimate:** 4h augmented
**Dependencies:** Sprint 27
**Touches:** `src/graphics/**`, `src/styles/motion.css`

### S28-1 — Vessel transition with a reduced-motion branch

*As a player with `prefers-reduced-motion` set, I want the cup↔bag change to be an instant swap, so that the game's one animation does not make me ill.*

**Technical context:** CSS-only — §10.1 forbids adding an animation library without a story that justifies it, and this story does not. §11.3 puts the animation last on the pre-authorised descope ladder while §9.7 makes the instant swap non-cuttable, so build the instant swap as the base case and the transition as the enhancement, and assert both branches settle on identical DOM.

**Acceptance criteria:**
- [ ] The transition lives in `src/graphics/DrinkPreview.module.css` plus
      `src/graphics/DrinkPreview.tsx`. No new dependency:
      `git diff --exit-code main -- package.json package-lock.json` exits zero (§11.3).
- [ ] `VESSEL_TRANSITION_MS` is exported from `src/graphics/DrinkPreview.tsx`, asserted
      `<= 300` and asserted strictly less than the 600ms wrong-serve lockout of §8.3, so the
      animation can never outlive the R5 lockout window.
- [ ] Reduced-motion branch: with `matchMedia('(prefers-reduced-motion: reduce)')` mocked
      true, toggling `vessel` produces the target vessel's DOM in a single render — a test
      asserts `drink-saucer` and `drink-bag-handle` are never simultaneously present and
      that every preview node computes `transition-duration: 0s` and `animation-name: none`.
- [ ] Both branches converge: a test renders the `bag` end state via the animated branch
      (after advancing fake timers past `VESSEL_TRANSITION_MS`) and via the reduced-motion
      branch, and asserts the two `outerHTML` strings are identical.
- [ ] `tests/e2e/vessel-transition.spec.ts` runs the same toggle under
      `page.emulateMedia({ reducedMotion: 'reduce' })` and asserts
      `document.getAnimations().length === 0` at every step; and under
      `{ reducedMotion: 'no-preference' }` asserts at least one running animation during the
      toggle and zero after settling.
- [ ] The transition is triggered only by a `vessel` change: a test asserts toggling
      `temperature`, `sugar`, `milk` or `strength` starts no animation.
- [ ] `src/graphics/` still imports nothing outside `src/game/types.ts` and
      `src/game/view.ts`; the `tests/lint/fixtures/` boundary fixture stays red under
      `npm run lint`.
- [ ] The full gate passes: `npm run typecheck && npm run lint && npm run test && npm run build && npm run e2e`.

---

## Sprint 29 — Queue cards: structure and order text [NOT STARTED]

**Goal:** Build the queue card against the fixture catalogue, rendering the order through `formatOrder` and nothing else.

**Track:** Track B (presentation)
**Estimate:** 4h augmented
**Dependencies:** Sprint 3, Sprint 5, Sprint 9
**Touches:** `src/components/queue/**`

### S29-1 — Queue card structure and order text

*As a player, I want to tap a customer to focus them and see their order large enough to read under pressure, so that my next serve is aimed at the right person.*

**Technical context:** §9.6's "one chunk" rule is why face, order and ring share a single card with a single tap target — the rejected alternative split one 44px target into three and pushed all orders below the 28px floor. The 28px floor is absolute: shrink-to-fit to make the longest order fit is a failure, not a fix.

**Acceptance criteria:**
- [ ] `src/components/QueueCard.tsx`, `QueueCard.module.css` and
      `src/components/QueueList.tsx` exist, taking `{ queue, activeId, dispatch }` from
      `src/game/types.ts`.
- [ ] One chunk per customer (§9.6): each card has exactly one focusable descendant —
      the card root itself — asserted by querying focusable nodes within a card and
      expecting a count of 1.
- [ ] Order text is exactly `formatOrder(customer.order)` from `src/game/view.ts`,
      asserted across all 240 valid drinks enumerated locally and filtered with
      `isValidDrink`.
- [ ] The active card is expanded and the others compact: computed `font-size` of the
      active card's order text is `>= 28` at 360px and at 1100px (§9.3); non-active cards
      render at `--step-14` or `--step-16` and are strictly smaller.
- [ ] The longest tier-3 order `Teh O kosong gao peng da bao` renders in the active-card
      style at a 360px viewport in `tests/e2e/queue.spec.ts` with card
      `scrollWidth <= clientWidth`, page `scrollWidth === clientWidth`, and computed
      `font-size >= 28` — no shrink-to-fit escape hatch.
- [ ] Tapping a card dispatches exactly `{ type: 'FOCUS', customerId }` with that card's id;
      asserted for all three positions on the three-customer fixture.
- [ ] R22 / R3: rendered card ids deep-equal `queue.map(c => c.id)` and are strictly
      ascending, so `queue[0]` is the front the engine's focus rule refers to. Asserted on
      the one-, two- and three-customer fixtures.
- [ ] `Q`/`W`/`E` focus queue positions 1/2/3 (§9.7), dispatching `FOCUS` with the id at
      that index. With fewer customers than the key addresses — `E` on a two-customer
      fixture, any of the three on the empty-queue fixture — the key is an explicit no-op
      with a dispatch spy count of 0.
- [ ] Never more than 3 cards (§8.7): a test asserts the rendered card count equals
      `queue.length` for every catalogue fixture and never exceeds 3.
- [ ] The empty-queue fixture renders a placeholder with non-empty accessible text and no
      thrown error.
- [ ] The full gate passes: `npm run typecheck && npm run lint && npm run test && npm run build && npm run e2e`.

---

## Sprint 30 — Queue cards: patience ring and moods [NOT STARTED]

**Goal:** Add the patience ring and the three mood faces, reading the band from `view.moodFor` and never re-deriving the ratio.

**Track:** Track B (presentation)
**Estimate:** 4.5h augmented
**Dependencies:** Sprint 29
**Touches:** `src/components/queue/**`

### S30-1 — Patience ring and mood faces

*As a player, I want customer faces to visibly change mood as patience drains, so that I can decide who to serve next without reading three orders.*

**Technical context:** §9.6 puts the mood enum in exactly one place — `moodFor` in the frozen view barrel — and forbids either track recomputing the ratio. The two boundary values belong to the lower band, so `p = 0.60` is `impatient` and `p = 0.30` is `angry`; the M0 catalogue ships fixtures at exactly those values and this story asserts against them rather than against a locally derived number.

**Acceptance criteria:**
- [ ] `src/components/PatienceRing.tsx` and `src/components/MoodFace.tsx` exist, rendered
      inside `QueueCard`.
- [ ] The ring is continuous: `stroke-dasharray`/`stroke-dashoffset` computed from
      `patienceMs / maxPatienceMs`, asserted exactly at `p = 1`, `p = 0.5` and `p = 0`
      against the circumference formula.
- [ ] The ring carries `role="progressbar"`, `aria-valuemin="0"`, `aria-valuemax="100"` and
      `aria-valuenow` equal to `Math.round(p * 100)`.
- [ ] Mood comes only from `moodFor(patienceMs, maxPatienceMs)` in `src/game/view.ts`:
      `grep -nE "0\.6|0\.3|patienceMs\s*/" src/components/QueueCard.tsx src/components/MoodFace.tsx`
      exits non-zero, wired as a test (§9.6 — neither track recomputes the ratio).
- [ ] Boundaries asserted at the exact fixtures: the `p === 0.60` fixture renders
      `impatient` and the `p === 0.30` fixture renders `angry`; a fixture just above each
      boundary renders `calm` and `impatient` respectively.
- [ ] Three distinct faces: the `d` attributes of the `calm`, `impatient` and `angry` face
      paths are pairwise distinct, asserted as a set of size 3.
- [ ] Never colour-only (§9.2, §9.6): each card's accessible name contains the mood word
      (`calm` / `impatient` / `angry`) in addition to the shape change, asserted for all
      three bands.
- [ ] `angry` uses `--chilli-red` (4.54:1 on `--condensed-cream`, §9.2). A test asserts every
      colour the ring and face resolve to is one of the token values in `tokens.css` and that
      any pairing used for text appears in §9.2's approved contrast matrix.
- [ ] Determinism: rendering the same customer twice yields byte-identical card
      `outerHTML`; `grep -rn "Math.random" src/components/` exits non-zero.
- [ ] Under `prefers-reduced-motion: reduce` the ring updates with
      `transition-duration: 0s` and `document.getAnimations().length === 0`, asserted in
      `tests/e2e/queue.spec.ts`.
- [ ] The full gate passes: `npm run typecheck && npm run lint && npm run test && npm run build && npm run e2e`.

---

## Sprint 31 — The visual harness [NOT STARTED]

**Goal:** Put every fixture on one dev-only route — a leaf that makes the catalogue eyeballable, not a gate the rest of the track waits behind.

**Track:** Track B (presentation)
**Estimate:** 3h augmented
**Dependencies:** Sprint 5, Sprint 9
**Touches:** `src/dev/gallery/**`

### S31-1 — Fixture gallery route

*As the implementing agent, I want every named `GameState` in the M0 catalogue rendered side by side on one route, so that I can build and assert presentation work against fixed inputs instead of simulating an engine that does not exist yet.*

**Technical context:** The gallery is scaffolding under `src/dev/`, which an M2 story deletes wholesale (§10.5), so nothing outside `src/dev/` may import it. Mount it behind `import.meta.env.DEV || import.meta.env.VITE_E2E` — the same flag as §10.7's test seam — so Playwright can reach it in a built app while the production bundle stays clean.

**Acceptance criteria:**
- [ ] `src/dev/FixtureGallery.tsx` exists and enumerates the catalogue programmatically
      via `Object.entries(fixtures)` from `src/dev/fixtures.ts` — adding a fixture later
      requires no gallery edit. A test asserts the rendered section count equals
      `Object.keys(fixtures).length`.
- [ ] Each fixture renders inside a section carrying `data-testid="fixture-<exportName>"`
      and a visible heading whose text is the exact export name.
- [ ] A test asserts the catalogue covers every §10.5-required snapshot by name: empty
      queue; one, two and three customers; `calm`, `impatient` and `angry`; the two exact
      boundary states `p === 0.60` and `p === 0.30`; `activeId` set and `activeId === null`;
      `lockoutMs > 0`; immediately post-wrong-serve; `phase === 'break'`; and
      `phase === 'gameover'` with an R16-truncated `shiftResults`. At least 13 named entries.
- [ ] A test asserts every fixture satisfies R22 — `queue` is strictly ascending by `id`
      and `queue.length <= 3` (§8.7) — and that `comboTenths` is an integer in 10…30 (§8.8),
      so a malformed fixture fails here rather than in a component test.
- [ ] `src/dev/FixtureGallery.test.tsx` mounts the gallery over the whole catalogue and
      asserts zero `console.error` and zero `console.warn` calls.
- [ ] The gallery and every module it renders import only from `src/game/types.ts`,
      `src/game/view.ts` and `src/dev/fixtures.ts`. The M0 boundary fixture under
      `tests/lint/fixtures/` — a presentation module importing `src/game/engine.ts` — still
      fails `npm run lint` with `no-restricted-imports`, asserted by the M0 ESLint-API test.
- [ ] `tests/e2e/gallery.spec.ts` builds with `VITE_E2E=1`, loads `#/dev/gallery` at a
      360×640 viewport, and asserts `document.documentElement.scrollWidth === clientWidth`
      and that the count of `[data-testid^="fixture-"]` equals the catalogue length.
- [ ] A production build strips it: `npm run build` (no `VITE_E2E`) followed by
      `grep -rl "FixtureGallery" dist/assets` exits non-zero. Wired as a test, not a manual step.
- [ ] `git diff --exit-code main -- package.json package-lock.json` exits zero — §11.3 forbids
      dependency edits inside a track sprint.
- [ ] The full gate passes: `npm run typecheck && npm run lint && npm run test && npm run build && npm run e2e`.

---

## Sprint 32 — How to Play: the grammar reference [NOT STARTED]

**Goal:** Fill the How to Play registry slot from `view.ts` and the tokens — it teaches the grammar and needs no engine, so it fills an idle runner.

**Track:** M3 (slack-fill)
**Estimate:** 3.5h augmented
**Dependencies:** Sprint 3, Sprint 5
**Touches:** `src/app/HowToPlay.tsx`, `src/app/HowToPlay.module.css`

### S32-1 — The grammar reference card

*As Maria, I want a reference card explaining every modifier so that I can learn the grammar as a system rather than memorising phrases.*

**Technical context:** Drive the card off `SLOT_ROW_LABELS` and `SLOT_VALUE_LABELS` from the frozen `src/game/view.ts` barrel rather than a hand-written list, so a slot value can never exist in the grammar without appearing on the card. Every printed example is verified by running it back through `parseOrder`, which makes the documentation itself a test.

**Acceptance criteria:**
- [ ] `src/components/HowToPlay.tsx` renders the canonical order of §7.2 as `Base → Milk → Sugar → Strength → Temperature → Vessel`.
- [ ] The card renders one row per entry of `SLOT_VALUE_LABELS`, asserted by counting rendered rows against the barrel's own entry count — 16 values across six slots — so adding a value forces a card row.
- [ ] All nine non-default modifiers (`C`, `O`, `siew dai`, `ga dai`, `kosong`, `gao`, `po`, `peng`, `da bao`) carry a meaning drawn from §7.1 and one example order, each example exposed on a `data-example` attribute.
- [ ] Every example is verified: for each `data-example` scraped from the rendered DOM, `parseOrder(text)` is non-null, `isValidDrink(parseOrder(text))` is true, and `formatOrder(parseOrder(text)) === text`.
- [ ] The §7.3 validity rule is stated with both offending pairs named (condensed × `siew-dai`, condensed × `kosong`) and with R18's note that those buttons stay tappable and carry the invalid marker.
- [ ] The §9.7 keyboard list is rendered and asserted item for item: `Q`/`W`/`E` focus queue positions 1/2/3, `↑`/`↓` move between slot rows, `1`–`4` select within a row, `Enter` serves and dismisses the break card, `?` opens help, `Esc` pauses.
- [ ] Body text renders `--teak` on `--condensed-cream` (11.44:1); no text on the card uses a pair absent from §9.2's matrix.
- [ ] The card scrolls vertically only: `document.scrollWidth <= document.clientWidth` at a 360px viewport with the card open.

---

## Sprint 33 — Game screen, portrait [NOT STARTED]

**Goal:** Compose the §9.5 portrait layout from the finished slot rows, vessel and queue cards.

**Track:** Track B (presentation)
**Estimate:** 4.5h augmented
**Dependencies:** Sprint 24, Sprint 25, Sprint 30
**Touches:** `src/app/GameScreen.tsx`, `src/app/GameScreen.module.css`

### S33-1 — Portrait composition

*As Ah Seng, I want the whole game on a phone screen in portrait with everything reachable one-handed, so that I can play standing up in 90 seconds.*

**Technical context:** "Lower two-thirds" (§9.7) is testable as a bounding-box assertion at a fixed viewport, which is why the composition is a story rather than a styling pass. Score and combo must render `--teak` on a `--kaya-yellow` plate — the inverse pair measures 1.61:1 and is banned outright by §9.2.

**Acceptance criteria:**
- [ ] `src/components/GameScreen.tsx` and `GameScreen.module.css` exist, taking state as
      props and reading `dispatch` from `useEngine()` in `src/app/EngineContext.tsx` —
      the only module naming an engine implementation (§10.5).
- [ ] DOM order top→bottom matches the §9.5 wireframe: header, queue, drink preview, slot
      selectors, SERVE. Asserted by comparing `compareDocumentPosition` across five testids.
- [ ] Header renders hearts, logo, combo and score. Combo displays `comboTenths / 10` to one
      decimal, computed from the integer (§8.8): `x1.0` at `comboTenths === 10` and `x3.0` at
      `comboTenths === 30`. `grep -n "0\.1" src/components/GameScreen.tsx` exits non-zero.
- [ ] Score and combo compute to `--teak` on a `--kaya-yellow` plate (7.12:1, §9.2). A test
      resolves the computed foreground/background pair and asserts it appears in §9.2's
      approved matrix.
- [ ] Hearts are not colour-only: 3 hearts render for a full-hearts fixture, the last heart
      uses `--chilli-red` (4.54:1) *and* a distinct shape, and the hearts group carries an
      accessible name stating the count.
- [ ] One-handed reach (§9.7): `tests/e2e/game-screen.spec.ts` at 360×640 asserts every
      interactive element — the 16 slot buttons, SERVE, and every queue card — has
      `boundingBox().y >= 640 / 3`.
- [ ] No horizontal scroll: the e2e loops every fixture in the gallery catalogue at 360px
      and asserts `document.documentElement.scrollWidth === clientWidth` for each.
- [ ] SERVE spans the width: `boundingBox().width >= 0.9 * 360` and `height >= 44`; clicking
      dispatches exactly `{ type: 'SERVE' }`.
- [ ] R4 affordance: with `activeId === null` the SERVE button carries `aria-disabled="true"`
      and clicking it dispatches nothing.
- [ ] R5 affordance (§9.7): with `lockoutMs > 0` SERVE carries `aria-disabled="true"` and
      renders a depleting bar whose width is proportional to `lockoutMs / 600`, asserted at
      two distinct lockout values.
- [ ] Boundary intact: `GameScreen` imports only `src/game/types.ts`, `src/game/view.ts` and
      `src/app/EngineContext.tsx`; the `tests/lint/fixtures/` boundary fixture stays red under
      `npm run lint`.
- [ ] The full gate passes: `npm run typecheck && npm run lint && npm run test && npm run build && npm run e2e`.

---

## Sprint 34 — Game screen, desktop [NOT STARTED]

**Goal:** Add the 1100px three-column composition above the portrait fallback.

**Track:** Track B (presentation)
**Estimate:** 4h augmented
**Dependencies:** Sprint 33
**Touches:** `src/app/GameScreen.tsx`, `src/app/GameScreen.module.css`

### S34-1 — Desktop three-column composition

*As Maria on a desktop, I want the game laid out as a counter viewed head-on, so that the queue, the drink and the controls each get the space they need.*

**Technical context:** "Do not simply stretch the mobile layout" (§9.5) is asserted as a geometry difference between breakpoints, not as a review opinion: three columns share a y-range at 1440px and stack disjointly at 360px. §11.3 pre-authorises a centred single-column fallback as the third rung of the descope ladder — take it without asking if the three-column geometry cannot be made to pass, and record the decision in `docs/sprint.md`.

**Acceptance criteria:**
- [ ] A single breakpoint constant lives in `src/styles/tokens.css` as a custom property and
      is referenced by `GameScreen.module.css`; no second breakpoint literal exists in
      `src/components/` — asserted by grep.
- [ ] At a 1440px viewport the content container's `boundingBox().width === 1100` (§9.5) and
      is centred: `left` and `1440 - (left + width)` differ by at most 1px.
- [ ] Three columns, left to right: `queue.x + queue.width <= preview.x` and
      `preview.x + preview.width <= selectors.x`, asserted in
      `tests/e2e/game-screen-desktop.spec.ts`.
- [ ] SERVE spans the control column: `serve.x === selectors.x` and
      `serve.width === selectors.width` within 2px, with `serve.y >= selectors.y + selectors.height`.
- [ ] Not a stretched mobile layout: one test asserts that at 1440px the queue, preview and
      selectors have overlapping y-ranges, and at 360px their y-ranges are pairwise disjoint.
- [ ] The floors survive the breakpoint: at 1440px the active order text still computes
      `font-size >= 28` (§9.3), every one of the 16 slot buttons is still `>= 44 × 44` (§9.7),
      and `scrollWidth === clientWidth`.
- [ ] Pre-authorised descope (§11.3): if the three-column geometry cannot pass, ship the
      centred single-column fallback and record it in `docs/sprint.md`. The fallback must
      still satisfy the 1100px centring, no-horizontal-scroll, 44×44 and 28px criteria above,
      and the three-column geometry assertions are then removed rather than skipped.
- [ ] Every catalogue fixture renders at 1440px with zero `console.error` and no horizontal
      scroll.
- [ ] The full gate passes: `npm run typecheck && npm run lint && npm run test && npm run build && npm run e2e`.

---

## Sprint 35 — Presentation test suite [NOT STARTED]

**Goal:** Sweep every fixture through every component and enforce the contrast matrix, closing Track B.

**Track:** Track B (presentation)
**Estimate:** 3.5h augmented
**Dependencies:** Sprint 28, Sprint 34
**Touches:** `tests/presentation/**`

### S35-1 — Catalogue sweep, lockout affordance and contrast enforcement

*As the implementing agent, I want the presentation layer verified against every fixture and every approved colour pair, so that M2 can swap in the real engine knowing the UI is already decidably correct.*

**Technical context:** M0's contrast test checks the token pairs in isolation; this one checks what actually rendered, which is where a wrong pairing survives. Walk the rendered tree, resolve each text node's computed foreground and background back to token values, and fail on any pair absent from §9.2's table — `--kaya-yellow` text on `--condensed-cream` at 1.61:1 is the specific failure this catches.

**Acceptance criteria:**
- [ ] `src/components/GameScreen.fixtures.test.tsx` iterates every named export of
      `src/dev/fixtures.ts`, mounts `GameScreen`, and asserts zero throws, zero
      `console.error` and zero `console.warn` for each — at least the 13 §10.5 snapshots.
- [ ] R5 lockout affordance (§9.7), asserted on the mid-lockout fixture: SERVE has
      `aria-disabled="true"` and a depleting bar; all 16 slot buttons have
      `aria-disabled="true"`; every queue card rejects focus changes; and a dispatch spy
      records 0 calls after a click on SERVE, a click on a slot button, a click on a queue
      card, and each of `↑`, `↓`, `1`, `Q`, `Enter`.
- [ ] Under `prefers-reduced-motion: reduce` the lockout bar is a static disabled state:
      `animation-name: none`, `transition-duration: 0s`, and the tipped-away drink is removed
      instantly rather than animated.
- [ ] Contrast matrix over rendered output: a test walks every text-bearing node of
      `GameScreen` for every fixture, resolves the computed colour/background pair to
      `tokens.css` values, and asserts each pair is one of the six in §9.2's table and
      computes `>= 4.5:1`. A deliberately wrong pairing added in the test's own scratch
      fixture must make it fail, proving the check bites.
- [ ] 44×44 sweep (§9.7): `tests/e2e/a11y.spec.ts` loads every catalogue fixture at 360×640
      and asserts every interactive element has `boundingBox().width >= 44` and `height >= 44`.
- [ ] Reduced-motion sweep: every catalogue fixture under
      `page.emulateMedia({ reducedMotion: 'reduce' })` reports
      `document.getAnimations().length === 0` after settling.
- [ ] Track B touched no engine code: `git diff --name-only main -- src/game/` is empty, so
      §10.7's 100% `src/game/` coverage threshold is unaffected by this track.
- [ ] Bundle budget holds with the SVG work in (§9.8): the M0 CI check asserting the gzipped
      `dist/assets` total is under 200KB is green on this branch.
- [ ] A production build still excludes `src/dev/`:
      `grep -rl "FixtureGallery\|stubEngine" dist/assets` exits non-zero.
- [ ] The full gate passes: `npm run typecheck && npm run lint && npm run test && npm run build && npm run e2e`.

---

## Sprint 36 — The engine swap [NOT STARTED]

**Goal:** Close the seam: point `EngineContext` at the real reducer with zero component edits.

**Track:** M2
**Estimate:** 4h augmented
**Dependencies:** Sprint 13, Sprint 22, Sprint 35
**Touches:** `src/app/EngineContext.tsx`

### S36-1 — Swap `EngineContext` from the stub to the real engine

*As the implementing agent, I want `useEngine()` to return real engine state so that the presentation built against fixtures becomes the actual game without touching a single component.*

**Technical context:** §10.5 makes `src/app/EngineContext.tsx` the only module in the codebase that names either implementation, so this is a one-file import swap plus a `useReducer` over `applyAction` seeded by `createInitialState`. `src/dev/` stays on disk until Sprint 46; nothing outside `EngineContext.tsx` may reference it.

**Acceptance criteria:**
- [ ] `src/app/EngineContext.tsx` imports `createInitialState`, `tick` and `applyAction` from `src/game/engine.ts` and contains no import from `src/dev/`; `grep -rn "src/dev\|stubEngine" src/app/` exits non-zero.
- [ ] `useEngine()` still exports exactly `{ state, dispatch }`; its TypeScript signature is unchanged from M0 and `npm run typecheck` passes with no edit to any file under `src/components/` or `src/graphics/`.
- [ ] `git diff --name-only <sprint-base>..HEAD -- src/components src/graphics` returns empty output — the seam held.
- [ ] A test in `tests/` renders every M1b component against real engine states produced by folding a scripted tick/action list through `tests/support/fold`, and asserts the rendered DOM matches the snapshots previously produced from the corresponding `src/dev/fixtures.ts` entries — empty queue, one/two/three customers, active and no-active, mid-lockout, post-wrong-serve, break, R16-truncated game over.
- [ ] `dispatch({ type: 'START_RUN', mode: 'endless', seed: <pinned> })` followed by one `tick(state, 0)` yields `queue.length === 1` per R11 (`nextArrivalMs` starts at 0), and `state.builder` deep-equals plain `Kopi` per R1.
- [ ] `applyAction(state, { type: 'START_RUN', mode, seed })` deep-equals `createInitialState(mode, seed)` for both modes, asserted through the context's own reset path per §10.3.
- [ ] `src/game/` line coverage remains 100% under the §10.7 Vitest thresholds (`provider: 'v8'`, `all: true`, `include: ['src/game/**/*.ts']`, `exclude: ['src/game/types.ts']`, `perFile: true`).
- [ ] The full gate passes — `npm run typecheck && npm run lint && npm run test && npm run build && npm run e2e`.

---

## Sprint 37 — The rAF clock [NOT STARTED]

**Goal:** Own the animation frame in React and feed `dtMs` into a reducer that knows nothing about wall-clock time.

**Track:** M2
**Estimate:** 4h augmented
**Dependencies:** Sprint 36
**Touches:** `src/app/useGameClock.ts`

### S37-1 — The requestAnimationFrame loop

*As a player, I want the game to advance in real time at 60fps and to survive my switching tabs, so that patience drains honestly and returning does not instantly cost me three hearts.*

**Technical context:** R20 splits the quantisation in two — the engine accumulates `dtMs` into `tickRemainderMs` and applies whole `TICK_MS = 16` steps, while the React layer floors its own rAF delta, carries its own separate fraction, and clamps a single frame to `MAX_FRAME_MS = 250`. Both fractions must exist independently; collapsing them into one loses sub-millisecond time on every frame. `MAX_FRAME_MS` is read from `src/game/config.ts` per §10.4, never written as a literal in `src/app/`.

**Acceptance criteria:**
- [ ] The loop lives in the React layer (`src/app/useGameClock.ts`, consumed by `src/app/EngineContext.tsx`); `grep -rn "Date.now\|performance.now\|setTimeout\|Math.random" src/game/` exits non-zero and the M0 purity lint fixtures still fail lint with their asserted `ruleId`s.
- [ ] `src/game/config.ts` exports `MAX_FRAME_MS === 250` and `TICK_MS === 16`; `grep -rn "250\|\b16\b" src/app/useGameClock.ts` finds no numeric literal for either.
- [ ] Unit test with an injected fake rAF driver: timestamps `0, 16.7, 33.4, 50.1` produce dispatched `dtMs` of exactly `[16, 17, 17]`, all integers, and the running sum equals `Math.floor(50.1)` — the fraction is carried, never dropped.
- [ ] Clamp test: a single frame delta of `5000` passes exactly `250` to `tick`, and the following frame's `dtMs` is not inflated by the discarded 4750ms.
- [ ] Pause test: with `phase === 'paused'` per R19, 10000ms of fake wall clock elapses, `RESUME` is dispatched, and the next frame's `dtMs` is `≤ 250`; every queued customer's `patienceMs` is byte-identical across the pause.
- [ ] `tick` is never called with a negative or non-integer `dtMs` — asserted over 1000 fake frames including a timestamp that goes backwards.
- [ ] E2E: with the game playing, `window.__KOPI__.getState().queue[0].patienceMs` sampled 500ms apart is strictly decreasing, and the drop is within `[400, 700]`ms.
- [ ] The full gate passes — `npm run typecheck && npm run lint && npm run test && npm run build && npm run e2e`.

---

## Sprint 38 — Live HUD [NOT STARTED]

**Goal:** Render hearts, score and combo from real state — its own directory, so it runs beside the clock rather than behind it.

**Track:** M2
**Estimate:** 4h augmented
**Dependencies:** Sprint 36
**Touches:** `src/components/hud/**`

### S38-1 — Hearts, score and combo from real state

*As Ah Seng, I want a live score and combo I can read at arm's length, so that I know whether the run is worth defending.*

**Technical context:** §8.8 stores combo as integer tenths precisely so the 3.0 cap comparison and §4.1's determinism survive; the HUD divides by 10 for display only and must never accumulate a float. §9.2 forbids `--kaya-yellow` text on `--condensed-cream` (1.61:1) — score and combo render as `--teak` on a `--kaya-yellow` plate (7.12:1) seated in the header chrome.

**Acceptance criteria:**
- [ ] The HUD reads `state.hearts`, `state.score`, `state.comboTenths` and `state.bestComboTenths`; starting hearts (3) comes from `src/game/config.ts`, asserted by a grep test finding no `3` heart literal under `src/components/`.
- [ ] Combo renders as `comboTenths / 10` to one decimal: `10 → "x1.0"`, `23 → "x2.3"` (the §9.5 mock), `30 → "x3.0"`; a test sweeps all integers 10…30 and asserts no rendered value exceeds `x3.0` and no float artefact such as `2.9999999999999996` or `1.0999999999999999` ever appears in the DOM.
- [ ] Score increments by `Math.round(100 * comboTenths / 10)` on a correct serve: asserted at `comboTenths === 10` (+100), `=== 23` (+230) and `=== 30` (+300), computed from the integer.
- [ ] Computed styles: the score element and the combo element each resolve `color` to `--teak` and `background-color` to `--kaya-yellow`; a test asserts this pair is present in the committed §9.2 contrast matrix at 7.12:1 and reuses M0's contrast test to prove ≥ 4.5:1.
- [ ] No element in the HUD renders `--kaya-yellow` as a text colour on `--condensed-cream`; asserted by scanning computed foreground/background pairs of every text node in the header against the approved matrix, failing on any pair absent from the table.
- [ ] Hearts: three glyphs render at 3 hearts, one at 1; the last heart uses `--chilli-red` on `--condensed-cream` (4.54:1) *and* a shape or label change, with an `aria-label` stating the remaining count — colour is never the only carrier per §9.2.
- [ ] Header text uses `--condensed-cream` on `--kopitiam-green` (5.89:1); order and body text remain `--teak` on `--condensed-cream` (11.44:1).
- [ ] No horizontal scroll at a 360px viewport with `hearts === 3`, `score === 9999999` and `comboTenths === 30` — `document.documentElement.scrollWidth === clientWidth`.
- [ ] The full gate passes — `npm run typecheck && npm run lint && npm run test && npm run build && npm run e2e`.

---

## Sprint 39 — Game over [NOT STARTED]

**Goal:** Fill the game-over registry slot per R16.

**Track:** M2
**Estimate:** 3.5h augmented
**Dependencies:** Sprint 36
**Touches:** `src/app/GameOver.tsx`, `src/app/GameOver.module.css`

### S39-1 — The R16 game-over screen

*As a player, I want my score, orders served and best combo at game over, so that I know whether that run was good and can immediately start another.*

**Technical context:** R16 ends the run the moment hearts hit zero — only the walkout that took the last heart is recorded, and customers still waiting are discarded and produce no result. High-score persistence lands in M3, so this sprint reads the value through a single accessor in `src/app/` that M3 repoints at `src/storage/` in one file.

**Acceptance criteria:**
- [ ] The game-over screen mounts iff `state.phase === 'gameover'`, and displays score, orders served, best combo as `bestComboTenths / 10`, high score, and a Play Again control.
- [ ] R16: the step in which the third heart is lost sets `phase === 'gameover'`, emits `heartLost` with `remaining: 0` and `gameOver` in `frameEvents`, and stops — no arrival, no focus re-resolution and no shift-end fire in the same step (R21 steps 4 and 5, R23).
- [ ] R16 truncation: with two customers still queued when the last heart falls, `shiftResults` records only the walkout that ended the run; the discarded customers contribute no entry, asserted by total glyph count across `shiftResults`.
- [ ] Orders served is derived from `shiftResults` (`clean` + `fumbled` entries) and equals `servesCorrect`; a fumbled-then-served customer counts once, and per R14 a fumbled customer who later walked out counts as `walkout`.
- [ ] Play Again dispatches `START_RUN` with a fresh seed; the resulting state deep-equals `createInitialState(mode, seed)` per §10.3, with `builder` reset to plain `Kopi` (R1) and `comboTenths === 10`.
- [ ] The high-score value is read through a single accessor module under `src/app/`; the screen renders without throwing when no stored value exists, falling back to the current run's score — `grep -rn "localStorage" src/components/` exits non-zero.
- [ ] Play Again is ≥ 44 × 44 CSS pixels, keyboard focusable with a visible focus ring, activates on `Enter`, and renders `#FFFFFF` on `--kopitiam-green` (6.49:1) per §9.2.
- [ ] E2E: drive hearts to zero with `window.__KOPI__.advance`, assert the game-over screen is visible, click Play Again, assert `phase === 'playing'` and `score === 0`.
- [ ] The full gate passes — `npm run typecheck && npm run lint && npm run test && npm run build && npm run e2e`.

---

## Sprint 40 — E2E determinism hook [NOT STARTED]

**Goal:** Point `window.__KOPI__.advance` at the real engine so Playwright never waits eighteen real seconds.

**Track:** M2
**Estimate:** 3.5h augmented
**Dependencies:** Sprint 36
**Touches:** `src/app/EngineContext.tsx`, `tests/e2e/determinism.spec.ts`

### S40-1 — `window.__KOPI__.advance` drives the real engine

*As the implementing agent, I want to fast-forward engine time from a test, so that end-to-end coverage of walkouts, shift ends and game over runs in milliseconds and stays deterministic.*

**Technical context:** `advance(ms)` must *not* apply the rAF layer's `MAX_FRAME_MS` clamp — that clamp exists only to protect a resumed background tab. R20 explicitly guarantees a single `tick` may spawn and walk out several customers because Playwright fast-forwards a shift, so `advance(30000)` must deliver all 30000ms as whole `TICK_MS` steps with the remainder carried. The seam is gated behind `import.meta.env.VITE_E2E` and stripped from the production bundle.

**Acceptance criteria:**
- [ ] With `VITE_E2E` set, `window.__KOPI__` exposes exactly `advance(ms)`, `getState()` and `dispatch(action)`; without it, `window.__KOPI__ === undefined`.
- [ ] `grep -r "__KOPI__" dist/assets/` on a production `npm run build` exits non-zero — the seam is stripped, not merely disabled.
- [ ] `advance(ms)` routes through the same `tick` path as the rAF clock and applies the full `ms`: `advance(30000)` advances engine time by exactly 30000ms, asserted by `patienceMs` deltas and step count — it is **not** clamped to `MAX_FRAME_MS` 250.
- [ ] `advance` is synchronous with respect to React state: `getState()` called on the next line reflects the advanced state, asserted in a Playwright spec without any `waitFor`.
- [ ] Fast-forward behaviour: starting a breakfast shift (patience 18.0s from `config.ts`) and calling `advance(18000)` without serving decrements `hearts` by exactly 1 and pushes one `walkout` into `shiftResults[0]` (R21 step 3).
- [ ] Multi-departure in one call: `advance` over a span covering two customers' patience walks out both, in ascending `id` order per R21 step 3 and R22.
- [ ] `?seed=` and `?date=` query params are consumed at `START_RUN`; loading with a pinned `?seed=` twice and replaying the identical `advance`/`dispatch` script yields byte-identical `JSON.stringify(getState())` (excluding `frameEvents`, which R21 overwrites per call).
- [ ] `advance(0)` and `advance` with a sub-`TICK_MS` value return the identical state reference and accumulate into `tickRemainderMs` per R20.
- [ ] The full gate passes — `npm run typecheck && npm run lint && npm run test && npm run build && npm run e2e`.

---

## Sprint 41 — Input gating and engine-owned focus [NOT STARTED]

**Goal:** Move R3, R4 and R5 into the reducer so focus and lockout are engine state rather than component state.

**Track:** M2
**Estimate:** 3.5h augmented
**Dependencies:** Sprint 37, Sprint 40
**Touches:** `src/game/engine.ts`, `src/app/GameScreen.tsx`

### S41-1 — Engine-owned focus and lockout gating

*As a player, I want focus to jump to the front of the line when my customer leaves and my taps to be genuinely ignored during the wrong-serve lockout, so that the game never disagrees with itself about who I am serving.*

**Technical context:** R5 ignores *all* player actions during lockout including slot changes and focus changes, which means gating cannot live in a click handler — `applyAction` must return the identical state reference, and the UI reads `lockoutMs` only to render the §9.7 depleting bar and `aria-disabled`. R6 keeps patience draining underneath, so the lockout is a real cost.

**Acceptance criteria:**
- [ ] No component holds focus or lockout in local state: a grep test asserts zero matches of `useState` on the same line or within the same declaration as `/activeId|focus|lockout/i` anywhere under `src/components/`.
- [ ] Tapping a queue card dispatches exactly `{ type: 'FOCUS', customerId }`; the rendered active card is derived solely from `state.activeId`.
- [ ] R3: after the active customer is served, and separately after the active customer walks out, `state.activeId === state.queue[0].id` (front of queue, ascending by `id` per R22), and `null` when the queue is empty. Both paths tested by folding real engine states.
- [ ] R4: `SERVE` with `activeId === null` leaves `score`, `comboTenths`, `hearts`, `lockoutMs`, `servesAttempted` and `servesCorrect` unchanged, and `Object.is(before, after)` holds.
- [ ] R5: while `lockoutMs > 0` (600ms from `config.ts`, no literal in components), dispatching `FOCUS`, every `SET_SLOT` variant, `SERVE` and `PAUSE` each satisfy `Object.is(before, after)`.
- [ ] R6: patience drains during the lockout — a fold asserts `patienceMs` strictly decreases across the 600ms window while `lockoutMs` counts down to exactly 0.
- [ ] §9.7 visibility: while `lockoutMs > 0` the SERVE button carries `aria-disabled="true"` and a depleting bar element, and each of the six slot rows carries `aria-disabled="true"` — asserted by attribute, and a second assertion confirms the disabled state is not carried by colour alone (a label or attribute change is present).
- [ ] Keyboard `Q`/`W`/`E` dispatch `FOCUS` for queue positions 1/2/3 per §9.7 and are no-ops during lockout; all interactive targets remain ≥ 44 × 44 CSS pixels.
- [ ] `src/game/` line coverage remains 100%.
- [ ] The full gate passes — `npm run typecheck && npm run lint && npm run test && npm run build && npm run e2e`.

---

## Sprint 42 — Shift ramp and the break card [NOT STARTED]

**Goal:** Run all four shifts end to end with the R8 end condition and the between-shift break card.

**Track:** M2
**Estimate:** 4h augmented
**Dependencies:** Sprint 37, Sprint 41
**Touches:** `src/components/break/**`, `src/game/engine.ts`

### S42-1 — The four-shift ramp and the break card

*As a player, I want the difficulty to rise across four named shifts with a breather between them, so that a run has shape and a bad patch is recoverable.*

**Technical context:** R8's end condition is *spawned and departed*, not spawned — a shift with a customer still in the queue is not over, however many have been served. R23 makes R16 preempt both R8 and R15 in the same step, so a run can never simultaneously end and clear a shift. All counts, tiers, patience values and gaps come from `config.ts` and its three selectors (§10.4).

**Acceptance criteria:**
- [ ] Shift customer counts read from `config.ts` and assert 6 / 8 / 10 / 10 for breakfast / lunch / tea / supper; `tierFor` returns 1, 2, then 2 for tea customers 1–5 and 3 for 6–10, and 3 for supper.
- [ ] R8: `phase` becomes `break` only when `spawnedInShift` equals the shift's count *and* `queue.length === 0`; a fold asserts `phase === 'playing'` while a customer from an otherwise exhausted shift is still queued.
- [ ] R9: with `phase === 'break'`, `window.__KOPI__.advance(30000)` leaves `phase === 'break'` and the card mounted; only `DISMISS_BREAK` clears it. `Enter` dismisses per §9.7.
- [ ] The card renders customers served, walkouts, best combo as `bestComboTenths / 10`, and the next shift name in the §8.5 form (`"LUNCH CROWD INCOMING"`), all read from state and `config.ts`.
- [ ] R15: `+500` is added and displayed on entering the break only when `walkoutsInShift === 0`; tested both ways, and a shift with wrong serves but zero walkouts still earns it.
- [ ] R11: the first tick after `DISMISS_BREAK` yields `queue.length === 1` — the next shift's first customer arrives immediately.
- [ ] R23: a walkout that takes the last heart while the shift's spawn count is exhausted produces `phase === 'gameover'`, no `shiftCleared` event in `frameEvents`, and no `+500`.
- [ ] `shiftResults` gains exactly one inner array per shift entered (§8.9), and per-shift lengths for a completed Endless run through supper are `[6, 8, 10, 10]`.
- [ ] Every text pair on the card is drawn from the §9.2 approved matrix; the dismiss control is ≥ 44 × 44 CSS pixels and keyboard focusable with a visible focus ring.
- [ ] The full gate passes — `npm run typecheck && npm run lint && npm run test && npm run build && npm run e2e`.

---

## Sprint 43 — Pause (R19) [NOT STARTED]

**Goal:** Put the grammar reference behind a mid-game pause that stops the clock per R19.

**Track:** M2
**Estimate:** 2.5h augmented
**Dependencies:** Sprint 37, Sprint 32
**Touches:** `src/app/Pause.tsx`, `src/app/Pause.module.css`

### S43-1 — Mid-game help behind R19 PAUSE

*As Maria, I want to open the reference mid-game without losing my run so that I can look something up while three customers are waiting.*

**Technical context:** R19 makes `tick` a total no-op while `phase === 'paused'`, and §10.3's identity contract means the state reference must come back unchanged — that is the assertion, not an approximate patience comparison. `PAUSE` is legal only from `playing`, so opening help from the title must dispatch nothing.

**Acceptance criteria:**
- [ ] The overlay opens mid-run from a help control and from the `?` key, dispatching `PAUSE` on open and `RESUME` on close; `Esc` both pauses and closes.
- [ ] Opening the overlay from `phase === 'title'` dispatches no `PAUSE` — asserted on the dispatch spy — and R19's legality is respected: `PAUSE` from any phase other than `playing` leaves state unchanged.
- [ ] Patience does not drain across a pause: a fold that pauses, applies forty `tick(state, 250)` calls and resumes asserts `queue[0].patienceMs` is identical before and after, and asserts `Object.is` on the state reference across every paused tick.
- [ ] R19 composes with R5: `lockoutMs` is asserted preserved — not decremented — across a pause taken while `lockoutMs > 0`, and resumes counting down after `RESUME`.
- [ ] Every action except `RESUME` is ignored while paused: `SET_SLOT`, `FOCUS`, `SERVE` and `DISMISS_BREAK` each assert an identical state reference.
- [ ] `tests/e2e/pause.spec.ts` starts a pinned run, records `queue[0].patienceMs`, opens help, calls `window.__KOPI__.advance(10000)`, closes help, and asserts the patience value is unchanged and `phase === 'playing'`.
- [ ] The overlay is `aria-modal`, traps Tab focus within itself, and returns focus to the control that opened it on close.
- [ ] The full gate passes: `npm run typecheck && npm run lint && npm run test && npm run build && npm run e2e`.

---

## Sprint 44 — Render performance [NOT STARTED]

**Goal:** Memoise against the state-identity contract so the game holds 60fps.

**Track:** M2
**Estimate:** 4h augmented
**Dependencies:** Sprint 38, Sprint 39, Sprint 42
**Touches:** `src/components/queue/**`, `src/components/slots/**`, `src/components/hud/**`, `src/graphics/**`

### S44-1 — Memoisation against the state-identity contract

*As a player on a 2021-class phone, I want the game to hold 60fps during play, so that the patience rings read smoothly while I am triaging three customers.*

**Technical context:** `tick` returns the *identical* state reference when nothing changed and preserves object identity for `builder` and for any unchanged `Customer` (§10.3). That makes `React.memo` with default reference equality sufficient — the SVG preview keys off `state.builder`, each queue card off its own `Customer` object. Any component that rebuilds a props object inline per frame defeats this, so props passed to memoised subtrees must be identity-stable slices, not fresh literals.

**Acceptance criteria:**
- [ ] The drink preview in `src/graphics/` and the patience-ring component are wrapped in `React.memo`; their props are `state.builder` and the `Customer` object respectively, with no inline object or array literal in the parent's JSX for those props.
- [ ] Identity test: fold 1000 ticks with no `SET_SLOT`; `Object.is(state.builder, initialBuilder)` holds throughout, per §10.3.
- [ ] Render-count test with a counting wrapper: across those 1000 ticks the drink preview renders exactly once while patience rings re-render (their `Customer` changes each step).
- [ ] Zero-change frames: 100 consecutive rAF frames with `phase === 'paused'` (R19 makes `tick` a total no-op) produce zero renders of the preview and zero of the rings, and `Object.is(next, prev)` holds on the state for every one of those frames.
- [ ] Sub-step frames: 10 consecutive frames of `dtMs` below `TICK_MS = 16` with no event due return the identical state reference and produce zero renders of either component.
- [ ] A `SET_SLOT` produces exactly one preview re-render and zero re-renders of any queue card.
- [ ] E2E frame budget: sample `requestAnimationFrame` deltas over 2000ms of active play with three customers queued; assert the median interval ≤ 20ms and the 95th percentile ≤ 34ms, and that no frame is passed a `dtMs` above `MAX_FRAME_MS` 250.
- [ ] No animation, state-management or CSS framework dependency added (§10.1); gzipped `dist/assets` total remains under the 200KB budget from §9.8.
- [ ] The full gate passes — `npm run typecheck && npm run lint && npm run test && npm run build && npm run e2e`.

---

## Sprint 45 — The Playwright smoke test [NOT STARTED]

**Goal:** Play a scripted run end to end in a real browser, per §10.7.

**Track:** M2
**Estimate:** 5h augmented
**Dependencies:** Sprint 39, Sprint 40, Sprint 42
**Touches:** `tests/e2e/**`

### S45-1 — The §10.7 smoke test

*As the implementing agent, I want one end-to-end test that plays a real correct serve against the built app, so that "the game works" is a command that exits zero rather than a claim.*

**Technical context:** Only a *correct* serve pays (§8.8), so the test cannot mash slots — it must read `formatOrder(getState().queue[0].order)`, decompose it, and click the six matching slot buttons. It runs against the built bundle with a pinned `?seed=`, using `advance` rather than real waiting.

**Acceptance criteria:**
- [ ] `tests/e2e/smoke.spec.ts` exists and runs against the production build served locally, loaded with a pinned `?seed=`.
- [ ] The spec reads the active order via `formatOrder(window.__KOPI__.getState().queue[0].order)`, clicks the six matching slot controls, and presses SERVE.
- [ ] The score delta after that serve is strictly positive and equals exactly `100` — `Math.round(100 * comboTenths / 10)` with `comboTenths === 10` at run start (§8.8).
- [ ] `comboTenths` is `11` after the serve, `servesAttempted === 1`, `servesCorrect === 1` (R25), and `hearts` is unchanged.
- [ ] R2/§8.2: `getState().builder` deep-equals the served drink after the serve — the builder did not reset.
- [ ] A negative control in the same spec deliberately flips one slot away from the order, serves, and asserts score delta `0`, `comboTenths === 10`, `lockoutMs === 600` from `config.ts`, `hearts` unchanged (§8.3, R7), and `queue[0]` still present.
- [ ] The active order text renders at a computed `font-size` ≥ 28px at a 360px viewport (§9.3), and `document.documentElement.scrollWidth === clientWidth` throughout the spec — no horizontal scroll.
- [ ] Zero `console.error` and zero uncaught page errors are recorded during the spec.
- [ ] The spec completes in under 10 seconds of wall clock by using `window.__KOPI__.advance` for all time passage — no `page.waitForTimeout` above 1000ms appears in the file.
- [ ] The full gate passes — `npm run typecheck && npm run lint && npm run test && npm run build && npm run e2e`.

---

## Sprint 46 — Delete src/dev and the integration tail [NOT STARTED]

**Goal:** Remove the scaffolding and forbid its return, closing M2.

**Track:** M2
**Estimate:** 5.5h augmented
**Dependencies:** Sprint 8, Sprint 31, Sprint 45
**Touches:** `src/dev/**`, `eslint.config.js`, `vitest.config.ts`

### S46-1 — Delete `src/dev/` and forbid its return

*As the implementing agent, I want the stub and its fixture catalogue gone and its absence enforced by lint, so that no later story can silently render against a fake engine.*

**Technical context:** §10.5 named this deletion as an M2 story from the start, and §10.7 requires the `src/dev/` coverage exclusion to carry a comment naming it — both ends of that promise close here. Tests that consumed `src/dev/fixtures.ts` are rewritten to fold real engine states through `tests/support/`, not deleted.

**Acceptance criteria:**
- [ ] `src/dev/stubEngine.ts` and `src/dev/fixtures.ts` are removed and `test -d src/dev` exits non-zero.
- [ ] The Vitest coverage config no longer excludes `src/dev/` and no longer carries the comment naming this story; the remaining config is exactly `provider: 'v8'`, `all: true`, `include: ['src/game/**/*.ts']`, `exclude: ['src/game/types.ts']`, `perFile: true`, `autoUpdate: false`, and `src/game/` reports 100% line coverage.
- [ ] ESLint `no-restricted-imports` bans any import path matching `**/dev/*` project-wide with an explanatory message.
- [ ] A new lint fixture under `tests/lint/fixtures/` importing from `src/dev/stubEngine` is added, and the M0 ESLint-API Vitest test is extended to assert that fixture fails with the specific `no-restricted-imports` `ruleId` — the boundary rule is proven to bite, not assumed.
- [ ] A grep test asserts zero occurrences of `src/dev`, `stubEngine` or `dev/fixtures` across `src/` and `tests/`, excluding `tests/lint/fixtures/` **and `tests/scaffold/`**. `tests/scaffold/tree.test.ts` names `src/dev` in its `DEV_DIRS` constant and in the `it.skipIf(!existsSync('src/dev'))` guard that lets the assertion self-retire when this sprint's first criterion lands; that guard is the correct behaviour, not a leftover, and this sprint does not own `tests/scaffold/**`. *(PF-2, drained at the Sprint 1 sync.)*
- [ ] Every test that previously consumed a named fixture now builds its state by folding real ticks and actions through `tests/support/` (`fold` / `advance` / `runUntil` / `expectSameState`) and is green, with the mood-band cases still asserting exactly `p = 0.60` and `p = 0.30` per §9.6.
- [ ] The R22 property test — `queue` ascending by `id`, `nextCustomerId` monotonic, relative order preserved on every removal path — now runs against the engine alone and is green.
- [ ] The full gate passes — `npm run typecheck && npm run lint && npm run test && npm run build && npm run e2e`.

### S46-2 — The integration tail

*As the implementing agent, I want the whole gate green on a clean checkout in CI, so that M2 is demonstrably done rather than locally done.*

**Acceptance criteria:**
- [ ] `npm ci && npm run typecheck && npm run lint && npm run test && npm run build && npm run e2e` exits zero on a clean checkout in CI, with no `--no-verify`, no skipped spec and no `test.only`.
- [ ] The three golden fixtures are unchanged across the whole of M2: `git diff --stat <m2-base>..HEAD -- tests/fixtures/all-valid-drinks.json tests/fixtures/mulberry32.json tests/fixtures/daily-2026-08-28.json` is empty; the §7.6 round-trip sweep asserts index-for-index against the golden file, `allValidDrinks().length === 240`, and the 48 excluded combinations each fail `isValidDrink`.
- [ ] Tier pool sizes still assert exactly 16 / 144 / 240 (§8.6, R12), and R17's tier-1 unreachability of `siew dai` and `kosong` is unchanged.
- [ ] The `/* v8 ignore next */` grep-cap test is green and the count did not increase during M2; exhaustiveness inside `src/game/` remains compile-time via `satisfies never` with no `default: throw` arm.
- [ ] Determinism fold: the same pinned tick/action list folded twice produces byte-identical `JSON.stringify` of the resulting state, run once under `TZ=America/New_York`.
- [ ] E2E milestone check: a spec plays a full breakfast shift (6 customers, tier 1, patience 18.0s) via `advance` and correct serves, reaches `phase === 'break'`, asserts the `+500` shift-clear bonus (R15) and `shiftResults[0].length === 6`.
- [ ] CI asserts the gzipped `dist/assets` total under §9.8's 200KB budget.
- [ ] The full gate passes — `npm run typecheck && npm run lint && npm run test && npm run build && npm run e2e`.

---

## Sprint 47 — Daily run termination and the golden day [NOT STARTED]

**Goal:** Prove the 34-customer Daily terminates identically across builds, pinned by a committed golden fixture.

**Track:** M3
**Estimate:** 5h augmented
**Dependencies:** Sprint 20, Sprint 22
**Touches:** `tests/fixtures/daily-run.json`, `tests/game/daily-run.test.ts`

### S47-1 — The 34-customer Daily and its golden fixture

*As Ah Seng, I want the Daily to give everyone the same 34 orders and end at the day's end so that comparing scores in the group chat is fair.*

**Technical context:** R24 is a *departure* condition, not a spawn condition — the run ends when the 34th customer leaves the queue, so it fires inside step (5) of R21's pipeline after R16's game-over check has already had its say (R23). The +500 shift-clear bonus still evaluates for supper, then `phase` goes straight to `gameover` and never through `break`. Endless shares the same step and must not terminate there.

**Acceptance criteria:**
- [ ] Daily composition is derived, not restated: the total is computed by summing `config`'s per-shift customer counts and asserted to equal 34, with the per-shift breakdown asserted as `[6, 8, 10, 10]` read from `config` (§10.4 forbids §8 literals outside `config.ts`, fixtures included).
- [ ] R24 asserted by fold: a Daily run driven to the departure of the 34th customer ends with `phase === 'gameover'`, `shiftResults.length === 4`, and `shiftResults.flat().length === 34`. A test asserts `phase` is never `'break'` on or after that step.
- [ ] R24's bonus path asserted: a supper cleared with `walkoutsInShift === 0` emits a `shiftCleared` event carrying `bonus` equal to `config`'s shift-clear bonus, followed by `gameOver`, both in the same `frameEvents` array, in that order.
- [ ] R23 asserted against R24: a fold where the 34th customer *walks out* taking the last heart ends the run with only that walkout recorded, no `shiftCleared` event and no bonus added to `score`.
- [ ] Endless is unaffected: the identical fold with `mode: 'endless'` has `phase !== 'gameover'` at the 34th departure, and continues into a repeated supper with `gapMsFor` and `patienceMsFor` held at the §8.5 floors of 2000ms and 10000ms.
- [ ] `tests/fixtures/daily-2026-08-28.json` is committed, containing 34 entries of `{ order: string, patienceMs: number }` produced by folding a Daily run seeded with `hashDateSeed('2026-08-28')`.
- [ ] A test regenerates the sequence and asserts equality **index for index** against the golden file (not by length), and asserts a second independent fold from the same seed deep-equals the first.
- [ ] Every golden order round-trips: `parseOrder(entry.order)` is non-null, `isValidDrink` is true, and `formatOrder(parseOrder(entry.order)) === entry.order` for all 34.
- [ ] Tier budgets asserted against the golden per §8.5/§8.6: entries 1–6 have `nonDefaultCount <= 1`, entries 7–14 and 15–19 have `nonDefaultCount <= 3`, entries 20–34 are unconstrained.
- [ ] Golden patience values are asserted equal to `patienceMsFor(shiftIndex, customerIndex)` for every index, and supper's ten values are non-increasing and never below the 10000ms floor.
- [ ] `tests/e2e/daily.spec.ts` loads the built app with `?date=2026-08-28`, reads `formatOrder(window.__KOPI__.getState().queue[0].order)` and asserts it equals entry 1 of the golden file.
- [ ] R16 truncation asserted: a Daily fold forced to zero hearts during tea ends with `phase === 'gameover'`, `shiftResults.flat().length < 34`, and no result recorded for customers still queued.
- [ ] The full gate passes: `npm run typecheck && npm run lint && npm run test && npm run build && npm run e2e`.

---

## Sprint 48 — Stats and streaks [NOT STARTED]

**Goal:** Commit a finished run to storage and wire accuracy and streak arithmetic.

**Track:** M3
**Estimate:** 4.5h augmented
**Dependencies:** Sprint 11, Sprint 20
**Touches:** `src/storage/**`, `tests/storage/**`

### S48-1 — Run commit, accuracy and streak wiring

*As Ah Seng, I want my high score, streak and accuracy remembered so that I have something to beat.*

**Technical context:** Keep the arithmetic in a pure `recordRun(prev, result)` and let the React layer own only `load` → `recordRun` → `save`. The trap is the commit firing twice: React strict mode double-invokes effects, and a game-over effect keyed on `phase` will fire again on any re-render. Gate on a run identity, not on `phase` alone.

**Acceptance criteria:**
- [ ] `src/storage/stats.ts` exports a pure `recordRun(prev: Stats, result: RunResult): Stats` that never touches `localStorage`, where `RunResult` carries `mode`, `score`, `bestComboTenths`, `servesCorrect`, `servesAttempted` and `dailyDate`.
- [ ] `gamesPlayed` increments by exactly 1 per committed run, in both modes.
- [ ] `highScore` is `max(prev.highScore, score)` for `mode === 'endless'` only; an Endless-beating Daily score leaves `highScore` unchanged (§8.10 scopes high score to Endless).
- [ ] `bestComboTenths` is `max(prev.bestComboTenths, result.bestComboTenths)` and stays an integer in 10…30 — assert `Number.isInteger` on the result.
- [ ] R25 accumulation asserted: `servesCorrect` and `servesAttempted` are added to the stored totals, and a run whose only departures were walkouts (`servesAttempted === 0`) leaves both stored counters byte-identical to `prev`.
- [ ] `accuracy(stats)` returns `servesCorrect / servesAttempted` and returns `0` when `servesAttempted === 0`; assert `Number.isFinite(accuracy(DEFAULT_STATS))` so no `NaN` can ever reach the UI.
- [ ] Daily streak wired through `nextStreak` from `src/game/daily.ts`: a run one day after `lastDailyDate` increments `dailyStreak`, a two-day gap resets it to 1, and a first-ever Daily sets it to 1.
- [ ] Same-day replay asserted per §8.10: a second Daily run on the stored `lastDailyDate` leaves `dailyStreak` and `lastDailyScore` unchanged, while `gamesPlayed`, `servesCorrect` and `servesAttempted` still accumulate. Record this reading in the sprint file per §13's standing instruction.
- [ ] A Daily run ending at zero hearts still commits: assert `gamesPlayed` increments and `dailyStreak` extends for a `RunResult` derived from an R16-truncated state.
- [ ] Commit-once asserted: a test mounts the game-over screen twice (strict-mode double invocation) with the same run and asserts `gamesPlayed` increased by exactly 1 and `servesAttempted` by exactly the run's own count.
- [ ] The full gate passes: `npm run typecheck && npm run lint && npm run test && npm run build && npm run e2e`.

---

## Sprint 49 — Share grid [NOT STARTED]

**Goal:** Render the emoji grid and copy it to the clipboard.

**Track:** M3
**Estimate:** 4.5h augmented
**Dependencies:** Sprint 20, Sprint 48
**Touches:** `src/components/share/**`

### S49-1 — Emoji grid and clipboard copy

*As Ah Seng, I want to copy a spoiler-free emoji summary of my Daily run so that I can post it without giving away the answers.*

**Technical context:** Two traps. First, `navigator.clipboard.writeText` must be called synchronously inside the click handler — any `await` before it loses the user-gesture grant and the write silently rejects on Safari. Second, do not format the score with `toLocaleString`: it is locale-dependent and breaks §4.1's byte-identical target, so group the digits in a pure helper. The grid is rendered from `shiftResults` (§8.9) precisely because a flat array cannot be re-banded into 6/8/10/10 once R16 truncates a run.

**Acceptance criteria:**
- [ ] `src/game/share.ts` exports a pure `formatShareText({ date, score, shiftResults }): string` with zero DOM imports; it falls under the §10.7 coverage include and reaches 100% lines.
- [ ] Glyph mapping asserted per §8.9: `clean → 🟩`, `fumbled → 🟨`, `walkout → 🟥`. Shift groups are joined with `' · '`, and the legend line reads exactly `🟩 clean   🟨 fumbled first   🟥 walked out`.
- [ ] The header line is `Kopi Uncle <date>` plus the score with thousands separators from a pure formatter — asserted as `Kopi Uncle 2026-08-26   4,820` for that input, and asserted identical under a forced `TZ=America/New_York` and a non-`en` default locale.
- [ ] A full 34-glyph run produces exactly 34 glyphs in groups of 6/8/10/10 — assert both the total and each group length against `shiftResults` inner lengths.
- [ ] R16 truncation asserted: a run that ended at zero hearts during tea produces fewer than 34 glyphs, group lengths equal to the surviving `shiftResults` inner arrays, no empty group rendered and no trailing or doubled `' · '` separator.
- [ ] Spoiler-free asserted mechanically: the grid body's character set is a subset of `{🟩, 🟨, 🟥, ' ', '·'}`, and a test scans the full text for every one of the 240 formatted order strings and every modifier token (`kopi`, `teh`, `C`, `O`, `siew dai`, `ga dai`, `kosong`, `gao`, `po`, `peng`, `da bao`) case-insensitively, asserting zero matches.
- [ ] `src/components/ShareButton.tsx` renders on the game-over screen for `mode === 'daily'` only, meets the 44×44px target at a 360px viewport, and labels itself with `#FFFFFF` on `--kopitiam-green`.
- [ ] A test asserts `navigator.clipboard.writeText` is invoked synchronously within the click handler — no `await` executes before the call — and is called with exactly `formatShareText(...)`'s output.
- [ ] `tests/e2e/share.spec.ts` grants clipboard permissions, finishes a pinned Daily via the test seam, clicks Share, reads the clipboard back and asserts it equals the expected text character for character.
- [ ] The same spec re-runs with `navigator.clipboard` deleted via `addInitScript`, and with `writeText` stubbed to reject: in both cases a visible readonly text region appears containing the exact share text, is pre-selected, carries a visible instruction and an `aria-live` announcement, and the state is not carried by colour alone.
- [ ] The full gate passes: `npm run typecheck && npm run lint && npm run test && npm run build && npm run e2e`.

---

## Sprint 50 — Stats screen [NOT STARTED]

**Goal:** Fill the stats registry slot from the committed stats.

**Track:** M3
**Estimate:** 3.5h augmented
**Dependencies:** Sprint 5, Sprint 48
**Touches:** `src/app/StatsScreen.tsx`, `src/app/StatsScreen.module.css`

### S50-1 — Stats screen

*As Ah Seng, I want to see my games played, high score, best combo, streak and accuracy so that I know what I am beating.*

**Acceptance criteria:**
- [ ] `src/components/StatsScreen.tsx` renders five labelled readouts, each with a stable test id: games played, high score, best combo, daily streak, accuracy.
- [ ] Every value comes from `src/storage`'s `load()`; a source test asserts the component imports nothing from `src/game/engine`.
- [ ] Best combo renders as `bestComboTenths / 10` to one decimal with an `x` suffix — `23 → "2.3x"` — computed from the integer per §8.8, never from a float accumulation.
- [ ] Accuracy renders as a whole-number percentage from R25's `servesCorrect / servesAttempted`; with `servesAttempted === 0` it renders `—` and the rendered text is asserted never to contain `NaN` or `Infinity` in any case.
- [ ] Fresh storage renders zeros, streak `0` and accuracy `—`: asserted by an e2e that clears the key before load.
- [ ] A seeded blob written via `addInitScript` renders exact expected strings for all five readouts.
- [ ] A corrupt blob (`'{'`) written to the key renders the same defaults with no error boundary and no console error — this is S11-1's guarantee observed end to end.
- [ ] Back returns to `phase === 'title'`; the control is at least 44×44 CSS pixels and Tab-reachable with a visible focus ring.
- [ ] All text pairs come from §9.2's matrix — numeric readouts render `--teak` on a `--kaya-yellow` plate (7.12:1), never `--kaya-yellow` on `--condensed-cream`; `document.scrollWidth <= document.clientWidth` at 360px.
- [ ] The full gate passes: `npm run typecheck && npm run lint && npm run test && npm run build && npm run e2e`.

---

## Sprint 51 — Accessibility sweep [NOT STARTED]

**Goal:** Hold every animation, control and screen to §9.7's floor — reduced motion, keyboard-only play, WCAG AA.

**Track:** M3
**Estimate:** 6h augmented
**Dependencies:** Sprint 12, Sprint 34, Sprint 38, Sprint 39, Sprint 41, Sprint 42, Sprint 43, Sprint 44, Sprint 49, Sprint 50
**Touches:** `src/components/**`, `src/app/**`, `tests/presentation/**`

### S51-1 — prefers-reduced-motion across every animation

*As a player with reduced-motion set, I want animations to become instant state changes so that the game does not make me ill.*

**Technical context:** Assert computed styles under a Playwright context with `reducedMotion: 'reduce'`, not the presence of a media query in source — a query that targets the wrong selector reads as correct and does nothing. Pair the computed-style assertions with a source sweep so a newly added animation cannot ship without a reduce block.

**Acceptance criteria:**
- [ ] Under a `reducedMotion: 'reduce'` context, computed `animation-duration` and `transition-duration` are `0s` on: the walkout stamp, the wrong-serve tipped-drink feedback, the cup↔bag swap, the lockout bar, and the score/combo feedback.
- [ ] The walkout is an instant removal plus a static stamp per §9.7: after the walkout tick, the customer node is absent within the same frame and the stamp element is present and visible.
- [ ] The cup↔bag transition is an instant swap: after a `SET_SLOT` on `vessel`, the bag SVG is present on the next frame with no in-flight transition.
- [ ] The R5 lockout bar becomes a static disabled state: `aria-disabled="true"` on SERVE plus a text or icon marker, asserted not to be carried by colour alone.
- [ ] A source test walks every `*.module.css` under `src/` and asserts that any file containing `@keyframes`, `animation:` or `transition:` also contains a `@media (prefers-reduced-motion: reduce)` block; a fixture under `tests/lint/fixtures/` proves the check fires on a file that omits it.
- [ ] The default-motion context still animates: the same assertions run without `reducedMotion` and assert a non-zero duration on the cup↔bag swap, so the check cannot be satisfied by deleting the animations.

### S51-2 — Keyboard-only play and the WCAG AA audit

*As a keyboard player, I want to play the entire game without a mouse so that I can play fast on a laptop.*

**Acceptance criteria:**
- [ ] `tests/e2e/keyboard.spec.ts` completes a pinned run start to finish with keyboard input only, asserting a positive score delta; the spec never calls `page.mouse` or `.click()`, asserted by a listener counting `pointerdown` events and expecting 0.
- [ ] Each §9.7 binding is asserted individually: `Q`/`W`/`E` set `activeId` to `queue[0]`/`queue[1]`/`queue[2]` (no-op when that position is empty), `↑`/`↓` move the focused slot row, `1`–`4` select a value within the focused row, `Enter` serves, `Enter` dismisses the break card, `?` opens help, `Esc` pauses.
- [ ] The focused queue card and focused slot row are announced non-visually (`aria-current` or equivalent) and not carried by colour alone.
- [ ] Every focusable element shows a visible focus ring: an audit asserts computed `outline-width >= 2px` or a non-`none` `box-shadow` under `:focus-visible`, across title, game, help, stats and game-over.
- [ ] A contrast audit walks every rendered text node on all five screens, resolves computed `color` and effective background to hex, and asserts each pair is a member of §9.2's six-pair matrix with a computed ratio ≥ 4.5:1.
- [ ] The audit explicitly asserts zero occurrences of `--kaya-yellow` text on `--condensed-cream` (1.61:1) anywhere in the app.
- [ ] Active order text measures ≥ 28px computed `font-size` on every viewport, and the longest tier-3 order `Teh O kosong gao peng da bao` renders in the active-card style at 360px with `document.scrollWidth <= document.clientWidth`.
- [ ] Every interactive element across all five screens measures at least 44×44 CSS pixels via `boundingBox()` at a 360px viewport.
- [ ] The full gate passes: `npm run typecheck && npm run lint && npm run test && npm run build && npm run e2e`.

---

## Sprint 52 — Ship [NOT STARTED]

**Goal:** Prove the built app works offline, inside the bundle budget, and passes the same gate the agents did.

**Track:** M3
**Estimate:** 5h augmented
**Dependencies:** Sprint 4, Sprint 46, Sprint 49, Sprint 50, Sprint 51
**Touches:** `scripts/size-budget.mjs`, `tests/e2e/**`

### S52-1 — The offline test

*As a player on conference wifi, I want the game to keep working with the network down so that a dead hotspot does not end my run.*

**Technical context:** `setOffline(true)` only proves anything if the listener is attached before the first navigation and the play cycle actually exercises the SVG preview and the font stack after the cut. A late-loaded font or a lazily-chunked route is exactly what this catches.

**Acceptance criteria:**
- [ ] `tests/e2e/offline.spec.ts` registers a `page.on('requestfailed')` collector before navigation, loads the **built** app (`npm run build` output served, not the dev server) with a pinned `?seed=`, calls `context.setOffline(true)`, then completes a full focus → six `SET_SLOT` → SERVE cycle.
- [ ] The spec asserts a positive score delta after the offline serve and asserts the collected failed-request array has length 0.
- [ ] The offline cycle exercises the drink preview in both vessels: `cup` and `bag` both render post-cut, asserted by the presence of their SVG roots.
- [ ] A build-output test asserts constraint 3: no `http://` or `https://` asset URL appears in any file under `dist/` (`dist/index.html`, JS and CSS included), so no CDN font or script can have slipped in.
- [ ] A build-output test asserts constraint 4: `dist/` contains no `.png`, `.jpg`, `.jpeg`, `.gif`, `.webp` or `.avif` file.

### S52-2 — Bundle budget and load time

*As the implementing agent, I want the size and load-time claims asserted in CI so that "under 200KB, interactive in 2s" is a build failure rather than a slide.*

**Acceptance criteria:**
- [ ] A size script gzips the JS and CSS under `dist/assets`, excluding `.woff`/`.woff2` per §9.8, prints the total in bytes, and exits non-zero when the total is at or above 204800 bytes (200KB). The current total is printed in the PR body.
- [ ] The size script runs in CI as part of the gate, and a deliberate over-budget fixture run is shown to fail it.
- [ ] A load-time spec measures the built app under CDP 4G network emulation and 4× CPU throttling, from navigation start to the Play control being attached and responsive to `Enter`, and asserts the median of three runs is under 2000ms.
- [ ] The measured value is printed to stdout so a regression is visible in the CI log without re-running locally.
- [ ] The full e2e suite — smoke, daily, share, pause, keyboard, offline — runs against the built app served by `vite preview` and passes.
- [ ] The full gate passes: `npm run typecheck && npm run lint && npm run test && npm run build && npm run e2e`.

---

## Sprint 53 — Pages deploy and the live URL [NOT STARTED]

**Goal:** Publish the finished build to GitHub Pages behind the green gate, so that the thing the agents built has an address — last, because a URL that must stay green is a liability across an unattended run and buys nothing `npm run dev` does not.

**Track:** M4 publish
**Estimate:** 3h augmented
**Dependencies:** Sprint 4, Sprint 52
**Touches:** `.github/workflows/**`, `vite.config.ts`, `src/app/BuildStamp.tsx`, `src/app/BuildStamp.module.css`, `scripts/verify-deploy.mjs`, `README.md`, `tests/e2e/**`

**Technical context:** Everything here was Sprint 1's job in the v1.2 plan. It is last now for two reasons. A deployed URL is a standing obligation — standing instruction 3 would make any red URL preempt the current sprint, which across an unattended overnight run is an expensive interrupt for something nobody is watching. And the `base` path, the only part a late deploy could plausibly get wrong, was already derived and proven in S1-1, so nothing needs retrofitting.

### S53-1 — GitHub Actions Pages deploy, gated on the full gate

*As the project owner, I want `main` to publish itself only when the gate is green, so that §10.6's "a red gate must not publish" is enforced by the workflow graph rather than by discipline.*

**Acceptance criteria:**
- [ ] `.github/workflows/deploy.yml` triggers on `push` to `main`, declares `permissions: { contents: read, pages: write, id-token: write }` and `concurrency: { group: 'pages', cancel-in-progress: false }`.
- [ ] The workflow uses `actions/configure-pages`, `actions/upload-pages-artifact` with `path: dist`, and `actions/deploy-pages`; the repository's Pages source is set to GitHub Actions.
- [ ] The deploy job declares `needs:` on a job running all five §10.7 gate commands, so it cannot start until they pass, and is guarded by `if: github.event_name == 'push' && github.ref == 'refs/heads/main'`.
- [ ] A deliberate red run on a scratch branch shows the deploy job skipped; the run URL is recorded under this story and the branch is deleted.
- [ ] Exactly one workflow file in `.github/workflows/` contains `actions/deploy-pages@` — a grep over the directory, not over one file.
- [ ] The workflow runs `npm ci`, not `npm install`, and pins Node via `node-version-file`.
- [ ] `curl -fsS -o /dev/null -w '%{http_code}' "$PAGE_URL"` returns `200` after the first successful run, where `PAGE_URL` is the `deploy-pages` step's `page_url` output rather than a hard-coded address; the JS and CSS bundles referenced by the deployed `index.html` each return `200`, proving the §10.6 `base` path resolves on the Pages subpath.

### S53-2 — Build stamp, README URL and the deployed smoke run

*As a viewer landing on the deployed page, I want it to identify its commit, so that what I am looking at is unambiguous.*

**Acceptance criteria:**
- [ ] The page renders a build stamp containing the 7-character commit SHA, the build time as an ISO-8601 UTC string, and a link to the hosting repository composed from `GITHUB_SERVER_URL` and `GITHUB_REPOSITORY`, with a documented fallback when any of the three is unset so a local build never fails.
- [ ] The stamp values are injected at build time via `define` in `vite.config.ts` from `GITHUB_SHA` and the build clock; `GITHUB_SHA=deadbeefcafe npm run build` produces a `dist/` in which `deadbee` appears — grep assertion.
- [ ] `scripts/verify-deploy.mjs` fetches the deployed page and asserts the wordmark and the build stamp are present and that every referenced asset returns `200`, retrying on both a non-200 *and* a stale commit SHA so that Pages serving the previous build briefly does not red the run. Its behaviour is asserted by a test that serves a good fixture and a broken one over a local HTTP server and checks exit 0 and exit 1 — not by grepping its source.
- [ ] `README.md` records the live URL as reported by the deploy workflow and the deployed build stamp; the check derives the expected `https://<owner>.github.io/<repo>/` from `GITHUB_REPOSITORY` rather than a literal, and **skips rather than fails when `GITHUB_REPOSITORY` is absent or names a different repository**, so a fork's gate stays green.
- [ ] The full e2e suite runs once against the deployed URL via a base-URL override and passes.
- [ ] The full gate passes: `npm run typecheck && npm run lint && npm run test && npm run build && npm run e2e`.

---

## Non-blocking Review Backlog

Plan findings raised during review that do not block the PR they were found in,
per standing instruction 6. Drained between sprints by `sprintkit-sync`, not
inside a pull request. Append here; do not fix in place mid-sprint.

| Raised in | Finding | Affects | Status |
|---|---|---|---|
| Sprint 1 trial (PR #3) | `tests/scaffold/tree.test.ts` asserts a tracked file under `src/dev/`; Sprint 46 deletes that directory, reddening a test in `tests/scaffold/**`, which no sprint after 1 owns. Either give Sprint 46 that path or let the assertion self-retire when the directory is legitimately gone. | Sprint 46 | **CLOSED** — resolved by PR #1. `tree.test.ts` splits the Track B directories into their own `it.skipIf(!existsSync('src/dev'))` block, so the assertion retires when S46-1's `test -d src/dev` criterion lands. No plan edit needed. |
| Sprint 1 (PR #1, cycle 1) | **PF-1** — S8-1 requires "a committed placeholder spec under `tests/e2e/`" to prove Vitest's exclusion, but S1-1 mandates that `scripts/e2e.mjs` exit 1 on any `*.spec.ts` under `tests/e2e/` at any depth. Sprint 8 depended only on Sprint 3 and owns neither `scripts/e2e.mjs` (Sprint 6) nor `tests/e2e/**`, so scheduled before Sprint 6 it reds its own gate with no file it may edit. | Sprint 8 | **CLOSED** — drained at this sync. Sprint 8 now declares `**Dependencies:** Sprint 3, Sprint 6` and asserts the exclusion against Sprint 6's committed `tests/e2e/smoke.spec.ts` rather than committing one of its own; `Touches:` is unchanged. Sprint 6 is inside Sprint 1's fan, so the edge costs no wall-clock. |
| Sprint 1 (PR #1, cycle 1) | **PF-2** — S46-1's grep for zero occurrences of `src/dev` across `src/` and `tests/` matches `tests/scaffold/tree.test.ts`, which names `src/dev` in `DEV_DIRS` and in its `skipIf` guard. Sprint 46 does not own `tests/scaffold/**`. | Sprint 46 | **CLOSED** — drained at this sync. S46-1's exclusion list now reads `tests/lint/fixtures/` **and `tests/scaffold/`**, with the reason recorded inline: the `skipIf` guard is the correct self-retiring behaviour, not a leftover. `Touches:` unchanged. |
| Sprint 1 (PR #1, cycle 2) | **PF-3** — `tests/scaffold/build.test.ts` imports `basePathFor` from `vite.config.ts` and spawns two builds. If S8-1 splits Vitest into node and jsdom projects that file belongs in the node project, but Sprint 8 owns `vitest.config.ts` and not `tests/scaffold/**`. | Sprint 8 | **CLOSED** — drained at this sync. S8-1 gains a criterion placing `build.test.ts` in the node project and `title-screen.test.tsx` in the jsdom project, asserting no committed test file falls outside a project. The project globs live in `vitest.config.ts`, which Sprint 8 already owns, so `Touches:` is unchanged. |

**Drainage log — Sprint 1 sync (2026-08-27).** All three plan findings from PR
#1 were resolved in this file rather than deferred, per standing instruction 6
(drained between sprints) and standing instruction 1 (never ask; take the green,
reversible option and record the decision). Each is a one- to three-line edit to
a sprint that had no legal way to fix the defect itself. Every change is
reversible in one line, and no sprint's `Touches:` was widened — PF-1 added the
single dependency edge Sprint 8 → Sprint 6, and PF-2 and PF-3 were absorbed by
sprints that already owned the file the fix lives in. No blocking work was
carried over from Sprint 1: the review found 0 blockers, all six cycle-1
non-blockers were fixed in the same PR, and all 15 acceptance criteria are met.

---
