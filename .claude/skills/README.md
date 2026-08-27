# Skills

The agent pipeline that builds this project. These are live — Claude Code loads
them automatically for anyone working in this repo, so cloning it gets you the
same setup that produced the game.

They ship here so attendees of the NUS-ISS Learning Festival 2026 talk
*"Agentic AI in Software Engineering, One Year On: Skills, Subagents, Loops"*
can read the actual instructions rather than a description of them.

## The pipeline

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

The plan is a dependency graph, so anything unblocked runs at once — up to four
sprints concurrently, each in its own git worktree, all driven by one
orchestrator. The merge stays single-file: only the controller merges, one PR at
a time.

| Skill | Role |
|---|---|
| `sprintkit-prd` | Interviews you into a full PRD. |
| `sprintkit-plan` | Converts a PRD into sprints with testable acceptance criteria, and declares the dependencies between them — which is what decides how wide the build fans out. |
| `sprintkit-implement` | Writes the code for a sprint's stories and opens the PR. |
| `sprintkit-review` | Strict review against the sprint's acceptance criteria and the PRD. |
| `sprintkit-sync` | Reconciles sprint status after a merge. |
| `sprintkit-graph` | Draws the plan as a dependency graph and predicts the schedule — what fans out, which runner gets what, the critical path, and an audit of cycles and accidental serialisation. Read-only. |
| `sprintkit-retro` | Closes the cycle — what shipped vs. planned, what to change, durable memory entries. |

## The loops

The part the talk is actually about. These orchestrate the skills above rather
than doing the work themselves.

| Skill | Role |
|---|---|
| `sprintkit-loop` | Implement → review → fix → re-review, until approved or a human is genuinely needed. Hard-stops at 8 cycles. |
| `sprintkit-autopilot` | The whole PRD, end to end — as a **scheduler**, not a list walk. Reads the plan as a dependency graph, runs every unblocked sprint (up to four at once, in separate worktrees), merges each PR itself, and refills the freed runner with whatever just became unblocked. A failed sprint blocks only its own subtree; the rest of the graph keeps building. Supports epic-branch mode so `main` stays releasable. |

## Evals

Five skills carry an eval harness under `evals/`:

```
sprintkit-prd/evals/evals.json
sprintkit-sync/evals/evals.json
sprintkit-plan/evals/evals.json
sprintkit-plan/evals/files/kopi-uncle/docs/prd.md
sprintkit-graph/evals/evals.json
sprintkit-graph/evals/trigger_evals.json
sprintkit-graph/evals/files/kopi-uncle/docs/sprint.md
sprintkit-graph/evals/files/broken/docs/sprint.md
sprintkit-implement/evals/evals.json
sprintkit-implement/evals/trigger_evals.json
sprintkit-implement/evals/files/kopi-uncle/docs/prd.md
sprintkit-implement/evals/files/kopi-uncle/docs/sprint.md
```

These are what makes a skill an engineering artifact rather than a wish.
`evals.json` grades output with and without the skill loaded;
`trigger_evals.json` measures whether the description fires on the right
prompts and stays quiet on the wrong ones — ten prompts that should fire it and
ten that should not, because a skill that triggers on everything is as broken as
one that never triggers. Run them with `claude plugin eval`.

The `evals/files/` fixtures are a condensed Kopi Uncle PRD and sprint plan,
copied into the eval sandbox so the runs are self-contained. The sprint fixture
marks Sprints 1–2 as DONE and Sprint 3 as NOT STARTED, which is what lets the
"implement the current sprint" eval check whether the skill actually works out
where it is instead of guessing.

## Provenance and caveats

- Snapshot of the author's personal `~/.claude/skills/` as of **2026-08-26**,
  since diverged. It is not a live mirror.
- **Renamed under a `sprintkit-` prefix**, and that is not cosmetic. A
  user-scoped skill shadows a project-scoped one of the same name, so while
  these carried their original names they were silently overridden on any
  machine that already had them in `~/.claude/skills/` — including the author's,
  which is where the repo's own fixes are supposed to take effect. Under a
  distinct prefix the repo's copies are the ones that run, and both sets can
  coexist. Attendees lifting these into their own projects can drop the prefix
  or keep it; keeping it is safer for exactly the same reason.
- Eight skills from that set were left out as irrelevant to this project:
  `epic-planner`, `ideate`, `task-impl-pr`, `task-impl-pr-review-loop`,
  `pr-reviewer`, `codebase-auditor`, `scrum-task-adder`, `sprint-compactor`.
  Where the remaining skills referred to them, the routing advice was rewritten
  to describe the situation instead of naming a skill that isn't here.
- Absolute `~/.claude/...` paths were rewritten repo-relative so the helper
  resolves from a clean clone.
- The `sprintkit-plan` and `sprintkit-implement` evals were originally written
  against a private project and referenced it by absolute path. They have been
  re-domained onto Kopi Uncle with self-contained fixtures. Structure,
  assertions and intent are unchanged — only the subject matter differs.
- No personal configuration is included. The author's global `CLAUDE.md`
  (language preferences, machine setup, install rules) stays out of this repo
  by design — these skills are the transferable part.

## Using them elsewhere

Copy any skill directory into `.claude/skills/` in your own project, or into
`~/.claude/skills/` to have it everywhere. They assume `git` and the `gh` CLI,
and the sprint skills assume a `docs/prd.md` and `docs/sprint.md` in the
conventional shape — run `sprintkit-prd` and `sprintkit-plan` first and you get
that for free.
