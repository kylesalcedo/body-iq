import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { prisma, logSection, logCount } from "../client";
import { MuscleRole } from "@prisma/client";

/**
 * Thin-region exercises — additions filling movement-coverage gaps in the
 * underrepresented regions (pelvis, cervical, wrist): pelvic tilts, cervical
 * protraction (previously 0 exercises), upper-cervical rotation/extension, and
 * wrist radial/ulnar deviation. Researched against the roster with a rationale
 * and PT-panel muscle-role verification. Data in the sibling JSON.
 */

const FILE = join(__dirname, "region-exercises-2026-07.json");
const NOTE = "claude-researched 2026-07 (thin-region coverage), panel-verified muscle roles. Sources not yet linked.";

export async function seedRegionExercisesExtension() {
  logSection("Thin-region exercises (pelvis/cervical/wrist)");
  if (!existsSync(FILE)) { console.log("    (no region-exercises JSON — skipping)"); return; }

  const records: any[] = JSON.parse(readFileSync(FILE, "utf8"));
  const [movs, muscs] = await Promise.all([
    prisma.movement.findMany({ select: { id: true, slug: true } }),
    prisma.muscle.findMany({ select: { id: true, slug: true } }),
  ]);
  const movementMap = new Map(movs.map((m) => [m.slug, m.id]));
  const muscleMap = new Map(muscs.map((m) => [m.slug, m.id]));
  const validRole = new Set(["primary", "secondary", "stabilizer", "synergist", "lengthening", "common_association"]);

  let created = 0;
  for (const rec of records) {
    const ex = await prisma.exercise.upsert({
      where: { slug: rec.slug },
      update: {
        name: rec.name, description: rec.description, rationale: rec.rationale, category: rec.category,
        dosing: rec.dosing, emgNotes: rec.emgNotes, evidenceLevel: rec.evidenceLevel,
        difficulty: rec.difficulty, bodyPosition: rec.bodyPosition, equipment: rec.equipment ?? [],
        startPosition: rec.startPosition, endPosition: rec.endPosition, rom: rec.rom,
        provenance: "claude-researched", notes: NOTE,
      },
      create: {
        slug: rec.slug, name: rec.name, description: rec.description, rationale: rec.rationale, category: rec.category,
        status: "draft", confidence: 0.55, provenance: "claude-researched", notes: NOTE,
        dosing: rec.dosing, emgNotes: rec.emgNotes, evidenceLevel: rec.evidenceLevel,
        difficulty: rec.difficulty, bodyPosition: rec.bodyPosition, equipment: rec.equipment ?? [],
        startPosition: rec.startPosition, endPosition: rec.endPosition, rom: rec.rom,
      },
    });
    for (const mr of rec.muscleRoles ?? []) {
      const muscleId = muscleMap.get(mr.muscleSlug);
      if (!muscleId || !validRole.has(mr.role)) continue;
      await prisma.exerciseMuscle.upsert({
        where: { exerciseId_muscleId: { exerciseId: ex.id, muscleId } },
        update: { role: mr.role as MuscleRole, notes: mr.notes },
        create: { exerciseId: ex.id, muscleId, role: mr.role as MuscleRole, notes: mr.notes },
      });
    }
    for (const ms of rec.movementSlugs ?? []) {
      const movementId = movementMap.get(ms);
      if (!movementId) continue;
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
  logCount("thin-region exercises seeded", created);
}
