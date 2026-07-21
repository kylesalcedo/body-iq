---
type: concept
status: current
updated: 2026-07-04
links: [source-resolution, validation-lifecycle, knowledge-graph-model]
---

# Data Pipeline

How movement knowledge gets from research into the graph. The database is never
edited by hand — everything flows through versioned seed code.

## The extension pattern

`prisma/seed/` has base modules (`regions.ts`, `joints.ts`, `movements.ts`,
`muscles.ts`, `functional-tasks.ts`, `exercises.ts`, `sources.ts`) plus an
`extensions/` directory. Each extension is a self-contained content drop wired
into `seed.ts`. Current extensions:

- `cervical-evidence.ts`
- `gait-scapular.ts`
- `hand-intrinsics.ts`
- `low-evidence-upgrades.ts`
- `occupation-essentials.ts`
- `primitives-and-pfm.ts` (movement primitives + pelvic floor)
- `thin-modalities.ts` (oculomotor / vestibular / breathing / somatic / mindfulness)
- `use-case-essentials.ts`

New content = a new extension module (or additions to an existing one) + a
`seed.ts` wire-up, then `pnpm db:seed`. This keeps the graph reproducible from
source and reviewable as a diff. Adding/removing/renaming seed *data* is
explicitly allowed without an API version bump ([[api-contract]]) — the data is
not the contract, the shape is.

## Authoring → validation flow

1. **Author** an entity/exercise with description, cues, dosing, EMG notes,
   regressions/progressions, and role-weighted muscle links.
2. **Source** it — attach `ResearchSource` records and resolve their
   identifiers ([[source-resolution]]).
3. **Cue-quality pass** — `pnpm cue:audit` (`scripts/cue-quality.ts`) checks
   coaching cues against the quality standard; `scripts/cue-rewrite-prompts.ts`
   emits rewrite prompts for weak ones. Added in the 2026-07 toolchain commit.
4. **Data-quality pass** — `pnpm data:quality` checks integrity.
5. **Gap-finding** — `pnpm prompts:gaps` (`scripts/prompt-gaps.ts`) surfaces
   thin coverage to drive the next authoring round. The `/coverage` heatmap is
   its UI counterpart.
6. **Validate** — set `status`/`confidence` per the rubric
   ([[validation-lifecycle]]). `pnpm validate:agent` (report-only, human-in-the-
   loop) triages the queue with the Claude API and suggests confidence/status
   without touching the DB — see [[decisions/2026-07-04-validator-agent]].

## Export

- `scripts/export-all-exercises.ts` and `scripts/export-region.ts` emit
  content for review or external use. A **versioned public dataset release** is
  a planned extension of these — see [[backlog]].
