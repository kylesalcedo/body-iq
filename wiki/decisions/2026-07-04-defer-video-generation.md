---
type: decision
status: current
updated: 2026-07-04
links: [../concepts/knowledge-graph-model]
---

# ADR: Defer AI video generation; ship YouTube links + structured position data

**Date:** 2026-04-10 (documented in wiki 2026-07-04) · **Status:** accepted

Source of record: `docs/video-generation-roadmap.md`.

## Context
The end goal is a clinician-verified visual demonstration for every exercise.
As of Q1 2026, generative video models (Seedance / Veo / Sora / Runway-class)
are not reliable for clinical-grade demonstration.

## Decision
Phase the rollout instead of generating now:

- **Phase 0 (shipped):** every exercise detail page has a "Watch on YouTube"
  search button. Zero storage, always works.
- **Phase 1 (scaffolded):** structured position fields on `Exercise`
  (`startPosition`, `endPosition`, `rom`, `cameraView`, `videoPrompt`) — nullable
  so they don't block records. They improve the detail page today and feed
  future generation.
- **Phase 2 (scaffolded):** `ExerciseVideo` multi-video schema with a clinician
  **verification gate** (`verified`/`verifiedBy`), quality rating, and priority
  ordering. AI-generated videos cannot be promoted until a licensed clinician
  approves them.

## Why not generate now (observed failure modes)
Anatomical precision (can't hit specific joint angles / cues), identity &
proportion drift across a clip, unrealistic resistance/bar paths, blended
multi-phase instructions, rep-to-rep inconsistency, and unreliable hand/finger
detail (skip AI video for the Hand region entirely for now).

## Consequences
- The schema is video-ready without committing to any generation vendor.
- The verification gate keeps unverified AI content out of the trusted surface,
  consistent with the validation-first stance ([[../concepts/validation-lifecycle]]).
- Revisit when models can hold joint angles and identity across a clip.
