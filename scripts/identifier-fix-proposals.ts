#!/usr/bin/env tsx
/**
 * Propose corrected identifiers for corpus sources whose stored PMID/DOI
 * resolves to a different article (verdict `conflict` in
 * exports/source-crosscheck/corpus.json).
 *
 * For each flagged source, search the STORED title (plus first author and year)
 * in PubMed, Europe PMC, and OpenAlex, score candidates by title overlap, first-
 * author match, and year, then cross-check the best candidate with
 * source-crosscheck. REPORT ONLY: nothing in the seed or DB changes. A human
 * confirms each proposal and edits prisma/seed/sources.ts.
 *
 * Usage: tsx scripts/identifier-fix-proposals.ts [--input exports/source-crosscheck/corpus.json]
 * Output: exports/identifier-fixes/proposals.json + docs-ready table on stdout.
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { crosscheck } from "./source-crosscheck";

const INPUT = process.argv.includes("--input") ? process.argv[process.argv.indexOf("--input") + 1] : "exports/source-crosscheck/corpus.json";
const DATASET = "exports/dataset/body-iq-dataset.json";
const UA = "Mozilla/5.0 (compatible; body-iq-idfix/0.1; mailto:bodyiq@example.com)";
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));
const tokens = (s: string) => new Set(s.toLowerCase().replace(/<[^>]+>/g, "").replace(/[^a-z0-9 ]+/g, " ").split(/\s+/).filter(w => w.length > 2));
const overlap = (a: string, b: string) => { const A = tokens(a), B = tokens(b); if (!A.size || !B.size) return 0; let n = 0; for (const w of A) if (B.has(w)) n++; return n / Math.min(A.size, B.size); };
const decode = (s: string) => s.replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&#x2026;/g, "…").replace(/\s+/g, " ").trim();
const getJson = async (u: string) => { const r = await fetch(u, { headers: { "user-agent": UA } }); return r.ok ? r.json() : null; };

type Cand = { engine: string; pmid: string | null; doi: string | null; title: string; year: number | null; firstAuthor: string | null };

async function search(title: string, author: string | null, year: number | null): Promise<Cand[]> {
  const words = [...tokens(title)].slice(0, 10).join(" ");
  const out: Cand[] = [];
  // PubMed: title words + first author
  await sleep(400);
  const term = encodeURIComponent(`(${words})${author ? ` AND ${author}[au]` : ""}`);
  const s = await getJson(`https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&retmode=json&retmax=5&term=${term}`);
  const ids: string[] = s?.esearchresult?.idlist ?? [];
  if (ids.length) {
    await sleep(400);
    const sum = await getJson(`https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&retmode=json&id=${ids.join(",")}`);
    for (const id of ids) { const d = sum?.result?.[id]; if (!d) continue;
      out.push({ engine: "pubmed", pmid: id, doi: (d.articleids ?? []).find((a: any) => a.idtype === "doi")?.value ?? null, title: decode(d.title ?? ""), year: Number((d.pubdate ?? "").slice(0, 4)) || null, firstAuthor: d.authors?.[0]?.name?.split(" ")[0] ?? null }); }
  }
  // Europe PMC
  const eq = encodeURIComponent(`TITLE:(${words})${author ? ` AND AUTH:"${author}"` : ""}`);
  const e = await getJson(`https://www.ebi.ac.uk/europepmc/webservices/rest/search?query=${eq}&format=json&pageSize=5`);
  for (const r of e?.resultList?.result ?? []) out.push({ engine: "europepmc", pmid: r.pmid ?? null, doi: r.doi ?? null, title: decode(r.title ?? ""), year: Number(r.pubYear) || null, firstAuthor: (r.authorString ?? "").split(" ")[0] || null });
  // OpenAlex
  const o = await getJson(`https://api.openalex.org/works?search=${encodeURIComponent(words)}&per-page=5&select=doi,title,publication_year,ids,authorships&mailto=bodyiq@example.com`);
  for (const w of o?.results ?? []) out.push({ engine: "openalex", pmid: (w.ids?.pmid ?? "").split("/").pop() || null, doi: (w.doi ?? "").replace("https://doi.org/", "") || null, title: decode(w.title ?? ""), year: w.publication_year ?? null, firstAuthor: w.authorships?.[0]?.author?.display_name?.split(" ").pop() ?? null });
  // Letters, replies, and errata echo the original title; never propose them.
  return out.filter(c => !/(-|—|:)\s*(reply|in reply)\b|^(re|reply|comment on|erratum|correction)\b|\b(erratum|corrigendum)\b/i.test(c.title));
}

async function main() {
  const rows: any[] = JSON.parse(readFileSync(INPUT, "utf8")).filter((r: any) => r.verdict === "conflict");
  const ds: any = JSON.parse(readFileSync(DATASET, "utf8"));
  const bySlug = new Map<string, any>(ds.sources.map((s: any) => [s.slug, s]));
  const proposals: any[] = [];
  for (const r of rows) {
    const src = bySlug.get(r.key);
    const author = (src?.authors ?? "").split(/[ ,]/)[0] || r.key.split("-")[0];
    const cands = await search(src?.title ?? r.title, author, src?.year ?? r.year);
    const scored = cands.map(c => ({ ...c, titleOverlap: Number(overlap(src?.title ?? r.title, c.title).toFixed(2)),
      authorMatch: !!c.firstAuthor && c.firstAuthor.toLowerCase().startsWith(author.toLowerCase().slice(0, 4)),
      yearMatch: !!c.year && !!src?.year && Math.abs(c.year - src.year) <= 1 }))
      .map(c => ({ ...c, score: c.titleOverlap + (c.authorMatch ? 0.5 : 0) + (c.yearMatch ? 0.3 : 0) }))
      .sort((a, b) => b.score - a.score);
    // merge engines agreeing on the same article
    const best = scored[0];
    const agreeing = best ? new Set(scored.filter(c => (best.pmid && c.pmid === best.pmid) || (best.doi && c.doi?.toLowerCase() === best.doi.toLowerCase())).map(c => c.engine)) : new Set<string>();
    const pmid = best?.pmid ?? scored.find(c => c.doi && best?.doi && c.doi.toLowerCase() === best.doi.toLowerCase() && c.pmid)?.pmid ?? null;
    const same = !!best && ((pmid && pmid === src?.pmid) || (best.doi && src?.doi && best.doi.toLowerCase() === src.doi.toLowerCase()));
    const strength = !best ? "none" : same ? "stored-id-is-best-match" : best.titleOverlap >= 0.8 && best.authorMatch && best.yearMatch && agreeing.size >= 2 ? "strong" : best.titleOverlap >= 0.6 && (best.authorMatch || best.yearMatch) ? "possible" : "weak";
    proposals.push({ slug: r.key, storedTitle: src?.title, storedAuthors: src?.authors, storedYear: src?.year, storedPmid: src?.pmid ?? null, storedDoi: src?.doi ?? null,
      storedResolvesTo: r.sources?.pubmed?.title ?? r.sources?.openalex?.title ?? null,
      proposed: best ? { pmid, doi: best.doi, title: best.title, year: best.year, firstAuthor: best.firstAuthor, titleOverlap: best.titleOverlap, authorMatch: best.authorMatch, yearMatch: best.yearMatch, engines: [...agreeing] } : null,
      strength });
  }
  const toCheck = proposals.filter(p => p.proposed && p.strength !== "stored-id-is-best-match" && (p.proposed.pmid || p.proposed.doi));
  const { rows: cc } = await crosscheck(toCheck.map(p => ({ key: p.slug, pmid: p.proposed.pmid, doi: p.proposed.doi, title: p.proposed.title, year: p.proposed.year })));
  for (const c of cc) { const p = proposals.find(x => x.slug === c.key); p.proposedCrosscheck = { verdict: c.verdict, foundIn: c.foundIn }; }
  mkdirSync("exports/identifier-fixes", { recursive: true });
  writeFileSync("exports/identifier-fixes/proposals.json", JSON.stringify(proposals, null, 2));
  const count = proposals.reduce<Record<string, number>>((m, p) => (m[p.strength] = (m[p.strength] ?? 0) + 1, m), {});
  console.log(JSON.stringify({ flagged: rows.length, strength: count }, null, 2));
  for (const p of proposals) console.log(`| ${p.slug} | ${p.storedPmid ?? p.storedDoi ?? "-"} | ${p.proposed?.pmid ?? "-"} | ${p.proposed?.doi ?? "-"} | ${p.strength} | ${p.proposedCrosscheck?.verdict ?? "-"} | ${(p.proposed?.title ?? "").slice(0, 70)} |`);
}
main().catch(e => { console.error(e); process.exit(1); });
