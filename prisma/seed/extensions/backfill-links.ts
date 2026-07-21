import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { prisma, logSection, logCount } from "../client";
import { MuscleRole } from "@prisma/client";

/**
 * Joint/muscle backfill — adds the muscle and movement (→ joint) links for
 * existing exercises that genuinely have them but were seeded unlinked
 * (stretches, mobility drills, compound moves). Researched against the real slug
 * roster and clinically reviewed; added additively (never deletes existing
 * links). Data in the sibling JSON so it is reproducible.
 */

const FILE = join(__dirname, "backfill-links-2026-07.json");
const validRole = new Set(["primary", "secondary", "stabilizer", "synergist", "lengthening", "common_association"]);

export async function seedBackfillLinksExtension() {
  logSection("Joint/muscle backfill links");
  if (!existsSync(FILE)) { console.log("    (no backfill JSON — skipping)"); return; }

  const records: any[] = JSON.parse(readFileSync(FILE, "utf8"));
  const muscles = new Map((await prisma.muscle.findMany({ select: { id: true, slug: true } })).map((m) => [m.slug, m.id]));
  const movements = new Map((await prisma.movement.findMany({ select: { id: true, slug: true } })).map((m) => [m.slug, m.id]));

  let n = 0;
  for (const rec of records) {
    const ex = await prisma.exercise.findUnique({ where: { slug: rec.slug }, select: { id: true } });
    if (!ex) continue;
    for (const mr of rec.muscleRoles ?? []) {
      const muscleId = muscles.get(mr.muscleSlug);
      if (!muscleId || !validRole.has(mr.role)) continue;
      await prisma.exerciseMuscle.upsert({
        where: { exerciseId_muscleId: { exerciseId: ex.id, muscleId } },
        update: { role: mr.role as MuscleRole, notes: mr.notes },
        create: { exerciseId: ex.id, muscleId, role: mr.role as MuscleRole, notes: mr.notes },
      });
    }
    for (const ms of rec.movementSlugs ?? []) {
      const movementId = movements.get(ms);
      if (!movementId) continue;
      await prisma.exerciseMovement.upsert({
        where: { exerciseId_movementId: { exerciseId: ex.id, movementId } },
        update: {}, create: { exerciseId: ex.id, movementId },
      });
    }
    n++;
  }
  logCount("exercises backfilled with links", n);
}
