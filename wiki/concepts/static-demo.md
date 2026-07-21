---
type: concept
status: current
updated: 2026-07-04
links: [explorer-ui, api-contract]
---

# Static Demo (GitHub Pages)

A fully static build of the explorer is published to GitHub Pages so people can
try the high-level experience without running Postgres or any backend. The
knowledge graph is read-only seed data, so every page can be prerendered.

## How it works
- **Opt-in via env.** `STATIC_EXPORT=1` flips `next.config.js` to
  `output: "export"`; normal `pnpm dev` / `pnpm build` are unchanged.
  `PAGES_BASE_PATH=/<repo>` sets the subpath GitHub Pages serves under.
- **SSG for all routes.** Every `[slug]` route re-exports a slug list as
  `generateStaticParams` (see `allRegionSlugs` … in `src/lib/queries.ts`), so
  all ~650 entity pages prerender to static HTML. The three former
  `force-dynamic` pages (home, gait, planner) switch to `force-static` in export
  mode.
- **CI provisions the database.** `.github/workflows/deploy-pages.yml` spins up
  a Postgres service, runs `db:generate` / `db:push` / `db:seed`, then builds —
  so no human needs a local DB. Triggered on push to `main` or manually.

## What's inert in the static build (no server)
- **API routes** (`src/app/api/**`) can't be statically exported — the workflow
  removes them (and `api-docs`, and `contract-test.ts` which imports them)
  before the export build.
- **Global search** hits `/api/search`, so `SearchBar` renders a disabled hint
  when `NEXT_PUBLIC_STATIC=1`.
- The **API "Try it" explorer** is excluded.

Everything else works client-side: body map, progression stepper, coverage
heatmap + copy-prompt buttons, collapsible nav, and all anatomy/exercise/source
pages.

**Exercise Finder** used to fetch `/api/exercises/filters` + `/api/exercises`
(so it hung on "Loading filters…" statically). It now loads filter options and
the full exercise list at build time via `getFinderData` (server component) and
filters entirely client-side, so it works with no backend. This is the model
for making the remaining API-dependent surfaces (search) static later.

## Gotchas encoded here
- Raw `<img src>` and metadata `icon` are **not** rewritten by `basePath` —
  they're prefixed manually with `NEXT_PUBLIC_BASE_PATH` (sidebar icons, favicon).
- `public/.nojekyll` stops GitHub Pages from stripping `_next/`.
- `trailingSlash: true` in export mode so `/route/` resolves to
  `/route/index.html`.

## Enabling it (one-time, in the GitHub repo)
Settings → Pages → Build and deployment → Source = **GitHub Actions**. Then push
to `main` (or run the workflow manually). The demo lands at
`https://<user>.github.io/<repo>/`.
