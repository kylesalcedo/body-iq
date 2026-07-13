#!/usr/bin/env tsx
/**
 * Reconcile each common-exercise's muscle links to the panel-VERIFIED set from
 * the verify workflow, and mark the record as verified-by-panel. The seed
 * extension only adds/updates muscle links; it never removes ones the verifier
 * dropped. This script closes that gap: it deletes exercise-muscle links whose
 * muscle is not in the verified set, upserts the verified ones with their roles,
 * and updates the note/confidence to reflect that the adversarial pass ran.
 *
 * Idempotent. Usage: tsx scripts/apply-verified-muscles.ts [--apply]
 */
import { PrismaClient, type MuscleRole } from "@prisma/client";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const APPLY = process.argv.includes("--apply");
const FILE = join(process.cwd(), "prisma", "seed", "extensions", "common-exercises-2026-07.json");
const p = new PrismaClient();

const VERIFIED_NOTE = "claude-researched 2026-07, panel-verified (adversarial PT review of muscle roles). Sources not yet linked — evidence dimension caps the score until citations are added.";

async function main() {
  const records: any[] = JSON.parse(readFileSync(FILE, "utf8"));
  const muscles = new Map((await p.muscle.findMany({ select: { id: true, slug: true } })).map((m) => [m.slug, m.id]));
  const validRole = new Set(["primary", "secondary", "stabilizer", "synergist", "lengthening", "common_association"]);

  let dropped = 0, upserted = 0, touched = 0;
  for (const rec of records) {
    const ex = await p.exercise.findUnique({ where: { slug: rec.slug }, select: { id: true, muscles: { select: { id: true, muscle: { select: { slug: true } } } } } });
    if (!ex) continue;
    touched++;
    const verified = (rec.muscleRoles || []).filter((m: any) => muscles.has(m.muscleSlug) && validRole.has(m.role));
    const verifiedSlugs = new Set(verified.map((m: any) => m.muscleSlug));

    // Drop links not in the verified set
    for (const link of ex.muscles) {
      if (!verifiedSlugs.has(link.muscle.slug)) {
        dropped++;
        if (APPLY) await p.exerciseMuscle.delete({ where: { id: link.id } });
      }
    }
    // Upsert verified links with endorsed roles
    for (const mr of verified) {
      upserted++;
      if (APPLY) {
        const muscleId = muscles.get(mr.muscleSlug)!;
        await p.exerciseMuscle.upsert({
          where: { exerciseId_muscleId: { exerciseId: ex.id, muscleId } },
          update: { role: mr.role as MuscleRole, notes: mr.notes },
          create: { exerciseId: ex.id, muscleId, role: mr.role as MuscleRole, notes: mr.notes },
        });
      }
    }
    if (APPLY) await p.exercise.update({ where: { id: ex.id }, data: { notes: VERIFIED_NOTE, confidence: 0.6 } });
  }

  console.log(APPLY ? "APPLIED" : "DRY RUN (pass --apply)");
  console.log(`  exercises reconciled: ${touched}`);
  console.log(`  muscle links dropped (verifier rejected): ${dropped}`);
  console.log(`  muscle links upserted (verifier endorsed): ${upserted}`);
}

main().finally(() => p.$disconnect());
