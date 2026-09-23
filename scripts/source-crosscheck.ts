#!/usr/bin/env tsx
/**
 * Cross-source article verification for Body IQ.
 *
 * Before an article is integrated (or while auditing the existing corpus), look
 * it up in several independent free bibliographic sources and check that they
 * agree it is the same, real, un-retracted article:
 *
 *   PubMed E-utilities   title, year, DOI, publication types (incl. "Retracted Publication")
 *   Europe PMC           title, year, DOI, publication types, citation count, OA flag
 *   OpenAlex             title, year, DOI, is_retracted, citation count, OA status/URL
 *   Crossref             title, year, DOI registration, retraction/correction notices (updated-by)
 *   Semantic Scholar     title, year, citation count (optional; free pool is often rate-limited)
 *
 * PEDro is deliberately not queried: its fair-use terms forbid automated or
 * bulk downloading. The report includes a manual PEDro search link instead.
 *
 * Verdict per article:
 *   retracted     any source flags retraction
 *   conflict      two sources disagree on DOI, or title overlap < 0.6, or year differs by > 2 (online-first vs print)
 *   corroborated  >= 3 sources found it and all checks agree
 *   partial       fewer than 3 sources found it, no conflict
 *   not-found     no source found it
 * Only `corroborated` is eligible for integration. Nothing is written to the DB.
 *
 * Usage:
 *   tsx scripts/source-crosscheck.ts --pmids 33666347,34580864
 *   tsx scripts/source-crosscheck.ts --from exports/research-intake/shortlist.json
 *   tsx scripts/source-crosscheck.ts --corpus exports/dataset/body-iq-dataset.json
 * Output: exports/source-crosscheck/<label>.json + summary on stdout.
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

function arg(flag: string): string | undefined {
  const i = process.argv.indexOf(flag);
  return i < 0 ? undefined : process.argv[i + 1];
}
const OUT = arg("--out") ?? "exports/source-crosscheck";
const MAILTO = process.env.BODYIQ_CONTACT_EMAIL ?? "bodyiq@example.com";
const UA = `Mozilla/5.0 (compatible; body-iq-crosscheck/0.1; mailto:${MAILTO})`;
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

type Ref = { key: string; pmid?: string | null; doi?: string | null; title?: string | null; year?: number | null };
type Hit = { found: boolean; title?: string; year?: number | null; doi?: string | null; retracted?: boolean; citedBy?: number; oa?: string | null; types?: string[]; error?: string };
type Row = Ref & { sources: Record<string, Hit>; foundIn: number; titleSim: number | null; doiConsistent: boolean; yearConsistent: boolean; retracted: boolean; verdict: string; oaUrl: string | null; pedroSearch: string };

const normDoi = (d?: string | null) => d ? d.toLowerCase().replace(/^https?:\/\/(dx\.)?doi\.org\//, "").trim() : null;
const tokens = (s: string) => new Set(s.toLowerCase().replace(/<[^>]+>/g, "").replace(/[^a-z0-9 ]+/g, " ").split(/\s+/).filter(w => w.length > 2));
function sim(a: string, b: string): number {
  const A = tokens(a), B = tokens(b); if (!A.size || !B.size) return 0;
  let n = 0; for (const w of A) if (B.has(w)) n++;
  return n / Math.min(A.size, B.size); // overlap coefficient: tolerant of abbreviated stored titles
}
async function get(url: string, init?: RequestInit, tries = 3): Promise<any> {
  for (let i = 0; i < tries; i++) {
    const res = await fetch(url, { ...init, headers: { "user-agent": UA, ...(init?.headers ?? {}) } });
    if (res.ok) return res.headers.get("content-type")?.includes("json") ? res.json() : res.text();
    if (res.status === 404) return null;
    if (res.status !== 429 && res.status < 500) throw new Error(`HTTP ${res.status}`);
    await sleep(1500 * (i + 1));
  }
  throw new Error("rate limited");
}
const chunks = <T,>(xs: T[], n: number) => Array.from({ length: Math.ceil(xs.length / n) }, (_, i) => xs.slice(i * n, i * n + n));
const decode = (s: string) => s.replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/\s+/g, " ").trim();

async function pubmed(refs: Ref[]): Promise<Map<string, Hit>> {
  const out = new Map<string, Hit>();
  for (const c of chunks(refs.filter(r => r.pmid), 150)) {
    await sleep(400);
    const xml: string = await get(`https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=pubmed&retmode=xml&id=${c.map(r => r.pmid).join(",")}`);
    for (const [, a] of xml.matchAll(/<PubmedArticle>([\s\S]*?)<\/PubmedArticle>/g)) {
      const pmid = a.match(/<PMID[^>]*>(\d+)<\/PMID>/)?.[1];
      const types = [...a.matchAll(/<PublicationType[^>]*>([^<]+)</g)].map(m => m[1]);
      const y = a.match(/<PubDate>[\s\S]*?<Year>(\d{4})/)?.[1] ?? a.match(/<MedlineDate>(\d{4})/)?.[1];
      const hasNotice = /RefType="RetractionIn"/.test(a);
      if (pmid) out.set(pmid, { found: true, title: decode(a.match(/<ArticleTitle>([\s\S]*?)<\/ArticleTitle>/)?.[1] ?? ""), year: y ? Number(y) : null,
        doi: normDoi(decode(a.match(/<ArticleId IdType="doi">([^<]+)</)?.[1] ?? "") || null), types, retracted: types.includes("Retracted Publication") || hasNotice });
    }
  }
  return out;
}
async function europepmc(refs: Ref[]): Promise<Map<string, Hit>> {
  const out = new Map<string, Hit>();
  for (const c of chunks(refs.filter(r => r.pmid), 40)) {
    const q = encodeURIComponent(`(${c.map(r => `EXT_ID:${r.pmid}`).join(" OR ")}) AND SRC:MED`);
    const j = await get(`https://www.ebi.ac.uk/europepmc/webservices/rest/search?query=${q}&format=json&resultType=core&pageSize=100`);
    for (const r of j?.resultList?.result ?? []) {
      const types: string[] = r.pubTypeList?.pubType ?? [];
      out.set(r.pmid, { found: true, title: r.title, year: r.pubYear ? Number(r.pubYear) : null, doi: normDoi(r.doi), types,
        retracted: types.some(t => /retracted publication/i.test(t)), citedBy: r.citedByCount, oa: r.isOpenAccess === "Y" ? "open" : "closed" });
    }
  }
  return out;
}
async function openalex(refs: Ref[]): Promise<Map<string, Hit & { oaUrl?: string | null }>> {
  const out = new Map<string, Hit & { oaUrl?: string | null }>();
  const sel = "select=doi,title,publication_year,is_retracted,cited_by_count,open_access,ids";
  const put = (w: any) => {
    const pmid = (w.ids?.pmid ?? "").split("/").pop();
    const hit = { found: true, title: w.title, year: w.publication_year, doi: normDoi(w.doi), retracted: !!w.is_retracted, citedBy: w.cited_by_count, oa: w.open_access?.oa_status ?? null, oaUrl: w.open_access?.oa_url ?? null };
    if (pmid) out.set(`pmid:${pmid}`, hit);
    if (hit.doi) out.set(`doi:${hit.doi}`, hit);
  };
  for (const c of chunks(refs.filter(r => r.pmid), 50)) {
    const j = await get(`https://api.openalex.org/works?filter=pmid:${c.map(r => r.pmid).join("|")}&per-page=50&${sel}&mailto=${MAILTO}`);
    (j?.results ?? []).forEach(put);
  }
  for (const c of chunks(refs.filter(r => !r.pmid && r.doi), 50)) {
    const j = await get(`https://api.openalex.org/works?filter=doi:${c.map(r => normDoi(r.doi)).join("|")}&per-page=50&${sel}&mailto=${MAILTO}`);
    (j?.results ?? []).forEach(put);
  }
  return out;
}
async function crossref(doi: string): Promise<Hit> {
  const j = await get(`https://api.crossref.org/works/${encodeURIComponent(doi)}?mailto=${MAILTO}`);
  if (!j) return { found: false };
  const m = j.message; const upd: any[] = m["updated-by"] ?? [];
  return { found: true, title: m.title?.[0], year: m.issued?.["date-parts"]?.[0]?.[0] ?? null, doi: normDoi(m.DOI),
    retracted: upd.some(u => /retraction|withdrawal/i.test(u.type ?? "")), types: [m.type] };
}
async function semanticScholar(refs: Ref[]): Promise<Map<string, Hit> | { error: string }> {
  const ids = refs.map(r => r.pmid ? `PMID:${r.pmid}` : r.doi ? `DOI:${normDoi(r.doi)}` : null).filter(Boolean) as string[];
  const out = new Map<string, Hit>();
  try {
    for (const c of chunks(ids, 400)) {
      const j = await get("https://api.semanticscholar.org/graph/v1/paper/batch?fields=title,year,externalIds,citationCount", {
        method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ids: c }) }, 2);
      (j ?? []).forEach((p: any, i: number) => { if (p) out.set(c[i], { found: true, title: p.title, year: p.year, doi: normDoi(p.externalIds?.DOI), citedBy: p.citationCount }); });
    }
    return out;
  } catch (e) { return { error: String(e) }; }
}

export async function crosscheck(refs: Ref[]): Promise<{ rows: Row[]; s2Status: string }> {
  const [pm, ep, oa, s2] = await Promise.all([pubmed(refs), europepmc(refs), openalex(refs), semanticScholar(refs)]);
  const s2Status = s2 instanceof Map ? "ok" : `unavailable (${s2.error})`;
  const rows: Row[] = [];
  for (const r of refs) {
    const sources: Record<string, Hit> = {};
    sources.pubmed = (r.pmid && pm.get(r.pmid)) || { found: false };
    sources.europepmc = (r.pmid && ep.get(r.pmid)) || { found: false };
    const o = (r.pmid && oa.get(`pmid:${r.pmid}`)) || (r.doi && oa.get(`doi:${normDoi(r.doi)}`)) || null;
    sources.openalex = o ?? { found: false };
    const doi = normDoi(r.doi) ?? sources.pubmed.doi ?? sources.europepmc.doi ?? sources.openalex.doi ?? null;
    try { sources.crossref = doi ? await crossref(doi) : { found: false }; } catch (e) { sources.crossref = { found: false, error: String(e) }; }
    await sleep(120);
    if (s2 instanceof Map) sources.semanticscholar = s2.get(r.pmid ? `PMID:${r.pmid}` : `DOI:${normDoi(r.doi)}`) ?? { found: false };
    const hits = Object.values(sources).filter(h => h.found);
    const refTitle = r.title ?? sources.pubmed.title ?? hits[0]?.title ?? "";
    const sims = hits.map(h => sim(refTitle, h.title ?? ""));
    const dois = new Set(hits.map(h => h.doi).filter(Boolean));
    const years = hits.map(h => h.year).filter((y): y is number => typeof y === "number");
    const yearConsistent = !years.length || Math.max(...years) - Math.min(...years) <= 2; // online-first vs print issue can differ by 1-2 years
    const titleSim = sims.length ? Math.min(...sims) : null;
    const retracted = hits.some(h => h.retracted);
    const doiConsistent = dois.size <= 1;
    const verdict = retracted ? "retracted" : !hits.length ? "not-found"
      : (!doiConsistent || (titleSim ?? 1) < 0.6 || !yearConsistent) ? "conflict"
      : hits.length >= 3 ? "corroborated" : "partial";
    rows.push({ ...r, doi, sources, foundIn: hits.length, titleSim, doiConsistent, yearConsistent, retracted, verdict,
      oaUrl: (o as any)?.oaUrl ?? null,
      pedroSearch: `https://search.pedro.org.au/search-results?abstract_with_title=${encodeURIComponent(refTitle.slice(0, 80))}` });
  }
  return { rows, s2Status };
}

async function main() {
  let refs: Ref[] = []; let label = "adhoc";
  if (arg("--pmids")) refs = arg("--pmids")!.split(",").map(p => ({ key: p, pmid: p.trim() }));
  else if (arg("--from")) {
    label = "shortlist";
    refs = JSON.parse(readFileSync(arg("--from")!, "utf8")).map((c: any) => ({ key: `${c.target}|${c.pmid}`, pmid: c.pmid, doi: c.doi, title: c.title, year: c.year }));
  } else if (arg("--corpus")) {
    label = "corpus";
    refs = JSON.parse(readFileSync(arg("--corpus")!, "utf8")).sources.filter((s: any) => s.pmid || s.doi)
      .map((s: any) => ({ key: s.slug, pmid: s.pmid, doi: s.doi, title: s.title, year: s.year }));
  } else throw new Error("pass --pmids, --from, or --corpus");
  const { rows, s2Status } = await crosscheck(refs);
  mkdirSync(OUT, { recursive: true });
  writeFileSync(join(OUT, `${label}.json`), JSON.stringify(rows, null, 2));
  const count = (xs: string[]) => xs.reduce<Record<string, number>>((m, x) => (m[x] = (m[x] ?? 0) + 1, m), {});
  const found = Object.fromEntries(["pubmed", "europepmc", "openalex", "crossref", "semanticscholar"].map(k => [k, rows.filter(r => r.sources[k]?.found).length]));
  console.log(JSON.stringify({ label, articles: rows.length, verdicts: count(rows.map(r => r.verdict)), foundBySource: found, semanticScholar: s2Status,
    openAccessUrl: rows.filter(r => r.oaUrl).length, flagged: rows.filter(r => r.verdict !== "corroborated").map(r => ({ key: r.key, verdict: r.verdict, foundIn: r.foundIn, titleSim: r.titleSim, doiConsistent: r.doiConsistent, yearConsistent: r.yearConsistent })) }, null, 2));
}
if (process.argv[1]?.includes("source-crosscheck")) main().catch(e => { console.error(e); process.exit(1); });
