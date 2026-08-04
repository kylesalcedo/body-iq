# Body IQ — Movement Knowledge Engine

A validation-first biomechanics and physical-therapy **knowledge engine** — the
movement chain modeled as a queryable, reviewable knowledge graph, built to
*fuel other anatomy/PT applications*, not just to be browsed.

Consume it three ways, none of which need a database on the consumer's side: a
**REST API**, a **versioned dataset bundle** (JSON + SQLite), and an **MCP
server** for agents. Every entity carries validation metadata so downstream
tools can reason about trust.

## What it models

**Region → Joint → Movement → Muscle (O/I/A/N/B) → Functional Task → Goal → Exercise (cues, dosing, positions, progressions) → Evidence**

Muscle↔movement and muscle↔exercise links are **weighted by role** (primary /
secondary / stabilizer / synergist / lengthening / common-association). Every
entity carries `status`, `confidence`, and sources; exercises also carry an
automated `qualityScore` with a per-validator breakdown.

## Knowledge graph (live counts)

| Entity | Count | | Links | Count |
|---|---|---|---|---|
| Regions | 11 | | Movement↔muscle | 315 |
| Joints | 26 | | Exercise↔muscle | 2,027 |
| Movements | 74 (65 with ROM) | | Cues | 1,097 |
| Muscles | 107 (100% O/I/A/N/B) | | Regressions / progressions | 484 / 484 |
| Functional tasks | 26 | | Exercise↔goal | 605 |
| Goals (rehab/perf/prevention/mobility) | 37 | | Source attachments | 1,322 |
| Exercises | 305 (all scored) | | SNOMED CT codes | 128 |
| Research sources | 435 (334 PMID · 281 DOI) | | | |

## Consuming the engine

### REST API
JSON endpoints; interactive docs + "Try it" at `/api-docs`.

| Endpoint | Description |
|---|---|
| `GET /api/stats`, `GET /api/search?q=` | Graph stats · cross-type search |
| `GET /api/exercises` · `/exercises/:slug` · `/exercises/filters` | Filter, detail, facets |
| `GET /api/exercises/:slug/fhir` | Live **FHIR R4 ActivityDefinition** |
| `GET /api/muscles` · `/muscles/:slug` | List · full attachment anatomy + what it drives |
| `GET /api/movements` · `/movements/:slug` | List (with ROM) · detail |
| `GET /api/joints` · `/joints/:slug`, `/regions` · `/regions/:slug` | Anatomy detail (with SNOMED codes) |
| `GET /api/goals` · `/goals/:slug`, `/tasks` · `/tasks/:slug` | Goals & functional tasks + their exercises |
| `GET /api/sources` | Sources with fulltext/PDF filtering (`?format=rag` for ingestion) |

The seven original routes are frozen as the v1 contract (`docs/api-v1.md`); the rest are additive.

### Versioned dataset bundle — no Postgres required
```bash
pnpm export:dataset   # → exports/dataset/
```
Emits the whole graph as a normalized **JSON** bundle, a **SQLite-loadable dump**
(`sqlite3 body-iq.db < body-iq.sql`), a **JSON-Schema contract**, and a manifest
(version, git SHA, counts). Every version tag publishes it to a GitHub Release,
so consumers pin a version and build without standing up a database.

### MCP server — the graph as agent tools
```bash
pnpm mcp
```
A dataset-backed [Model Context Protocol server](mcp/README.md) exposing tools
(`find_exercises`, `get_exercise`, `get_muscle`, `get_movement`, `find_by_goal`,
`search`, `dataset_info`), each returning validation metadata. Drop the config
snippet from `mcp/README.md` into any MCP client to query the graph in natural
language — no API-client code.

## Quick start

**Prerequisites:** Node 20+, PostgreSQL 14+, pnpm.

```bash
pnpm install
cp .env.example .env        # set DATABASE_URL
pnpm db:push                # push schema
pnpm db:seed                # seed the graph (idempotent)
pnpm dev                    # explorer at localhost:3000
```

## Stack

Next.js 16 (App Router) · React 19 · TypeScript · Prisma · PostgreSQL · Tailwind ·
Zod · pnpm. Zero dependency vulnerabilities. Details in [`wiki/stack.md`](wiki/stack.md).

## Explorer UI

Landing feature grid · **Body Map** (interactive figure) · **Progression
Ladders** (aligned easier→base→harder) · **Coverage Heatmap** · **Exercise
Finder** · **Goals** · anatomy list/detail pages (columnar tables, region
grouping) · **Data Model** (`/schema`) · **Validation Queue** · **API
Reference**. The whole explorer also builds as a static GitHub Pages demo.

## Scripts

```bash
pnpm dev / build            # dev server / production build (also the typecheck gate)
pnpm db:push / db:seed      # schema / seed (idempotent)
pnpm export:dataset         # versioned JSON + SQLite + schema bundle
pnpm export:fhir            # FHIR R4 ActivityDefinition export
pnpm mcp                    # dataset-backed MCP server
pnpm score [--promote]      # multi-validator exercise quality scoring
pnpm data:quality           # data-integrity checks
pnpm cue:audit              # coaching-cue quality audit
pnpm ingest:citations       # parse evidence-tool responses into sources
```

## Data pipeline & conventions

- **New content flows through seed extensions** under `prisma/seed/extensions/`
  (idempotent upserts, wired into `seed.ts`), not by editing the database.
- **Don't break the v1 API contract** — documented fields are never renamed or
  removed on v1; breaking changes go to `/api/v2`. See `docs/api-v1.md`.
- **Confidence and evidence are not decoration** — follow the rubric; if unsure,
  score low. Content is *educational* framing (anatomy, movement, evidence), not
  diagnosis or treatment prescription.

Agents and contributors should read [`CLAUDE.md`](CLAUDE.md) first.

## Validation framework

Every entity climbs a status ladder: `draft → needs_review → reviewed →
verified` (or `disputed`). Exercises also carry a composite `qualityScore`
(evidence 30 / coherence 30 / completeness 25 / review rigor 15) written by
`pnpm score`; the coherence validator cross-checks that an exercise's primary
muscles actually produce its linked movements. `pnpm data:quality` catches
structural issues (orphans, missing sources, slug collisions).

## Interoperability

- **FHIR R4** — every exercise renders as an `ActivityDefinition` (live route +
  batch `export:fhir`).
- **SNOMED CT** — 128 muscle/joint body-structure codes, fetched and verified
  against a live terminology server (not generated), flowing into the FHIR
  `bodySite` and muscle-involvement extensions.

## Documentation & wiki

Institutional memory lives in [`wiki/`](wiki/index.md) — the *why* and *how*
behind the graph (modeling decisions, the content pipeline, the API contract),
kept separate from the domain data. Start at
[`wiki/overview.md`](wiki/overview.md); the wiki's own rules are in
[`WIKI.md`](WIKI.md). Backlog and shipped work are tracked in
[`wiki/backlog.md`](wiki/backlog.md).

## Repo map

```
prisma/schema.prisma      the graph model
prisma/seed/**            seed data (base modules + extensions/)
src/app/**                Next.js routes (explorer pages + /api)
src/lib/queries.ts        the Prisma query layer
src/lib/fhir.ts           FHIR mapping (single source of truth)
scripts/**                export, scoring, data-quality, citation tooling
mcp/**                    dataset-backed MCP server
docs/**                   frozen API contract + roadmap
wiki/**                   institutional memory
```
