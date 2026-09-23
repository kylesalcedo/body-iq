#!/usr/bin/env tsx
/**
 * Evidence validation for Body IQ's review queue.
 *
 * Builds one multiple-choice evidence packet per exercise and rehab goal from
 * the versioned dataset, then asks Jev to independently classify the packet.
 * Records are auto-cleared only when Jev agrees with the deterministic answer
 * and the packet has enough identifiable research. Everything else remains in
 * a compact human queue. This is evidence QA for educational content, never a
 * diagnosis or treatment recommendation, and it never mutates source data.
 *
 * Usage:
 *   pnpm evidence:validate -- --input exports/dataset/body-iq-dataset.json
 *   source ~/.jev.env && pnpm evidence:validate -- --run
 *
 * Set TYPESAFE_API_URL to a trusted relay when direct TypeSafe egress is
 * unavailable. The default is https://api.typesafe.ai/v1/systemone.
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

function arg(flag: string): string | undefined {
  const i = process.argv.indexOf(flag);
  return i < 0 ? undefined : process.argv[i + 1];
}
const INPUT = arg("--input") ?? "exports/dataset/body-iq-dataset.json";
const RUN = process.argv.includes("--run");
const LIMIT = Number(arg("--limit") ?? 0);
const CONCURRENCY = Number(arg("--concurrency") ?? 5);
const OUT = arg("--out") ?? "exports/evidence-validation";
const API_URL = process.env.TYPESAFE_API_URL ?? "https://api.typesafe.ai/v1/systemone";
const PRICE_PER_MTOK = 0.042;
// Cloudflare in front of Jev rejects default non-browser user agents (error 1010).
const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36";

type Source = {
  id: string; title: string; year: number | null; sourceType: string | null;
  doi: string | null; pmid: string | null; pmcid?: string | null;
  description?: string | null; status?: string; confidence?: number;
};
type Exercise = {
  id: string; slug: string; name: string; description: string; status: string;
  confidence: number; evidenceLevel: string | null; notes: string | null;
};
type Goal = {
  id: string; slug: string; name: string; description: string | null;
  goalType: string; status: string; confidence: number; notes: string | null;
};
type Dataset = {
  exercises: Exercise[]; goals: Goal[]; sources: Source[];
  sourceLinks: { entityType: string; exerciseId: string | null; sourceId: string; notes?: string | null }[];
  exerciseGoals: { exerciseId: string; goalId: string; relevance?: string | null; caution?: string | null }[];
};

type Verdict = "supported" | "thin" | "unsupported" | "conflicting";
type Packet = {
  kind: "exercise" | "rehab-goal"; slug: string; name: string;
  claim: string; status: string; confidence: number; evidenceLevel: string | null;
  sourceCount: number; identifiedCount: number; articleCount: number;
  recentCount: number; auditHigh: number; auditMedium: number;
  sources: Source[]; linkedExerciseCount: number;
  deterministicVerdict: Verdict; deterministicReason: string;
};

type JevResult = {
  kind: Packet["kind"]; slug: string; ok: boolean; verdict?: Verdict;
  confidence?: number; humanReviewProbability?: number; inputTokens?: number;
  latencyMs?: number; error?: string;
};

const articleLike = (s: Source) => Boolean(s.doi || s.pmid || s.pmcid || /journal|guideline|review|trial/i.test(s.sourceType ?? ""));
const identified = (s: Source) => Boolean(s.doi || s.pmid || s.pmcid);
const flags = (notes: string | null, level: "high" | "medium") => (notes?.match(new RegExp(`AUDIT\\[${level}\\]`, "g")) ?? []).length;

function classify(p: Omit<Packet, "deterministicVerdict" | "deterministicReason">): [Verdict, string] {
  if (p.auditHigh > 0 || /conflict|contradict|disput/i.test(p.sources.map(s => s.description ?? "").join(" "))) {
    return ["conflicting", "high-severity audit or explicit conflict in the linked evidence packet"];
  }
  if (p.sourceCount === 0) return ["unsupported", "no linked research sources"];
  if (p.identifiedCount < 2 || p.articleCount < 2) return ["thin", "fewer than two identifiable research articles"];
  if (p.kind === "rehab-goal" && p.linkedExerciseCount < 2) return ["thin", "fewer than two linked exercises for the rehab goal"];
  if (p.evidenceLevel === "limited" || p.evidenceLevel === "expert-opinion") return ["thin", `stored evidence level is ${p.evidenceLevel}`];
  return ["supported", "at least two identifiable research articles and no recorded conflict"];
}

function makePacket(base: Omit<Packet, "deterministicVerdict" | "deterministicReason">): Packet {
  const [deterministicVerdict, deterministicReason] = classify(base);
  return { ...base, deterministicVerdict, deterministicReason };
}

function buildPackets(ds: Dataset): Packet[] {
  const sourceById = new Map(ds.sources.map(s => [s.id, s]));
  const sourcesByExercise = new Map<string, Source[]>();
  for (const l of ds.sourceLinks) {
    if (l.entityType !== "Exercise" || !l.exerciseId) continue;
    const s = sourceById.get(l.sourceId); if (!s) continue;
    sourcesByExercise.set(l.exerciseId, [...(sourcesByExercise.get(l.exerciseId) ?? []), s]);
  }
  const nowYear = new Date().getUTCFullYear();
  const sourceStats = (sources: Source[]) => ({
    sourceCount: sources.length,
    identifiedCount: sources.filter(identified).length,
    articleCount: sources.filter(articleLike).length,
    recentCount: sources.filter(s => s.year != null && s.year >= nowYear - 10).length,
  });
  const exercises = ds.exercises.map(e => {
    const sources = sourcesByExercise.get(e.id) ?? [];
    return makePacket({
      kind: "exercise", slug: e.slug, name: e.name, claim: e.description,
      status: e.status, confidence: e.confidence, evidenceLevel: e.evidenceLevel,
      ...sourceStats(sources), auditHigh: flags(e.notes, "high"), auditMedium: flags(e.notes, "medium"),
      sources, linkedExerciseCount: 1,
    });
  });
  const exByGoal = new Map<string, string[]>();
  for (const l of ds.exerciseGoals) exByGoal.set(l.goalId, [...(exByGoal.get(l.goalId) ?? []), l.exerciseId]);
  const rehabGoals = ds.goals.filter(g => g.goalType === "rehab").map(g => {
    const exerciseIds = exByGoal.get(g.id) ?? [];
    const sourceMap = new Map<string, Source>();
    for (const id of exerciseIds) for (const s of sourcesByExercise.get(id) ?? []) sourceMap.set(s.id, s);
    const sources = [...sourceMap.values()];
    return makePacket({
      kind: "rehab-goal", slug: g.slug, name: g.name,
      claim: g.description ?? `Educational exercise evidence related to ${g.name}`,
      status: g.status, confidence: g.confidence, evidenceLevel: null,
      ...sourceStats(sources), auditHigh: flags(g.notes, "high"), auditMedium: flags(g.notes, "medium"),
      sources, linkedExerciseCount: exerciseIds.length,
    });
  });
  return [...exercises, ...rehabGoals];
}

const QUESTIONS = {
  evidence_verdict: {
    type: "choice",
    instructions: "Classify whether the supplied research packet supports this educational claim. Use only the linked article metadata and recorded audit state. Do not infer a diagnosis, treatment plan, or unlisted result.",
    criteria: {
      supported: "two or more identifiable research articles, no recorded conflict, and the claim does not outrun the evidence level",
      thin: "some relevant research exists but coverage is sparse, indirect, or lower-level",
      unsupported: "no linked research supports the claim",
      conflicting: "the linked packet or audit state records a material contradiction",
    },
  },
  human_review_needed: {
    type: "noul",
    instructions: "A human evidence reviewer should inspect this item because the best-available linked research is uncertain, conflicting, or insufficient for the educational claim.",
  },
} as const;

function state(p: Packet): string {
  const sourceLines = p.sources.slice(0, 12).map((s, i) =>
    `${i + 1}. ${s.title} | year=${s.year ?? "unknown"} | type=${s.sourceType ?? "unknown"} | PMID=${s.pmid ?? "none"} | DOI=${s.doi ?? "none"} | summary=${(s.description ?? "none").replace(/\s+/g, " ").slice(0, 240)}`
  );
  return [
    `Body IQ educational evidence packet. kind=${p.kind}`,
    `item=${p.slug} status=${p.status} confidence=${p.confidence} evidenceLevel=${p.evidenceLevel ?? "unset"}`,
    `claim=${p.claim.replace(/\s+/g, " ").slice(0, 500)}`,
    `coverage: sources=${p.sourceCount} identifiable=${p.identifiedCount} researchArticles=${p.articleCount} recent10y=${p.recentCount} linkedExercises=${p.linkedExerciseCount}`,
    `audit: high=${p.auditHigh} medium=${p.auditMedium}`,
    "linked research (metadata and stored summaries only):",
    ...(sourceLines.length ? sourceLines : ["none"]),
  ].join("\n");
}

async function callJev(p: Packet, key: string): Promise<JevResult> {
  const started = Date.now();
  try {
    const res = await fetch(API_URL, {
      method: "POST", headers: { authorization: `Bearer ${key}`, "content-type": "application/json", "user-agent": UA },
      body: JSON.stringify({ state: state(p), model: "jev-latest", questions: QUESTIONS }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${(await res.text()).slice(0, 220)}`);
    const body: any = await res.json(); const a = body.answers ?? {};
    return { kind: p.kind, slug: p.slug, ok: true, verdict: a.evidence_verdict?.choice,
      confidence: a.evidence_verdict?.confidence, humanReviewProbability: a.human_review_needed?.noul,
      inputTokens: body.usage?.input_tokens, latencyMs: Date.now() - started };
  } catch (e) {
    return { kind: p.kind, slug: p.slug, ok: false, error: String(e), latencyMs: Date.now() - started };
  }
}

async function liveRun(packets: Packet[], key: string): Promise<JevResult[]> {
  const queue = LIMIT > 0 ? packets.slice(0, LIMIT) : [...packets]; const out: JevResult[] = [];
  let done = 0;
  async function worker() { while (queue.length) { out.push(await callJev(queue.shift()!, key)); done++; if (done % 25 === 0 || !queue.length) console.log(`  ${done}/${LIMIT || packets.length}`); } }
  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, queue.length || 1) }, worker));
  return out;
}

function summary(packets: Packet[], results: JevResult[]) {
  const byKey = new Map(results.filter(r => r.ok).map(r => [`${r.kind}:${r.slug}`, r]));
  const rows = packets.map(p => {
    const j = byKey.get(`${p.kind}:${p.slug}`);
    const agrees = Boolean(j && j.verdict === p.deterministicVerdict);
    // Auto-clear only clear agreement on supported evidence. Thin, unsupported,
    // conflicting, low-confidence, or high human-review probability remain human.
    const autoValidated = agrees && j!.verdict === "supported" && (j!.confidence ?? 0) >= .75 && (j!.humanReviewProbability ?? 1) < .35;
    return { ...p, jev: j ?? null, agrees, autoValidated };
  });
  const answered = rows.filter(r => r.jev).length;
  const agreement = rows.filter(r => r.agrees).length;
  const auto = rows.filter(r => r.autoValidated).length;
  const disputed = rows.filter(r => r.jev && !r.autoValidated);
  return { rows, answered, agreement, auto, disputed };
}

async function main() {
  const ds = JSON.parse(readFileSync(INPUT, "utf8")) as Dataset;
  const packets = buildPackets(ds);
  mkdirSync(OUT, { recursive: true });
  writeFileSync(join(OUT, "packets.jsonl"), packets.map(p => JSON.stringify({ ...p, jevState: state(p), questions: QUESTIONS })).join("\n"));
  const chars = packets.reduce((n, p) => n + JSON.stringify({ state: state(p), questions: QUESTIONS }).length, 0);
  const estimatedTokens = Math.ceil(chars / 4);
  let results: JevResult[] = [];
  if (RUN) {
    const key = process.env.TYPESAFE_API_KEY; if (!key) throw new Error("--run requires TYPESAFE_API_KEY (source ~/.jev.env)");
    console.log(`Calling Jev via ${new URL(API_URL).host} for ${LIMIT || packets.length} packets...`);
    results = await liveRun(packets, key);
    writeFileSync(join(OUT, "jev-results.jsonl"), results.map(r => JSON.stringify(r)).join("\n"));
  }
  const s = summary(packets, results);
  const ok = results.filter(r => r.ok); const tokens = ok.reduce((n, r) => n + (r.inputTokens ?? 0), 0);
  const spend = {
    generatedAt: new Date().toISOString(), apiHost: new URL(API_URL).host,
    packets: packets.length, exercisePackets: packets.filter(p => p.kind === "exercise").length,
    rehabGoalPackets: packets.filter(p => p.kind === "rehab-goal").length,
    callsAttempted: results.length, callsOk: ok.length, callsFailed: results.length - ok.length,
    agreementCount: s.agreement, agreementRate: s.answered ? s.agreement / s.answered : null,
    autoValidated: s.auto, humanQueue: results.length ? s.disputed.length + packets.length - s.answered : packets.length,
    inputTokens: tokens || null, costUsd: tokens ? Number((tokens / 1e6 * PRICE_PER_MTOK).toFixed(6)) : null,
    estimatedDryRunTokens: estimatedTokens, estimatedDryRunCostUsd: Number((estimatedTokens / 1e6 * PRICE_PER_MTOK).toFixed(6)),
  };
  writeFileSync(join(OUT, "spend-and-agreement.json"), JSON.stringify(spend, null, 2));
  writeFileSync(join(OUT, "human-review.json"), JSON.stringify(s.rows.filter(r => !r.autoValidated), null, 2));
  console.log(JSON.stringify(spend, null, 2));
  if (results.some(r => !r.ok)) process.exitCode = 2;
}
main().catch(e => { console.error(e); process.exit(1); });
