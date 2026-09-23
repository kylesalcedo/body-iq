# Log

Append-only. `grep "^## \[" wiki/log.md | tail -10` for recent activity.

## [2026-09-22] change | Identifier fix proposals + multi-engine intake
`scripts/identifier-fix-proposals.ts` searches each conflicting corpus source's
stored title in PubMed, Europe PMC, and OpenAlex. Of 19 flagged sources: 10
strong proposals, 5 possible, 1 already correct, 3 with no match. Report only
(docs/identifier-fix-proposals-2026-09-22.md). Intake gained `--engines
pubmed,europepmc,openalex`: 125 goal candidates (60 found only outside the
PubMed search), shortlist 18 -> 29, all corroborated. The 11 new ones are not attached.

## [2026-09-22] change | Goal evidence attached, cross-source verification, Jev audits 3-5
Kyle approved the 18-article intake shortlist and menu items 3-5. Added
`scripts/source-crosscheck.ts` (PubMed, Europe PMC, OpenAlex, Crossref,
Semantic Scholar; PEDro excluded by its fair-use terms): shortlist 18/18
corroborated; corpus 280/305 corroborated, 19 conflicts including about 13
stored identifiers that resolve to a different article. Added seed extension
`goal-evidence` (18 sources, `needs_review`, linked via SourceOnEntity.goalId).
Added `scripts/jev-audits.ts`: overclaim (153 exercises overstated by both
checks, 81% agreement), freshness (14 refresh candidates), cue focus (60%
agreement with stored labels, not applied). 1,450 Jev calls, $0.030481.
See docs/jev-audits-2026-09-22.md.

## [2026-09-22] change | Goal <-> Source link
Added nullable `SourceOnEntity.goalId` (FK to Goal, cascade delete, indexed)
and `Goal.sources`, so condition-level research articles can attach to goals
with `entityType: "Goal"`. Additive only; `pnpm db:push` would apply it (not run). SQL in the ADR. See
[[decisions/2026-09-22-goal-source-link]].

## [2026-09-22] change | Jev research-article intake + improvement menu
Added `scripts/research-intake.ts` (`pnpm research:intake`): PubMed candidate
search per rehab goal or exercise, verbatim abstract conclusions as summaries,
Jev relevance/design/finding/review-probability vetting, and a strict proposal
gate. First live pass: 108 calls, $0.005655, 0 proposed under the strict gate,
18-article shortlist across 10 rehab goals. Exercise-name search proved weak (23
of 40 zero-hit). Jev calls now send a browser User-Agent (Cloudflare 1010 fix).
See [[concepts/research-intake]], docs/research-intake-jev-2026-09-22.md, and
docs/jev-improvement-menu-2026-09-22.md.

## [2026-08-14] fix | FHIR links 404'd on the static demo — two causes
(1) The Pages workflow deletes `src/app/api/**` before the export build, so
`/api/exercises/<slug>/fhir` was never deployed. (2) `/exercises/[slug]` used a
raw `<a href="/api/…">`, which `basePath` does not rewrite — it pointed outside
the repo subpath and would break under any basePath deploy. Fixed by adding
`src/lib/static-mode.ts` (`fhirHref` / `withBasePath`), exporting FHIR resources
to `public/fhir/` in CI before the API routes are removed, and stating the
snapshot caveat on both call sites plus the demo banner. Verified with a real
`STATIC_EXPORT=1 PAGES_BASE_PATH=/body-iq` build: links resolve to
`/body-iq/fhir/<slug>.json`, 306 files present in `out/fhir/`, no `/api/` hrefs
left in the output. See [[concepts/static-demo]].

## [2026-08-05] decision | Progression/regression as typed graph edges (proposed)
`targetExerciseId` becomes the canonical link instead of best-effort name
matching in `getProgressionLadders`; new `ProgressionMechanism` enum records
*why* the next rung is harder (leverage, range, unilateral, stability, tempo,
contraction_type, added_load, speed, volume, complexity); `criterion` carries
the gate/trigger; one authored rung materializes both directions. Additive and
nullable — no v1 API break. ADR: [[decisions/2026-08-05-progression-edges]].

## [2026-08-05] change | Bodyweight progression ladders (drafted, not seeded)
`extensions/bodyweight-ladders.ts` + JSON: 15 new nodes filling the middle of
the push/pull/squat/hinge/core ladders (knee push-up, floor push-up, diamond,
archer, dead hang, scapular pull-up, band-assisted + negative pull-up, support
hold, negative dip, single-leg glute bridge, assisted pistol, foot-supported →
tuck → full L-sit) and 31 typed rungs across 7 ladders. Rung ORDER is community
consensus — recorded as an `expert-opinion` source at confidence 0.35 and
linked to every node; the anatomy links under each node are unsourced pending
the normal sourcing pass. Runs after apply-audit for the same reason it does.
Seeded 2026-08-14: 320 exercises, 31 typed progression edges + 31 mirrored
regressions. `getProgressionLadders` now prefers the FK over the name match and
takes the chip label from the target (`Negative Dip → Dip` only resolves via the
FK), and `/progressions` shows the mechanism as a tooltip.

Still outstanding: the two `pnpm data:quality` checks the ADR calls for
(edges missing a `criterion`; name-matched-but-unlinked steps). 510 of 524
legacy prose steps remain unlinked — the incremental backfill the ADR describes.

## [2026-08-04] change | API detail routes (muscle/region/joint) + dataset-backed MCP server (7 tools)

## [2026-08-04] change | Data-integrity pass + versioned dataset export (JSON/SQLite/schema) + release CI

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
