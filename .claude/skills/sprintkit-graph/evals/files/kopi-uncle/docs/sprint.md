# Kopi Uncle — Sprint Plan (condensed eval fixture)

**Total sprints:** 8
**Merge mode:** `sprintkit-autopilot`, direct to `main`

A deliberately fan-shaped plan: Sprint 1 freezes the shared contract, then logic,
presentation and docs branch off it independently and rejoin at integration.

---

## Sprint 1 — Skeleton and frozen contract (Days 1–1) [DONE]

**Goal:** Deploy a live URL and freeze the types both tracks compile against.

**Track:** M0 blocking
**Dependencies:** none
**Touches:** src/types.ts, src/config.ts
**Estimate:** 3h augmented

### S1-1 — Freeze the contract

**Acceptance criteria:**
- [x] `src/types.ts` and `src/config.ts` committed and typechecked

---

## Sprint 2 — Engine core (Days 2–2) [NOT STARTED]

**Goal:** Implement the deterministic rules engine.

**Track:** Track A (logic)
**Dependencies:** Sprint 1
**Touches:** src/engine/**
**Estimate:** 4h augmented

### S2-1 — Reducer

**Acceptance criteria:**
- [ ] Engine folds a fixture timeline deterministically

---

## Sprint 3 — Renderer (Days 2–2) [NOT STARTED]

**Goal:** Render the counter and queue against fixtures.

**Track:** Track B (presentation)
**Dependencies:** Sprint 1
**Touches:** src/render/**
**Estimate:** 4h augmented

### S3-1 — Slot row

**Acceptance criteria:**
- [ ] Six slot controls render from the frozen view barrel

---

## Sprint 4 — Docs pass (Days 2–2) [NOT STARTED]

**Goal:** Write the README and contributor notes.

**Track:** Docs
**Dependencies:** Sprint 1
**Touches:** docs/**
**Estimate:** 2h augmented

### S4-1 — README

**Acceptance criteria:**
- [ ] README documents the build and the gate

---

## Sprint 5 — Engine performance (Days 3–3) [NOT STARTED]

**Goal:** Bring the fold under the frame budget.

**Track:** Track A (logic)
**Dependencies:** Sprint 2
**Touches:** src/engine/**
**Estimate:** 3h augmented

### S5-1 — Budget

**Acceptance criteria:**
- [ ] Fold completes within budget on the benchmark fixture

---

## Sprint 6 — Render polish (Days 3–3) [NOT STARTED]

**Goal:** Mood faces, patience rings and contrast gates.

**Track:** Track B (presentation)
**Dependencies:** Sprint 3
**Touches:** src/render/**
**Estimate:** 3h augmented

### S6-1 — Mood

**Acceptance criteria:**
- [ ] Contrast matrix asserted as a gate failure

---

## Sprint 7 — Integration (Days 4–4) [NOT STARTED]

**Goal:** Wire the engine to the renderer behind the seam.

**Track:** M2
**Dependencies:** Sprint 5, Sprint 6
**Touches:** src/app/**
**Estimate:** 4h augmented

### S7-1 — Swap the stub

**Acceptance criteria:**
- [ ] The scripted stub is replaced by the real engine in one file

---

## Sprint 8 — Ship (Days 5–5) [NOT STARTED]

**Goal:** Release workflow and build stamp.

**Track:** M2
**Dependencies:** Sprint 7, Sprint 4
**Touches:** .github/**
**Estimate:** 2h augmented

### S8-1 — Deploy

**Acceptance criteria:**
- [ ] Pages deploy gated on the full green gate

---

## Summary Table

| Sprint | Depends on | Track | Status |
|---|---|---|---|
| 1 | none | M0 blocking | Done |
| 2 | 1 | Track A | Not Started |
| 3 | 1 | Track B | Not Started |
| 4 | 1 | Docs | Not Started |
| 5 | 2 | Track A | Not Started |
| 6 | 3 | Track B | Not Started |
| 7 | 5, 6 | M2 | Not Started |
| 8 | 7, 4 | M2 | Not Started |
