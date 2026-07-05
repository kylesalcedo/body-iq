---
type: decision
status: current
updated: 2026-07-04
links: [../concepts/knowledge-graph-model]
---

# ADR: Five-tier muscle role weighting

**Date:** 2026-07-04 (documenting a pre-existing decision) · **Status:** accepted

## Context
A muscle's involvement in a movement or exercise is not boolean — the rectus
femoris drives knee extension but merely stabilizes in a bridge. A flat
many-to-many link would flatten clinically important distinctions and make
queries like "primary movers only" impossible.

## Decision
Both `MovementMuscle` and `ExerciseMuscle` carry a required `MuscleRole` enum:

- **primary** — main mover for the action
- **secondary** — significant contributor
- **stabilizer** — stabilizes the joint during the action
- **synergist** — assists the primary mover
- **common_association** — frequently associated but not a direct mover

Each is `@@unique` on (parent, muscle): one role per muscle per parent.

## Consequences
- The API can filter by `role` (part of the frozen v1 surface).
- The explorer renders roles via `RoleBadge` with a fixed color per tier.
- The coverage heatmap ([[2026-07-04-discovery-views]]) can distinguish
  "muscle trained as primary" from "merely stabilizes somewhere."
- Authors must assign a role for every link, backed by EMG where available
  (`CONTRIBUTING.md`). This is friction by design.

## Note
Role is a categorical weight, not a numeric one. A numeric activation
percentage would be finer but demands EMG data the corpus doesn't uniformly
have; `emgNotes` on Exercise captures quantitative detail as prose instead.
