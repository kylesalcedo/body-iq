import { readFileSync } from "node:fs";
import { join } from "node:path";
import { prisma, logSection, logCount } from "../client";
import { MuscleRole } from "@prisma/client";

/**
 * Common-exercise expansion — 40 universally-known exercises (barbell lifts,
 * pull-ups, dips, accessory work, common stretches) that the library was
 * missing. Each was researched by a PT-persona agent against the real muscle/
 * movement slug roster (no invented slugs) during the 2026-07 research run.
 *
 * Honesty: the adversarial VERIFY pass was cut short by a session limit, so
 * these import as `provenance: "claude-researched"`, `status: draft`, and carry
 * a note flagging that human/clinical verification is still pending. The quality
 * scorer's coherence validator and the validation queue are the safety net —
 * nothing here is marked reviewed or verified. Data lives in the sibling JSON so
 * it is reproducible and reviewable.
 */

type Rec = {
  slug: string; name: string; description: string;
  dosing?: string; emgNotes?: string; evidenceLevel?: string;
  difficulty?: string; bodyPosition?: string; equipment?: string[];
  movementSlugs: string[];
  muscleRoles: { muscleSlug: string; role: string; notes?: string }[];
  cues?: { text: string; cueType?: string }[];
  regressions?: { name: string; description: string }[];
  progressions?: { name: string; description: string }[];
};

const RESEARCH_NOTE = "claude-researched 2026-07; muscle/movement links validated against the roster. Adversarial clinical verification pending — do not promote past needs_review without human review.";

export async function seedCommonExercisesExtension() {
  logSection("Common exercises (claude-researched, unverified)");

  const records: Rec[] = JSON.parse(readFileSync(join(__dirname, "common-exercises-2026-07.json"), "utf8"));

  const [movs, muscs] = await Promise.all([
    prisma.movement.findMany({ select: { id: true, slug: true } }),
    prisma.muscle.findMany({ select: { id: true, slug: true } }),
  ]);
  const movementMap = new Map(movs.map((m) => [m.slug, m.id]));
  const muscleMap = new Map(muscs.map((m) => [m.slug, m.id]));
  const validRole = new Set<string>(["primary", "secondary", "stabilizer", "synergist", "lengthening", "common_association"]);

  let created = 0, skippedLinks = 0;
  for (const rec of records) {
    const exercise = await prisma.exercise.upsert({
      where: { slug: rec.slug },
      update: {
        name: rec.name, description: rec.description,
        dosing: rec.dosing, emgNotes: rec.emgNotes, evidenceLevel: rec.evidenceLevel,
        difficulty: rec.difficulty, bodyPosition: rec.bodyPosition, equipment: rec.equipment ?? [],
        provenance: "claude-researched", notes: RESEARCH_NOTE,
      },
      create: {
        slug: rec.slug, name: rec.name, description: rec.description, status: "draft",
        confidence: 0.5, provenance: "claude-researched", notes: RESEARCH_NOTE,
        dosing: rec.dosing, emgNotes: rec.emgNotes, evidenceLevel: rec.evidenceLevel,
        difficulty: rec.difficulty, bodyPosition: rec.bodyPosition, equipment: rec.equipment ?? [],
      },
    });

    for (const ms of rec.movementSlugs ?? []) {
      const movementId = movementMap.get(ms);
      if (!movementId) { skippedLinks++; continue; }
      await prisma.exerciseMovement.upsert({
        where: { exerciseId_movementId: { exerciseId: exercise.id, movementId } },
        update: {}, create: { exerciseId: exercise.id, movementId },
      });
    }

    for (const mr of rec.muscleRoles ?? []) {
      const muscleId = muscleMap.get(mr.muscleSlug);
      if (!muscleId || !validRole.has(mr.role)) { skippedLinks++; continue; }
      await prisma.exerciseMuscle.upsert({
        where: { exerciseId_muscleId: { exerciseId: exercise.id, muscleId } },
        update: { role: mr.role as MuscleRole, notes: mr.notes },
        create: { exerciseId: exercise.id, muscleId, role: mr.role as MuscleRole, notes: mr.notes },
      });
    }

    if (rec.cues?.length) {
      await prisma.cue.deleteMany({ where: { exerciseId: exercise.id } });
      for (let i = 0; i < rec.cues.length; i++) {
        await prisma.cue.create({ data: { text: rec.cues[i].text, cueType: rec.cues[i].cueType ?? "verbal", order: i, exerciseId: exercise.id } });
      }
    }
    if (rec.regressions?.length) {
      await prisma.regression.deleteMany({ where: { exerciseId: exercise.id } });
      for (let i = 0; i < rec.regressions.length; i++) {
        await prisma.regression.create({ data: { name: rec.regressions[i].name, description: rec.regressions[i].description, order: i, exerciseId: exercise.id } });
      }
    }
    if (rec.progressions?.length) {
      await prisma.progression.deleteMany({ where: { exerciseId: exercise.id } });
      for (let i = 0; i < rec.progressions.length; i++) {
        await prisma.progression.create({ data: { name: rec.progressions[i].name, description: rec.progressions[i].description, order: i, exerciseId: exercise.id } });
      }
    }
    created++;
  }

  logCount("common exercises seeded", created);
  if (skippedLinks) console.log(`    (skipped ${skippedLinks} links with unknown slug/role)`);
}
