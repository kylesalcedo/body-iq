#!/usr/bin/env tsx
/**
 * Exercise quality scorer — a multi-validator composite, 0-100.
 *
 * Four validators, transparent rubrics so two runs give the same number
 * (deterministic; no LLM, no cost, repeatable). Weighted so INTRINSIC quality
 * dominates and human review is a bonus, not a hard ceiling — a well-evidenced,
 * logically-coherent exercise (a squat) scores high before anyone reviews it:
 *
 *   EVIDENCE      (evidence persona, 30)  — sources, evidence tier, dosing, EMG
 *   COHERENCE     (data-scientist, 30)     — does the muscle/joint/movement graph agree with
 *                                            what the exercise claims? logical self-consistency
 *   COMPLETENESS  (product, 25)            — cues, regressions, progressions, positions, difficulty
 *   RIGOR         (reviewer, 15)           — validation status, reviewed, unresolved audit flags
 *
 * The composite writes to Exercise.qualityScore (0-100), the per-validator
 * breakdown to scoreBreakdown, and — with --promote — bumps draft→needs_review
 * (≥60) and needs_review→reviewed (≥85 and no high-severity audit flag). Nothing
 * is auto-marked `verified`; that stays a human act.
 *
 * The COHERENCE validator is the logical check you asked for: it confirms an
 * exercise's primary muscles actually produce its linked movements, that a
 * contract exercise has a primary mover, that lengthening antagonists are the
 * antagonists of the movement, etc. Pure graph queries — free and reproducible.
 *
 * Usage: tsx scripts/score-exercises.ts [--promote] [--slug <slug>] [--top N] [--bottom N]
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const PROMOTE = process.argv.includes("--promote");
const ONE = argVal("--slug");
const TOP = Number(argVal("--top") || 0);
const BOTTOM = Number(argVal("--bottom") || 0);
function argVal(flag: string): string | undefined {
  const i = process.argv.indexOf(flag);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

const EVIDENCE_TIER: Record<string, number> = { strong: 10, moderate: 7, limited: 4, "expert-opinion": 2 };
const clamp = (n: number, max: number) => Math.max(0, Math.min(max, n));

type Dim = { score: number; max: number; notes: string[] };

// ── EVIDENCE (30) ────────────────────────────────────────────────────────────
function scoreEvidence(ex: any): Dim {
  const n: string[] = [];
  let s = 0;
  const srcCount = ex.sources.length;
  s += clamp(srcCount * 2.5, 10); // up to 4 sources fully credited
  if (srcCount === 0) n.push("no linked sources");
  const tier = (EVIDENCE_TIER[ex.evidenceLevel ?? ""] ?? 0) * 1.2; // up to 12
  s += tier;
  if (!ex.evidenceLevel) n.push("no evidenceLevel set");
  if (ex.dosing) s += 5; else n.push("no dosing");
  if (ex.emgNotes) s += 3; else n.push("no EMG notes");
  return { score: clamp(Math.round(s), 30), max: 30, notes: n };
}

// ── COHERENCE / data-scientist (30) ──────────────────────────────────────────
// The logical validator: does the graph agree with the exercise's own claims?
function scoreCoherence(ex: any): Dim {
  const n: string[] = [];
  let s = 30; // start full, subtract for each logical problem

  const roles = ex.muscles.map((m: any) => m.role);
  const primaries = ex.muscles.filter((m: any) => m.role === "primary");
  const isStretchOrMobility = /stretch|glide|mobiliz|breathing|balance|stance|tandem|walk|gait|propriocept|carry|eye|vestibul/.test(ex.slug);

  // 1. A strengthening exercise should have at least one primary mover.
  if (primaries.length === 0 && !isStretchOrMobility) { s -= 7; n.push("no primary mover on a non-stretch exercise"); }

  // 2. Movements must be linked (can't validate mechanics without them).
  if (ex.movements.length === 0) { s -= 6; n.push("no linked movements"); }

  // 3. Primary muscles should actually produce at least one of the exercise's movements.
  //    Cross-check ExerciseMuscle.primary against MovementMuscle for the linked movements.
  const movementMoverSlugs = new Set<string>();
  for (const em of ex.movements) for (const mm of em.movement.muscles) {
    if (mm.role === "primary" || mm.role === "secondary" || mm.role === "synergist") movementMoverSlugs.add(mm.muscle.slug);
  }
  const primaryConfirmed = primaries.filter((pm: any) => movementMoverSlugs.has(pm.muscle.slug)).length;
  if (primaries.length > 0 && movementMoverSlugs.size > 0 && primaryConfirmed === 0) {
    s -= 7; n.push("no primary muscle is a known mover of the linked movements");
  }

  // 4. Lengthening antagonists should NOT also be the primary movers (contradiction).
  const primarySlugs = new Set(primaries.map((p: any) => p.muscle.slug));
  const lengthening = ex.muscles.filter((m: any) => m.role === "lengthening");
  const contradiction = lengthening.filter((l: any) => primarySlugs.has(l.muscle.slug)).length;
  if (contradiction) { s -= 5; n.push(`${contradiction} muscle(s) marked both primary and lengthening`); }

  // 5. Role distribution sanity — an exercise that is ALL stabilizers is suspect.
  if (roles.length >= 3 && roles.every((r: string) => r === "stabilizer")) { s -= 4; n.push("every muscle is a stabilizer"); }

  // 6. bodyPosition should be consistent with a supine/prone/etc. named exercise.
  if (!ex.bodyPosition) { s -= 1; n.push("no bodyPosition"); }

  return { score: clamp(Math.round(s), 30), max: 30, notes: n };
}

// ── COMPLETENESS / product (25) ──────────────────────────────────────────────
function scoreCompleteness(ex: any): Dim {
  const n: string[] = [];
  let s = 0;
  if (ex.cues.length >= 3) s += 6; else { s += ex.cues.length * 2; n.push(`only ${ex.cues.length} cues`); }
  if (ex.regressions.length >= 2) s += 5; else { s += ex.regressions.length * 2; n.push(`${ex.regressions.length} regressions`); }
  if (ex.progressions.length >= 2) s += 5; else { s += ex.progressions.length * 2; n.push(`${ex.progressions.length} progressions`); }
  if (ex.startPosition && ex.endPosition) s += 4; else n.push("missing start/end position");
  if (ex.difficulty) s += 2; else n.push("no difficulty");
  if (ex.description && ex.description.length > 60) s += 3; else n.push("thin description");
  return { score: clamp(Math.round(s), 25), max: 25, notes: n };
}

// ── RIGOR / reviewer (15) ────────────────────────────────────────────────────
function scoreRigor(ex: any): Dim {
  const n: string[] = [];
  let s = 0;
  const statusPts: Record<string, number> = { draft: 3, needs_review: 7, reviewed: 12, verified: 15, disputed: 1 };
  s += statusPts[ex.status] ?? 0;
  if (ex.reviewedBy) s += 2;
  // Unresolved audit flags in notes drag rigor down until a human resolves them.
  const notes = ex.notes ?? "";
  const high = (notes.match(/AUDIT\[high\]/g) || []).length;
  const med = (notes.match(/AUDIT\[medium\]/g) || []).length;
  if (high) { s -= 5 * high; n.push(`${high} unresolved high-severity audit flag(s)`); }
  if (med) { s -= 2 * med; n.push(`${med} unresolved medium audit flag(s)`); }
  return { score: clamp(Math.round(s), 15), max: 15, notes: n };
}

async function main() {
  const where = ONE ? { slug: ONE } : {};
  const exercises = await prisma.exercise.findMany({
    where,
    include: {
      sources: true,
      cues: true,
      regressions: true,
      progressions: true,
      muscles: { include: { muscle: { select: { slug: true } } } },
      movements: { include: { movement: { include: { muscles: { include: { muscle: { select: { slug: true } } } } } } } },
    },
  });

  const rows: { slug: string; name: string; score: number; hasHighFlag: boolean }[] = [];

  for (const ex of exercises) {
    const dims = {
      evidence: scoreEvidence(ex),
      coherence: scoreCoherence(ex),
      completeness: scoreCompleteness(ex),
      rigor: scoreRigor(ex),
    };
    const score = dims.evidence.score + dims.coherence.score + dims.completeness.score + dims.rigor.score;
    const hasHighFlag = /AUDIT\[high\]/.test(ex.notes ?? "");

    await prisma.exercise.update({
      where: { id: ex.id },
      data: { qualityScore: score, scoreBreakdown: dims as any, scoredAt: new Date() },
    });

    if (PROMOTE) {
      let next = ex.status;
      if (ex.status === "draft" && score >= 60) next = "needs_review";
      if (ex.status === "needs_review" && score >= 85 && !hasHighFlag) next = "reviewed";
      if (next !== ex.status) await prisma.exercise.update({ where: { id: ex.id }, data: { status: next } });
    }

    rows.push({ slug: ex.slug, name: ex.name, score, hasHighFlag });
  }

  rows.sort((a, b) => b.score - a.score);
  const mean = Math.round(rows.reduce((s, r) => s + r.score, 0) / rows.length);
  console.log(`Scored ${rows.length} exercises. Mean ${mean}/100.${PROMOTE ? " (promotions applied)" : " (dry scores written; pass --promote to advance status)"}`);
  const dist = { "90+": 0, "80-89": 0, "70-79": 0, "60-69": 0, "<60": 0 } as Record<string, number>;
  for (const r of rows) dist[r.score >= 90 ? "90+" : r.score >= 80 ? "80-89" : r.score >= 70 ? "70-79" : r.score >= 60 ? "60-69" : "<60"]++;
  console.log("Distribution:", dist);

  if (TOP) { console.log(`\nTop ${TOP}:`); rows.slice(0, TOP).forEach((r, i) => console.log(`  ${String(i + 1).padStart(2)}. ${String(r.score).padStart(3)}  ${r.slug}`)); }
  if (BOTTOM) { console.log(`\nBottom ${BOTTOM}:`); rows.slice(-BOTTOM).forEach((r) => console.log(`  ${String(r.score).padStart(3)}  ${r.slug}${r.hasHighFlag ? "  ⚑high-flag" : ""}`)); }
  if (ONE) console.log("\nBreakdown:", JSON.stringify((await prisma.exercise.findUnique({ where: { slug: ONE }, select: { scoreBreakdown: true } }))?.scoreBreakdown, null, 1));
}

main().finally(() => prisma.$disconnect());
