#!/usr/bin/env tsx
/**
 * Ingest a clinical-evidence-tool response for the citation-deepening prompts.
 * Parses the response for exercise → citation mappings and creates
 * ResearchSource records + SourceOnEntity links, so proper primary citations
 * replace the generic textbook sources on the researched exercises.
 *
 * It reads two signals, most-reliable first:
 *   1. The summary table each prompt requests:
 *        | Movement | Evidence level | Key citation (author, year, DOI/PMID) |
 *   2. Any DOI (10.xxxx/…) or PMID mentioned under a "## <Movement>" or
 *      "**Movement**" heading elsewhere in the response.
 *
 * Exercise names are matched to slugs case/punctuation-insensitively. Sources
 * are created as drafts with whatever identifier was found; run
 * `npx tsx scripts/resolve-sources.ts` afterwards to fill titles/DOIs/PDF links
 * from PubMed/CrossRef (no fabricated metadata).
 *
 * Usage: tsx scripts/ingest-citations.ts <response.md> [--apply]
 */
import { PrismaClient } from "@prisma/client";
import { readFileSync } from "node:fs";

const FILE = process.argv[2];
const APPLY = process.argv.includes("--apply");
if (!FILE) throw new Error("usage: ingest-citations.ts <response.md> [--apply]");
const p = new PrismaClient();

const DOI_RE = /10\.\d{4,9}\/[-._;()/:A-Za-z0-9]+/;
const PMID_RE = /\bPMID:?\s*(\d{6,9})\b/i;
const AUTHOR_YEAR_RE = /([A-Z][A-Za-zÀ-ſ'’-]+)\s*(?:et al\.?)?,?\s*\(?((?:19|20)\d{2})\)?/;

const norm = (s: string) => s.toLowerCase().replace(/\([^)]*\)/g, "").replace(/[^a-z0-9]+/g, " ").trim();
function slugify(author: string, year: string, seq: number) {
  const a = author.toLowerCase().replace(/[^a-z]/g, "");
  return `${a || "ref"}-${year}${seq ? "-" + seq : ""}`;
}

type Found = { exerciseName: string; author?: string; year?: string; doi?: string; pmid?: string; raw: string };

function parse(text: string): Found[] {
  const found: Found[] = [];
  const lines = text.split(/\r?\n/);
  // 1) markdown table rows with a DOI/PMID in them
  for (const line of lines) {
    if (!line.trim().startsWith("|")) continue;
    const cols = line.split("|").map((c) => c.trim()).filter(Boolean);
    if (cols.length < 2) continue;
    const joined = cols.join("  ");
    if (!DOI_RE.test(joined) && !PMID_RE.test(joined)) continue;
    if (/movement|exercise/i.test(cols[0]) && /citation|evidence|level/i.test(joined)) continue; // header
    const doi = joined.match(DOI_RE)?.[0];
    const pmid = joined.match(PMID_RE)?.[1];
    const ay = joined.match(AUTHOR_YEAR_RE);
    found.push({ exerciseName: cols[0], author: ay?.[1], year: ay?.[2], doi, pmid, raw: line.trim() });
  }
  // 2) heading-scoped DOIs/PMIDs (## Heading or **Heading**) not already captured by a table
  let heading = "";
  for (const line of lines) {
    const h = line.match(/^#{2,4}\s+(.+)$/) || line.match(/^\*\*(.+?)\*\*\s*$/);
    if (h) { heading = h[1].replace(/[*_`]/g, "").trim(); continue; }
    if (line.trim().startsWith("|")) continue; // tables handled above
    const doi = line.match(DOI_RE)?.[0];
    const pmid = line.match(PMID_RE)?.[1];
    if ((doi || pmid) && heading) {
      const ay = line.match(AUTHOR_YEAR_RE);
      found.push({ exerciseName: heading, author: ay?.[1], year: ay?.[2], doi, pmid, raw: line.trim() });
    }
  }
  // de-dupe by (exerciseName, doi||pmid)
  const seen = new Set<string>();
  return found.filter((f) => {
    const k = norm(f.exerciseName) + "|" + (f.doi || f.pmid || f.raw.slice(0, 40));
    if (seen.has(k)) return false; seen.add(k); return true;
  });
}

async function main() {
  const text = readFileSync(FILE, "utf8");
  const found = parse(text);
  const exercises = await p.exercise.findMany({ select: { id: true, slug: true, name: true } });
  const byNorm = new Map(exercises.map((e) => [norm(e.name), e]));

  let matched = 0, unmatched = 0, sourcesNew = 0, linksNew = 0;
  const misses: string[] = [];
  let seq = 0;

  for (const f of found) {
    const ex = byNorm.get(norm(f.exerciseName));
    if (!ex) { unmatched++; misses.push(f.exerciseName); continue; }
    matched++;
    if (!f.doi && !f.pmid) continue; // nothing resolvable to key on

    const slug = f.author && f.year ? slugify(f.author, f.year, 0) : `pmid-${f.pmid || f.doi?.slice(-6)}`;
    let source = await p.researchSource.findFirst({ where: { OR: [{ slug }, f.doi ? { doi: f.doi } : { pmid: f.pmid }] }, select: { id: true } });
    if (!source) {
      sourcesNew++;
      if (APPLY) {
        source = await p.researchSource.create({
          data: {
            slug: (await p.researchSource.findUnique({ where: { slug }, select: { id: true } })) ? slugify(f.author || "ref", f.year || "0", ++seq) : slug,
            title: `${f.author ?? "Unknown"} ${f.year ?? ""} — pending resolution`.trim(),
            authors: f.author, year: f.year ? Number(f.year) : null, doi: f.doi ?? null, pmid: f.pmid ?? null,
            sourceType: "journal", status: "draft", notes: `Ingested from ${FILE}: ${f.raw.slice(0, 160)}`,
          },
          select: { id: true },
        });
      }
    }
    // link
    if (source) {
      const existing = await p.sourceOnEntity.findFirst({ where: { sourceId: source.id, exerciseId: ex.id }, select: { id: true } });
      if (!existing) { linksNew++; if (APPLY) await p.sourceOnEntity.create({ data: { entityType: "Exercise", exerciseId: ex.id, sourceId: source.id } }); }
    } else if (!APPLY) {
      linksNew++; // dry-run: would create source+link
    }
  }

  console.log(APPLY ? "APPLIED" : "DRY RUN (pass --apply)");
  console.log(`  citations parsed: ${found.length}`);
  console.log(`  matched to exercises: ${matched} | unmatched: ${unmatched}`);
  console.log(`  new sources: ${sourcesNew} | new exercise links: ${linksNew}`);
  if (misses.length) console.log(`  unmatched names (fix name or add manually): ${[...new Set(misses)].slice(0, 20).join(" · ")}`);
  console.log(`\n  Next: npx tsx scripts/resolve-sources.ts  (fills titles/DOIs/PDF links), then pnpm score`);
}

main().finally(() => p.$disconnect());
