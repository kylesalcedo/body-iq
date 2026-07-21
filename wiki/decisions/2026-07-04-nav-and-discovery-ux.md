---
type: decision
status: current
updated: 2026-07-04
links: [../concepts/explorer-ui, ../decisions/2026-07-04-discovery-views]
---

# ADR: Navigation grouping + discovery-view UX refinements

**Date:** 2026-07-04 · **Status:** accepted

Refines the discovery views shipped earlier the same day
([[2026-07-04-discovery-views]]) after first-use feedback.

## Context
The flat sidebar was a long undifferentiated list. The body map flickered on
hover and led with a useless placeholder line. The progression view dumped
every exercise's ladder at once. The coverage heatmap is really a
builder/admin tool, not an average-user surface.

## Decisions

1. **Grouped, collapsible sidebar.** Five sections — Explore, Anatomy, Clinical
   Tools, Evidence, Build & Admin. Each is collapsible; the group containing
   the active route always renders expanded. **Build & Admin is collapsed by
   default** (Coverage Heatmap, Validation Queue, API Reference live there),
   keeping the contributor/admin surface out of the average user's way.

2. **Body map: sticky selection, no jitter, click-to-navigate.** Hover/focus
   *previews* a region in the panel and the selection persists (no clear-on-leave)
   — eliminating the empty-panel flicker when moving between markers. Marker
   radius is fixed; only fill/stroke change, so markers don't resize. The empty
   state shows a whole-body summary (region/joint/movement/exercise totals)
   instead of a placeholder instruction. **Clicking a marker navigates to the
   region page** (markers are `role="link"`, Enter/Space activate) — matching the
   region-list links. (This reverses the initial "select-only markers" call after
   the click felt inconsistent with the text links.)

3. **Progressions: one ladder, click-through stepper.** Replaced the full dump
   with a single-ladder stepper: an exercise picker (grouped by region) plus a
   horizontal easiest→hardest track. Prev/next buttons regress/progress one step;
   clicking a dot jumps. The focused step shows its full detail and links out
   when name-matched to a real exercise.

4. **Coverage reframed as a builder tool.** Moved under Build & Admin. Its job
   is driving project work (the UI counterpart to `pnpm prompts:gaps`), not
   average-user discovery.

5. **Branded iconography (no emoji).** The nav's brand mark and five section
   headers now use a cohesive custom icon set (cream silhouette + sage-green
   accents) in `public/icons/` — `brand` (head/brain/spine), `explore`,
   `anatomy` (skeleton), `clinical` (clipboard), `evidence` (doc + magnifier),
   `admin` (gear + sliders). Item-level emoji were dropped for a consistent,
   professional look; nav items are text with a left-border active indicator.

## Consequences
- No schema/API/query changes — all presentational (plus `getBodyMapData` and
  `getProgressionLadders`, which already existed).
- The average-user path is now Explore (body map → progressions → finder →
  planner); contributor tooling is one collapse away.
- `public/icons/*.png` are ~0.8–1 MB source exports; fine for now, a candidate
  for compression/SVG conversion if bundle size matters later.
