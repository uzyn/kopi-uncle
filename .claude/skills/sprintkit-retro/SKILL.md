---
name: sprintkit-retro
description: Reflection bookend for the sprint pipeline — runs after a sprint or PR merges to capture what was learned and feed it into the auto-memory system. Reflects on a merged sprint, a PR, or a time window — what shipped vs. what was planned, what went well, what was missed, what surprised us, and what should change about how we work. Proposes durable memory entries (project state, process feedback, references) and writes them only after confirmation. Use whenever the user says "retro", "retrospective", "do a retro", "reflect on the sprint", "post-mortem", "what did we learn", "lessons from this sprint", "reflect on what we shipped", or after a merge wants to capture learnings rather than just update status. Do NOT use to update sprint status or mark sprints done (use sprintkit-sync), to audit code quality across the repo, or to review a specific PR's correctness (use sprintkit-review).
---

# Retro

You run the retrospective — the "Reflect" step that closes a build cycle. After work merges, most teams jump straight to the next sprint and lose the lessons. Your job is to capture them while they're fresh, and to route the durable ones into long-term memory so future sessions actually benefit.

This is a **solo builder's** retro, not a team ceremony: no per-person breakdowns, no velocity theater. Focus on signal — what we learned and what should change.

## Mindset

- **Honest, not celebratory.** Wins matter, but the misses and surprises are where the learning is. Name them plainly.
- **Capture what's non-obvious.** A retro's value is the learning that isn't already recorded in code, git history, or the sprint file. Don't restate what the diff already says.
- **Memory is durable.** Anything you write to the auto-memory system persists across sessions and machines. Propose it, but write only after the user confirms.
- **You don't touch the plan.** Updating sprint status is `sprintkit-sync`'s job. The retro reflects and remembers; it does not edit `docs/<track>-sprint.md`.

## Process

### Phase 1 — Resolve scope

Figure out what we're reflecting on:

- **A merged sprint** (most common) — identify the track and the sprint. Read the relevant `docs/<track>-sprint.md` DONE sprint(s) for what was planned and the acceptance criteria.
- **A single PR** — reflect on one merged pull request.
- **A time window** — "this week", "since the last retro" — reflect across everything merged in that span.

If ambiguous, ask which. If multiple tracks exist, confirm the track.

### Phase 2 — Gather evidence

Look at what actually happened, don't rely on memory:

- `git log` over the window (or the sprint's merge), merged PRs (`gh pr list --state merged`), and the diff shape.
- **Planned vs. actual**: compare the sprint's acceptance criteria against what shipped. What slipped, what was added, what was cut?
- The track's **Non-blocking Review Backlog** (if present in the sprint file) — items that accumulated.
- Any prior retro notes (`docs/retros/`) so you don't repeat the same lessons.

### Phase 3 — Reflect

Produce a concise retro using this structure:

```markdown
# Retro: <scope> — <YYYY-MM-DD>

## Wins
What went well and is worth repeating.

## Misses
What slipped, broke, or fell short — and why.

## Surprises
What we didn't expect (good or bad), and what it tells us.

## Process learnings
What should change about *how we work* — tools, sequence, conventions, skill behavior.

## Follow-ups
Concrete next actions or tech debt to carry forward (carry these into the sprint plan separately, not here).
```

Keep it tight and specific. Each bullet should teach something.

### Phase 4 — Capture to memory

This is the point of the retro. From the reflection, identify the **durable** learnings worth persisting, and propose memory entries using the project's auto-memory system (the conventions are in your context — frontmatter, the `MEMORY.md` index pointer, one fact per file).

Map learnings to memory types:
- **`feedback`** — learnings about *how we should work* ("always run X before Y", "skill Z should do W"). Include the **Why** and **How to apply** so future sessions can act on it.
- **`project`** — durable state, decisions, or constraints about this project not derivable from code or git.
- **`reference`** — pointers to resources (dashboards, tickets, docs) that came up.

Discipline:
- **Dedupe first.** Check existing memories; update an existing file rather than creating a near-duplicate.
- **Skip the obvious.** Don't memorialize what the repo, git history, or sprint file already records. If asked to remember something derivable, capture instead *what was non-obvious about it*.
- **Confirm before writing.** Show the user the proposed entries (file + content) and write only on approval. Add the one-line `MEMORY.md` pointer for each.

### Phase 5 — Optional log

If the user wants a running record, append the Phase 3 retro to `docs/retros/<YYYY-MM-DD>-<scope>.md` (create `docs/retros/` if needed). This is optional — the primary outputs are the reflection in-conversation and the memory entries. Keep it light; this is not a sprint archive.

## Where this sits

The pipeline runs **sprintkit-prd → sprintkit-plan → implement ⇄ review → merge → sprintkit-sync → sprintkit-retro**. Retro is the bookend at the far end: the cycle opens by specifying what to build and closes by harvesting the lessons. `sprintkit-autopilot` may suggest a retro once all sprints are DONE.

## What this skill is not

- Not **sprintkit-sync** — that reconciles sprint status after a merge; retro never edits the sprint file.
- Not a codebase audit — that scans the whole codebase for issues; retro reflects on a cycle of work.
- Not **sprintkit-review** — that judges a PR's correctness; retro is about process and learning.
