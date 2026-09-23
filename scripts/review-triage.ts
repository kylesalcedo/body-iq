#!/usr/bin/env tsx
/**
 * Review triage — ranks which records most deserve human review, AFTER the
 * deterministic validators have their say.
 *
 * Two stages:
 *
 *   Stage 1 (deterministic, free, repeatable): re-computes the four
 *   score-exercises.ts validators (evidence / coherence / completeness /
 *   rigor) plus the cue-quality audit against a dataset export, and derives
 *   triage signals: conflicting evidence, weak cue/source match,
 *   suspiciously confident entries, completeness gaps.
 *
 *   Stage 2 (Jev, advisory): sends each record's NUMERIC/CATEGORICAL state to
 *   Jev (TypeSafe System One) in one batched call per record and gets back a
 *   calibrated review priority, a primary-concern pick, and a
 *   research-gap-first probability. Jev only ever orders the review queue:
 *   it never decides clinical truth, never adds or removes a citation, and
 *   never changes a record's status. Humans review; Jev just sorts.
 *
 * Input is the Postgres-free dataset export (pnpm export:dataset, or the
 * release asset), so the whole pass runs in CI or on a laptop with no DB.
 *
 * Usage:
 *   tsx scripts/review-triage.ts --input exports/dataset/body-iq-dataset.json [--top 25]
 *   tsx scripts/review-triage.ts --input ... --run          # live Jev pass (needs TYPESAFE_API_KEY)
 *   tsx scripts/review-triage.ts --input ... --run --limit 10   # partial live pass
 *
 * Default (no --run) is a dry run: stage 1 + Jev payloads + cost estimate,
 * zero network calls. --run writes jev-answers.jsonl and a spend log so the
 * exact measured cost of a full pass is on record.
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

// ── Args ─────────────────────────────────────────────────────────────────────
function argVal(flag: string): string | undefined {
  const i = process.argv.indexOf(flag);
  return i >= 0 ? process.argv[i + 1] : undefined;
}
const INPUT = argVal("--input") ?? "exports/dataset/body-iq-dataset.json";
const RUN = process.argv.includes("--run");
const LIMIT = Number(argVal("--limit") || 0);
const TOP = Number(argVal("--top") || 25);
const CONCURRENCY = 5; // matches the mill's replay setting; p50 0.17s there
const OUT_DIR = "exports/review-triage";
const PRICE_PER_MTOK = 0.042; // $ per 1M input tokens, verified on typesafe.ai launch post
const MODEL = "jev-latest";

// ── Dataset types (subset of the export we read) ─────────────────────────────
type Ex = {
  id: string; slug: string; name: string; description: string;
  status: string; confidence: number; notes: string | null;
  evidenceLevel: string | null; dosing: string | null; emgNotes: string | null;
  difficulty: string | null; bodyPosition: string | null;
  startPosition?: string | null; endPosition?: string | null;
  provenance: string | null; category?: string | null;
};
type Dataset = {
  exercises: Ex[];
  cues: { exerciseId: string; text: string; cueType: string | null; focus: string | null; citation: string | null }[];
  sources: { id: string; slug: string; sourceType: string | null; year: number | null; doi: string | null; pmid: string | null }[];
  sourceLinks: { entityType: string; exerciseId: string | null; sourceId: string }[];
  exerciseMuscles: { exerciseId: string; muscleId: string; role: string }[];
  exerciseMovements: { exerciseId: string; movementId: string }[];
  movementMuscles: { movementId: string; muscleId: string; role: string }[];
  muscles: { id: string; slug: string }[];
  movements: { id: string; slug: string }[];
  regressions: { exerciseId: string }[];
  progressions: { exerciseId: string }[];
  exerciseFunctionalTasks: { exerciseId: string }[];
  exerciseGoals: { exerciseId: string }[];
};

// ── Ported validators (faithful to scripts/score-exercises.ts) ───────────────
const EVIDENCE_TIER: Record<string, number> = { strong: 10, moderate: 7, limited: 4, "expert-opinion": 2 };
const clamp = (n: number, max: number) => Math.max(0, Math.min(max, n));
type Dim = { score: number; max: number; notes: string[] };

function scoreEvidence(srcCount: number, evidenceLevel: string | null, dosing: string | null, emgNotes: string | null): Dim {
  const n: string[] = [];
  let s = 0;
  s += clamp(srcCount * 2.5, 10);
  if (srcCount === 0) n.push("no linked sources");
  s += (EVIDENCE_TIER[evidenceLevel ?? ""] ?? 0) * 1.2;
  if (!evidenceLevel) n.push("no evidenceLevel set");
  if (dosing) s += 5; else n.push("no dosing");
  if (emgNotes) s += 3; else n.push("no EMG notes");
  return { score: clamp(Math.round(s), 30), max: 30, notes: n };
}

function scoreCoherence(input: {
  slug: string; bodyPosition: string | null; roles: string[];
  primarySlugs: string[]; lengtheningSlugs: string[];
  movementCount: number; movementMoverSlugs: Set<string>;
}): Dim {
  const n: string[] = [];
  let s = 30;
  const { slug, roles, primarySlugs, lengtheningSlugs, movementCount, movementMoverSlugs, bodyPosition } = input;
  const isStretchOrMobility = /stretch|glide|mobiliz|breathing|balance|stance|tandem|walk|gait|propriocept|carry|eye|vestibul/.test(slug);
  if (primarySlugs.length === 0 && !isStretchOrMobility) { s -= 7; n.push("no primary mover on a non-stretch exercise"); }
  if (movementCount === 0) { s -= 6; n.push("no linked movements"); }
  const primaryConfirmed = primarySlugs.filter((p) => movementMoverSlugs.has(p)).length;
  if (primarySlugs.length > 0 && movementMoverSlugs.size > 0 && primaryConfirmed === 0) {
    s -= 7; n.push("no primary muscle is a known mover of the linked movements");
  }
  const primarySet = new Set(primarySlugs);
  const contradiction = lengtheningSlugs.filter((l) => primarySet.has(l)).length;
  if (contradiction) { s -= 5; n.push(`${contradiction} muscle(s) marked both primary and lengthening`); }
  if (roles.length >= 3 && roles.every((r) => r === "stabilizer")) { s -= 4; n.push("every muscle is a stabilizer"); }
  if (!bodyPosition) { s -= 1; n.push("no bodyPosition"); }
  return { score: clamp(Math.round(s), 30), max: 30, notes: n };
}

function scoreCompleteness(input: {
  cueCount: number; regressionCount: number; progressionCount: number;
  hasPositions: boolean; difficulty: string | null; description: string;
}): Dim {
  const n: string[] = [];
  let s = 0;
  const { cueCount, regressionCount, progressionCount, hasPositions, difficulty, description } = input;
  if (cueCount >= 3) s += 6; else { s += cueCount * 2; n.push(`only ${cueCount} cues`); }
  if (regressionCount >= 2) s += 5; else { s += regressionCount * 2; n.push(`${regressionCount} regressions`); }
  if (progressionCount >= 2) s += 5; else { s += progressionCount * 2; n.push(`${progressionCount} progressions`); }
  if (hasPositions) s += 4; else n.push("missing start/end position");
  if (difficulty) s += 2; else n.push("no difficulty");
  if (description && description.length > 60) s += 3; else n.push("thin description");
  return { score: clamp(Math.round(s), 25), max: 25, notes: n };
}

function scoreRigor(status: string, reviewedBy: string | null | undefined, notes: string | null): Dim {
  const n: string[] = [];
  const statusPts: Record<string, number> = { draft: 3, needs_review: 7, reviewed: 12, verified: 15, disputed: 1 };
  let s = statusPts[status] ?? 0;
  if (reviewedBy) s += 2;
  const high = (notes?.match(/AUDIT\[high\]/g) || []).length;
  const med = (notes?.match(/AUDIT\[medium\]/g) || []).length;
  if (high) { s -= 5 * high; n.push(`${high} unresolved high-severity audit flag(s)`); }
  if (med) { s -= 2 * med; n.push(`${med} unresolved medium audit flag(s)`); }
  return { score: clamp(Math.round(s), 15), max: 15, notes: n };
}

// ── Ported cue audit (faithful to scripts/cue-quality.ts) ────────────────────
type FocusType = "internal" | "external" | "tactile" | "imagery" | "instruction";
const INTERNAL_PATTERNS = [
  /\bsqueeze\b/i, /\bengage\b/i, /\btighten\b/i, /\bactivate\b/i, /\bcontract\b/i,
  /\bfeel (your|the)\b/i,
  /\byour (glute|abs|core|muscle|hip|shoulder|neck|chin|elbow|wrist|ankle|knee|back|spine|pelvis|scap)/i,
  /\btuck your\b/i, /\bbreathe (in|out|normally)\b/i,
];
const EXTERNAL_PATTERNS = [
  /\bpush\s+(the|away|toward)\b/i, /\bdrive\b/i, /\bpress\s+(the|into|toward|down|up)\b/i,
  /\breach (toward|for|to|across)\b/i, /\bpull (the|toward|the bar|the band)\b/i,
  /\btoward (the wall|the ceiling|the floor|the bar|the bench)\b/i,
  /\bagainst the (wall|floor|ceiling|band|table|surface)\b/i,
  /\binto the (wall|floor|ball|table|surface)\b/i, /\btoward your\b/i,
];
const IMAGERY_PATTERNS = [/\b(as if|imagine|like (a|you)|think of|pretend)\b/i, /\bstring (pulling|attached)/i];
const INSTRUCTION_PATTERNS = [
  /^\s*(anchor|position|set up|place (the|your|a)|rest (the|your)|cycle (all|through)|progress (when|to|load)|hold .* for \d+ (seconds?|minutes?|reps?)|repeat \d+|perform \d+)/i,
  /\bequipment\b/i, /\bevery 1[-–]2 weeks\b/i,
];
const STORED_FOCUS = new Set(["internal", "external", "tactile", "imagery"]);
function classifyCue(text: string, cueType: string | null): FocusType {
  if (cueType === "tactile") return "tactile";
  if (cueType === "imagery") return "imagery";
  if (INSTRUCTION_PATTERNS.some((re) => re.test(text))) return "instruction";
  if (IMAGERY_PATTERNS.some((re) => re.test(text))) return "imagery";
  if (EXTERNAL_PATTERNS.some((re) => re.test(text))) return "external";
  if (INTERNAL_PATTERNS.some((re) => re.test(text))) return "internal";
  return "internal";
}

// ── Feature extraction ───────────────────────────────────────────────────────
type Features = {
  slug: string; name: string; status: string; confidence: number;
  provenance: string | null; evidenceLevel: string | null; category: string | null;
  composite: number; dims: { evidence: Dim; coherence: Dim; completeness: Dim; rigor: Dim };
  srcCount: number; srcTypes: Record<string, number>; srcIdentified: number;
  cueCount: number; cueFocus: Record<FocusType, number>; cueProblems: string[]; citedCueCount: number;
  counts: { regressions: number; progressions: number; movements: number; functionalTasks: number; goals: number };
  auditHigh: number; auditMed: number;
  signals: string[]; // triage signal flags
  heuristicPriority: number;
};

function buildFeatures(ds: Dataset): Features[] {
  const muscleSlug = new Map(ds.muscles.map((m) => [m.id, m.slug]));
  const srcById = new Map(ds.sources.map((s) => [s.id, s]));
  const linksByEx = new Map<string, string[]>();
  for (const l of ds.sourceLinks) {
    if (l.entityType !== "Exercise" || !l.exerciseId) continue;
    linksByEx.set(l.exerciseId, [...(linksByEx.get(l.exerciseId) ?? []), l.sourceId]);
  }
  const cuesByEx = new Map<string, Dataset["cues"]>();
  for (const c of ds.cues) cuesByEx.set(c.exerciseId, [...(cuesByEx.get(c.exerciseId) ?? []), c]);
  const emByEx = new Map<string, { muscleId: string; role: string }[]>();
  for (const em of ds.exerciseMuscles) emByEx.set(em.exerciseId, [...(emByEx.get(em.exerciseId) ?? []), em]);
  const movsByEx = new Map<string, string[]>();
  for (const em of ds.exerciseMovements) movsByEx.set(em.exerciseId, [...(movsByEx.get(em.exerciseId) ?? []), em.movementId]);
  const moversByMov = new Map<string, Set<string>>();
  for (const mm of ds.movementMuscles) {
    if (mm.role === "primary" || mm.role === "secondary" || mm.role === "synergist") {
      const slug = muscleSlug.get(mm.muscleId);
      if (!slug) continue;
      if (!moversByMov.has(mm.movementId)) moversByMov.set(mm.movementId, new Set());
      moversByMov.get(mm.movementId)!.add(slug);
    }
  }
  const count = <T extends { exerciseId: string }>(rows: T[]) => {
    const m = new Map<string, number>();
    for (const r of rows) m.set(r.exerciseId, (m.get(r.exerciseId) ?? 0) + 1);
    return m;
  };
  const regCount = count(ds.regressions);
  const progCount = count(ds.progressions);
  const ftCount = count(ds.exerciseFunctionalTasks);
  const goalCount = count(ds.exerciseGoals);

  return ds.exercises.map((ex) => {
    const srcIds = linksByEx.get(ex.id) ?? [];
    const srcs = srcIds.map((id) => srcById.get(id)).filter(Boolean) as Dataset["sources"];
    const srcTypes: Record<string, number> = {};
    for (const s of srcs) srcTypes[s.sourceType ?? "unknown"] = (srcTypes[s.sourceType ?? "unknown"] ?? 0) + 1;
    const srcIdentified = srcs.filter((s) => s.doi || s.pmid).length;

    const exCues = cuesByEx.get(ex.id) ?? [];
    const cueFocus: Record<FocusType, number> = { internal: 0, external: 0, tactile: 0, imagery: 0, instruction: 0 };
    for (const c of exCues) {
      const f = c.focus && STORED_FOCUS.has(c.focus) ? (c.focus as FocusType) : classifyCue(c.text, c.cueType);
      cueFocus[f] += 1;
    }
    const cueProblems: string[] = [];
    if (exCues.length === 0) cueProblems.push("no cues at all");
    else {
      if (cueFocus.external === 0) cueProblems.push("0 external-focus cues");
      if (cueFocus.internal > cueFocus.external + cueFocus.imagery + cueFocus.tactile) cueProblems.push("internal-focus dominant");
      if (cueFocus.tactile === 0 && cueFocus.imagery === 0) cueProblems.push("no tactile or imagery cue");
      if (cueFocus.instruction >= 2) cueProblems.push(`${cueFocus.instruction} setup instructions disguised as cues`);
      if (exCues.length < 3) cueProblems.push(`only ${exCues.length} cues`);
      if (exCues.length > 6) cueProblems.push(`${exCues.length} cues (over-cueing)`);
    }
    const citedCueCount = exCues.filter((c) => c.citation).length;

    const muscles = emByEx.get(ex.id) ?? [];
    const roles = muscles.map((m) => m.role);
    const primarySlugs = muscles.filter((m) => m.role === "primary").map((m) => muscleSlug.get(m.muscleId)!).filter(Boolean);
    const lengtheningSlugs = muscles.filter((m) => m.role === "lengthening").map((m) => muscleSlug.get(m.muscleId)!).filter(Boolean);
    const movIds = movsByEx.get(ex.id) ?? [];
    const movementMoverSlugs = new Set<string>();
    for (const mv of movIds) for (const s of moversByMov.get(mv) ?? []) movementMoverSlugs.add(s);

    const evidence = scoreEvidence(srcs.length, ex.evidenceLevel, ex.dosing, ex.emgNotes);
    const coherence = scoreCoherence({
      slug: ex.slug, bodyPosition: ex.bodyPosition ?? null, roles,
      primarySlugs, movementCount: movIds.length, movementMoverSlugs, lengtheningSlugs,
    });
    const completeness = scoreCompleteness({
      cueCount: exCues.length,
      regressionCount: regCount.get(ex.id) ?? 0,
      progressionCount: progCount.get(ex.id) ?? 0,
      hasPositions: Boolean(ex.startPosition && ex.endPosition),
      difficulty: ex.difficulty, description: ex.description,
    });
    const rigor = scoreRigor(ex.status, null, ex.notes);
    const composite = evidence.score + coherence.score + completeness.score + rigor.score;

    const auditHigh = (ex.notes?.match(/AUDIT\[high\]/g) || []).length;
    const auditMed = (ex.notes?.match(/AUDIT\[medium\]/g) || []).length;

    // ── Triage signals (the four review triggers this pass exists for) ──
    const signals: string[] = [];
    if (auditHigh > 0 || ex.status === "disputed") signals.push("conflicting-evidence");
    else if (auditMed > 0) signals.push("conflicting-evidence(medium)");
    // Suspiciously confident: high self-rated confidence on thin evidence.
    if (ex.confidence >= 0.75 && (srcs.length === 0 || ["limited", "expert-opinion"].includes(ex.evidenceLevel ?? ""))) {
      signals.push("suspiciously-confident");
    }
    if (ex.confidence >= 0.85 && srcs.length === 0) signals.push("very-confident-no-sources");
    // Weak cue/source match: claims of evidence without the receipts.
    if ((ex.evidenceLevel === "strong" || ex.evidenceLevel === "moderate") && srcs.length === 0) signals.push("evidence-claim-no-sources");
    if (ex.evidenceLevel === "strong" && srcs.length > 0 && srcs.length < 2) signals.push("strong-claim-thin-sources");
    if (ex.emgNotes && srcs.length === 0) signals.push("emg-claims-unlinked");
    if ((ex.evidenceLevel === "strong" || ex.evidenceLevel === "moderate") && exCues.length > 0 && citedCueCount === 0) signals.push("cues-uncited-on-evidenced-exercise");
    // Coherence conflicts from the ported validator.
    if (coherence.notes.some((t) => t.includes("marked both primary and lengthening") || t.includes("known mover"))) signals.push("coherence-conflict");
    // Research gaps: nothing linked at all.
    if (srcs.length === 0) signals.push("research-gap:no-sources");
    if (!ex.evidenceLevel) signals.push("research-gap:no-evidence-level");

    // Deterministic fallback ordering: worse composites and heavier signals first.
    let heuristicPriority = 100 - composite;
    if (auditHigh) heuristicPriority += 30;
    if (auditMed) heuristicPriority += 10;
    if (signals.includes("suspiciously-confident") || signals.includes("very-confident-no-sources")) heuristicPriority += 15;
    if (signals.includes("coherence-conflict")) heuristicPriority += 12;
    if (signals.includes("evidence-claim-no-sources")) heuristicPriority += 12;
    heuristicPriority += Math.min(10, (ftCount.get(ex.id) ?? 0)); // blast radius: linked to daily-life tasks

    return {
      slug: ex.slug, name: ex.name, status: ex.status, confidence: ex.confidence,
      provenance: ex.provenance, evidenceLevel: ex.evidenceLevel, category: ex.category ?? null,
      composite, dims: { evidence, coherence, completeness, rigor },
      srcCount: srcs.length, srcTypes, srcIdentified,
      cueCount: exCues.length, cueFocus, cueProblems, citedCueCount,
      counts: {
        regressions: regCount.get(ex.id) ?? 0, progressions: progCount.get(ex.id) ?? 0,
        movements: movIds.length, functionalTasks: ftCount.get(ex.id) ?? 0, goals: goalCount.get(ex.id) ?? 0,
      },
      auditHigh, auditMed, signals, heuristicPriority,
    };
  });
}

// ── Jev payload ──────────────────────────────────────────────────────────────
// Compact numeric/categorical state. Deliberately no clinical prose: Jev ranks
// the record's review-worthiness from the validator evidence, it does not get
// asked to judge whether the medicine is right.
function jevState(f: Features): string {
  const cueMix = `internal=${f.cueFocus.internal} external=${f.cueFocus.external} tactile=${f.cueFocus.tactile} imagery=${f.cueFocus.imagery} instruction=${f.cueFocus.instruction}`;
  return [
    `Exercise record in a physical-therapy knowledge base awaiting human review.`,
    `slug=${f.slug} status=${f.status} confidence=${f.confidence} provenance=${f.provenance ?? "unknown"} category=${f.category ?? "unset"}`,
    `evidenceLevel=${f.evidenceLevel ?? "unset"} linkedSources=${f.srcCount} (${Object.entries(f.srcTypes).map(([k, v]) => `${v} ${k}`).join(", ") || "none"}; ${f.srcIdentified} with DOI/PMID)`,
    `validatorScores: evidence=${f.dims.evidence.score}/30 coherence=${f.dims.coherence.score}/30 completeness=${f.dims.completeness.score}/25 rigor=${f.dims.rigor.score}/15 composite=${f.composite}/100`,
    `coherenceFlags: ${f.dims.coherence.notes.join("; ") || "none"}`,
    `evidenceFlags: ${f.dims.evidence.notes.join("; ") || "none"}`,
    `completenessFlags: ${f.dims.completeness.notes.join("; ") || "none"}`,
    `cues=${f.cueCount} (${cueMix}); citedCues=${f.citedCueCount}; cueProblems: ${f.cueProblems.join("; ") || "none"}`,
    `regressions=${f.counts.regressions} progressions=${f.counts.progressions} linkedMovements=${f.counts.movements} functionalTasks=${f.counts.functionalTasks} goals=${f.counts.goals}`,
    `unresolvedAuditFlags: high=${f.auditHigh} medium=${f.auditMed}`,
    `triageSignals: ${f.signals.join(", ") || "none"}`,
  ].join("\n");
}

const JEV_QUESTIONS = {
  review_priority: {
    type: "score",
    instructions: "How urgently does a human reviewer need to look at this record, given the validator evidence? Rank records that are wrong, overconfident, or evidence-poor above records that are merely incomplete.",
    criteria: [
      "Skip: record looks solid; routine review whenever.",
      "Low: minor gaps only; review in a normal sweep.",
      "Normal: real gaps but nothing alarming.",
      "High: likely wrong, overconfident, or evidence-poor in a way that could mislead a user.",
      "Urgent: conflicting or contradictory evidence, or strong claims with no support. Review before anything else.",
    ],
  },
  primary_concern: {
    type: "choice",
    instructions: "The single most important reason this record needs human eyes.",
    criteria: {
      "evidence-gap": "missing or thin citations for the claims made",
      "cue-quality": "coaching cues violate motor-learning best practice",
      "coherence-conflict": "the muscle/movement graph contradicts the exercise's own claims",
      "overconfident-metadata": "confidence/evidence fields overstate the support",
      "completeness-gap": "missing regressions, progressions, positions, or cues",
      "none": "no real concern; record is fine",
    },
  },
  research_gap_first: {
    type: "noul",
    instructions: "This record should be near the front of the citation-research queue (finding and linking primary sources).",
  },
} as const;

function jevPayload(f: Features) {
  return { state: jevState(f), model: MODEL, questions: JEV_QUESTIONS };
}

// ── Jev live run ─────────────────────────────────────────────────────────────
type JevAnswer = {
  slug: string;
  ok: boolean;
  reviewPriority?: number; reviewConfidence?: number; reviewProbs?: Record<string, number>;
  primaryConcern?: string; concernConfidence?: number;
  researchGapFirst?: number;
  inputTokens?: number; latencyMs?: number; error?: string;
};

async function jevCall(payload: unknown, key: string): Promise<{ body: any; latencyMs: number }> {
  const t0 = Date.now();
  const res = await fetch("https://api.typesafe.ai/v1/systemone", {
    method: "POST",
    headers: { authorization: `Bearer ${key}`, "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
  const latencyMs = Date.now() - t0;
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`);
  return { body: await res.json(), latencyMs };
}

async function runJev(features: Features[], key: string): Promise<JevAnswer[]> {
  const targets = LIMIT > 0 ? features.slice(0, LIMIT) : features;
  const out: JevAnswer[] = [];
  let done = 0;
  const worker = async (queue: Features[]) => {
    while (queue.length) {
      const f = queue.shift()!;
      try {
        const { body, latencyMs } = await jevCall(jevPayload(f), key);
        const a = body.answers ?? {};
        out.push({
          slug: f.slug, ok: true,
          reviewPriority: a.review_priority?.score,
          reviewConfidence: a.review_priority?.confidence,
          reviewProbs: a.review_priority?.probabilities,
          primaryConcern: a.primary_concern?.choice,
          concernConfidence: a.primary_concern?.confidence,
          researchGapFirst: a.research_gap_first?.noul,
          inputTokens: body.usage?.input_tokens, latencyMs,
        });
      } catch (e) {
        out.push({ slug: f.slug, ok: false, error: String(e) });
      }
      done++;
      if (done % 25 === 0 || done === targets.length) console.log(`  … ${done}/${targets.length} scored`);
    }
  };
  const queue = [...targets];
  await Promise.all(Array.from({ length: CONCURRENCY }, () => worker(queue)));
  return out;
}

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  const ds = JSON.parse(readFileSync(INPUT, "utf8")) as Dataset;
  console.log(`Loaded ${ds.exercises.length} exercises from ${INPUT}`);
  mkdirSync(OUT_DIR, { recursive: true });

  const features = buildFeatures(ds);
  features.sort((a, b) => b.heuristicPriority - a.heuristicPriority);
  writeFileSync(join(OUT_DIR, "features.json"), JSON.stringify(features, null, 1));

  // Aggregate picture
  const dist = { "90+": 0, "80-89": 0, "70-79": 0, "60-69": 0, "<60": 0 } as Record<string, number>;
  for (const f of features) dist[f.composite >= 90 ? "90+" : f.composite >= 80 ? "80-89" : f.composite >= 70 ? "70-79" : f.composite >= 60 ? "60-69" : "<60"]++;
  const mean = Math.round(features.reduce((s, f) => s + f.composite, 0) / features.length);
  const signalCounts = new Map<string, number>();
  for (const f of features) for (const s of f.signals) signalCounts.set(s, (signalCounts.get(s) ?? 0) + 1);
  console.log(`Composite validator scores: mean ${mean}/100. Distribution:`, dist);
  console.log("Signal counts:", Object.fromEntries([...signalCounts.entries()].sort((a, b) => b[1] - a[1])));

  // Jev payloads (always built — the dry run measures exactly what --run would send)
  const payloads = features.map((f) => ({ slug: f.slug, ...jevPayload(f) }));
  writeFileSync(join(OUT_DIR, "jev-payloads.jsonl"), payloads.map((p) => JSON.stringify(p)).join("\n"));
  const totalChars = payloads.reduce((s, p) => s + JSON.stringify(p).length, 0);
  const estTokens = Math.ceil(totalChars / 4); // conservative ~4 chars/token
  console.log(`\nJev dry pass: ${payloads.length} calls, ~${estTokens.toLocaleString()} input tokens (chars/4 estimate), ≈ $${((estTokens / 1e6) * PRICE_PER_MTOK).toFixed(4)} at $${PRICE_PER_MTOK}/Mtok`);

  let answers: JevAnswer[] | null = null;
  if (RUN) {
    const key = process.env.TYPESAFE_API_KEY;
    if (!key) throw new Error("--run needs TYPESAFE_API_KEY in the environment");
    console.log(`\nRunning live Jev pass (${LIMIT > 0 ? `first ${LIMIT}` : "all"} records, concurrency ${CONCURRENCY})…`);
    answers = await runJev(features, key);
    writeFileSync(join(OUT_DIR, "jev-answers.jsonl"), answers.map((a) => JSON.stringify(a)).join("\n"));
    const okAnswers = answers.filter((a) => a.ok);
    const measuredTokens = okAnswers.reduce((s, a) => s + (a.inputTokens ?? 0), 0);
    const cost = (measuredTokens / 1e6) * PRICE_PER_MTOK;
    const lat = okAnswers.map((a) => a.latencyMs!).sort((a, b) => a - b);
    const spend = {
      model: MODEL, pricePerMtok: PRICE_PER_MTOK,
      callsAttempted: answers.length, callsOk: okAnswers.length, callsFailed: answers.length - okAnswers.length,
      measuredInputTokens: measuredTokens, measuredCostUsd: Number(cost.toFixed(6)),
      estimatedFullPassTokens: LIMIT > 0 ? Math.round((measuredTokens / Math.max(1, okAnswers.length)) * features.length) : measuredTokens,
      estimatedFullPassCostUsd: LIMIT > 0 ? Number((((measuredTokens / Math.max(1, okAnswers.length)) * features.length) / 1e6 * PRICE_PER_MTOK).toFixed(6)) : Number(cost.toFixed(6)),
      latencyMs: { p50: lat[Math.floor(lat.length / 2)], max: lat[lat.length - 1] },
      ranAt: new Date().toISOString(),
    };
    writeFileSync(join(OUT_DIR, "spend-log.json"), JSON.stringify(spend, null, 1));
    console.log("Spend:", spend);
  }

  // Final queue: Jev re-ranks when answers exist, deterministic heuristic otherwise.
  const bySlug = new Map(features.map((f) => [f.slug, f]));
  const answerBySlug = new Map((answers ?? []).filter((a) => a.ok).map((a) => [a.slug, a]));
  const queue = [...features].sort((a, b) => {
    const ja = answerBySlug.get(a.slug), jb = answerBySlug.get(b.slug);
    if (ja && jb) {
      if ((jb.reviewPriority ?? 0) !== (ja.reviewPriority ?? 0)) return (jb.reviewPriority ?? 0) - (ja.reviewPriority ?? 0);
      return b.heuristicPriority - a.heuristicPriority;
    }
    if (ja) return -1; if (jb) return 1;
    return b.heuristicPriority - a.heuristicPriority;
  });

  const lines: string[] = [
    "# Body IQ — review triage queue", "",
    `_Generated ${new Date().toISOString().slice(0, 10)} — ${features.length} records. Validators: deterministic port of score-exercises.ts + cue-quality.ts on the dataset export. Ranking: ${answers ? "Jev (advisory) over deterministic candidates" : "deterministic heuristic (dry run — no Jev call made)"}._`,
    "", `Mean composite ${mean}/100. Distribution: ${JSON.stringify(dist)}.`, "",
    "Jev only orders this queue. It changes no clinical content, no citations, no status.", "",
    `## Top ${TOP} records to review`, "",
  ];
  queue.slice(0, TOP).forEach((f, i) => {
    const a = answerBySlug.get(f.slug);
    lines.push(`### ${i + 1}. [${f.slug}] ${f.name}`);
    lines.push("");
    lines.push(`Composite ${f.composite}/100 (evidence ${f.dims.evidence.score}/30, coherence ${f.dims.coherence.score}/30, completeness ${f.dims.completeness.score}/25, rigor ${f.dims.rigor.score}/15) · confidence ${f.confidence} · evidenceLevel ${f.evidenceLevel ?? "unset"} · sources ${f.srcCount}`);
    if (a) lines.push(`Jev: priority ${a.reviewPriority}/4 (${a.primaryConcern}, research-first ${((a.researchGapFirst ?? 0) * 100).toFixed(0)}%)`);
    lines.push(`Signals: ${f.signals.join(", ") || "none"}`);
    const why = [...f.dims.evidence.notes, ...f.dims.coherence.notes, ...f.dims.completeness.notes, ...f.cueProblems];
    if (why.length) lines.push(`Why: ${why.join("; ")}`);
    lines.push("");
  });
  writeFileSync(join(OUT_DIR, "review-queue.md"), lines.join("\n"));
  writeFileSync(join(OUT_DIR, "queue.json"), JSON.stringify(queue.slice(0, 100).map((f) => ({ slug: f.slug, composite: f.composite, signals: f.signals, heuristicPriority: f.heuristicPriority, jev: answerBySlug.get(f.slug) ?? null })), null, 1));
  console.log(`\nWrote ${OUT_DIR}/{features.json, jev-payloads.jsonl, review-queue.md, queue.json}${answers ? " + jev-answers.jsonl + spend-log.json" : ""}`);
  console.log(`\nTop ${Math.min(10, TOP)} of the queue:`);
  queue.slice(0, Math.min(10, TOP)).forEach((f, i) => {
    const a = answerBySlug.get(f.slug);
    console.log(`  ${String(i + 1).padStart(2)}. ${String(f.composite).padStart(3)}/100  ${f.slug}${a ? `  [jev p=${a.reviewPriority} ${a.primaryConcern}]` : ""}`);
  });
  void bySlug;
}

main().catch((e) => { console.error("review-triage failed:", e); process.exit(1); });
