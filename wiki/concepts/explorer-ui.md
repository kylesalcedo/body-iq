---
type: concept
status: current
updated: 2026-07-04
links: [api-contract, knowledge-graph-model, decisions/2026-07-04-discovery-views]
---

# Explorer UI

Next.js 14 App Router. Entity pages are **async server components** that call
`src/lib/queries.ts` (→ Prisma) and render directly; no client data layer.
Client components are used only where interaction demands it (search box,
finder filters, planner grid, body map).

## Shared building blocks
- `src/components/ui-helpers.tsx` — `PageHeader`, `Card`, `SectionTitle`,
  `EmptyState`, `EntityLink`.
- `src/components/badges.tsx` — `StatusBadge`, `ConfidenceBadge`, `RoleBadge`
  (fixed color per status/role; see [[decisions/2026-07-04-role-weighting]],
  [[decisions/2026-07-04-confidence-rubric]]).
- `src/components/sidebar.tsx` — the nav, grouped into collapsible sections
  (`navGroups`): Explore / Anatomy / Clinical Tools / Evidence / Build & Admin.
  The active route's group is always expanded; Build & Admin (Coverage,
  Validation Queue, API Reference) is collapsed by default. See
  [[decisions/2026-07-04-nav-and-discovery-ux]].
- `src/lib/utils.ts` — `cn()` (clsx + tailwind-merge).

## Pages
Lookup surface: dashboard (`/`), list + detail for each entity type
(`/regions`, `/joints`, `/movements`, `/muscles`, `/tasks`, `/exercises`,
`/sources`), Exercise Finder (`/finder`), Workout Planner (`/planner`), Gait
Cycle (`/gait`), Hand Assessment (`/hand-assessment`), API Reference
(`/api-docs`), Validation Queue (`/validation`), global search.

Discovery surface (added 2026-07-04,
[[decisions/2026-07-04-discovery-views]]):

- **`/body-map`** — `getBodyMapData()` → `BodyMap` client component. SVG
  anterior silhouette with per-region hotspots (`HOTSPOTS` geometry keyed by
  region slug). Hover/tap/focus **selects** a region (sticky — no clear on
  leave, so no empty-panel flicker); marker radius is fixed so markers don't
  jitter. The panel shows the selected region's counts, or a whole-body summary
  by default; navigation is via the panel link and region list, not marker
  clicks. Note: `exerciseCount` is an *activity magnitude* — it sums exercises
  across a region's movements and so double-counts multi-movement exercises.
- **`/progressions`** — `getProgressionLadders()` → `ProgressionStepper` client
  component. One ladder at a time: an exercise picker (grouped by region) plus a
  horizontal easiest→hardest track with prev/next (regress/progress) and
  clickable step dots. Step names are best-effort linkified to real exercises via
  `normalizeExerciseName` match — the underlying relation is prose, not an FK
  edge ([[knowledge-graph-model]]).
- **`/coverage`** — `getCoverageData()`. Two heatmaps (muscles × role,
  movements grouped by region) on a single-hue indigo sequential ramp with a
  distinct dashed zero state, plus summary tiles and gap-callout chips linking
  the uncovered muscles/movements. The UI counterpart to `pnpm prompts:gaps`;
  lives under the Build & Admin nav group as a builder tool, not an average-user
  view ([[decisions/2026-07-04-nav-and-discovery-ux]]).

## Query layer conventions
- `validationSelect` — shared select for status/confidence metadata.
- `getXGroupedByRegion` helpers walk region → joints → movements → exercises to
  attribute exercises to regions (exercises have no direct region FK).
- New views added query functions here rather than querying Prisma from pages,
  keeping the page components thin and the data logic testable.

## Constraints
- Don't change `/api` response shapes without honoring the v1 contract
  ([[api-contract]]); UI-only changes are unconstrained.
- Keep copy educational, not prescriptive (no diagnosis/treatment framing).
