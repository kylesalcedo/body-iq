#!/usr/bin/env tsx
/**
 * Jev audit passes over the Body IQ dataset (menu items 3-5, 2026-09-22).
 *
 *   --pass overclaim   Does each exercise's stored evidenceLevel match its linked
 *                      research? Deterministic rule vs Jev: matches / overstated /
 *                      understated.
 *   --pass freshness   For each pre-2016 source with a PMID, PubMed "similar
 *                      articles" (free, deterministic) proposes newer systematic
 *                      reviews / meta-analyses / guidelines; Jev says whether the
 *                      newer article is a consistent update, supersedes or
 *                      contradicts, or is a different topic.
 *   --pass cues        Wulf attentional-focus label for every coaching cue.
 *                      Jev vs the stored label (where set) and vs the regex
 *                      heuristic in cue-quality.ts.
 *
 * Every pass is report-only: no DB writes, no label or status changes. Humans
 * act on the flagged lists. Educational content QA, never clinical advice.
 *
 * Usage:
 *   tsx scripts/jev-audits.ts --pass overclaim                 # dry run: payloads + estimate
 *   tsx scripts/jev-audits.ts --pass overclaim --run           # live (TYPESAFE_API_KEY, TYPESAFE_API_URL)
 *   tsx scripts/jev-audits.ts --pass overclaim --answers a.jsonl
 * Output: exports/jev-audits/<pass>/{payloads.jsonl,results.json,report.json}
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

function arg(flag: string): string | undefined { const i = process.argv.indexOf(flag); return i < 0 ? undefined : process.argv[i + 1]; }
const PASS = arg("--pass") ?? "overclaim";
const INPUT = arg("--input") ?? "exports/dataset/body-iq-dataset.json";
const OUT = join(arg("--out") ?? "exports/jev-audits", PASS);
const RUN = process.argv.includes("--run");
const ANSWERS = arg("--answers");
const API_URL = process.env.TYPESAFE_API_URL ?? "https://api.typesafe.ai/v1/systemone";
const PRICE_PER_MTOK = 0.042;
const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36";
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

type Payload = { key: string; state: string; questions: Record<string, unknown>; baseline?: string | null; meta?: Record<string, unknown> };
type Answer = { key: string; ok: boolean; answers?: Record<string, any>; inputTokens?: number; latencyMs?: number; error?: string };
const ds: any = JSON.parse(readFileSync(INPUT, "utf8"));
const srcById = new Map<string, any>(ds.sources.map((s: any) => [s.id, s]));
const identified = (s: any) => !!(s.doi || s.pmid || s.pmcid);

// ── overclaim ────────────────────────────────────────────────────────────────
const OVERCLAIM_Q = {
  evidence_label_fit: {
    type: "choice",
    instructions: "Does the record's stored evidence level fit the linked research listed? Judge only from the listed sources. Rubric: strong = two or more identifiable research articles including a systematic review, guideline, or trial; moderate = at least one identifiable research article; limited = only textbooks, indirect, or no research; expert-opinion = clinical reasoning only.",
    criteria: {
      matches: "the stored level fits the listed evidence",
      overstated: "the stored level claims more support than the listed evidence gives",
      understated: "the listed evidence supports a higher level than stored",
    },
  },
  human_review_needed: { type: "noul", instructions: "A human should check this record's evidence label." },
} as const;
function overclaimBaseline(level: string | null, srcs: any[]): string {
  const ids = srcs.filter(s => identified(s) && s.sourceType !== "textbook").length;
  const rank: Record<string, number> = { "expert-opinion": 0, limited: 1, moderate: 2, strong: 3 };
  const supported = ids >= 2 ? 3 : ids === 1 ? 2 : 1;
  const stored = rank[level ?? "limited"] ?? 1;
  return stored > supported ? "overstated" : stored < supported - 1 ? "understated" : "matches";
}
function overclaimPayloads(): Payload[] {
  const byEx = new Map<string, any[]>();
  for (const l of ds.sourceLinks) if (l.exerciseId && srcById.has(l.sourceId)) byEx.set(l.exerciseId, [...(byEx.get(l.exerciseId) ?? []), srcById.get(l.sourceId)]);
  return ds.exercises.map((e: any) => {
    const srcs = byEx.get(e.id) ?? [];
    const lines = srcs.slice(0, 10).map((s, i) => `${i + 1}. ${s.title} | ${s.year ?? "n.d."} | type=${s.sourceType ?? "unknown"} | PMID=${s.pmid ?? "none"} | DOI=${s.doi ?? "none"}`);
    return {
      key: e.slug, questions: OVERCLAIM_Q, baseline: overclaimBaseline(e.evidenceLevel, srcs), meta: { evidenceLevel: e.evidenceLevel, sources: srcs.length },
      state: [`Body IQ exercise record (educational content QA, not clinical advice).`, `exercise=${e.name}`, `stored evidenceLevel=${e.evidenceLevel ?? "unset"}`,
        `rationale=${(e.rationale ?? e.description ?? "").replace(/\s+/g, " ").slice(0, 300)}`, `linked sources (${srcs.length}):`, ...(lines.length ? lines : ["none"])].join("\n"),
    };
  });
}

// ── freshness ────────────────────────────────────────────────────────────────
const FRESH_Q = {
  relation: {
    type: "choice",
    instructions: "Compare the newer article with the older source it may update. Judge only from the titles and the newer abstract.",
    criteria: {
      "consistent-update": "same topic; newer synthesis broadly agrees or extends it",
      "supersedes-or-contradicts": "same topic; newer synthesis replaces, narrows, or contradicts the older finding",
      "different-topic": "not the same question",
    },
  },
  worth_citing: { type: "noul", instructions: "The newer article should be added alongside or instead of the older source for educational content on this topic." },
} as const;
async function ncbi(path: string): Promise<string> {
  for (let i = 0; i < 3; i++) {
    await sleep(400 * (i + 1));
    const r = await fetch(`https://eutils.ncbi.nlm.nih.gov/entrez/eutils/${path}`, { headers: { "user-agent": UA } });
    if (r.ok) return r.text();
  }
  throw new Error("NCBI failed");
}
const decode = (s: string) => s.replace(/<[^>]+>/g, "").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&amp;/g, "&").replace(/\s+/g, " ").trim();
async function freshnessPayloads(): Promise<Payload[]> {
  const cache = join(OUT, "stage1.json");
  if (existsSync(cache)) return JSON.parse(readFileSync(cache, "utf8"));
  const old = ds.sources.filter((s: any) => s.pmid && s.year && s.year < 2016);
  const corpus = new Set(ds.sources.map((s: any) => s.pmid).filter(Boolean));
  const neighbors = new Map<string, string[]>();
  for (let i = 0; i < old.length; i += 60) {
    const c = old.slice(i, i + 60);
    const j = JSON.parse(await ncbi(`elink.fcgi?dbfrom=pubmed&db=pubmed&linkname=pubmed_pubmed&retmode=json&${c.map((s: any) => `id=${s.pmid}`).join("&")}`));
    for (const ls of j.linksets ?? []) neighbors.set(String(ls.ids[0]), (ls.linksetdbs?.[0]?.links ?? []).slice(0, 100).map(String));
  }
  const allIds = [...new Set([...neighbors.values()].flat())].filter(id => !corpus.has(id));
  const meta = new Map<string, any>();
  for (let i = 0; i < allIds.length; i += 200) {
    const xml = await ncbi(`efetch.fcgi?db=pubmed&retmode=xml&id=${allIds.slice(i, i + 200).join(",")}`);
    for (const [, a] of xml.matchAll(/<PubmedArticle>([\s\S]*?)<\/PubmedArticle>/g)) {
      const pmid = a.match(/<PMID[^>]*>(\d+)</)?.[1]; if (!pmid) continue;
      const types = [...a.matchAll(/<PublicationType[^>]*>([^<]+)</g)].map(m => m[1]);
      const y = Number(a.match(/<PubDate>[\s\S]*?<Year>(\d{4})/)?.[1] ?? a.match(/<MedlineDate>(\d{4})/)?.[1] ?? 0);
      const abs = [...a.matchAll(/<AbstractText([^>]*)>([\s\S]*?)<\/AbstractText>/g)].map(m => decode(m[2])).join(" ");
      meta.set(pmid, { pmid, year: y, types, title: decode(a.match(/<ArticleTitle>([\s\S]*?)<\/ArticleTitle>/)?.[1] ?? ""), abstract: abs, doi: a.match(/<ArticleId IdType="doi">([^<]+)</)?.[1] ?? null });
    }
  }
  const strong = (t: string[]) => t.some(x => /^(Systematic Review|Meta-Analysis|Practice Guideline|Guideline)$/.test(x));
  const out: Payload[] = [];
  for (const s of old) {
    const picks = (neighbors.get(String(s.pmid)) ?? []).map(id => meta.get(id)).filter(m => m && m.year >= 2016 && strong(m.types)).slice(0, 3);
    for (const m of picks) out.push({
      key: `${s.slug}|${m.pmid}`, questions: FRESH_Q, meta: { oldSlug: s.slug, oldYear: s.year, newPmid: m.pmid, newYear: m.year, newTitle: m.title, newDoi: m.doi, newTypes: m.types },
      state: [`Body IQ citation freshness check (educational content, not clinical advice).`, `older source: ${s.title} (${s.year}; PMID ${s.pmid})`,
        `older source summary: ${(s.description ?? "").replace(/\s+/g, " ").slice(0, 300)}`, `newer article: ${m.title} (${m.year}; PMID ${m.pmid}; ${m.types.join(", ")})`,
        `newer abstract: ${m.abstract.slice(0, 1800) || "none"}`].join("\n"),
    });
  }
  mkdirSync(OUT, { recursive: true });
  writeFileSync(cache, JSON.stringify(out));
  writeFileSync(join(OUT, "stage1-summary.json"), JSON.stringify({ oldSourcesWithPmid: old.length, withNeighbors: neighbors.size, newerStrongCandidates: out.length, oldSourcesWithCandidate: new Set(out.map(p => p.meta!.oldSlug)).size }, null, 2));
  return out;
}

// ── cues ─────────────────────────────────────────────────────────────────────
const CUE_Q = {
  focus: {
    type: "choice",
    instructions: "Classify this coaching cue's attentional focus (Wulf).",
    criteria: {
      internal: "directs attention to the body, a muscle, or a body movement",
      external: "directs attention to an object, surface, target, or movement outcome in the environment",
      tactile: "relies on touch or a hand placed on the body",
      imagery: "uses metaphor or imagined scenes",
      instruction: "a setup, dosing, or equipment instruction rather than a cue",
    },
  },
} as const;
const RX: Record<string, RegExp[]> = {
  instruction: [/^\s*(anchor|position|set up|place (the|your|a)|rest (the|your)|cycle (all|through)|progress (when|to|load)|hold .* for \d+ (seconds?|minutes?|reps?)|repeat \d+|perform \d+)/i, /\bequipment\b/i, /\bevery 1[-–]2 weeks\b/i],
  imagery: [/\b(as if|imagine|like (a|you)|think of|pretend)\b/i, /\bstring (pulling|attached)/i],
  external: [/\bpush\s+(the|away|toward)\b/i, /\bdrive\b/i, /\bpress\s+(the|into|toward|down|up)\b/i, /\breach (toward|for|to|across)\b/i, /\bpull (the|toward|the bar|the band)\b/i, /\btoward (the wall|the ceiling|the floor|the bar|the bench)\b/i, /\bagainst the (wall|floor|ceiling|band|table|surface)\b/i, /\binto the (wall|floor|ball|table|surface)\b/i, /\btoward your\b/i],
};
function regexFocus(text: string, cueType: string | null): string {
  if (cueType === "tactile") return "tactile";
  if (cueType === "imagery") return "imagery";
  for (const k of ["instruction", "imagery", "external"]) if (RX[k].some(re => re.test(text))) return k;
  return "internal"; // cue-quality.ts default (internal patterns or unmatched)
}
function cuePayloads(): Payload[] {
  const exById = new Map<string, any>(ds.exercises.map((e: any) => [e.id, e]));
  return ds.cues.map((c: any) => ({
    key: c.id, questions: CUE_Q, baseline: c.focus ?? null,
    meta: { exercise: exById.get(c.exerciseId)?.slug, stored: c.focus ?? null, regex: regexFocus(c.text, c.cueType ?? null), cueType: c.cueType ?? null, text: c.text },
    state: [`Coaching cue from an educational exercise library.`, `exercise=${exById.get(c.exerciseId)?.name ?? "unknown"}`, `delivery=${c.cueType ?? "unset"}`, `cue="${c.text}"`].join("\n"),
  }));
}

// ── run + report ─────────────────────────────────────────────────────────────
async function callJev(p: Payload, key: string): Promise<Answer> {
  const t0 = Date.now();
  try {
    const r = await fetch(API_URL, { method: "POST", headers: { authorization: `Bearer ${key}`, "content-type": "application/json", "user-agent": UA },
      body: JSON.stringify({ state: p.state, model: "jev-latest", questions: p.questions }) });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const b: any = await r.json();
    return { key: p.key, ok: true, answers: b.answers, inputTokens: b.usage?.input_tokens, latencyMs: Date.now() - t0 };
  } catch (e) { return { key: p.key, ok: false, error: String(e) }; }
}
const count = (xs: (string | null | undefined)[]) => xs.reduce<Record<string, number>>((m, x) => (m[x ?? "none"] = (m[x ?? "none"] ?? 0) + 1, m), {});
const rate = (n: number, d: number) => d ? Number((n / d).toFixed(4)) : null;

async function main() {
  mkdirSync(OUT, { recursive: true });
  const payloads = PASS === "overclaim" ? overclaimPayloads() : PASS === "freshness" ? await freshnessPayloads() : PASS === "cues" ? cuePayloads() : (() => { throw new Error(`unknown pass ${PASS}`); })();
  writeFileSync(join(OUT, "payloads.jsonl"), payloads.map(p => JSON.stringify({ key: p.key, state: p.state, questions: p.questions })).join("\n") + "\n");
  let answers: Answer[] = [];
  if (ANSWERS) answers = readFileSync(ANSWERS, "utf8").split("\n").filter(Boolean).map(l => JSON.parse(l));
  else if (RUN) {
    const key = process.env.TYPESAFE_API_KEY; if (!key) throw new Error("--run requires TYPESAFE_API_KEY");
    const q = [...payloads]; await Promise.all(Array.from({ length: 6 }, async () => { while (q.length) answers.push(await callJev(q.shift()!, key)); }));
    writeFileSync(join(OUT, "answers.jsonl"), answers.map(a => JSON.stringify(a)).join("\n") + "\n");
  }
  const byKey = new Map(answers.filter(a => a.ok).map(a => [a.key, a]));
  const ok = [...byKey.values()]; const tokens = ok.reduce((n, a) => n + (a.inputTokens ?? 0), 0);
  const est = Math.ceil(payloads.reduce((n, p) => n + p.state.length + JSON.stringify(p.questions).length, 0) / 4);
  const base = { pass: PASS, generatedAt: new Date().toISOString(), records: payloads.length, jevCalls: answers.length, jevOk: ok.length, jevFailed: answers.length - ok.length,
    inputTokens: tokens || null, costUsd: tokens ? Number((tokens / 1e6 * PRICE_PER_MTOK).toFixed(6)) : null, estimatedTokens: est, estimatedCostUsd: Number((est / 1e6 * PRICE_PER_MTOK).toFixed(6)) };
  let report: any = base; let results: any[] = [];

  if (PASS === "overclaim") {
    results = payloads.map(p => { const a = byKey.get(p.key)?.answers; return { slug: p.key, ...p.meta, deterministic: p.baseline, jev: a?.evidence_label_fit?.choice ?? null, jevConfidence: a?.evidence_label_fit?.confidence ?? null, reviewP: a?.human_review_needed?.noul ?? null }; });
    const j = results.filter(r => r.jev);
    const bothOver = j.filter(r => r.jev === "overstated" && r.deterministic === "overstated");
    report = { ...base, deterministic: count(results.map(r => r.deterministic)), jev: count(j.map(r => r.jev)), agreement: rate(j.filter(r => r.jev === r.deterministic).length, j.length),
      overstatedBoth: bothOver.length, overstatedBothByLevel: count(bothOver.map(r => r.evidenceLevel)), disagreements: j.filter(r => r.jev !== r.deterministic).length };
  } else if (PASS === "freshness") {
    results = payloads.map(p => { const a = byKey.get(p.key)?.answers; return { key: p.key, ...p.meta, relation: a?.relation?.choice ?? null, relationConfidence: a?.relation?.confidence ?? null, worthCiting: a?.worth_citing?.noul ?? null }; });
    const j = results.filter(r => r.relation);
    const flagged = j.filter(r => r.relation !== "different-topic" && (r.relationConfidence ?? 0) >= 0.75 && (r.worthCiting ?? 0) >= 0.5);
    report = { ...base, ...(existsSync(join(OUT, "stage1-summary.json")) ? JSON.parse(readFileSync(join(OUT, "stage1-summary.json"), "utf8")) : {}),
      relation: count(j.map(r => r.relation)), refreshCandidates: flagged.length, oldSourcesWithRefresh: new Set(flagged.map(r => r.oldSlug)).size,
      supersedesOrContradicts: flagged.filter(r => r.relation === "supersedes-or-contradicts").length };
    writeFileSync(join(OUT, "refresh-candidates.json"), JSON.stringify(flagged.sort((a, b) => (b.worthCiting ?? 0) - (a.worthCiting ?? 0)), null, 2));
  } else {
    results = payloads.map(p => { const a = byKey.get(p.key)?.answers; return { id: p.key, ...p.meta, jev: a?.focus?.choice ?? null, jevConfidence: a?.focus?.confidence ?? null }; });
    const j = results.filter(r => r.jev);
    const labeled = j.filter(r => r.stored);
    const unlabeled = j.filter(r => !r.stored);
    report = { ...base, storedLabels: count(results.map(r => r.stored)), jev: count(j.map(r => r.jev)),
      agreementWithStored: rate(labeled.filter(r => r.jev === r.stored).length, labeled.length), labeledCompared: labeled.length,
      agreementWithRegex: rate(j.filter(r => r.jev === r.regex).length, j.length),
      unlabeled: unlabeled.length, unlabeledJev: count(unlabeled.map(r => r.jev)),
      unlabeledHighConfidence: unlabeled.filter(r => (r.jevConfidence ?? 0) >= 0.8).length,
      unlabeledJevRegexAgree: unlabeled.filter(r => r.jev === r.regex).length };
  }
  writeFileSync(join(OUT, "results.json"), JSON.stringify(results, null, 2));
  writeFileSync(join(OUT, "report.json"), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
}
main().catch(e => { console.error(e); process.exit(1); });
