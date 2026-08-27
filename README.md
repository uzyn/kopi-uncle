# Kopi Uncle

**Can you take the order or not?**

A single-player, browser-based kopitiam game. You play the uncle behind the
counter. Customers queue up and call out drink orders in Singlish, you build
each drink on a six-slot counter, and you keep the line moving.

The hook is that ordering kopi in Singapore is a real formal grammar.
"Kopi C siew dai peng" is not slang noise — it is base plus milk plus sugar
plus temperature, spoken in a fixed order. The game teaches that grammar by
making you perform it under pressure.

You never lose for getting the drink wrong. You lose for making someone wait.

## Why this repo exists

Demo project for the NUS-ISS Learning Festival 2026 talk, _"Agentic AI in
Software Engineering, One Year On: Skills, Subagents, Loops"_.

The app is built almost entirely by AI agents running an autopilot sprint
loop. The PRD and the sprint plan are the human inputs.

## Running it

Two commands, no network after the install:

```bash
npm install
npm run dev
```

That serves the app at the URL Vite prints. There is no deployed URL yet — the
GitHub Pages workflow is the last sprint in the plan, and until then
`npm run dev` is what the build is judged against.

### The quality gate

Every story is done when this chain exits 0:

```bash
npm run typecheck && npm run lint && npm run test && npm run build && npm run e2e
```

`npm run lint` and `npm run e2e` are placeholders for now — each prints a banner
naming the sprint that replaces it, and each exits 1 the moment its real tooling
appears, so neither can report a green gate it did not earn. `npm run test` is
a real Vitest from the first merge.

Formatting is inside the gate, not beside it: `npm run test` runs
`prettier --check .` as one of its assertions, so an unformatted file reds the
`test` stage. These two commands fix it and check it without running the suite:

```bash
npm run format        # rewrite
npm run format:check  # verify
```

### One out-of-band install step

The browser binaries Playwright drives are not npm packages, so they install
once, by hand:

```bash
npx playwright install --with-deps chromium
```

Chromium is the only browser this project ever requires.

## Documentation

- [docs/prd.md](docs/prd.md) — the PRD
- [docs/sprint.md](docs/sprint.md) — the 53-sprint plan the agents execute.

## The agents that build this

The skills driving the build ship with the repo, in
[.claude/skills/](.claude/skills/) — read them there, or clone and they work.

```
sprintkit-prd → sprintkit-plan → a sprint graph
                                      │
                 ┌────────────────────┼────────────────────┐
                 ▼                    ▼                    ▼
          implement ⇄ review   implement ⇄ review   implement ⇄ review
                 └────────────────────┼────────────────────┘
                                      ▼
                                    merge → sprintkit-sync → sprintkit-retro
```

Nine skills, two of them orchestration loops (`sprintkit-loop`,
`sprintkit-autopilot`), and the eval harnesses that keep them honest. See
[.claude/skills/README.md](.claude/skills/README.md) for what each one does and
how to lift them into your own projects.

The sprint plan is a dependency graph rather than a list, so `sprintkit-autopilot`
runs as a scheduler: every sprint whose dependencies are met starts immediately,
up to four at a time in separate git worktrees, from one command. Merges stay
serialised through the orchestrator, and a sprint that fails blocks only what
depends on it — the rest of the graph keeps building unattended.

`/sprintkit-graph` draws that graph before anything runs — see
[docs/sprint-graph.md](docs/sprint-graph.md), which GitHub renders inline. It
also audits the plan, and the first draft did not survive it: 39 of 46 sprints
depended only on the sprint above them, so four runners bought 1.34× and sat 34%
utilised. It was a queue wearing a graph's clothes, and that diagnosis is the
point of drawing it.

The plan was re-cut against that audit. One sprint is now genuinely blocking —
it creates the tree, installs every dependency both tracks will ever need, and
gets `npm run dev` rendering — and finishing it releases **five sprints at
once**. The trick was not cleverer scheduling: it was moving every shared file
into the one sprint that runs alone, so nothing downstream has to wait its turn
for `package.json`.

Re-cutting it that way then produced a second, more interesting failure. The
blocking sprint had also been given the job of _binding_ the 51 sprints behind
it — a hash-frozen screen registry, a dependency freeze enforced by a test that
parsed the sprint plan. Its correctness could then only be judged against 51 sets
of acceptance criteria nobody had implemented yet, and no test can check prose
against prose. Review never converged: four cycles, three hours, 10,000 lines, no
merge, and four of one round's six findings were manufactured by the previous
round's fixes.

v1.3 replaces every enforced forward contract with a convention, scopes review to
the sprint under review, and publishes last instead of first. It was then
validated by actually running it — Sprint 1 plus four concurrent sprints, five
pull requests, all gates green, four defects found that no amount of reading
would have surfaced. 53 sprints.

## Design in brief

Up to three customers wait in line, each with a draining patience meter. Tap a
customer to focus them, build their drink on the one shared counter, and serve.
A walkout costs a heart; a wrong drink costs patience and your combo, but never
a heart.

The counter does not reset between serves — so reading the whole line and
choosing a service order that minimises slot changes is the skill ceiling.
Serve `Kopi C` to one customer, flip a single slot, serve `Kopi C siew dai` to
the next.

Four shifts — breakfast, lunch, tea, supper — each ramping arrival rate and
order complexity, with a breather between them.

## Stack

Vite · React · TypeScript (strict) · CSS Modules · Vitest · Playwright,
deployed static to GitHub Pages. No backend, no API keys, no runtime network
calls, no binary image assets — all graphics are inline SVG. It has to work on
a laptop with no internet after first load, because conference wifi is
unreliable.

## Layout

```
src/game/         pure logic, zero DOM imports — time and randomness are inputs
src/app/          the screen registry and one file pair per screen
src/dev/          the stub engine and fixture catalogue, deleted at integration
src/components/   one directory per cluster, so concurrent sprints stay disjoint
src/graphics/     inline SVG, including the drink preview
src/storage/      the versioned localStorage wrapper
src/styles/       tokens.css and motion.css
scripts/          one file per gate stage that owns its own tooling
tests/            unit, contract and e2e suites mirroring the source tree
```

The base path is derived from `GITHUB_REPOSITORY` at build time, so this
repository's name appears nowhere as a literal and a fork, a rename or a clone
under any name builds and deploys unchanged.

## Author

U-Zyn Chua · https://uzyn.com
