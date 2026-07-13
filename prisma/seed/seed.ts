import { prisma } from "./client";
import { seedRegions } from "./regions";
import { seedJoints } from "./joints";
import { seedMovements } from "./movements";
import { seedMuscles, seedMovementMuscleLinks } from "./muscles";
import { seedFunctionalTasks } from "./functional-tasks";
import { seedExercises } from "./exercises";
import { seedSources } from "./sources";
import { seedGaitAndScapularExtension } from "./extensions/gait-scapular";
import { seedHandIntrinsicsExtension } from "./extensions/hand-intrinsics";
import { seedCervicalEvidenceExtension } from "./extensions/cervical-evidence";
import { seedLowEvidenceUpgradesExtension } from "./extensions/low-evidence-upgrades";
import { seedThinModalitiesExtension } from "./extensions/thin-modalities";
import { seedUseCaseEssentialsExtension } from "./extensions/use-case-essentials";
import { seedOccupationEssentialsExtension } from "./extensions/occupation-essentials";
import { seedPrimitivesAndPfmExtension } from "./extensions/primitives-and-pfm";
import { seedCueRewritesExtension } from "./extensions/cue-rewrites";
import { seedHandGripFixesExtension } from "./extensions/hand-grip-fixes";
import { seedSnomedCodesExtension } from "./extensions/snomed-codes";
import { seedCommonExercisesExtension } from "./extensions/common-exercises";
import { seedHomeExercisesExtension } from "./extensions/home-exercises";
import { seedCategoriesPositionsExtension } from "./extensions/categories-positions";
import { seedBackfillLinksExtension } from "./extensions/backfill-links";
import { seedNormalizeBodyPositionExtension } from "./extensions/normalize-body-position";
import { seedMovementRomExtension } from "./extensions/movement-rom";

async function main() {
  console.log("🦴 Body IQ — Seeding knowledge graph...\n");

  const start = Date.now();

  // Anatomy layer (order matters — FK dependencies)
  await seedRegions();
  await seedJoints();
  await seedMovements();
  await seedMuscles();
  await seedMovementMuscleLinks();

  // Programming layer
  await seedFunctionalTasks();
  await seedExercises();

  // Evidence layer
  await seedSources();

  // Extensions (additive — new regions, movements, gait phases, exercises)
  await seedGaitAndScapularExtension();
  await seedHandIntrinsicsExtension();
  await seedCervicalEvidenceExtension();
  await seedLowEvidenceUpgradesExtension();
  await seedThinModalitiesExtension();
  await seedUseCaseEssentialsExtension();
  await seedOccupationEssentialsExtension();
  await seedPrimitivesAndPfmExtension();

  // Cue rewrites run LAST so they override cues created by any earlier step.
  await seedCueRewritesExtension();
  await seedHandGripFixesExtension();
  await seedSnomedCodesExtension();
  await seedCommonExercisesExtension();
  await seedHomeExercisesExtension();
  await seedCategoriesPositionsExtension();
  await seedBackfillLinksExtension();
  await seedNormalizeBodyPositionExtension();
  await seedMovementRomExtension();

  // Summary
  const elapsed = ((Date.now() - start) / 1000).toFixed(1);
  console.log("\n─── Seed Summary ───────────────────────────────────");

  const counts = {
    regions: await prisma.region.count(),
    joints: await prisma.joint.count(),
    movements: await prisma.movement.count(),
    muscles: await prisma.muscle.count(),
    movementMuscleLinks: await prisma.movementMuscle.count(),
    functionalTasks: await prisma.functionalTask.count(),
    exercises: await prisma.exercise.count(),
    exerciseMuscleLinks: await prisma.exerciseMuscle.count(),
    exerciseMovementLinks: await prisma.exerciseMovement.count(),
    cues: await prisma.cue.count(),
    regressions: await prisma.regression.count(),
    progressions: await prisma.progression.count(),
    sources: await prisma.researchSource.count(),
    sourceLinks: await prisma.sourceOnEntity.count(),
  };

  for (const [key, count] of Object.entries(counts)) {
    console.log(`  ${key.padEnd(25)} ${count}`);
  }

  console.log(`\n  ✅ Seed completed in ${elapsed}s\n`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error("\n❌ Seed failed:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
