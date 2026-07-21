---
type: concept
status: current
updated: 2026-07-04
links: [knowledge-graph-model, decisions/2026-07-04-confidence-rubric]
---

# Validation Lifecycle

Every top-level entity (Region, Joint, Movement, Muscle, FunctionalTask,
Exercise, ResearchSource) carries the same validation block:

```
status: EntityStatus  // draft → needs_review → reviewed → verified  (or disputed)
confidence: Float     // 0.0–1.0, default 0.5
notes: String?        // editorial reasoning
reviewedBy / reviewedAt
```

## Status meaning
- **draft** — freshly authored, not yet checked.
- **needs_review** — flagged for a human pass.
- **reviewed** — a human has read and accepted it.
- **verified** — corroborated against sources to the confidence rubric.
- **disputed** — evidence conflicts; surfaced, not hidden.

Status is a workflow state and is explicitly **safe to change without an API
version bump** ([[api-contract]]).

## Confidence
Scored per the rubric in `CONTRIBUTING.md` (0.95 multiple high-quality sources
→ <0.80 needs review). Full rubric and rationale:
[[decisions/2026-07-04-confidence-rubric]]. The UI renders it via
`ConfidenceBadge` with green/blue/amber/red bands at 80/60/40.

## Where it surfaces
- **Validation Queue** (`/validation`, `getValidationQueue`) aggregates three
  buckets across all entity types: `status = draft`, `confidence < 0.6`, and
  `status = needs_review`.
- **Coverage heatmap** (`/coverage`, added 2026-07-04) is the complementary
  view: not "is this entity trusted" but "where is there *no* content at all."
- Status/confidence badges appear on every list and detail page.

## Tooling
- `pnpm data:quality` — integrity checks over the seed.
- `pnpm cue:audit` — coaching-cue quality (the 2026-07 toolchain).
- `pnpm prompts:gaps` — surfaces coverage gaps to drive authoring prompts;
  the coverage heatmap is its visual counterpart.
