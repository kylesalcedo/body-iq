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
