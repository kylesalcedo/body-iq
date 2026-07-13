#!/usr/bin/env tsx
/**
 * Import the joint/muscle backfill records (from the backfill workflow) onto
 * EXISTING exercises that were missing their links. Adds movements and muscles
 * (with verified roles); does not delete existing links. Marks touched exercises
 * with a provenance note so the backfill is auditable.
 *
 * Usage: tsx scripts/import-backfill.ts <records.json> [--apply]
 */
import { PrismaClient, type MuscleRole } from "@prisma/client";
import { readFileSync } from "node:fs";

const FILE = process.argv[2];
const APPLY = process.argv.includes("--apply");
if (!FILE) throw new Error("usage: import-backfill.ts <records.json> [--apply]");
const p = new PrismaClient();

const validRole = new Set(["primary", "secondary", "stabilizer", "synergist", "lengthening", "common_association"]);

async function main() {
  const records: any[] = JSON.parse(readFileSync(FILE, "utf8"));
  const muscles = new Map((await p.muscle.findMany({ select: { id: true, slug: true } })).map((m) => [m.slug, m.id]));
  const movements = new Map((await p.movement.findMany({ select: { id: true, slug: true } })).map((m) => [m.slug, m.id]));

  let ex = 0, mus = 0, mov = 0, skip = 0;
  for (const rec of records) {
    const exercise = await p.exercise.findUnique({ where: { slug: rec.slug }, select: { id: true } });
    if (!exercise) { skip++; continue; }
    ex++;
    for (const mr of rec.muscleRoles ?? []) {
      const muscleId = muscles.get(mr.muscleSlug);
      if (!muscleId || !validRole.has(mr.role)) { skip++; continue; }
      mus++;
      if (APPLY) await p.exerciseMuscle.upsert({
        where: { exerciseId_muscleId: { exerciseId: exercise.id, muscleId } },
        update: { role: mr.role as MuscleRole, notes: mr.notes },
        create: { exerciseId: exercise.id, muscleId, role: mr.role as MuscleRole, notes: mr.notes },
      });
    }
    for (const ms of rec.movementSlugs ?? []) {
      const movementId = movements.get(ms);
      if (!movementId) { skip++; continue; }
      mov++;
      if (APPLY) await p.exerciseMovement.upsert({
        where: { exerciseId_movementId: { exerciseId: exercise.id, movementId } },
        update: {}, create: { exerciseId: exercise.id, movementId },
      });
    }
  }
  console.log(APPLY ? "APPLIED" : "DRY RUN (pass --apply)");
  console.log(`  exercises: ${ex} | muscle links: ${mus} | movement links: ${mov} | skipped (unknown slug/role): ${skip}`);
}

main().finally(() => p.$disconnect());
