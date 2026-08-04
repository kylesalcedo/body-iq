# Changelog

## 0.3.0 — Engine for other apps (2026-08)

Body IQ becomes consumable three ways, no consumer database required.

### Added
- **Versioned dataset export** (`pnpm export:dataset`) — the whole graph as a
  normalized JSON bundle + SQLite-loadable dump + JSON-Schema contract + manifest;
  auto-published to every version-tag GitHub Release.
- **MCP server** (`pnpm mcp`) — dataset-backed, 7 tools returning validation
  metadata; usable in any MCP client with no API-client code.
- **API detail routes** for muscles / regions / joints; the /api-docs explorer now
  lists the full (additive) surface.

### Fixed
- Data-integrity pass: prime movers for the 5 orphan movements, ROM for 9 more
  (56 → 65 of 74), and the dip exercise↔joint slug collision (now parallel-bar-dip).

### Notes
- No breaking changes to the frozen v1 API contract. Follows the Next 16 / React 19
  upgrade and the app-wide UI consistency work since 0.2.1.

## 0.2.1 — Framework upgrade & security (2026-07)

- Upgraded Next.js 14.2.35 → 16, React 18 → 19, ESLint 8 → 9.
- **0 dependency vulnerabilities** (production + dev; was 17 prod / 12 dev).
- Async request APIs (params/searchParams awaited), Turbopack-compatible config,
  ESLint flat config. No functional or data changes.

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
