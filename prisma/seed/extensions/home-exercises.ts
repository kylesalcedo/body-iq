import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { prisma, logSection, logCount } from "../client";
import { MuscleRole } from "@prisma/client";

/**
 * Home / bodyweight exercise expansion — exercises doable with nothing or common
 * household items (wall, doorway, desk, chair, towel, stairs). Each was
 * researched against the real slug roster and carries a clinical `rationale`
 * (why it belongs in a home routine) plus a PT-panel verification of muscle
 * roles and rationale honesty.
 *
 * Imports as provenance "claude-researched", status draft; the scorer and the
 * validation queue gate them. Data in the sibling JSON so it is reproducible.
 */

type Rec = {
  slug: string; name: string; description: string; rationale?: string;
  dosing?: string; emgNotes?: string; evidenceLevel?: string;
  difficulty?: string; bodyPosition?: string; equipment?: string[];
  movementSlugs: string[];
  muscleRoles: { muscleSlug: string; role: string; notes?: string }[];
  cues?: { text: string; cueType?: string }[];
  regressions?: { name: string; description: string }[];
  progressions?: { name: string; description: string }[];
  rationaleVerified?: boolean;
};

const FILE = join(__dirname, "home-exercises-2026-07.json");
const NOTE = "claude-researched 2026-07 (home/bodyweight), panel-verified muscle roles + rationale. Sources not yet linked.";

export async function seedHomeExercisesExtension() {
  logSection("Home / bodyweight exercises (claude-researched)");
  if (!existsSync(FILE)) { console.log("    (no home-exercises JSON yet — skipping)"); return; }

  const records: Rec[] = JSON.parse(readFileSync(FILE, "utf8"));
  const [movs, muscs] = await Promise.all([
    prisma.movement.findMany({ select: { id: true, slug: true } }),
    prisma.muscle.findMany({ select: { id: true, slug: true } }),
  ]);
  const movementMap = new Map(movs.map((m) => [m.slug, m.id]));
  const muscleMap = new Map(muscs.map((m) => [m.slug, m.id]));
  const validRole = new Set(["primary", "secondary", "stabilizer", "synergist", "lengthening", "common_association"]);

  let created = 0, skipped = 0;
  for (const rec of records) {
    const ex = await prisma.exercise.upsert({
      where: { slug: rec.slug },
      update: {
        name: rec.name, description: rec.description, rationale: rec.rationale,
        dosing: rec.dosing, emgNotes: rec.emgNotes, evidenceLevel: rec.evidenceLevel,
        difficulty: rec.difficulty, bodyPosition: rec.bodyPosition, equipment: rec.equipment ?? [],
        provenance: "claude-researched", notes: NOTE,
      },
      create: {
        slug: rec.slug, name: rec.name, description: rec.description, rationale: rec.rationale, status: "draft",
        confidence: 0.55, provenance: "claude-researched", notes: NOTE,
        dosing: rec.dosing, emgNotes: rec.emgNotes, evidenceLevel: rec.evidenceLevel,
        difficulty: rec.difficulty, bodyPosition: rec.bodyPosition, equipment: rec.equipment ?? [],
      },
    });

    // Reconcile muscles to the verified set (delete extras, upsert verified)
    const verifiedSlugs = new Set((rec.muscleRoles || []).filter((m) => muscleMap.has(m.muscleSlug) && validRole.has(m.role)).map((m) => m.muscleSlug));
    const existing = await prisma.exerciseMuscle.findMany({ where: { exerciseId: ex.id }, select: { id: true, muscle: { select: { slug: true } } } });
    for (const link of existing) if (!verifiedSlugs.has(link.muscle.slug)) await prisma.exerciseMuscle.delete({ where: { id: link.id } });
    for (const mr of rec.muscleRoles ?? []) {
      const muscleId = muscleMap.get(mr.muscleSlug);
      if (!muscleId || !validRole.has(mr.role)) { skipped++; continue; }
      await prisma.exerciseMuscle.upsert({
        where: { exerciseId_muscleId: { exerciseId: ex.id, muscleId } },
        update: { role: mr.role as MuscleRole, notes: mr.notes },
        create: { exerciseId: ex.id, muscleId, role: mr.role as MuscleRole, notes: mr.notes },
      });
    }

    for (const ms of rec.movementSlugs ?? []) {
      const movementId = movementMap.get(ms);
      if (!movementId) { skipped++; continue; }
      await prisma.exerciseMovement.upsert({ where: { exerciseId_movementId: { exerciseId: ex.id, movementId } }, update: {}, create: { exerciseId: ex.id, movementId } });
    }

    if (rec.cues?.length) {
      await prisma.cue.deleteMany({ where: { exerciseId: ex.id } });
      for (let i = 0; i < rec.cues.length; i++) await prisma.cue.create({ data: { text: rec.cues[i].text, cueType: rec.cues[i].cueType ?? "verbal", order: i, exerciseId: ex.id } });
    }
    if (rec.regressions?.length) {
      await prisma.regression.deleteMany({ where: { exerciseId: ex.id } });
      for (let i = 0; i < rec.regressions.length; i++) await prisma.regression.create({ data: { name: rec.regressions[i].name, description: rec.regressions[i].description, order: i, exerciseId: ex.id } });
    }
    if (rec.progressions?.length) {
      await prisma.progression.deleteMany({ where: { exerciseId: ex.id } });
      for (let i = 0; i < rec.progressions.length; i++) await prisma.progression.create({ data: { name: rec.progressions[i].name, description: rec.progressions[i].description, order: i, exerciseId: ex.id } });
    }
    created++;
  }

  logCount("home exercises seeded", created);
  if (skipped) console.log(`    (skipped ${skipped} links with unknown slug/role)`);
}
