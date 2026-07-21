---
type: decision
status: current
updated: 2026-07-04
links: [../concepts/explorer-ui, ../concepts/knowledge-graph-model, ../backlog]
---

# ADR: Add discovery views — progression ladders, body map, coverage heatmap

**Date:** 2026-07-04 · **Status:** accepted

## Context
The explorer was strong at *looking up* a known entity (list → detail) but weak
at *discovery* — helping a learner explore the body or a contributor see gaps.
Three views were prioritized as high value-per-effort because the data already
exists; they only needed presentation. (Four larger features — dataset export,
MCP server, stack builder, explainability view — were deferred to [[../backlog]].)

## Decision
Ship three server-rendered views, all reading through `src/lib/queries.ts`:

1. **Progression ladders** (`/progressions`) — renders each exercise as
   regression ← exercise → progression, using the existing `Regression` /
   `Progression` rows (181 / 202). Step names are **best-effort linkified** to
   real exercises by slugified name match. Filterable by region/difficulty.
   Caveat: progressions are prose rows, not FK edges
   ([[../concepts/knowledge-graph-model]]); the match is heuristic.

2. **Interactive body map** (`/body-map`) — a clickable SVG human silhouette
   with the 10 regions as hotspots; each links to its region page and shows
   joint/movement/exercise counts. The natural front door for the "learn about
   your body" audience.

3. **Coverage heatmap** (`/coverage`) — muscles × role and movements, colored
   by how many exercises cover each, with zero-coverage cells called out. The
   visual counterpart to `pnpm prompts:gaps`; dual-use for learners (what's
   covered) and contributors (what's missing). Palette follows the `dataviz`
   skill (sequential ramp + explicit zero state).

## Consequences
- Three new nav entries; no schema change; no API change.
- Domain facts stay in the DB — these are pure views over existing queries.
- If the heuristic progression match proves too noisy, promoting
  regressions/progressions to real FK edges becomes a follow-up ADR.
