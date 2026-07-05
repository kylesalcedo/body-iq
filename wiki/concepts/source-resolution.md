---
type: concept
status: current
updated: 2026-07-04
links: [data-pipeline, api-contract]
---

# Source Resolution

`ResearchSource` records are enriched from public bibliographic APIs so each
citation carries stable identifiers and, where possible, a free-fulltext link.

## Fields resolved
`doi`, `pmid`, `pmcid`, `url`, `fulltextUrl`, `pdfUrl`, plus `authors`, `year`,
`journal`. Current corpus: 309 sources — 274 with DOIs, 192 with PubMed IDs,
86 with PMC IDs, 111 free-fulltext (86 with direct PDF URLs).

## Toolchain
- `scripts/resolve-sources.ts` (`npx tsx scripts/resolve-sources.ts`) queries
  **PubMed**, **CrossRef**, and **Europe PMC** to fill identifiers and fulltext
  links.
- `scripts/resolved-sources.json` — cached resolution output.
- `scripts/merge-resolved-sources.ts` — merges resolved data back into the seed.

## RAG surface
`GET /api/sources?filter=pdf&format=rag` returns the free-PDF subset with a
minimal payload (slug, title, authors, year, journal, doi, pmid, pmcid,
fulltextUrl, pdfUrl) for ingestion by downstream retrieval systems. Part of the
frozen v1 surface ([[api-contract]]).

## Note
Resolution depends on external APIs and rate limits; re-running is idempotent
against the cache. Sources that fail to resolve keep whatever identifiers were
authored and should be flagged low-confidence rather than dropped.
