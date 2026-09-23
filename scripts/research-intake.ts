#!/usr/bin/env tsx
/**
 * Jev-assisted research-article intake for Body IQ.
 *
 * Evidence validation (scripts/evidence-validation.ts) checks what is already
 * linked. This script grows the evidence base: it finds NEW candidate articles
 * for thin/unsupported records, vets them, and writes a proposal queue a human
 * approves before anything is ingested.
 *
 *   Stage 1 (deterministic, free): query PubMed E-utilities for each target
 *   (rehab goals = condition-level educational evidence; exercises = exercise-
 *   level evidence). Real metadata only: PMID, DOI, title, journal, year,
 *   PubMed publication types, and the abstract's own conclusion sentences as
 *   the summary (verbatim, never generated). Study design is classified from
 *   PubMed publication types. Articles already in the corpus are marked.
 *
 *   Stage 2 (Jev, advisory): per candidate, Jev answers four multiple-choice
 *   questions from the abstract - relevance to the educational claim, study
 *   design, direction of finding, and a human-review probability.
 *
 *   Gate (strict): a candidate is PROPOSED only when Jev says `direct` with
 *   confidence >= 0.75, Jev's design agrees with the PubMed publication type,
 *   the design is a systematic review / meta-analysis, guideline, or RCT, the
 *   article has a PMID, it is not already in the corpus, and human-review
 *   probability < 0.35. Everything else stays in intake-review.json.
 *   shortlist.json orders the curator's reading list: candidates passing every
 *   check except the review probability (Jev rates most intake reads as worth
 *   a human look, which is the intended default before linking).
 *
 * Nothing is applied. Proposals for exercises are written in the format
 * scripts/ingest-citations.ts parses; a human copies approved entries into
 * research/citations/ and runs `pnpm ingest:citations -- --apply`. Goal-level
 * proposals are listed separately: once approved, a human attaches them with a
 * SourceOnEntity row of entityType "Goal" and goalId set (added 2026-09-22). This is evidence curation for educational content, never a
 * diagnosis or a treatment recommendation.
 *
 * Usage:
 *   pnpm research:intake -- --targets goals                     # stage 1 + payloads, no Jev calls
 *   pnpm research:intake -- --targets exercises --limit 20
 *   source ~/.jev.env && pnpm research:intake -- --targets goals --run
 *   pnpm research:intake -- --targets goals --answers <answers.jsonl>   # gate pre-computed Jev answers
 *
 * Flags: --engines pubmed,europepmc,openalex (default pubmed)
 *        --input <dataset.json> --targets goals|exercises|all --goal <slug>
 *        --per-target N (default 5) --years N (default 10) --limit N
 *        --only-weak (exercise targets: skip records with 2+ identifiable sources)
 *        --out <dir> (default exports/research-intake)
 * TYPESAFE_API_URL selects the Jev endpoint (direct API or relay).
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

function arg(flag: string): string | undefined {
  const i = process.argv.indexOf(flag);
  return i < 0 ? undefined : process.argv[i + 1];
}
const INPUT = arg("--input") ?? "exports/dataset/body-iq-dataset.json";
const TARGETS = arg("--targets") ?? "goals";
const ONLY_GOAL = arg("--goal");
const PER_TARGET = Number(arg("--per-target") ?? 5);
const YEARS = Number(arg("--years") ?? 10);
const LIMIT = Number(arg("--limit") ?? 0);
const ONLY_WEAK = process.argv.includes("--only-weak");
const ENGINES = (arg("--engines") ?? "pubmed").split(",");
const RUN = process.argv.includes("--run");
const ANSWERS = arg("--answers");
const OUT = arg("--out") ?? "exports/research-intake";
const API_URL = process.env.TYPESAFE_API_URL ?? "https://api.typesafe.ai/v1/systemone";
const PRICE_PER_MTOK = 0.042;
// Cloudflare in front of Jev rejects default non-browser user agents (error 1010).
const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36";
const EUTILS = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils";
const NCBI_DELAY_MS = 380; // NCBI allows 3 req/s without an API key

type DS = {
  exercises: { id: string; slug: string; name: string; description: string }[];
  goals: { id: string; slug: string; name: string; goalType: string; description: string | null }[];
  sources: { id: string; doi: string | null; pmid: string | null }[];
  sourceLinks: { entityType: string; exerciseId?: string | null; sourceId: string }[];
  exerciseGoals: { exerciseId: string; goalId: string }[];
};
type Target = { kind: "rehab-goal" | "exercise"; slug: string; name: string; claim: string; query: string; terms: string[]; linkedExercises?: string[] };
type Design = "systematic-review-or-meta-analysis" | "guideline" | "rct" | "observational" | "other";
type Candidate = {
  target: string; targetKind: Target["kind"]; targetName: string; claim: string;
  pmid: string; doi: string | null; title: string; journal: string; year: number | null;
  firstAuthor: string | null; publicationTypes: string[]; pubmedDesign: Design;
  summary: string; abstract: string; inCorpus: boolean; foundBy?: string[];
};
type Answer = {
  key: string; ok: boolean; relevance?: string; relevanceConfidence?: number; design?: string;
  finding?: string; humanReviewProbability?: number; inputTokens?: number; latencyMs?: number; error?: string;
};

// Condition vocabulary for PubMed. Kept explicit so queries are reviewable.
const GOAL_TERMS: Record<string, string[]> = {
  "achilles-tendinopathy": ["achilles tendinopathy", "achilles tendinitis"],
  "carpal-tunnel": ["carpal tunnel syndrome"],
  "hamstring-strain": ["hamstring strain", "hamstring injury", "hamstring injuries"],
  "hip-osteoarthritis": ["hip osteoarthritis"],
  "knee-osteoarthritis": ["knee osteoarthritis"],
  "lateral-ankle-sprain": ["ankle sprain", "lateral ankle sprain", "chronic ankle instability"],
  "low-back-pain": ["low back pain"],
  "neck-pain": ["neck pain"],
  "patellofemoral-pain": ["patellofemoral pain"],
  "plantar-fasciitis": ["plantar fasciitis", "plantar heel pain"],
  "rotator-cuff-tendinopathy": ["rotator cuff tendinopathy", "rotator cuff related shoulder pain"],
  "subacromial-pain": ["subacromial pain", "subacromial impingement"],
  "tennis-elbow": ["lateral epicondylitis", "lateral epicondylalgia", "tennis elbow"],
};
const DESIGN_FILTER = `("systematic review"[pt] OR "meta-analysis"[pt] OR "randomized controlled trial"[pt] OR "practice guideline"[pt] OR "guideline"[pt])`;
const tiab = (terms: string[]) => "(" + terms.map(t => `"${t}"[tiab]`).join(" OR ") + ")";

function targets(ds: DS): Target[] {
  const out: Target[] = [];
  const exById = new Map(ds.exercises.map(e => [e.id, e]));
  if (TARGETS === "goals" || TARGETS === "all") {
    for (const g of ds.goals.filter(g => g.goalType === "rehab" && (!ONLY_GOAL || g.slug === ONLY_GOAL))) {
      const terms = GOAL_TERMS[g.slug] ?? [g.name.split(/[/(]/)[0].trim().toLowerCase()];
      out.push({
        kind: "rehab-goal", slug: g.slug, name: g.name,
        claim: g.description ?? `Exercise-based education for ${g.name}`,
        terms,
        query: `${tiab(terms)} AND (exercise[tiab] OR "exercise therapy"[mh] OR rehabilitation[tiab]) AND ${DESIGN_FILTER}`,
        linkedExercises: ds.exerciseGoals.filter(l => l.goalId === g.id).map(l => exById.get(l.exerciseId)?.name).filter(Boolean) as string[],
      });
    }
  }
  if (TARGETS === "exercises" || TARGETS === "all") {
    const identified = new Map<string, number>();
    const srcById = new Map(ds.sources.map(s => [s.id, s]));
    for (const l of ds.sourceLinks) {
      if (l.entityType !== "Exercise" || !l.exerciseId) continue;
      const s = srcById.get(l.sourceId);
      if (s && (s.doi || s.pmid)) identified.set(l.exerciseId, (identified.get(l.exerciseId) ?? 0) + 1);
    }
    for (const e of ds.exercises) {
      if (ONLY_WEAK && (identified.get(e.id) ?? 0) >= 2) continue;
      const name = e.name.replace(/\([^)]*\)/g, "").trim();
      out.push({
        kind: "exercise", slug: e.slug, name: e.name, claim: e.description, terms: [name],
        query: `"${name}"[tiab] AND (exercise[tiab] OR electromyography[mh] OR electromyography[tiab] OR training[tiab])`,
      });
    }
  }
  return LIMIT > 0 ? out.slice(0, LIMIT) : out;
}

// ── PubMed ───────────────────────────────────────────────────────────────────
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));
async function ncbi(path: string): Promise<string> {
  for (let attempt = 0; attempt < 3; attempt++) {
    await sleep(NCBI_DELAY_MS * (attempt + 1));
    const res = await fetch(`${EUTILS}/${path}`, { headers: { "user-agent": UA } });
    if (res.ok) return res.text();
    if (res.status !== 429) throw new Error(`NCBI HTTP ${res.status}`);
  }
  throw new Error("NCBI rate limited");
}
const decode = (s: string) => s.replace(/<[^>]+>/g, "").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim();
const all = (xml: string, re: RegExp) => [...xml.matchAll(re)].map(m => m);

function designFromTypes(types: string[]): Design {
  const t = types.map(x => x.toLowerCase());
  if (t.some(x => x === "systematic review" || x === "meta-analysis")) return "systematic-review-or-meta-analysis";
  if (t.some(x => x === "practice guideline" || x === "guideline")) return "guideline";
  if (t.some(x => x === "randomized controlled trial")) return "rct";
  if (t.some(x => /observational|cohort|comparative study|clinical trial/.test(x))) return "observational";
  return "other";
}

function parseArticles(xml: string): Omit<Candidate, "target" | "targetKind" | "targetName" | "claim" | "inCorpus">[] {
  return all(xml, /<PubmedArticle>([\s\S]*?)<\/PubmedArticle>/g).map(([, a]) => {
    const pmid = a.match(/<PMID[^>]*>(\d+)<\/PMID>/)?.[1] ?? "";
    const doi = a.match(/<ArticleId IdType="doi">([^<]+)<\/ArticleId>/)?.[1] ?? a.match(/<ELocationID EIdType="doi"[^>]*>([^<]+)</)?.[1] ?? null;
    const title = decode(a.match(/<ArticleTitle>([\s\S]*?)<\/ArticleTitle>/)?.[1] ?? "");
    const journal = decode(a.match(/<ISOAbbreviation>([\s\S]*?)<\/ISOAbbreviation>/)?.[1] ?? a.match(/<Title>([\s\S]*?)<\/Title>/)?.[1] ?? "");
    const yearStr = a.match(/<PubDate>[\s\S]*?<Year>(\d{4})<\/Year>/)?.[1] ?? a.match(/<MedlineDate>(\d{4})/)?.[1];
    const firstAuthor = decode(a.match(/<Author[^>]*>\s*<LastName>([\s\S]*?)<\/LastName>/)?.[1] ?? "") || null;
    const publicationTypes = all(a, /<PublicationType[^>]*>([\s\S]*?)<\/PublicationType>/g).map(m => decode(m[1]));
    const parts = all(a, /<AbstractText([^>]*)>([\s\S]*?)<\/AbstractText>/g).map(m => ({ label: (m[1].match(/Label="([^"]+)"/)?.[1] ?? "").toUpperCase(), text: decode(m[2]) }));
    const abstract = parts.map(p => (p.label ? `${p.label}: ` : "") + p.text).join(" ");
    const concl = parts.filter(p => /CONCLUSION|INTERPRETATION|IMPLICATION/.test(p.label)).map(p => p.text).join(" ");
    const sentences = abstract.split(/(?<=\.)\s+(?=[A-Z])/);
    const summary = (concl || sentences.slice(-2).join(" ")).slice(0, 600);
    return { pmid, doi, title, journal, year: yearStr ? Number(yearStr) : null, firstAuthor, publicationTypes, pubmedDesign: designFromTypes(publicationTypes), summary, abstract };
  }).filter(c => c.pmid && c.title);
}

type Art = ReturnType<typeof parseArticles>[number];
function designFromTitle(t: string): Design {
  if (/systematic review|meta-analy|umbrella review|cochrane/i.test(t)) return "systematic-review-or-meta-analysis";
  if (/guideline|consensus|recommendation/i.test(t)) return "guideline";
  if (/randomi[sz]ed/i.test(t)) return "rct";
  return "other";
}
async function europePmc(t: Target, fromYear: number): Promise<Art[]> {
  const kind = t.kind === "rehab-goal" ? ` AND (exercise OR rehabilitation) AND (PUB_TYPE:"Systematic Review" OR PUB_TYPE:"Meta-Analysis" OR PUB_TYPE:"Randomized Controlled Trial" OR PUB_TYPE:"Practice Guideline")` : ` AND (exercise OR electromyography OR training)`;
  const q = `(${t.terms.map(x => `TITLE_ABS:"${x}"`).join(" OR ")})${kind} AND PUB_YEAR:[${fromYear} TO 3000]`;
  const r = await fetch(`https://www.ebi.ac.uk/europepmc/webservices/rest/search?query=${encodeURIComponent(q)}&format=json&resultType=core&pageSize=${PER_TARGET}`, { headers: { "user-agent": UA } });
  if (!r.ok) return [];
  const j: any = await r.json();
  return (j.resultList?.result ?? []).filter((x: any) => x.pmid && x.title).map((x: any) => {
    const types: string[] = x.pubTypeList?.pubType ?? []; const abstract = decode(x.abstractText ?? "");
    const concl = abstract.match(/CONCLUSIONS?:?\s*(.*)$/i)?.[1] ?? abstract.split(/(?<=\.)\s+(?=[A-Z])/).slice(-2).join(" ");
    return { pmid: x.pmid, doi: x.doi ?? null, title: decode(x.title), journal: x.journalInfo?.journal?.isoabbreviation ?? x.journalInfo?.journal?.title ?? "", year: Number(x.pubYear) || null,
      firstAuthor: (x.authorString ?? "").split(" ")[0] || null, publicationTypes: types, pubmedDesign: designFromTypes(types), summary: concl.slice(0, 600), abstract };
  });
}
async function openAlex(t: Target, fromYear: number): Promise<Art[]> {
  const q = `${t.terms[0]} exercise${t.kind === "rehab-goal" ? " rehabilitation" : ""}`;
  const r = await fetch(`https://api.openalex.org/works?search=${encodeURIComponent(q)}&filter=from_publication_date:${fromYear}-01-01,has_pmid:true&per-page=${PER_TARGET}&select=doi,title,publication_year,ids,authorships,primary_location,abstract_inverted_index&mailto=bodyiq@example.com`, { headers: { "user-agent": UA } });
  if (!r.ok) return [];
  const j: any = await r.json();
  return (j.results ?? []).map((w: any) => {
    const inv = w.abstract_inverted_index ?? {}; const pos: string[] = [];
    for (const [word, idx] of Object.entries(inv)) for (const i of idx as number[]) pos[i] = word;
    const abstract = pos.filter(Boolean).join(" ");
    return { pmid: (w.ids?.pmid ?? "").split("/").pop(), doi: (w.doi ?? "").replace("https://doi.org/", "") || null, title: decode(w.title ?? ""),
      journal: w.primary_location?.source?.display_name ?? "", year: w.publication_year ?? null, firstAuthor: w.authorships?.[0]?.author?.display_name?.split(" ").pop() ?? null,
      publicationTypes: [], pubmedDesign: designFromTitle(w.title ?? ""), summary: abstract.split(/(?<=\.)\s+(?=[A-Z])/).slice(-2).join(" ").slice(0, 600), abstract };
  }).filter((a: Art) => a.pmid && a.title);
}

async function stage1(ds: DS, ts: Target[]): Promise<{ candidates: Candidate[]; zeroHit: string[] }> {
  const corpusPmid = new Set(ds.sources.map(s => s.pmid).filter(Boolean) as string[]);
  const corpusDoi = new Set(ds.sources.map(s => s.doi?.toLowerCase()).filter(Boolean) as string[]);
  const candidates: Candidate[] = []; const zeroHit: string[] = [];
  const fromYear = new Date().getUTCFullYear() - YEARS;
  for (const t of ts) {
    const found = new Map<string, Candidate>();
    const add = (a: Art, engine: string) => {
      const prev = found.get(a.pmid);
      if (prev) { prev.foundBy = [...new Set([...(prev.foundBy ?? []), engine])]; return; }
      found.set(a.pmid, { target: t.slug, targetKind: t.kind, targetName: t.name, claim: t.claim, ...a, foundBy: [engine],
        inCorpus: corpusPmid.has(a.pmid) || (!!a.doi && corpusDoi.has(a.doi.toLowerCase())) });
    };
    if (ENGINES.includes("pubmed")) {
      const term = encodeURIComponent(`(${t.query}) AND ("${fromYear}"[dp] : "3000"[dp])`);
      const search = JSON.parse(await ncbi(`esearch.fcgi?db=pubmed&retmode=json&sort=relevance&retmax=${PER_TARGET}&term=${term}`));
      const ids: string[] = search.esearchresult?.idlist ?? [];
      if (ids.length) for (const a of parseArticles(await ncbi(`efetch.fcgi?db=pubmed&retmode=xml&id=${ids.join(",")}`))) add(a, "pubmed");
    }
    // Europe PMC and OpenAlex widen discovery. Their hits keep PubMed's PMID as the
    // join key; OpenAlex design comes from the title only, so the design gate
    // (Jev must agree) stays strict for those.
    if (ENGINES.includes("europepmc")) for (const a of await europePmc(t, fromYear)) add(a, "europepmc");
    if (ENGINES.includes("openalex")) for (const a of await openAlex(t, fromYear)) add(a, "openalex");
    if (!found.size) zeroHit.push(t.slug);
    candidates.push(...found.values());
    process.stdout.write(".");
  }
  process.stdout.write("\n");
  return { candidates, zeroHit };
}

// ── Jev ──────────────────────────────────────────────────────────────────────
export const QUESTIONS = {
  relevance: {
    type: "choice",
    instructions: "How directly does this article's abstract bear on the educational claim? Judge only from the supplied title and abstract.",
    criteria: {
      direct: "studies exercise or rehabilitation for the named condition or exercise itself",
      indirect: "related population, intervention, or outcome, but not the claim itself",
      "off-topic": "does not address the claim",
    },
  },
  study_design: {
    type: "choice",
    instructions: "The article's study design, from the abstract.",
    criteria: {
      "systematic-review-or-meta-analysis": "pools or systematically reviews multiple studies",
      guideline: "clinical practice guideline or consensus statement",
      rct: "a single randomized controlled trial",
      observational: "cohort, case-control, cross-sectional, or non-randomized trial",
      other: "narrative review, protocol, case report, lab or EMG study, or unclear",
    },
  },
  finding: {
    type: "choice",
    instructions: "What the abstract reports about exercise or the named exercise. Do not infer beyond the abstract.",
    criteria: {
      "supports-exercise": "reports benefit or supports use for education on this topic",
      "mixed-or-uncertain": "mixed, low-certainty, or no clear difference",
      "no-benefit-or-harm": "reports no benefit or reports harm",
      "not-reported": "abstract does not report an exercise outcome",
    },
  },
  intake_review_needed: {
    type: "noul",
    instructions: "A human evidence curator should read this article before it is linked, because relevance, design, or findings are uncertain from the abstract.",
  },
} as const;

export const candKey = (c: Candidate) => `${c.target}|${c.pmid}`;
export function jevState(c: Candidate): string {
  return [
    `Body IQ research-article intake for educational exercise content (not diagnosis or treatment advice).`,
    `target kind=${c.targetKind} item=${c.targetName}`,
    `educational claim=${c.claim.replace(/\s+/g, " ").slice(0, 400)}`,
    `candidate article: PMID=${c.pmid} | ${c.title} | ${c.journal} ${c.year ?? ""}`,
    `abstract=${c.abstract.slice(0, 2200) || "none"}`,
  ].join("\n");
}

async function callJev(c: Candidate, key: string): Promise<Answer> {
  const t0 = Date.now();
  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { authorization: `Bearer ${key}`, "content-type": "application/json", "user-agent": UA },
      body: JSON.stringify({ state: jevState(c), model: "jev-latest", questions: QUESTIONS }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`);
    const body: any = await res.json(); const a = body.answers ?? {};
    return { key: candKey(c), ok: true, relevance: a.relevance?.choice, relevanceConfidence: a.relevance?.confidence,
      design: a.study_design?.choice, finding: a.finding?.choice, humanReviewProbability: a.intake_review_needed?.noul,
      inputTokens: body.usage?.input_tokens, latencyMs: Date.now() - t0 };
  } catch (e) {
    return { key: candKey(c), ok: false, error: String(e), latencyMs: Date.now() - t0 };
  }
}

const STRONG: Design[] = ["systematic-review-or-meta-analysis", "guideline", "rct"];
function gate(c: Candidate, a?: Answer): { proposed: boolean; reason: string } {
  if (c.inCorpus) return { proposed: false, reason: "already in corpus" };
  if (!a?.ok) return { proposed: false, reason: "no Jev answer" };
  if (a.relevance !== "direct") return { proposed: false, reason: `relevance=${a.relevance}` };
  if ((a.relevanceConfidence ?? 0) < 0.75) return { proposed: false, reason: "relevance confidence < 0.75" };
  if (a.design !== c.pubmedDesign) return { proposed: false, reason: `design disagreement (PubMed ${c.pubmedDesign}, Jev ${a.design})` };
  if (!STRONG.includes(c.pubmedDesign)) return { proposed: false, reason: `design ${c.pubmedDesign} below intake bar` };
  if ((a.humanReviewProbability ?? 1) >= 0.35) return { proposed: false, reason: "human-review probability >= 0.35" };
  return { proposed: true, reason: "direct, strong design, designs agree, low review probability" };
}

function citationLine(c: Candidate): string {
  return `${c.firstAuthor ?? "Unknown"} et al., ${c.year ?? "n.d."}, ${c.journal}, PMID ${c.pmid}${c.doi ? `, DOI ${c.doi}` : ""}`;
}

async function main() {
  const ds: DS = JSON.parse(readFileSync(INPUT, "utf8"));
  const ts = targets(ds);
  mkdirSync(OUT, { recursive: true });
  const cachePath = join(OUT, `candidates-${TARGETS}${ONLY_GOAL ? "-" + ONLY_GOAL : ""}${ENGINES.join("+") === "pubmed" ? "" : "-" + ENGINES.join("+")}.json`);
  let stage: { candidates: Candidate[]; zeroHit: string[] };
  if (existsSync(cachePath) && !process.argv.includes("--refresh")) stage = JSON.parse(readFileSync(cachePath, "utf8"));
  else { stage = await stage1(ds, ts); writeFileSync(cachePath, JSON.stringify(stage, null, 2)); }
  const { candidates, zeroHit } = stage;
  const fresh = candidates.filter(c => !c.inCorpus);
  writeFileSync(join(OUT, "jev-payloads.jsonl"), fresh.map(c => JSON.stringify({ key: candKey(c), state: jevState(c) })).join("\n") + "\n");

  let answers: Answer[] = [];
  if (ANSWERS) answers = readFileSync(ANSWERS, "utf8").split("\n").filter(Boolean).map(l => JSON.parse(l));
  else if (RUN) {
    const key = process.env.TYPESAFE_API_KEY; if (!key) throw new Error("--run requires TYPESAFE_API_KEY (source ~/.jev.env)");
    const queue = [...fresh];
    await Promise.all(Array.from({ length: 4 }, async () => { while (queue.length) answers.push(await callJev(queue.shift()!, key)); }));
    writeFileSync(join(OUT, "jev-answers.jsonl"), answers.map(a => JSON.stringify(a)).join("\n") + "\n");
  }
  const byKey = new Map(answers.map(a => [a.key, a]));
  const rows = candidates.map(c => ({ ...c, abstract: undefined, jev: byKey.get(candKey(c)) ?? null, ...gate(c, byKey.get(candKey(c))) }));
  const proposed = rows.filter(r => r.proposed);
  // Shortlist: every proposal check except the human-review probability. Still
  // human-approved; this only orders the curator's reading list.
  const shortlist = rows.filter(r => !r.proposed && !r.inCorpus && r.jev?.ok && r.jev.relevance === "direct"
    && (r.jev.relevanceConfidence ?? 0) >= 0.75 && r.jev.design === r.pubmedDesign && STRONG.includes(r.pubmedDesign))
    .sort((a, b) => (a.jev!.humanReviewProbability ?? 1) - (b.jev!.humanReviewProbability ?? 1));
  writeFileSync(join(OUT, "shortlist.json"), JSON.stringify(shortlist, null, 2));
  writeFileSync(join(OUT, "intake-review.json"), JSON.stringify(rows.filter(r => !r.proposed), null, 2));
  writeFileSync(join(OUT, "proposed.json"), JSON.stringify(proposed, null, 2));

  // Human-approval file. Exercise sections parse with ingest-citations.ts.
  const md: string[] = ["# Proposed citations (Jev intake gate) - HUMAN APPROVAL REQUIRED", "",
    "Educational evidence curation only. Review each abstract, then copy approved exercise sections into research/citations/ and run `pnpm ingest:citations -- --apply`.", ""];
  for (const kind of ["exercise", "rehab-goal"] as const) {
    const group = proposed.filter(r => r.targetKind === kind);
    if (!group.length) continue;
    md.push(kind === "exercise" ? "## Exercise-level (ingest-citations compatible)" : "## Condition-level (rehab goals - attach approved entries as SourceOnEntity entityType Goal)", "");
    for (const name of [...new Set(group.map(r => r.targetName))]) {
      md.push(`### ${name}`);
      for (const r of group.filter(r => r.targetName === name)) md.push(`- ${citationLine(r)}`, `  - ${r.title} [${r.pubmedDesign}; Jev finding: ${r.jev?.finding}]`, `  - Abstract conclusion: ${r.summary}`);
      md.push("");
    }
  }
  writeFileSync(join(OUT, "proposed-citations.md"), md.join("\n"));

  const inScope = new Set(fresh.map(candKey));
  answers = answers.filter(a => inScope.has(a.key));
  const ok = answers.filter(a => a.ok); const tokens = ok.reduce((n, a) => n + (a.inputTokens ?? 0), 0);
  const estTokens = Math.ceil(fresh.reduce((n, c) => n + jevState(c).length + 1400, 0) / 4);
  const judged = rows.filter(r => r.jev?.ok);
  const designAgree = judged.filter(r => r.jev!.design === r.pubmedDesign).length;
  const count = (xs: (string | undefined)[]) => xs.reduce<Record<string, number>>((m, x) => (m[x ?? "none"] = (m[x ?? "none"] ?? 0) + 1, m), {});
  const report = {
    generatedAt: new Date().toISOString(), apiHost: new URL(API_URL).host, targets: ts.length, zeroHitTargets: zeroHit,
    engines: ENGINES, foundByEngine: count(candidates.flatMap(c => c.foundBy ?? ["pubmed"])), onlyOutsidePubmed: candidates.filter(c => c.foundBy && !c.foundBy.includes("pubmed")).length,
    candidates: candidates.length, alreadyInCorpus: candidates.length - fresh.length, newCandidates: fresh.length,
    pubmedDesigns: count(candidates.map(c => c.pubmedDesign)),
    jevCalls: answers.length, jevOk: ok.length, jevFailed: answers.length - ok.length,
    jevRelevance: count(ok.map(a => a.relevance)), jevFinding: count(ok.map(a => a.finding)),
    designAgreement: judged.length ? Number((designAgree / judged.length).toFixed(4)) : null,
    proposed: proposed.length, shortlist: shortlist.length, shortlistTargets: new Set(shortlist.map(r => r.target)).size,
    proposedByTarget: count(proposed.map(r => r.target)),
    targetsWithProposal: new Set(proposed.map(r => r.target)).size,
    humanQueue: rows.length - proposed.length,
    inputTokens: tokens || null, costUsd: tokens ? Number((tokens / 1e6 * PRICE_PER_MTOK).toFixed(6)) : null,
    estimatedTokens: estTokens, estimatedCostUsd: Number((estTokens / 1e6 * PRICE_PER_MTOK).toFixed(6)),
  };
  writeFileSync(join(OUT, "intake-report.json"), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
}

main().catch(e => { console.error(e); process.exit(1); });
