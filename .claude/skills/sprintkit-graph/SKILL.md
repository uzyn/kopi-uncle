---
name: sprintkit-graph
description: Draws a sprint plan as a dependency graph and predicts how sprintkit-autopilot will actually schedule it — which sprints fan out in parallel, which runner picks up what, the critical path, wall-clock versus serial, and an audit of cycles, phantom dependencies, file-scope collisions and accidental serialisation. Writes a mermaid diagram to docs/sprint-graph.md. Use this whenever someone asks to see, draw, chart, diagram or map a sprint plan, asks what can run in parallel, which sprints are independent, what the tracks or branches look like, what's ready to start, what's blocking what, how long autopilot will take, why only one runner is busy, whether the plan is too serial, or what the critical path is. Reach for it before launching a long autopilot run so the fan-out is visible up front, and after editing dependencies to confirm the shape changed the way you intended. It reads the plan and never modifies it.
---

# Scrum Visualize

A sprint plan is a dependency graph, but it is written as a numbered list — so the parallelism in it is invisible until something executes it. This skill makes the graph visible before you commit hours to running it, and predicts the schedule `sprintkit-autopilot` will actually produce.

It reads the plan and writes a diagram. It never edits the sprint file — if the audit finds something worth changing, report it and let the human decide.

## Track Resolution

Same convention as the rest of the pipeline:

1. **With a track argument** (`args: "track:foo"`): `default` → `docs/sprint.md`, `<name>` → `docs/<name>-sprint.md`.
2. **Otherwise** scan `docs/` for `sprint.md` and `*-sprint.md`.
3. One match: use it. Several: list them and ask which. None: say so and suggest `/sprintkit-plan`.

`args` may also carry `runners:N` (default 4, matching autopilot's `MAX_RUNNERS`) and `out:<path>` (default `docs/sprint-graph.md`).

## Process

Run the bundled script. It does the parsing, the scheduling simulation and the audit — the graph maths is deterministic, so there is nothing to be gained by re-deriving it in prose each time, and a script gives the same answer twice.

```bash
python3 .claude/skills/sprintkit-graph/scripts/sprint_graph.py <sprint_file> \
  --runners <N> --out <out_path>
```

Add `--json` instead of `--out` when you want the numbers to reason about rather than a document to publish.

The diagram is laid out **top-down** by default. A long plan drawn left-to-right becomes a strip too wide to read, while vertical scrolls naturally in a document or a PR. Pass `--direction LR` if a particular plan genuinely reads better sideways — a short, very wide graph sometimes does.

Then read what it wrote and summarise the interesting parts in conversation. The file is the artifact; your message is the reading of it. Lead with what the person actually asked — if they asked "what runs in parallel", open with the fan-out, not with the header stats.

## What the script produces

- **A mermaid dependency graph**, grouped into subgraphs by each sprint's `**Track:**` field when the plan declares one, so tracks show up as visual lanes. Nodes are shaded by status and the critical path is outlined.
- **The predicted schedule** — serial total, wall-clock with N runners, the resulting speedup, runner utilisation, and how many sprints ever queued behind the runner cap.
- **Runner lanes** — which sprints land on which runner, in order. This is the "probable tracks" view: not what *could* run together, but what *will*, given the cap and the estimates.
- **Ready to start now** — every sprint whose dependencies are all `[DONE]`.
- **An audit table** — see below.

It mirrors `sprintkit-autopilot`'s own rules so the prediction matches reality: the same `pick_best` heuristic (largest transitive downstream first), the same `Touches:` co-scheduling rule, and the same fail-safe that a missing `**Dependencies:**` line means "depends on the previous sprint".

## Reading the audit

| Finding | What it means |
|---|---|
| 🔴 **Dependency cycle** | The plan cannot run at all — sprints in a cycle never become ready. The script stops here rather than printing a confident makespan for an unschedulable plan. |
| 🔴 **Dependency target does not exist** | A `**Dependencies:**` line names a sprint that isn't in the file. Usually a renumbering left behind. |
| 🔴 **Schedule deadlocks** | Some sprints never become ready even without a cycle — normally a dependency on a sprint that was deleted or marked wrongly. |
| 🟡 **No Touches declarations** | Scheduling falls back to dependencies alone. Two independent sprints editing the same file will collide at merge time. |
| 🟡 **Independent sprints with overlapping Touches** | They have no dependency between them but claim the same paths, so the scheduler will refuse to run them together. Free parallelism is being lost to file layout. |
| 🟡 **Sprints with no Dependencies line** | Being treated as depending on the sprint above, per the fail-safe. Often unintentional. |
| 🔵 **Worth re-checking these dependencies** | A sprint depends only on the one above it despite disjoint file scope. A heuristic, not a verdict — a frozen interface is a real dependency that file scope cannot see. Read them and decide. |
| 🔵 **Plan is chain-shaped** | Most sprints depend only on their predecessor. If those are habit rather than real constraints, the plan is serialising itself and more runners will not help. |
| 🔵 **Runners mostly idle** | The graph is too narrow to keep the runners busy. Either accept fewer runners or revisit the dependencies. |

The 🔵 findings are prompts to think, not defects. Present them that way — say what the heuristic noticed and what would make it a false alarm, rather than asserting the plan is wrong.

## Reporting back

Keep it short and lead with the shape. Something like:

```
docs/sprint-graph.md — 46 sprints, 6 done.

Fan-out: 2 ready now (Sprint 7, Sprint 15), peak width 4.
Wall-clock: 192h serial → 143h on 4 runners (1.34×).
Critical path: 143h across 34 sprints — the plan is entirely critical-path bound.

Worth a look: 39 of 46 sprints depend only on the sprint above them, and runner
utilisation is 34%. If some of those dependencies are habit rather than real,
the speedup is much larger than 1.34×.
```

When the numbers are unflattering, say so plainly — a diagram that hides a 34% utilisation figure is worse than no diagram. The point of drawing the plan is to find out whether the parallelism you assumed is actually there.

Mention `docs/sprint-graph.md` by path so the user can open it, and note that GitHub renders the mermaid inline if they'd rather look at it in a PR.

## Follow-ups worth offering

- If the audit flags heavy serialisation, offer to walk the suspect dependencies with the user and propose edits — but make the edits only if they ask. Rewriting a sprint plan is a much bigger action than drawing one.
- If they are about to start a run, mention what `/sprintkit-autopilot` will pick first: the ready sprint with the largest downstream, which the script already ranks.
- Re-run after any dependency edit. Comparing before and after is the fastest way to see whether a change actually bought parallelism.

## What this skill does NOT do

- Does not modify the sprint file, the PRD, or any code
- Does not run sprints — that's `/sprintkit-autopilot`
- Does not create or replan sprints — that's `/sprintkit-plan`
- Does not mark sprints done — that's `/sprintkit-sync`
- Does not estimate effort itself; it uses each sprint's `**Estimate:**` line and falls back to 4h where one is missing, so the wall-clock figures are only as good as the plan's own numbers
