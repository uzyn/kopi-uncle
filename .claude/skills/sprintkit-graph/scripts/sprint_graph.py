"""Parse a sprint plan as a dependency graph, simulate the autopilot schedule, and audit it.

Reads the same sprint-file conventions sprintkit-autopilot schedules from, so what you see
here is what the scheduler will do. Pure stdlib — no install step.

Usage:
    python sprint_graph.py docs/sprint.md
    python sprint_graph.py docs/sprint.md --runners 4 --out docs/sprint-graph.md
    python sprint_graph.py docs/sprint.md --json
"""

import argparse
import collections
import json
import re
import sys
from typing import Any

STATUSES = ("NOT STARTED", "IN PROGRESS", "DONE", "BLOCKED")

HEADING = re.compile(r"^##\s+Sprint\s+([0-9]+(?:\.[0-9]+)?[a-z]?)\s*[—–-]\s*(.+?)\s*$")
FIELD = re.compile(r"^\*\*(Dependencies|Touches|Estimate|Track):\*\*\s*(.*)$")
SPRINT_REF = re.compile(r"Sprint\s+([0-9]+(?:\.[0-9]+)?[a-z]?)")
HOURS = re.compile(r"([0-9]+(?:\.[0-9]+)?)\s*h")
DAYS_SUFFIX = re.compile(r"\s*\(Days?[^)]*\)\s*")


def parse(text: str) -> tuple[dict[str, dict[str, Any]], list[str]]:
    """Extract sprints in file order. Returns (sprints_by_id, order)."""
    sprints: dict[str, dict[str, Any]] = {}
    order: list[str] = []
    cur: dict[str, Any] | None = None

    for line in text.split("\n"):
        m = HEADING.match(line)
        if m:
            sid = f"Sprint {m.group(1)}"
            rest = m.group(2)
            status = "NOT STARTED"

            # Canonical form: trailing [STATUS]. Legacy form: trailing — STATUS.
            bracket = re.search(r"\[(" + "|".join(STATUSES) + r")\]\s*$", rest)
            if bracket:
                status = bracket.group(1)
                rest = rest[: bracket.start()]
            else:
                trailing = re.search(r"[—–-]\s*(" + "|".join(STATUSES) + r")\s*$", rest)
                if trailing:
                    status = trailing.group(1)
                    rest = rest[: trailing.start()]

            name = DAYS_SUFFIX.sub(" ", rest).strip(" —–-\t")
            cur = {
                "id": sid,
                "name": name or sid,
                "status": status,
                "deps": None,
                "touches": None,
                "estimate": None,
                "track": None,
            }
            sprints[sid] = cur
            order.append(sid)
            continue

        if cur is None:
            continue

        f = FIELD.match(line)
        if not f:
            continue
        key, raw = f.group(1), f.group(2).strip()

        if key == "Dependencies":
            cur["deps"] = (
                []
                if raw.lower().startswith("none")
                else [f"Sprint {x}" for x in SPRINT_REF.findall(raw)]
            )
        elif key == "Touches":
            if raw and not raw.startswith("<"):
                cur["touches"] = [p.strip() for p in raw.split(",") if p.strip()]
        elif key == "Estimate":
            h = HOURS.search(raw)
            if h:
                cur["estimate"] = float(h.group(1))
        elif key == "Track":
            cur["track"] = raw

    # Fail-safe, mirroring the scheduler: silence means "depends on the previous
    # sprint". Never infer independence from a missing line.
    for i, sid in enumerate(order):
        if sprints[sid]["deps"] is None:
            sprints[sid]["deps"] = [order[i - 1]] if i else []
            sprints[sid]["inferred_deps"] = True

    return sprints, order


def norm_paths(entries: list[str] | None) -> set[str]:
    out = set()
    for e in entries or []:
        p = e.strip().strip("`").rstrip("*").rstrip("/")
        if p:
            out.add(p)
    return out


def paths_clash(a: list[str] | None, b: list[str] | None) -> bool:
    """True if two Touches declarations could hit the same file."""
    pa, pb = norm_paths(a), norm_paths(b)
    if not pa or not pb:
        return True  # undeclared scope means "could touch anything"
    for x in pa:
        for y in pb:
            if x == y or x.startswith(y + "/") or y.startswith(x + "/"):
                return True
    return False


def find_cycle(sprints, order) -> list[str] | None:
    color: dict[str, int] = {}

    def visit(n, path):
        color[n] = 1
        for d in sprints[n]["deps"]:
            if d not in sprints:
                continue
            if color.get(d) == 1:
                return path[path.index(d):] + [d] if d in path else path + [d]
            if color.get(d) is None:
                r = visit(d, path + [d])
                if r:
                    return r
        color[n] = 2
        return None

    for s in order:
        if color.get(s) is None:
            c = visit(s, [s])
            if c:
                return c
    return None


def transitive_closure(sprints, order) -> dict[str, set[str]]:
    """All ancestors of each sprint."""
    anc: dict[str, set[str]] = {}
    visiting: set[str] = set()

    def go(n):
        if n in anc:
            return anc[n]
        if n in visiting:  # cycle guard
            return set()
        visiting.add(n)
        acc: set[str] = set()
        for d in sprints[n]["deps"]:
            if d in sprints:
                acc |= {d} | go(d)
        visiting.discard(n)
        anc[n] = acc
        return acc

    for s in order:
        go(s)
    return anc


def critical_path(sprints, order, default_est: float) -> tuple[list[str], float]:
    """Longest path through the DAG weighted by estimate hours.

    Completed sprints cost zero — the critical path is meant to be the floor on
    *remaining* wall-clock, so counting finished work would put it above the
    simulated makespan and read as a contradiction.
    """
    best: dict[str, tuple[float, list[str]]] = {}
    visiting: set[str] = set()

    def go(n):
        if n in best:
            return best[n]
        if n in visiting:  # cycle guard; render() rejects cyclic plans before this
            return (0.0, [])
        visiting.add(n)
        est = 0.0 if sprints[n]["status"] == "DONE" else (sprints[n]["estimate"] or default_est)
        cands = [go(d) for d in sprints[n]["deps"] if d in sprints]
        visiting.discard(n)
        if cands:
            h, path = max(cands, key=lambda t: t[0])
            best[n] = (h + est, path + [n])
        else:
            best[n] = (est, [n])
        return best[n]

    for s in order:
        go(s)
    if not best:
        return [], 0.0
    hours, path = max(best.values(), key=lambda t: t[0])
    return path, hours


def simulate(sprints, order, runners: int, enforce_touches: bool, default_est: float):
    """List-scheduling simulation matching sprintkit-autopilot's SCHEDULE/DISPATCH.

    Picks the ready sprint with the largest transitive downstream first — the same
    pick_best heuristic the scheduler uses — and never co-schedules sprints whose
    Touches declarations clash.
    """
    rev = collections.defaultdict(list)
    for s in order:
        for d in sprints[s]["deps"]:
            if d in sprints:
                rev[d].append(s)

    downstream_cache: dict[str, int] = {}

    def downstream(n):
        if n in downstream_cache:
            return downstream_cache[n]
        seen, stack = set(), list(rev[n])
        while stack:
            c = stack.pop()
            if c not in seen:
                seen.add(c)
                stack.extend(rev[c])
        downstream_cache[n] = len(seen)
        return downstream_cache[n]

    done = {s for s in order if sprints[s]["status"] == "DONE"}
    pending = [s for s in order if s not in done]
    running: list[dict[str, Any]] = []
    lanes: list[list[dict[str, Any]]] = [[] for _ in range(runners)]
    free = list(range(runners))
    t = 0.0
    queued_peak = 0
    deadlock = None

    while pending or running:
        ready = [
            s
            for s in pending
            if all(d in done for d in sprints[s]["deps"] if d in sprints)
        ]
        if enforce_touches:
            ready = [
                s
                for s in ready
                if not any(paths_clash(sprints[s]["touches"], sprints[r["id"]]["touches"]) for r in running)
            ]
        ready.sort(key=lambda s: (-downstream(s), s))
        queued_peak = max(queued_peak, max(0, len(ready) - len(free)))

        progressed = False
        while free and ready:
            s = ready.pop(0)
            lane = free.pop(0)
            est = sprints[s]["estimate"] or default_est
            item = {"id": s, "lane": lane, "start": t, "end": t + est}
            running.append(item)
            lanes[lane].append(item)
            pending.remove(s)
            progressed = True
            if enforce_touches:
                ready = [
                    r for r in ready if not paths_clash(sprints[r]["touches"], sprints[s]["touches"])
                ]

        if not running:
            if not progressed and pending:
                deadlock = sorted(pending)
            break

        t = min(r["end"] for r in running)
        for r in [r for r in running if r["end"] <= t]:
            done.add(r["id"])
            free.append(r["lane"])
            running.remove(r)
        free.sort()

    busy = sum(i["end"] - i["start"] for lane in lanes for i in lane)
    return {
        "lanes": lanes,
        "makespan": t,
        "busy_hours": busy,
        "queued_peak": queued_peak,
        "deadlock": deadlock,
        "scheduled": sum(len(l) for l in lanes),
    }


def audit(sprints, order, anc, sched, runners, enforce_touches):
    findings = []

    cyc = find_cycle(sprints, order)
    if cyc:
        findings.append(("blocker", "Dependency cycle", " → ".join(cyc)))

    missing = sorted({(s, d) for s in order for d in sprints[s]["deps"] if d not in sprints})
    for s, d in missing:
        findings.append(("blocker", "Dependency target does not exist", f"{s} depends on {d}"))

    if sched["deadlock"]:
        findings.append(
            ("blocker", "Schedule deadlocks", f"never becomes ready: {', '.join(sched['deadlock'][:8])}")
        )

    inferred = [s for s in order if sprints[s].get("inferred_deps")]
    if inferred:
        findings.append(
            (
                "warn",
                "Sprints with no Dependencies line",
                f"{len(inferred)} treated as depending on the previous sprint (fail-safe): "
                + ", ".join(inferred[:6])
                + ("…" if len(inferred) > 6 else ""),
            )
        )

    if not enforce_touches:
        findings.append(
            (
                "warn",
                "No Touches declarations",
                "scheduling on dependencies alone — two concurrent sprints editing the same "
                "file will collide at merge",
            )
        )
    else:
        # Independent sprints that could still hit the same files.
        risky = []
        for i, a in enumerate(order):
            for b in order[i + 1:]:
                if b in anc[a] or a in anc[b]:
                    continue
                if sprints[a]["touches"] and sprints[b]["touches"] and paths_clash(
                    sprints[a]["touches"], sprints[b]["touches"]
                ):
                    risky.append(f"{a} ↔ {b}")
        if risky:
            findings.append(
                (
                    "warn",
                    "Independent sprints with overlapping Touches",
                    f"{len(risky)} pair(s) forced to serialise: " + ", ".join(risky[:6]),
                )
            )

    # False-dependency suspects: only dep is the sprint immediately above, and
    # their declared file scopes are disjoint.
    suspects = []
    for i, s in enumerate(order):
        if i == 0:
            continue
        deps = sprints[s]["deps"]
        prev = order[i - 1]
        if deps == [prev] and not sprints[s].get("inferred_deps"):
            if sprints[s]["touches"] and sprints[prev]["touches"]:
                if not paths_clash(sprints[s]["touches"], sprints[prev]["touches"]):
                    suspects.append(f"{s} → {prev}")
    if suspects:
        findings.append(
            (
                "info",
                "Worth re-checking these dependencies",
                f"{len(suspects)} sprint(s) depend only on the one above them despite declaring "
                "disjoint file scope: "
                + ", ".join(suspects[:6])
                + ". Some will be real — a frozen interface or contract is a dependency that file "
                "scope cannot see. The ones that are just habit are costing you parallelism.",
            )
        )

    chain = sum(
        1
        for i, s in enumerate(order)
        if i and sprints[s]["deps"] == [order[i - 1]]
    )
    if order and chain / len(order) > 0.6:
        findings.append(
            (
                "info",
                "Plan is chain-shaped",
                f"{chain} of {len(order)} sprints depend only on the sprint above them — "
                "if those are habit rather than real constraints, the build is serialising itself",
            )
        )

    if sched["makespan"]:
        util = sched["busy_hours"] / (sched["makespan"] * runners)
        if util < 0.5 and runners > 1:
            findings.append(
                (
                    "info",
                    "Runners mostly idle",
                    f"{util:.0%} utilisation across {runners} runners — the graph is too narrow "
                    "to keep them busy",
                )
            )
    return findings


def mermaid(sprints, order, cp: list[str], direction: str = "TD") -> str:
    def nid(s):
        return "S" + s.split(" ", 1)[1].replace(".", "_")

    def label(s):
        name = sprints[s]["name"].replace('"', "'")
        if len(name) > 34:
            name = name[:31] + "…"
        num = s.split(" ", 1)[1]
        return f'"{num} · {name}"'

    # Top-down by default: a long plan laid out left-to-right becomes a strip too
    # wide to read, whereas vertical scrolls naturally in a document or a PR.
    lines = [f"graph {direction}"]
    tracks = collections.OrderedDict()
    for s in order:
        tracks.setdefault(sprints[s]["track"], []).append(s)

    if len(tracks) > 1 and None not in tracks:
        for i, (track, members) in enumerate(tracks.items()):
            safe = re.sub(r"[^A-Za-z0-9]+", "_", track).strip("_") or f"t{i}"
            lines.append(f'  subgraph {safe}["{track}"]')
            for s in members:
                lines.append(f"    {nid(s)}[{label(s)}]")
            lines.append("  end")
    else:
        for s in order:
            lines.append(f"  {nid(s)}[{label(s)}]")

    for s in order:
        for d in sprints[s]["deps"]:
            if d in sprints:
                lines.append(f"  {nid(d)} --> {nid(s)}")

    by_status = collections.defaultdict(list)
    for s in order:
        by_status[sprints[s]["status"]].append(nid(s))

    lines += [
        "  classDef done fill:#d4f4d4,stroke:#4a9,color:#123",
        "  classDef wip fill:#fff2c4,stroke:#c93,color:#321",
        "  classDef todo fill:#eef2f7,stroke:#8aa,color:#223",
        "  classDef blocked fill:#f8d7da,stroke:#c66,color:#311",
        "  classDef crit stroke:#e2571e,stroke-width:3px",
    ]
    for status, cls in (
        ("DONE", "done"),
        ("IN PROGRESS", "wip"),
        ("NOT STARTED", "todo"),
        ("BLOCKED", "blocked"),
    ):
        if by_status[status]:
            lines.append(f"  class {','.join(by_status[status])} {cls}")
    if cp:
        lines.append(f"  class {','.join(nid(s) for s in cp)} crit")
    return "\n".join(lines)


def render(sprints, order, args) -> tuple[str, dict]:
    enforce = any(sprints[s]["touches"] for s in order)

    # A cycle makes every downstream number meaningless — no sprint in it can ever
    # become ready, so there is no schedule to simulate. Report the cycle and stop
    # rather than printing a confident-looking makespan for a plan that cannot run.
    cyc = find_cycle(sprints, order)
    missing = sorted({(s, d) for s in order for d in sprints[s]["deps"] if d not in sprints})
    if cyc:
        findings = [("blocker", "Dependency cycle", " → ".join(cyc))]
        findings += [
            ("blocker", "Dependency target does not exist", f"{s} depends on {d}") for s, d in missing
        ]
        out = [
            "# Sprint graph\n",
            f"**Source:** `{args.sprint_file}`  ",
            f"**Sprints:** {len(order)}\n",
            "## Audit\n",
            "This plan cannot be scheduled — the dependency graph contains a cycle, so the "
            "sprints in it never become ready and no schedule exists to simulate. Fix the cycle "
            "and run this again.\n",
            "| | Finding | Detail |",
            "|---|---|---|",
        ]
        out += [f"| 🔴 | **{t}** | {d} |" for _, t, d in findings]
        out.append("")
        data = {
            "sprints": len(order),
            "schedulable": False,
            "cycle": cyc,
            "findings": [{"level": l, "title": t, "detail": d} for l, t, d in findings],
        }
        return "\n".join(out), data

    anc = transitive_closure(sprints, order)
    direction = getattr(args, "direction", "TD")
    cp, cp_hours = critical_path(sprints, order, args.default_estimate)
    sched = simulate(sprints, order, args.runners, enforce, args.default_estimate)
    findings = audit(sprints, order, anc, sched, args.runners, enforce)

    remaining = [s for s in order if sprints[s]["status"] != "DONE"]
    serial = sum(sprints[s]["estimate"] or args.default_estimate for s in remaining)
    done_n = len(order) - len(remaining)
    ready_now = [
        s
        for s in remaining
        if all(sprints[d]["status"] == "DONE" for d in sprints[s]["deps"] if d in sprints)
    ]

    out = []
    out.append("# Sprint graph\n")
    out.append(f"**Source:** `{args.sprint_file}`  ")
    out.append(f"**Sprints:** {len(order)} total · {done_n} done · {len(remaining)} remaining  ")
    out.append(f"**Runners simulated:** {args.runners}  ")
    out.append(
        f"**File-scope rule:** {'enforced (Touches declared)' if enforce else 'not in use — dependencies only'}\n"
    )

    out.append("## Dependency graph\n")
    out.append("Orange outline is the critical path — the longest chain, which sets the floor on wall-clock no matter how many runners you add.\n")
    out.append("```mermaid")
    out.append(mermaid(sprints, order, cp, direction))
    out.append("```\n")

    out.append("## Predicted schedule\n")
    speedup = (serial / sched["makespan"]) if sched["makespan"] else 1.0
    out.append(f"- **Serial total:** {serial:.1f}h")
    out.append(f"- **With {args.runners} runners:** {sched['makespan']:.1f}h  (**{speedup:.2f}× speedup**)")
    out.append(f"- **Critical path:** {cp_hours:.1f}h over {len(cp)} sprints — {' → '.join(cp[:8])}{'…' if len(cp) > 8 else ''}")
    if sched["makespan"]:
        util = sched["busy_hours"] / (sched["makespan"] * args.runners)
        out.append(f"- **Runner utilisation:** {util:.0%}")
    out.append(f"- **Peak sprints queued behind the cap:** {sched['queued_peak']}\n")

    out.append("### Runner lanes\n")
    out.append("| Runner | Sprints in order | Busy |")
    out.append("|---|---|---|")
    for i, lane in enumerate(sched["lanes"], start=1):
        if not lane:
            out.append(f"| {i} | *idle* | 0h |")
            continue
        seq = " → ".join(f"{it['id'].split(' ')[1]}" for it in lane)
        busy = sum(it["end"] - it["start"] for it in lane)
        out.append(f"| {i} | {seq} | {busy:.1f}h |")
    out.append("")

    out.append("### Ready to start now\n")
    if ready_now:
        for s in ready_now:
            est = sprints[s]["estimate"] or args.default_estimate
            out.append(f"- **{s}** — {sprints[s]['name']} ({est:.1f}h)")
    else:
        out.append("- *nothing — every remaining sprint is blocked, or the plan is complete*")
    out.append("")

    out.append("## Audit\n")
    if not findings:
        out.append("No issues found.\n")
    else:
        icons = {"blocker": "🔴", "warn": "🟡", "info": "🔵"}
        out.append("| | Finding | Detail |")
        out.append("|---|---|---|")
        for level, title, detail in findings:
            out.append(f"| {icons[level]} | **{title}** | {detail} |")
        out.append("")

    data = {
        "sprints": len(order),
        "done": done_n,
        "remaining": len(remaining),
        "runners": args.runners,
        "touches_enforced": enforce,
        "serial_hours": round(serial, 2),
        "makespan_hours": round(sched["makespan"], 2),
        "speedup": round(speedup, 3),
        "critical_path": cp,
        "critical_path_hours": round(cp_hours, 2),
        "ready_now": ready_now,
        "queued_peak": sched["queued_peak"],
        "lanes": [[it["id"] for it in lane] for lane in sched["lanes"]],
        "findings": [{"level": l, "title": t, "detail": d} for l, t, d in findings],
    }
    return "\n".join(out), data


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("sprint_file")
    ap.add_argument("--runners", type=int, default=4)
    ap.add_argument("--out", default=None, help="write markdown here (default: stdout)")
    ap.add_argument("--json", action="store_true", help="emit machine-readable summary instead")
    ap.add_argument("--default-estimate", type=float, default=4.0)
    ap.add_argument(
        "--direction",
        default="TD",
        choices=["TD", "LR"],
        help="mermaid layout: TD (vertical, default — stays legible as the plan grows) or LR",
    )
    args = ap.parse_args()

    args.runners = max(1, min(args.runners, 8))
    try:
        text = open(args.sprint_file, encoding="utf-8").read()
    except OSError as e:
        print(f"cannot read {args.sprint_file}: {e}", file=sys.stderr)
        return 2

    sprints, order = parse(text)
    if not order:
        print(
            f"no sprint headings found in {args.sprint_file} — expected '## Sprint N — Name'",
            file=sys.stderr,
        )
        return 2

    md, data = render(sprints, order, args)
    if args.json:
        print(json.dumps(data, indent=2))
        return 0
    if args.out:
        with open(args.out, "w", encoding="utf-8") as f:
            f.write(md + "\n")
        print(f"wrote {args.out}")
        print(json.dumps({k: data[k] for k in ("sprints", "remaining", "serial_hours", "makespan_hours", "speedup", "ready_now")}, indent=2))
    else:
        print(md)
    return 0


if __name__ == "__main__":
    sys.exit(main())
