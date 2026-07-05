# CLAUDE.md

Guidance for AI agents (and humans) working in this repo.

## What this is

**Body IQ** — a validation-first biomechanics / physical-therapy knowledge
engine. It models the movement chain

```
Region → Joint → Movement → Muscle (O/I/A/N/B) → Functional Task
       → Exercise (cues, regressions, progressions) → Evidence
```

as a queryable, reviewable knowledge graph. Every entity carries validation
metadata (`status`, `confidence`, `notes`, `reviewedBy`). Muscle↔movement and
muscle↔exercise links are **weighted by role** (primary / secondary /
stabilizer / synergist / common_association).

## The wiki is the institutional memory

Before non-trivial work, read `wiki/index.md` and the relevant concept /
decision pages. The wiki records *why* the graph is shaped as it is and *how*
the content pipeline works — the domain facts themselves live in the database
(`prisma/seed/**`), not in the wiki. See `WIKI.md` for the schema and rules.

Quick recall of recent activity: `grep "^## \[" wiki/log.md | tail -10`.

## Stack

Next.js 14 (App Router) · TypeScript · Prisma · PostgreSQL · Tailwind · Zod ·
pnpm. Details and rationale in `wiki/stack.md`.

## Working commands

```bash
pnpm dev            # explorer at localhost:3000
pnpm db:push        # push schema to Postgres
pnpm db:seed        # seed the knowledge graph
pnpm db:studio      # Prisma Studio
pnpm build          # production build (also the typecheck gate)
pnpm data:quality   # data integrity checks
pnpm cue:audit      # coaching-cue quality audit
pnpm prompts:gaps   # find coverage gaps for authoring prompts
```

## Conventions that matter

- **Don't break the v1 API contract.** `docs/api-v1.md` freezes the shape of
  the seven `/api/*` routes: documented fields are never renamed or removed on
  v1. Add freely; breaking changes go to `/api/v2`. See
  `wiki/concepts/api-contract.md`.
- **Data changes flow through seed extensions.** New content is added as a
  module under `prisma/seed/extensions/` and wired into `seed.ts`, not by
  editing the database directly. See `wiki/concepts/data-pipeline.md`.
- **Confidence and evidence are not decoration.** Follow the rubric in
  `CONTRIBUTING.md` / `wiki/decisions/`. If unsure, score low — don't guess.
- **Educational framing, not medical advice.** Keep user-facing copy about
  anatomy, movement, and evidence — not diagnosis or treatment prescription.

## Repo map

- `src/app/**` — Next.js routes (explorer pages + `/api` routes)
- `src/lib/queries.ts` — the Prisma query layer the pages call
- `src/lib/schemas/**` — Zod schemas + the API contract test
- `prisma/schema.prisma` — the graph model
- `prisma/seed/**` — seed data (base modules + `extensions/`)
- `scripts/**` — data-quality, source-resolution, cue-quality toolchain
- `docs/**` — the frozen API contract and the video-generation roadmap
- `wiki/**` — this project's institutional memory
