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
 * Usage:
 *   tsx scripts/ingest-citations.ts [--apply]                 # scan research/citations/*.md
 *   tsx scripts/ingest-citations.ts <response.md> [--apply]   # one file
 *   tsx scripts/ingest-citations.ts <dir> [--apply]           # a folder
 *
 * With no path it scans research/citations/. Empty/placeholder files (no DOI or
 * PMID) are skipped, so you can pre-create blanks and just fill the ones you run.
 */
import { PrismaClient } from "@prisma/client";
import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join } from "node:path";

const APPLY = process.argv.includes("--apply");
const PATH_ARG = process.argv.slice(2).find((a) => !a.startsWith("--"));
const p = new PrismaClient();

const DEFAULT_DIR = join(process.cwd(), "research", "citations");
const DOI_ANY = /10\.\d{4,9}\//;
const PMID_ANY = /\bPMID:?\s*\d{6,9}\b/i;

function filesToScan(): string[] {
  const target = PATH_ARG ? join(process.cwd(), PATH_ARG) : DEFAULT_DIR;
  if (!existsSync(target)) throw new Error(`not found: ${target}`);
  if (statSync(target).isDirectory()) {
    return readdirSync(target).filter((f) => f.endsWith(".md")).map((f) => join(target, f));
  }
  return [target];
}
function hasContent(text: string): boolean {
  return DOI_ANY.test(text) || PMID_ANY.test(text);
}

const DOI_RE = /10\.\d{4,9}\/[-._;()/:A-Za-z0-9]+/;
const PMID_RE = /\bPMID:?\s*(\d{6,9})\b/i;
const AUTHOR_YEAR_RE = /([A-Z][A-Za-zÀ-ſ'’-]+)\s*(?:et al\.?)?,?\s*\(?((?:19|20)\d{2})\)?/;

const norm = (s: string) => s.toLowerCase().replace(/\([^)]*\)/g, "").replace(/[^a-z0-9]+/g, " ").trim();
function slugify(author: string, year: string, seq: number) {
  const a = author.toLowerCase().replace(/[^a-z]/g, "");
  return `${a || "ref"}-${year}${seq ? "-" + seq : ""}`;
}

type Found = { exerciseName: string; author?: string; year?: string; journal?: string; doi?: string; pmid?: string; raw: string };

/**
 * Section the response by exercise-name title lines (a whole line that
 * normalizes to a known exercise name), then within each section pull every
 * citation entry. Citation blocks are semicolon-separated
 * "Author et al., Year, Journal, PMID nnnn" runs; markdown tables and
 * heading-scoped lines are also handled as fallbacks.
 */
function parse(text: string, knownNames: Set<string>): Found[] {
  const found: Found[] = [];
  const lines = text.split(/\r?\n/);
  let current = "";

  const pushEntry = (chunk: string) => {
    const doi = chunk.match(DOI_RE)?.[0];
    const pmid = chunk.match(PMID_RE)?.[1];
    if (!doi && !pmid) return;
    const ay = chunk.match(AUTHOR_YEAR_RE);
    // Citation entries read "Author et al., Year, Journal, PMID nnnn" — the
    // journal is the comma-segment(s) between the year and the PMID/DOI.
    let journal: string | undefined;
    if (ay) {
      const afterYear = chunk.slice((ay.index ?? 0) + ay[0].length);
      const j = afterYear.replace(/^[,;\s]+/, "").split(/,?\s*(?:PMID|DOI|doi|10\.\d)/)[0].replace(/[.,;\s]+$/, "").trim();
      if (j && j.length >= 3 && j.length <= 80 && !/^\d/.test(j)) journal = j;
    }
    found.push({ exerciseName: current, author: ay?.[1], year: ay?.[2], journal, doi, pmid, raw: chunk.trim().slice(0, 180) });
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;
    // A title line: strip markdown/numbering, and if it EXACTLY names a known exercise, start its section.
    const asTitle = line.replace(/^#{1,6}\s*/, "").replace(/^\d+[.)]\s*/, "").replace(/^\*+|\*+$/g, "").trim();
    if (asTitle.length < 80 && knownNames.has(norm(asTitle))) { current = asTitle; continue; }
    if (!current) continue; // citations before the first named section are ignored
    if (!DOI_RE.test(line) && !PMID_RE.test(line)) continue;
    // split into individual citation entries (semicolons, or table cells)
    const cells = line.startsWith("|") ? line.split("|") : line.split(/;\s*/);
    for (const c of cells) pushEntry(c);
  }

  // de-dupe by (exercise, doi||pmid)
  const seen = new Set<string>();
  return found.filter((f) => {
    const k = norm(f.exerciseName) + "|" + (f.doi || f.pmid);
    if (seen.has(k)) return false; seen.add(k); return true;
  });
}

async function main() {
  const files = filesToScan();
  const exercises = await p.exercise.findMany({ select: { id: true, slug: true, name: true } });
  const byNorm = new Map(exercises.map((e) => [norm(e.name), e]));

  let matched = 0, unmatched = 0, sourcesNew = 0, linksNew = 0, scanned = 0, skipped = 0;
  const misses: string[] = [];
  let seq = 0;

  const knownNames = new Set(byNorm.keys());
  const found: Found[] = [];
  for (const file of files) {
    const text = readFileSync(file, "utf8");
    if (!hasContent(text)) { skipped++; continue; }
    scanned++;
    found.push(...parse(text, knownNames).map((f) => ({ ...f, _file: file })));
  }

  for (const f of found) {
    const ex = byNorm.get(norm(f.exerciseName));
    if (!ex) { unmatched++; misses.push(f.exerciseName); continue; }
    matched++;
    if (!f.doi && !f.pmid) continue; // nothing resolvable to key on

    const slug = f.author && f.year ? slugify(f.author, f.year, 0) : `pmid-${f.pmid || f.doi?.slice(-6)}`;
    const title = [f.author, f.year ? `(${f.year})` : null, f.journal].filter(Boolean).join(" ").trim() || `PMID ${f.pmid}`;
    const meta = {
      title, authors: f.author ?? null, year: f.year ? Number(f.year) : null,
      journal: f.journal ?? null, doi: f.doi ?? null, pmid: f.pmid ?? null, sourceType: "journal",
    };
    let source = await p.researchSource.findFirst({ where: { OR: [{ slug }, f.doi ? { doi: f.doi } : { pmid: f.pmid }] }, select: { id: true, journal: true } });
    if (!source) {
      sourcesNew++;
      if (APPLY) {
        source = await p.researchSource.create({
          data: { slug: (await p.researchSource.findUnique({ where: { slug }, select: { id: true } })) ? slugify(f.author || "ref", f.year || "0", ++seq) : slug, ...meta, status: "draft", notes: `Ingested from ${(f as any)._file ?? "response"}` },
          select: { id: true, journal: true },
        });
      }
    } else if (APPLY && !source.journal && f.journal) {
      // backfill metadata onto a source that was ingested before journal parsing
      await p.researchSource.update({ where: { id: source.id }, data: meta });
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
  console.log(`  files: ${scanned} with content, ${skipped} empty/skipped`);
  console.log(`  citations parsed: ${found.length}`);
  console.log(`  matched to exercises: ${matched} | unmatched: ${unmatched}`);
  console.log(`  new sources: ${sourcesNew} | new exercise links: ${linksNew}`);
  if (misses.length) console.log(`  unmatched names (fix name or add manually): ${[...new Set(misses)].slice(0, 20).join(" · ")}`);
  console.log(`\n  Next: npx tsx scripts/resolve-sources.ts  (fills titles/DOIs/PDF links), then pnpm score`);
}

main().finally(() => p.$disconnect());
