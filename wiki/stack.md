---
type: stack
status: current
updated: 2026-07-04
links: [overview, concepts/explorer-ui, concepts/api-contract]
---

# Stack

| Layer | Choice | Version | Why |
|---|---|---|---|
| Framework | Next.js (App Router) | ^14.2 | Server components render the graph directly from Prisma with no client data layer; `/app/api/*` colocates the public API with the UI. |
| Language | TypeScript | ^5.5 | Types flow from Prisma's generated client through the query layer to the pages. |
| ORM | Prisma | ^6.0 | Schema-as-code for a relational graph; generated client is the type source of truth. |
| Database | PostgreSQL | 14+ | Relational fit for the weighted join tables and polymorphic source/tag links. |
| Validation | Zod | ^3.23 | API response schemas + the contract test that guards v1. |
| Styling | Tailwind CSS | ^3.4 | Utility styling; no component-library lock-in. |
| UI primitives | Radix (`@radix-ui/*`) | 1.x/2.x | Accessible dialog/select/tabs/dropdown for the explorer. |
| Icons | lucide-react | ^0.400 | |
| Package manager | pnpm | — | Workspace-friendly, strict node_modules. |
| Scripts / seed | tsx | ^4.19 | Run TS seed + tooling without a build step. |
| LLM SDK | @anthropic-ai/sdk | ^0.110 | Powers `validate:agent` (report-only queue triage); model `claude-opus-4-8`. See [[decisions/2026-07-04-validator-agent]]. |

## Runtime shape

- **No client-side data fetching for entity pages.** Pages are async server
  components that call `src/lib/queries.ts`, which calls Prisma. The client
  bundle is small (search box, finder filters, planner grid interactivity).
- **`src/lib/prisma.ts`** holds the singleton client (avoids exhausting
  connections in dev hot-reload).
- **`src/lib/schemas/`** holds Zod schemas plus `contract-test.ts`, which
  asserts the `/api/v1` responses still match the frozen shapes.

## Data & tooling scripts

Seed lives in `prisma/seed/**`: base modules per entity type plus
`extensions/` for incremental content drops. `scripts/**` holds the
data-quality, source-resolution, and cue-quality toolchain. See
[[concepts/data-pipeline]] and [[concepts/source-resolution]].

## Local setup

Postgres on `localhost:5432`, `DATABASE_URL` in `.env` (copy `.env.example`),
then `pnpm install && pnpm db:push && pnpm db:seed && pnpm dev`.
