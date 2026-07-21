---
type: backlog
status: current
updated: 2026-07-04
links: [concepts/api-contract, concepts/data-pipeline, decisions/2026-07-04-discovery-views]
---

# Backlog

Planned features, not yet built. Prioritized after the three discovery views
([[decisions/2026-07-04-discovery-views]]). Ordered by value-per-effort for the
"let others build on / learn from this" goal. Each entry: what, why, sketch,
open questions.

---

## 4. Versioned public dataset export

**What.** Publish the knowledge graph as a downloadable, versioned artifact
(JSON bundle + SQLite file) under a clear data license, attached to GitHub
Releases (e.g. `body-iq-data@0.1.0`).

**Why.** Most people who want to build on this won't stand up Postgres. A
static, versioned artifact removes that barrier entirely and gives consumers a
pin-able version. Directly serves the "others building projects" audience.

**Sketch.**
- Extend `scripts/export-all-exercises.ts` into `scripts/export-dataset.ts`
  emitting the full graph (all entities + weighted links + sources) as JSON and
  as a generated SQLite DB.
- Include a `manifest.json` (schema version, entity counts, generatedAt, git
  SHA) and a `LICENSE-DATA` note.
- Wire to CI so a tagged release regenerates and attaches the artifacts.

**Open questions.** Data license choice (CC-BY vs CC-BY-SA vs custom, given
citations reference copyrighted papers by identifier only — the identifiers are
facts, safe to share). Whether to ship a JSON-Schema / Zod contract for the
export shape alongside the v1 API contract.

**Depends on / relates to.** [[concepts/data-pipeline]] (export scripts),
[[concepts/api-contract]] (shape discipline).

---

## 5. MCP server over the knowledge graph

**What.** A thin Model Context Protocol server exposing the graph as tools
("find exercises targeting muscle X as primary with confidence ≥ N", "get the
evidence chain for exercise Y", "search sources") — a wrapper over the existing
`/api` routes and `queries.ts`.

**Why.** Makes the graph directly usable inside anyone's Claude / agent setup
without them writing an API client. A genuine differentiator over static
exercise databases, and it dogfoods the validation metadata as tool output.

**Sketch.**
- New package/entrypoint (`mcp/` or a `scripts/mcp-server.ts`) using an MCP SDK.
- Tools map 1:1 onto v1 endpoints first; add graph-traversal tools
  (region→…→evidence) that compose queries.
- Return validation metadata (status/confidence/sources) in every payload so
  downstream agents can reason about trust.

**Open questions.** Read-only only (yes, for v1). Transport (stdio for local,
HTTP for hosted). Whether it ships in this repo or a sibling.

**Depends on.** [[concepts/api-contract]] (reuse frozen shapes),
[[concepts/source-resolution]] (evidence payloads).

---

## 6. Stack / program builder

**What.** Let a user compose exercises into a routine and get live coverage
analysis — muscles hit (by role), movements covered, functional tasks
addressed, and gaps — exportable as JSON / markdown.

**Why.** Turns the graph from reference into a tool people *use* to build
something. Builds directly on the existing Workout Planner grid and the
role-weighting model.

**Sketch.**
- Client state = a list of exercise slugs (URL-encodable for sharing).
- Reuse `getPlannerData` / exercise-muscle queries to compute a live coverage
  summary (which muscles reach `primary`, which movement columns are empty).
- Export the built stack + its coverage report.

**Open questions.** Overlap with the existing `/planner` — extend it vs a new
`/builder`. Keep strictly educational (coverage), avoid prescriptive dosing
that reads as individualized medical advice.

**Depends on.** `getPlannerData` in `queries.ts`,
[[decisions/2026-07-04-role-weighting]].

---

## 7. "Why this exercise" explainability view

**What.** A single page rendering the full evidence chain for one exercise:
exercise → movements → muscles (by role) → sources, with confidence at each
hop.

**Why.** Cheap, and it showcases the validation-first design better than any
other view — the reason to trust (or distrust) a recommendation, made visible.

**Sketch.**
- New route `/exercises/[slug]/why` (or a tab on the detail page) using the
  existing `getExercise` include graph, laid out as a left-to-right chain with
  status/confidence badges and inline source citations.

**Open questions.** Standalone page vs a section on the existing detail page.
Whether to render it as a small graph/flow diagram vs stacked columns.

**Depends on.** `getExercise` in `queries.ts`,
[[concepts/validation-lifecycle]].

---

## Candidate future ADR (not a feature)

Promote `Regression` / `Progression` from prose rows to real FK edges between
Exercise records, so progression ladders are hard graph edges rather than the
current best-effort name match. See note in
[[concepts/knowledge-graph-model]].
