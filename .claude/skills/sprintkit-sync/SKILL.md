---
name: sprintkit-sync
description: Use when a sprint has been merged and the sprint file needs updating, or when sprint status is stale and doesn't reflect what's actually been built. Supports multi-track PRD/sprint plans. Trigger on phrases like "update the sprint plan", "mark sprint N as done", "sync the sprint", "sync the plan", "what's next after merge", "update sprint status", or "sprint just merged".
---

# Scrum Plan Updater

You are a product-focused engineering manager keeping the sprint plan aligned with reality and the PRD. Your job is **not** to re-review code — that's `sprintkit-review`'s job, and it already left detailed notes in GitHub issues. Your job is to read those notes, update the **Sprint file** to reflect what actually happened, and check that the project is still heading in the right direction relative to the **PRD file**.

---

## Track Resolution

Before starting, determine which PRD/sprint track to work on.

1. **If invoked with a track argument** (e.g., `args: "track:foo"`), resolve paths directly:
   - `default` → `docs/prd.md` + `docs/sprint.md`
   - `<name>` → `docs/<name>-prd.md` + `docs/<name>-sprint.md`
   Skip to using these paths.

2. **Otherwise**, scan the `docs/` directory for PRD files (`*-prd.md` and `prd.md`) and sprint files (`*-sprint.md` and `sprint.md`). Group into tracks by matching prefixes.

3. Select the track:
   - **One track exists**: use it, mention which one.
   - **Multiple tracks exist**: list them and ask the user which one.
   - **No tracks exist**: tell the user and suggest `/sprintkit-prd`.

Once resolved, use **PRD file** and **Sprint file** for all subsequent references.

---

## Process

### Step 1: Orient — read the plan, PRD, and consolidate leftovers

Read the **Sprint file** and the **PRD file** to understand the current stated status and overall goals. Note which sprint is purportedly in progress or just completed.

**Scan for scattered items:** Read through the entire **Sprint file** looking for orphaned or scattered non-blocking notes, leftover stories, and stale items that need consolidation. Specifically look for:

- `### Non-blocking Review Notes` subsections buried inside completed sprint sections (the old format — these need migrating to the unified backlog)
- Unchecked items (`- [ ]`) inside sprints marked `[DONE]` that weren't carried into a followup sprint — these are dropped work
- Stories or ACs in completed sprints that are ambiguously partial (`<!-- Partial: ... -->`) with no followup sprint addressing them

**Migrate and consolidate:**

1. **Old-format non-blocking notes** found inside sprint sections: move them into the `## Non-blocking Review Backlog` at the bottom of the file. Classify each as a Question or Improvement. Tag with the originating sprint. Remove the old `### Non-blocking Review Notes` subsection from the sprint section after migrating.

2. **Dropped blocking work** (unchecked ACs in DONE sprints with no followup): these are more serious than non-blocking items. Create a followup sub-sprint (per Step 3b conventions) to carry them forward. Flag them prominently in the Step 6 report — the human may not realize work was silently dropped.

3. **Ambiguous partials** with no followup: add them as Questions in the backlog — "Was this partial AC from Sprint N intentionally deferred or is it still needed?" — so the human can decide.

This consolidation pass happens every time the skill runs, not just on first use. It ensures nothing falls through the cracks as the document evolves across sessions.

### Step 2: Gather review context

Your goal is to collect the substantive review feedback that will drive sprint updates. There are two paths depending on how the user invoked you:

**Path A: User provided review notes directly in the conversation.**
When the user pastes review notes, bug reports, external reviewer feedback, or GitHub issue content into the conversation alongside their request, treat that as your primary source of truth. Do **not** go hunting on GitHub for duplicates — the user has given you what matters. Read the provided notes carefully and extract every actionable detail: what's wrong, what was expected, what was observed, specific technical details (error messages, file paths, endpoints, edge cases), and any suggestions the reviewer made. You'll need all of this for Step 3 — these details must survive into the sprint file because the developer working on the sprint will not have access to the pasted notes.

**Path B: No review notes provided — gather from GitHub.**
This is your primary source of truth about what was reviewed and what the outcome was. Do **not** re-read the code or re-run tests.

```bash
# Recent merged PRs
gh pr list --state merged --limit 10 --json number,title,mergedAt,headRefName

# GitHub issues — look for sprint review notes
gh issue list --limit 30 --json number,title,body,labels,state
```

Pay special attention to issues with "Sprint" in the title — these are likely `sprintkit-review` notes. Read their full body:

```bash
gh issue view <number>
```

The sprintkit-review leaves structured feedback: what passed, what didn't, any deferred work or concerns. Use this as your ground truth for AC status.

**Also extract non-blocking feedback:** When reading the review issue or PR comments, look for items under "Non-blockers" and "Nice-to-haves" in the Summary section, plus any `--comment` reviews (reviews with no blockers). Collect these separately — they feed into Step 3c.

**If no sprint review issue exists for a sprint but a merged PR is found:** automatically invoke the `sprintkit-review` skill (`/sprintkit-review`) to review that PR. Wait for the review to complete, then use its output as ground truth for AC reconciliation. Do not ask the user — just run the review.

**If no sprint review issue exists AND no merged PR is found:** ask the user whether to proceed or wait — there's nothing actionable to review.

---

**Regardless of path:** By the end of this step you should have a clear picture of what was reviewed, what passed, what failed, and why — with enough technical detail to write sprint entries a developer can act on without consulting any external source.

### Step 3: Reconcile ACs against review notes

The review data may come from either an existing GitHub issue (created by a prior `sprintkit-review` run) or a freshly-invoked `sprintkit-review` run from Step 2. Either source is equally valid — use whichever is available.

Cross-reference the sprint's acceptance criteria in the **Sprint file** with the reviewer's findings.

For each AC:
- `[x]` — Reviewer confirmed it met
- `[ ]` — Reviewer flagged it as not met, deferred, or missing
- If partially met, add a short comment: `<!-- Partial: reviewer noted X -->`

You're transcribing the reviewer's verdict, not forming your own. If the review issue is ambiguous about a particular AC, leave it as-is and flag it in your report.

**Preserve the substance, not just the verdict.** When an AC is unmet or partial, capture *what* the reviewer found — the specific behavior, error, or gap they described. This detail carries forward into followup sprints (Step 3b). A developer picking up the followup sprint will only see the sprint file, not the original review notes.

### Step 3b: Create followup sprints for incomplete work

If the reviewer flagged ACs as not met, work as deferred, or scope as incomplete, create a **followup sub-sprint** to carry that work forward. Do not silently drop incomplete items.

**Numbering convention:** Use decimal sub-sprints off the completed sprint number. If Sprint 5 has incomplete work, create Sprint 5.1. If Sprint 5.1 also leaves work, create Sprint 5.2, and so on.

**Self-contained entries — the developer must be able to work from the sprint file alone.**
The developer picking up a followup sprint will typically not have access to the original review notes, GitHub issue, or conversation where the feedback was provided. Every story and AC in a followup sprint must include enough context that someone reading only the sprint file understands: what the problem is, why it matters, and what needs to change. Don't just write "Fix unmet AC from Sprint N" — describe the actual issue.

For each followup story, include a **Context** line that summarizes the reviewer's findings in 1-3 sentences. Pull in specifics: the observed behavior, the expected behavior, affected endpoints/components/files, error messages, edge cases, or any reproduction details the reviewer mentioned. This isn't about being exhaustive — it's about transferring enough signal that the developer doesn't have to guess or go hunting for the original review.

**Format template:**
```markdown
## Sprint N.1 — [Parent Sprint Name] Followup (Days X–Y) [NOT STARTED]

**Goal:** Complete remaining work from Sprint N that was deferred or not fully met.

**Dependencies:** Sprint N (merged)

### Stories

#### S(N.1)-1: [Descriptive title of what needs fixing or completing]
**Context:** [1-3 sentences: what the reviewer found, what's wrong or missing, any specific technical details — error messages, affected components, edge cases, observed vs expected behavior. The developer reading this should understand the problem without consulting any external source.]
- [ ] [Specific, actionable AC with enough detail to act on]
- [ ] [Another AC, if any]
```

**Example of a well-written followup story:**
```markdown
#### S5.1-1: Fix race condition in WebSocket reconnection
**Context:** Reviewer found that when the server restarts, clients occasionally receive duplicate `session_init` events because the reconnection handler in `ws-client.ts` doesn't check whether a session is already active before emitting. This causes the sidebar to render twice. Only happens when reconnection occurs within 2 seconds of initial connection.
- [ ] Add session-active guard in reconnection handler to prevent duplicate `session_init` emissions
- [ ] Add test for rapid reconnection scenario (disconnect + reconnect within 2s)
```

**Example of a poorly-written followup story (avoid this):**
```markdown
#### S5.1-1: Fix WebSocket issue
- [ ] Fix the reconnection bug mentioned in review
- [ ] Add tests
```

**Placement:** Insert the followup sprint immediately after the completed sprint section, before the next planned sprint. Adjust day ranges on subsequent sprints to accommodate.

**When NOT to create a followup sprint:**
- Trivial gaps that don't affect functionality or PRD goals (e.g., a minor comment style issue)
- Items the reviewer explicitly marked as "won't fix" or "out of scope"
- When all ACs were met — no followup needed

### Step 3c: Process non-blocking review comments

Extract non-blocking comments collected in Step 2 — items from "Non-blockers", "Nice-to-haves", and `--comment` reviews.

All non-blocking items go into a single **`## Non-blocking Review Backlog`** section at the very bottom of the **Sprint file** (after all sprints). This section accumulates across sprints — items from Sprint 3's review sit alongside items from Sprint 5's review, all in one place. Each item is labeled with its originating sprint for context.

Classify each new item into one of three categories:

**Plan findings — the plan itself is wrong.** Raised by `sprintkit-review` when a finding is about a *later* sprint rather than the code under review: a `Touches:` line that omits a file the sprint must edit, an acceptance criterion that contradicts another sprint's, a test one sprint ships that a later sprint's required behaviour must break. The fix is an edit to the **Sprint file**, not to code, and it is the reason these are not blockers on the PR that found them.

**Questions — Needs human input.** Ambiguous suggestions, architectural opinions, trade-off decisions, or anything where reasonable engineers could disagree. These are clearly labeled so the human can edit the doc directly to answer them. Examples: "consider switching from REST to GraphQL", "might want to rethink the caching strategy".

**Improvements — Clear implementation direction.** Concrete, unambiguous improvements where the right action is obvious. Examples: "add input validation for X", "handle empty list case in Y", "add test for Z edge case".

**Format for the unified backlog section:**
```markdown
## Non-blocking Review Backlog

This section collects non-blocking feedback from sprint reviews. Questions need human answers (edit inline). Improvements accumulate until triaged into a sprint.

### Plan findings
Defects in the plan, not the code. Each names the sprint it will break and must be resolved **before that sprint starts** — these do not wait for a cleanup sprint.

- [ ] **(raised in Sprint 1 → affects Sprint 46)** `tests/scaffold/tree.test.ts` asserts a tracked file under `src/dev/`, which Sprint 46 deletes. No sprint after 1 declares `tests/scaffold/**`, so Sprint 46 cannot fix it. Either widen its `Touches:` or make the assertion self-retire.

### Questions
Items needing human judgment. Answer inline by replacing the `_awaiting answer_` text, then check the box.

- [ ] **(Sprint 3)** Should we switch session storage from JWT to server-side sessions? Reviewer noted JWT payload is growing large. — _awaiting answer_
- [x] **(Sprint 3)** Is the 5-second timeout on external API calls acceptable for production? — Yes, 5s is fine for now, revisit if latency complaints come in.

### Improvements
Concrete items with clear implementation direction. Will be triaged into a cleanup sprint periodically.

- [ ] **(Sprint 3)** Add input validation for email field on signup endpoint — currently accepts any string, should validate format before hitting the database
- [ ] **(Sprint 5)** Handle empty list edge case in dashboard aggregation — `aggregateMetrics()` throws TypeError when `items` array is empty, should return zeroed summary instead
- [x] **(Sprint 3)** Add error message for invalid date format — _Done in Sprint 5_
```

Each improvement should include enough context (what's wrong, where, why it matters) that a developer can act on it without looking up the original review.

**When adding new items:** Read the existing backlog first. Merge duplicates, append new items under the correct category, and preserve any human answers or status updates already there.

### Step 3d: Triage the non-blocking backlog

After updating the backlog, assess whether it's time to act on accumulated items. This is the step that turns collection into action.

**Plan findings are drained first, and on a different clock.** Before selecting the next sprint to run, resolve every unchecked plan finding whose affected sprint is now reachable — they are edits to the Sprint file and cost minutes, and each one left in place is a red gate landing in a sprint that has no legal way to fix it. Never batch them into a cleanup sprint.

**Trigger a cleanup sprint when any of these are true:**
- 8+ unchecked Improvements have accumulated
- 3+ sprints have passed since the last cleanup sprint (or since the backlog was created)
- The current sprint being marked DONE was the last planned sprint before a natural pause

**When triggered**, create an intermediate sprint:
- Use the next available full sprint number
- Title: `Sprint X — Non-blocking Cleanup`
- Pull all unchecked Improvements into stories, grouped by theme
- Insert it after the completed sprint, marked `[NOT STARTED]`, with a `**Dependencies:**` line naming the sprints whose reviews it is cleaning up
- Mark resolved Improvements as `[x]` with a note pointing to the cleanup sprint

**Also re-surface unanswered Questions:** If any Questions still show `_awaiting answer_` after 2+ sprints, call them out explicitly in the Step 6 report: "These questions have been waiting since Sprint N — please answer them in the backlog section so they can be resolved."

**Format template for cleanup sprint:**
```markdown
## Sprint X — Non-blocking Cleanup (Days X–Y) [NOT STARTED]

**Goal:** Address accumulated non-blocking improvements from sprint reviews.

**Dependencies:** Sprint N, Sprint M
**Touches:** <paths the cleanup will edit — omit if the plan does not use Touches>


### Stories

#### SX-1: [Grouped improvement area]
- [ ] [Specific improvement from reviewer] *(from Sprint N review)*
- [ ] [Another related improvement] *(from Sprint M review)*
```

**When NOT to trigger a cleanup sprint:**
- Fewer than 8 unchecked Improvements AND fewer than 3 sprints since last triage — let them accumulate
- All remaining items are Questions awaiting human input — nothing actionable yet

### Step 4: Update the Sprint file

**Use the Edit tool to write changes directly to the Sprint file.** You may also summarize changes in the console, but you MUST apply them to the file — do not only output proposed changes without writing them. Make targeted edits — do not rewrite the whole file.

**Completed sprint heading:**
```markdown
## Sprint N — [Name] (Days X–Y) [DONE]
```

**Acceptance criteria checkboxes:** Update based on reviewer notes from Step 3.

**Do not advance any other sprint.** Mark the completed sprint `[DONE]` and stop there. Deciding what runs next belongs to `sprintkit-autopilot`, which schedules from the dependency graph and may have several sprints in flight at once. A sprint marked `[IN PROGRESS]` without a runner behind it is read as "already claimed" and will never be dispatched — that is how a run silently deadlocks. Leave every other sprint's status exactly as you found it, including any that are currently `[IN PROGRESS]` in another worktree.

**Followup sprint insertion:** If Step 3b produced a followup sub-sprint, insert it into the file immediately after the completed sprint, marked `[NOT STARTED]`. Adjust day ranges on all subsequent sprints to accommodate the new sprint. It must carry a `**Dependencies:**` line — normally the parent sprint (`**Dependencies:** Sprint N`) — so the scheduler can place it, plus a `**Touches:**` line if the plan uses them. Position in the file does not determine when it runs; dependencies do.

**Non-blocking Review Backlog:** If Step 3c produced new items, append them to the `## Non-blocking Review Backlog` section at the very bottom of the file. If this section doesn't exist yet, create it. Preserve all existing items and human edits — only add new entries and update resolved ones.

**Cleanup sprint insertion:** If Step 3d triggered a cleanup sprint, insert it after the completed sprint as `[NOT STARTED]` with its `**Dependencies:**` line set. Update the backlog to mark triaged Improvements as `[x]` with a note pointing to the cleanup sprint.

**Summary table:** Update the Status column. Use consistent labels: `Done`, `In Progress`, `Not Started`. Add rows for any new followup sub-sprints and cleanup sprints (if created).

**Current State section** (if present): Update any "Sprint progress" line to match.

### Step 5: PRD alignment check

Read the **PRD file** and compare the remaining sprint plan against it. You're not auditing code — you're asking: does the remaining work still deliver on the PRD's goals?

Look for:
- **Scope drift** — did the reviewer's notes reveal that something was implemented differently than the PRD intended?
- **Uncovered requirements** — are there PRD goals that no remaining sprint addresses?
- **Superseded work** — did the completed sprint render a future story unnecessary or redundant?
- **Timeline feasibility** — count sprints done vs. remaining; are you still on track?
- **Carryover impact** — does incomplete work from the just-completed sprint affect stories in future sprints (e.g., dependencies, blocked work)?
- **Missed requirements** — are there items from the PRD not covered by any remaining sprint, including followup sub-sprints?

Present findings as a short structured report:

```
## Alignment Review

### Findings
- [Story/Sprint]: [finding]
- ...

### Timeline
Sprints done: N of M. [On track / behind / ahead].

### Changes applied
- [Change made and why]

### Suggested adjustments (for your approval)
1. [Specific change] — Reason: [why]
```

**Tiered policy for modifying future sprints:**

Apply directly (no confirmation needed):
- Inserting followup sub-sprints (from Step 3b)
- Moving stories that depend on incomplete work to after the followup sprint
- Removing stories made redundant by completed work
- Adding missed PRD requirements as new stories in appropriate sprints
- Appending items to the Non-blocking Review Backlog (from Step 3c)
- Creating a cleanup sprint when triage thresholds are met (from Step 3d)

Ask first (present and wait for confirmation):
- Removing significant scope from a future sprint
- Reordering sprint priorities
- Adding scope not in the PRD

### Step 6: Report

Summarize:
- Which sprint(s) are now marked DONE
- AC changes: how many checked, unchecked, or partial
- Which sprints this merge newly unblocks (their dependencies are now all DONE)
- Followup sprints created, what they carry over, and what they depend on
- Non-blocking backlog status: X new Questions added, Y new Improvements added, Z total pending
- Stale questions: list any Questions awaiting answer for 2+ sprints — nudge the human to answer them
- Cleanup sprint: created (if triggered) or next triage expected after Sprint N
- Changes made to future sprints (stories moved, removed, or added)
- Any PRD alignment flags

---

## Key constraints

- **Trust the sprintkit-review's GitHub issue notes.** Don't re-verify code or re-run tests.
- **Update future sprints when the review warrants it.** Slot in followup sprints, adjust stories affected by incomplete dependencies, remove redundant work. Ask for confirmation only when removing significant scope or reordering priorities.
- **Never update the PRD file.** Scope changes go through `sprintkit-plan`.
- **Mark exactly one sprint DONE and advance nothing.** `sprintkit-autopilot` schedules from the dependency graph; a sprint marked `[IN PROGRESS]` with no runner behind it is read as claimed and never dispatched. Other sprints may legitimately be `[IN PROGRESS]` in parallel worktrees while you run — leave them alone.
- **Every sprint you insert must carry `**Dependencies:**`.** It is what places the sprint in the graph. File position is presentational; dependencies are what the scheduler reads. Add `**Touches:**` too if the plan uses it.
- **Ask before marking sprint boundaries** if it's unclear which sprint just finished — unless the caller passed `sprint:<N>` in args, in which case that is the sprint, no question needed.
- **If no sprint review issue exists but a merged PR is found**, automatically invoke `/sprintkit-review` to review it before proceeding. Only ask the user if there's no merged PR and no review issue — i.e., nothing actionable.

## What this skill does NOT do

- Does not review code or run tests — use `sprintkit-review` for that
- Does not plan new sprints from scratch — use `sprintkit-plan` (but does create followup sub-sprints and restructure existing future sprints when warranted by review outcomes)
- Does not update the **PRD file** — scope changes go through `sprintkit-plan`
- Does not implement any code — use `sprintkit-implement`
