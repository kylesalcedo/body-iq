---
type: concept
status: current
updated: 2026-07-04
links: [validation-lifecycle, decisions/2026-07-04-role-weighting, concepts/api-contract]
---

# Knowledge Graph Model

Defined in `prisma/schema.prisma`. Layers, top to bottom:

## Anatomy layer
- **Region** (10) → **Joint** (24) → **Movement** (66) → **Muscle** (107).
- `Region → Joint → Movement` is a strict tree (each has one parent FK).
- `Movement` carries reference range-of-motion fields (`aromMin/Max`,
  `promMin/Max`, `romUnit`, `romNotes`, `romSource`) — published normal values,
  not per-user measurements. Non-goniometric movements (scapular translations,
  thumb opposition) leave the Int fields null and describe method in `romNotes`.
- **Muscle** carries the O/I/A/N/B fields: `origin`, `insertion`, `action`,
  `innervation`, `bloodSupply`.

## Weighted join tables
- **MovementMuscle** and **ExerciseMuscle** each carry a `MuscleRole` enum
  (primary / secondary / stabilizer / synergist / common_association). This is
  the core modeling decision — see [[decisions/2026-07-04-role-weighting]].
- Both are `@@unique` on their (parent, muscle) pair, so a muscle appears at
  most once per movement/exercise with a single role.

## Programming layer
- **FunctionalTask** (19) — ADL / occupational / sport / mobility tasks, linked
  to movements (`MovementFunctionalTask`, with `relevance`) and to exercises
  (`ExerciseFunctionalTask`).
- **Exercise** (117) — the richest entity: `dosing`, `emgNotes`,
  `evidenceLevel`, structured positioning (`startPosition`, `endPosition`,
  `rom`, `cameraView`, `videoPrompt`), `difficulty`, `equipment[]`,
  `bodyPosition`, plus legacy single-video fields.
- **Cue** (428), **Regression** (181), **Progression** (202) — child rows of
  Exercise, each ordered. Regressions/progressions are **free-text named
  variations**, not FKs to other Exercise rows (see note below).

## Gait layer
- **GaitPhase** — the 8 Rancho Los Amigos phases with kinematics/kinetics/EMG.
  **ExerciseGaitPhase** links exercises to the phase(s) they address.

## Evidence & cross-cutting
- **ResearchSource** (309) — bibliographic record with `doi`/`pmid`/`pmcid`/
  `fulltextUrl`/`pdfUrl`. See [[source-resolution]].
- **SourceOnEntity** — polymorphic link (one nullable FK per entity type +
  `entityType` discriminator) attaching a source to any entity.
- **TagOnEntity** / **Tag** — same polymorphic pattern for tags.

## Known modeling note: progressions are not graph edges

`Regression` / `Progression` are descriptive rows (`name` + `description`)
owned by one Exercise, **not** foreign keys to sibling Exercise records. So the
"progression ladder" is authored prose, and a progression named "Single-Leg
Bridge" is not automatically linked to a standalone Single-Leg Bridge exercise
even if one exists. The discovery view added 2026-07-04
([[decisions/2026-07-04-discovery-views]]) does a **best-effort name match** to
linkify steps, but the underlying relation is not a hard edge. Promoting these
to real FK edges is a candidate future ADR.
