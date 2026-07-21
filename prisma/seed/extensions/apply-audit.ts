import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { prisma, logSection, logCount } from "../client";
import { MuscleRole } from "@prisma/client";

/**
 * Apply the verified clinical-audit manifest (audit-2026-07.json): lengthening
 * muscle links, difficulty-graph edges (progression/regression targetExerciseId),
 * and evidence-flag notes.
 *
 * Runs LAST in the seed chain on purpose: earlier researched-exercise extensions
 * deleteMany + recreate progression/regression rows, which would wipe the
 * difficulty edges if the audit ran before them. Idempotent — never overwrites
 * an existing muscle role or duplicates an edge/flag.
 */

const FILE = join(__dirname, "audit-2026-07.json");

export async function seedApplyAuditExtension() {
  logSection("Apply clinical audit (lengthening, difficulty edges, flags)");
  if (!existsSync(FILE)) { console.log("    (no audit manifest — skipping)"); return; }

  const m = JSON.parse(readFileSync(FILE, "utf8"));
  const exBySlug = new Map((await prisma.exercise.findMany({ select: { id: true, slug: true, notes: true } })).map((e) => [e.slug, e]));
  const muBySlug = new Map((await prisma.muscle.findMany({ select: { id: true, slug: true } })).map((mu) => [mu.slug, mu]));

  let lengthening = 0, edges = 0, flags = 0;

  for (const l of m.lengthening ?? []) {
    const ex = exBySlug.get(l.exerciseSlug), mu = muBySlug.get(l.muscleSlug);
    if (!ex || !mu) continue;
    const existing = await prisma.exerciseMuscle.findUnique({ where: { exerciseId_muscleId: { exerciseId: ex.id, muscleId: mu.id } }, select: { id: true } });
    if (existing) continue; // don't overwrite an existing role
    await prisma.exerciseMuscle.create({ data: { exerciseId: ex.id, muscleId: mu.id, role: "lengthening" as MuscleRole, notes: `AUDIT: ${l.rationale}` } });
    lengthening++;
  }

  for (const e of m.difficultyEdges ?? []) {
    const from = exBySlug.get(e.fromSlug), to = exBySlug.get(e.toSlug);
    if (!from || !to) continue;
    const table = e.direction === "progression" ? prisma.progression : prisma.regression;
    // @ts-expect-error union of identical delegates
    const dupe = await table.findFirst({ where: { exerciseId: from.id, targetExerciseId: to.id }, select: { id: true } });
    if (dupe) continue;
    // @ts-expect-error union of identical delegates
    await table.create({ data: { exerciseId: from.id, targetExerciseId: to.id, name: `${e.direction === "progression" ? "Progress to" : "Regress to"} ${to.slug}`, description: `AUDIT: ${e.criterion}`, criterion: e.criterion, order: 99 } });
    edges++;
  }

  for (const f of m.evidenceFlags ?? []) {
    const ex = exBySlug.get(f.exerciseSlug);
    if (!ex) continue;
    if ((ex.notes || "").includes(f.issue.slice(0, 40))) continue;
    const line = `AUDIT[${f.severity}]: ${f.issue} → ${f.suggestedFix}`;
    ex.notes = [ex.notes, line].filter(Boolean).join("\n");
    await prisma.exercise.update({ where: { id: ex.id }, data: { notes: ex.notes } });
    flags++;
  }

  logCount("audit lengthening links added", lengthening);
  console.log(`    difficulty edges: ${edges} | evidence flags: ${flags}`);
}
