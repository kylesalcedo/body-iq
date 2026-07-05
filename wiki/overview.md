---
type: overview
status: current
updated: 2026-07-04
links: [stack, concepts/knowledge-graph-model, concepts/validation-lifecycle, backlog]
---

# Overview

## What Body IQ is

A **validation-first** biomechanics and physical-therapy knowledge engine. It
structures movement knowledge into a queryable, reviewable knowledge graph and
exposes it through a web explorer and a stable JSON API. The differentiator is
not volume but **provenance**: every fact carries a validation status, a
confidence score, and links to peer-reviewed sources.

## The chain it models

```
Region → Joint → Movement → Muscle (Origin/Insertion/Action/Nerve/Blood)
       → Functional Task → Exercise (cues, regressions, progressions) → Evidence
```

Two relationships are **role-weighted** rather than boolean:
movement↔muscle and exercise↔muscle each carry a `MuscleRole`
(primary / secondary / stabilizer / synergist / common_association). This is
what lets a query answer "which exercises train glute medius *as a primary
mover* with *high confidence*" — see [[decisions/2026-07-04-role-weighting]].

## Current state (2026-07-04)

Approximate seed counts (see `README.md` for the authoritative table):

| Layer | Entities |
|---|---|
| Regions | 10 |
| Joints | 24 |
| Movements | 66 |
| Muscles | 107 |
| Functional Tasks | 19 |
| Exercises | 117 |
| Research Sources | 309 (274 DOIs, 192 PMIDs, 111 free fulltext) |

Relationship edges: 301 movement–muscle, 466 exercise–muscle, 287
exercise–movement, plus 428 cues, 181 regressions, 202 progressions, 765
source→entity links.

The explorer ships list/detail pages for every entity type, an Exercise Finder,
a Workout Planner grid, a Gait Cycle view, a Hand Assessment view, global
search, an API reference, and a Validation Queue. Discovery views added
2026-07-04: progression ladders, an interactive body map, and a coverage
heatmap — see [[concepts/explorer-ui]] and
[[decisions/2026-07-04-discovery-views]].

## Key concepts a new contributor needs

1. **The database is the source of truth for domain facts.** The wiki is the
   source of truth for *why the model is shaped this way* and *how content is
   produced*. Don't duplicate domain data into the wiki. ([[../WIKI]])
2. **Validation metadata is first-class.** `status` (draft → needs_review →
   reviewed → verified / disputed) and `confidence` (0–1) gate what the UI
   trusts. ([[concepts/validation-lifecycle]])
3. **Content flows through seed extensions, never ad-hoc DB edits.**
   ([[concepts/data-pipeline]])
4. **The v1 API shape is frozen.** Data can change; documented field shapes
   can't, on v1. ([[concepts/api-contract]])
5. **Evidence framing, not medical advice.** The audience is people learning
   about their body and builders reusing the data — not patients seeking
   diagnosis.

## Audiences

- **Learners** — explore anatomy, movement, and evidence; discover exercises
  and how they progress.
- **Clinicians / contributors** — extend and validate the graph.
- **Builders** — consume the JSON API (and, planned, a dataset export and MCP
  server) to power their own apps. See [[backlog]].
