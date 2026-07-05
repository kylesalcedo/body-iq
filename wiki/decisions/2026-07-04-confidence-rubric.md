---
type: decision
status: current
updated: 2026-07-04
links: [../concepts/validation-lifecycle]
---

# ADR: Confidence scoring rubric

**Date:** 2026-07-04 (documenting a pre-existing decision) · **Status:** accepted

## Context
"Validation-first" needs a shared, non-arbitrary meaning for the `confidence`
float. Without a rubric, scores drift per author and become noise.

## Decision
Score confidence per the bands in `CONTRIBUTING.md`:

| Score | Meaning |
|---|---|
| 0.95 | Verified by multiple high-quality sources (systematic / Cochrane reviews) |
| 0.90 | Supported by ≥1 RCT or an established textbook |
| 0.85 | Supported by observational studies or expert consensus |
| 0.80 | Anatomical / biomechanical reasoning, limited direct evidence |
| < 0.80 | Needs review — flag for evidence gathering |

Rule of thumb: **when unsure, score low rather than guessing.** Never fabricate
citations; every reference must be a real, verifiable paper.

## Consequences
- The UI's `ConfidenceBadge` bands (green ≥80 / blue ≥60 / amber ≥40 / red)
  map onto these tiers.
- The Validation Queue treats `confidence < 0.6` as a work bucket.
- Confidence is **safe to recalibrate without an API version bump**
  ([[../concepts/api-contract]]) — it's a value, not a shape.

## Consequence for contributors
Low confidence is a feature, not a failure: it makes gaps visible and drives
the `prompts:gaps` / coverage-heatmap workflow. A confident-but-wrong entry is
worse than an honestly-low one.
