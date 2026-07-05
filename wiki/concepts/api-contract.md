---
type: concept
status: current
updated: 2026-07-04
links: [source-resolution, explorer-ui, backlog]
---

# API Contract (v1)

Authoritative doc: `docs/api-v1.md` (frozen 2026-04-11). This page is the
summary; the doc governs.

## The contract in one line
The seven `/api/*` routes are the stable public surface. **Documented fields
are never renamed or removed while v1 is live.** New fields may appear anytime;
consumers must ignore unknown fields. Everything internal (Prisma schema, query
layer, seed data, validation states, UI) is free to change.

## The two rules
1. No renaming a documented field on a v1 route.
2. No removing a documented field from a v1 route.

Breaking changes ship on `/api/v2/*`; v1 keeps running until consumers migrate.

## Endpoints
| Endpoint | Purpose |
|---|---|
| `GET /api/stats` | Knowledge-graph counts |
| `GET /api/search?q=` | Cross-entity search |
| `GET /api/exercises` | List/filter exercises (region, muscle, movement, task, role, status, confidence) |
| `GET /api/exercises/:slug` | Full exercise detail |
| `GET /api/exercises/filters` | Available filter options |
| `GET /api/muscles` | List/search muscles |
| `GET /api/sources` | Sources with fulltext/PDF filtering (`format=rag` for RAG) |

## Enforcement
`src/lib/schemas/contract-test.ts` (`pnpm contract:test`) asserts responses
still validate against the frozen Zod shapes in `src/lib/schemas/`. Run it
before changing anything that touches an `/api` response.

## Explicitly safe without a version bump
Adding scalar/nested fields, adding optional query params, adding new
endpoints, refactoring `queries.ts`/seed/UI, changing entity `status`,
recalibrating `confidence`, adding/removing/renaming seed data. **The data is
not part of the contract; the shape is.**

## Known consumers
Inyo Platform, a desk-habits app, and future apps (per `docs/api-v1.md`). A
planned **versioned dataset export** and **MCP server** would widen this
surface for builders who don't want to run Postgres — see [[backlog]].
