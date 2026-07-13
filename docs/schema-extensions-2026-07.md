# Schema Extensions — July 2026

Three additive capabilities, all nullable/optional so no existing record or query is affected.

## 1. Difficulty graph (progression/regression edges)

`Regression` and `Progression` gained `targetExerciseId` (self-referential FK to `Exercise`) and `criterion`.

Previously a progression was free text ("progress to single-leg"). When that progression **is itself another exercise in the library**, `targetExerciseId` now links the two nodes, turning the loose text into a traversable difficulty graph. `criterion` records the clinical gate for moving along the edge ("3×10 pain-free with 2s holds"). Back-edges are exposed on `Exercise` as `regressionTargets` / `progressionTargets`.

Text-only progressions still work — the FK is null when the progression isn't a catalog exercise. Populated in bulk by the clinical-audit fan-out (`scripts/export-audit-shards.ts` → verify → seed extension).

## 2. Lengthening muscle role

`MuscleRole` enum gained `lengthening`: a muscle placed on stretch (antagonist side) by a movement/exercise, as opposed to one contracting.

This answers "what does this position stretch?" — e.g. cervical sidebend links the contralateral upper trapezius and levator scapulae as `lengthening` on the `ExerciseMuscle`/`MovementMuscle` join. Uses the existing weighted-join tables, so no new relations and every existing muscle query keeps working; consumers that care about stretch filter `role = lengthening`.

## 3. Interop coding layer (`EntityCode`)

A polymorphic `EntityCode` (mirrors `TagOnEntity`'s exactly-one-FK pattern) attaches standard terminology codes — SNOMED CT, UCUM, ICF — to any entity, kept separate from internal slugs so the graph stays terminology-agnostic.

Codes carry their own `EntityStatus` (default `needs_review`) because a code is a claim that must be verified against a terminology server before it's authoritative. The FHIR export reads these when present and falls back to an internal placeholder code system when absent.

### FHIR export

`pnpm export:fhir` (`scripts/export-fhir.ts`) emits each exercise as a FHIR R4 `ActivityDefinition` into `exports/fhir/`, plus a `_bundle.json` transaction Bundle ready to POST to a FHIR server. Mapping: `EntityStatus`→publication status, regions→`bodySite`, `dosing`→`dosage.text`, sources + difficulty edges→`relatedArtifact` (citation / successor / predecessor), codes→`topic`, muscle involvement→a namespaced extension. This makes the library portable into any FHIR-capable EHR or care-plan engine.

UCUM-structured dosing (parsing "3×10-15 reps" into coded quantities) is future work; dosing currently rides as text.
