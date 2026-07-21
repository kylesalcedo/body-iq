---
type: overview
status: current
updated: 2026-07-04
links: [overview, stack, backlog, log]
---

# Wiki Index

Institutional memory for **Body IQ**. Domain facts live in the database
(`prisma/seed/**`) and the explorer UI — this wiki records the *why* and the
*how*. See [[../WIKI]] for the schema and rules.

## Start here
- [[overview]] — what Body IQ is, current state, key concepts
- [[stack]] — tech stack with versions and rationale
- [[backlog]] — planned features (dataset export, MCP server, stack builder, explainability)
- [[log]] — chronological activity record

## Concepts
- [[concepts/knowledge-graph-model]] — the entity/relationship model and role weighting
- [[concepts/validation-lifecycle]] — status + confidence, how entities mature
- [[concepts/data-pipeline]] — authoring → sourcing → cue-quality → seed; the extension pattern
- [[concepts/source-resolution]] — how citations are resolved via PubMed / CrossRef / Europe PMC
- [[concepts/api-contract]] — the frozen v1 API surface and its discipline
- [[concepts/explorer-ui]] — the Next.js explorer: pages, query layer, new discovery views
- [[concepts/static-demo]] — the static GitHub Pages build (no backend needed)

## Decisions (ADRs)
- [[decisions/2026-07-04-wiki-adoption]] — adopt a meta-layer wiki, commit it, gitignore raw/
- [[decisions/2026-07-04-role-weighting]] — 5-tier muscle role weighting
- [[decisions/2026-07-04-confidence-rubric]] — confidence scoring rubric
- [[decisions/2026-07-04-defer-video-generation]] — why AI video is deferred to YouTube links + stills
- [[decisions/2026-07-04-discovery-views]] — progression ladders, body map, coverage heatmap
- [[decisions/2026-07-04-nav-and-discovery-ux]] — grouped nav + discovery-view UX refinements
- [[decisions/2026-07-04-validator-agent]] — report-only, human-in-the-loop validation assistant

## Sources
Third-party sources (PDFs, PRDs, threads) go in `raw/` (gitignored). File a
`source-summary` page here when one is ingested. None yet.
