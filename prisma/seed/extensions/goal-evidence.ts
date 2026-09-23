import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { prisma, logSection, logCount } from "../client";

/**
 * Condition-level evidence for rehab goals (2026-09-22).
 *
 * Articles found by `pnpm research:intake` (PubMed search + Jev vetting),
 * cross-checked by `scripts/source-crosscheck.ts` (PubMed, Europe PMC,
 * OpenAlex, Crossref; every entry is `corroborated`), and approved for linking
 * by Kyle on 2026-09-22 (iMessage phonemsg-01M35WSKWNKZNTGFR0D50R5TMX) from the
 * 18-article intake shortlist.
 *
 * Sources land as `needs_review`: approval covered linking, not a full-text
 * read. `description` is the abstract's own conclusion, verbatim from PubMed.
 * Links attach to the Goal (SourceOnEntity.goalId). Educational evidence only;
 * never a diagnosis or treatment recommendation. Idempotent.
 */

const FILE = join(__dirname, "goal-evidence-2026-09.json");

export async function seedGoalEvidenceExtension() {
  logSection("Goal evidence (Jev intake, 2026-09)");
  if (!existsSync(FILE)) { console.log("    (no goal-evidence JSON — skipping)"); return; }
  const items: any[] = JSON.parse(readFileSync(FILE, "utf8"));
  const goalBySlug = new Map((await prisma.goal.findMany({ select: { id: true, slug: true } })).map((g) => [g.slug, g.id]));

  let sources = 0, links = 0, skipped = 0;
  for (const it of items) {
    const goalId = goalBySlug.get(it.goalSlug);
    if (!goalId || it.crosscheck?.verdict !== "corroborated") { skipped++; continue; }
    const notes = `Jev intake 2026-09-22: relevance=${it.jev.relevance} (${it.jev.relevanceConfidence}), design=${it.design}, finding=${it.jev.finding}; cross-checked in ${it.crosscheck.sources.join(", ")}. Approved for linking by Kyle 2026-09-22 (iMessage phonemsg-01M35WSKWNKZNTGFR0D50R5TMX, replying to the 18-article shortlist ask); full-text review pending.`;
    const existing = await prisma.researchSource.findFirst({ where: { OR: [{ slug: it.slug }, { pmid: it.pmid }] }, select: { id: true } });
    const data = {
      title: it.title, authors: it.authors ?? null, year: it.year ?? null, journal: it.journal ?? null,
      doi: it.doi ?? null, pmid: it.pmid, pmcid: it.pmcid ?? null, fulltextUrl: it.fulltextUrl ?? null,
      url: `https://pubmed.ncbi.nlm.nih.gov/${it.pmid}/`, sourceType: it.sourceType, description: it.description,
    };
    const source = existing
      ? await prisma.researchSource.update({ where: { id: existing.id }, data, select: { id: true } })
      : await prisma.researchSource.create({ data: { slug: it.slug, ...data, status: "needs_review", confidence: 0.7, notes }, select: { id: true } });
    if (!existing) sources++;
    const link = await prisma.sourceOnEntity.findFirst({ where: { sourceId: source.id, goalId }, select: { id: true } });
    if (!link) {
      await prisma.sourceOnEntity.create({ data: { entityType: "Goal", goalId, sourceId: source.id, notes: `Condition-level evidence (${it.design})` } });
      links++;
    }
  }
  logCount("new goal-evidence sources", sources);
  logCount("new goal links", links);
  if (skipped) console.log(`    skipped ${skipped} (missing goal or not corroborated)`);
}
