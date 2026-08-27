# Broken plan — eval fixture

A plan that cannot be scheduled: Sprints 2–4 form a dependency cycle, and Sprint 5
depends on a sprint that was renumbered away.

---

## Sprint 1 — Skeleton [DONE]

**Dependencies:** none
**Estimate:** 2h

## Sprint 2 — Alpha [NOT STARTED]

**Dependencies:** Sprint 4
**Estimate:** 3h

## Sprint 3 — Beta [NOT STARTED]

**Dependencies:** Sprint 2
**Estimate:** 3h

## Sprint 4 — Gamma [NOT STARTED]

**Dependencies:** Sprint 3
**Estimate:** 3h

## Sprint 5 — Orphan [NOT STARTED]

**Dependencies:** Sprint 99
**Estimate:** 2h
