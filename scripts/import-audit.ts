#!/usr/bin/env tsx
/**
 * Import the verified clinical-audit manifest (prisma/seed/extensions/audit-2026-07.json)
 * into the database. Idempotent and conservative:
 *
 *   - LENGTHENING links → new ExerciseMuscle rows with role `lengthening`.
 *     Only INSERTS where the exercise↔muscle pair has no existing role; a pair
 *     already carrying another role (e.g. a stretch's target listed "primary")
 *     is NOT overwritten — it goes to the conflict report for human review.
 *   - DIFFICULTY edges → adds a Progression/Regression row on the base exercise
 *     pointing at the target exercise, with the audit's criterion. Skips if an
 *     edge from→to already exists.
 *   - EVIDENCE flags → appended to the exercise's `notes` (deduped by text) with
 *     an `AUDIT[sev]:` prefix. Exercises receiving a medium/high flag are moved
 *     draft → needs_review so the validation queue surfaces them.
 *
 * Everything is tagged as audit-derived and pending human verification — nothing
 * is marked `verified`. Re-running makes no further changes.
 *
 * Usage: tsx scripts/import-audit.ts [--apply]   (dry-run without --apply)
 */
import { PrismaClient, type MuscleRole } from "@prisma/client";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const APPLY = process.argv.includes("--apply");
const MANIFEST = join(process.cwd(), "prisma", "seed", "extensions", "audit-2026-07.json");
const TAG = "AUDIT";
const p = new PrismaClient();

type Manifest = {
  lengthening: { exerciseSlug: string; muscleSlug: string; rationale: string; region: string }[];
  difficultyEdges: { fromSlug: string; toSlug: string; direction: "progression" | "regression"; criterion: string; region: string }[];
  evidenceFlags: { exerciseSlug: string; issue: string; severity: "low" | "medium" | "high"; suggestedFix: string; region: string }[];
};

async function main() {
  const m: Manifest = JSON.parse(readFileSync(MANIFEST, "utf8"));
  const exBySlug = new Map((await p.exercise.findMany({ select: { id: true, slug: true, status: true, notes: true } })).map((e) => [e.slug, e]));
  const muBySlug = new Map((await p.muscle.findMany({ select: { id: true, slug: true } })).map((mu) => [mu.slug, mu]));

  const report = { lengtheningInserted: 0, lengtheningConflict: [] as string[], edgesAdded: 0, edgesSkipped: 0, flagsNoted: 0, statusBumped: 0 };

  // 1) Lengthening links
  for (const l of m.lengthening) {
    const ex = exBySlug.get(l.exerciseSlug), mu = muBySlug.get(l.muscleSlug);
    if (!ex || !mu) continue;
    const existing = await p.exerciseMuscle.findUnique({ where: { exerciseId_muscleId: { exerciseId: ex.id, muscleId: mu.id } }, select: { role: true } });
    if (existing) {
      if (existing.role !== "lengthening") report.lengtheningConflict.push(`${l.exerciseSlug} ↔ ${l.muscleSlug} (already ${existing.role})`);
      continue;
    }
    report.lengtheningInserted++;
    if (APPLY) {
      await p.exerciseMuscle.create({ data: { exerciseId: ex.id, muscleId: mu.id, role: "lengthening" as MuscleRole, notes: `${TAG}: ${l.rationale}` } });
    }
  }

  // 2) Difficulty edges
  for (const e of m.difficultyEdges) {
    const from = exBySlug.get(e.fromSlug), to = exBySlug.get(e.toSlug);
    if (!from || !to) continue;
    const table = e.direction === "progression" ? p.progression : p.regression;
    // @ts-expect-error union of delegates with identical shape
    const dupe = await table.findFirst({ where: { exerciseId: from.id, targetExerciseId: to.id }, select: { id: true } });
    if (dupe) { report.edgesSkipped++; continue; }
    report.edgesAdded++;
    if (APPLY) {
      // @ts-expect-error union of delegates with identical shape
      await table.create({ data: { exerciseId: from.id, targetExerciseId: to.id, name: `${e.direction === "progression" ? "Progress to" : "Regress to"} ${to.slug}`, description: `${TAG}: ${e.criterion}`, criterion: e.criterion, order: 99 } });
    }
  }

  // 3) Evidence flags → notes + status bump
  const bump = new Set<string>();
  for (const f of m.evidenceFlags) {
    const ex = exBySlug.get(f.exerciseSlug);
    if (!ex) continue;
    const line = `${TAG}[${f.severity}]: ${f.issue} → ${f.suggestedFix}`;
    if ((ex.notes || "").includes(f.issue.slice(0, 40))) continue; // already noted
    report.flagsNoted++;
    ex.notes = [ex.notes, line].filter(Boolean).join("\n");
    if ((f.severity === "medium" || f.severity === "high") && ex.status === "draft") bump.add(ex.slug);
    if (APPLY) await p.exercise.update({ where: { id: ex.id }, data: { notes: ex.notes } });
  }
  for (const slug of bump) {
    report.statusBumped++;
    if (APPLY) await p.exercise.update({ where: { slug }, data: { status: "needs_review" } });
  }

  console.log(APPLY ? "APPLIED" : "DRY RUN (pass --apply to write)");
  console.log(`  lengthening links inserted:   ${report.lengtheningInserted}`);
  console.log(`  lengthening conflicts (skip): ${report.lengtheningConflict.length}  → review; existing role kept`);
  console.log(`  difficulty edges added:       ${report.edgesAdded}  (skipped existing: ${report.edgesSkipped})`);
  console.log(`  evidence flags noted:         ${report.flagsNoted}`);
  console.log(`  exercises draft→needs_review: ${report.statusBumped}`);
  if (report.lengtheningConflict.length) {
    console.log(`\nConflicts (muscle already linked with another role — audit says lengthening):`);
    for (const c of report.lengtheningConflict) console.log(`  - ${c}`);
  }
}

main().finally(() => p.$disconnect());
