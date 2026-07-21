# Changelog

## 0.2.0 — Knowledge-graph expansion (2026-07)

A large additive release. No breaking changes to the v1 API contract.

### Added
- **Exercises:** 213 → 305, all researched against the real slug roster and panel-verified
  (40 common lifts, 35 home/bodyweight with rationale, thin-region + muscle-coverage fills).
  Every muscle and every movement now has ≥1 exercise.
- **Quality scoring:** deterministic multi-validator score (evidence / coherence / completeness /
  review rigor) with auto-promotion. `pnpm score`.
- **Goals layer:** rehab / performance / prevention / mobility goals (37) with 605 exercise
  links (essential/supportive + safety cautions). "Improve my squat", "fix knee pain".
- **Functional-task links:** 287/305 exercises linked to everyday activities, weighted.
- **Movement ROM:** published AAOS/Norkin normal ranges on 53/71 movements.
- **Categories** + **structured positions** (start/end/ROM) on all exercises.
- **SNOMED CT codes:** 128 verified muscle+joint codes (via live terminology server), in FHIR.
- **Clinical audit:** lengthening (stretch) links, difficulty-graph edges, evidence flags.
- **API completed:** `/api/goals`, `/api/movements` (ROM), `/api/joints`, `/api/regions`,
  `/api/tasks`, and a live `/api/exercises/[slug]/fhir` endpoint.
- **Tooling:** `export:fhir`, `ingest:citations` / `citations:sync`, `fetch-snomed-codes`.
- **UI:** `/schema` data-model page, `/goals` browser, quality scorecards, positions/ROM,
  goal + task sections, category badges, score-ranked validation queue.

### Fixed
- Reverted a bad description-trim commit that had corrupted 9 seed files.
- Nested-anchor hydration errors on list pages; made the clinical audit reproducible.

### Notes
- Citations are 100% covered; researched exercises deepen toward primary literature via
  `citations:sync`. SNOMED codes are `needs_review` (IDs authoritative; clinician confirms match).
  SNOMED requires an affiliate license for commercial use.
