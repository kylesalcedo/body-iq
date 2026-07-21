# Log

Append-only. `grep "^## \[" wiki/log.md | tail -10` for recent activity.

## [2026-07-04] decision | Adopt meta-layer wiki, commit it, gitignore raw/
Bootstrapped `wiki/` adapted to Body IQ: the DB is the source of truth for
domain facts, so the wiki covers only the meta-layer (concepts + decisions).
Added `WIKI.md` (schema) and `CLAUDE.md` (agent on-ramp). raw/ gitignored.
ADR: [[decisions/2026-07-04-wiki-adoption]].

## [2026-07-04] change | Bootstrap wiki pages
Created index, overview, stack, backlog, log; concepts (knowledge-graph-model,
validation-lifecycle, data-pipeline, source-resolution, api-contract,
explorer-ui); decisions (wiki-adoption, role-weighting, confidence-rubric,
defer-video-generation, discovery-views). Documented pre-existing decisions
(role weighting, confidence rubric, video deferral) as ADRs.

## [2026-07-04] change | Add discovery views to explorer
Built /progressions (progression ladders), /body-map (interactive body map),
/coverage (coverage heatmap). No schema/API change — server-rendered views over
existing queries. ADR: [[decisions/2026-07-04-discovery-views]].

## [2026-07-04] change | Backlog planned for items 4-7
Filed dataset export, MCP server, stack builder, explainability view in
[[backlog]] with rationale and sketches.

## [2026-07-04] change | Discovery-view UX refinements + grouped nav
Sidebar regrouped into collapsible sections (Build & Admin collapsed by
default; Coverage moved there). Body map: sticky selection, no marker jitter,
whole-body default summary. Progressions rebuilt as a single-ladder click-
through stepper. ADR: [[decisions/2026-07-04-nav-and-discovery-ux]].

## [2026-07-04] decision | Report-only validation assistant
Added scripts/validate-agent.ts (pnpm validate:agent) — reviews the validation
queue against the confidence rubric + linked sources via the Claude API and
emits suggestions only; never writes the DB. New dep @anthropic-ai/sdk.
ADR: [[decisions/2026-07-04-validator-agent]].

## [2026-07-04] change | Branded nav icons + body-map click-to-navigate
Replaced sidebar emoji with a custom icon set in public/icons/ (brand + 5
section headers). Body-map markers now navigate to the region on click
(role=link) instead of select-only. Updated ADR
[[decisions/2026-07-04-nav-and-discovery-ux]].

## [2026-07-04] change | Outlined icon set + favicon + coverage→prompt flow
Swapped the icon set for outlined versions; placed nav icons (brand + 5
sections) on soft sage chips so they read on white. Favicon replaced with a
high-contrast sage SVG (public/favicon.svg: head + spine dots on sage).
Extracted gap-prompt
templates into src/lib/gap-prompts.ts (shared by scripts/prompt-gaps.ts and a
new /coverage copy-prompt UI). The Coverage heatmap now has per-gap and batch
"copy authoring prompt" buttons for zero-coverage muscles/movements, muscles
never trained as primary, and movements with only 1–2 exercises. See
[[concepts/data-pipeline]] and [[concepts/explorer-ui]].

## [2026-07-04] fix | Hydration error — nested anchor on /joints
The joints list wrapped each card in an EntityLink AND nested a region
EntityLink inside it (<a> in <a>), which the browser hoists → React hydration
mismatch ("<div> in <a>"). Fixed by making the card a plain div with the joint
title and region as sibling links. A whole-app rendered-HTML scan confirmed
/joints was the only page with nested anchors.

## [2026-07-04] change | Final badge icon set + favicon
Replaced the icon set with self-contained sage-badge icons (white pictograms,
high contrast); removed the tint chips from the sidebar since the badges carry
their own background. Favicon now /icons/favicon.png (matching badge).

## [2026-07-04] change | Static GitHub Pages demo (no backend)
Env-gated static export (STATIC_EXPORT=1): output:export, generateStaticParams
on all [slug] routes, force-static home/gait/planner, basePath-prefixed assets,
search disabled in static mode. CI (.github/workflows/deploy-pages.yml) seeds
Postgres and builds+deploys so no local DB is needed. Verified the export
builds and serves locally (~650 pages). See [[concepts/static-demo]].
